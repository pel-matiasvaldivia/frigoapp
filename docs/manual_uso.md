# Manual de Uso: Flujo Operativo FrigoApp

Este manual describe el proceso "End-to-End" desde el alta de un cliente hasta la entrega de la mercadería en destino.

## 1. Diagrama de Proceso Principal

```mermaid
graph TD
    A[Alta de Cliente] --> B[Carga de Pedido]
    B --> C[Preparación en Balanza]
    C --> D[Emisión de Comprobante]
    D --> E[Despacho y Hoja de Ruta]
    E --> F[Confirmación de Entrega]
```

---

## 2. Paso a Paso Detallado

### Paso 1: Alta de Cliente (Módulo Clientes)
El proceso comienza registrando al cliente en el sistema.
- **Acción:** Ir a `Admin > Clientes`.
- **Datos Clave:** Razón Social, CUIT (para facturación), Dirección de entrega y **Ruta Logística** asignada.
- **Importante:** La ruta determina qué transportista verá el pedido en su hoja de ruta.

### Paso 2: Carga del Pedido (Módulo Pedidos)
Se registran los productos y cantidades estimadas que el cliente solicita.
- **Acción:** Ir a `Ventas > Pedidos`.
- **Proceso:** Seleccionar cliente, agregar productos (unidades/piezas) y definir fecha de entrega.
- **Nota:** El precio se toma automáticamente de la *Lista de Precios* asociada al cliente.

### Paso 3: Preparación y Balanza (Módulo Preparación)
En el frigorífico, se preparan los cortes físicos y se pesan.
- **Acción:** El operario de balanza entra a `Ventas > Preparación`.
- **Proceso:** Selecciona la orden, inicia la preparación y carga los **Kilos Reales** de cada bulto. 
- **Cierre:** Una vez pesados todos los ítems, se marca como "Finalizar Preparación".

### Paso 4: Facturación (Módulo Comprobantes)
Con los pesos reales confirmados, se genera el documento legal.
- **Acción:** Ir a `Ventas > Facturación`.
- **Proceso:** Los pedidos preparados aparecerán en la lista de "Pendientes". Se selecciona el pedido y se opta por generar una **Factura (AFIP)** o un **Remito Interno**.
- **Resultado:** El sistema calcula el total final basado en los kilos exactos de balanza.

### Paso 5: Despacho y Entrega (Módulo Despacho)
El transportista gestiona la logística final.
- **Acción:** Acceso desde `Ventas > Despacho` (optimizado para móviles).
- **Proceso:** El chofer ve su "Hoja de Ruta" con todos los repartos del día. 
- **Confirmación:** Al llegar al cliente, registra novedades (si las hay) y solicita la **Firma Digital** en pantalla.

---

## 3. Estados del Pedido
- **Pendiente:** Creado, esperando ser preparado.
- **En Preparación:** Siendo pesado en balanza.
- **Preparado:** Pesos cargados, listo para facturar.
- **Despachado:** Documento emitido, en viaje.
- **Entregado:** Proceso finalizado con firma del cliente.

> [!TIP]
> Use el **Dashboard** para ver el estado general de la operación en tiempo real y detectar cuellos de botella en la preparación o el despacho.
