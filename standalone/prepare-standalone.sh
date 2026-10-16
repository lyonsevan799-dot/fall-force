#!/usr/bin/env bash
# Non-destructive build: run from an exported project with dependencies installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ ! -x node_modules/.bin/vite ]; then
  echo "Install the exported project's dependencies with npm install first."
  exit 1
fi
./node_modules/.bin/vite build --config standalone/vite.config.js
if command -v zip >/dev/null 2>&1; then
  (cd dist-standalone && zip -q -r -FS ../gravity-switch-crazygames.zip .)
  echo "Created gravity-switch-crazygames.zip with index.html at its root."
else
  echo "ZIP the contents of dist-standalone, not the folder itself."
fi
echo "Build only: complete gameplay and CrazyGames iframe QA before submitting."