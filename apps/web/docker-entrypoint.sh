#!/bin/sh
set -e

echo "Running database migrations..."
(cd apps/web && node ../../node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma)

echo "Starting server..."
exec node apps/web/server.js
