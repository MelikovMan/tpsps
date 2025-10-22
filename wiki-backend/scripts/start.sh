#!/bin/bash
alembic upgrade head

if [ -v PORT ]; then
  exec uvicorn app.main:app --host 0.0.0.0 --forwarded-allow-ips="*" --port $PORT
else
  exec uvicorn app.main:app --host 0.0.0.0 --forwarded-allow-ips="*" --port 8000
fi
