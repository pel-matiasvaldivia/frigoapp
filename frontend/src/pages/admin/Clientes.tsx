import React, { useEffect, useState } from 'react';
import { clientesAPI, rutasAPI, listasPreciosAPI } from '../../services/api';
import { Plus, Search, Edit2, Trash2, Users, X, Check } from 'lucide-react';

export const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [listas, setListas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<any | null>(null);

  // Form fields
  const [razonSocial, setRazonSocial] = useState('');
  const [cuit, setCuit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rutaId, setRutaId] = useState<number | ''>('');
  const [listaId, setListaId] = useState<number | ''>('');
  const [limiteCredito, setLimiteCredito] = useState<number>(0);
  const [activo, setActivo] = useState(true);
  const [crearUsuario, setCrearUsuario] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cl, ru, li] = await Promise.all([
        clientesAPI.list(),
        rutasAPI.list(),
        listasPreciosAPI.list()
      ]);
      setClientes(cl);
      setRutas(ru);
      setListas(li);
    } catch (err) {
      console.error("Error loading clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCliente(null);
    setRazonSocial(''); setCuit(''); setDireccion(''); setTelefono('');
    setRutaId(''); setListaId(''); setLimiteCredito(0); setActivo(true);
    setCrearUsuario(false); setEmail(''); setPassword('');
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingCliente(c);
    setRazonSocial(c.razon_social || '');
    setCuit(c.cuit || '');
    setDireccion(c.direccion || '');
    setTelefono(c.telefono_whatsapp || '');
    setRutaId(c.ruta_id || '');
    setListaId(c.lista_precios_id || '');
    setLimiteCredito(c.limite_credito || 0);
    setActivo(c.activo);
    setCrearUsuario(false); setEmail(''); setPassword('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {
      razon_social: razonSocial,
      cuit: cuit || null,
      direccion: direccion || null,
      telefono_whatsapp: telefono || null,
      ruta_id: rutaId || null,
      lista_precios_id: listaId || null,
      limite_credito: limiteCredito,
      activo,
      crear_usuario: crearUsuario,
      email: crearUsuario ? email : undefined,
      password: crearUsuario ? password : undefined
    };
    try {
      if (editingCliente) {
        await clientesAPI.update(editingCliente.id, payload);
        alert("Cliente actualizado exitosamente");
      } else {
        await clientesAPI.create(payload);
        alert("Cliente creado exitosamente");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al guardar cliente");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cliente permanentemente?")) return;
    try {
      await clientesAPI.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al eliminar cliente");
    }
  };

  const filtered = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    (c.cuit && c.cuit.includes(search))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">ABM de cartera de clientes, asignación de rutas y listas de precios.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-brand-900/20">
          <Plus className="h-5 w-5 mr-2" /> Nuevo Cliente
        </button>
      </div>

      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Buscar por razón social o CUIT..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
        </div>
      </div>
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs font-bold uppercase bg-slate-50/50">
                <th className="py-4 px-4">Razón Social</th>
                <th className="py-4 px-4">CUIT</th>
                <th className="py-4 px-4">Ruta</th>
                <th className="py-4 px-4">Lista de Precios</th>
                <th className="py-4 px-4 text-right">Límite Crédito</th>
                <th className="py-4 px-4 text-center">Estado</th>
                <th className="py-4 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic">Ningún cliente registrado</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.razon_social}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{c.cuit || '—'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{c.ruta?.nombre || '—'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{c.lista_precios?.nombre || '—'}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">${c.limite_credito?.toLocaleString('es-AR') || '0'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${c.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                       <button onClick={() => openEdit(c)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"><Edit2 className="h-3.5 w-3.5" /></button>
                       <button onClick={() => handleDelete(c.id)} className="p-1.5 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cliente Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-slate-900">{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="h-6 w-6" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Razón Social *</label>
                <input type="text" required value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CUIT</label>
                <input type="text" value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="20-12345678-9"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono WhatsApp</label>
                <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="3515551234"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dirección</label>
                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ruta de Reparto</label>
                <select value={rutaId} onChange={(e) => setRutaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all">
                  <option value="">Sin asignar</option>
                  {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lista de Precios</label>
                <select value={listaId} onChange={(e) => setListaId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all">
                  <option value="">Sin asignar</option>
                  {listas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Límite de Crédito ($)</label>
                <input type="number" min="0" value={limiteCredito} onChange={(e) => setLimiteCredito(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <input type="checkbox" id="activo" checked={activo} onChange={(e) => setActivo(e.target.checked)}
                  className="h-5 w-5 accent-brand-600 rounded cursor-pointer" />
                <label htmlFor="activo" className="text-sm font-bold text-slate-700 cursor-pointer">CLIENTE ACTIVO</label>
              </div>
            </div>

            {!editingCliente && (
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="crearUsuario" checked={crearUsuario} onChange={(e) => setCrearUsuario(e.target.checked)}
                    className="h-5 w-5 accent-brand-600 rounded cursor-pointer" />
                  <label htmlFor="crearUsuario" className="text-sm font-bold text-slate-700 cursor-pointer">CREAR ACCESO PORTAL CLIENTE (PWA)</label>
                </div>
                {crearUsuario && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email acceso</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-4 pt-4">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold ml-0 text-sm rounded-xl transition-all">
                CANCELAR
              </button>
              <button onClick={handleSave}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98]">
                {editingCliente ? 'GUARDAR CAMBIOS' : 'CREAR CLIENTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
