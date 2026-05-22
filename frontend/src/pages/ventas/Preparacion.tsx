import React, { useEffect, useState } from 'react';
import { preparacionAPI } from '../../services/api';
import { 
  ClipboardList, 
  Check, 
  Play, 
  CheckSquare, 
  Search, 
  AlertTriangle,
  Scale
} from 'lucide-react';

export const Preparacion: React.FC = () => {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('Pendiente');
  
  // Edited weights state mapper: bultoId -> real weight
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [confirmedBultos, setConfirmedBultos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchOrdenes();
  }, [filterEstado]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const res = await preparacionAPI.list({ estado: filterEstado });
      setOrdenes(res);
    } catch (err) {
      console.error("Error loading preparation orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrden = async (orden: any) => {
    setSelectedOrden(orden);
    
    // Initialize edited values
    const initWeights: Record<number, number> = {};
    const initConfirmed: Record<number, boolean> = {};
    
    orden.bultos.forEach((b: any) => {
      initWeights[b.id] = b.peso_real_kg || b.peso_estimado_kg;
      initConfirmed[b.id] = b.confirmado;
    });
    
    setWeights(initWeights);
    setConfirmedBultos(initConfirmed);
  };

  const handleWeightChange = (bultoId: number, value: number) => {
    setWeights({
      ...weights,
      [bultoId]: Math.max(0, value)
    });
  };

  const handleToggleConfirmBulto = (bultoId: number) => {
    setConfirmedBultos({
      ...confirmedBultos,
      [bultoId]: !confirmedBultos[bultoId]
    });
  };

  const handleStartPrep = async () => {
    if (!selectedOrden) return;
    try {
      const updated = await preparacionAPI.update(selectedOrden.id, {
        estado: 'En preparación',
        bultos: []
      });
      setSelectedOrden(updated);
      fetchOrdenes();
    } catch (err) {
      alert("Error al iniciar preparación");
    }
  };

  const handleSaveWeights = async (complete = false) => {
    if (!selectedOrden) return;
    
    // Check if all are confirmed when completing
    if (complete) {
      const allConfirmed = selectedOrden.bultos.every((b: any) => confirmedBultos[b.id]);
      if (!allConfirmed) {
        alert("Para completar la preparación, debe marcar todos los bultos como listos/confirmados.");
        return;
      }
    }
    
    const bultosPayload = selectedOrden.bultos.map((b: any) => ({
      id: b.id,
      peso_real_kg: weights[b.id] || 0.0,
      confirmado: confirmedBultos[b.id] || false
    }));
    
    try {
      const payload: any = {
        bultos: bultosPayload
      };
      if (complete) {
        payload.estado = 'Completado';
      }
      
      const res = await preparacionAPI.update(selectedOrden.id, payload);
      alert(complete ? "¡Orden de preparación completada con éxito!" : "Pesos guardados parcialmente.");
      
      if (complete) {
        setSelectedOrden(null);
      } else {
        setSelectedOrden(res);
      }
      fetchOrdenes();
    } catch (err) {
      alert("Error al guardar cambios de preparación");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Sidebar List of Orders */}
      <div className="lg:col-span-1 border border-slate-200 rounded-3xl bg-white p-6 space-y-6 h-fit shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-6 w-6 text-brand-600" />
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Preparación</h2>
          </div>
        </div>

        {/* Tab state filters */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
          {['Pendiente', 'En preparación', 'Completado'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setFilterEstado(st);
                setSelectedOrden(null);
              }}
              className={`py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                filterEstado === st 
                  ? 'bg-white text-brand-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st === 'Pendiente' ? 'Pendiente' : st === 'En preparación' ? 'En Prep' : 'Listos'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
            </div>
          ) : ordenes.length === 0 ? (
            <p className="text-center text-xs text-slate-400 font-medium py-10 italic">Sin órdenes en este estado</p>
          ) : (
            ordenes.map((orden) => (
              <div
                key={orden.id}
                onClick={() => handleSelectOrden(orden)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                  selectedOrden?.id === orden.id
                    ? 'border-brand-600 bg-brand-50 shadow-sm'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-black ${selectedOrden?.id === orden.id ? 'text-brand-700' : 'text-slate-900'}`}>Orden #{orden.id}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">#{orden.pedido_id}</span>
                </div>
                <p className="text-xs font-bold text-slate-700 mt-2 truncate uppercase">{orden.pedido?.cliente?.razon_social}</p>
                <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  <span className="truncate max-w-[120px]">{orden.ruta?.nombre || 'Sin Ruta'}</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{orden.bultos?.length} bultos</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Preparation workspace */}
      <div className="lg:col-span-2 space-y-6">
        {!selectedOrden ? (
          <div className="border border-dashed border-slate-200 rounded-[2rem] p-16 text-center text-slate-400 flex flex-col items-center justify-center min-h-[500px] bg-slate-50/50">
            <Scale className="h-16 w-16 text-slate-200 mb-6 animate-bounce" />
            <h3 className="font-black text-slate-300 text-xl uppercase tracking-widest">Área de Balanza</h3>
            <p className="text-sm max-w-sm mt-3 font-medium">Seleccione una orden para cargar pesos reales.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-[2rem] bg-white p-8 space-y-8 shadow-sm">
            {/* Header info */}
            <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Preparar Pedido #{selectedOrden.pedido_id}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                    selectedOrden.estado === 'Pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    selectedOrden.estado === 'En preparación' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {selectedOrden.estado}
                  </span>
                </div>
                <p className="text-sm font-black text-brand-600 uppercase tracking-tight">{selectedOrden.pedido?.cliente?.razon_social}</p>
                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full w-fit">
                  <span className="text-slate-800 mr-2">RUTA:</span> {selectedOrden.ruta?.nombre} ({selectedOrden.ruta?.zona || 'GENERAL'})
                </div>
              </div>

              {selectedOrden.estado === 'Pendiente' && (
                <button
                  onClick={handleStartPrep}
                  className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-900/20 transition-all uppercase tracking-widest"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </button>
              )}
            </div>

            {/* Checklist of products */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
                <Scale className="h-4 w-4 mr-2" /> BALANZA: CARGA DE KILOS REALES
              </h3>
              
              <div className="space-y-3">
                {selectedOrden.bultos.map((bulto: any) => (
                  <div 
                    key={bulto.id} 
                    className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      confirmedBultos[bulto.id]
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-brand-300'
                    }`}
                  >
                    {/* Product Name */}
                    <div className="flex-1">
                      <span className="font-mono text-[10px] text-brand-600 font-bold block mb-1">#{bulto.producto.codigo}</span>
                      <span className="font-black text-slate-900 text-base leading-tight uppercase">{bulto.producto.descripcion}</span>
                      <div className="flex space-x-3 text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">PEDIDO: {bulto.unidades} UNID.</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">ESTIMADO: {bulto.peso_estimado_kg} KG</span>
                      </div>
                    </div>

                    {/* Weight Inputs */}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <input
                          type="number"
                          step="0.1"
                          disabled={selectedOrden.estado === 'Completado' || confirmedBultos[bulto.id]}
                          value={weights[bulto.id] || ''}
                          onChange={(e) => handleWeightChange(bulto.id, Number(e.target.value))}
                          placeholder="0.0"
                          className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black focus:outline-none focus:ring-1 focus:ring-brand-500 text-center text-slate-900"
                        />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KG REALES</span>
                      </div>

                      {/* Confirm item check */}
                      {selectedOrden.estado !== 'Completado' && (
                        <button
                          type="button"
                          onClick={() => handleToggleConfirmBulto(bulto.id)}
                          className={`p-3 rounded-xl border transition-all ${
                            confirmedBultos[bulto.id]
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/10'
                              : 'bg-white text-slate-300 border-slate-200 hover:border-brand-400 hover:text-brand-600'
                          }`}
                          title={confirmedBultos[bulto.id] ? "Confirmado" : "Marcar como listo"}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observations from order */}
            {selectedOrden.observaciones && (
              <div className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl flex items-start space-x-2 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-450">Observaciones del Pedido:</span>
                  <p className="text-slate-300 mt-0.5">{selectedOrden.observaciones}</p>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            {selectedOrden.estado !== 'Completado' && (
              <div className="flex space-x-4 pt-6 border-t border-slate-100">
                <button
                  onClick={() => handleSaveWeights(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-sm rounded-2xl transition-all uppercase tracking-widest"
                >
                  Guardar Avance
                </button>
                <button
                  onClick={() => handleSaveWeights(true)}
                  className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-brand-900/20 transition-all flex items-center justify-center uppercase tracking-widest"
                >
                  <CheckSquare className="h-5 w-5 mr-3" />
                  Finalizar Pesaje
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
