import React, { useState, useEffect } from 'react';
import { Clock, Delete, CheckCircle2, AlertCircle, Loader2, LogIn, LogOut } from 'lucide-react';
import { asistenciaAPI } from '../services/api';

type Tipo = 'ENTRADA' | 'SALIDA';

const AsistenciaReloj: React.FC = () => {
  const [pin, setPin] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNumberClick = (n: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + n);
      setStatus({ type: 'idle', message: '' });
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  const handleSubmit = async (tipo: Tipo) => {
    if (pin.length < 4) return;

    setLoading(true);
    const ts = currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    try {
      const res = await asistenciaAPI.fichar(pin, tipo);
      setLastAction(`${tipo} registrada: ${res.usuario_nombre} — ${ts}`);
      setStatus({
        type: 'success',
        message: `✓ ${tipo} — ${res.usuario_nombre} — ${ts}`,
      });
      setPin('');
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.response?.data?.detail || 'PIN incorrecto o error al registrar',
      });
      setPin('');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 6000);
    }
  };

  const pinReady = pin.length >= 4 && !loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-black tracking-widest uppercase">Reloj Control</span>
          </div>
          <div className="text-7xl font-black text-white tabular-nums tracking-tighter">
            {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest capitalize">
            {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Status Banner */}
        <div className={`transition-all duration-300 ${status.type === 'idle' ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
          {status.type === 'success' && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="font-bold text-sm">{status.message}</span>
            </div>
          )}
          {status.type === 'error' && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-3 rounded-2xl flex items-center space-x-2 animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-bold text-sm">{status.message}</span>
            </div>
          )}
        </div>

        {/* Last action */}
        {lastAction && status.type === 'idle' && (
          <p className="text-center text-slate-500 text-xs font-bold">{lastAction}</p>
        )}

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-3xl p-6 space-y-5">

          {/* PIN dots */}
          <div className="flex justify-center space-x-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-indigo-400 border-indigo-400 scale-110'
                    : 'bg-transparent border-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handleNumberClick(n.toString())}
                disabled={loading}
                className="h-16 bg-slate-700/60 hover:bg-slate-600/80 active:scale-95 text-2xl font-black text-white rounded-2xl transition-all border border-slate-600/50"
              >
                {n}
              </button>
            ))}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="h-16 bg-slate-700/40 hover:bg-rose-900/40 hover:text-rose-400 text-slate-500 rounded-2xl flex items-center justify-center transition-all border border-slate-600/30"
            >
              <Delete className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              disabled={loading}
              className="h-16 bg-slate-700/60 hover:bg-slate-600/80 active:scale-95 text-2xl font-black text-white rounded-2xl transition-all border border-slate-600/50"
            >
              0
            </button>
            {/* Empty cell */}
            <div />
          </div>

          {/* ENTRADA / SALIDA Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => handleSubmit('ENTRADA')}
              disabled={!pinReady}
              className="py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm tracking-wider transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>ENTRADA</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleSubmit('SALIDA')}
              disabled={!pinReady}
              className="py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm tracking-wider transition-all shadow-lg shadow-rose-900/50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-5 w-5" />
                  <span>SALIDA</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Ingresá tu PIN y presioná ENTRADA o SALIDA
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Frigorífico J&E • Sistema de Asistencia
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}} />
    </div>
  );
};

export default AsistenciaReloj;
