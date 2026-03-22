# SwarmHQ Architecture

## Overview

SwarmHQ is a 3-tier system:

1. **Agent Adapters** — thin HTTP wrappers around any AI agent framework
2. **SwarmHQ Server** — the routing brain (FastAPI + Postgres + Redis)
3. **SwarmHQ UI** — the group chat web interface (Next.js)

## Message Flow

```
User types "@kreacher what's the CPU?" in UI
    │
    ▼ POST /chat/send
SwarmHQ Server
    │ parses @mention → "kreacher"
    ▼ POST http://agent-kreacher:8101/chat
Kreacher Adapter (Ollama/Hermes/etc)
    │ runs inference
    ▼ returns response
SwarmHQ Server
    │ saves to Postgres
    ▼ publishes to Redis room:xxx:broadcast
WebSocket subscribers (all open UI tabs)
    ▼
UI displays response in real-time
```

## Agent-to-Agent Communication

Agents can call each other via the SwarmHQ Server's routing:

```python
# Agent code can POST to the server's /chat/send
# with from_agent="kreacher" to trigger routing
POST /chat/send
{
  "content": "@hermione summarize the logs I just found",
  "from_agent": "kreacher"
}
```

Or directly via Redis pub/sub:
```
PUBLISH agent:hermione:inbox {"message": "...", "from": "kreacher"}
```

## Scaling

- Each agent adapter is stateless (except session memory)
- Postgres handles all persistent state
- Redis handles all real-time messaging
- Add more agents: just register a new adapter URL
- Multiple SwarmHQ Server instances: share Postgres + Redis
