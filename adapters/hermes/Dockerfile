FROM python:3.12-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Hermes (assumes it's pip-installable or available as binary)
# Adjust this to match how Hermes is installed in your environment
RUN pip install --no-cache-dir fastapi uvicorn httpx pydantic

WORKDIR /app
COPY adapter.py .

CMD ["python", "adapter.py"]
