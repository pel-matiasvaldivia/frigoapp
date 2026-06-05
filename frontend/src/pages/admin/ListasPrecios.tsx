import React, { useEffect, useState } from 'react';
import { listasPreciosAPI, productosAPI } from '../../services/api';
import { 
  ClipboardList, Search, Edit2, Download, Upload, 
  ChevronDown, ChevronUp, Save, X, TrendingUp, Plus, Trash2, Power
} from 'lucide-react';

export const ListasPrecios: React.FC = () => {
  const [listas, setListas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLista, setExpandedLista] = useState<number | null>(null);
  const [detalles, setDetalles] = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [listaToEdit, setListaToEdit] = useState<any>(null);

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

  const handleToggleActiva = async (e: React.MouseEvent, lista: any) => {
    e.stopPropagation();
    try {
      await listasPreciosAPI.update(lista.id, { activa: !lista.activa });
      setListas(prev => prev.map(l => l.id === lista.id ? { ...l, activa: !l.activa } : l));
    } catch (err) { alert("Error al cambiar estado"); }
  };

  const handleDeleteLista = async (e: React.MouseEvent, listaId: number) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de eliminar esta lista de precios? Esta acción no se puede deshacer.")) return;
    try {
      await listasPreciosAPI.delete(listaId);
      setListas(prev => prev.filter(l => l.id !== listaId));
      if (expandedLista === listaId) setExpandedLista(null);
    } catch (err) { alert("Error al eliminar lista"); }
  };

  const handleOpenEdit = (e: React.MouseEvent, lista: any) => {
    e.stopPropagation();
    setListaToEdit(lista);
    setShowCreateModal(true);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Listas de Precios</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Edición de precios para cada categoría de cliente. Expansión inline con edición directa.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-600/20 active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Lista
        </button>
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
                    className="hidden lg:flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                  >
                    <Download className="h-4 w-4 mr-2" /> Exportar
                  </button>
                  <button
                    onClick={(e) => handleOpenEdit(e, lista)}
                    className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleToggleActiva(e, lista)}
                    className={`p-2 rounded-xl transition-colors ${lista.activa ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                    title={lista.activa ? 'Desactivar' : 'Activar'}
                  >
                    <Power className={`h-4 w-4 ${lista.activa ? 'fill-emerald-600' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteLista(e, lista.id)}
                    className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

      <ModalNuevaLista
        show={showCreateModal}
        listaToEdit={listaToEdit}
        onClose={() => { setShowCreateModal(false); setListaToEdit(null); }}
        onSuccess={fetchListas}
      />
    </div>
  );
};

const ModalNuevaLista: React.FC<{ 
  show: boolean; 
  listaToEdit?: any;
  onClose: () => void; 
  onSuccess: () => void 
}> = ({ show, listaToEdit, onClose, onSuccess }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState<any[]>([]); // Only used for create
  
  useEffect(() => {
    if (show && listaToEdit) {
      setNombre(listaToEdit.nombre);
      setDescripcion(listaToEdit.descripcion || '');
    } else if (show) {
      setNombre('');
      setDescripcion('');
      setItems([]);
    }
  }, [show, listaToEdit]);
  const [allProductos, setAllProductos] = useState<any[]>([]);
  const [addingNew, setAddingNew] = useState(false);
  const [newProd, setNewProd] = useState({ codigo: '', descripcion: '', departamento: 'Cortes frescos' });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (show) fetchProductos();
  }, [show]);

  const fetchProductos = async () => {
    try {
      const res = await productosAPI.list();
      setAllProductos(res);
    } catch (err) { console.error(err); }
  };

  const handleAddItem = (prod: any) => {
    if (items.some(it => it.producto_id === prod.id)) return;
    setItems([...items, { 
      producto_id: prod.id, 
      descripcion: prod.descripcion, 
      codigo: prod.codigo,
      precio_costo: 0, 
      precio_venta: 0, 
      precio_mayoreo: 0 
    }]);
    setSearchTerm('');
  };

  const handleAddNewProduct = () => {
    if (!newProd.codigo || !newProd.descripcion) return;
    setItems([...items, {
      new_producto: { ...newProd },
      descripcion: newProd.descripcion,
      codigo: newProd.codigo,
      precio_costo: 0,
      precio_venta: 0,
      precio_mayoreo: 0
    }]);
    setNewProd({ codigo: '', descripcion: '', departamento: 'Cortes frescos' });
    setAddingNew(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemPrice = (index: number, field: string, value: number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!nombre) return alert("El nombre es obligatorio");
    setSubmitting(true);
    try {
      if (listaToEdit) {
        await listasPreciosAPI.update(listaToEdit.id, { nombre, descripcion });
      } else {
        await listasPreciosAPI.create({
          nombre,
          descripcion,
          activa: true,
          items: items.map(it => ({
            producto_id: it.producto_id,
            new_producto: it.new_producto,
            precio_costo: it.precio_costo,
            precio_venta: it.precio_venta,
            precio_mayoreo: it.precio_mayoreo
          }))
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al crear lista");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const filteredSearch = searchTerm.length > 1 
    ? allProductos.filter(p => 
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {listaToEdit ? 'Editar Información General' : 'Crear Nueva Lista de Precios'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre de la Lista</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Especial Verano" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-900 placeholder:font-normal" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descripción</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Opcional..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-medium text-slate-600" />
            </div>
          </div>

        {!listaToEdit && (
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-black text-slate-900 uppercase">Productos en la Lista</h3>
               <button onClick={() => setAddingNew(!addingNew)} className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center">
                  {addingNew ? <X className="h-4 w-4 mr-1"/> : <Plus className="h-4 w-4 mr-1"/>}
                  {addingNew ? 'Cancelar' : 'Crear Producto Nuevo'}
               </button>
            </div>

            {addingNew && (
              <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                 <input type="text" placeholder="Código" value={newProd.codigo} onChange={e => setNewProd({...newProd, codigo: e.target.value})} className="px-3 py-2 border rounded-xl text-xs font-bold" />
                 <input type="text" placeholder="Descripción" value={newProd.descripcion} onChange={e => setNewProd({...newProd, descripcion: e.target.value})} className="px-3 py-2 border rounded-xl text-xs font-bold md:col-span-2" />
                 <button onClick={handleAddNewProduct} className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold px-4 py-2 transition-colors">Agregar</button>
              </div>
            )}

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                 type="text" 
                 placeholder="Agregar producto existente (buscar por código o nombre)..." 
                 className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
              {filteredSearch.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white border rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredSearch.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleAddItem(p)}
                      className="p-3 hover:bg-brand-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-black text-brand-600 mr-2">{p.codigo}</span>
                        <span className="font-bold text-slate-700">{p.descripcion}</span>
                      </div>
                      <Plus className="h-4 w-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                     <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="p-3">Código</th>
                        <th className="p-3">Producto</th>
                        <th className="p-3 text-right">Costo</th>
                        <th className="p-3 text-right">Venta</th>
                        <th className="p-3 text-right">Mayoreo</th>
                        <th className="p-3"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {items.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium">No has agregado productos aún</td></tr>}
                     {items.map((it, idx) => (
                        <tr key={idx} className={`transition-colors ${it.new_producto ? 'bg-emerald-50/50' : 'hover:bg-slate-50/30'}`}>
                           <td className="p-3 font-mono font-black text-brand-600">{it.codigo}</td>
                           <td className="p-3">
                              <div className="font-bold text-slate-900">{it.descripcion}</div>
                              {it.new_producto && <span className="text-[7px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">NUEVO PRODUCTO</span>}
                           </td>
                           <td className="p-3 text-right"><input type="number" value={it.precio_costo} onChange={e => updateItemPrice(idx, 'precio_costo', parseFloat(e.target.value) || 0)} className="w-20 p-2 border border-slate-200 rounded-xl text-right font-black" /></td>
                           <td className="p-3 text-right"><input type="number" value={it.precio_venta} onChange={e => updateItemPrice(idx, 'precio_venta', parseFloat(e.target.value) || 0)} className="w-20 p-2 border border-brand-200 rounded-xl text-right font-black text-brand-600 focus:ring-1 focus:ring-brand-500 outline-none" /></td>
                           <td className="p-3 text-right"><input type="number" value={it.precio_mayoreo} onChange={e => updateItemPrice(idx, 'precio_mayoreo', parseFloat(e.target.value) || 0)} className="w-20 p-2 border border-slate-200 rounded-xl text-right font-black" /></td>
                           <td className="p-3 text-center"><button onClick={() => removeItem(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><X className="h-4 w-4" /></button></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-3">
           <button onClick={onClose} disabled={submitting} className="w-full sm:w-auto px-6 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
           <button onClick={handleSubmit} disabled={submitting || !nombre} className="w-full sm:w-auto px-10 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black shadow-lg shadow-brand-600/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50">
              {submitting ? <div className="animate-spin h-5 w-5 border-b-2 border-white rounded-full mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              {listaToEdit ? 'GUARDAR CAMBIOS' : 'CREAR LISTA DEFINITIVA'}
           </button>
        </div>
      </div>
    </div>
  );
};
