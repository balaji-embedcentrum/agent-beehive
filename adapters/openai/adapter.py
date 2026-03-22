"""
BeehiveHQ OpenAI-Compatible Adapter
Works with OpenAI, Groq, Together, Anthropic-via-proxy, or any OpenAI-compatible API.
"""
import os
import httpx
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="BeehiveHQ OpenAI Adapter")

API_BASE = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
AGENT_NAME = os.getenv("AGENT_NAME", "openai-agent")
DISPLAY_NAME = os.getenv("DISPLAY_NAME", "OpenAI Agent")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "You are a helpful AI assistant.")

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

    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{API_BASE}/chat/completions",
            headers=headers,
            json={"model": MODEL, "messages": messages}
        )
        resp.raise_for_status()
        data = resp.json()

    reply = data["choices"][0]["message"]["content"]
    history.append({"role": "assistant", "content": reply})
    if len(history) > 20:
        _sessions[req.session_id] = history[-20:]

    return {"response": reply, "agent_name": AGENT_NAME, "model": MODEL}


@app.get("/health")
async def health():
    return {
        "name": AGENT_NAME, "display_name": DISPLAY_NAME,
        "status": "online", "model": MODEL,
        "capabilities": ["chat"], "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8101")))
