import React, { useEffect, useState } from 'react';
import { pedidosAPI } from '../../services/api';
import { ShoppingBag, Eye, Package, Calendar, FileText } from 'lucide-react';

export const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<any | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await pedidosAPI.list();
        setPedidos(res);
      } catch (err) {
        console.error("Error loading client orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  const estadoStyle = (estado: string) => {
    if (estado === 'Entregado') return { dot: 'bg-emerald-500', badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (estado === 'En reparto' || estado === 'Listo para despacho') return { dot: 'bg-sky-500', badge: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
    if (estado === 'En preparación') return { dot: 'bg-indigo-500', badge: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    if (estado === 'Entrega parcial') return { dot: 'bg-orange-500', badge: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { dot: 'bg-amber-500', badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-white">Mis Pedidos</h1>
        <p className="text-slate-400 text-xs mt-0.5">Seguimiento en tiempo real de sus órdenes de compra.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <ShoppingBag className="h-12 w-12 text-slate-700 mx-auto" />
          <p className="text-slate-500 text-sm font-semibold">No tiene pedidos registrados todavía</p>
          <p className="text-slate-600 text-xs">Contáctenos por WhatsApp para realizar su pedido</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const st = estadoStyle(pedido.estado);
            return (
              <div
                key={pedido.id}
                className="border border-slate-800 rounded-2xl bg-slate-900/40 p-4 space-y-3 active:scale-[0.99] transition-transform"
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${st.dot} animate-pulse`}></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.badge}`}>
                        {pedido.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(pedido.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Pedido #{pedido.id}</p>
                    <p className="text-lg font-extrabold text-white mt-0.5">
                      ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Items summary */}
                <div className="bg-slate-950/40 rounded-xl p-3 space-y-1.5">
                  {pedido.items?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-slate-300">{item.producto.descripcion}</span>
                      <span className="text-slate-400 font-mono">
                        {item.peso_real_kg > 0 ? `${item.peso_real_kg} kg` : `~${item.peso_estimado_kg} kg est.`}
                      </span>
                    </div>
                  ))}
                  {(pedido.items?.length || 0) > 3 && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      + {pedido.items.length - 3} productos más
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-1">
                  {pedido.items?.some((i: any) => i.peso_real_kg > 0) && (
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center">
                      <Package className="h-3.5 w-3.5 mr-1" />
                      Kg reales cargados
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedPedido(pedido)}
                    className="ml-auto flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver detalle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Detalle Pedido #{selectedPedido.id}</h3>
                <p className="text-xs text-rose-500 font-semibold mt-0.5">{selectedPedido.estado}</p>
              </div>
              <button onClick={() => setSelectedPedido(null)} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedPedido.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl text-xs border border-slate-800/60">
                  <div>
                    <p className="font-semibold text-white">{item.producto.descripcion}</p>
                    <p className="text-slate-400 mt-0.5 font-mono">
                      ${item.precio_unitario}/kg ×{' '}
                      <span className="text-rose-400 font-bold">
                        {item.peso_real_kg > 0 ? `${item.peso_real_kg} kg` : `~${item.peso_estimado_kg} kg`}
                      </span>
                    </p>
                  </div>
                  <p className="font-bold text-slate-200">${item.subtotal?.toLocaleString('es-AR')}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl">
              <span className="font-bold text-slate-300 text-sm">Total</span>
              <span className="font-extrabold text-xl text-white">${selectedPedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>

            {selectedPedido.observaciones && (
              <div className="text-xs text-slate-400 p-3 bg-slate-950/30 rounded-xl border border-slate-800/60">
                <span className="font-bold text-slate-300 block mb-1">Observaciones:</span>
                {selectedPedido.observaciones}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
