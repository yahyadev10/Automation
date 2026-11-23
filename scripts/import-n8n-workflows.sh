#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${N8N_CONTAINER:-leadflow-n8n}"
INPUT="$ROOT/infra/n8n/workflows/all-workflows.json"

docker cp "$INPUT" "$CONTAINER:/tmp/leadflow-all-workflows.json" >/dev/null
docker exec -u node "$CONTAINER" n8n import:workflow --input=/tmp/leadflow-all-workflows.json

for id in \
  1c4e7b30-9d2a-4f11-8c33-0a1b2c3d4e5f \
  2d5f8c41-0e3b-4a22-9d44-1b2c3d4e5f60 \
  3e6a9d52-1f4c-4b33-ae55-2c3d4e5f6071; do
  docker exec -u node "$CONTAINER" n8n update:workflow --id="$id" --active=true
done

echo "Workflows imported. Restart n8n to register webhooks: docker compose restart n8n"
