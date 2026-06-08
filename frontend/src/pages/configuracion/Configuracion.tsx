import React, { useEffect, useState } from 'react';
import { listasPreciosAPI, rutasAPI, authAPI, configuracionAPI, permisosAPI, usuariosAPI } from '../../services/api';
import { 
  Settings, 
  Upload, 
  TrendingUp, 
  Truck, 
  FileSpreadsheet, 
  UserCheck, 
  Wrench, 
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  UserPlus,
  Trash2,
  Lock,
  AlertTriangle
} from 'lucide-react';

export const Configuracion: React.FC = () => {
  const [listas, setListas] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState<any[]>([]);
  const [updatingPermisoId, setUpdatingPermisoId] = useState<number | null>(null);

  // User Management State
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRol, setUserRol] = useState('EMPLEADO');
  const [userPin, setUserPin] = useState('');
  const [userValorHora, setUserValorHora] = useState(0);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);


  // Excel Upload State
  const [selectedListId, setSelectedListId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Bulk Updates State
  const [bulkListId, setBulkListId] = useState<number | ''>('');
  const [bulkType, setBulkType] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [bulkVal, setBulkVal] = useState<number>(0);
  const [bulkDept, setBulkDept] = useState('');
  const [updatingBulk, setUpdatingBulk] = useState(false);

  // Routes Management
  const [rutaNombre, setRutaNombre] = useState('');
  const [rutaZona, setRutaZona] = useState('');
  const [rutaDias, setRutaDias] = useState('Lunes, Miércoles, Viernes');
  const [repartidores, setRepartidores] = useState<any[]>([]);
  const [rutaRepartidorId, setRutaRepartidorId] = useState<number | ''>('');

  // General Settings Serial Updates
  const [nextFC, setNextFC] = useState('');
  const [nextRM, setNextRM] = useState('');

  // Data Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resettingData, setResettingData] = useState(false);

  useEffect(() => {
    fetchConfigData();
  }, []);

  const fetchConfigData = async () => {
    setLoading(true);
    try {
      const listasRes = await listasPreciosAPI.list();
      setListas(listasRes);
      
      const rutasRes = await rutasAPI.list();
      setRutas(rutasRes);
      
      const confs = await configuracionAPI.list();
      setConfigs(confs);

      const permsRes = await permisosAPI.list();
      setPermisos(permsRes);
      
      // Filter next numbers
      const fc = confs.find((c: any) => c.clave === 'NUM_FACTURA_SIGUIENTE');
      const rm = confs.find((c: any) => c.clave === 'NUM_REMITO_SIGUIENTE');
      if (fc) setNextFC(fc.valor);
      if (rm) setNextRM(rm.valor);
      
      // Load repartidores
      setRepartidores([
        { id: 4, nombre: "Juan Repartidor" },
        { id: 5, nombre: "Carlos Repartidor" }
      ]);

      const usersRes = await usuariosAPI.list();
      setSystemUsers(usersRes);
    } catch (err) {
      console.error("Error loading config metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermiso = async (id: number, habilitado: boolean) => {
    setUpdatingPermisoId(id);
    try {
      await permisosAPI.update(id, habilitado);
      // Update local state
      setPermisos(prev => prev.map(p => p.id === id ? { ...p, habilitado } : p));
    } catch (err) {
      alert("Error al actualizar permiso");
    } finally {
      setUpdatingPermisoId(null);
    }
  };

  const roles = ['ADMINISTRATIVO', 'VENDEDOR', 'REPARTIDOR', 'EMPLEADO'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadExcel = async () => {
    if (!selectedListId || !selectedFile) {
      alert("Por favor seleccione una lista de precios y un archivo Excel.");
      return;
    }
    setUploading(true);
    try {
      await listasPreciosAPI.importarExcel(Number(selectedListId), selectedFile);
      alert("¡Importación de lista de precios completada exitosamente!");
      setSelectedFile(null);
      fetchConfigData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al subir archivo Excel.");
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkListId || bulkVal === 0) {
      alert("Por favor seleccione la lista y un valor de incremento distinto de 0.");
      return;
    }
    setUpdatingBulk(true);
    try {
      await listasPreciosAPI.actualizarMasivo({
        lista_id: Number(bulkListId),
        tipo_ajuste: bulkType,
        valor: bulkVal,
        departamento: bulkDept || null
      });
      alert("¡Actualización masiva de precios completada!");
      setBulkVal(0);
      setBulkDept('');
      fetchConfigData();
    } catch (err) {
      alert("Error en la actualización de precios.");
    } finally {
      setUpdatingBulk(false);
    }
  };

  const handleCreateRuta = async () => {
    if (!rutaNombre || !rutaZona) {
      alert("Por favor ingrese el nombre y zona de la ruta");
      return;
    }
    try {
      await rutasAPI.create({
        nombre: rutaNombre,
        zona: rutaZona,
        dias_reparto: rutaDias,
        repartidor_id: rutaRepartidorId ? Number(rutaRepartidorId) : null
      });
      alert("¡Nueva ruta creada con éxito!");
      setRutaNombre('');
      setRutaZona('');
      setRutaRepartidorId('');
      fetchConfigData();
    } catch (err) {
      alert("Error al crear ruta de reparto");
    }
  };

  const handleSaveSerials = async () => {
    try {
      await configuracionAPI.update('NUM_FACTURA_SIGUIENTE', nextFC);
      await configuracionAPI.update('NUM_REMITO_SIGUIENTE', nextRM);
      alert("¡Secuencias guardadas!");
      fetchConfigData();
    } catch (err) {
      alert("Error al actualizar secuencias");
    }
  };

  const handleOpenUserModal = (user?: any) => {
    if (user) {
      setEditingUserId(user.id);
      setUserName(user.nombre);
      setUserEmail(user.email);
      setUserPassword('');
      setUserRol(user.rol);
      setUserPin(user.pin || '');
      setUserValorHora(user.valor_hora || 0);
    } else {
      setEditingUserId(null);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      setUserRol('EMPLEADO');
      setUserPin('');
      setUserValorHora(0);
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const payload: any = {
        nombre: userName,
        email: userEmail,
        rol: userRol,
        pin: userRol === 'EMPLEADO' ? userPin : null,
        valor_hora: userRol === 'EMPLEADO' ? userValorHora : 0,
      };

      if (editingUserId) {
        if (userPassword) payload.password = userPassword;
        await usuariosAPI.update(editingUserId, payload);
      } else {
        payload.password = userPassword;
        payload.activo = true;
        await usuariosAPI.create(payload);
      }
      
      setShowUserModal(false);
      const usersRes = await usuariosAPI.list();
      setSystemUsers(usersRes);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este usuario?")) return;
    try {
      await usuariosAPI.delete(id);
      fetchConfigData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  const handleResetData = async () => {
    if (resetConfirmText !== 'BORRAR TODO') {
      alert("Para continuar, debe escribir exactamente 'BORRAR TODO'");
      return;
    }

    setResettingData(true);
    try {
      await configuracionAPI.resetData();
      alert("El sistema ha sido reiniciado exitosamente. Se cerrará la sesión.");
      // Force logout as data is gone
      authAPI.logout(); 
      window.location.href = '/login';
    } catch (err: any) {
      console.error("Error resetting system:", err);
      alert(err.response?.data?.detail || "Error fatal durante el reinicio del sistema.");
    } finally {
      setResettingData(false);
      setShowResetModal(false);
    }
  };

  if (loading) {
// ...
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Configuración del Sistema</h1>
        <p className="text-slate-500 text-sm mt-1">Opciones exclusivas de Superadmin para gestionar módulos, usuarios, precios y logística.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tab: Control de Accesos Dinámico */}
        <div className="lg:col-span-2 border border-slate-200 rounded-3xl bg-white p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Control de Accesos por Módulo</h3>
                <p className="text-slate-500 text-xs">Habilite o deshabilite módulos completos para cada perfil del sistema.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map(rol => (
              <div key={rol} className="flex flex-col space-y-4">
                <div className="px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <h4 className="text-sm font-extrabold text-rose-400 uppercase tracking-widest">{rol}</h4>
                </div>
                
                <div className="space-y-2">
                  {permisos.filter(p => p.rol === rol).sort((a,b) => a.modulo.localeCompare(b.modulo)).map(p => (
                    <div 
                      key={p.id} 
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                        p.habilitado 
                          ? 'bg-emerald-50 border-emerald-100' 
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{p.modulo.replace('_', ' ')}</span>
                      <button
                        onClick={() => handleTogglePermiso(p.id, !p.habilitado)}
                        disabled={updatingPermisoId === p.id}
                        className={`p-1.5 rounded-lg transition-all ${
                          p.habilitado 
                            ? 'text-emerald-500 hover:bg-emerald-500/20' 
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        {updatingPermisoId === p.id ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : p.habilitado ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab: Gestión de Usuarios */}
        <div className="lg:col-span-2 border border-slate-200 rounded-3xl bg-white p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Users className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Gestión de Usuarios</h3>
                <p className="text-slate-500 text-xs">Administre el acceso de empleados y personal del sistema.</p>
              </div>
            </div>
            <button 
              onClick={() => handleOpenUserModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <UserPlus className="h-4 w-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-[10px] uppercase tracking-widest text-slate-500 font-extrabold">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Rol</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {systemUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-500">No hay usuarios registrados.</td></tr>
                )}
                {systemUsers.map(u => (
                  <tr key={u.id} className="text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{u.nombre}</td>
                    <td className="px-6 py-4 text-slate-500">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        u.rol === 'SUPERADMIN' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                        u.rol === 'ADMINISTRATIVO' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                        u.rol === 'EMPLEADO' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center space-x-1 font-bold text-[10px] ${
                        u.activo ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          u.activo ? 'bg-emerald-400' : 'bg-rose-400'
                        }`} />
                        <span>{u.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => handleOpenUserModal(u)}
                          className="p-2 text-slate-500 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-500/10"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab 1: Excel Pricing Importer */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Upload className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-900">Importador de Precios (Excel)</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Actualice masivamente descripciones, costos, precios, existencias y familias desde una planilla Excel. El sistema limpiará los prefijos numéricos de los códigos automáticamente.
          </p>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Lista de Precios Destino</label>
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                {listas.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre} (Prefijo: {l.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Archivo .xlsx</label>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-rose-600 hover:file:bg-slate-200"
              />
            </div>

            <button
              onClick={handleUploadExcel}
              disabled={uploading || !selectedListId || !selectedFile}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {uploading ? 'Importando...' : 'Iniciar Importación'}
            </button>
          </div>
        </div>

        {/* Tab 2: Bulk Pricing Editor */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <TrendingUp className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-900">Actualización Masiva de Precios</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Incremente o decremente precios de venta y mayoreo en pesos o por porcentaje. Filtre opcionalmente por departamento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lista a Afectar</label>
              <select
                value={bulkListId}
                onChange={(e) => setBulkListId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                {listas.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoría (Opcional)</label>
              <select
                value={bulkDept}
                onChange={(e) => setBulkDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="">Todas</option>
                <option value="Cortes frescos">Cortes frescos</option>
                <option value="Chacinados">Chacinados</option>
                <option value="Salazones">Salazones</option>
                <option value="Embutidos">Embutidos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo Ajuste</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor de Ajuste (+/-)</label>
              <input
                type="number"
                value={bulkVal}
                onChange={(e) => setBulkVal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleBulkUpdate}
            disabled={updatingBulk || !bulkListId || bulkVal === 0}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50"
          >
            {updatingBulk ? 'Ajustando Precios...' : 'Aplicar Ajuste de Precios'}
          </button>
        </div>

        {/* Tab 3: Delivery Routes CRUD */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Truck className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-900">Rutas y Logística de Reparto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de Ruta</label>
              <input
                type="text"
                placeholder="Ruta Sur, Córdoba Centro..."
                value={rutaNombre}
                onChange={(e) => setRutaNombre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zona Cobertura</label>
              <input
                type="text"
                placeholder="Zona Sur / CPC Villa Libertador"
                value={rutaZona}
                onChange={(e) => setRutaZona(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Días Reparto</label>
              <input
                type="text"
                value={rutaDias}
                onChange={(e) => setRutaDias(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chofer Asignado</label>
              <select
                value={rutaRepartidorId}
                onChange={(e) => setRutaRepartidorId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-rose-500"
              >
                <option value="">Sin Asignar</option>
                {repartidores.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCreateRuta}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Registrar Nueva Ruta
          </button>

          {/* List of active routes */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rutas Registradas</h4>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50 max-h-[200px] overflow-y-auto">
              {rutas.map(r => (
                <div key={r.id} className="p-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{r.nombre}</span>
                    <span className="text-slate-500 block text-[10px]">{r.zona} • Reparto: {r.dias_reparto}</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Chofer: {r.repartidor?.nombre || 'Ninguno'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab 4: System Parameters & Serials */}
        <div className="border border-slate-200 rounded-2xl bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Wrench className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-900">Parámetros del Sistema</h3>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Próximo Nro. Correlativo Factura</label>
              <input
                type="text"
                value={nextFC}
                onChange={(e) => setNextFC(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Próximo Nro. Correlativo Remito</label>
              <input
                type="text"
                value={nextRM}
                onChange={(e) => setNextRM(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleSaveSerials}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Guardar Cambios de Secuencias
            </button>
          </div>
        </div>

        {/* Zona de Peligro */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/20" />
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-black text-rose-600 flex items-center justify-center md:justify-start space-x-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Zona de Peligro</span>
              </h3>
              <p className="text-rose-700/70 text-sm font-bold max-w-xl">
                Reiniciar el sistema borrará permanentemente todos los pedidos, clientes, productos, caja y movimientos. 
                Esta acción no se puede deshacer.
              </p>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-200 transition-all flex items-center space-x-2 whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 ${resettingData ? 'animate-spin' : ''}`} />
              <span>Puesta a Cero (Reset)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Nuevo Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl relative">
            <h3 className="text-2xl font-black text-white flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-indigo-500" />
              <span>{editingUserId ? 'Editar Usuario' : 'Registrar Usuario'}</span>
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Email de Acceso</label>
                <input 
                  type="email" 
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                  placeholder="ejemplo@frigoapp.com"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                  {editingUserId ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    required={!editingUserId}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rol del Sistema</label>
                <select 
                  value={userRol}
                  onChange={(e) => setUserRol(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {userRol === 'EMPLEADO' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">PIN de Asistencia</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={userPin}
                      onChange={(e) => setUserPin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold tracking-widest"
                      placeholder="Ej: 1234"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Valor Hora ($)</label>
                    <input 
                      type="number" 
                      value={userValorHora}
                      onChange={(e) => setUserValorHora(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={creatingUser}
                  className="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {creatingUser ? 'Guardando...' : editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Data */}
      {showResetModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-rose-600" />
            
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">¿Reiniciar Sistema?</h3>
              <p className="text-slate-500 text-sm font-bold">
                Esta acción es <span className="text-rose-600 underline text-lg">TOTALMENTE DESTRUCTIVA</span>. 
                Se eliminarán todos los registros operativos y no se podrán recuperar.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2 text-center">
                  Escriba <span className="text-white bg-rose-600 px-2 py-0.5 rounded">BORRAR TODO</span> para confirmar
                </label>
                <input 
                  type="text" 
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full bg-transparent text-slate-900 text-center font-black tracking-widest focus:outline-none placeholder:text-slate-300"
                  placeholder="---"
                />
              </div>

              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleResetData}
                  disabled={resetConfirmText !== 'BORRAR TODO' || resettingData}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-rose-200"
                >
                  {resettingData ? 'Borrando Sistema...' : 'Confirmar Puesta a Cero'}
                </button>
                <button 
                  onClick={() => {
                    setShowResetModal(false);
                    setResetConfirmText('');
                  }}
                  disabled={resettingData}
                  className="w-full py-4 text-slate-400 hover:text-slate-600 text-sm font-bold transition-all"
                >
                  Cancelar y Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
