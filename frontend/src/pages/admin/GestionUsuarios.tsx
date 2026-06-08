import React, { useEffect, useState } from 'react';
import { usuariosAPI } from '../../services/api';
import { Users, UserPlus, Trash2, Lock, RefreshCw } from 'lucide-react';

const ROL_STYLES: Record<string, string> = {
  SUPERADMIN:    'bg-rose-100 text-rose-700 border-rose-200',
  ADMINISTRATIVO:'bg-indigo-100 text-indigo-700 border-indigo-200',
  VENDEDOR:      'bg-sky-100 text-sky-700 border-sky-200',
  REPARTIDOR:    'bg-amber-100 text-amber-700 border-amber-200',
  EMPLEADO:      'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const GestionUsuarios: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [form, setForm] = useState({ 
    nombre: '', 
    email: '', 
    password: '', 
    rol: 'EMPLEADO',
    pin: '',
    valor_hora: 0
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await usuariosAPI.list());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setForm({ nombre: '', email: '', password: '', rol: 'EMPLEADO', pin: '', valor_hora: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUserId(u.id);
    setForm({ 
      nombre: u.nombre, 
      email: u.email, 
      password: '', // Mantener vacío para no cambiar
      rol: u.rol,
      pin: u.pin || '',
      valor_hora: u.valor_hora || 0
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { 
        ...form, 
        pin: form.rol === 'EMPLEADO' ? form.pin : null,
        valor_hora: form.rol === 'EMPLEADO' ? form.valor_hora : 0,
      };

      if (editingUserId) {
        if (!payload.password) delete payload.password;
        await usuariosAPI.update(editingUserId, payload);
      } else {
        await usuariosAPI.create({ ...payload, activo: true });
      }

      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    try {
      await usuariosAPI.delete(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">Administre empleados y personal del sistema.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 text-brand-500 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-400 font-extrabold">
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Rol</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors text-sm">
                  <td className="px-6 py-4 font-bold text-slate-900">{u.nombre}</td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold border ${ROL_STYLES[u.rol] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center space-x-1.5 text-xs font-bold ${u.activo ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span>{u.activo ? 'Activo' : 'Inactivo'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {['SUPERADMIN','ADMINISTRATIVO','VENDEDOR','REPARTIDOR','EMPLEADO'].map(rol => {
          const count = users.filter(u => u.rol === rol).length;
          return (
            <div key={rol} className={`px-4 py-2 rounded-xl border text-xs font-extrabold ${ROL_STYLES[rol] || ''}`}>
              {rol}: {count}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl space-y-5">
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2 text-sm">
              <UserPlus className="h-5 w-5 text-brand-600" />
              <span>{editingUserId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                <input
                  required type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email de Acceso</label>
                <input
                  required type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {editingUserId ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    required={!editingUserId}
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol del Sistema</label>
                <select
                  value={form.rol}
                  onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold bg-white"
                >
                  <option value="EMPLEADO">Empleado — Solo reloj control horario</option>
                  <option value="REPARTIDOR">Repartidor / Logística</option>
                  <option value="VENDEDOR">Vendedor / Comercial</option>
                  <option value="ADMINISTRATIVO">Administración</option>
                  <option value="SUPERADMIN">Super Administrador</option>
                </select>
              </div>

              {form.rol === 'EMPLEADO' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">PIN de Asistencia</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={form.pin}
                      onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold tracking-widest text-sm"
                      placeholder="Ej: 1234"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor Hora ($)</label>
                    <input
                      type="number"
                      value={form.valor_hora}
                      onChange={e => setForm(f => ({ ...f, valor_hora: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
