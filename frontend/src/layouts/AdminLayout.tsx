import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Coins, 
  Users, 
  Beef, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  MessageSquare,
  Map,
  CreditCard
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  modulo: string;
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const sidebarItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, modulo: 'DASHBOARD' },
    { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart, modulo: 'PEDIDOS' },
    { name: 'Preparación', path: '/preparacion', icon: ClipboardList, modulo: 'PREPARACION' },
    { name: 'Facturas / Remitos', path: '/comprobantes', icon: FileText, modulo: 'COMPROBANTES' },
    { name: 'Cuentas Corrientes', path: '/cuentas', icon: Coins, modulo: 'CUENTAS_CORRIENTES' },
    { name: 'Caja', path: '/caja', icon: CreditCard, modulo: 'CAJA' },
    { name: 'Repartos Hoja de Ruta', path: '/despacho', icon: Truck, modulo: 'DESPACHO' },
    { name: 'Clientes', path: '/clientes', icon: Users, modulo: 'CLIENTES' },
    { name: 'Catálogo Productos', path: '/productos', icon: Beef, modulo: 'PRODUCTOS' },
    { name: 'Listas de Precios', path: '/listas-precios', icon: ClipboardList, modulo: 'LISTAS_PRECIOS' },
    { name: 'Mapa de Ventas', path: '/admin/mapa-ventas', icon: Map, modulo: 'MAPA_VENTAS' },
    { name: 'WhatsApp', path: '/whatsapp', icon: MessageSquare, modulo: 'WHATSAPP' },
    { name: 'Configuración', path: '/configuracion', icon: Settings, modulo: 'CONFIGURACION' },
  ];

  const visibleItems = sidebarItems.filter(item => hasPermission(item.modulo));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0 flex-col w-64 bg-white border-r border-slate-200">
        {/* Brand Header */}
        <div className="flex items-center h-16 px-6 bg-white border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-600 rounded-xl text-white shadow-sm">
              <Beef className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">J&E Frigorífico</span>
              <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">Gestión Interna</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 mb-4 p-3 bg-white border border-slate-100 rounded-2xl">
            <div className="p-2 bg-slate-100 rounded-full text-slate-400">
              <User className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold text-slate-900 truncate">{user.nombre}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{user.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-xs font-bold text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl transition-all duration-200 shadow-sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:px-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-500 hover:text-brand-600 rounded-lg lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden lg:block text-slate-400 text-[10px] font-bold tracking-widest uppercase">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-4 py-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100 uppercase tracking-widest">
              <span className="w-2 h-2 mr-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              En Línea
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 text-slate-800">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-accent-brown-950/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>

          {/* Drawer content */}
          <div className="relative flex flex-col w-80 max-w-xs bg-white border-r border-slate-200 h-full p-6 animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Brand Header */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-brand-600 rounded-xl text-white shadow-sm">
                <Beef className="h-6 w-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">J&E Frigorífico</span>
                <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">Gestión Interna</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/40' 
                        : 'text-accent-brown-300 hover:bg-accent-brown-900/40 hover:text-white'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{user.nombre}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{user.rol}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-4 py-3 text-xs font-bold text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 border border-slate-200 rounded-xl transition-all duration-200 shadow-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
