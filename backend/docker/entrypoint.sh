#!/bin/bash
set -e

echo "============================================"
echo "  Appointly Backend - Container Startup"
echo "============================================"

echo "[1/4] Waiting for PostgreSQL to be ready..."
until php -r "
  \$conn = @pg_connect('host=' . getenv('DB_HOST') . ' port=' . getenv('DB_PORT') . ' dbname=' . getenv('DB_DATABASE') . ' user=' . getenv('DB_USERNAME') . ' password=' . getenv('DB_PASSWORD'));
  if (!\$conn) exit(1);
  pg_close(\$conn);
  exit(0);
" 2>/dev/null; do
  echo "  → Postgres not ready yet, retrying in 3s..."
  sleep 3
done
echo "  ✓ PostgreSQL is ready"

echo "[2/4] Running migrations..."
php artisan migrate --force
echo "  ✓ Migrations complete"

echo "[3/4] Running seeders..."
php artisan db:seed --force
echo "  ✓ Seeders complete"

echo "[4/4] Starting application server..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
