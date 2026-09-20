#!/bin/bash

# Kill any existing background processes on script exit
cleanup() {
  echo -e "\n🛑 Stopping all servers..."
  kill $(jobs -p) 2>/dev/null
  exit
}
trap cleanup SIGINT SIGTERM EXIT

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================"
echo "🚀 Starting AI Oil Spill Intelligence System"
echo "========================================================"

# 0. Ensure Docker and PostGIS Database are running
if command -v docker &>/dev/null; then
  if ! docker ps &>/dev/null; then
    echo "🐳 Starting Docker Desktop..."
    open -a Docker 2>/dev/null || true
    for i in {1..30}; do
      if docker ps &>/dev/null; then break; fi
      sleep 1
    done
  fi
  if docker ps &>/dev/null; then
    echo "🗄️  Ensuring PostGIS database container is up..."
    docker compose -f "$ROOT_DIR/docker-compose.yml" up -d 2>/dev/null || true
  fi
fi

# 1. Start FastAPI Backend on port 8000
echo "⚙️  Starting FastAPI Backend on http://localhost:8000 ..."
"$ROOT_DIR/backend/.venv/bin/python" -m uvicorn app.main:app --app-dir "$ROOT_DIR/backend" --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "✅ Backend is healthy at http://localhost:8000"
    break
  fi
  sleep 1
done

# 2. Start Vite Frontend on port 5173
echo "💻 Starting Vite Frontend on http://localhost:5173 ..."
cd "$ROOT_DIR/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo "  🌟 READY! OPEN THIS SINGLE LOCALHOST IN YOUR BROWSER:"
echo "     👉 http://localhost:5173"
echo "========================================================"
echo "Press Ctrl+C at any time to shut down both servers."
echo ""

# Keep running
wait
