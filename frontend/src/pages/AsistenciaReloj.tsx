import React, { useState, useEffect } from 'react';
import { Clock, Delete, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { asistenciaAPI } from '../services/api';

const AsistenciaReloj: React.FC = () => {
  const [pin, setPin] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);

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

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length < 4) return;
    
    setLoading(true);
    try {
      const res = await asistenciaAPI.fichar(pin);
      const action = res.salida ? 'EGRESO' : 'INGRESO';
      setStatus({ 
        type: 'success', 
        message: `${action} REGISTRADO: ${res.usuario_nombre}` 
      });
      setPin('');
      // Beep or sound feedback could be added here
    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.detail || 'Error al procesar PIN' 
      });
      setPin('');
    } finally {
      setLoading(false);
      // Clear status after 5 seconds
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 p-8 space-y-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-rose-600" />

        {/* Header: Clock */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-rose-600">
            <Clock className="h-6 w-6 animate-pulse" />
            <span className="text-lg font-black tracking-widest uppercase">Reloj Control</span>
          </div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* PIN Display */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-3">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length 
                    ? 'bg-rose-600 border-rose-600 scale-110' 
                    : 'bg-transparent border-slate-200'
                }`}
              />
            ))}
          </div>
          
          {/* Status Message */}
          <div className={`h-12 flex items-center justify-center text-center transition-all duration-300 ${
            status.type === 'idle' ? 'opacity-0' : 'opacity-100'
          }`}>
            {status.type === 'success' && (
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl flex items-center space-x-2 animate-bounce">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-bold text-sm uppercase">{status.message}</span>
              </div>
            )}
            {status.type === 'error' && (
              <div className="bg-rose-50 text-rose-700 px-4 py-2 rounded-2xl flex items-center space-x-2 animate-shake">
                <AlertCircle className="h-5 w-5" />
                <span className="font-bold text-sm uppercase">{status.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button
              key={n}
              onClick={() => handleNumberClick(n.toString())}
              disabled={loading}
              className="h-20 bg-slate-50 hover:bg-slate-100 active:scale-95 text-2xl font-black text-slate-800 rounded-3xl transition-all border border-slate-100"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="h-20 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-3xl flex items-center justify-center transition-all border border-slate-100"
          >
            <Delete className="h-8 w-8" />
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            disabled={loading}
            className="h-20 bg-slate-50 hover:bg-slate-100 text-2xl font-black text-slate-800 rounded-3xl transition-all border border-slate-100"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4 || loading}
            className="h-20 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-4xl flex items-center justify-center transition-all shadow-xl shadow-rose-200"
          >
            {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <CheckCircle2 className="h-8 w-8" />}
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          Frigorífico J&E • Sistema de Asistencia
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default AsistenciaReloj;
