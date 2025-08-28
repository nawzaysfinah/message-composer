#!/bin/bash

# Start Ollama in the background if it's not running
if ! pgrep -f "ollama serve" > /dev/null; then
  echo "🔁 Starting Ollama..."
  ollama serve &
  sleep 5  # wait for it to initialize
fi

# Start your Node server
echo "🚀 Starting local Node.js server..."
node server.js