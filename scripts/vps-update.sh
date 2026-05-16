#!/usr/bin/env bash
# Safe VPS update for Pixvite-Web — git pull does NOT touch gitignored uploads.
# Usage: cd /var/www/invitesmagic/Pixvite-Web && bash scripts/vps-update.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p public/uploads/images public/uploads/audio public/videos render-server/order-renders

echo "==> git pull (uploads & order-renders stay on disk)..."
git pull --ff-only

npm ci
npm run build
cd render-server && npm ci

pm2 restart pixvite-web pixvite-render 2>/dev/null || pm2 restart all

echo "Done. User files kept:"
echo "  public/uploads/  public/videos/  render-server/order-renders/"
