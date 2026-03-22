# Deployment Guide

## Self-Hosted (Docker Compose)

### Requirements
- Docker & Docker Compose
- A server (1GB RAM minimum, 4GB+ recommended for multiple agents)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/balaji-embedcentrum/swarmhq
cd swarmhq

# 2. Configure
cp .env.example .env
# Edit .env — set JWT_SECRET, ADMIN_PASSWORD etc.

# 3. Start infrastructure + server + UI
docker compose up -d

# 4. Start your first agent adapter
cd adapters/ollama
docker build -t swarmhq-ollama-adapter .
docker run -d \
  -e OLLAMA_URL=http://your-ollama-host:11434 \
  -e OLLAMA_MODEL=llama3.2 \
  -e AGENT_NAME=myagent \
  -e DISPLAY_NAME="My Agent" \
  -p 8101:8101 \
  swarmhq-ollama-adapter

# 5. Register the agent via CLI or UI
hive agent add --name myagent --display-name "My Agent" \
  --url http://localhost:8101 --adapter ollama

# 6. Open the UI
open http://localhost:3000
```

## Production (with Caddy HTTPS)

Add to your Caddyfile:
```
yourdomain.com {
    reverse_proxy localhost:3000
}
api.yourdomain.com {
    reverse_proxy localhost:8000
}
```
