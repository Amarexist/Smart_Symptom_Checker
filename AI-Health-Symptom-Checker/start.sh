#!/bin/bash
# ── Sakhi v3 — GenAI Health Companion Launcher ────────────────
echo "🩺  Starting Sakhi v3 GenAI Backend..."
echo "──────────────────────────────────────"

cd "$(dirname "$0")/backend"

# Check .env exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Created .env — edit it to add your GEMINI_API_KEY"
fi

# Install deps if needed
pip install -r requirements.txt -q

# Launch
echo "✅  Server starting at http://localhost:8000"
echo "🌐  Open http://localhost:8000 in your browser"
echo "──────────────────────────────────────"
python main.py
