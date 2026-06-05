import React, { useEffect, useState, useCallback } from 'react';
import { cajaAPI } from '../../services/api';
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  X,
  CreditCard,
  Lock,
  Unlock,
  Hash,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';

type Tab = 'caja' | 'conceptos';

export const Caja: React.FC = () => {
  const [tab, setTab] = useState<Tab>('caja');

  // Session state
  const [sesionActiva, setSesionActiva] = useState<any | null>(null);
  const [loadingSesion, setLoadingSesion] = useState(true);
  const [abrirModal, setAbrirModal] = useState(false);
  const [cerrarModal, setCerrarModal] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  const [obsSesion, setObsSesion] = useState('');

  // Movements
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ saldo_actual: 0, total_ingresos: 0, total_egresos: 0 });
  const [loadingMovs, setLoadingMovs] = useState(false);

  // Conceptos catalog
  const [conceptos, setConceptos] = useState<any[]>([]);
  const [loadingConceptos, setLoadingConceptos] = useState(false);

  // New movement drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [codigoInput, setCodigoInput] = useState('');
  const [selectedConcepto, setSelectedConcepto] = useState<any | null>(null);
  const [conceptoLibre, setConceptoLibre] = useState('');
  const [monto, setMonto] = useState('');
  const [tipoManual, setTipoManual] = useState<'INGRESO' | 'EGRESO'>('EGRESO');

  // Concepto management (Conceptos tab)
  const [newConcepto, setNewConcepto] = useState({ codigo: '', nombre: '', tipo: 'EGRESO' });
  const [savingConcepto, setSavingConcepto] = useState(false);

  const fetchSesion = useCallback(async () => {
    try {
      setLoadingSesion(true);
      const sesion = await cajaAPI.getSesionActiva();
      setSesionActiva(sesion);
    } catch {
      setSesionActiva(null);
    } finally {
      setLoadingSesion(false);
    }
  }, []);

  const fetchMovimientos = useCallback(async (sesionId?: number) => {
    try {
      setLoadingMovs(true);
      const [movs, summ] = await Promise.all([
        sesionId
          ? cajaAPI.getMovimientosSesion(sesionId)
          : cajaAPI.list(),
        cajaAPI.getSummary()
      ]);
      setMovimientos(movs);
      setSummary(summ);
    } catch (err) {
      console.error('Error cargando movimientos', err);
    } finally {
      setLoadingMovs(false);
    }
  }, []);

  const fetchConceptos = useCallback(async () => {
    try {
      setLoadingConceptos(true);
      const data = await cajaAPI.getConceptos();
      setConceptos(data);
    } catch {
      setConceptos([]);
    } finally {
      setLoadingConceptos(false);
    }
  }, []);

  useEffect(() => {
    fetchSesion();
    fetchConceptos();
  }, []);

  useEffect(() => {
    if (!loadingSesion) {
      fetchMovimientos(sesionActiva?.id);
    }
  }, [sesionActiva, loadingSesion]);

  // ── Session actions ─────────────────────────────────────────────────────────

  const handleAbrirCaja = async () => {
    if (!montoApertura) return;
    try {
      const sesion = await cajaAPI.abrirSesion({ monto_apertura: parseFloat(montoApertura), observaciones: obsSesion });
      setSesionActiva(sesion);
      setAbrirModal(false);
      setMontoApertura('');
      setObsSesion('');
      fetchMovimientos(sesion.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al abrir la caja');
    }
  };

  const handleCerrarCaja = async () => {
    if (!sesionActiva || !montoCierre) return;
    try {
      await cajaAPI.cerrarSesion(sesionActiva.id, { monto_cierre: parseFloat(montoCierre), observaciones: obsSesion });
      setCerrarModal(false);
      setMontoCierre('');
      setObsSesion('');
      fetchSesion();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al cerrar la caja');
    }
  };

  // ── Codigo quick-select ──────────────────────────────────────────────────────

  const handleCodigoChange = (val: string) => {
    setCodigoInput(val);
    const code = parseInt(val, 10);
    if (!isNaN(code)) {
      const found = conceptos.find(c => c.codigo === code && c.activo);
      if (found) {
        setSelectedConcepto(found);
        setConceptoLibre(found.nombre);
        setTipoManual(found.tipo);
      } else {
        setSelectedConcepto(null);
      }
    } else {
      setSelectedConcepto(null);
    }
  };

  // ── Create movement ──────────────────────────────────────────────────────────

  const handleSubmitMovimiento = async () => {
    const textoConcepto = conceptoLibre.trim() || (selectedConcepto?.nombre ?? '');
    if (!textoConcepto || !monto) {
      alert('Complete el concepto y el monto');
      return;
    }
    try {
      await cajaAPI.create({
        tipo: selectedConcepto ? selectedConcepto.tipo : tipoManual,
        concepto: textoConcepto,
        monto: parseFloat(monto),
        concepto_id: selectedConcepto?.id ?? null,
        sesion_id: sesionActiva?.id ?? null
      });
      setIsDrawerOpen(false);
      setCodigoInput('');
      setSelectedConcepto(null);
      setConceptoLibre('');
      setMonto('');
      fetchMovimientos(sesionActiva?.id);
    } catch {
      alert('Error al registrar movimiento');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      await cajaAPI.delete(id);
      fetchMovimientos(sesionActiva?.id);
    } catch {
      alert('Error al eliminar');
    }
  };

  // ── Concepto CRUD ────────────────────────────────────────────────────────────

  const handleCreateConcepto = async () => {
    if (!newConcepto.codigo || !newConcepto.nombre) return;
    setSavingConcepto(true);
    try {
      await cajaAPI.createConcepto({ ...newConcepto, codigo: parseInt(newConcepto.codigo, 10) });
      setNewConcepto({ codigo: '', nombre: '', tipo: 'EGRESO' });
      fetchConceptos();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al crear concepto');
    } finally {
      setSavingConcepto(false);
    }
  };

  const handleDeleteConcepto = async (id: number) => {
    if (!window.confirm('¿Eliminar este concepto?')) return;
    try {
      await cajaAPI.deleteConcepto(id);
      fetchConceptos();
    } catch {
      alert('Error al eliminar concepto');
    }
  };

  // ── Derived type for new movement ────────────────────────────────────────────
  const efectivoTipo = selectedConcepto ? selectedConcepto.tipo : tipoManual;

  const filteredConceptos = conceptos.filter(c =>
    c.activo && (
      c.nombre.toLowerCase().includes(conceptoLibre.toLowerCase()) ||
      String(c.codigo).includes(codigoInput)
    )
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Caja</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Control de sesiones y movimientos de caja.</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-2xl p-1">
            <button
              onClick={() => setTab('caja')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'caja' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <DollarSign className="h-4 w-4 inline mr-1" />Caja
            </button>
            <button
              onClick={() => setTab('conceptos')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === 'conceptos' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Settings className="h-4 w-4 inline mr-1" />Conceptos
            </button>
          </div>
        </div>
      </div>

      {/* ── CAJA TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'caja' && (
        <>
          {/* Session Banner */}
          {loadingSesion ? (
            <div className="h-24 bg-white rounded-3xl border border-slate-200 animate-pulse" />
          ) : sesionActiva ? (
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-emerald-900/20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Unlock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Caja Abierta</p>
                  <p className="text-white font-black text-xl">
                    Apertura: ${sesionActiva.monto_apertura.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-emerald-200 text-xs font-medium">
                    {new Date(sesionActiva.fecha_apertura).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center px-5 py-3 bg-white text-emerald-700 font-black text-xs rounded-2xl hover:bg-emerald-50 transition-all shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />Registrar
                </button>
                <button
                  onClick={() => { setMontoCierre(''); setObsSesion(''); setCerrarModal(true); }}
                  className="flex items-center px-5 py-3 bg-white/20 text-white font-black text-xs rounded-2xl hover:bg-white/30 border border-white/30 transition-all"
                >
                  <Lock className="h-4 w-4 mr-2" />Cerrar Caja
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 flex items-center justify-between shadow-xl shadow-orange-900/20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest">Caja Cerrada</p>
                  <p className="text-white font-black text-xl">Sin sesión activa</p>
                  <p className="text-orange-200 text-xs font-medium">Abra la caja para registrar movimientos</p>
                </div>
              </div>
              <button
                onClick={() => { setMontoApertura(''); setObsSesion(''); setAbrirModal(true); }}
                className="flex items-center px-6 py-3 bg-white text-orange-600 font-black text-sm rounded-2xl hover:bg-orange-50 transition-all shadow-lg"
              >
                <Unlock className="h-5 w-5 mr-2" />Abrir Caja
              </button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-50 rounded-xl text-brand-600"><DollarSign className="h-6 w-6" /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Sesión</span>
              </div>
              <div className={`text-3xl font-bold ${summary.saldo_actual >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                ${summary.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              {sesionActiva && (
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Apertura: ${sesionActiva.monto_apertura.toLocaleString('es-AR')}</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp className="h-6 w-6" /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Ingresos</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                ${summary.total_ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><TrendingDown className="h-6 w-6" /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Egresos</span>
              </div>
              <div className="text-3xl font-bold text-rose-600">
                ${summary.total_egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                {sesionActiva ? `Movimientos de la sesión` : 'Historial de movimientos'}
              </h2>
              {sesionActiva && (
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Sesión #{sesionActiva.id} abierta
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/50">
                    <th className="py-4 px-6">Fecha / Hora</th>
                    <th className="py-4 px-6">Código</th>
                    <th className="py-4 px-6">Concepto</th>
                    <th className="py-4 px-6">Tipo</th>
                    <th className="py-4 px-6 text-right">Monto</th>
                    <th className="py-4 px-6 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingMovs ? (
                    <tr><td colSpan={6} className="py-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" /></td></tr>
                  ) : movimientos.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-300 italic text-sm">No hay movimientos en esta sesión</td></tr>
                  ) : (
                    movimientos.map((mov) => (
                      <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{new Date(mov.fecha).toLocaleDateString('es-AR')}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{new Date(mov.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="py-4 px-6">
                          {mov.concepto_ref ? (
                            <span className="font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg text-xs border border-brand-100">
                              {mov.concepto_ref.codigo}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 uppercase text-xs tracking-tight">{mov.concepto}</div>
                          {mov.categoria && <div className="text-[10px] text-slate-400 font-bold uppercase">{mov.categoria}</div>}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-tight ${mov.tipo === 'INGRESO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {mov.tipo}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-black text-base ${mov.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleDelete(mov.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── CONCEPTOS TAB ────────────────────────────────────────────────────── */}
      {tab === 'conceptos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create form */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 h-fit shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-50 rounded-xl text-brand-600"><Hash className="h-5 w-5" /></div>
              <h2 className="text-lg font-black text-slate-900">Nuevo Concepto</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código Numérico *</label>
                <input
                  type="number"
                  value={newConcepto.codigo}
                  onChange={e => setNewConcepto({ ...newConcepto, codigo: e.target.value })}
                  placeholder="Ej: 1010"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-brand-600 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre *</label>
                <input
                  type="text"
                  value={newConcepto.nombre}
                  onChange={e => setNewConcepto({ ...newConcepto, nombre: e.target.value })}
                  placeholder="Ej: Gastos de Combustible"
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</label>
                <div className="flex mt-1 bg-slate-100 rounded-2xl p-1">
                  <button
                    onClick={() => setNewConcepto({ ...newConcepto, tipo: 'INGRESO' })}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${newConcepto.tipo === 'INGRESO' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'}`}
                  >Ingreso</button>
                  <button
                    onClick={() => setNewConcepto({ ...newConcepto, tipo: 'EGRESO' })}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${newConcepto.tipo === 'EGRESO' ? 'bg-rose-500 text-white shadow' : 'text-slate-500'}`}
                  >Egreso</button>
                </div>
              </div>
              <button
                onClick={handleCreateConcepto}
                disabled={savingConcepto || !newConcepto.codigo || !newConcepto.nombre}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-2xl transition-all shadow-lg shadow-brand-900/20 disabled:opacity-40 uppercase tracking-widest"
              >
                {savingConcepto ? 'Guardando...' : 'Crear Concepto'}
              </button>
            </div>
          </div>

          {/* Concepts list */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6">Conceptos Configurados</h2>
            {loadingConceptos ? (
              <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
            ) : conceptos.length === 0 ? (
              <div className="py-12 text-center text-slate-300 italic">No hay conceptos creados aún</div>
            ) : (
              <div className="space-y-3">
                {conceptos.map(c => (
                  <div key={c.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${c.activo ? 'bg-slate-50 border-slate-100' : 'bg-slate-100/50 border-slate-100 opacity-50'}`}>
                    <div className="flex items-center space-x-4">
                      <span className="font-black text-brand-600 bg-white px-3 py-1.5 rounded-xl text-sm border border-brand-100 shadow-sm min-w-[64px] text-center">
                        {c.codigo}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{c.nombre}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${c.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {c.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => cajaAPI.updateConcepto(c.id, { activo: !c.activo }).then(fetchConceptos)}
                        className={`p-2 rounded-xl transition-all text-xs font-bold ${c.activo ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                      >
                        {c.activo ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteConcepto(c.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ABRIR CAJA MODAL ─────────────────────────────────────────────────── */}
      {abrirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Unlock className="h-6 w-6" /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Abrir Caja</h3>
                <p className="text-xs text-slate-400 font-medium">Ingrese el dinero inicial en caja</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Apertura ($) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={montoApertura}
                    onChange={e => setMontoApertura(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observaciones</label>
                <input
                  type="text"
                  value={obsSesion}
                  onChange={e => setObsSesion(e.target.value)}
                  placeholder="Opcional..."
                  className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setAbrirModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
              <button onClick={handleAbrirCaja} disabled={!montoApertura} className="flex-1 py-3 bg-emerald-600 text-white font-black text-xs rounded-2xl uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all disabled:opacity-40">Abrir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CERRAR CAJA MODAL ────────────────────────────────────────────────── */}
      {cerrarModal && sesionActiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><Lock className="h-6 w-6" /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Cerrar Caja</h3>
                <p className="text-xs text-slate-400 font-medium">Ingrese el efectivo en caja al cierre</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1 text-xs font-bold">
              <div className="flex justify-between text-slate-500">
                <span>Apertura</span>
                <span>${sesionActiva.monto_apertura.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>+ Ingresos</span>
                <span>${summary.total_ingresos.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>- Egresos</span>
                <span>${summary.total_egresos.toLocaleString('es-AR')}</span>
              </div>
              <div className="border-t border-slate-200 pt-1 flex justify-between text-slate-900 text-sm font-black">
                <span>Esperado</span>
                <span>${summary.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo en Caja al Cierre ($) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={montoCierre}
                    onChange={e => setMontoCierre(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-9 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                  />
                </div>
                {montoCierre && (
                  <p className={`text-xs font-bold mt-2 ${parseFloat(montoCierre) >= summary.saldo_actual ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Diferencia: ${(parseFloat(montoCierre) - summary.saldo_actual).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setCerrarModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-black text-xs rounded-2xl uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
              <button onClick={handleCerrarCaja} disabled={!montoCierre} className="flex-1 py-3 bg-rose-600 text-white font-black text-xs rounded-2xl uppercase tracking-widest shadow-lg shadow-rose-900/20 hover:bg-rose-700 transition-all disabled:opacity-40">Cerrar Caja</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER NUEVO MOVIMIENTO ──────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-lg shadow-brand-900/20">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nuevo Movimiento</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {sesionActiva ? `Sesión #${sesionActiva.id}` : 'Sin sesión activa'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-white text-slate-300 hover:text-slate-900 border border-slate-200 rounded-xl transition-all shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto">
              {/* Codigo input - key feature */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Hash className="h-3 w-3 mr-1" />Código de Concepto (tipee para seleccionar)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={codigoInput}
                    onChange={e => handleCodigoChange(e.target.value)}
                    placeholder="1010"
                    className={`w-28 px-4 py-4 border rounded-2xl text-2xl font-black text-center focus:outline-none focus:ring-2 transition-all font-mono ${selectedConcepto ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20' : 'border-slate-200 bg-slate-50 text-slate-900'}`}
                  />
                  {selectedConcepto ? (
                    <div className="flex-1 p-4 bg-brand-50 border border-brand-200 rounded-2xl">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Concepto seleccionado</p>
                      <p className="font-black text-brand-900 text-sm mt-0.5">{selectedConcepto.nombre}</p>
                      <span className={`text-[10px] font-bold uppercase ${selectedConcepto.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>{selectedConcepto.tipo}</span>
                    </div>
                  ) : (
                    <div className="flex-1 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin concepto seleccionado</p>
                      <p className="text-[9px] text-slate-300 mt-0.5">Complete el detalle abajo</p>
                    </div>
                  )}
                </div>

                {/* Quick suggestion list */}
                {codigoInput && !selectedConcepto && filteredConceptos.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                    {filteredConceptos.slice(0, 5).map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedConcepto(c); setCodigoInput(String(c.codigo)); setConceptoLibre(c.nombre); setTipoManual(c.tipo); }}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-brand-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-black text-brand-600 text-sm w-12 text-left">{c.codigo}</span>
                          <span className="text-sm font-bold text-slate-800">{c.nombre}</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${c.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>{c.tipo}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual type selector (only if no concepto selected) */}
              {!selectedConcepto && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Movimiento</label>
                  <div className="flex mt-2 p-1 bg-slate-100 rounded-2xl">
                    <button type="button" onClick={() => setTipoManual('INGRESO')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tipoManual === 'INGRESO' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Ingreso</button>
                    <button type="button" onClick={() => setTipoManual('EGRESO')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${tipoManual === 'EGRESO' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Egreso</button>
                  </div>
                </div>
              )}

              {/* Concepto text */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción *</label>
                <input
                  type="text"
                  value={conceptoLibre}
                  onChange={e => setConceptoLibre(e.target.value)}
                  placeholder={selectedConcepto ? selectedConcepto.nombre : "Ingrese una descripción..."}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto ($) *</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
              <button
                onClick={handleSubmitMovimiento}
                className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition-all uppercase tracking-widest active:scale-[0.98] ${efectivoTipo === 'INGRESO' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'}`}
              >
                Confirmar {efectivoTipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
