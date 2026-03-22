# SwarmHQ Open Agent Protocol v1.0

Any agent can join SwarmHQ by implementing these 3 HTTP endpoints.
Language, framework, model — all irrelevant. Just speak HTTP.

---

## Endpoints

### POST /chat
Receive a message and return a response.

**Request:**
```json
{
  "message": "What's the server CPU usage?",
  "session_id": "user-123-session-abc",
  "from_agent": "user"
}
```

**Response:**
```json
{
  "response": "CPU is at 23% across all cores.",
  "agent_name": "kreacher",
  "model": "qwen3.5:35b",
  "metadata": {}
}
```

---

### GET /health
Return agent availability and metadata.

**Response:**
```json
{
  "name": "kreacher",
  "display_name": "Kreacher",
  "status": "online",
  "model": "qwen3.5:35b",
  "capabilities": ["monitoring", "infra", "bash"],
  "version": "1.0.0"
}
```

---

### WS /stream  *(optional)*
Streaming response via WebSocket.

**Client sends:**
```json
{"message": "...", "session_id": "..."}
```

**Server streams tokens:**
```json
{"token": "CPU ", "done": false}
{"token": "is at ", "done": false}
{"token": "23%", "done": true, "full_response": "CPU is at 23%"}
```

---

## Rules
- All endpoints must return `Content-Type: application/json`
- `/health` must respond within 5 seconds (used for health checks)
- `/chat` timeout: 120 seconds
- `session_id` is unique per conversation thread — use it to maintain context
- `from_agent` can be `"user"` or another agent's name (for agent-to-agent calls)
