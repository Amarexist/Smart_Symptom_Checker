"""
models.py — Pydantic schemas for request/response validation
GenAI Pattern: Structured Outputs with Pydantic
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ChatPhase(str, Enum):
    """Conversation phase state machine"""
    GREETING        = "greeting"
    SYMPTOM_INPUT   = "symptom_input"
    CROSS_EXAMINE   = "cross_examine"
    PROFILE         = "profile"
    CONFIRMATION    = "confirmation"
    ANALYSIS        = "analysis"
    DONE            = "done"


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    phase: ChatPhase
    detected_symptoms: List[str] = []
    confirmed_symptoms: List[str] = []
    progress: int = 0                # 0-100
    show_results: bool = False
    results: Optional[Dict[str, Any]] = None


class AnalysisResult(BaseModel):
    conditions: List[Dict[str, Any]] = []
    risk_score: int = 0
    urgency: str = "low"
    actions: List[str] = []
    recommendations: List[str] = []
    specialist: str = "General Practitioner"
    symptoms: List[str] = []
    profile: Dict[str, Any] = {}


class SessionState(BaseModel):
    session_id: str
    phase: ChatPhase = ChatPhase.GREETING
    history: List[Dict[str, str]] = Field(default_factory=list)
    detected_symptoms: List[str] = Field(default_factory=list)
    confirmed_symptoms: List[str] = Field(default_factory=list)
    symptom_details: Dict[str, Dict[str, str]] = Field(default_factory=dict)
    user_profile: Dict[str, Any] = Field(default_factory=dict)
    cross_exam_queue: List[str] = Field(default_factory=list)
    cross_exam_index: int = 0
    results: Optional[Dict[str, Any]] = None
