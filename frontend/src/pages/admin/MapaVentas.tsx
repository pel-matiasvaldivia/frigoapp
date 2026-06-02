import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { LayoutDashboard, Users, TrendingUp, Map as MapIcon, Loader2 } from 'lucide-react';

interface GeoData {
  id: number;
  razon_social: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  ventas_30d: number;
}

// Center map on Mendoza, Argentina by default
const DEFAULT_CENTER: [number, number] = [-32.8895, -68.8458];

export const MapaVentas: React.FC = () => {
  const [data, setData] = useState<GeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesGeocodificados: 0,
    totalVentas30d: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/clientes/geodata');
      const geodata: GeoData[] = response.data;
      
      setData(geodata);
      
      // Calculate simple stats
      const geocodificados = geodata.filter(d => d.lat && d.lng).length;
      const ventas = geodata.reduce((acc, curr) => acc + curr.ventas_30d, 0);
      
      setStats({
        totalClientes: geodata.length,
        clientesGeocodificados: geocodificados,
        totalVentas30d: ventas
      });
    } catch (error) {
      console.error('Error fetching geodata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to scale circle radius based on sales
  const getRadius = (ventas: number) => {
    if (ventas === 0) return 5;
    // Scaled radius: min 8, max 40
    const scaled = Math.sqrt(ventas) / 50; 
    return Math.max(8, Math.min(40, scaled));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] bg-white rounded-3xl border border-slate-200">
        <Loader2 className="h-10 w-10 text-brand-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando mapa de ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center">
            <MapIcon className="mr-3 h-8 w-8 text-brand-600" />
            Mapa de Ventas
          </h1>
          <p className="text-slate-500 text-sm font-medium">Visualización geográfica de clientes y desempeño comercial</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition shadow-sm"
          >
            Actualizar Datos
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Clientes</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalClientes}</h3>
            <p className="text-[10px] text-emerald-600 font-bold">{stats.clientesGeocodificados} localizados</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ventas (30 días)</p>
            <h3 className="text-2xl font-black text-slate-900">${stats.totalVentas30d.toLocaleString('es-AR')}</h3>
            <p className="text-[10px] text-slate-500 font-bold">Volumen acumulado</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <MapIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cobertura</p>
            <h3 className="text-2xl font-black text-slate-900">
              {stats.totalClientes > 0 ? Math.round((stats.clientesGeocodificados/stats.totalClientes)*100) : 0}%
            </h3>
            <p className="text-[10px] text-slate-500 font-bold">Clientes con dirección válida</p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[600px] relative">
        <MapContainer 
          center={DEFAULT_CENTER} 
          zoom={12} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {data.filter(d => d.lat && d.lng).map((cliente) => (
            <CircleMarker
              key={cliente.id}
              center={[cliente.lat!, cliente.lng!]}
              radius={getRadius(cliente.ventas_30d)}
              pathOptions={{
                fillColor: cliente.ventas_30d > 0 ? '#e11d48' : '#64748b',
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.6
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{cliente.razon_social}</h4>
                  <p className="text-[10px] text-slate-500 mb-2">{cliente.direccion}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Compras 30d:</span>
                    <span className="text-xs font-black text-rose-600">${cliente.ventas_30d.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        
        {/* Map Overlay Legend */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-lg text-[10px] font-bold">
           <p className="text-slate-400 uppercase tracking-widest mb-2">Referencia</p>
           <div className="flex items-center space-x-2 mb-1">
             <div className="w-3 h-3 rounded-full bg-rose-600 opacity-60"></div>
             <span className="text-slate-700">Cliente Activo (con compras)</span>
           </div>
           <div className="flex items-center space-x-2">
             <div className="w-3 h-3 rounded-full bg-slate-500 opacity-60"></div>
             <span className="text-slate-700">Sin compras recientes</span>
           </div>
           <p className="mt-2 text-slate-400 font-medium italic">* El tamaño indica el volumen de facturación.</p>
        </div>
      </div>
    </div>
  );
};
