#!/bin/sh
cd "$(dirname "$0")"
if grep -q "^DATABASE_URL=" .env 2>/dev/null && [ ! -d node_modules/pg ]; then npm install; fi
echo "Open http://localhost:3000"
node --no-warnings server.js
