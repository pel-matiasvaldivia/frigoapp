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
      <div className="lg:col-span-1 border border-slate-800 rounded-2xl bg-slate-900/40 p-5 space-y-5 h-fit">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold text-white">Preparación de Bultos</h2>
          </div>
        </div>

        {/* Tab state filters */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl">
          {['Pendiente', 'En preparación', 'Completado'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setFilterEstado(st);
                setSelectedOrden(null);
              }}
              className={`py-1.5 text-[10px] font-bold uppercase rounded-lg transition ${
                filterEstado === st 
                  ? 'bg-rose-600 text-white' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'Pendiente' ? 'Pendiente' : st === 'En preparación' ? 'En Prep' : 'Listos'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500 mx-auto"></div>
            </div>
          ) : ordenes.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Sin órdenes en este estado</p>
          ) : (
            ordenes.map((orden) => (
              <div
                key={orden.id}
                onClick={() => handleSelectOrden(orden)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  selectedOrden?.id === orden.id
                    ? 'border-rose-500 bg-rose-950/10'
                    : 'border-slate-850 bg-slate-900/60 hover:bg-slate-850'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-white">Orden #{orden.id}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Pedido #{orden.pedido_id}</span>
                </div>
                <p className="text-xs font-semibold text-slate-300 mt-2 truncate">{orden.pedido?.cliente?.razon_social}</p>
                <div className="flex justify-between items-center mt-3 text-[10px] text-slate-450">
                  <span className="font-mono">{orden.ruta?.nombre || 'Sin Ruta'}</span>
                  <span>{orden.bultos?.length} bultos</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Preparation workspace */}
      <div className="lg:col-span-2 space-y-6">
        {!selectedOrden ? (
          <div className="border border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px] bg-slate-900/20">
            <Scale className="h-12 w-12 text-slate-700 mb-4 animate-bounce" />
            <h3 className="font-bold text-white text-base">Área de Balanza y Calibración</h3>
            <p className="text-xs max-w-sm mt-1">Seleccione una orden de preparación de la lista lateral para cargar los kilogramos reales pesados en báscula.</p>
          </div>
        ) : (
          <div className="border border-slate-800 rounded-3xl bg-slate-900/40 p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">Preparación de Pedido #{selectedOrden.pedido_id}</h2>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    selectedOrden.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    selectedOrden.estado === 'En preparación' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {selectedOrden.estado}
                  </span>
                </div>
                <p className="text-sm font-bold text-rose-500 mt-1">{selectedOrden.pedido?.cliente?.razon_social}</p>
                <p className="text-xs text-slate-400 mt-0.5">Ruta asignada: {selectedOrden.ruta?.nombre} ({selectedOrden.ruta?.zona || 'Sin Zona'})</p>
              </div>

              {selectedOrden.estado === 'Pendiente' && (
                <button
                  onClick={handleStartPrep}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Preparación
                </button>
              )}
            </div>

            {/* Checklist of products */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carga de Kilogramos por Bulto</h3>
              
              <div className="space-y-3">
                {selectedOrden.bultos.map((bulto: any) => (
                  <div 
                    key={bulto.id} 
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      confirmedBultos[bulto.id]
                        ? 'bg-emerald-950/10 border-emerald-800/40 text-emerald-300'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    {/* Product Name */}
                    <div className="flex-1">
                      <span className="font-mono text-xs text-slate-400 block">[{bulto.producto.codigo}]</span>
                      <span className="font-semibold text-white">{bulto.producto.descripcion}</span>
                      <div className="text-[10px] text-slate-450 mt-1">
                        Unidades solicitadas: {bulto.unidades} • Peso est: {bulto.peso_estimado_kg} kg
                      </div>
                    </div>

                    {/* Weight Inputs */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Scale className="h-4 w-4 text-slate-500" />
                        <input
                          type="number"
                          step="0.1"
                          disabled={selectedOrden.estado === 'Completado' || confirmedBultos[bulto.id]}
                          value={weights[bulto.id] || ''}
                          onChange={(e) => handleWeightChange(bulto.id, Number(e.target.value))}
                          placeholder="0.0"
                          className="w-24 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-rose-500 font-bold text-center text-white"
                        />
                        <span className="text-xs text-slate-400">kg reales</span>
                      </div>

                      {/* Confirm item check */}
                      {selectedOrden.estado !== 'Completado' && (
                        <button
                          type="button"
                          onClick={() => handleToggleConfirmBulto(bulto.id)}
                          className={`p-2 rounded-lg border transition ${
                            confirmedBultos[bulto.id]
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-350'
                          }`}
                          title={confirmedBultos[bulto.id] ? "Confirmado" : "Marcar como listo"}
                        >
                          <Check className="h-4 w-4" />
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
              <div className="flex space-x-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleSaveWeights(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Guardar Avance Parcial
                </button>
                <button
                  onClick={() => handleSaveWeights(true)}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-900/30 transition flex items-center justify-center"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Completar Preparación
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
