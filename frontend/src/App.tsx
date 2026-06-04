import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { ClienteLayout } from './layouts/ClienteLayout';

// Pages - Auth
import { Login } from './pages/Login';

// Pages - Admin
import { Dashboard } from './pages/admin/Dashboard';
import { Clientes } from './pages/admin/Clientes';
import { Productos } from './pages/admin/Productos';
import { ListasPrecios } from './pages/admin/ListasPrecios';
import { WhatsAppAdmin } from './pages/admin/WhatsApp';
import { MapaVentas } from './pages/admin/MapaVentas';
import { Caja } from './pages/admin/Caja';
import { Configuracion } from './pages/configuracion/Configuracion';

// Pages - Sales & Operations
import { Pedidos } from './pages/ventas/Pedidos';
import { Preparacion } from './pages/ventas/Preparacion';
import { Comprobantes } from './pages/ventas/Comprobantes';
import { Despacho } from './pages/ventas/Despacho';

// Pages - Cuentas
import { CuentasCorrientes } from './pages/cuentas/CuentasCorrientes';

// Pages - Cliente Portal
import { MisPedidos } from './pages/cliente/MisPedidos';
import { MiCuenta } from './pages/cliente/MiCuenta';

// ─── Route Guards ──────────────────────────────────────────────────────────────

const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500"></div>
      <p className="text-slate-400 text-xs font-semibold animate-pulse">Cargando sistema ERP...</p>
    </div>
  </div>
);

/** Redirect to login if not authenticated */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** Redirect to home if already logged in */
const RequireGuest: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

/** Role-based access: show 403 page if role not allowed */
const RequireRole: React.FC<{ roles: string[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || !roles.includes(user.rol)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="text-6xl">🚫</div>
        <h2 className="text-2xl font-extrabold text-white">Acceso Denegado</h2>
        <p className="text-slate-400 text-sm">No tiene permisos para ver esta sección.</p>
        <a href="/" className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-500 transition">
          Volver al inicio
        </a>
      </div>
    );
  }
  return <>{children}</>;
};

// ─── Admin Wrapper ─────────────────────────────────────────────────────────────

const AdminRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles = ['SUPERADMIN', 'ADMINISTRATIVO', 'VENDEDOR', 'REPARTIDOR']
}) => (
  <RequireAuth>
    <RequireRole roles={roles}>
      <AdminLayout>{children}</AdminLayout>
    </RequireRole>
  </RequireAuth>
);

// ─── Client Portal Wrapper ─────────────────────────────────────────────────────

const ClienteRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireAuth>
    <RequireRole roles={['CLIENTE']}>
      <ClienteLayout>{children}</ClienteLayout>
    </RequireRole>
  </RequireAuth>
);

// ─── Smart Home Redirect ────────────────────────────────────────────────────────

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === 'CLIENTE') return <Navigate to="/mis-pedidos" replace />;
  if (user.rol === 'REPARTIDOR') return <Navigate to="/despacho" replace />;
  return <Navigate to="/dashboard" replace />;
};

// ─── App Router ────────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />

    {/* Smart home redirect */}
    <Route path="/" element={<RequireAuth><HomeRedirect /></RequireAuth>} />

    {/* Admin / Staff Routes */}
    <Route path="/dashboard" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <Dashboard />
      </AdminRoute>
    } />

    <Route path="/pedidos" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO', 'VENDEDOR']}>
        <Pedidos />
      </AdminRoute>
    } />

    <Route path="/preparacion" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <Preparacion />
      </AdminRoute>
    } />

    <Route path="/comprobantes" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <Comprobantes />
      </AdminRoute>
    } />

    <Route path="/despacho" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO', 'REPARTIDOR']}>
        <Despacho />
      </AdminRoute>
    } />

    <Route path="/cuentas" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <CuentasCorrientes />
      </AdminRoute>
    } />

    <Route path="/caja" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <Caja />
      </AdminRoute>
    } />

    <Route path="/clientes" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO', 'VENDEDOR']}>
        <Clientes />
      </AdminRoute>
    } />

    <Route path="/productos" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <Productos />
      </AdminRoute>
    } />

    <Route path="/listas-precios" element={
      <AdminRoute roles={['SUPERADMIN']}>
        <ListasPrecios />
      </AdminRoute>
    } />

    <Route path="/admin/mapa-ventas" element={
      <AdminRoute roles={['SUPERADMIN', 'ADMINISTRATIVO']}>
        <MapaVentas />
      </AdminRoute>
    } />
    <Route path="/whatsapp" element={
      <AdminRoute roles={['SUPERADMIN']}>
        <WhatsAppAdmin />
      </AdminRoute>
    } />

    <Route path="/configuracion" element={
      <AdminRoute roles={['SUPERADMIN']}>
        <Configuracion />
      </AdminRoute>
    } />

    {/* Cliente Portal Routes (PWA) */}
    <Route path="/mis-pedidos" element={
      <ClienteRoute>
        <MisPedidos />
      </ClienteRoute>
    } />

    <Route path="/cc" element={
      <ClienteRoute>
        <MiCuenta />
      </ClienteRoute>
    } />

    {/* 404 Fallback */}
    <Route path="*" element={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center space-y-4">
        <div className="text-8xl font-extrabold text-slate-200">404</div>
        <h2 className="text-2xl font-bold text-slate-900">Página no encontrada</h2>
        <a href="/" className="px-6 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition shadow-lg shadow-brand-900/20">
          Volver al inicio
        </a>
      </div>
    } />
  </Routes>
);

// ─── Root App ──────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
