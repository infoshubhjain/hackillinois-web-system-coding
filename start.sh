#!/usr/bin/env sh
# Install deps (only if missing) and start the dev server.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
exec npm run dev -- --open "$@"
