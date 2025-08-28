#!/bin/bash

# Start Ollama in the background if it's not running
if ! pgrep -f "/usr/local/bin/ollama serve" > /dev/null; then
  echo "🔁 Starting Ollama..."
  /usr/local/bin/ollama serve &
  sleep 5  # wait for it to initialize
fi

# Start your Node server
echo "🚀 Starting local Node.js server..."
/opt/homebrew/bin/node server.js

open http://localhost:3000