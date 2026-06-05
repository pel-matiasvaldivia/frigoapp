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
      const pedRes = await pedidosAPI.list({ estado: 'Listo para despacho' });
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
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Facturación</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Gestión de comprobantes fiscales y remitos de mercadería.</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center space-x-2 px-5 py-3 bg-white border border-slate-200 hover:border-brand-200 rounded-2xl text-slate-600 hover:text-brand-600 font-bold text-xs transition-all shadow-sm uppercase tracking-widest"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sincronizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prepared Orders Waiting for Billing */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 h-fit shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pendientes</h2>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              </div>
            ) : pedidosPendientes.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-300 font-medium italic">No hay pedidos listos</p>
              </div>
            ) : (
              pedidosPendientes.map((ped) => (
                <div key={ped.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-5 hover:border-brand-200 transition-all shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pedido #{ped.id}</span>
                    <span className="text-[10px] font-bold text-brand-600 bg-white px-2 py-0.5 rounded-full border border-brand-100">
                      ${ped.total.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase leading-snug tracking-tight">
                      {ped.cliente?.razon_social}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">CUIT: <span className="text-slate-600">{ped.cliente?.cuit || 'Sin CUIT'}</span></p>
                  </div>
                  <button
                    onClick={() => handleOpenGenerateModal(ped)}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-brand-900/20"
                  >
                    Generar Venta
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Comprobantes Ledger */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historial</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6 text-left">Fecha</th>
                  <th className="py-4 px-6 text-left">Número</th>
                  <th className="py-4 px-6 text-left">Cliente</th>
                  <th className="py-4 px-6 text-right">Monto</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-center">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    </td>
                  </tr>
                ) :
 comprobantes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">Ningún comprobante emitido aún</td>
                  </tr>
                ) : (
                  comprobantes.map((comp) => (
                    <tr key={comp.id} className="text-slate-600 hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                      <td className="py-5 px-6 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {new Date(comp.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-5 px-6">
                        <span className="font-bold text-xs text-brand-600 uppercase tracking-tight">
                          {comp.numero}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="font-bold block text-slate-900 text-sm uppercase leading-tight">{comp.pedido?.cliente?.razon_social}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 inline-block">RUTA: {comp.pedido?.cliente?.ruta?.nombre || 'General'}</span>
                      </td>
                      <td className="py-5 px-6 text-right font-bold text-slate-900 tabular-nums">
                        ${comp.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-widest ${
                          comp.estado === 'Emitido' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          comp.estado === 'Entregado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {comp.estado}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-center">
                        {comp.pdf_path ? (
                          <a
                            href={comp.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex p-2 bg-slate-50 text-slate-400 hover:bg-brand-50 hover:text-brand-600 rounded-xl transition-all border border-slate-100"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Generando</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Emitir Comprobante</h3>
              <button 
                onClick={() => { setSelectedPedido(null); setGenerateModalOpen(false); }}
                className="text-slate-300 hover:text-brand-600 transition-colors"
              >
                <RefreshCw className="h-5 w-5 hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-[11px] bg-slate-50 p-6 border border-slate-100 rounded-[1.5rem] space-y-3 shadow-inner font-bold uppercase tracking-tight">
                <p className="flex justify-between items-center"><span className="text-slate-400">Cliente:</span> <span className="text-slate-900 font-black">{selectedPedido.cliente?.razon_social}</span></p>
                <p className="flex justify-between items-center"><span className="text-slate-400">CUIT:</span> <span className="text-slate-900">{selectedPedido.cliente?.cuit || 'N/A'}</span></p>
                <div className="h-px bg-slate-200 my-2" />
                <p className="flex justify-between items-center"><span className="text-slate-400">Peso Total:</span> <span className="text-brand-600 font-extrabold">{selectedPedido.items.reduce((a: any, b: any) => a + b.peso_real_kg, 0).toFixed(2)} KG</span></p>
                <p className="flex justify-between items-center"><span className="text-slate-400">Monto Final:</span> <span className="text-brand-700 font-black text-sm">${selectedPedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Seleccionar Documento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setComprobanteTipo('FACTURA')}
                    className={`py-4 border rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${
                      comprobanteTipo === 'FACTURA' 
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Factura AFIP
                  </button>
                  <button
                    type="button"
                    onClick={() => setComprobanteTipo('REMITO')}
                    className={`py-4 border rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${
                      comprobanteTipo === 'REMITO' 
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-sm' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Remito Interno
                  </button>
                </div>
              </div>

              <div className="p-4 bg-brand-50 border border-brand-100 text-brand-700 rounded-2xl text-[10px] font-black uppercase tracking-widest leading-relaxed flex items-start space-x-3 shadow-inner">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-brand-600" />
                <span>
                  Al emitir, el pedido pasará a HOJA DE RUTA para el despacho inmediato.
                </span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedPedido(null); setGenerateModalOpen(false); }}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black text-xs rounded-2xl transition-all uppercase tracking-widest"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGenerateComprobante}
                className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-2xl shadow-xl shadow-brand-900/20 transition-all uppercase tracking-widest"
              >
                Emitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
