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
    # Permisos de uploads
    \"SELECT 1\", # placeholder
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
