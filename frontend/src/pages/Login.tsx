import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Beef, KeyRound, Mail, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoadingSubmit(true);
    try {
      await login(email, password);
      // Auth context will populate the user. We navigate to home.
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Error al iniciar sesión. Verifique sus credenciales.'
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background ambient glowing shapes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-900/40 mb-3">
            <Beef className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">FRIGORÍFICO J&E</h2>
          <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-1">Acceso al Sistema ERP</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl flex items-start space-x-3 text-sm">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@frigorificoje.com.ar"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <KeyRound className="h-5 w-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-rose-900/30 active:scale-[0.98] disabled:opacity-50"
          >
            {loadingSubmit ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
          <p className="font-semibold text-slate-450 uppercase tracking-wider mb-2">Cuentas Demostración:</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-left max-w-xs mx-auto">
            <div>
              <p className="font-bold text-slate-400">Superadmin:</p>
              <p>admin@frigorificoje.com.ar</p>
              <p className="font-mono text-slate-400">admin123</p>
            </div>
            <div>
              <p className="font-bold text-slate-400">Administrativo:</p>
              <p>admin_ventas@frigorificoje.com.ar</p>
              <p className="font-mono text-slate-400">ventas123</p>
            </div>
            <div className="mt-1">
              <p className="font-bold text-slate-400">Vendedor:</p>
              <p>vendedor@frigorificoje.com.ar</p>
              <p className="font-mono text-slate-400">vendedor123</p>
            </div>
            <div className="mt-1">
              <p className="font-bold text-slate-400">Repartidor:</p>
              <p>reparto@frigorificoje.com.ar</p>
              <p className="font-mono text-slate-400">reparto123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
