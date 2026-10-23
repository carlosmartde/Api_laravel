#!/bin/sh
set -eu

if [ -z "${APP_URL:-}" ] && [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
    export APP_URL="$RENDER_EXTERNAL_URL"
fi

php artisan config:clear
php artisan migrate --force

if [ "${SEED_DATABASE:-false}" = "true" ]; then
    php artisan db:seed --force
fi

php artisan config:cache
php artisan route:cache

exec "$@"
