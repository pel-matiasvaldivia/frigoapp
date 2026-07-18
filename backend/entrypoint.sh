#!/bin/sh
set -e

echo "[Entrypoint] Esperando a que la base de datos esté disponible..."
until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')" 2>/dev/null; do
  sleep 1
done
echo "[Entrypoint] Base de datos disponible."

echo "[Entrypoint] Aplicando migraciones..."
python -c "
import psycopg2, os

conn = psycopg2.connect(os.environ['DATABASE_URL'])
conn.autocommit = True
cur = conn.cursor()

migrations = [
    # Trazabilidad de bultos (v1.1)
    \"ALTER TABLE orden_preparacion_bultos ADD COLUMN IF NOT EXISTS tracking_uuid VARCHAR UNIQUE\",
    \"ALTER TABLE orden_preparacion_bultos ADD COLUMN IF NOT EXISTS estado_logistico VARCHAR DEFAULT 'PREPARADO'\",
    \"ALTER TABLE orden_preparacion_bultos ADD COLUMN IF NOT EXISTS fecha_carga TIMESTAMP\",
    \"ALTER TABLE orden_preparacion_bultos ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMP\",
    \"CREATE INDEX IF NOT EXISTS ix_bultos_tracking_uuid ON orden_preparacion_bultos(tracking_uuid)\",
    # Float → Numeric para campos monetarios (v1.2)
    # Evita errores de precision binaria en calculos financieros
    \"ALTER TABLE pedidos ALTER COLUMN total TYPE NUMERIC(12,2) USING total::NUMERIC(12,2)\",
    \"ALTER TABLE pedido_items ALTER COLUMN precio_unitario TYPE NUMERIC(12,2) USING precio_unitario::NUMERIC(12,2)\",
    \"ALTER TABLE pedido_items ALTER COLUMN subtotal TYPE NUMERIC(12,2) USING subtotal::NUMERIC(12,2)\",
    \"ALTER TABLE comprobantes ALTER COLUMN total TYPE NUMERIC(12,2) USING total::NUMERIC(12,2)\",
    \"ALTER TABLE cuentas_corrientes ALTER COLUMN saldo_actual TYPE NUMERIC(12,2) USING saldo_actual::NUMERIC(12,2)\",
    \"ALTER TABLE cuentas_corrientes ALTER COLUMN limite_credito TYPE NUMERIC(12,2) USING limite_credito::NUMERIC(12,2)\",
    \"ALTER TABLE movimientos_cc ALTER COLUMN monto TYPE NUMERIC(12,2) USING monto::NUMERIC(12,2)\",
    \"ALTER TABLE lista_precios_detalle ALTER COLUMN precio_costo TYPE NUMERIC(12,2) USING precio_costo::NUMERIC(12,2)\",
    \"ALTER TABLE lista_precios_detalle ALTER COLUMN precio_venta TYPE NUMERIC(12,2) USING precio_venta::NUMERIC(12,2)\",
    \"ALTER TABLE lista_precios_detalle ALTER COLUMN precio_mayoreo TYPE NUMERIC(12,2) USING precio_mayoreo::NUMERIC(12,2)\",
    \"ALTER TABLE clientes ALTER COLUMN limite_credito TYPE NUMERIC(12,2) USING limite_credito::NUMERIC(12,2)\",
    \"ALTER TABLE sesiones_caja ALTER COLUMN monto_apertura TYPE NUMERIC(12,2) USING monto_apertura::NUMERIC(12,2)\",
    \"ALTER TABLE sesiones_caja ALTER COLUMN monto_cierre TYPE NUMERIC(12,2) USING monto_cierre::NUMERIC(12,2)\",
    \"ALTER TABLE movimientos_caja ALTER COLUMN monto TYPE NUMERIC(12,2) USING monto::NUMERIC(12,2)\",
]

for sql in migrations:
    try:
        cur.execute(sql)
        print(f'  OK: {sql[:60]}...')
    except Exception as e:
        print(f'  SKIP ({e}): {sql[:60]}...')

cur.close()
conn.close()
print('[Entrypoint] Migraciones completadas.')
"

echo "[Entrypoint] Iniciando aplicación..."
exec "$@"
