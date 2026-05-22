import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../services/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Users, 
  BarChart3, 
  Coins 
} from 'lucide-react';

interface KPIs {
  pedidos_hoy: number;
  total_facturado_hoy: number;
  pedidos_pendientes: number;
  rutas_activas: number;
}

interface ReportData {
  ventas_por_cliente: { cliente: string; total: number; cantidad: number }[];
  ventas_por_ruta: { ruta: string; total: number }[];
  ventas_por_repartidor: { repartidor: string; total: number; entregas: number }[];
}

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('mes');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const kpiRes = await dashboardAPI.getKpis();
        const repRes = await dashboardAPI.getReporteVentas(period);
        setKpis(kpiRes);
        setReports(repRes);
      } catch (error) {
        console.error("Error fetching dashboard details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Facturación de Hoy',
      value: `$${kpis?.total_facturado_hoy.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: Coins,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      title: 'Pedidos del Día',
      value: kpis?.pedidos_hoy.toString() || '0',
      icon: ShoppingBag,
      color: 'bg-brand-50 text-brand-700 border-brand-100'
    },
    {
      title: 'Pedidos Pendientes',
      value: kpis?.pedidos_pendientes.toString() || '0',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    {
      title: 'Rutas Activas',
      value: kpis?.rutas_activas.toString() || '0',
      icon: MapPin,
      color: 'bg-sky-50 text-sky-700 border-sky-100'
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Welcome Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">Información en tiempo real de operaciones, rutas y ventas.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-2 text-slate-900">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div className="lg:col-span-2 border border-slate-200 rounded-2xl bg-white p-8 space-y-6 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ventas por Cliente</h3>
            </div>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-50 text-xs text-slate-700 font-semibold px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="anio">Este Año</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-4">Razón Social</th>
                  <th className="py-4 text-right">Pedidos</th>
                  <th className="py-4 text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports?.ventas_por_cliente.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">Sin datos comerciales registrados</td>
                  </tr>
                ) : (
                  reports?.ventas_por_cliente.map((row) => (
                    <tr key={row.cliente} className="text-slate-600 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-semibold text-slate-900">{row.cliente}</td>
                      <td className="py-4 text-right font-medium">{row.cantidad}</td>
                      <td className="py-4 text-right font-bold text-slate-900">${row.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Route */}
        <div className="border border-slate-200 rounded-2xl bg-white p-8 space-y-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Ventas por Ruta</h3>
          </div>

          <div className="space-y-4">
            {reports?.ventas_por_ruta.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm italic">Sin datos por ruta</p>
            ) : (
              reports?.ventas_por_ruta.map((row) => (
                <div key={row.ruta} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{row.ruta}</span>
                    <span className="text-slate-900 font-bold">${row.total.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-600 h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (row.total / (kpis?.total_facturado_hoy || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Driver list */}
      <div className="border border-slate-200 rounded-2xl bg-white p-8 space-y-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Repartidores</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports?.ventas_por_repartidor.length === 0 ? (
            <p className="col-span-3 text-center text-slate-400 text-sm">Ningún chofer registrado</p>
          ) : (
            reports?.ventas_por_repartidor.map((row) => (
              <div key={row.repartidor} className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-brand-200 transition-all">
                <div>
                  <h4 className="font-bold text-slate-900">{row.repartidor}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{row.entregas} entregas completadas</p>
                </div>
                <span className="text-slate-900 font-bold text-base leading-none">${row.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
