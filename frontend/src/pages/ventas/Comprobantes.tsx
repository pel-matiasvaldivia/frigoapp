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
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Facturación</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Emisión de facturas fiscales y remitos internos sobre pesajes confirmados.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-brand-600 transition-all shadow-sm"
          title="Sincronizar"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prepared Orders Waiting for Billing */}
        <div className="lg:col-span-1 border border-slate-200 rounded-3xl bg-white p-6 space-y-6 h-fit shadow-sm">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <FileCheck2 className="h-6 w-6 text-brand-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Pendientes</h2>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-10 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
              </div>
            ) : pedidosPendientes.length === 0 ? (
              <p className="text-center text-xs text-slate-400 font-medium py-10 italic">No hay pedidos preparados</p>
            ) : (
              pedidosPendientes.map((ped) => (
                <div key={ped.id} className="p-5 border border-slate-100 bg-slate-50 rounded-[1.5rem] space-y-4 hover:border-brand-200 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Pedido #{ped.id}</span>
                    <span className="font-black text-brand-700 text-sm">${ped.total.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 uppercase leading-none">{ped.cliente?.razon_social}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">CUIT: {ped.cliente?.cuit || 'S/D'}</p>
                  </div>
                  <button
                    onClick={() => handleOpenGenerateModal(ped)}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-[10px] rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-brand-900/10"
                  >
                    Emitir Comprobante
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Existing Comprobantes Ledger */}
        <div className="lg:col-span-2 border border-slate-200 rounded-3xl bg-white p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <FileText className="h-6 w-6 text-brand-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Historial</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                  <th className="py-4 px-4">Fecha</th>
                  <th className="py-4 px-4">Número</th>
                  <th className="py-4 px-4">Cliente</th>
                  <th className="py-4 px-4 text-right">Monto</th>
                  <th className="py-4 px-4 text-center">Estado</th>
                  <th className="py-4 px-4 text-center">Acciones</th>
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
                    <tr key={comp.id} className="text-slate-600 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 text-[11px] font-bold">
                        {new Date(comp.fecha).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-4 px-4 font-black text-xs text-brand-700 uppercase">
                        {comp.numero}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-black block text-slate-900 text-xs uppercase leading-tight">{comp.pedido?.cliente?.razon_social}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">RUTA: {comp.pedido?.cliente?.ruta?.nombre || 'S/A'}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-slate-900">
                        ${comp.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${
                          comp.estado === 'Emitido' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          comp.estado === 'Entregado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {comp.estado}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {comp.pdf_path ? (
                          <a
                            href={comp.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border border-slate-200"
                          >
                            <Download className="h-3 w-3 mr-1.5" />
                            PDF
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-black uppercase italic tracking-widest">Generando...</span>
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
