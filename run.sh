#!/bin/bash

#!/bin/bash

set -euo pipefail

MODEL="${OLLAMA_MODEL:-llama3}"

find_ollama() {
  if command -v ollama >/dev/null 2>&1; then
    command -v ollama
  elif [ -x "/usr/local/bin/ollama" ]; then
    echo "/usr/local/bin/ollama"
  elif [ -x "/opt/homebrew/bin/ollama" ]; then
    echo "/opt/homebrew/bin/ollama"
  else
    echo ""  # not found
  fi
}

OLLAMA_BIN="$(find_ollama)"

if [ -z "${OLLAMA_BIN}" ]; then
  echo "❌ Ollama not found. Please install it from https://ollama.com/download or via Homebrew: brew install ollama"
else
  # Check if Ollama API is reachable; if not, start it
  if ! curl -sSf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo "🔁 Starting Ollama using: ${OLLAMA_BIN} serve"
    nohup "${OLLAMA_BIN}" serve >/tmp/ollama-serve.log 2>&1 &
    # wait for it to initialize
    for i in {1..10}; do
      if curl -sSf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
  fi

  # Ensure the requested model is available
  if "${OLLAMA_BIN}" list | awk '{print $1}' | grep -qx "${MODEL}"; then
    echo "✅ Ollama model '${MODEL}' is available."
  else
    echo "⬇️  Pulling Ollama model '${MODEL}' (this may take a while)…"
    "${OLLAMA_BIN}" pull "${MODEL}"
  fi
fi

#!/bin/bash

set -euo pipefail

# Config
TARGET_PORT=3000
MODEL="${OLLAMA_MODEL:-llama3.2}"

log() { echo "$@"; }

find_ollama() {
  if command -v ollama >/dev/null 2>&1; then
    command -v ollama
  elif [ -x "/usr/local/bin/ollama" ]; then
    echo "/usr/local/bin/ollama"
  elif [ -x "/opt/homebrew/bin/ollama" ]; then
    echo "/opt/homebrew/bin/ollama"
  else
    echo ""
  fi
}

ensure_ollama_running() {
  local bin="$1"
  if [ -z "$bin" ]; then
    log "❌ Ollama not found. Install from https://ollama.com/download or 'brew install ollama'"
    return 0
  fi
  if ! curl -sSf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    log "🔁 Starting Ollama: $bin serve"
    nohup "$bin" serve >/tmp/ollama-serve.log 2>&1 &
    for i in {1..10}; do
      if curl -sSf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
        break
      fi
      sleep 1
    done
  fi
}

ensure_model() {
  local bin="$1"
  local model="$2"
  [ -z "$bin" ] && return 0
  # Accept exact match, prefix match before colon, or with :latest suffix
  if "$bin" list | awk '{print $1}' | awk -F: '{print tolower($1)}' | grep -qx "$(echo "$model" | tr '[:upper:]' '[:lower:]')"; then
    log "✅ Ollama model '$model' available"
  else
    log "⬇️  Pulling Ollama model '$model'…"
    "$bin" pull "$model"
  fi
}

kill_on_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:${port} -sTCP:LISTEN >/dev/null 2>&1; then
    log "⚠️  Port ${port} in use. Stopping existing process…"
    local pids
    pids=$(lsof -nP -iTCP:${port} -sTCP:LISTEN -t || true)
    for pid in ${pids}; do
      local cmd
      cmd=$(ps -p "$pid" -o comm= || true)
      log "→ SIGTERM pid $pid ($cmd)"
      kill "$pid" || true
    done
    sleep 1
    local left
    left=$(lsof -nP -iTCP:${port} -sTCP:LISTEN -t || true)
    for pid in ${left}; do
      log "→ SIGKILL pid $pid"
      kill -9 "$pid" || true
    done
  fi
}

main() {
  # Ensure Ollama
  OLLAMA_BIN="$(find_ollama)"
  ensure_ollama_running "$OLLAMA_BIN"
  ensure_model "$OLLAMA_BIN" "$MODEL"

  # Free port 3000, then start Node
  kill_on_port "$TARGET_PORT"
  log "🚀 Starting local Node.js server on port ${TARGET_PORT}…"
  OLLAMA_MODEL="$MODEL" /opt/homebrew/bin/node server.js &
  SERVER_PID=$!

  sleep 1
  if command -v open >/dev/null 2>&1; then
    open http://localhost:${TARGET_PORT}
  else
    log "Open http://localhost:${TARGET_PORT} in your browser."
  fi

  wait ${SERVER_PID}
}

main "$@"
