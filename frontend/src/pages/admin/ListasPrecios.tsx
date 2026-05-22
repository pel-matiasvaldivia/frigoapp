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
        <h1 className="text-3xl font-extrabold text-slate-900">Listas de Precios</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Edición de precios por unidad/kg para cada categoría de cliente. Expansión inline con edición directa.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
          </div>
        ) : (
          listas.map((lista) => (
            <div key={lista.id} className="border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* List Header */}
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleToggleExpand(lista.id)}
              >
                <div className="flex items-center space-x-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                    lista.id === 1 ? 'bg-red-50 text-red-600' :
                    lista.id === 2 ? 'bg-sky-50 text-sky-600' :
                    lista.id === 3 ? 'bg-amber-50 text-amber-600' :
                    lista.id === 4 ? 'bg-emerald-50 text-emerald-600' :
                    lista.id === 5 ? 'bg-purple-50 text-purple-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {lista.id}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{lista.nombre}</h3>
                    <p className="text-xs text-slate-500 font-medium">{lista.descripcion || 'Sin descripción'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExport(lista.id); }}
                    className="hidden sm:flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                  >
                    <Download className="h-4 w-4 mr-2" /> Exportar .xlsx
                  </button>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black border uppercase tracking-widest ${lista.activa ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    {lista.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  {expandedLista === lista.id ? <ChevronUp className="h-6 w-6 text-slate-400" /> : <ChevronDown className="h-6 w-6 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Price Table */}
              {expandedLista === lista.id && (
                <div className="border-t border-slate-100">
                  {/* Search within list */}
                  <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="text" placeholder="Filtrar por código o nombre..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-brand-500 transition-all shadow-sm" />
                    </div>
                  </div>

                  {loadingDetalles ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50">
                            <th className="py-4 px-4">Código</th>
                            <th className="py-4 px-4 uppercase">Descripción</th>
                            <th className="py-4 px-4">Depto.</th>
                            <th className="py-4 px-4 text-right">Costo</th>
                            <th className="py-4 px-4 text-right">Precio Venta</th>
                            <th className="py-4 px-4 text-right">Mayoreo</th>
                            <th className="py-4 px-4 text-right">Stock</th>
                            <th className="py-4 px-4 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDetalles.length === 0 ? (
                            <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sin resultados</td></tr>
                          ) : (
                            filteredDetalles.map((det) => {
                              const edited = editedRows[det.id] || {};
                              const isModified = Object.keys(edited).length > 0;
                              const isSaving = savingRows.has(det.id);
                              return (
                                <tr key={det.id} className={`transition-colors ${isModified ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                                  <td className="py-3 px-4 font-mono text-brand-700 font-black">{det.producto.codigo}</td>
                                  <td className="py-3 px-4 font-bold text-slate-900">{det.producto.descripcion}</td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold text-[9px] uppercase border border-slate-200">{det.producto.departamento}</span>
                                  </td>
                                  {/* Editable price cells */}
                                  {(['precio_costo', 'precio_venta', 'precio_mayoreo'] as const).map(field => (
                                    <td key={field} className="py-3 px-4 text-right">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={edited[field] !== undefined ? edited[field] : det[field]}
                                        onChange={(e) => handleEditField(det.id, field, parseFloat(e.target.value) || 0)}
                                        className={`w-24 px-3 py-1.5 text-right bg-white border rounded-xl text-xs font-black transition-all focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                          edited[field] !== undefined ? 'border-brand-600 text-brand-700 shadow-sm' : 'border-slate-200 text-slate-700'
                                        }`}
                                      />
                                    </td>
                                  ))}
                                  <td className="py-3 px-4 text-right font-black text-slate-600">
                                    {det.stock?.toFixed(1)} kg
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {isModified && (
                                      <button
                                        onClick={() => handleSaveRow(lista.id, det.id)}
                                        disabled={isSaving}
                                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-900/10 transition-all disabled:opacity-50 active:scale-95"
                                        title="Guardar cambios"
                                      >
                                        {isSaving ? <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" /> : <Save className="h-4 w-4" />}
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
