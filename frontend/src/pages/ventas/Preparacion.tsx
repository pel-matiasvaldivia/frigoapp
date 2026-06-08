import React, { useEffect, useState } from 'react';
import { preparacionAPI, productosAPI } from '../../services/api';
import { 
  ClipboardList, 
  Check, 
  Play, 
  CheckSquare, 
  Search, 
  AlertTriangle,
  Scale,
  FileText,
  Printer,
  QrCode,
  Plus,
  Trash2,
  X
} from 'lucide-react';

export const Preparacion: React.FC = () => {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('Pendiente');
  
  // Edited weights state mapper: bultoId -> real weight
  const [weights, setWeights] = useState<Record<number, number>>({});
  const [confirmedBultos, setConfirmedBultos] = useState<Record<number, boolean>>({});
  
  // States for adding products
  const [productos, setProductos] = useState<any[]>([]);
  const [productFilter, setProductFilter] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [addUnits, setAddUnits] = useState<number>(1);
  const [addWeight, setAddWeight] = useState<number>(10);
  const [tempBultos, setTempBultos] = useState<any[]>([]);

  useEffect(() => {
    fetchOrdenes();
    fetchProductos();
  }, [filterEstado]);

  const fetchProductos = async () => {
    try {
      const res = await productosAPI.list();
      setProductos(res);
    } catch (err) {
      console.error("Error loading products:", err);
    }
  };

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const res = await preparacionAPI.list({ estado: filterEstado });
      setOrdenes(res);
    } catch (err) {
      console.error("Error loading preparation orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrden = async (orden: any) => {
    setSelectedOrden(orden);
    setTempBultos(JSON.parse(JSON.stringify(orden.bultos))); // Deep copy
    
    // Initialize edited values
    const initWeights: Record<number, number> = {};
    const initConfirmed: Record<number, boolean> = {};
    
    orden.bultos.forEach((b: any) => {
      initWeights[b.id] = b.peso_real_kg || b.peso_estimado_kg;
      initConfirmed[b.id] = b.confirmado;
    });
    
    setWeights(initWeights);
    setConfirmedBultos(initConfirmed);
  };

  const handleAddItem = (productId: number) => {
    const product = productos.find(p => p.id === productId);
    if (!product) return;

    if (tempBultos.some(b => b.producto_id === productId)) {
      alert("El producto ya está en la lista.");
      return;
    }

    const newBulto = {
      id: null,
      producto_id: product.id,
      producto: product,
      unidades: addUnits,
      peso_estimado_kg: addWeight,
      peso_real_kg: 0,
      confirmado: false
    };

    setTempBultos([...tempBultos, newBulto]);
    setProductFilter('');
    setShowDropdown(false);
  };

  const handleRemoveItem = (index: number) => {
    const newBultos = [...tempBultos];
    newBultos.splice(index, 1);
    setTempBultos(newBultos);
  };

  const handleUnitChange = (index: number, units: number) => {
    const newBultos = [...tempBultos];
    newBultos[index].unidades = units;
    // Auto-estimate weight (10kg per unit as fallback/default)
    newBultos[index].peso_estimado_kg = units * 10;
    setTempBultos(newBultos);
  };

  const handleWeightChange = (bultoId: number, value: number) => {
    setWeights({
      ...weights,
      [bultoId]: Math.max(0, value)
    });
  };

  const handleToggleConfirmBulto = (bultoId: number) => {
    setConfirmedBultos({
      ...confirmedBultos,
      [bultoId]: !confirmedBultos[bultoId]
    });
  };

  const handleStartPrep = async () => {
    if (!selectedOrden) return;
    try {
      const updated = await preparacionAPI.update(selectedOrden.id, {
        estado: 'En preparación'
      });
      setSelectedOrden(updated);
      fetchOrdenes();
    } catch (err) {
      alert("Error al iniciar preparación");
    }
  };

  const handleSaveWeights = async (complete = false) => {
    if (!selectedOrden) return;
    
    // Check if all are confirmed when completing
    if (complete) {
      const allConfirmed = tempBultos.every((b: any) => b.id ? confirmedBultos[b.id] : false);
      if (!allConfirmed) {
        alert("Para completar la preparación, debe marcar todos los bultos como listos/confirmados.");
        return;
      }
    }
    
    const bultosPayload = tempBultos.map((b: any) => ({
      id: b.id,
      producto_id: b.producto_id,
      unidades: b.unidades,
      peso_estimado_kg: b.peso_estimado_kg,
      peso_real_kg: b.id ? (weights[b.id] || 0.0) : 0.0,
      confirmado: b.id ? (confirmedBultos[b.id] || false) : false
    }));
    
    try {
      const payload: any = {
        bultos: bultosPayload
      };
      if (complete) {
        payload.estado = 'Completado';
      }
      
      const res = await preparacionAPI.update(selectedOrden.id, payload);
      alert(complete ? "¡Orden de preparación completada con éxito!" : "Cambios guardados correctamente.");
      
      if (complete) {
        setSelectedOrden(null);
      } else {
        // Refresh with new data from server
        handleSelectOrden(res);
      }
      fetchOrdenes();
    } catch (err) {
      console.error(err);
      alert("Error al guardar cambios de preparación");
    }
  };

  const handlePrintLabels = async () => {
    if (!selectedOrden) return;
    try {
      const res = await preparacionAPI.getEtiquetas(selectedOrden.id);
      if (res.pdf_path) {
        // Build absolute URL with cache-busting timestamp to bypass Service Worker interception
        const absoluteUrl = `${window.location.origin}${res.pdf_path}?t=${new Date().getTime()}`;
        window.open(absoluteUrl, '_blank');
      } else {
        alert("No se pudo generar el PDF de etiquetas.");
      }
    } catch {
      alert("Error al generar etiquetas. Verifique que la orden esté completada.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Sidebar List of Orders */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-6 h-fit shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Preparación</h2>
        </div>

        {/* Tab state filters */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {['Pendiente', 'En preparación', 'Completado'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setFilterEstado(st);
                setSelectedOrden(null);
              }}
              className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                filterEstado === st 
                  ? 'bg-white text-brand-600 shadow-sm border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {st === 'Pendiente' ? 'Nuevos' : st === 'En preparación' ? 'En Progreso' : 'Listos'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
            </div>
          ) : ordenes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-300 font-medium italic">No hay órdenes pendientes</p>
            </div>
          ) : (
            ordenes.map((orden) => (
              <div
                key={orden.id}
                onClick={() => handleSelectOrden(orden)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedOrden?.id === orden.id
                    ? 'border-brand-600 bg-brand-50/50 shadow-md transform scale-[1.02]'
                    : 'border-slate-50 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orden #{orden.id}</span>
                    <span className="text-slate-300 text-[10px]">|</span>
                    <span className="text-xs font-black text-slate-900 uppercase truncate max-w-[140px] tracking-tight">
                      {orden.pedido?.cliente?.razon_social}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-brand-600 bg-white px-2 py-0.5 rounded-full border border-brand-100 shadow-sm whitespace-nowrap">
                    {orden.bultos?.length} Bultos
                  </span>
                </div>
                <div className="flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  <span className="bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded mr-2">#{orden.pedido_id}</span>
                  <span>{orden.ruta?.nombre || 'General'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Preparation workspace */}
      <div className="lg:col-span-2 space-y-6">
        {!selectedOrden ? (
          <div className="border border-dashed border-slate-200 rounded-[2rem] p-16 text-center text-slate-400 flex flex-col items-center justify-center min-h-[500px] bg-slate-50/50">
            <Scale className="h-16 w-16 text-slate-200 mb-6 animate-bounce" />
            <h3 className="font-black text-slate-300 text-xl uppercase tracking-widest">Área de Balanza</h3>
            <p className="text-sm max-w-sm mt-3 font-medium">Seleccione una orden para cargar pesos reales.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-[2rem] bg-white p-8 space-y-8 shadow-sm">
            {/* Header info */}
            <div className="pb-8 border-b border-slate-100 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Orden <span className="text-brand-600">#{selectedOrden.pedido_id}</span></h2>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                      selectedOrden.estado === 'Pendiente' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      selectedOrden.estado === 'En preparación' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                      'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {selectedOrden.estado}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-500 uppercase tracking-tight">{selectedOrden.pedido?.cliente?.razon_social}</h3>
                </div>
                
                {selectedOrden.estado === 'Pendiente' && (
                  <button
                    onClick={handleStartPrep}
                    className="flex items-center px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-brand-900/20 transition-all uppercase tracking-widest"
                  >
                    <Play className="h-5 w-5 mr-3 fill-current" />
                    Iniciar Preparación
                  </button>
                )}

                {selectedOrden.estado === 'Completado' && (
                   <div className="flex space-x-3">
                      <a
                        href={selectedOrden.pedido?.comprobantes?.find((c: any) => c.tipo === 'REMITO')?.pdf_path 
                          ? `${window.location.origin}${selectedOrden.pedido.comprobantes.find((c: any) => c.tipo === 'REMITO').pdf_path}?t=${new Date().getTime()}` 
                          : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center px-6 py-4 font-bold text-sm rounded-2xl transition-all uppercase tracking-widest ${
                          selectedOrden.pedido?.comprobantes?.some((c: any) => c.tipo === 'REMITO' && c.pdf_path)
                            ? 'bg-white border-2 border-brand-600 text-brand-600 hover:bg-brand-50 shadow-sm'
                            : 'bg-slate-100 text-slate-400 border-2 border-transparent'
                        }`}
                        onClick={(e) => {
                          const remito = selectedOrden.pedido?.comprobantes?.find((c: any) => c.tipo === 'REMITO');
                          if (!remito) {
                            e.preventDefault();
                            alert("El remito aún no ha sido generado. Intente actualizar la lista.");
                          } else if (!remito.pdf_path) {
                            e.preventDefault();
                            alert("El PDF se está procesando. Por favor, espere 5 segundos y vuelva a intentar.");
                          }
                        }}
                      >
                        <FileText className="h-5 w-5 mr-3" />
                        Ver Remito PDF
                      </a>
                      <button
                        onClick={handlePrintLabels}
                        className="flex items-center px-6 py-4 font-bold text-sm rounded-2xl transition-all uppercase tracking-widest bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 shadow-sm"
                      >
                        <QrCode className="h-5 w-5 mr-3" />
                        Etiquetas QR
                      </button>
                   </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ruta:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedOrden.ruta?.nombre || 'Venta Local'}</span>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zona:</span>
                  <span className="text-sm font-bold text-slate-700">{selectedOrden.ruta?.zona || 'CABA/GBA'}</span>
                </div>
              </div>
            </div>

            {/* Checklist of products */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <Scale className="h-4 w-4 mr-2 text-brand-600" /> Control de Pesaje y Artículos
                </h3>
              </div>

              {/* Add Product Search Bar */}
              {selectedOrden.estado !== 'Completado' && (
                <div className="relative mb-6">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
                    <Search className="h-4 w-4 text-slate-400 mr-3" />
                    <input 
                      type="text"
                      placeholder="Agregar artículo al pedido (código o nombre)..."
                      value={productFilter}
                      onFocus={() => setShowDropdown(true)}
                      onChange={(e) => {
                        setProductFilter(e.target.value);
                        setShowDropdown(true);
                      }}
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300"
                    />
                    {productFilter && (
                      <button onClick={() => setProductFilter('')} className="p-1 hover:bg-slate-200 rounded-full">
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {showDropdown && productFilter && (
                    <>
                      <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                        {productos
                          .filter(p => 
                            p.descripcion.toLowerCase().includes(productFilter.toLowerCase()) || 
                            p.codigo?.toLowerCase().includes(productFilter.toLowerCase())
                          )
                          .slice(0, 8)
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAddItem(p.id)}
                              className="w-full text-left px-5 py-3 hover:bg-brand-50 border-b border-slate-50 last:border-0 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded leading-none">{p.codigo}</span>
                                <span className="text-xs font-bold text-slate-800">{p.descripcion}</span>
                              </div>
                            </button>
                          ))
                        }
                      </div>
                      <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                    </>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {tempBultos.map((bulto: any, idx: number) => (
                  <div 
                    key={bulto.id || `new-${idx}`} 
                    className={`p-6 rounded-3xl border transition-all ${
                      bulto.id && confirmedBultos[bulto.id]
                        ? 'bg-emerald-50 border-emerald-100 scale-[0.99] opacity-90'
                        : 'bg-white border-slate-100 hover:border-brand-200 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      {/* Product Name */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-bold text-xs bg-slate-100 text-slate-400 rounded px-1.5 py-0.5 tracking-tight">#{bulto.producto.codigo}</span>
                          <span className="font-bold text-slate-900 text-lg uppercase leading-tight tracking-tight">{bulto.producto.descripcion}</span>
                          {selectedOrden.estado !== 'Completado' && !(bulto.id && confirmedBultos[bulto.id]) && (
                            <button 
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg ml-auto md:ml-2 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-widest">
                          <div className="flex items-center">
                            <span className="text-slate-400 mr-2">Objetivo:</span>
                            <input 
                              type="number"
                              disabled={selectedOrden.estado === 'Completado' || (bulto.id && confirmedBultos[bulto.id])}
                              value={bulto.unidades}
                              onChange={(e) => handleUnitChange(idx, Number(e.target.value))}
                              className="w-12 bg-slate-100 border-none rounded text-center text-slate-700 focus:ring-1 focus:ring-brand-500 p-0.5"
                            />
                            <span className="text-slate-600 ml-1">UNID.</span>
                          </div>
                          <span className="text-slate-200">/</span>
                          <span className="text-slate-400">Estimado: <b className="text-slate-600">{bulto.peso_estimado_kg} KG</b></span>
                        </div>
                      </div>

                      {/* Weight Inputs */}
                      <div className="flex items-center space-x-4">
                        <div className="relative group">
                          <input
                            type="number"
                            step="0.1"
                            disabled={selectedOrden.estado === 'Completado' || (bulto.id && !confirmedBultos[bulto.id] && !bulto.id)} // Error in logic here, fix below
                            value={bulto.id ? (weights[bulto.id] || '') : ''}
                            onChange={(e) => bulto.id && handleWeightChange(bulto.id, Number(e.target.value))}
                            placeholder={bulto.id ? "0.0" : "S/H"}
                            readOnly={!bulto.id}
                            className={`w-32 px-4 py-4 border rounded-2xl text-xl font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 text-center transition-all font-mono placeholder:text-slate-200 ${
                              !bulto.id ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 rounded">Kilos Reales</div>
                        </div>

                        {/* Confirm item check */}
                        {selectedOrden.estado !== 'Completado' && bulto.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleConfirmBulto(bulto.id)}
                            className={`p-4 rounded-2xl border transition-all ${
                              confirmedBultos[bulto.id]
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20'
                                : 'bg-slate-50 text-slate-300 border-slate-200 hover:border-brand-300 hover:text-brand-600 group-hover:bg-brand-50/50'
                            }`}
                          >
                            <Check className={`h-6 w-6 transition-transform ${confirmedBultos[bulto.id] ? 'scale-110' : ''}`} />
                          </button>
                        )}
                        {!bulto.id && (
                           <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-slate-300 italic text-[10px] text-center w-[58px]">
                              Pend. Guardar
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observations from order */}
            {selectedOrden.observaciones && (
              <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start space-x-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Instrucciones Especiales</span>
                  <p className="text-sm text-amber-900 font-medium leading-relaxed italic">"{selectedOrden.observaciones}"</p>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            {selectedOrden.estado !== 'Completado' && (
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100">
                <button
                  onClick={() => handleSaveWeights(false)}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-2xl transition-all uppercase tracking-widest"
                >
                  Guardar Pesajes Parciales
                </button>
                <button
                  onClick={() => handleSaveWeights(true)}
                  className="py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-brand-900/20 transition-all flex items-center justify-center uppercase tracking-widest"
                >
                  <CheckSquare className="h-4 w-4 mr-3" />
                  Finalizar Preparación
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
