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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 flex items-center uppercase tracking-tighter">
          <Truck className="h-10 w-10 mr-4 text-brand-600" />
          Hoja de Ruta
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Panel del repartidor para gestionar entregas, registrar firmas y actualizar estados.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
        </div>
      ) : hojaRuta.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-[2rem] p-16 text-center bg-slate-50/50">
          <Truck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Sin entregas</h3>
          <p className="text-sm text-slate-400 mt-2 font-medium">No hay comprobantes listos para despechar hoy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {hojaRuta.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-3xl bg-white p-6 space-y-5 shadow-sm hover:shadow-md transition-all">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-tight">{item.cliente_razon_social}</h3>
                  <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    <MapPin className="h-3 w-3 text-brand-600 mr-1.5" />
                    <span className="truncate max-w-[200px]">{item.direccion || 'Sin dirección'}</span>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${
                  item.estado === 'Entregado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  item.estado === 'En reparto' || item.estado === 'Listo para despacho' ? 'bg-brand-50 text-brand-700 border-brand-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {item.estado}
                </span>
              </div>

              {/* Details */}
              <div className="flex justify-between text-[11px] bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Ruta</p>
                  <p className="font-black text-slate-800 uppercase leading-none">{item.ruta_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Total</p>
                  <p className="font-black text-brand-700 text-base leading-none">${item.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Comprobante info */}
              {item.comprobante && (
                <div className="text-[10px] border border-slate-100 bg-white px-4 py-3 rounded-2xl flex justify-between items-center shadow-inner">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="font-black text-slate-600 uppercase tracking-tight">{item.comprobante.tipo} #{item.comprobante.numero}</span>
                  </div>
                  {item.comprobante.pdf_path && (
                    <a href={item.comprobante.pdf_path} target="_blank" rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700 font-black uppercase tracking-widest text-[9px] bg-brand-50 px-2 py-1 rounded border border-brand-100">
                      Ver PDF
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={`https://wa.me/${item.telefono_whatsapp?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black rounded-2xl border border-emerald-100 transition-all uppercase tracking-widest shadow-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  WA
                </a>
                {item.estado !== 'Entregado' && item.comprobante && (
                  <button
                    onClick={() => handleOpenDelivery(item)}
                    className="flex items-center justify-center py-3 bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-brand-900/10"
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    ENTREGAR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delivery Confirmation Modal */}
      {deliveryModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Registrar Entrega</h3>
              <p className="text-sm text-brand-600 font-black mt-1 uppercase tracking-tight">{selectedItem.cliente_razon_social}</p>
            </div>

            {/* Status Picker */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resultado</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Entregado', 'Entrega parcial', 'No entregado'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDeliveryStatus(st)}
                    className={`py-3 text-[9px] font-black rounded-2xl border transition-all uppercase tracking-tighter ${
                      deliveryStatus === st
                        ? st === 'Entregado' ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                          : st === 'Entrega parcial' ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-sm'
                          : 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm'
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-black">Novedades / Comentarios</label>
              <textarea
                value={deliveryObs}
                onChange={(e) => setDeliveryObs(e.target.value)}
                rows={2}
                placeholder="Indique si hubo algún inconveniente..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 text-slate-700 placeholder:text-slate-300"
              />
            </div>

            {/* Signature Canvas */}
            {deliveryStatus !== 'No entregado' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <PenLine className="h-3 w-3 mr-2" /> Firma del Cliente
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[9px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest"
                  >
                    Borrar
                  </button>
                </div>
                <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                  <canvas
                    ref={canvasRef}
                    width={360}
                    height={140}
                    className="w-full h-32 touch-none cursor-crosshair"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-2 text-center font-bold uppercase tracking-widest">Dibuje la firma arriba</p>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => { setDeliveryModalOpen(false); setSelectedItem(null); }}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs rounded-[1.25rem] transition-all uppercase tracking-widest"
              >
                Cerrar
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={submitting}
                className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-[1.25rem] transition-all shadow-xl shadow-brand-900/20 uppercase tracking-widest"
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
