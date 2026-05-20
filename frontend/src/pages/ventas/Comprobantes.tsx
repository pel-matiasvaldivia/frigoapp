import React, { useEffect, useState } from 'react';
import { comprobantesAPI, pedidosAPI } from '../../services/api';
import { 
  FileText, 
  Download, 
  Plus, 
  Check, 
  RefreshCw, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';

export const Comprobantes: React.FC = () => {
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  const [pedidosPendientes, setPedidosPendientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
  const [comprobanteTipo, setComprobanteTipo] = useState<'FACTURA' | 'REMITO'>('REMITO');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const compRes = await comprobantesAPI.list();
      setComprobantes(compRes);
      
      // Get orders that are prepared and ready for billing
      const pedRes = await pedidosAPI.list({ estado: 'Preparado/Listo para despacho' });
      setPedidosPendientes(pedRes);
    } catch (err) {
      console.error("Error loading billing documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGenerateModal = (pedido: any) => {
    setSelectedPedido(pedido);
    // If client has CUIT, default to FACTURA, else default to REMITO
    if (pedido.cliente?.cuit) {
      setComprobanteTipo('FACTURA');
    } else {
      setComprobanteTipo('REMITO');
    }
    setGenerateModalOpen(true);
  };

  const handleGenerateComprobante = async () => {
    if (!selectedPedido) return;
    try {
      await comprobantesAPI.create({
        pedido_id: selectedPedido.id,
        tipo: comprobanteTipo
      });
      alert(`¡Documento ${comprobanteTipo} generado exitosamente!`);
      setGenerateModalOpen(false);
      setSelectedPedido(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al emitir el comprobante");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Facturación y Remisiones</h1>
          <p className="text-slate-400 text-sm mt-1">Emisión de comprobantes fiscales (Factura A/B) o internos (Remito de reparto) sobre kg reales.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white transition"
          title="Sincronizar"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prepared Orders Waiting for Billing */}
        <div className="lg:col-span-1 border border-slate-800 rounded-2xl bg-slate-900/40 p-5 space-y-4 h-fit">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <FileCheck2 className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white">Pendientes de Facturación</h2>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-500 mx-auto"></div>
            ) : pedidosPendientes.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6">No hay pedidos preparados esperando comprobante</p>
            ) : (
              pedidosPendientes.map((ped) => (
                <div key={ped.id} className="p-4 border border-slate-850 bg-slate-950/40 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Pedido #{ped.id}</span>
                    <span className="font-bold text-emerald-400">${ped.total.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-350">{ped.cliente?.razon_social}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5">CUIT: {ped.cliente?.cuit || 'Sin registrar'}</p>
                  </div>
                  <button
                    onClick={() => handleOpenGenerateModal(ped)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-all"
                  >
                    Emitir Factura / Remito
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Comprobantes Ledger */}
        <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <FileText className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white">Historial de Comprobantes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Número</th>
                  <th className="py-3">Cliente</th>
                  <th className="py-3 text-right">Monto</th>
                  <th className="py-3 text-center">Estado</th>
                  <th className="py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : comprobantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">Ningún comprobante emitido aún</td>
                  </tr>
                ) : (
                  comprobantes.map((comp) => (
                    <tr key={comp.id} className="text-slate-350 hover:bg-slate-900/30">
                      <td className="py-3.5 text-xs">
                        {new Date(comp.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-3.5 font-mono text-xs font-bold text-white">
                        {comp.numero}
                      </td>
                      <td className="py-3.5 text-xs">
                        <span className="font-semibold block text-slate-200">{comp.pedido?.cliente?.razon_social}</span>
                        <span className="text-[10px] text-slate-450">Ruta: {comp.pedido?.cliente?.ruta?.nombre || 'Sin asignación'}</span>
                      </td>
                      <td className="py-3.5 text-right font-bold text-emerald-450">
                        ${comp.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          comp.estado === 'Emitido' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                          comp.estado === 'Entregado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {comp.estado}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        {comp.pdf_path ? (
                          <a
                            href={comp.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1.5 bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-semibold transition"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Generando...</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Document Modal Dialog */}
      {generateModalOpen && selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Emitir Comprobante Comercial</h3>
              <button 
                onClick={() => { setSelectedPedido(null); setGenerateModalOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-xs bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
                <p><span className="text-slate-450">Cliente:</span> <strong className="text-white">{selectedPedido.cliente?.razon_social}</strong></p>
                <p><span className="text-slate-450">CUIT:</span> <strong className="text-white">{selectedPedido.cliente?.cuit || 'No registrado'}</strong></p>
                <p><span className="text-slate-450">Kilogramos preparados:</span> <strong className="text-rose-400">{selectedPedido.items.reduce((a: any, b: any) => a + b.peso_real_kg, 0).toFixed(2)} kg</strong></p>
                <p><span className="text-slate-450">Monto total final:</span> <strong className="text-emerald-400">${selectedPedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tipo de Comprobante
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setComprobanteTipo('FACTURA')}
                    className={`py-3 border rounded-xl font-bold text-xs transition ${
                      comprobanteTipo === 'FACTURA' 
                        ? 'border-rose-500 bg-rose-950/10 text-rose-400' 
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    Factura AFIP
                  </button>
                  <button
                    type="button"
                    onClick={() => setComprobanteTipo('REMITO')}
                    className={`py-3 border rounded-xl font-bold text-xs transition ${
                      comprobanteTipo === 'REMITO' 
                        ? 'border-rose-500 bg-rose-950/10 text-rose-400' 
                        : 'border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    Remito de Reparto
                  </button>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Al emitir el comprobante, el pedido quedará listo para despacho y se asignará automáticamente a la hoja de ruta del repartidor.
                </span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedPedido(null); setGenerateModalOpen(false); }}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateComprobante}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirmar Emisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
