#!/usr/bin/env bash
#
# prepare-standalone.sh — Strip the Base44 auth shell from an exported copy
# of the project and build a self-contained HTML5 bundle for CrazyGames.
#
# Usage:
#   1. Export your app from the Base44 editor (download ZIP).
#   2. Unzip it and cd into the project root.
#   3. Run:  bash standalone/prepare-standalone.sh
#
# This script does NOT modify your hosted Base44 app — it only touches the
# local exported copy. When it finishes, the dist/ folder is your CrazyGames
# submission (upload its contents).
#
set -euo pipefail

ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$ROOT/src/main.jsx" ]; then
  echo "✗ Run this from the exported project root (src/main.jsx not found here)."
  exit 1
fi

echo "► Replacing entry files with standalone versions…"
cp "$SCRIPT_DIR/src/App.jsx"      "$ROOT/src/App.jsx"
cp "$SCRIPT_DIR/vite.config.js"  "$ROOT/vite.config.js"
cp "$SCRIPT_DIR/package.json"    "$ROOT/package.json"
cp "$SCRIPT_DIR/index.html"      "$ROOT/index.html"

echo "► Removing Base44 backend, auth, and unused UI files…"
rm -rf  "$ROOT/base44"
rm -rf  "$ROOT/src/api"
rm -rf  "$ROOT/src/lib"
rm -rf  "$ROOT/src/hooks"
rm -rf  "$ROOT/src/utils"
rm -rf  "$ROOT/src/components/ui"
rm -f   "$ROOT/src/components/AuthLayout.jsx"
rm -f   "$ROOT/src/components/GoogleIcon.jsx"
rm -f   "$ROOT/src/components/ProtectedRoute.jsx"
rm -f   "$ROOT/src/components/ScrollToTop.jsx"
rm -f   "$ROOT/src/components/UserNotRegisteredError.jsx"
rm -f   "$ROOT/src/pages/Login.jsx"
rm -f   "$ROOT/src/pages/Register.jsx"
rm -f   "$ROOT/src/pages/ForgotPassword.jsx"
rm -f   "$ROOT/src/pages/ResetPassword.jsx"
rm -f   "$ROOT/src/pages/OAuthConsent.jsx"
rm -f   "$ROOT/package-lock.json" "$ROOT/yarn.lock" "$ROOT/pnpm-lock.yaml" 2>/dev/null || true

echo "► Installing dependencies (clean)…"
rm -rf "$ROOT/node_modules"
npm install

echo "► Building standalone HTML5 bundle…"
npm run build

echo ""
echo "✓ Done. Upload the contents of dist/ to CrazyGames."
echo "  (The standalone/ folder is ignored by the build — safe to delete.)"