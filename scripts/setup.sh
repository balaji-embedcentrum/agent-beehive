#!/bin/bash
# BeehiveHQ Quick Setup Script

set -e

echo "🐝 BeehiveHQ Setup"
echo "================"

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Please install Docker."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose not found."; exit 1; }

# Create .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  # Generate a random JWT secret
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i.bak "s/changeme_generate_a_real_secret_key/$JWT_SECRET/" .env
  echo "✅ .env created with random JWT secret"
  echo "⚠️  Please edit .env to set ADMIN_PASSWORD before continuing"
  exit 0
fi

# Start services
echo "🚀 Starting BeehiveHQ..."
docker compose up -d

echo ""
echo "✅ BeehiveHQ is running!"
echo "   UI:     http://localhost:3000"
echo "   API:    http://localhost:8000"
echo "   Docs:   http://localhost:8000/docs"
