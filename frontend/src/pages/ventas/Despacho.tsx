import React, { useEffect, useState, useRef } from 'react';
import { despachoAPI } from '../../services/api';
import { 
  Truck, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Package,
  FileText,
  PenLine
} from 'lucide-react';

export const Despacho: React.FC = () => {
  const [hojaRuta, setHojaRuta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Delivery modal
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'Entregado' | 'Entrega parcial' | 'No entregado'>('Entregado');
  const [deliveryObs, setDeliveryObs] = useState('');
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchHojaRuta();
  }, []);

  const fetchHojaRuta = async () => {
    setLoading(true);
    try {
      const res = await despachoAPI.getHojaRuta();
      setHojaRuta(res);
    } catch (err) {
      console.error("Error loading hoja de ruta:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelivery = (item: any) => {
    setSelectedItem(item);
    setDeliveryStatus('Entregado');
    setDeliveryObs('');
    setFirmaBase64(null);
    setDeliveryModalOpen(true);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedItem?.comprobante?.id) return;
    setSubmitting(true);
    try {
      await despachoAPI.entregar(selectedItem.comprobante.id, {
        estado_pedido: deliveryStatus,
        observaciones: deliveryObs,
        firma_base64: firmaBase64 || null
      });
      alert(`¡Entrega registrada como: ${deliveryStatus}!`);
      setDeliveryModalOpen(false);
      setSelectedItem(null);
      fetchHojaRuta();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al registrar entrega");
    } finally {
      setSubmitting(false);
    }
  };

  // Canvas signature events
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e11d48';
    ctx.lineCap = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(false);
    setFirmaBase64(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaBase64(null);
  };

  const statusColor = (estado: string) => {
    if (estado === 'Entregado') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (estado === 'En reparto' || estado === 'Listo para despacho') return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    if (estado === 'Entrega parcial') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (estado === 'No entregado') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center">
          <Truck className="h-8 w-8 mr-3 text-rose-500" />
          Hoja de Ruta
        </h1>
        <p className="text-slate-400 text-sm mt-1">Panel del repartidor para gestionar entregas, registrar firma del cliente y actualizar estado.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
        </div>
      ) : hojaRuta.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/20">
          <Truck className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Sin entregas asignadas</h3>
          <p className="text-xs text-slate-500 mt-1">No hay comprobantes listos para despacho en tu ruta hoy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {hojaRuta.map((item) => (
            <div key={item.id} className="border border-slate-800 rounded-2xl bg-slate-900/40 p-5 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{item.cliente_razon_social}</h3>
                  <div className="flex items-center text-xs text-slate-400 mt-1 space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>{item.direccion || 'Sin dirección'}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor(item.estado)}`}>
                  {item.estado}
                </span>
              </div>

              {/* Details */}
              <div className="flex justify-between text-xs bg-slate-950/40 p-3 rounded-xl">
                <div>
                  <p className="text-slate-450 text-[10px] mb-0.5">Ruta</p>
                  <p className="font-bold text-slate-200">{item.ruta_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-450 text-[10px] mb-0.5">Monto</p>
                  <p className="font-bold text-emerald-400">${item.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Comprobante info */}
              {item.comprobante && (
                <div className="text-xs border border-slate-850 bg-slate-950/30 px-3 py-2 rounded-lg flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono text-slate-300">{item.comprobante.tipo} {item.comprobante.numero}</span>
                  </div>
                  {item.comprobante.pdf_path && (
                    <a href={item.comprobante.pdf_path} target="_blank" rel="noopener noreferrer"
                      className="text-rose-400 hover:text-rose-300 font-semibold text-[10px]">
                      Ver PDF
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/${item.telefono_whatsapp?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-xs font-semibold rounded-xl border border-emerald-700/30 transition"
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                  WhatsApp
                </a>
                {item.estado !== 'Entregado' && item.comprobante && (
                  <button
                    onClick={() => handleOpenDelivery(item)}
                    className="flex items-center justify-center py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition"
                  >
                    <PenLine className="h-3.5 w-3.5 mr-1.5" />
                    Confirmar Entrega
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {deliveryModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Confirmar Entrega</h3>
              <p className="text-xs text-rose-500 font-semibold mt-0.5">{selectedItem.cliente_razon_social}</p>
            </div>

            {/* Status Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Estado de la Entrega</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Entregado', 'Entrega parcial', 'No entregado'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDeliveryStatus(st)}
                    className={`py-2 text-[10px] font-bold rounded-xl border transition ${
                      deliveryStatus === st
                        ? st === 'Entregado' ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400'
                          : st === 'Entrega parcial' ? 'border-orange-500 bg-orange-950/20 text-orange-400'
                          : 'border-rose-500 bg-rose-950/20 text-rose-400'
                        : 'border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Observaciones del chofer</label>
              <textarea
                value={deliveryObs}
                onChange={(e) => setDeliveryObs(e.target.value)}
                rows={2}
                placeholder="Novedades de la entrega..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none text-slate-300"
              />
            </div>

            {/* Signature Canvas */}
            {deliveryStatus !== 'No entregado' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Firma del Receptor (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] text-slate-500 hover:text-rose-400"
                  >
                    Limpiar
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={120}
                  className="w-full h-28 bg-slate-950 border border-slate-700 rounded-xl touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
                <p className="text-[10px] text-slate-500 mt-1 text-center">Dibuje la firma en el recuadro de arriba</p>
              </div>
            )}

            <div className="flex space-x-3 pt-1">
              <button
                onClick={() => { setDeliveryModalOpen(false); setSelectedItem(null); }}
                className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={submitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
