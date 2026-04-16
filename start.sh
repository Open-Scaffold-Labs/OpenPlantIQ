#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing processes on our ports
lsof -ti:5189 -ti:3021 | xargs kill -9 2>/dev/null

# Start API server
echo "Starting Open Plant IQ API..."
NODE_ENV=development node --no-warnings "$SCRIPT_DIR/server/src/index.js" &
API_PID=$!

# Start client
echo "Starting Open Plant IQ client..."
cd "$SCRIPT_DIR/client" && npm run dev &
CLIENT_PID=$!

echo ""
echo "---------------------------------------"
echo "  Open Plant IQ"
echo "  API:    http://localhost:3021"
echo "  App:    http://localhost:5189"
echo "---------------------------------------"
echo "Press Ctrl+C to stop."

# Wait for both processes
wait $API_PID $CLIENT_PID
