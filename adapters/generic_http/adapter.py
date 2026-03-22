"""
SwarmHQ Generic HTTP Adapter
Proxies any existing HTTP endpoint that already speaks the SwarmHQ protocol.
Use this as a passthrough if your agent already implements /chat and /health.
"""
import os
import httpx
from fastapi import FastAPI, Request
from pydantic import BaseModel

app = FastAPI(title="SwarmHQ Generic HTTP Adapter")

TARGET_URL = os.getenv("TARGET_URL", "http://localhost:9000")
AGENT_NAME = os.getenv("AGENT_NAME", "generic-agent")


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    from_agent: str = "user"


@app.post("/chat")
async def chat(req: ChatRequest):
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{TARGET_URL}/chat", json=req.model_dump())
        resp.raise_for_status()
        return resp.json()


@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{TARGET_URL}/health")
            return resp.json()
    except Exception:
        return {"name": AGENT_NAME, "status": "offline"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8101")))
