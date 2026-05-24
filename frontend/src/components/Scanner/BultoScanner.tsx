import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { preparacionAPI } from '../../services/api';

interface BultoScannerProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const BultoScanner: React.FC<BultoScannerProps> = ({ onClose, onSuccess }) => {
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'CARGA' | 'ENTREGA'>('CARGA');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        setError("No se pudo acceder a la cámara. Verifique los permisos.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (loading || scanResult) return; // Prevent multiple scans while processing

    // Expected format: "TRK-XXXXXXXX"
    if (!decodedText.startsWith("TRK-")) {
      setError("Código QR no válido para bultos");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await preparacionAPI.escanearBulto(decodedText, action);
      setScanResult({
        uuid: decodedText,
        ...res
      });
      
      // Automatic reset after 2 seconds
      setTimeout(() => {
        setScanResult(null);
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al procesar el bulto");
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error: any) => {
    // Quietly ignore failed scans
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-xl">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tighter">Escáner de Bultos</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Modo: {action}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* Action Toggle */}
        <div className="p-4 bg-white flex justify-center">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full">
            <button
              onClick={() => setAction('CARGA')}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                action === 'CARGA' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-400'
              }`}
            >
              Cargar Camión
            </button>
            <button
              onClick={() => setAction('ENTREGA')}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                action === 'ENTREGA' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'
              }`}
            >
              Entregar Bulto
            </button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          <div id="reader" className="overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 min-h-[300px]"></div>
          
          {/* Overlay Feedback */}
          {loading && (
            <div className="mt-4 p-4 bg-sky-50 text-sky-700 rounded-2xl flex items-center justify-center space-x-3 animate-pulse">
              <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold uppercase tracking-widest">Procesando...</span>
            </div>
          )}

          {scanResult && (
            <div className="mt-4 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col items-center text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">¡Bulto Procesado!</p>
              <p className="text-lg font-black text-slate-900 leading-tight">{scanResult.uuid}</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase">Estado: {scanResult.new_state}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center space-x-3 animate-in shake-1">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <p className="text-xs font-bold text-rose-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-8 pb-8 pt-2">
          <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-[0.2em] leading-relaxed">
            Apunte la cámara al código QR de la etiqueta térmica<br/>para registrar el movimiento.
          </p>
        </div>
      </div>
    </div>
  );
};
