"""
BeehiveHQ Hermes Adapter
Wraps a Hermes agent (claude-code) and exposes the BeehiveHQ protocol.
Hermes is run as a subprocess; messages sent via stdin, replies from stdout.
"""
import os
import asyncio
import subprocess
import json
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="BeehiveHQ Hermes Adapter")

AGENT_NAME = os.getenv("AGENT_NAME", "hermes-agent")
DISPLAY_NAME = os.getenv("DISPLAY_NAME", "Hermes Agent")
MODEL = os.getenv("HERMES_MODEL", "ollama/qwen3.5:35b")
SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "You are a helpful AI assistant.")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "https://gpu.jotx.dev")
HERMES_CMD = os.getenv("HERMES_CMD", "hermes")

# One Hermes process per session
_processes: dict[str, asyncio.subprocess.Process] = {}
_locks: dict[str, asyncio.Lock] = {}


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    from_agent: str = "user"


async def get_or_create_process(session_id: str) -> asyncio.subprocess.Process:
    if session_id not in _processes:
        env = os.environ.copy()
        env["OLLAMA_BASE_URL"] = OLLAMA_BASE_URL
        proc = await asyncio.create_subprocess_exec(
            HERMES_CMD, "--quiet", "--model", MODEL,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
            env=env,
        )
        _processes[session_id] = proc
        _locks[session_id] = asyncio.Lock()
    return _processes[session_id]


async def chat_with_hermes(session_id: str, message: str) -> str:
    proc = await get_or_create_process(session_id)
    lock = _locks[session_id]

    async with lock:
        # Send message
        proc.stdin.write((message + "\n").encode())
        await proc.stdin.drain()

        # Read until we get a complete response (ends with newline after content)
        response_lines = []
        while True:
            try:
                line = await asyncio.wait_for(proc.stdout.readline(), timeout=120.0)
                if not line:
                    break
                decoded = line.decode().rstrip()
                if decoded == "---END---":
                    break
                response_lines.append(decoded)
            except asyncio.TimeoutError:
                break

        return "\n".join(response_lines) or "(no response)"


@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        response = await chat_with_hermes(req.session_id, req.message)
    except Exception as e:
        response = f"Error: {e}"
    return {"response": response, "agent_name": AGENT_NAME, "model": MODEL}


@app.get("/health")
async def health():
    return {
        "name": AGENT_NAME,
        "display_name": DISPLAY_NAME,
        "status": "online",
        "model": MODEL,
        "capabilities": ["chat", "tools", "memory"],
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8101")))
