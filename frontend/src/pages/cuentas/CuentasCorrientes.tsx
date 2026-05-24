import React, { useEffect, useState } from 'react';
import { cuentasCorrientesAPI } from '../../services/api';
import { 
  Coins, 
  Plus, 
  Search, 
  Eye, 
  AlertTriangle, 
  CheckCircle2,
  FileSpreadsheet,
  X,
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
    <div className="space-y-6 animate-fade-in bg-slate-50/50 p-6 rounded-[2.5rem]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Cuentas Corrientes</h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">Gestión de Saldos y Límites de Crédito</p>
        </div>
        
        {/* Searchbar */}
        <div className="relative min-w-[300px]">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="BUSCAR CLIENTE O CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Balance sheets grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
        </div>
      ) : filteredCuentas.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-[2rem] p-16 text-center bg-white">
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
                      <CheckCircle2 className="h-3 w-3 mr-1" /> OK
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Registrar Cobro</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ingreso de fondos a CC</p>
              </div>
              <button 
                onClick={() => { setSelectedClientPay(null); setPayModalOpen(false); }}
                className="p-3 bg-slate-50 text-slate-400 hover:text-brand-600 rounded-2xl border border-slate-200 transition-all active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-md font-black text-slate-900 uppercase">{selectedClientPay.cliente_razon_social}</p>
                <p className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Actual</p>
                <p className="text-xl font-black text-rose-600">${selectedClientPay.saldo_actual.toLocaleString('es-AR')}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Monto a Cobrar ($)</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Medio de Pago</label>
                <select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Efectivo">Efectivo en Mano</option>
                  <option value="Cheque">Cheque Físico</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Referencia / N° Operación</label>
                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="ID DE TRANSACCIÓN O CHEQUE..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => { setSelectedClientPay(null); setPayModalOpen(false); }}
                className="flex-1 py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePostPayment}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Statement Details Modal Dialogue */}
      {detailModalOpen && selectedAccountDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Extracto Histórico</h3>
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-2">{selectedAccountDetail.cliente_razon_social}</p>
              </div>
              <button 
                onClick={() => { setSelectedAccountDetail(null); setDetailModalOpen(false); }}
                className="p-3 bg-slate-50 text-slate-400 hover:text-brand-600 rounded-2xl border border-slate-200 transition-all active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {movements.length === 0 ? (
                <div className="py-20 text-center">
                    <Coins className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="p-5 border-b border-slate-100">Fecha</th>
                        <th className="p-5 border-b border-slate-100">Descripción</th>
                        <th className="p-5 border-b border-slate-100">Referencia</th>
                        <th className="p-5 border-b border-slate-100 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {movements.map((mov) => (
                        <tr key={mov.id} className="text-slate-600 hover:bg-white transition-colors">
                          <td className="p-5 text-[10px] font-black tabular-nums">{new Date(mov.fecha).toLocaleDateString('es-AR')}</td>
                          <td className="p-5">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{mov.descripcion}</span>
                            <span className={`ml-3 px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${mov.tipo === 'DEBITO' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {mov.tipo === 'DEBITO' ? 'VENTA' : 'COBRO'}
                            </span>
                          </td>
                          <td className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mov.referencia}</td>
                          <td className={`p-5 text-right font-black tabular-nums ${mov.tipo === 'DEBITO' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {mov.tipo === 'DEBITO' ? '-' : '+'}${mov.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-[1.5rem] p-6 flex justify-between items-center shadow-xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Saldo Acumulado Total</p>
                <p className="text-xs text-brand-500 font-bold uppercase">Balance Final en CC</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black tracking-tighter ${selectedAccountDetail.saldo_actual > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${Math.abs(selectedAccountDetail.saldo_actual).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {selectedAccountDetail.saldo_actual > 0 ? 'DEUDA PENDIENTE' : 'SALDO A FAVOR'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
