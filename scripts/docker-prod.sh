#!/bin/bash
# Production deployment
set -e
cd "$(dirname "$0")/.."
docker compose -f docker-compose.yml up -d --build
docker compose logs -f astra-ciso
