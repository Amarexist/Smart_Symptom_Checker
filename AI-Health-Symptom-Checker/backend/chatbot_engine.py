"""
chatbot_engine.py — Core Gen AI chatbot with Gemini + Cross-Examination
GenAI Concepts Used:
  1. Prompt Engineering  — Phase-specific system prompts
  2. Structured Output   — JSON extraction for symptoms
  3. RAG                 — Knowledge base retrieval augments Gemini prompts
  4. Conversation Memory — Rolling history per session
  5. Agentic Flow        — Phase state machine (greeting → examine → confirm → analyze)
"""

import json, re, uuid
from typing import Dict, Tuple
import google.generativeai as genai

from config import settings
from models import SessionState, ChatPhase
from medical_knowledge import (
    SYMPTOM_GROUPS, DISEASES, IMMEDIATE_ACTIONS, CROSS_EXAM_QUESTIONS
)
import ml_inference  # ML model integration

# ── System prompt (injected once per session) ─────────────────────
SYSTEM_PROMPT = """You are Sakhi, an empathetic AI health companion built by MedAI Health Technologies.

Your MISSION:
- Help users understand their symptoms through gentle, thorough questioning
- Cross-examine each symptom (duration, severity, location, associated symptoms)
- Reconfirm your understanding before running analysis
- Always remind users you are NOT a substitute for a real doctor

Your PERSONALITY:
- Warm, caring, and professional
- Ask ONE focused question at a time
- Be concise — no more than 3 sentences per response
- Use Indian English context when appropriate

ABSOLUTE RULES:
- Never diagnose definitively
- Always recommend consulting a licensed doctor
- In emergencies, immediately say "Call 108 (India) / 911 (USA) NOW"
- Never suggest stopping prescribed medications
"""

# ── Prompt templates ──────────────────────────────────────────────
EXTRACT_SYMPTOMS_PROMPT = """The user described their health symptoms. Extract ALL symptoms mentioned.

User message: "{message}"

Respond ONLY with valid JSON (no markdown, no extra text):
{{"symptoms": ["symptom1", "symptom2"], "duration": "X days or null", "severity": "mild/moderate/severe or null"}}

Map symptoms to these standard names where possible: {symptom_list}
"""

CROSS_EXAM_PROMPT = """You are Sakhi. The patient mentioned "{symptom}".

Conversation so far:
{history}

Ask ONE focused follow-up question about their {symptom} to understand:
- Duration (how long)
- Severity (1-10 scale)  
- Character (sharp/dull/constant/intermittent)
- Triggers or relieving factors

Be warm and empathetic. ONE question only. No more than 2 sentences.
"""

CONFIRMATION_PROMPT = """You are Sakhi. Summarize what you've understood and ask the patient to confirm.

Detected symptoms: {symptoms}
Patient profile: {profile}
Symptom details: {details}

Write a warm, clear summary in bullet points, then ask:
"Does this capture everything correctly? Please confirm or let me know what to correct."

Keep it under 120 words.
"""

ANALYSIS_PROMPT = """You are Sakhi, a medical AI assistant. Based on the patient's data below, provide a preliminary health assessment.

Patient Profile:
{profile}

Symptoms with details:
{symptom_details}

Most likely conditions from knowledge base:
{conditions}

Provide:
1. A warm 2-sentence summary of their likely situation
2. Urgency level: {urgency}
3. Top recommendation

CRITICAL: End with "Please consult a qualified healthcare professional before taking any action."
Keep total response under 150 words.
"""


class ChatbotEngine:
    """
    Phase-based conversational AI engine.
    GenAI Pattern: Agentic multi-step reasoning with persistent memory.
    """

    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}
        self._llm_ready = False

        if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
            try:
                genai.configure(api_key=settings.gemini_api_key)
                self.model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=SYSTEM_PROMPT,
                )
                self._llm_ready = True
                print("✅ Gemini AI connected successfully")
            except Exception as e:
                print(f"⚠️  Gemini init failed: {e}. Using rule-based fallback.")
        else:
            print("⚠️  No Gemini API key — running rule-based fallback mode.")

    # ── Session management ────────────────────────────────────────
    def get_session(self, session_id: str) -> SessionState:
        if session_id not in self.sessions:
            self.sessions[session_id] = SessionState(session_id=session_id)
        return self.sessions[session_id]

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

    # ── Main entry point ──────────────────────────────────────────
    async def process(self, session_id: str, message: str) -> dict:
        session = self.get_session(session_id)

        # Add user message to history
        session.history.append({"role": "user", "content": message})

        if session.phase == ChatPhase.GREETING:
            reply, session = await self._handle_greeting(session, message)
        elif session.phase == ChatPhase.CROSS_EXAMINE:
            reply, session = await self._handle_cross_exam(session, message)
        elif session.phase == ChatPhase.PROFILE:
            reply, session = await self._handle_profile(session, message)
        elif session.phase == ChatPhase.CONFIRMATION:
            reply, session = await self._handle_confirmation(session, message)
        elif session.phase == ChatPhase.ANALYSIS:
            reply, session = await self._handle_analysis(session)
        else:
            reply = "I've already completed your analysis. Click **New Analysis** to start over."

        session.history.append({"role": "assistant", "content": reply})
        progress = self._calc_progress(session)

        return {
            "session_id": session_id,
            "reply": reply,
            "phase": session.phase,
            "detected_symptoms": session.detected_symptoms,
            "confirmed_symptoms": session.confirmed_symptoms,
            "progress": progress,
            "show_results": session.phase == ChatPhase.DONE,
            "results": session.results,
        }

    # ── Phase: GREETING → extract initial symptoms ────────────────
    async def _handle_greeting(self, session: SessionState, message: str) -> Tuple[str, SessionState]:
        symptoms = await self._extract_symptoms(message)

        if symptoms:
            session.detected_symptoms = symptoms
            session.cross_exam_queue = [s for s in symptoms if s in CROSS_EXAM_QUESTIONS][:5]
            session.phase = ChatPhase.CROSS_EXAMINE
            sym_list = ", ".join(s.replace("_", " ") for s in symptoms)
            reply = (
                f"I can see you're experiencing: **{sym_list}**. 🩺\n\n"
                f"To give you the most accurate assessment, I need to understand each symptom better. "
                f"Let me ask a few focused questions."
            )
            # Ask first cross-exam question immediately
            if session.cross_exam_queue:
                first_q = await self._gen_cross_exam_q(session, session.cross_exam_queue[0])
                session.cross_exam_index = 1
                reply += f"\n\n{first_q}"
        else:
            reply = (
                "I'm sorry you're not feeling well. 🙏 Could you describe your symptoms in a bit more detail? "
                "For example: *'I have a fever, bad headache, and feel very weak'*."
            )

        return reply, session

    # ── Phase: CROSS_EXAMINE → drill into each symptom ───────────
    async def _handle_cross_exam(self, session: SessionState, message: str) -> Tuple[str, SessionState]:
        # Store answer for the current symptom
        if session.cross_exam_index > 0 and session.cross_exam_index <= len(session.cross_exam_queue):
            current_sym = session.cross_exam_queue[session.cross_exam_index - 1]
            session.symptom_details[current_sym] = {"detail": message}

        # Check for newly mentioned symptoms in this message
        extra = await self._extract_symptoms(message)
        for s in extra:
            if s not in session.detected_symptoms:
                session.detected_symptoms.append(s)
                if s in CROSS_EXAM_QUESTIONS and s not in session.cross_exam_queue:
                    session.cross_exam_queue.append(s)

        # Ask next question or move to profile collection
        if session.cross_exam_index < len(session.cross_exam_queue):
            next_sym = session.cross_exam_queue[session.cross_exam_index]
            question = await self._gen_cross_exam_q(session, next_sym)
            session.cross_exam_index += 1
            reply = question
        else:
            # All symptoms examined — collect profile info
            session.phase = ChatPhase.PROFILE
            reply = (
                "Thank you for those details — that really helps! 📋\n\n"
                "Just a couple more quick questions about you personally:\n"
                "**What is your age group?** (e.g., child under 12, teen 13-17, adult 18-40, middle-aged 41-60, or senior 60+)"
            )

        return reply, session

    # ── Phase: PROFILE → collect age, gender, history ────────────
    async def _handle_profile(self, session: SessionState, message: str) -> Tuple[str, SessionState]:
        msg_lower = message.lower()

        if "age" not in session.user_profile:
            # Parse age from message
            age_map = {"child": "Under 12", "under 12": "Under 12", "teen": "13-17",
                       "adult": "18-40", "18": "18-40", "middle": "41-60",
                       "senior": "60+", "60": "60+", "elderly": "60+"}
            detected_age = next((v for k, v in age_map.items() if k in msg_lower), "Adult (18-40)")
            session.user_profile["age"] = detected_age
            reply = (
                f"Got it — **{detected_age}**. 👍\n\n"
                "Do you have any **pre-existing medical conditions**? "
                "(e.g., diabetes, hypertension, heart disease, asthma — or type 'none' if not)"
            )
        elif "conditions" not in session.user_profile:
            session.user_profile["conditions"] = message
            reply = (
                "Understood. One last thing — are you currently **taking any medications**? "
                "(prescription or over-the-counter — or type 'none')"
            )
        elif "medications" not in session.user_profile:
            session.user_profile["medications"] = message
            # Move to confirmation
            session.phase = ChatPhase.CONFIRMATION
            reply = await self._build_confirmation(session)
        else:
            session.phase = ChatPhase.CONFIRMATION
            reply = await self._build_confirmation(session)

        return reply, session

    # ── Phase: CONFIRMATION → reconfirm before analysis ──────────
    async def _handle_confirmation(self, session: SessionState, message: str) -> Tuple[str, SessionState]:
        msg_lower = message.lower()
        affirmative = any(w in msg_lower for w in ["yes","correct","right","confirm","ok","yep","yeah","sure","looks good"])
        negative    = any(w in msg_lower for w in ["no","wrong","incorrect","not right","change","edit","fix"])

        if affirmative:
            session.confirmed_symptoms = session.detected_symptoms.copy()
            session.phase = ChatPhase.ANALYSIS
            reply_prefix = "✅ Perfect! Running your personalised health analysis now...\n\n"
            analysis_reply, session = await self._handle_analysis(session)
            reply = reply_prefix + analysis_reply
        elif negative:
            session.phase = ChatPhase.GREETING
            session.detected_symptoms = []
            session.symptom_details = {}
            session.cross_exam_queue = []
            session.cross_exam_index = 0
            reply = (
                "No problem! Let's start fresh. 🔄\n\n"
                "Please describe your symptoms again and I'll make sure to get them right this time."
            )
        else:
            # Treat as correction input
            extra = await self._extract_symptoms(message)
            if extra:
                for s in extra:
                    if s not in session.detected_symptoms:
                        session.detected_symptoms.append(s)
            reply = (
                "Thanks for the correction! I've updated your symptom list. "
                "Here's the revised summary:\n\n" + await self._build_confirmation(session)
            )

        return reply, session

    # ── Phase: ANALYSIS → run scoring + Gemini summary ───────────
    async def _handle_analysis(self, session: SessionState) -> Tuple[str, SessionState]:
        results = self._run_rag_analysis(session)
        session.results = results
        session.phase = ChatPhase.DONE

        # Generate Gemini-powered narrative summary
        if self._llm_ready and results["conditions"]:
            top = results["conditions"][0]
            conditions_text = "\n".join(
                f"- {c['name']} ({c['probability']}% match, risk {c['risk_score']}/100)"
                for c in results["conditions"][:3]
            )
            profile_text = json.dumps(session.user_profile, indent=2)
            details_text = json.dumps(session.symptom_details, indent=2)

            prompt = ANALYSIS_PROMPT.format(
                profile=profile_text,
                symptom_details=details_text,
                conditions=conditions_text,
                urgency=results["urgency"],
            )
            try:
                chat = self.model.start_chat()
                response = chat.send_message(prompt)
                reply = response.text
            except Exception:
                reply = self._fallback_analysis_text(results)
        else:
            reply = self._fallback_analysis_text(results)

        return reply, session

    # ── RAG: Score diseases against detected symptoms ─────────────
    def _run_rag_analysis(self, session: SessionState) -> dict:
        """GenAI Pattern: RAG + ML Hybrid — ML model first, RAG fallback."""
        syms = session.detected_symptoms

        # ── Primary: ML model prediction (89 conditions) ──────────
        ml_results = []
        if ml_inference._model_ready:
            ml_results = ml_inference.predict(syms, top_n=5)

        # ── Fallback: rule-based RAG scoring ──────────────────────
        if not ml_results:
            sym_set = set(syms)
            ranked = []
            for disease in DISEASES:
                required_met = all(r in sym_set for r in disease["required"])
                if not required_met:
                    continue
                weights = disease["weight"]
                max_score = sum(weights.values())
                score = sum(weights.get(s, 0) for s in sym_set)
                probability = min(round((score / max_score) * 100), 100) if max_score else 0
                if probability < 8:
                    continue
                risk = disease["base_risk"]
                age = session.user_profile.get("age", "")
                if "60+" in age or "Senior" in age:
                    risk += 15
                if "Under 12" in age or "Child" in age:
                    risk += 15
                risk = min(risk, 100)
                ranked.append({
                    "name": disease["name"], "id": disease["id"],
                    "icd": disease["icd"], "probability": probability,
                    "risk_score": risk, "urgency": disease["urgency"],
                    "specialist": disease["specialist"],
                    "lifestyle": disease.get("lifestyle", []),
                })
            ranked.sort(key=lambda x: x["risk_score"] * x["probability"], reverse=True)
            ml_results = ranked[:5]

        if not ml_results:
            ml_results = [{
                "name": "Unspecified / Generalised Symptoms",
                "id": "general", "icd": "R68.89",
                "probability": 40, "risk_score": 20,
                "urgency": "low", "specialist": "General Practitioner",
                "lifestyle": ["Rest and stay hydrated", "Monitor symptoms for 24-48 hours",
                              "Schedule a GP visit if symptoms persist", "Maintain a symptom diary"],
            }]

        urgency = ml_results[0]["urgency"]
        # Age-based urgency escalation
        age = session.user_profile.get("age", "")
        if ("60+" in age or "Senior" in age) and urgency == "moderate":
            urgency = "high"

        actions = IMMEDIATE_ACTIONS.get(urgency, IMMEDIATE_ACTIONS["low"])

        return {
            "conditions":      ml_results,
            "urgency":         urgency,
            "risk_score":      ml_results[0]["risk_score"],
            "actions":         actions["actions"],
            "label":           actions["label"],
            "color":           actions["color"],
            "bg_color":        actions["bg_color"],
            "recommendations": ml_results[0].get("lifestyle", []),
            "specialist":      ml_results[0]["specialist"],
            "symptoms":        session.detected_symptoms,
            "profile":         session.user_profile,
            "ml_powered":      ml_inference._model_ready,
            "model_info":      ml_inference.get_model_info(),
        }

    # ── Helpers ───────────────────────────────────────────────────
    async def _extract_symptoms(self, message: str) -> list:
        """GenAI Pattern: Structured Output — extract symptoms as JSON."""
        # First: rule-based fast extraction
        found = []
        msg_lower = message.lower()
        for group, keywords in SYMPTOM_GROUPS.items():
            if any(kw in msg_lower for kw in keywords):
                found.append(group)

        # Second: Gemini-powered extraction for richer NLU
        if self._llm_ready and not found:
            sym_list = ", ".join(list(SYMPTOM_GROUPS.keys())[:30])
            prompt = EXTRACT_SYMPTOMS_PROMPT.format(message=message, symptom_list=sym_list)
            try:
                chat = self.model.start_chat()
                resp = chat.send_message(prompt)
                raw = resp.text.strip()
                # Strip markdown fences if present
                raw = re.sub(r"```json|```", "", raw).strip()
                data = json.loads(raw)
                llm_symptoms = [s for s in data.get("symptoms", []) if s in SYMPTOM_GROUPS]
                found = list(set(found + llm_symptoms))
            except Exception:
                pass  # Fall back to rule-based results

        return found

    async def _gen_cross_exam_q(self, session: SessionState, symptom: str) -> str:
        """GenAI Pattern: Prompt Engineering — generate contextual follow-up questions."""
        base_q = CROSS_EXAM_QUESTIONS.get(symptom, f"Can you tell me more about your {symptom.replace('_', ' ')}? How long have you had it and how severe is it?")

        if self._llm_ready:
            history_text = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in session.history[-6:])
            prompt = CROSS_EXAM_PROMPT.format(
                symptom=symptom.replace("_", " "),
                history=history_text,
            )
            try:
                chat = self.model.start_chat()
                resp = chat.send_message(prompt)
                return resp.text.strip()
            except Exception:
                pass

        return base_q

    async def _build_confirmation(self, session: SessionState) -> str:
        """Build a confirmation summary — optionally powered by Gemini."""
        sym_list = "\n".join(f"  • {s.replace('_', ' ').title()}" for s in session.detected_symptoms)
        profile_lines = "\n".join(f"  • {k.title()}: {v}" for k, v in session.user_profile.items())
        details_text = ""
        for sym, detail in session.symptom_details.items():
            details_text += f"  • {sym.replace('_', ' ').title()}: {detail.get('detail', 'noted')}\n"

        summary = (
            f"Here's what I've understood so far:\n\n"
            f"**Symptoms detected:**\n{sym_list}\n\n"
            f"**Your profile:**\n{profile_lines}\n\n"
        )
        if details_text:
            summary += f"**Symptom details:**\n{details_text}\n"

        summary += "\nDoes this look correct? Please **confirm** ✅ or let me know what needs to be corrected."
        return summary

    def _fallback_analysis_text(self, results: dict) -> str:
        top = results["conditions"][0] if results["conditions"] else {}
        name = top.get("name", "unspecified symptoms")
        risk = results.get("risk_score", 0)
        urgency = results.get("urgency", "low")
        return (
            f"Based on your symptoms, the most likely condition is **{name}** "
            f"with a risk score of **{risk}/100** (urgency: **{urgency}**).\n\n"
            f"Please consult a qualified healthcare professional before taking any action."
        )

    def _calc_progress(self, session: SessionState) -> int:
        phase_progress = {
            ChatPhase.GREETING: 10,
            ChatPhase.CROSS_EXAMINE: 30 + min(session.cross_exam_index * 10, 30),
            ChatPhase.PROFILE: 70,
            ChatPhase.CONFIRMATION: 85,
            ChatPhase.ANALYSIS: 95,
            ChatPhase.DONE: 100,
        }
        return phase_progress.get(session.phase, 0)


# Singleton instance
engine = ChatbotEngine()
