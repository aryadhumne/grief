#!/bin/bash
# Run from the repo root: ./run.sh
# Starts the Flask backend and Vite frontend together; Ctrl+C stops both.

cleanup() {
  echo "Stopping backend and frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit
}
trap cleanup SIGINT SIGTERM

cd backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

npm run dev &
FRONTEND_PID=$!

echo "Backend (PID $BACKEND_PID) on :5000, Frontend (PID $FRONTEND_PID) on :5173"
wait