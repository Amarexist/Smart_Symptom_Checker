# 🩺 Sakhi v3 — GenAI Health Companion

> **AI-powered health symptom checker** using Google Gemini, RAG, Structured Output, and a cross-examination chatbot engine.

---

## ✨ GenAI Concepts Used

| Concept | Implementation |
|---|---|
| **LLM Integration** | Google Gemini 1.5 Flash via `google-generativeai` |
| **RAG (Retrieval-Augmented Generation)** | Medical knowledge base retrieved to augment LLM prompts |
| **Structured Output** | JSON symptom extraction with Pydantic validation |
| **Prompt Engineering** | Phase-specific system prompts for medical context |
| **Conversation Memory** | Rolling per-session history via `SessionState` |
| **Agentic Flow** | 5-phase state machine (Greeting → Cross-Exam → Profile → Confirm → Analyze) |
| **Cross-Examination** | Targeted follow-up questions per detected symptom |
| **Reconfirmation** | Summary shown to user before final analysis runs |
| **Fallback Mode** | Rule-based engine works offline with no API key |

---

## 🏗️ Project Structure

```
AI-Health-Symptom-Checker/
├── backend/
│   ├── main.py               # FastAPI app (REST API + static serving)
│   ├── chatbot_engine.py     # Core GenAI engine (Gemini + RAG + memory)
│   ├── medical_knowledge.py  # RAG knowledge base (20+ conditions, 45+ symptom groups)
│   ├── models.py             # Pydantic schemas (structured output)
│   ├── config.py             # pydantic-settings configuration
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # API keys (gitignored)
├── index.html                # Dark-mode glassmorphism UI
├── styles.css                # CSS design system (dark theme)
├── app.js                    # Frontend JS (API client + fallback engine)
├── knowledge-base.js         # Legacy JS knowledge base (fallback)
├── start.sh                  # One-click launcher
└── README.md
```

---

## 🚀 Quick Start

### 1. Get a Free Gemini API Key
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key

### 2. Set the API Key
```bash
cd backend
# Edit the .env file:
echo "GEMINI_API_KEY=your_key_here" > .env
```

### 3. Install & Run
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start the server
bash start.sh
```

### 4. Open the App
Open your browser at → **http://localhost:8000**

---

## 💬 Chatbot Conversation Flow

```
Phase 1: GREETING
  User describes symptoms in natural language
  └── Gemini extracts structured symptom list

Phase 2: CROSS-EXAMINATION  ← KEY GenAI Feature
  Sakhi asks targeted follow-up questions per symptom:
  • Duration: "How long have you had this fever?"
  • Severity: "How would you rate the chest pain 1-10?"
  • Character: "Is it sharp, dull, or pressure-like?"
  • Triggers: "Does anything make it better or worse?"

Phase 3: PROFILE COLLECTION
  • Age group
  • Pre-existing conditions
  • Current medications

Phase 4: RECONFIRMATION  ← KEY GenAI Feature
  Sakhi summarises everything it understood
  User confirms ✅ or corrects ❌ before analysis runs

Phase 5: AI ANALYSIS
  RAG retrieves relevant conditions from knowledge base
  Gemini generates personalised narrative summary
  Risk score (0-100) + urgency level computed
  Full health report rendered
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/session/new` | Create new chat session |
| `POST` | `/api/chat` | Send message, get AI reply |
| `GET` | `/api/session/{id}` | Get session state |
| `DELETE` | `/api/session/{id}` | Clear session |
| `GET` | `/health` | Server health check |
| `GET` | `/` | Serve frontend |

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | Google Gemini 1.5 Flash |
| **Backend** | Python 3.11+ · FastAPI · Uvicorn |
| **AI SDK** | google-generativeai |
| **Validation** | Pydantic v2 · pydantic-settings |
| **Frontend** | HTML · Vanilla CSS (dark glassmorphism) · JS |
| **Knowledge Base** | Python dict + RAG retrieval |
| **Deployment** | Any Python host (Railway, Render, GCP Cloud Run) |

---

## 🔐 Environment Variables

```env
GEMINI_API_KEY=your_key_here   # Required for full GenAI mode
APP_HOST=0.0.0.0               # Default: 0.0.0.0
APP_PORT=8000                  # Default: 8000
```

---

## ⚠️ Medical Disclaimer

Sakhi is an **AI health companion for informational purposes only**.  
It does **not** constitute a medical diagnosis or professional advice.  
Always consult a **licensed healthcare professional** before making health decisions.  
In an emergency, call **108 (India)** / **911 (USA)** / **999 (UK)** immediately.

---

*Built with ❤️ using Python · FastAPI · Google Gemini · RAG*
