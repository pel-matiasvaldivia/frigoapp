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
  Lock
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
  const [creatingUser, setCreatingUser] = useState(false);

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

  const roles = ['ADMINISTRATIVO', 'VENDEDOR', 'REPARTIDOR'];

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await usuariosAPI.create({
        nombre: userName,
        email: userEmail,
        password: userPassword,
        rol: userRol,
        activo: true
      });
      alert("Usuario creado exitosamente");
      setShowUserModal(false);
      setUserName('');
      setUserEmail('');
      setUserPassword('');
      fetchConfigData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al crear usuario");
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

  if (loading) {
// ...
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Configuración del Sistema</h1>
        <p className="text-slate-400 text-sm mt-1">Opciones exclusivas de Superadmin para gestionar módulos, usuarios, precios y logística.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tab: Control de Accesos Dinámico */}
        <div className="lg:col-span-2 border border-slate-800 rounded-3xl bg-slate-900/40 p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-500/20 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Control de Accesos por Módulo</h3>
                <p className="text-slate-400 text-xs">Habilite o deshabilite módulos completos para cada perfil del sistema.</p>
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
                          ? 'bg-emerald-500/10 border-emerald-500/20' 
                          : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-tight">{p.modulo.replace('_', ' ')}</span>
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
        <div className="lg:col-span-2 border border-slate-800 rounded-3xl bg-slate-900/40 p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                <Users className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Gestión de Usuarios</h3>
                <p className="text-slate-400 text-xs">Administre el acceso de empleados y personal del sistema.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowUserModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <UserPlus className="h-4 w-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/40 text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Rol</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {systemUsers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-500">No hay usuarios registrados.</td></tr>
                )}
                {systemUsers.map(u => (
                  <tr key={u.id} className="text-xs text-slate-300 hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{u.nombre}</td>
                    <td className="px-6 py-4 text-slate-400">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        u.rol === 'SUPERADMIN' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        u.rol === 'ADMINISTRATIVO' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
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
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tab 1: Excel Pricing Importer */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Upload className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Importador de Precios (Excel)</h3>
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                {listas.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre} (Prefijo: {l.id})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Archivo .xlsx</label>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-rose-450 hover:file:bg-slate-750"
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
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <TrendingUp className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Actualización Masiva de Precios</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Incremente o decremente precios de venta y mayoreo en pesos o por porcentaje. Filtre opcionalmente por departamento.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Lista a Afectar</label>
              <select
                value={bulkListId}
                onChange={(e) => setBulkListId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="">Seleccione...</option>
                {listas.map(l => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Categoría (Opcional)</label>
              <select
                value={bulkDept}
                onChange={(e) => setBulkDept(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="">Todas</option>
                <option value="Cortes frescos">Cortes frescos</option>
                <option value="Chacinados">Chacinados</option>
                <option value="Salazones">Salazones</option>
                <option value="Embutidos">Embutidos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Tipo Ajuste</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Valor de Ajuste (+/-)</label>
              <input
                type="number"
                value={bulkVal}
                onChange={(e) => setBulkVal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
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
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Truck className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Rutas y Logística de Reparto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Nombre de Ruta</label>
              <input
                type="text"
                placeholder="Ruta Sur, Córdoba Centro..."
                value={rutaNombre}
                onChange={(e) => setRutaNombre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Zona Cobertura</label>
              <input
                type="text"
                placeholder="Zona Sur / CPC Villa Libertador"
                value={rutaZona}
                onChange={(e) => setRutaZona(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Días Reparto</label>
              <input
                type="text"
                value={rutaDias}
                onChange={(e) => setRutaDias(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Chofer Asignado</label>
              <select
                value={rutaRepartidorId}
                onChange={(e) => setRutaRepartidorId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rutas Registradas</h4>
            <div className="border border-slate-800 rounded-xl divide-y divide-slate-800 bg-slate-950/20 max-h-[200px] overflow-y-auto">
              {rutas.map(r => (
                <div key={r.id} className="p-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{r.nombre}</span>
                    <span className="text-slate-450 block text-[10px]">{r.zona} • Reparto: {r.dias_reparto}</span>
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
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Wrench className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Parámetros del Sistema</h3>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Próximo Nro. Correlativo Factura</label>
              <input
                type="text"
                value={nextFC}
                onChange={(e) => setNextFC(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-405 uppercase tracking-wider mb-2">Próximo Nro. Correlativo Remito</label>
              <input
                type="text"
                value={nextRM}
                onChange={(e) => setNextRM(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none"
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

      </div>

      {/* Modal: Nuevo Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl relative">
            <h3 className="text-2xl font-black text-white flex items-center space-x-2">
              <UserPlus className="h-6 w-6 text-indigo-500" />
              <span>Registrar Usuario</span>
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
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
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input 
                    type="password" 
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Rol asignado</label>
                <select 
                  value={userRol}
                  onChange={(e) => setUserRol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-bold appearance-none"
                >
                  <option value="EMPLEADO">Empleado (Solo Reloj Control)</option>
                  <option value="REPARTIDOR">Repartidor / Logística</option>
                  <option value="VENDEDOR">Vendedor / Comercial</option>
                  <option value="ADMINISTRATIVO">Administración</option>
                  <option value="SUPERADMIN">Super Administrador</option>
                </select>
              </div>

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
                  {creatingUser ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
