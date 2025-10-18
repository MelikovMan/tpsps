#!/bin/bash
alembic upgrade head

if [ -v PORT ]; then
  exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
else
  exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
