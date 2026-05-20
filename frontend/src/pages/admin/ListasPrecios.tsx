import React, { useEffect, useState } from 'react';
import { listasPreciosAPI } from '../../services/api';
import { 
  ClipboardList, Search, Edit2, Download, Upload, 
  ChevronDown, ChevronUp, Save, X, TrendingUp 
} from 'lucide-react';

export const ListasPrecios: React.FC = () => {
  const [listas, setListas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLista, setExpandedLista] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [search, setSearch] = useState('');

  // Inline edit state: detalleId -> { precio_venta, precio_costo, precio_mayoreo }
  const [editedRows, setEditedRows] = useState<Record<number, any>>({});
  const [savingRows, setSavingRows] = useState<Set<number>>(new Set());

  useEffect(() => { fetchListas(); }, []);

  const fetchListas = async () => {
    setLoading(true);
    try {
      const res = await listasPreciosAPI.list();
      setListas(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleToggleExpand = async (listaId: number) => {
    if (expandedLista === listaId) {
      setExpandedLista(null);
      setDetalles([]);
      return;
    }
    setExpandedLista(listaId);
    setLoadingDetalles(true);
    setEditedRows({});
    try {
      const res = await listasPreciosAPI.getDetalles(listaId);
      setDetalles(res.detalles || []);
    } catch (err) { console.error(err); } finally { setLoadingDetalles(false); }
  };

  const handleEditField = (detalleId: number, field: string, value: number) => {
    setEditedRows(prev => ({
      ...prev,
      [detalleId]: { ...prev[detalleId], [field]: value }
    }));
  };

  const handleSaveRow = async (listaId: number, detalleId: number) => {
    const changes = editedRows[detalleId];
    if (!changes) return;
    setSavingRows(prev => new Set(prev).add(detalleId));
    try {
      await listasPreciosAPI.updateDetalle(listaId, detalleId, changes);
      // Update local detalles
      setDetalles(prev => prev.map(d => d.id === detalleId ? { ...d, ...changes } : d));
      setEditedRows(prev => { const n = { ...prev }; delete n[detalleId]; return n; });
    } catch (err) { alert("Error al guardar precio"); }
    finally { setSavingRows(prev => { const n = new Set(prev); n.delete(detalleId); return n; }); }
  };

  const handleExport = async (listaId: number) => {
    try {
      const res = await listasPreciosAPI.exportarExcel(listaId);
      window.open(res.download_url, '_blank');
    } catch (err) { alert("Error al exportar lista"); }
  };

  const filteredDetalles = detalles.filter(d =>
    d.producto.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    d.producto.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Listas de Precios</h1>
        <p className="text-slate-400 text-sm mt-1">Edición de precios por unidad/kg para cada categoría de cliente. Expansión inline con edición directa.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          listas.map((lista) => (
            <div key={lista.id} className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden">
              {/* List Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-900/60 transition"
                onClick={() => handleToggleExpand(lista.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                    lista.id === 1 ? 'bg-rose-600/20 text-rose-400' :
                    lista.id === 2 ? 'bg-sky-600/20 text-sky-400' :
                    lista.id === 3 ? 'bg-amber-600/20 text-amber-400' :
                    lista.id === 4 ? 'bg-emerald-600/20 text-emerald-400' :
                    lista.id === 5 ? 'bg-purple-600/20 text-purple-400' :
                    'bg-slate-700/40 text-slate-400'
                  }`}>
                    {lista.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{lista.nombre}</h3>
                    <p className="text-xs text-slate-400">{lista.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExport(lista.id); }}
                    className="hidden sm:flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Exportar .xlsx
                  </button>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${lista.activa ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/20 text-slate-500 border-slate-700/20'}`}>
                    {lista.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  {expandedLista === lista.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Price Table */}
              {expandedLista === lista.id && (
                <div className="border-t border-slate-800">
                  {/* Search within list */}
                  <div className="p-4 border-b border-slate-800/60 bg-slate-950/20">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input type="text" placeholder="Filtrar productos..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500" />
                    </div>
                  </div>

                  {loadingDetalles ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase bg-slate-950/20">
                            <th className="py-3 px-4">Código</th>
                            <th className="py-3 px-4">Descripción</th>
                            <th className="py-3 px-4">Depto.</th>
                            <th className="py-3 px-4 text-right">Precio Costo</th>
                            <th className="py-3 px-4 text-right">Precio Venta</th>
                            <th className="py-3 px-4 text-right">Precio Mayoreo</th>
                            <th className="py-3 px-4 text-right">Stock</th>
                            <th className="py-3 px-4 text-center">Guardar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {filteredDetalles.length === 0 ? (
                            <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sin resultados</td></tr>
                          ) : (
                            filteredDetalles.map((det) => {
                              const edited = editedRows[det.id] || {};
                              const isModified = Object.keys(edited).length > 0;
                              const isSaving = savingRows.has(det.id);
                              return (
                                <tr key={det.id} className={`transition ${isModified ? 'bg-rose-950/10' : 'hover:bg-slate-900/20'}`}>
                                  <td className="py-2.5 px-4 font-mono text-rose-400 font-bold">{det.producto.codigo}</td>
                                  <td className="py-2.5 px-4 font-semibold text-white">{det.producto.descripcion}</td>
                                  <td className="py-2.5 px-4 text-slate-400">{det.producto.departamento}</td>
                                  {/* Editable price cells */}
                                  {(['precio_costo', 'precio_venta', 'precio_mayoreo'] as const).map(field => (
                                    <td key={field} className="py-2.5 px-4 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={edited[field] !== undefined ? edited[field] : det[field]}
                                        onChange={(e) => handleEditField(det.id, field, parseFloat(e.target.value) || 0)}
                                        className={`w-24 px-2 py-1 text-right bg-slate-950 border rounded-lg text-xs font-mono focus:outline-none ${
                                          edited[field] !== undefined ? 'border-rose-500 text-rose-300' : 'border-slate-800 text-slate-300'
                                        }`}
                                      />
                                    </td>
                                  ))}
                                  <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                                    {det.stock?.toFixed(1)} kg
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    {isModified && (
                                      <button
                                        onClick={() => handleSaveRow(lista.id, det.id)}
                                        disabled={isSaving}
                                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
                                        title="Guardar cambios"
                                      >
                                        {isSaving ? <div className="animate-spin h-3 w-3 border-b border-white rounded-full" /> : <Save className="h-3.5 w-3.5" />}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
