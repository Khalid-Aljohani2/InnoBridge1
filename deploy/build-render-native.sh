#!/usr/bin/env bash
# Use on Render (or similar) when NOT using Docker and the service runs PHP from the monorepo root.
# Set in dashboard: Build Command = bash deploy/build-render-native.sh
set -euo pipefail
composer install --no-dev --optimize-autoloader --no-interaction
npm ci
npm run build
echo "✓ Composer + Vite build done. Ensure APP_KEY and DATABASE_URL are set, then run migrations (e.g. php artisan migrate --force) on first deploy."
