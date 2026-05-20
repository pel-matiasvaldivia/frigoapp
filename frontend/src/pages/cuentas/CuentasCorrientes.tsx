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

      {/* Balance sheets grid table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                <th className="py-3">Cliente</th>
                <th className="py-3 text-right">Límite de Crédito</th>
                <th className="py-3 text-right">Saldo Deudor</th>
                <th className="py-3 text-center">Estado Límite</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredCuentas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Ningún cliente registrado</td>
                </tr>
              ) : (
                filteredCuentas.map((cta) => (
                  <tr key={cta.id} className="text-slate-350 hover:bg-slate-900/30">
                    <td className="py-4">
                      <div className="font-semibold text-white">{cta.cliente_razon_social}</div>
                      <div className="text-[10px] text-slate-450 font-mono">CUIT: {cta.cuit || 'Sin CUIT'}</div>
                    </td>
                    <td className="py-4 text-right font-mono text-xs">
                      ${cta.limite_credito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-4 text-right font-bold font-mono text-xs ${cta.saldo_actual > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ${cta.saldo_actual.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-center">
                      {cta.supera_limite ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-450" />
                          Límite Superado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-450" />
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center space-x-2">
                      <button
                        onClick={() => handleOpenDetailModal(cta)}
                        className="px-2.5 py-1.5 bg-slate-800 text-slate-350 hover:text-white rounded-lg text-xs font-semibold transition"
                        title="Ver extracto"
                      >
                        <Eye className="h-3.5 w-3.5 inline mr-1" />
                        Historial
                      </button>
                      <button
                        onClick={() => handleOpenPayModal(cta)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-950/20"
                      >
                        <Plus className="h-3.5 w-3.5 inline mr-1" />
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
