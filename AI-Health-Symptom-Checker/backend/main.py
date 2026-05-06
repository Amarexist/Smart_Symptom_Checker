"""
main.py — FastAPI application entry point
GenAI Concepts: REST API for LLM-powered chatbot with session management
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn, os, uuid

from config import settings
from models import ChatRequest, ChatResponse
from chatbot_engine import engine

# ── App ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Sakhi — AI Health Symptom Checker",
    description="GenAI-powered health companion with RAG, structured output, and conversation memory",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files from parent directory
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..")

# ── API Routes ────────────────────────────────────────────────────

@app.get("/")
async def root():
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Sakhi AI Health API v3.0 — Frontend not found"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "3.0.0",
        "llm_ready": engine._llm_ready,
        "active_sessions": len(engine.sessions),
    }


@app.post("/api/session/new")
async def new_session():
    """Create a new chat session and return the session ID."""
    session_id = str(uuid.uuid4())
    engine.get_session(session_id)  # initialise
    return {"session_id": session_id}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Main chat endpoint.
    GenAI Pattern: Multi-turn conversation with persistent memory per session.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        result = await engine.process(req.session_id, req.message)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Return current session state (phase, symptoms, progress)."""
    if session_id not in engine.sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    s = engine.sessions[session_id]
    return {
        "session_id": session_id,
        "phase": s.phase,
        "detected_symptoms": s.detected_symptoms,
        "confirmed_symptoms": s.confirmed_symptoms,
        "user_profile": s.user_profile,
        "has_results": s.results is not None,
    }


@app.delete("/api/session/{session_id}")
async def clear_session(session_id: str):
    """Clear a session (restart)."""
    engine.clear_session(session_id)
    return {"message": "Session cleared"}


# ── /api/hospitals — GPS-based nearby hospital search ────────────
@app.get("/api/hospitals")
async def nearby_hospitals(lat: float, lon: float, radius: int = 10000):
    """
    Find hospitals, clinics & pharmacies within `radius` metres (default 10 km).
    Uses OpenStreetMap Overpass API — FREE, no API key required.
    Returns structured list sorted by distance with directions link.
    """
    import httpx, math

    def haversine(lat1, lon1, lat2, lon2) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat/2)**2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon/2)**2)
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    query = f"""
[out:json][timeout:20];
(
  node["amenity"="hospital"](around:{radius},{lat},{lon});
  way["amenity"="hospital"](around:{radius},{lat},{lon});
  node["amenity"="clinic"](around:{radius},{lat},{lon});
  way["amenity"="clinic"](around:{radius},{lat},{lon});
  node["amenity"="doctors"](around:{radius},{lat},{lon});
  node["amenity"="pharmacy"](around:{radius},{lat},{lon});
  node["healthcare"="hospital"](around:{radius},{lat},{lon});
);
out center tags;
""".strip()

    try:
        headers = {
            "User-Agent": "Sakhi_Symptom_Checker/3.0",
            "Accept": "application/json"
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post("https://overpass-api.de/api/interpreter",
                                     data={"data": query}, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Location service error: {str(e)}")

    TYPE_MAP = {
        "hospital": {"label":"Hospital",    "icon":"🏥","color":"#ef4444"},
        "clinic":   {"label":"Clinic",      "icon":"🏨","color":"#8b5cf6"},
        "doctors":  {"label":"Doctor",      "icon":"👨‍⚕️","color":"#06b6d4"},
        "pharmacy": {"label":"Pharmacy",    "icon":"💊","color":"#10b981"},
    }

    hospitals, seen = [], set()
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = (tags.get("name") or tags.get("name:en") or
                tags.get("operator") or tags.get("brand"))
        if not name or name in seen:
            continue
        seen.add(name)

        elat = el.get("lat") or (el.get("center") or {}).get("lat")
        elon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not elat or not elon:
            continue

        dist_km = haversine(lat, lon, elat, elon)
        amenity = tags.get("amenity", tags.get("healthcare", "clinic"))
        t = TYPE_MAP.get(amenity, {"label":"Health Centre","icon":"🏥","color":"#8b5cf6"})

        addr = ", ".join(p for p in [
            tags.get("addr:housenumber",""), tags.get("addr:street",""),
            tags.get("addr:suburb",""),     tags.get("addr:city",""),
            tags.get("addr:state",""),      tags.get("addr:postcode",""),
        ] if p) or tags.get("addr:full","") or "Address not listed"

        hospitals.append({
            "name":          name,
            "type":          t["label"],
            "icon":          t["icon"],
            "color":         t["color"],
            "distance_km":   round(dist_km, 2),
            "distance_str":  (f"{dist_km:.1f} km" if dist_km >= 1
                              else f"{int(dist_km*1000)} m"),
            "lat": elat, "lon": elon,
            "address":       addr,
            "phone":         tags.get("phone") or tags.get("contact:phone",""),
            "website":       tags.get("website") or tags.get("contact:website",""),
            "opening_hours": tags.get("opening_hours",""),
            "emergency":     tags.get("emergency",""),
            "beds":          tags.get("beds",""),
            "maps_url":      f"https://www.google.com/maps/dir/?api=1&destination={elat},{elon}",
            "osm_url":       f"https://www.openstreetmap.org/?mlat={elat}&mlon={elon}&zoom=17",
        })

    hospitals.sort(key=lambda x: x["distance_km"])
    return {
        "user_location": {"lat": lat, "lon": lon},
        "radius_km":     radius / 1000,
        "total_found":   len(hospitals),
        "hospitals":     hospitals[:20],
    }


# ── Serve static frontend files ───────────────────────────────────
@app.get("/{file_path:path}")
async def serve_static(file_path: str):
    full = os.path.join(FRONTEND_DIR, file_path)
    if os.path.isfile(full):
        return FileResponse(full)
    raise HTTPException(status_code=404, detail="File not found")


# ── Entry point ───────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        log_level="info",
    )
