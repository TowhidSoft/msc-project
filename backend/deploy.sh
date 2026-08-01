#!/usr/bin/env bash
# =============================================================
# deploy.sh — One-shot deployment script for the MSc backend
# Run this on your VPS after the initial server setup.
# Usage: bash deploy.sh
# =============================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"

echo "======================================"
echo "  MSc Backend — Deployment Script"
echo "======================================"

# ── 1. Verify .env exists ──────────────────────────────────
if [ ! -f "$REPO_DIR/.env" ]; then
  echo "ERROR: .env file not found at $REPO_DIR/.env"
  echo "  Copy .env.example to .env and fill in the secrets first:"
  echo "    cp .env.example .env && nano .env"
  exit 1
fi

# ── 2. Pull latest code (skip if not a git repo) ──────────
if [ -d "$REPO_DIR/.git" ]; then
  echo "[1/5] Pulling latest code..."
  git -C "$REPO_DIR" pull
else
  echo "[1/5] Skipping git pull (not a git repo)."
fi

# ── 3. Build images ────────────────────────────────────────
echo "[2/5] Building Docker images..."
docker compose -f "$COMPOSE_FILE" build --pull

# ── 4. Bring up services ──────────────────────────────────
echo "[3/5] Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# ── 5. Clean up dangling images ───────────────────────────
echo "[4/5] Cleaning up unused Docker images..."
docker image prune -f

# ── 6. Show status ────────────────────────────────────────
echo "[5/5] Service status:"
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "======================================"
echo "  Deployment complete!"
echo "  API Gateway: http://$(hostname -I | awk '{print $1}'):7000"
echo "  Nginx (port 80): http://$(hostname -I | awk '{print $1}')"
echo "======================================"
