FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

# system deps
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# install uv
RUN pip install --no-cache-dir uv

# deps
COPY pyproject.toml ./
# optional: if you have uv.lock, copy it too for faster reproducible builds
COPY pyproject.toml .
RUN uv pip install --system --no-cache fastapi uvicorn jinja2 sqlalchemy aiosqlite asyncpg authlib itsdangerous httpx

# app
COPY . .

EXPOSE 8000

# Render/Railway set $PORT; fallback 8000
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
