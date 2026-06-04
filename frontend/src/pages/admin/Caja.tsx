import React, { useEffect, useState } from 'react';
import { cajaAPI } from '../../services/api';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Filter, 
  Calendar,
  Search,
  X,
  CreditCard
} from 'lucide-react';

export const Caja: React.FC = () => {
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ saldo_actual: 0, total_ingresos: 0, total_egresos: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  
  // New Movement Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [newMov, setNewMov] = useState({
    tipo: 'EGRESO',
    concepto: '',
    monto: '',
    categoria: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movs, summ] = await Promise.all([
        cajaAPI.list({ tipo: filterTipo, categoria: filterCategoria }),
        cajaAPI.getSummary()
      ]);
      setMovimientos(movs);
      setSummary(summ);
    } catch (err) {
      console.error("Error al cargar datos de caja", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterTipo, filterCategoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMov.concepto || !newMov.monto) return;
    
    try {
      await cajaAPI.create({
        ...newMov,
        monto: parseFloat(newMov.monto as string)
      });
      setIsDrawerOpen(false);
      setNewMov({ tipo: 'EGRESO', concepto: '', monto: '', categoria: '' });
      fetchData();
    } catch (err) {
      alert("Error al registrar movimiento");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Está seguro de eliminar este movimiento?")) return;
    try {
      await cajaAPI.delete(id);
      fetchData();
    } catch (err) {
      alert("Error al eliminar movimiento");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Caja y Gastos</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Registro de movimientos diarios y control de gastos.</p>
        </div>
        
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-900/20 active:scale-95"
        >
          <Plus className="h-5 w-5 mr-2" />
          Registrar Movimiento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Actual</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            ${summary.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Ingresos</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            ${summary.total_ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <TrendingDown className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Egresos / Gastos</span>
          </div>
          <div className="text-3xl font-bold text-rose-600">
            ${summary.total_egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex space-x-4">
          <div className="flex-1 max-w-sm relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="">Todos los tipos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="EGRESO">Egresos / Gastos</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6">Concepto / Categoría</th>
                <th className="py-4 px-6 text-right">Monto</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">No hay movimientos registrados</td>
                </tr>
              ) : (
                movimientos.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{new Date(mov.fecha).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-tight ${
                        mov.tipo === 'INGRESO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {mov.tipo}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 uppercase text-xs tracking-tight">{mov.concepto}</div>
                      {mov.categoria && <div className="text-[10px] text-slate-400 font-bold uppercase">{mov.categoria}</div>}
                    </td>
                    <td className={`py-4 px-6 text-right font-black text-base ${mov.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDelete(mov.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
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

      {/* Register Movement Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setIsDrawerOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-lg shadow-brand-900/20">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Nuevo Movimiento</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ingrese el detalle de la operación</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 bg-white text-slate-300 hover:text-slate-900 border border-slate-200 rounded-xl transition-all shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-8 overflow-y-auto">
              {/* Type Switch */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setNewMov({ ...newMov, tipo: 'INGRESO' })}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    newMov.tipo === 'INGRESO' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setNewMov({ ...newMov, tipo: 'EGRESO' })}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    newMov.tipo === 'EGRESO' ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/20' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Egreso / Gasto
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto / Descripción *</label>
                  <input
                    required
                    type="text"
                    value={newMov.concepto}
                    onChange={(e) => setNewMov({ ...newMov, concepto: e.target.value })}
                    placeholder="Ej: Pago de flete, Compra de suministros..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto ($) *</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</div>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={newMov.monto}
                      onChange={(e) => setNewMov({ ...newMov, monto: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría (Opcional)</label>
                  <input
                    type="text"
                    value={newMov.categoria}
                    onChange={(e) => setNewMov({ ...newMov, categoria: e.target.value })}
                    placeholder="Ej: Logística, Sueldos, Oficina..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </form>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100">
              <button
                onClick={handleSubmit}
                className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition-all uppercase tracking-widest active:scale-[0.98] ${
                  newMov.tipo === 'INGRESO' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                }`}
              >
                Confirmar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
