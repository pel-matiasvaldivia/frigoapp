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
  User
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const sidebarItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['SUPERADMIN', 'ADMINISTRATIVO'] },
    { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart, roles: ['SUPERADMIN', 'ADMINISTRATIVO', 'VENDEDOR'] },
    { name: 'Preparación', path: '/preparacion', icon: ClipboardList, roles: ['SUPERADMIN', 'ADMINISTRATIVO'] },
    { name: 'Facturas / Remitos', path: '/comprobantes', icon: FileText, roles: ['SUPERADMIN', 'ADMINISTRATIVO'] },
    { name: 'Cuentas Corrientes', path: '/cuentas', icon: Coins, roles: ['SUPERADMIN', 'ADMINISTRATIVO'] },
    { name: 'Repartos Hoja de Ruta', path: '/despacho', icon: Truck, roles: ['SUPERADMIN', 'ADMINISTRATIVO', 'REPARTIDOR'] },
    { name: 'Clientes', path: '/clientes', icon: Users, roles: ['SUPERADMIN', 'ADMINISTRATIVO', 'VENDEDOR'] },
    { name: 'Catálogo Productos', path: '/productos', icon: Beef, roles: ['SUPERADMIN', 'ADMINISTRATIVO'] },
    { name: 'Listas de Precios', path: '/listas-precios', icon: ClipboardList, roles: ['SUPERADMIN'] },
    { name: 'Configuración', path: '/configuracion', icon: Settings, roles: ['SUPERADMIN'] },
  ];

  const visibleItems = sidebarItems.filter(item => item.roles.includes(user.rol));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0 flex-col w-64 bg-slate-900 border-r border-slate-800">
        {/* Brand Header */}
        <div className="flex items-center h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-lg text-white">
              <Beef className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-sans">J&E FRIGORÍFICO</span>
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Sistema ERP</p>
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
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-rose-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-slate-800 rounded-full text-slate-300">
              <User className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user.nombre}</h4>
              <p className="text-xs text-slate-400 font-mono truncate">{user.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-rose-400 bg-rose-950/20 hover:bg-rose-600 hover:text-white border border-rose-900/30 rounded-xl transition-all duration-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-slate-900 border-b border-slate-800 lg:px-8">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden lg:block text-slate-400 text-xs font-semibold tracking-wider uppercase font-mono">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-rose-400 bg-rose-400/10 rounded-full border border-rose-400/20">
              <span className="w-1.5 h-1.5 mr-1.5 bg-rose-500 rounded-full animate-pulse"></span>
              Servidor Activo
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>

          {/* Drawer content */}
          <div className="relative flex flex-col w-80 max-w-xs bg-slate-900 border-r border-slate-850 h-full p-6 animate-slide-right">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Brand Header */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-rose-600 rounded-lg text-white">
                <Beef className="h-6 w-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white">J&E FRIGORÍFICO</span>
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Sistema ERP</p>
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
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 bg-slate-950/50 -mx-6 -mb-6 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-full text-slate-300">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{user.nombre}</h4>
                  <p className="text-xs text-slate-400 font-mono">{user.rol}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-semibold text-rose-400 bg-rose-950/20 hover:bg-rose-600 hover:text-white border border-rose-900/30 rounded-xl transition-all duration-200"
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
