import React, { useEffect, useState } from 'react';
import { cuentasCorrientesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { clientesAPI } from '../../services/api';
import { Landmark, ArrowDownRight, ArrowUpRight, AlertTriangle, CheckCircle } from 'lucide-react';

export const MiCuenta: React.FC = () => {
  const { user } = useAuth();
  const [cuenta, setCuenta] = useState<any | null>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteId, setClienteId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Find client ID from list (client is logged in, should only see their own)
        const clientes = await clientesAPI.list();
        const myCliente = clientes.find((c: any) => c.usuario_id === user?.id);
        if (!myCliente) { setLoading(false); return; }
        setClienteId(myCliente.id);
        const cc = await cuentasCorrientesAPI.getCliente(myCliente.id);
        setCuenta(cc);
        setMovimientos(cc.movimientos || []);
      } catch (err) {
        console.error("Error loading client account:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!cuenta) {
    return (
      <div className="text-center py-16 space-y-3">
        <Landmark className="h-12 w-12 text-slate-700 mx-auto" />
        <p className="text-slate-500 text-sm font-semibold">No se encontró una cuenta corriente asociada</p>
        <p className="text-slate-600 text-xs">Contáctenos para más información</p>
      </div>
    );
  }

  const superaLimite = cuenta.saldo_actual > cuenta.limite_credito;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-white">Mi Cuenta Corriente</h1>
        <p className="text-slate-400 text-xs mt-0.5">Estado de cuenta y movimientos de compra/pago.</p>
      </div>

      {/* Balance Card */}
      <div className={`rounded-2xl p-5 border space-y-4 ${superaLimite ? 'bg-rose-950/20 border-rose-800/50' : 'bg-slate-900/60 border-slate-800'}`}>
        {superaLimite && (
          <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4" />
            <span>Ha superado su límite de crédito asignado</span>
          </div>
        )}
        {!superaLimite && (
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle className="h-4 w-4" />
            <span>Cuenta corriente en estado normal</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Saldo Deudor</p>
            <p className={`text-2xl font-extrabold ${cuenta.saldo_actual > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${cuenta.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Límite de Crédito</p>
            <p className="text-2xl font-extrabold text-slate-300">
              ${cuenta.limite_credito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Credit utilization bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Utilización del crédito</span>
            <span>{cuenta.limite_credito > 0 ? Math.min(100, Math.round((cuenta.saldo_actual / cuenta.limite_credito) * 100)) : 0}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${superaLimite ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${cuenta.limite_credito > 0 ? Math.min(100, (cuenta.saldo_actual / cuenta.limite_credito) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Movements History */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 mb-3">Últimos movimientos</h2>
        <div className="space-y-2">
          {movimientos.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
              Sin movimientos registrados aún
            </div>
          ) : (
            movimientos.map((mov) => (
              <div key={mov.id} className="flex items-center justify-between p-3.5 border border-slate-800 bg-slate-900/40 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${mov.tipo === 'DEBITO' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {mov.tipo === 'DEBITO' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{mov.descripcion}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(mov.fecha).toLocaleDateString('es-AR')} · Ref: {mov.referencia}
                    </p>
                  </div>
                </div>
                <p className={`font-bold text-sm ${mov.tipo === 'DEBITO' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {mov.tipo === 'DEBITO' ? '+' : '-'}${mov.monto.toLocaleString('es-AR')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
