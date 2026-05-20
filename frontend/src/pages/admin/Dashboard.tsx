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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Facturación de Hoy',
      value: `$${kpis?.total_facturado_hoy.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || '0,00'}`,
      icon: Coins,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      title: 'Pedidos del Día',
      value: kpis?.pedidos_hoy.toString() || '0',
      icon: ShoppingBag,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    {
      title: 'Pedidos Pendientes',
      value: kpis?.pedidos_pendientes.toString() || '0',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      title: 'Rutas Activas',
      value: kpis?.rutas_activas.toString() || '0',
      icon: MapPin,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Panel de Control</h1>
        <p className="text-slate-400 text-sm mt-1">Monitoreo en tiempo real de operaciones, rutas de reparto y ventas de fábrica.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`border rounded-2xl p-6 bg-slate-900/60 ${card.color} flex items-center justify-between`}>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{card.title}</p>
                <h3 className="text-2xl font-bold mt-2 text-white">{card.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${card.color.split(' ')[0]}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-rose-500" />
              <h3 className="text-lg font-bold text-white">Principales Clientes</h3>
            </div>
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-slate-850 text-xs text-slate-300 font-semibold px-3 py-1.5 border border-slate-750 rounded-lg focus:outline-none"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="anio">Este Año</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                  <th className="py-3">Razón Social</th>
                  <th className="py-3 text-right">Pedidos</th>
                  <th className="py-3 text-right">Total Facturado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports?.ventas_por_cliente.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-500">Sin datos comerciales registrados</td>
                  </tr>
                ) : (
                  reports?.ventas_por_cliente.map((row) => (
                    <tr key={row.cliente} className="text-slate-350 hover:bg-slate-900/30">
                      <td className="py-3 font-semibold text-white">{row.cliente}</td>
                      <td className="py-3 text-right">{row.cantidad}</td>
                      <td className="py-3 text-right font-bold text-emerald-400">${row.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales by Route */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">Ventas por Ruta</h3>
          </div>

          <div className="space-y-4">
            {reports?.ventas_por_ruta.length === 0 ? (
              <p className="text-center text-slate-500 py-6 text-sm">Sin datos por ruta</p>
            ) : (
              reports?.ventas_por_ruta.map((row) => (
                <div key={row.ruta} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{row.ruta}</span>
                    <span className="text-emerald-400 font-bold">${row.total.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full" 
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
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-bold text-white">Rendimiento de Repartidores</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports?.ventas_por_repartidor.length === 0 ? (
            <p className="col-span-3 text-center text-slate-500 text-sm">Ningún chofer registrado</p>
          ) : (
            reports?.ventas_por_repartidor.map((row) => (
              <div key={row.repartidor} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">{row.repartidor}</h4>
                  <p className="text-xs text-slate-400 mt-1">{row.entregas} entregas completadas</p>
                </div>
                <span className="text-emerald-400 font-bold text-sm">${row.total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
