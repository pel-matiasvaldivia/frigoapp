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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Notas de Pedido</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Carga y administración de órdenes comerciales de preventistas y WhatsApp.</p>
        </div>
        
        {/* Create Order Button */}
        {user?.rol !== 'CLIENTE' && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-brand-900/20"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Nota de Pedido
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <select
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-brand-500 transition-all"
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
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-brand-500 transition-all"
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
      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 text-xs font-bold uppercase bg-slate-50/50">
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-4">Cliente</th>
                <th className="py-4 px-4">Bultos</th>
                <th className="py-4 px-4 text-right">Monto Est.</th>
                <th className="py-4 px-4 text-center">Estado</th>
                <th className="py-4 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">Ningún pedido registrado</td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="text-slate-600 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {new Date(pedido.fecha).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{pedido.cliente.razon_social}</div>
                      <div className="text-[10px] text-slate-500 font-mono">CUIT: {pedido.cliente.cuit || 'Sin CUIT'}</div>
                    </td>
                    <td className="py-4 px-4 font-medium">{pedido.items?.length || 0} ítems</td>
                    <td className="py-4 px-4 text-right font-black text-brand-700">
                      ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        pedido.estado === 'Pendiente de preparación' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        pedido.estado === 'En preparación' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        pedido.estado === 'Listo para despacho' || pedido.estado === 'Preparado/Listo para despacho' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        pedido.estado === 'Entregado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        pedido.estado === 'Entrega parcial' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {pedido.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setViewOrderModal(pedido)}
                        className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col p-6 overflow-hidden animate-slide-right shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 flex items-center">
                <ShoppingCart className="h-6 w-6 mr-3 text-brand-600" />
                Nueva Nota de Pedido
              </h2>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto py-6 space-y-8">
              {/* Select Client */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  CLIENTE (OBLIGATORIO)
                </label>
                <select
                  required
                  value={selectedClienteId}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-bold focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all cursor-pointer"
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
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
                      <Plus className="h-4 w-4 mr-2" /> AGREGAR PRODUCTO
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-tight">Producto</label>
                        <select
                          value={addProductId}
                          onChange={(e) => setAddProductId(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all cursor-pointer"
                        >
                          <option value="">Seleccionar producto del catálogo...</option>
                          {clientPriceList.detalles.map((det: any) => (
                            <option key={det.producto_id} value={det.producto_id}>
                              {det.producto.codigo} - {det.producto.descripcion} (${det.precio_venta}/kg)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-tight">Unidades</label>
                        <input
                          type="number"
                          min="1"
                          value={addUnits}
                          onChange={(e) => setAddUnits(Math.max(1, Number(e.target.value)))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-tight">Peso Est. (kg)</label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={addWeight}
                          onChange={(e) => setAddWeight(Math.max(0.1, Number(e.target.value)))}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-brand-900/10 uppercase tracking-widest flex items-center justify-center active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Añadir al Pedido
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
                      <ShoppingCart className="h-4 w-4 mr-2" /> ÍTEMS DETALLADOS
                    </h3>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                      {items.length === 0 ? (
                        <div className="text-center text-sm text-slate-400 py-10 italic">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-10" />
                          Ningún producto añadido aún
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <div key={item.producto_id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                              <div>
                                <span className="font-mono text-brand-600 font-bold mr-2 text-[10px]">#{item.codigo}</span>
                                <span className="font-bold text-slate-900 text-sm">{item.descripcion}</span>
                                <div className="text-[11px] text-slate-500 mt-1 font-medium">
                                  <span className="font-bold text-slate-700">{item.cantidad_unidades}</span> unid. • 
                                  <span className="font-bold text-slate-700"> {item.peso_estimado_kg}kg</span> • 
                                  <span className="font-bold text-slate-700"> ${item.precio_unitario}</span>/kg
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className="font-black text-slate-900 text-sm">
                                  ${(item.precio_unitario * item.peso_estimado_kg).toLocaleString('es-AR')}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.producto_id)}
                                  className="text-red-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="h-5 w-5" />
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
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                  OBSERVACIONES / ENTREGA
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: Entrega antes de las 10hs, preguntar por el encargado..."
                  rows={3}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Footer Summary & Submit */}
            <div className="border-t border-slate-100 pt-6 mt-auto space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">MONTO ESTIMADO</span>
                <span className="text-2xl font-black text-brand-600">
                  ${calculateTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => handleCreateOrder(false)}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-brand-900/20 disabled:opacity-30 disabled:shadow-none uppercase tracking-widest active:scale-[0.98]"
              >
                REGISTRAR NOTA DE PEDIDO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Limit Warning Modal */}
      {warningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 space-y-5 text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Advertencia de Límite de Crédito</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{warningMsg}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">¿Desea forzar el registro de este pedido?</p>
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => setWarningModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-2xl transition-all"
              >
                CANCELAR
              </button>
              <button
                onClick={() => handleCreateOrder(true)}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-900/20 transition-all active:scale-[0.98]"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 space-y-8 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Pedido <span className="text-brand-600">#{viewOrderModal.id}</span></h3>
              <button 
                onClick={() => setViewOrderModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Trash2 className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
                <p className="font-bold text-slate-900 text-sm truncate">{viewOrderModal.cliente?.razon_social}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                <p className="font-bold text-slate-900 text-sm">{new Date(viewOrderModal.fecha).toLocaleString('es-AR')}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
                <p className="font-black text-brand-600 text-xs uppercase">{viewOrderModal.estado}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto Total</span>
                <p className="font-black text-emerald-600 text-lg leading-none">${viewOrderModal.total.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    <th className="p-4">Código</th>
                    <th className="p-4">Descripción</th>
                    <th className="p-4 text-right">Cant.</th>
                    <th className="p-4 text-right">Peso Est.</th>
                    <th className="p-4 text-right">Peso Real</th>
                    <th className="p-4 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewOrderModal.items?.map((item: any) => (
                    <tr key={item.id} className="text-slate-700 hover:bg-white transition-colors">
                      <td className="p-4 font-mono text-brand-600 font-bold text-xs">{item.producto.codigo}</td>
                      <td className="p-4 font-bold text-slate-900">{item.producto.descripcion}</td>
                      <td className="p-4 text-right font-medium">{item.cantidad_unidades}u</td>
                      <td className="p-4 text-right font-medium">{item.peso_estimado_kg}kg</td>
                      <td className="p-4 text-right text-brand-700 font-black">{item.peso_real_kg || '-'} kg</td>
                      <td className="p-4 text-right font-bold">${item.precio_unitario}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {viewOrderModal.observaciones && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Instrucciones de Entrega</span>
                <p className="text-slate-700 font-medium italic leading-relaxed">"{viewOrderModal.observaciones}"</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
