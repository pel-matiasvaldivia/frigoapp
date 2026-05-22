import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, QrCode, CheckCircle2, XCircle, 
  RefreshCw, Smartphone, ShieldCheck, AlertCircle,
  ExternalLink, ArrowRight
} from 'lucide-react';
import { pedidosAPI } from '../../services/api';
// Assuming we'll add whatsappAPI to services/api.ts. For now we use the general api structure.
import api from '../../services/api';

export const WhatsAppAdmin: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    fetchStatus();
    fetchPendingOrders();
  }, []);

  const fetchStatus = async () => {
    try {
      // Placeholder for now
      setStatus('disconnected');
      // setQrCode('base64_demo_qr'); 
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingOrders = async () => {
    setLoadingOrders(true);
    try {
      // Filter orders by specific status we created
      const res = await api.get('/pedidos/?estado=Pendiente de Validación');
      setPendingOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">WhatsApp Business</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Automatización de pedidos mediante OpenWA e Inteligencia Artificial.</p>
        </div>
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border ${
          status === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="text-xs font-bold uppercase tracking-widest">{status === 'connected' ? 'Servicio Activo' : 'Esperando Conexión'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Management */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                <QrCode className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vincular Celular</h2>
            </div>

            {status === 'disconnected' ? (
              <div className="space-y-6">
                <div className="aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center">
                  {qrCode ? (
                    <img src={qrCode} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <Smartphone className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-xs text-slate-400 font-medium px-4">Iniciando sesión en WhatsApp Web...</p>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 text-xs text-slate-500 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>Abra WhatsApp en su teléfono</span>
                  </div>
                  <div className="flex items-start space-x-3 text-xs text-slate-500 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <span>Toque Menú o Configuración y seleccione Dispositivos vinculados</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold uppercase tracking-tight">Sesión Vinculada</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bot operando normalmente</p>
                </div>
                <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest border border-red-100 px-4 py-2 rounded-xl hover:bg-red-50 transition-all">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-4">
            <div className="flex items-center space-x-2 text-brand-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Estado del Motor AI</span>
            </div>
            <p className="text-sm font-medium leading-relaxed opacity-80">
              Utilizando <span className="text-brand-400 font-bold">GPT-4o</span> para el procesamiento de lenguaje natural. Precisión estimada: 94%.
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pedidos Detectados</h2>
              </div>
              <button 
                onClick={fetchPendingOrders}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all"
              >
                <RefreshCw className={`h-5 w-5 ${loadingOrders ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4">
              {loadingOrders ? (
                <div className="py-20 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-slate-300 font-medium italic">No hay nuevos pedidos de WhatsApp</p>
                </div>
              ) : (
                pendingOrders.map((pedido) => (
                  <div key={pedido.id} className="p-6 border border-slate-100 bg-slate-50/50 rounded-3xl hover:border-brand-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-slate-900 uppercase">{pedido.cliente?.razon_social}</span>
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(pedido.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Via WhatsApp: {pedido.cliente?.telefono_whatsapp}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-xl font-black text-brand-600 leading-none">${pedido.total.toLocaleString('es-AR')}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Monto Estimado</span>
                      </div>
                    </div>
                    
                    <div className="bg-white/80 border border-slate-100 rounded-2xl p-4 mb-4">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1.5" /> Mensaje Original
                      </p>
                      <p className="text-xs text-slate-700 italic font-medium">"{pedido.observaciones.replace('WhatsApp: ', '')}"</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1">
                        {pedido.items?.map((item: any) => (
                          <div key={item.id} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm" title={item.producto?.descripcion}>
                            {item.producto?.descripcion.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-3">
                        <button className="flex items-center space-x-2 px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest transition-all">
                          <XCircle className="h-4 w-4" />
                          <span>Descartar</span>
                        </button>
                        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-brand-900/10">
                          <span>Validar Pedido</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
