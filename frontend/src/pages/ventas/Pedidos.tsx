import React, { useEffect, useState } from 'react';
import { pedidosAPI, clientesAPI, listasPreciosAPI, productosAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Calendar, 
  User, 
  FileCheck,
  ShoppingCart
} from 'lucide-react';

interface PedidoItemInput {
  producto_id: number;
  codigo: string;
  descripcion: string;
  cantidad_unidades: number;
  peso_estimado_kg: number;
  precio_unitario: number;
}

export const Pedidos: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  
  // Create Order Drawer/Modal
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>('');
  const [clientPriceList, setClientPriceList] = useState<any | null>(null);
  const [items, setItems] = useState<PedidoItemInput[]>([]);
  const [observaciones, setObservaciones] = useState('');
  
  // Selected product to add
  const [addProductId, setAddProductId] = useState<number | ''>('');
  const [addUnits, setAddUnits] = useState<number>(1);
  const [addWeight, setAddWeight] = useState<number>(10); // default weight estimate

  // Warning Modal
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [pendingOrderPayload, setPendingOrderPayload] = useState<any>(null);
  
  // View Order Modal
  const [viewOrderModal, setViewOrderModal] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [filterEstado, filterCliente]);

  const fetchInitialData = async () => {
    try {
      const filters: any = {};
      if (filterEstado) filters.estado = filterEstado;
      if (filterCliente) filters.cliente_id = filterCliente;
      
      const orders = await pedidosAPI.list(filters);
      setPedidos(orders);
      
      const clients = await clientesAPI.list();
      setClientes(clients);
      
      const prods = await productosAPI.list();
      setProductos(prods);
    } catch (error) {
      console.error("Error loading sales orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Triggered when client changes in order creation
  const handleClientChange = async (clientId: number) => {
    setSelectedClienteId(clientId);
    setItems([]);
    const client = clientes.find(c => c.id === clientId);
    if (client && client.lista_precios_id) {
      try {
        const listDetails = await listasPreciosAPI.getDetalles(client.lista_precios_id);
        setClientPriceList(listDetails);
      } catch (err) {
        alert("Error al cargar la lista de precios del cliente");
        setClientPriceList(null);
      }
    } else {
      setClientPriceList(null);
    }
  };

  const handleAddItem = () => {
    if (!addProductId || !clientPriceList) return;
    
    // Find price detail inside lists
    const priceDetail = clientPriceList.detalles.find((d: any) => d.producto_id === addProductId);
    if (!priceDetail) {
      alert("El producto seleccionado no está en la lista de precios de este cliente");
      return;
    }
    
    const product = productos.find(p => p.id === addProductId);
    if (!product) return;
    
    // Check if already in items
    const exists = items.some(item => item.producto_id === addProductId);
    if (exists) {
      alert("El producto ya está agregado en el pedido. Puede editar sus cantidades.");
      return;
    }
    
    const newItem: PedidoItemInput = {
      producto_id: product.id,
      codigo: product.codigo,
      descripcion: product.descripcion,
      cantidad_unidades: addUnits,
      peso_estimado_kg: addWeight,
      precio_unitario: priceDetail.precio_venta
    };
    
    setItems([...items, newItem]);
    // Reset inputs
    setAddProductId('');
    setAddUnits(1);
    setAddWeight(10);
  };

  const handleRemoveItem = (prodId: number) => {
    setItems(items.filter(item => item.producto_id !== prodId));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.precio_unitario * item.peso_estimado_kg), 0);
  };

  const handleCreateOrder = async (ignoreWarning = false) => {
    if (!selectedClienteId || items.length === 0) {
      alert("Por favor complete los campos obligatorios");
      return;
    }
    
    const payload = {
      cliente_id: selectedClienteId,
      observaciones,
      items: items.map(it => ({
        producto_id: it.producto_id,
        cantidad_unidades: it.cantidad_unidades,
        peso_estimado_kg: it.peso_estimado_kg
      }))
    };
    
    if (ignoreWarning) {
      try {
        await pedidosAPI.create(payload);
        setWarningModalOpen(false);
        setDrawerOpen(false);
        resetForm();
        fetchInitialData();
      } catch (err: any) {
        alert("Error al guardar el pedido");
      }
      return;
    }

    try {
      const res = await pedidosAPI.create(payload);
      if (res.warning_credito) {
        // Credit limit warnings
        setWarningMsg(res.mensaje_warning);
        setPendingOrderPayload(payload);
        setWarningModalOpen(true);
      } else {
        setDrawerOpen(false);
        resetForm();
        fetchInitialData();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error al crear nota de pedido");
    }
  };

  const resetForm = () => {
    setSelectedClienteId('');
    setClientPriceList(null);
    setItems([]);
    setObservaciones('');
    setAddProductId('');
    setAddUnits(1);
    setAddWeight(10);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Notas de Pedido</h1>
          <p className="text-slate-400 text-sm mt-1">Carga y administración de órdenes comerciales de preventistas y WhatsApp.</p>
        </div>
        
        {/* Create Order Button */}
        {user?.rol !== 'CLIENTE' && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-rose-900/30"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Nota de Pedido
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <select
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">Todos los Clientes</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.razon_social}</option>
            ))}
          </select>
        </div>

        <div className="w-[180px]">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">Todos los Estados</option>
            <option value="Pendiente de preparación">Pendiente</option>
            <option value="En preparación">En preparación</option>
            <option value="Preparado/Listo para despacho">Preparado / Listo</option>
            <option value="Listo para despacho">Listo para despacho</option>
            <option value="En reparto">En reparto</option>
            <option value="Entregado">Entregado</option>
            <option value="Entrega parcial">Entrega parcial</option>
            <option value="No entregado">No entregado</option>
          </select>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase">
                <th className="py-3">Fecha</th>
                <th className="py-3">Cliente</th>
                <th className="py-3">Bultos</th>
                <th className="py-3 text-right">Monto Est.</th>
                <th className="py-3 text-center">Estado</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Ningún pedido registrado</td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="text-slate-350 hover:bg-slate-900/30">
                    <td className="py-4 font-semibold text-white">
                      {new Date(pedido.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-4">
                      <div className="font-semibold text-white">{pedido.cliente.razon_social}</div>
                      <div className="text-[10px] text-slate-450 font-mono">CUIT: {pedido.cliente.cuit || 'Sin CUIT'}</div>
                    </td>
                    <td className="py-4">{pedido.items?.length || 0} ítems</td>
                    <td className="py-4 text-right font-bold text-slate-200">
                      ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        pedido.estado === 'Pendiente de preparación' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        pedido.estado === 'En preparación' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        pedido.estado === 'Listo para despacho' || pedido.estado === 'Preparado/Listo para despacho' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        pedido.estado === 'Entregado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        pedido.estado === 'Entrega parcial' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => setViewOrderModal(pedido)}
                        className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Drawer - Modal Layout */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 overflow-hidden animate-slide-right">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-rose-500" />
                Nueva Nota de Pedido
              </h2>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                Cerrar
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* Select Client */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Cliente (Obligatorio)
                </label>
                <select
                  required
                  value={selectedClienteId}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-rose-500"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social} ({c.lista_precios?.nombre || 'Sin Lista'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClienteId && clientPriceList && (
                <>
                  {/* Add Product Section */}
                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Agregar Producto al Pedido</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Producto</label>
                        <select
                          value={addProductId}
                          onChange={(e) => setAddProductId(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-rose-500"
                        >
                          <option value="">Seleccionar...</option>
                          {clientPriceList.detalles.map((det: any) => (
                            <option key={det.producto_id} value={det.producto_id}>
                              {det.producto.codigo} - {det.producto.descripcion} (${det.precio_venta}/kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Unidades</label>
                        <input
                          type="number"
                          min="1"
                          value={addUnits}
                          onChange={(e) => setAddUnits(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-rose-500 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Peso Estimado (kg total)</label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={addWeight}
                          onChange={(e) => setAddWeight(Math.max(0.1, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-rose-500 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Añadir Ítem
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ítems del Pedido</h3>
                    
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                      {items.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-6">Ningún producto añadido aún</p>
                      ) : (
                        <div className="divide-y divide-slate-800">
                          {items.map((item) => (
                            <div key={item.producto_id} className="p-3 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-mono text-slate-400 mr-2">[{item.codigo}]</span>
                                <span className="font-semibold text-white">{item.descripcion}</span>
                                <div className="text-[10px] text-slate-450 mt-0.5">
                                  {item.cantidad_unidades} unidades • Est. {item.peso_estimado_kg} kg • ${item.precio_unitario}/kg
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-slate-200">
                                  ${(item.precio_unitario * item.peso_estimado_kg).toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.producto_id)}
                                  className="text-rose-400 hover:text-rose-300 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Observations */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Instrucciones especiales de entrega..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Summary & Submit */}
            <div className="border-t border-slate-800 pt-4 bg-slate-900 space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-450">Monto Estimado Total:</span>
                <span className="text-xl font-bold text-emerald-400">
                  ${calculateTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => handleCreateOrder(false)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-900/30 disabled:opacity-50"
              >
                Crear Nota de Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Limit Warning Modal */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Advertencia de Límite de Crédito</h3>
            <p className="text-xs text-slate-400">{warningMsg}</p>
            <p className="text-xs text-slate-300">¿Desea forzar el registro de este pedido con la alerta de crédito?</p>
            
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setWarningModalOpen(false)}
                className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateOrder(true)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-505 text-white font-semibold text-xs rounded-xl shadow-md"
              >
                Confirmar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Detalle de Pedido N° #{viewOrderModal.id}</h3>
              <button 
                onClick={() => setViewOrderModal(null)}
                className="text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Cliente:</span>
                <p className="font-bold text-white">{viewOrderModal.cliente?.razon_social}</p>
              </div>
              <div>
                <span className="text-slate-400">Fecha:</span>
                <p className="font-bold text-white">{new Date(viewOrderModal.fecha).toLocaleString('es-AR')}</p>
              </div>
              <div>
                <span className="text-slate-400">Estado:</span>
                <p className="font-bold text-rose-400">{viewOrderModal.estado}</p>
              </div>
              <div>
                <span className="text-slate-400">Total:</span>
                <p className="font-bold text-emerald-400">${viewOrderModal.total.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/50 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3 text-right">Cant. Unidades</th>
                    <th className="p-3 text-right">Peso Est.</th>
                    <th className="p-3 text-right">Peso Real</th>
                    <th className="p-3 text-right">Precio/Kg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {viewOrderModal.items?.map((item: any) => (
                    <tr key={item.id} className="text-slate-300">
                      <td className="p-3 font-mono text-slate-400">{item.producto.codigo}</td>
                      <td className="p-3">{item.producto.descripcion}</td>
                      <td className="p-3 text-right">{item.cantidad_unidades}</td>
                      <td className="p-3 text-right">{item.peso_estimado_kg} kg</td>
                      <td className="p-3 text-right text-rose-400 font-bold">{item.peso_real_kg || '-'} kg</td>
                      <td className="p-3 text-right">${item.precio_unitario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewOrderModal.observaciones && (
              <div className="p-3 bg-slate-950/30 rounded-xl border border-slate-850 text-xs">
                <span className="font-bold text-slate-400">Observaciones:</span>
                <p className="text-slate-300 mt-1">{viewOrderModal.observaciones}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
