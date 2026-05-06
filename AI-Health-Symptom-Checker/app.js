// =============================================================
//  Sakhi v3 — GenAI Frontend Controller
//  Connects to Python FastAPI backend via REST API
//  Falls back to rule-based engine if backend unavailable
// =============================================================

const API_BASE = "http://localhost:8000";
let SESSION_ID = null;
let analysisDone = false;

// ── DOM refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const chatMessages   = $("chatMessages");
const userInput      = $("userInput");
const sendBtn        = $("sendBtn");
const landingSection = $("landingSection");
const chatSection    = $("chatSection");
const resultSection  = $("resultSection");
const progressBar    = $("progressBar");
const progressPct    = $("progressPct");
const phaseLabel     = $("phaseLabel");

const PHASE_LABELS = {
  greeting:     "Gathering symptoms...",
  symptom_input:"Gathering symptoms...",
  cross_examine:"Cross-examining symptoms...",
  profile:      "Collecting your profile...",
  confirmation: "Reconfirming with you...",
  analysis:     "Running AI analysis...",
  done:         "Analysis complete ✅",
};

// ── Utilities ─────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getTypingIndicator() { return $("typingIndicator"); }

async function showTyping(ms = 900) {
  const ti = getTypingIndicator();
  if (ti) ti.classList.remove("hidden");
  chatMessages.scrollTop = chatMessages.scrollHeight;
  await sleep(ms);
  const ti2 = getTypingIndicator();
  if (ti2) ti2.classList.add("hidden");
}

function addMessage(html, type = "bot", options = null) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${type}`;

  if (type === "bot") {
    const av = document.createElement("div");
    av.className = "bot-avatar";
    av.textContent = "🩺";
    wrapper.appendChild(av);
  }

  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${type}`;
  bubble.innerHTML = `<p>${formatMessage(html)}</p>`;
  wrapper.appendChild(bubble);

  if (options && options.length) {
    const optWrap = document.createElement("div");
    optWrap.className = "options-container";
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        optWrap.querySelectorAll(".option-btn").forEach(b => { b.disabled = true; b.classList.remove("selected"); });
        btn.classList.add("selected");
        addMessage(opt, "user");
        sendToBackend(opt);
      });
      optWrap.appendChild(btn);
    });
    wrapper.appendChild(optWrap);
  }

  chatMessages.appendChild(wrapper);
  requestAnimationFrame(() => {
    wrapper.classList.add("visible");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
  return wrapper;
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/•\s/g, "• ");
}

// ── Progress & Phase UI ───────────────────────────────────────
function updateProgress(phase, progress) {
  if (progressBar) progressBar.style.width = `${progress}%`;
  if (progressPct) progressPct.textContent = `${progress}%`;
  if (phaseLabel)  phaseLabel.textContent  = PHASE_LABELS[phase] || "Processing...";

  // Update phase step indicators
  const phases = ["greeting","cross_examine","profile","confirmation","analysis"];
  const currentIdx = phases.indexOf(phase);
  phases.forEach((p, i) => {
    const el = $(`step-${p}`);
    if (!el) return;
    el.classList.remove("active", "done");
    if (i < currentIdx) el.classList.add("done");
    else if (i === currentIdx) el.classList.add("active");
  });
}

function updateSidebarSymptoms(symptoms) {
  const el = $("sidebarSymptoms");
  if (!el) return;
  if (!symptoms || !symptoms.length) {
    el.innerHTML = `<span class="muted-text">Describe symptoms to begin</span>`;
    return;
  }
  el.innerHTML = symptoms
    .map(s => `<span class="sym-tag">${s.replace(/_/g, " ")}</span>`)
    .join("");
}

// ── Backend communication ─────────────────────────────────────
async function initSession() {
  try {
    const res = await fetch(`${API_BASE}/api/session/new`, { method: "POST" });
    const data = await res.json();
    SESSION_ID = data.session_id;
    console.log("✅ Session:", SESSION_ID);
    return true;
  } catch (e) {
    console.warn("⚠️ Backend offline — using fallback mode");
    SESSION_ID = "local_" + Math.random().toString(36).slice(2);
    return false;
  }
}

async function sendToBackend(message) {
  if (analysisDone) return;
  userInput.value = "";
  userInput.style.height = "auto";

  // If local fallback session
  if (SESSION_ID && SESSION_ID.startsWith("local_")) {
    return handleFallback(message);
  }

  try {
    sendBtn.disabled = true;
    await showTyping(600);

    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: SESSION_ID, message }),
    });

    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();

    addMessage(data.reply, "bot");
    updateProgress(data.phase, data.progress);
    updateSidebarSymptoms(data.detected_symptoms);

    if (data.show_results && data.results) {
      analysisDone = true;
      await sleep(800);
      showResults(data.results);
    }

  } catch (e) {
    console.error("Backend error:", e);
    addMessage("⚠️ I had trouble connecting to the AI server. Switching to offline mode...", "bot");
    SESSION_ID = "local_" + SESSION_ID;
    await sleep(600);
    handleFallback(message);
  } finally {
    sendBtn.disabled = false;
  }
}

// ── Fallback: rule-based engine (offline) ─────────────────────
let fallbackAI = null;
let fallbackStep = 0;
const FALLBACK_STEPS = 5;
let fallbackPhase = "greeting";

async function handleFallback(message) {
  if (!fallbackAI && typeof HealthAI !== "undefined") {
    fallbackAI = new HealthAI();
  }

  if (!fallbackAI) {
    addMessage("⚠️ Offline mode requires the knowledge-base.js file. Please check setup.", "bot");
    return;
  }

  if (fallbackPhase === "greeting") {
    const found = fallbackAI.processInput(message);
    updateSidebarSymptoms([...fallbackAI.detectedSymptoms]);
    fallbackPhase = "profiling";
    fallbackStep = 1;
    updateProgress("cross_examine", 20);

    if (found.size > 0) {
      const list = [...found].map(s => `<strong>${s.replace(/_/g," ")}</strong>`).join(", ");
      await showTyping(800);
      addMessage(`I detected these symptoms: ${list}. Let me ask a few questions to understand better. 🔍`, "bot");
    } else {
      await showTyping(600);
      addMessage("Let me ask a few questions to better understand what you're experiencing. 📋", "bot");
    }
    await sleep(400);
    askNextFallbackQuestion();
    return;
  }

  if (fallbackPhase === "profiling") {
    const q = fallbackAI.getNextQuestion ? fallbackAI.getNextQuestion() : null;
    if (q) fallbackAI.userProfile[q.key] = message;
    fallbackAI.processInput(message);
    updateSidebarSymptoms([...fallbackAI.detectedSymptoms]);
    fallbackStep++;
    updateProgress("profile", Math.round((fallbackStep / FALLBACK_STEPS) * 80));
    askNextFallbackQuestion();
  }
}

async function askNextFallbackQuestion() {
  if (!fallbackAI) return;
  const q = fallbackAI.getNextQuestion ? fallbackAI.getNextQuestion() : null;
  if (q && fallbackStep < FALLBACK_STEPS) {
    await showTyping(700);
    addMessage(q.question, "bot", q.options);
  } else {
    fallbackPhase = "analysis";
    updateProgress("analysis", 90);
    await showTyping(1200);
    addMessage("🔬 <strong>Analysing</strong> your symptoms against the knowledge base...", "bot");
    await showTyping(1000);
    const results = fallbackAI.analyze();
    if (results.predictions && results.predictions.length > 0) {
      const top = results.predictions[0];
      addMessage(`✅ Analysis complete! Most likely: <strong>${top.disease.name}</strong> — Risk Score <strong>${results.riskScore}/100</strong>. Here's your full report 📋`, "bot");
    }
    await sleep(800);
    analysisDone = true;
    // Convert fallback format to new format
    showResultsFallback(results);
  }
}

// ── Start chat flow ───────────────────────────────────────────
async function startChat() {
  analysisDone = false;
  fallbackAI   = null;
  fallbackStep = 0;
  fallbackPhase = "greeting";

  landingSection.classList.add("hidden");
  chatSection.classList.remove("hidden");

  const backendOk = await initSession();

  await sleep(200);
  addMessage("👋 Namaste! I'm <strong>Sakhi</strong> — your GenAI health companion powered by <strong>Gemini AI</strong>. 🤖", "bot");

  await showTyping(900);
  addMessage("⚠️ <em>Sakhi is an AI assistant, not a medical professional. Always consult a qualified doctor for diagnosis and treatment.</em>", "bot");

  await showTyping(700);
  if (backendOk) {
    addMessage("Tell me — <strong>how are you feeling today?</strong> Describe your symptoms in your own words. I'll ask targeted follow-up questions to fully understand your situation. 💬", "bot");
  } else {
    addMessage("I'm running in <em>offline mode</em> today. Tell me — <strong>how are you feeling?</strong> Describe your symptoms below. 💬", "bot");
  }

  updateProgress("greeting", 5);
  userInput.focus();
}

// ── Show results (from backend) ───────────────────────────────
function showResults(results) {
  chatSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
  void resultSection.offsetWidth;

  // AI Summary
  const summaryEl = $("aiSummaryText");
  if (summaryEl && results.ai_summary) {
    summaryEl.textContent = results.ai_summary;
  } else if (summaryEl) {
    const top = results.conditions && results.conditions[0];
    summaryEl.textContent = top
      ? `Based on your symptoms, the most likely condition is ${top.name} (${top.probability}% match, risk score ${top.risk_score}/100). Please consult a qualified healthcare professional.`
      : "Analysis complete. Please consult a healthcare professional.";
  }

  // Risk gauge
  const riskScore = results.risk_score || 0;
  $("riskScoreValue").textContent = riskScore;
  $("riskScoreLabel").textContent = results.label || "";
  $("urgencyBadge").textContent   = (results.urgency || "low").toUpperCase();
  $("urgencyBadge").className     = `urgency-badge urgency-${results.urgency || "low"}`;

  const gauge = $("riskGauge");
  if (gauge) {
    const C = 2 * Math.PI * 54;
    gauge.style.strokeDasharray  = C;
    gauge.style.strokeDashoffset = C;
    gauge.style.stroke = results.color || "#8b5cf6";
    setTimeout(() => { gauge.style.strokeDashoffset = C - (riskScore / 100) * C; }, 350);
  }

  const riskCard = $("riskScoreCard");
  if (riskCard && results.bg_color) {
    riskCard.style.background  = results.bg_color;
    riskCard.style.borderColor = results.color;
  }

  // Detected symptoms
  const symEl = $("detectedSymptoms");
  const syms  = results.symptoms || [];
  symEl.innerHTML = syms.length
    ? syms.map(s => `<span class="symptom-tag">${s.replace(/_/g," ")}</span>`).join("")
    : `<span class="symptom-tag">symptoms provided</span>`;

  // Predictions
  const predsEl = $("predictionsContainer");
  predsEl.innerHTML = "";
  const medals = ["🥇","🥈","🥉","4️⃣"];
  const conditions = results.conditions || [];

  conditions.forEach((cond, idx) => {
    const card = document.createElement("div");
    card.className = `prediction-card${idx === 0 ? " primary" : ""}`;
    card.style.animationDelay = `${idx * 0.1}s`;
    const urgencyClass = `urgency-${cond.urgency || "low"}`;
    card.innerHTML = `
      <div class="pred-header">
        <div class="pred-rank">${medals[idx] ?? "•"}</div>
        <div class="pred-info">
          <div class="pred-name">${cond.name}</div>
          <span class="pred-icd">ICD: ${cond.icd}</span>
        </div>
        <div class="pred-badge ${urgencyClass}">${cond.urgency}</div>
      </div>
      <div class="pred-stats">
        <div class="stat-block">
          <span class="stat-label">Match Probability</span>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:0%;background:var(--primary);" data-target="${cond.probability}"></div></div>
          <span class="stat-val">${cond.probability}%</span>
        </div>
        <div class="stat-block">
          <span class="stat-label">Risk Score</span>
          <div class="stat-bar-wrap"><div class="stat-bar" style="width:0%;background:${results.color||"#8b5cf6"};" data-target="${cond.risk_score}"></div></div>
          <span class="stat-val">${cond.risk_score}/100</span>
        </div>
      </div>
      <div class="pred-footer">
        <span class="specialist-tag">👨‍⚕️ ${cond.specialist}</span>
      </div>`;
    predsEl.appendChild(card);
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      document.querySelectorAll(".stat-bar[data-target]").forEach(bar => {
        bar.style.transition = "width 1.2s cubic-bezier(0.4,0,0.2,1)";
        bar.style.width = bar.dataset.target + "%";
      });
    }, 300);
  });

  // Actions
  const actEl = $("immediateActions");
  if (actEl) { actEl.style.background = results.bg_color; actEl.style.borderColor = results.color; }
  const actTitle = $("actionTitle");
  if (actTitle) { actTitle.textContent = results.label; actTitle.style.color = results.color; }
  const actList = $("actionList");
  if (actList) actList.innerHTML = (results.actions || []).map(a => `<li>${a}</li>`).join("");

  // Lifestyle
  const lifeList = $("lifestyleList");
  if (lifeList) lifeList.innerHTML = (results.recommendations || []).map(l => `<li>${l}</li>`).join("") || `<li>Consult a general practitioner for personalised advice.</li>`;

  // Disclaimer date
  const dateEl = $("disclaimerDate");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" });
}

// ── Show results (from fallback/legacy format) ────────────────
function showResultsFallback(results) {
  const actions = results.actions || {};
  const normalized = {
    conditions: (results.predictions || []).map(p => ({
      name: p.disease.name, id: p.disease.id, icd: p.disease.icd,
      probability: p.probability, risk_score: p.riskScore,
      urgency: p.disease.urgency, specialist: p.disease.specialist,
      lifestyle: [],
    })),
    risk_score:      results.riskScore || 20,
    urgency:         results.urgency || "low",
    label:           actions.label || "Self-care",
    color:           actions.color || "#30d158",
    bg_color:        actions.bgColor || "rgba(48,209,88,0.1)",
    actions:         actions.actions || [],
    recommendations: results.lifestyle || [],
    symptoms:        results.symptoms || [],
  };
  showResults(normalized);
}

// ── Restart ───────────────────────────────────────────────────
function restart() {
  analysisDone  = false;
  fallbackAI    = null;
  fallbackStep  = 0;
  fallbackPhase = "greeting";

  chatMessages.innerHTML = `
    <div id="typingIndicator" class="typing-indicator hidden">
      <span></span><span></span><span></span>
      <small>Sakhi is thinking...</small>
    </div>`;

  updateSidebarSymptoms([]);
  updateProgress("greeting", 0);
  resultSection.classList.add("hidden");
  chatSection.classList.add("hidden");
  landingSection.classList.remove("hidden");
}

// ── Hospitals Search (GPS) ────────────────────────────────────
function setupHospitals() {
  const btn = $("findHospitalsBtn");
  const gpsNotice = $("gpsNotice");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    gpsNotice.classList.remove("hidden");
    btn.classList.add("loading");
    $("gpsLabel").textContent = "Locating you...";
    $("hospitalsError").classList.add("hidden");
    $("hospitalsStats").classList.add("hidden");
    $("hospitalsList").innerHTML = "";
    $("hospitalsLoading").classList.remove("hidden");

    if (!navigator.geolocation) {
      showHospitalError("Geolocation is not supported by your browser.");
      resetHospitalBtn();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          $("gpsLabel").textContent = "Finding hospitals...";
          const res = await fetch(`${API_BASE}/api/hospitals?lat=${latitude}&lon=${longitude}&radius=10000`);
          if (!res.ok) throw new Error("Failed to fetch hospitals.");
          const data = await res.json();
          renderHospitals(data);
        } catch (e) {
          showHospitalError(e.message);
        } finally {
          resetHospitalBtn();
        }
      },
      (error) => {
        showHospitalError(getGpsErrorMsg(error));
        resetHospitalBtn();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

function resetHospitalBtn() {
  const btn = $("findHospitalsBtn");
  if (btn) {
    btn.classList.remove("loading");
    $("gpsLabel").textContent = "Enable GPS & Find Hospitals";
  }
  $("hospitalsLoading").classList.add("hidden");
}

function showHospitalError(msg) {
  const errEl = $("hospitalsError");
  if (errEl) {
    errEl.innerHTML = `<span>⚠️</span> <span>${msg}</span>`;
    errEl.classList.remove("hidden");
  }
}

function getGpsErrorMsg(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED: return "Location permission denied. Please enable it in your browser settings.";
    case error.POSITION_UNAVAILABLE: return "Location information is unavailable.";
    case error.TIMEOUT: return "The request to get user location timed out.";
    default: return "An unknown error occurred while getting location.";
  }
}

function renderHospitals(data) {
  const list = $("hospitalsList");
  const stats = $("hospitalsStats");
  if (!list || !stats) return;

  if (!data.hospitals || data.hospitals.length === 0) {
    showHospitalError("No hospitals found within 10km of your location.");
    return;
  }

  stats.innerHTML = `Found <strong>${data.total_found}</strong> healthcare facilities within <strong>${data.radius_km} km</strong>. Showing top ${data.hospitals.length}.`;
  stats.classList.remove("hidden");

  list.innerHTML = data.hospitals.map(h => `
    <div class="hospital-card" style="border-top-color: ${h.color}">
      <div class="h-card-header">
        <div class="h-icon">${h.icon}</div>
        <div class="h-info">
          <div class="h-name">${h.name}</div>
          <div class="h-type" style="background:${h.color}22; color:${h.color}">${h.type}</div>
          <div class="h-distance">📍 ${h.distance_str} away</div>
        </div>
      </div>
      <div class="h-details">
        <div><span>📌</span> <span>${h.address}</span></div>
        ${h.opening_hours ? `<div><span>🕒</span> <span>${h.opening_hours}</span></div>` : ""}
        ${h.phone ? `<div><span>📞</span> <span>${h.phone}</span></div>` : ""}
      </div>
      <div class="h-actions">
        <a href="${h.maps_url}" target="_blank" class="h-btn maps">🧭 Get Directions</a>
        ${h.phone ? `<a href="tel:${h.phone.split(',')[0].replace(/\D/g,'')}" class="h-btn call">📞 Call</a>` : ""}
      </div>
    </div>
  `).join("");
}

// ── Event listeners ───────────────────────────────────────────
$("startBtn").addEventListener("click", startChat);
$("restartBtn").addEventListener("click", restart);
$("restartBtnResult").addEventListener("click", restart);

// Initialize GPS button listener
setupHospitals();

$("sendBtn").addEventListener("click", () => {
  const text = userInput.value.trim();
  if (!text || analysisDone) return;
  addMessage(text, "user");
  sendToBackend(text);
});

userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || analysisDone) return;
    addMessage(text, "user");
    sendToBackend(text);
  }
});

userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

// Tab switching
document.addEventListener("click", e => {
  if (!e.target.classList.contains("tab-btn")) return;
  const tabId = e.target.dataset.tab;
  document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));
  e.target.classList.add("active");
  const panel = $(`tab-${tabId}`);
  if (panel) panel.classList.remove("hidden");
});

// Quick chips
document.querySelectorAll(".quick-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (!landingSection.classList.contains("hidden")) {
      startChat().then ? startChat().then(() => {
        setTimeout(() => {
          userInput.value = chip.dataset.symptom;
          userInput.focus();
        }, 3000);
      }) : null;
    } else {
      userInput.value = chip.dataset.symptom;
      userInput.focus();
    }
  });
});

// ── Animated background canvas ────────────────────────────────
(function initBg() {
  const canvas = $("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);

  // Two layers: purple + cyan particles
  const pts = Array.from({ length: 70 }, (_, i) => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    r:  Math.random() * 2 + 0.3,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    a:  Math.random() * 0.35 + 0.05,
    c:  i % 3 === 0 ? "6,182,212" : "139,92,246",
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();
