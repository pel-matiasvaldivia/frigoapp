import React, { useEffect, useState } from 'react';
import { cuentasCorrientesAPI } from '../../services/api';
import { 
  Coins, 
  Plus, 
  Search, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';

export const CuentasCorrientes: React.FC = () => {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Register Payment Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedClientPay, setSelectedClientPay] = useState<any | null>(null);
  const [monto, setMonto] = useState<number>(0);
  const [tipoPago, setTipoPago] = useState('Transferencia');
  const [referencia, setReferencia] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // View Statement Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    fetchCuentas();
  }, []);

  const fetchCuentas = async () => {
    setLoading(true);
    try {
      const res = await cuentasCorrientesAPI.list();
      setCuentas(res);
    } catch (err) {
      console.error("Error loading account balances:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (cuenta: any) => {
    setSelectedClientPay(cuenta);
    setMonto(0);
    setReferencia('');
    setDescripcion('');
    setPayModalOpen(true);
  };

  const handlePostPayment = async () => {
    if (!selectedClientPay || monto <= 0) {
      alert("Por favor ingrese un monto válido mayor a 0");
      return;
    }
    try {
      await cuentasCorrientesAPI.pagar(selectedClientPay.cliente_id, {
        monto,
        tipo_pago: tipoPago,
        referencia,
        descripcion
      });
      alert("¡Pago registrado exitosamente!");
      setPayModalOpen(false);
      setSelectedClientPay(null);
      fetchCuentas();
    } catch (err) {
      alert("Error al registrar pago");
    }
  };

  const handleOpenDetailModal = async (cuenta: any) => {
    try {
      const details = await cuentasCorrientesAPI.getCliente(cuenta.cliente_id);
      setSelectedAccountDetail(cuenta);
      setMovements(details.movimientos || []);
      setDetailModalOpen(true);
    } catch (err) {
      alert("Error al cargar movimientos de la cuenta");
    }
  };

  // Filter accounts by customer search query
  const filteredCuentas = cuentas.filter(c => 
    c.cliente_razon_social.toLowerCase().includes(search.toLowerCase()) ||
    (c.cuit && c.cuit.includes(search))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Cuentas Corrientes</h1>
        <p className="text-slate-400 text-sm mt-1">Control de saldos, límites de créditos financieros y registro de cobranzas de clientes.</p>
      </div>

      {/* Searchbar */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl items-center justify-between">
        <div className="flex-1 min-w-[250px] relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por cliente o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-rose-500 text-white"
          />
        </div>
      </div>

      {/* Balance sheets grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
        </div>
      ) : filteredCuentas.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-[2rem] p-16 text-center bg-slate-50/50">
          <Coins className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Sin Cuentas</h3>
          <p className="text-sm text-slate-400 mt-2 font-medium">No se encontraron clientes que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCuentas.map((cta) => (
            <div key={cta.id} className="group bg-white border border-slate-200 rounded-[2.5rem] p-6 space-y-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 text-lg uppercase leading-tight tracking-tight mb-1 group-hover:text-brand-600 transition-colors">
                    {cta.cliente_razon_social}
                  </h3>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold tracking-widest">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    CUIT: {cta.cuit || 'SIN ASIGNAR'}
                  </div>
                </div>
                {cta.supera_limite ? (
                   <span className="shrink-0 flex items-center px-2 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Riesgo
                   </span>
                ) : (
                   <span className="shrink-0 flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      <CheckCircle className="h-3 w-3 mr-1" /> OK
                   </span>
                )}
              </div>

              {/* Financial Dashboard */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-slate-200/20 rounded-bl-full pointer-events-none"></div>
                
                <div className="relative z-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-2 flex items-center">
                    Saldo Actual
                  </p>
                  <p className={`text-2xl font-black tracking-tighter leading-none ${cta.saldo_actual > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    ${Math.abs(cta.saldo_actual).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-[9px] font-bold uppercase mt-1 ${cta.saldo_actual > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                    {cta.saldo_actual > 0 ? 'Deuda en Contra' : 'Saldo a Favor'}
                  </p>
                </div>

                <div className="text-right border-l border-slate-200 pl-4 relative z-10">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mb-2">Límite de Crédito</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    ${cta.limite_credito.toLocaleString('es-AR')}
                  </p>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${cta.supera_limite ? 'bg-rose-500' : 'bg-brand-500'}`}
                        style={{ width: `${Math.min((cta.saldo_actual / cta.limite_credito) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Interactive Limit Slider */}
              <div className="px-2">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ajustar Límite ($)</label>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-md border border-slate-200">
                        VAL: {cta.limite_credito / 1000}k
                    </span>
                </div>
                <input 
                    type="range"
                    min="0"
                    max="1000000"
                    step="50000"
                    value={cta.limite_credito}
                    onChange={async (e) => {
                        const newLimit = parseInt(e.target.value);
                        // Optimistic update
                        setCuentas(prev => prev.map(c => c.id === cta.id ? {...c, limite_credito: newLimit, supera_limite: c.saldo_actual > newLimit} : c));
                        try {
                            await cuentasCorrientesAPI.updateLimiteCredito(cta.cliente_id, newLimit);
                        } catch (err) {
                            alert("No se pudo actualizar el límite. Reintentando...");
                            fetchCuentas();
                        }
                    }}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600 focus:outline-none"
                />
                <div className="flex justify-between mt-2 text-[8px] text-slate-300 font-black uppercase tracking-widest">
                    <span>Sin Límite</span>
                    <span>500k</span>
                    <span>1M+</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                   onClick={() => handleOpenDetailModal(cta)}
                   className="flex items-center justify-center py-4 bg-slate-50 text-slate-600 hover:bg-slate-100 text-[10px] font-black rounded-[1.25rem] border border-slate-100 transition-all uppercase tracking-widest shadow-sm active:scale-95"
                >
                   <Eye className="h-4 w-4 mr-2" />
                   Historial
                </button>
                <button
                   onClick={() => handleOpenPayModal(cta)}
                   className="flex items-center justify-center py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-[1.25rem] transition-all uppercase tracking-widest shadow-lg shadow-emerald-900/10 active:scale-95"
                >
                   <Coins className="h-4 w-4 mr-2" />
                   Cobrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Payment Modal Dialogue */}
      {payModalOpen && selectedClientPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Coins className="h-5 w-5 mr-2 text-emerald-500" />
                Registrar Cobro de Saldo
              </h3>
              <button 
                onClick={() => { setSelectedClientPay(null); setPayModalOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs">
                <p><span className="text-slate-450">Cliente:</span> <strong className="text-white">{selectedClientPay.cliente_razon_social}</strong></p>
                <p><span className="text-slate-450">Saldo actual:</span> <strong className="text-rose-400">${selectedClientPay.saldo_actual.toLocaleString('es-AR')}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monto a Cobrar ($)</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medio de Pago</label>
                <select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo en Mano</option>
                  <option value="Cheque">Cheque Físico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Referencia / N° Operación</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Número de cheque o ID de transferencia..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Concepto / Descripción</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Pago de factura N°..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedClientPay(null); setPayModalOpen(false); }}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePostPayment}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Statement Details Modal Dialogue */}
      {detailModalOpen && selectedAccountDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-h-[85vh] flex flex-col">
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Extracto de Cuenta Corriente</h3>
                <p className="text-xs text-rose-500 font-semibold">{selectedAccountDetail.cliente_razon_social}</p>
              </div>
              <button 
                onClick={() => { setSelectedAccountDetail(null); setDetailModalOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {movements.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-12">No hay movimientos comerciales registrados en esta cuenta</p>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/50 text-slate-400 font-bold">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Ref</th>
                        <th className="p-3 text-right">Débito (Factura)</th>
                        <th className="p-3 text-right">Crédito (Pago)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {movements.map((mov) => (
                        <tr key={mov.id} className="text-slate-300">
                          <td className="p-3 font-mono">{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="p-3">
                            <span className="block font-semibold">{mov.descripcion}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-450">{mov.referencia}</td>
                          <td className="p-3 text-right text-rose-400 font-mono">
                            {mov.tipo === 'DEBITO' ? `$${mov.monto.toLocaleString('es-AR')}` : '-'}
                          </td>
                          <td className="p-3 text-right text-emerald-450 font-mono">
                            {mov.tipo === 'CREDITO' ? `$${mov.monto.toLocaleString('es-AR')}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">Saldo Acumulado Total:</span>
              <strong className={`text-sm font-extrabold ${selectedAccountDetail.saldo_actual > 0 ? 'text-rose-405' : 'text-emerald-405'}`}>
                ${selectedAccountDetail.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
