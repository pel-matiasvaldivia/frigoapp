import React, { useState, useEffect } from 'react';
import { asistenciaAPI } from '../../services/api';
import { 
  Calendar, 
  Users, 
  Clock, 
  DollarSign, 
  Download, 
  Search, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  History
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

const AsistenciaAdmin: React.FC = () => {
  const [desde, setDesde] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [hasta, setHasta] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [reporte, setReporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    fetchReporte();
  }, [desde, hasta]);

  const fetchReporte = async () => {
    setLoading(true);
    try {
      const data = await asistenciaAPI.getReporte(desde, hasta);
      setReporte(data);
    } catch (err) {
      console.error("Error al cargar reporte de asistencia:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalGeneral = reporte.reduce((acc, curr) => acc + curr.total_a_pagar, 0);
  const horasTotales = reporte.reduce((acc, curr) => acc + curr.total_horas, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
            <Clock className="h-7 w-7 text-rose-600" />
            <span>Control de Asistencia y Sueldos</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold">Liquidación semanal y seguimiento de horas trabajadas.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => {
              const prev = subWeeks(new Date(desde), 1);
              setDesde(format(startOfWeek(prev, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
              setHasta(format(endOfWeek(prev, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            }}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
          </button>
          <div className="flex items-center space-x-2 px-3">
            <Calendar className="h-4 w-4 text-rose-500" />
            <input 
              type="date" 
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="text-xs font-black text-slate-700 bg-transparent focus:outline-none"
            />
            <span className="text-slate-300">/</span>
            <input 
              type="date" 
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="text-xs font-black text-slate-700 bg-transparent focus:outline-none"
            />
          </div>
          <button 
            onClick={() => {
              const next = new Date(hasta);
              next.setDate(next.getDate() + 1);
              setDesde(format(startOfWeek(next, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
              setHasta(format(endOfWeek(next, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
            }}
            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Activo</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{reporte.length}</div>
          <div className="text-xs text-slate-500 font-bold">Empleados con registros</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas Totales</span>
            <History className="h-5 w-5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{horasTotales.toFixed(1)}h</div>
          <div className="text-xs text-slate-500 font-bold">Productividad del período</div>
        </div>

        <div className="bg-rose-600 border border-rose-500 rounded-3xl p-6 shadow-lg shadow-rose-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Total a Liquidar</span>
            <DollarSign className="h-5 w-5 text-rose-100" />
          </div>
          <div className="text-3xl font-black text-white">${totalGeneral.toLocaleString()}</div>
          <div className="text-xs text-rose-100 font-bold">Monto acumulado sugerido</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">Resumen de Liquidación</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
            <Download className="h-4 w-4" />
            <span>Exportar Planilla</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-8 py-4">Empleado</th>
                <th className="px-8 py-4 text-center">Horas</th>
                <th className="px-8 py-4 text-center">Tardanza</th>
                <th className="px-8 py-4 text-center">Hs. Extra</th>
                <th className="px-8 py-4 text-center">Valor Hora</th>
                <th className="px-8 py-4 text-right">Subtotal</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reporte.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                    No hay registros de asistencia para este período.
                  </td>
                </tr>
              )}
              {reporte.map(row => (
                <tr key={row.usuario_id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 uppercase">
                        {row.usuario_nombre.charAt(0)}
                      </div>
                      <span className="font-black text-slate-900 uppercase tracking-tight">{row.usuario_nombre}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-black text-xs">
                      {row.total_horas.toFixed(2)}h
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`${row.total_tardanza > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'} px-3 py-1 rounded-lg font-black text-xs whitespace-nowrap`}>
                      {row.total_tardanza} min
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`${row.total_horas_extra > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'} px-3 py-1 rounded-lg font-black text-xs whitespace-nowrap`}>
                      +{row.total_horas_extra.toFixed(2)}h
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-500">
                    ${row.valor_hora.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">
                    ${row.total_a_pagar.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => setSelectedUser(row)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">{selectedUser.usuario_nombre}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Historial de Fichaje</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-4 hover:bg-slate-100 rounded-3xl transition-all font-black text-slate-400"
              >
                Cerrar
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-4">
              {selectedUser.registros.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white rounded-xl text-rose-500 border border-slate-100">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">
                        {format(new Date(reg.entrada), "eeee dd 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {format(new Date(reg.entrada), 'HH:mm')} - {reg.salida ? format(new Date(reg.salida), 'HH:mm') : 'En curso'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-black text-slate-900">{reg.horas.toFixed(2)}h</p>
                    <div className="flex items-center justify-end space-x-2">
                       {reg.tardanza > 0 && (
                         <span className="text-[10px] text-rose-500 font-black uppercase">-{reg.tardanza}m tardanza</span>
                       )}
                       {reg.horas_extra > 0 && (
                         <span className="text-[10px] text-emerald-500 font-black uppercase">+{reg.horas_extra}h extra</span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsistenciaAdmin;
