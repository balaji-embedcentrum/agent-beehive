"""
SwarmHQ Ollama Adapter
Connects directly to any Ollama model — no framework needed.
"""
import os
import httpx
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="SwarmHQ Ollama Adapter")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
AGENT_NAME = os.getenv("AGENT_NAME", "ollama-agent")
DISPLAY_NAME = os.getenv("DISPLAY_NAME", "Ollama Agent")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "You are a helpful AI assistant.")

# In-memory session history
_sessions: dict[str, list[dict]] = {}


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    from_agent: str = "user"


@app.post("/chat")
async def chat(req: ChatRequest):
    history = _sessions.setdefault(req.session_id, [])
    history.append({"role": "user", "content": req.message})

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json={
            "model": MODEL,
            "messages": messages,
            "stream": False,
        })
        resp.raise_for_status()
        data = resp.json()

    reply = data["message"]["content"]
    history.append({"role": "assistant", "content": reply})

    # Keep history at 20 messages
    if len(history) > 20:
        _sessions[req.session_id] = history[-20:]

    return {"response": reply, "agent_name": AGENT_NAME, "model": MODEL}


@app.get("/health")
async def health():
    return {
        "name": AGENT_NAME,
        "display_name": DISPLAY_NAME,
        "status": "online",
        "model": MODEL,
        "capabilities": ["chat"],
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8101")))
