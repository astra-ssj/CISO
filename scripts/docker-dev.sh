#!/bin/bash
# Build and run Astra-CISO in Docker (development)
set -e
cd "$(dirname "$0")/.."
docker compose build
docker compose up -d
echo "Waiting for health check..."
sleep 10
curl -s http://localhost:3000/api/health | jq .
echo "Astra-CISO is running at http://localhost:3000"
