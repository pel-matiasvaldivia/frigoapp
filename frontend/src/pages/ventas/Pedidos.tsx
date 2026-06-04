import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  ShoppingCart,
  X
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
  const [productFilter, setProductFilter] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Warning Modal
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [pendingOrderPayload, setPendingOrderPayload] = useState<any>(null);
  
  // View Order Modal
  const [viewOrderModal, setViewOrderModal] = useState<any | null>(null);

  const location = useLocation();
  
  useEffect(() => {
    fetchInitialData();
    
    // Check if we should open drawer automatically
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      setDrawerOpen(true);
    }
  }, [filterEstado, filterCliente, location.search]);

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
    if (!addProductId) return;
    
    const product = productos.find(p => p.id === addProductId);
    if (!product) return;

    // Find price detail inside lists (if available)
    let precio = 0;
    if (clientPriceList) {
      const priceDetail = clientPriceList.detalles.find((d: any) => d.producto_id === addProductId);
      if (priceDetail) {
        precio = priceDetail.precio_venta;
      }
    }
    
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
      precio_unitario: precio
    };
    
    setItems([...items, newItem]);
    // Reset inputs
    setAddProductId('');
    setAddUnits(1);
    setAddWeight(10);
    setProductFilter('');
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
      alert(err.response?.data?.detail || "Error al crear pedido");
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
    setProductFilter('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ventas y Pedidos</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Gestión de órdenes comerciales y seguimiento de estados.</p>
        </div>
        
        {/* Create Order Button */}
        {user?.rol !== 'CLIENTE' && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-900/20 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar Pedido Manual
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="">Filtrar por Cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.razon_social}</option>
            ))}
          </select>
        </div>

        <div className="w-[200px]">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="Pendiente de preparación">Pendiente</option>
            <option value="En preparación">En preparación</option>
            <option value="Preparado/Listo para despacho">Listo para Despacho</option>
            <option value="En reparto">En reparto</option>
            <option value="Entregado">Entregado</option>
            <option value="Entrega parcial">Entrega parcial</option>
          </select>
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6 text-center">Detalle</th>
                <th className="py-4 px-6 text-right">Monto Estimado</th>
                <th className="py-4 px-6 text-center">Estado</th>
                <th className="py-4 px-6 text-center">Acciones</th>
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
                  <tr key={pedido.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-900">{new Date(pedido.fecha).toLocaleDateString('es-AR')}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight">#{pedido.id}</div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-900">{pedido.cliente.razon_social}</div>
                      <div className="text-xs text-slate-500 font-medium">CUIT: {pedido.cliente.cuit || '—'}</div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        {pedido.items?.length || 0} ítems
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="font-bold text-slate-900 text-base">${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-tight ${
                        pedido.estado === 'Pendiente de preparación' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        pedido.estado === 'En preparación' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        pedido.estado.includes('Listo') ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        pedido.estado === 'Entregado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {pedido.estado}
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setDrawerOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-8 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Agregar Pedido Manual</h2>
                  <p className="text-slate-400 text-xs font-medium">Complete el detalle para iniciar la preparación.</p>
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Select Client */}
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Cliente Solicitante *
                </label>
                <select
                  required
                  value={selectedClienteId}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="">Seleccione un cliente de la cartera...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.razon_social} ({c.lista_precios?.nombre || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClienteId && (
                <>
                  {/* Add Product Section */}
                  {/* Add Product Section */}
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-6">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Plus className="h-4 w-4 mr-2 text-brand-600" /> Agregar Ítems al Carrito
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                      <div className="md:col-span-2 relative">
                        <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest">Producto (Código o Nombre)</label>
                        <input
                          type="text"
                          placeholder="Escriba código o descripción..."
                          value={productFilter}
                          onFocus={() => setShowDropdown(true)}
                          onChange={(e) => {
                            setProductFilter(e.target.value);
                            setShowDropdown(true);
                            if (addProductId) setAddProductId(''); // Clear selection if typing
                          }}
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-sans"
                        />
                        {showDropdown && productFilter && (
                          <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto overflow-x-hidden">
                            {(clientPriceList ? clientPriceList.detalles : productos.map(p => ({ producto: p, producto_id: p.id, precio_venta: 0 })))
                              .filter((d: any) => 
                                d.producto.descripcion.toLowerCase().includes(productFilter.toLowerCase()) || 
                                d.producto.codigo?.toLowerCase().includes(productFilter.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((det: any) => (
                                <button
                                  key={det.producto_id}
                                  type="button"
                                  onClick={() => {
                                    setAddProductId(det.producto_id);
                                    setProductFilter(`${det.producto.codigo} - ${det.producto.descripcion}`);
                                    setShowDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">{det.producto.codigo}</span>
                                    <span className="text-xs font-bold text-slate-800">{det.producto.descripcion}</span>
                                    <span className="text-[10px] text-brand-600 font-bold ml-auto">${det.precio_venta}</span>
                                  </div>
                                </button>
                              ))
                            }
                            {(clientPriceList ? clientPriceList.detalles : productos).filter((det: any) => {
                              const p = det.producto || det;
                              return p.descripcion.toLowerCase().includes(productFilter.toLowerCase()) || 
                                     p.codigo?.toLowerCase().includes(productFilter.toLowerCase());
                            }).length === 0 && (
                              <div className="p-4 text-center text-xs text-slate-400 italic">No se encontraron productos</div>
                            )}
                          </div>
                        )}
                        {showDropdown && productFilter && (
                          <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
                        )}
                      </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest">Cant. Unidades</label>
                        <input
                          type="number"
                          min="1"
                          value={addUnits}
                          onChange={(e) => setAddUnits(Math.max(1, Number(e.target.value)))}
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest">Peso Estimado (kg)</label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={addWeight}
                          onChange={(e) => setAddWeight(Math.max(0.1, Number(e.target.value)))}
                          className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition-all shadow-lg active:scale-[0.98] uppercase tracking-widest"
                    >
                      Añadir Ítem
                    </button>
                  </div>

                  {/* Added Items List */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center px-1">
                      <ShoppingCart className="h-4 w-4 mr-2 text-brand-600" /> Detalle del Pedido
                    </h3>
                    
                    <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                      {items.length === 0 ? (
                        <div className="text-center text-sm text-slate-300 py-12 italic">
                          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-10" />
                          No hay productos en el pedido
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {items.map((item) => (
                            <div key={item.producto_id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{item.codigo}</span>
                                  <span className="font-bold text-slate-900 text-base">{item.descripcion}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-2 font-medium flex items-center space-x-3">
                                  <span><b className="text-slate-900">{item.cantidad_unidades}</b> u.</span>
                                  <span className="text-slate-300">•</span>
                                  <span><b className="text-slate-900">{item.peso_estimado_kg}</b> kg</span>
                                  <span className="text-slate-300">•</span>
                                  <span><b className="text-slate-900">${item.precio_unitario}</b>/kg</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-6">
                                <div className="text-right">
                                  <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-0.5">Subtotal</div>
                                  <div className="font-bold text-slate-900 text-lg leading-none">
                                    ${(item.precio_unitario * item.peso_estimado_kg).toLocaleString('es-AR')}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.producto_id)}
                                  className="text-slate-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"
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
            <div className="border-t border-slate-100 p-8 bg-white space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimado</span>
                <span className="text-3xl font-bold text-brand-600 tracking-tight">
                  ${calculateTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => handleCreateOrder(false)}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl transition-all shadow-xl shadow-brand-900/20 disabled:opacity-30 disabled:shadow-none uppercase tracking-widest active:scale-[0.98]"
              >
                Confirmar Registro de Pedido
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-[2.5rem] p-10 space-y-10 shadow-2xl animate-in zoom-in duration-200 ml-0 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Pedido <span className="text-brand-600">#{viewOrderModal.id}</span></h3>
                  <p className="text-slate-400 text-xs font-medium">Información detallada de la orden comercial.</p>
                </div>
              </div>
              <button 
                onClick={() => setViewOrderModal(null)}
                className="p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <X className="h-7 w-7" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</span>
                <p className="font-bold text-slate-900 text-base">{viewOrderModal.cliente?.razon_social}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Registrada</span>
                <p className="font-medium text-slate-900 text-sm">{new Date(viewOrderModal.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado Actual</span>
                <p className="inline-flex px-2 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold rounded uppercase tracking-wider border border-brand-100">
                  {viewOrderModal.estado}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monto Total</span>
                <p className="font-bold text-slate-900 text-2xl tracking-tighter leading-none">${viewOrderModal.total.toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="py-4 px-6 text-center">Cod</th>
                    <th className="py-4 px-6">Producto</th>
                    <th className="py-4 px-6 text-right">Cant.</th>
                    <th className="py-4 px-6 text-right">Monto</th>
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
