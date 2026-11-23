#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${N8N_CONTAINER:-leadflow-n8n}"
OUT_DIR="${1:-$ROOT/backups/n8n/$(date +%Y%m%d-%H%M%S)}"

mkdir -p "$OUT_DIR"
docker exec -u node "$CONTAINER" n8n export:workflow --backup --output=/tmp/leadflow-workflows-backup >/dev/null
docker cp "$CONTAINER:/tmp/leadflow-workflows-backup/." "$OUT_DIR/" >/dev/null
echo "Workflows exported to $OUT_DIR"
