import React, { useEffect, useState } from 'react';
import { productosAPI } from '../../services/api';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const DEPARTAMENTOS = ['Cortes frescos', 'Chacinados', 'Salazones', 'Embutidos', 'Otros'];

export const Productos: React.FC = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [departamento, setDepartamento] = useState('Cortes frescos');
  const [activo, setActivo] = useState(true);

  useEffect(() => { fetchProductos(); }, []);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await productosAPI.list();
      setProductos(res);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null); setCodigo(''); setDescripcion('');
    setDepartamento('Cortes frescos'); setActivo(true);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p); setCodigo(p.codigo); setDescripcion(p.descripcion);
    setDepartamento(p.departamento); setActivo(p.activo);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!codigo || !descripcion) { alert("Código y descripción son obligatorios"); return; }
    const payload = { codigo, descripcion, departamento, activo };
    try {
      if (editing) {
        await productosAPI.update(editing.id, payload);
      } else {
        await productosAPI.create(payload);
      }
      setModalOpen(false); fetchProductos();
    } catch (err: any) { alert(err.response?.data?.detail || "Error al guardar producto"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;
    try { await productosAPI.delete(id); fetchProductos(); }
    catch (err: any) { alert(err.response?.data?.detail || "Error al eliminar producto"); }
  };

  const filtered = productos.filter(p =>
    (p.descripcion.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (!deptFilter || p.departamento === deptFilter)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Catálogo de Productos</h1>
          <p className="text-slate-400 text-sm mt-1">Administración del catálogo porcino: cortes frescos, chacinados, embutidos y salazones.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-rose-900/30">
          <Plus className="h-5 w-5 mr-2" /> Nuevo Producto
        </button>
      </div>

      <div className="flex flex-wrap gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" placeholder="Buscar por código o descripción..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none">
          <option value="">Todos los departamentos</option>
          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase bg-slate-950/30">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-xs">Ningún producto encontrado</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/30">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-rose-400">{p.codigo}</td>
                    <td className="py-3.5 px-4 font-semibold text-white text-sm">{p.descripcion}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.departamento}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${p.activo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 bg-rose-950/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Código *</label>
                <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: 001"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Descripción *</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Media Res de Cerdo"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Departamento</label>
                <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none">
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="prodActivo" checked={activo} onChange={(e) => setActivo(e.target.checked)}
                  className="h-4 w-4 accent-rose-500" />
                <label htmlFor="prodActivo" className="text-sm font-medium text-slate-300">Producto activo en catálogo</label>
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/30 transition">
                {editing ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
