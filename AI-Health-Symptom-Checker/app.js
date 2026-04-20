// =============================================================
//  AI Health Symptom Checker — Main Application Controller
//  v2.0 — Fixed: stale ref, low match threshold, blocked results
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  const ai = new HealthAI();

  // ── DOM References (stable, never change) ───────────────────
  const chatMessages    = document.getElementById("chatMessages");
  const userInput       = document.getElementById("userInput");
  const sendBtn         = document.getElementById("sendBtn");
  const landingSection  = document.getElementById("landingSection");
  const chatSection     = document.getElementById("chatSection");
  const resultSection   = document.getElementById("resultSection");
  const startBtn        = document.getElementById("startBtn");
  const restartBtn      = document.getElementById("restartBtn");
  const restartBtnResult= document.getElementById("restartBtnResult");
  const progressBar     = document.getElementById("progressBar");
  const stepIndicator   = document.getElementById("stepIndicator");

  // ── FIX #1: Always get typingIndicator fresh from DOM ────────
  // (The old const went stale after restart which replaced innerHTML)
  function getTypingIndicator() {
    return document.getElementById("typingIndicator");
  }

  // ── State ────────────────────────────────────────────────────
  let conversationStep = 0;
  const TOTAL_STEPS    = 5;   // FIX #5: was 7 — reduced so results arrive sooner
  let currentQuestion  = null;
  let analysisDone     = false;

  // ── Utilities ────────────────────────────────────────────────
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── FIX #2: Fast typing indicator using fresh DOM lookup ─────
  async function showTyping(ms = 900) {
    const ti = getTypingIndicator();
    if (ti) ti.classList.remove("hidden");
    chatMessages.scrollTop = chatMessages.scrollHeight;
    await sleep(ms);
    const ti2 = getTypingIndicator(); // re-fetch in case DOM changed
    if (ti2) ti2.classList.add("hidden");
  }

  // ── Add message bubble ────────────────────────────────────────
  function addMessage(html, type = "bot", options = null) {
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${type}`;

    if (type === "bot") {
      const avatar = document.createElement("div");
      avatar.className = "bot-avatar";
      avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="url(#ag)"/>
        <circle cx="9"  cy="10" r="1.4" fill="white"/>
        <circle cx="15" cy="10" r="1.4" fill="white"/>
        <path d="M8.5 14.5s1.5 2.5 3.5 2.5 3.5-2.5 3.5-2.5"
              stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none"/>
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%"   stop-color="#7c3aed"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
      </svg>`;
      wrapper.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${type}`;
    bubble.innerHTML = `<p>${html}</p>`;
    wrapper.appendChild(bubble);

    if (options && options.length) {
      const optWrap = document.createElement("div");
      optWrap.className = "options-container";
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt;
        btn.addEventListener("click", () => onOptionClick(opt, optWrap));
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

  // ── Option button click ───────────────────────────────────────
  function onOptionClick(selected, container) {
    // Disable all buttons in this group
    container.querySelectorAll(".option-btn").forEach(b => {
      b.disabled = true;
      b.classList.remove("selected");
    });
    const hit = [...container.querySelectorAll(".option-btn")]
      .find(b => b.textContent === selected);
    if (hit) hit.classList.add("selected");

    addMessage(selected, "user");
    recordAnswer(selected);
  }

  // ── Record an answered question ───────────────────────────────
  async function recordAnswer(answer) {
    if (!currentQuestion) return;
    ai.userProfile[currentQuestion.key] = answer;
    currentQuestion = null;
    conversationStep++;
    updateProgress();
    await nextStep();
  }

  // ── Progress bar ──────────────────────────────────────────────
  function updateProgress() {
    const pct = Math.round((conversationStep / TOTAL_STEPS) * 100);
    progressBar.style.width = `${Math.min(pct, 100)}%`;
    stepIndicator.textContent =
      `Step ${Math.min(conversationStep, TOTAL_STEPS)} of ${TOTAL_STEPS}`;
  }

  // ── Core flow: ask next question or run analysis ──────────────
  async function nextStep() {
    if (analysisDone) return;

    if (conversationStep >= TOTAL_STEPS) {
      await runAnalysis();
      return;
    }

    const q = ai.getNextQuestion();
    if (!q) {
      await runAnalysis();
      return;
    }

    currentQuestion = q;
    await showTyping(900);
    addMessage(q.question, "bot", q.options);
  }

  // ── FIX #3 + #4: Faster analysis, always shows result page ───
  async function runAnalysis() {
    if (analysisDone) return;
    analysisDone = true;

    // Short confirmatory messages
    await showTyping(800);
    addMessage("🔬 <strong>Sakhi is analysing</strong> your symptoms...", "bot");
    await showTyping(1000);
    addMessage("📊 <strong>Computing</strong> risk scores and matching health profiles...", "bot");
    await sleep(600);

    // FIX #2 in knowledge-base: run analyze with lowered threshold
    const results = ai.analyze();

    // FIX #4: Always proceed to results — even if 0 predictions
    if (results.predictions.length === 0) {
      // Inject a "General" fallback so results page always renders
      results.predictions = [{
        disease: {
          name:       "Unspecified / Generalised Symptoms",
          icd:        "R68.89",
          urgency:    "low",
          specialist: "General Practitioner (GP)",
        },
        probability: 45,
        riskScore:   20,
      }];
      results.urgency   = "low";
      results.riskScore = 20;
      results.actions   = KNOWLEDGE_BASE.immediateActions["low"];
      results.lifestyle = [
        "Rest and stay hydrated",
        "Monitor your symptoms for 24–48 hours",
        "Schedule a GP visit if symptoms persist or worsen",
        "Maintain a symptom diary to share with your doctor",
        "Avoid self-medication without professional advice",
      ];
    }

    const top = results.predictions[0];
    await showTyping(600);
    addMessage(
      `✅ Done! Sakhi identified <strong>${results.predictions.length}</strong> ` +
      `possible condition(s). Most likely: <strong>${top.disease.name}</strong> — ` +
      `Risk Score <strong>${results.riskScore}/100</strong>. Here's your full report 📋`,
      "bot"
    );

    await sleep(800);
    showResults(results);
  }

  // ── Transition to results page ────────────────────────────────
  function showResults(results) {
    chatSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    // Force reflow then add visible for CSS transition
    void resultSection.offsetWidth;
    resultSection.classList.add("visible");
    renderResultsPanel(results);
  }

  // ── Render all result panels ──────────────────────────────────
  function renderResultsPanel(results) {
    const { predictions, urgency, riskScore, actions, lifestyle, symptoms } = results;

    // ─ Gauge / Risk card ────────────────────────────────────────
    document.getElementById("riskScoreValue").textContent = riskScore;
    document.getElementById("riskScoreLabel").textContent = actions.label;
    document.getElementById("riskScoreCard").style.background   = actions.bgColor;
    document.getElementById("riskScoreCard").style.borderColor  = actions.color;
    document.getElementById("urgencyBadge").textContent = urgency.toUpperCase();
    document.getElementById("urgencyBadge").className   =
      `urgency-badge urgency-${urgency}`;

    // Animate SVG gauge ring
    const gauge = document.getElementById("riskGauge");
    if (gauge) {
      const C = 2 * Math.PI * 54;          // circumference for r=54
      gauge.style.strokeDasharray  = C;
      gauge.style.strokeDashoffset = C;
      gauge.style.stroke           = actions.color;
      setTimeout(() => {
        gauge.style.strokeDashoffset = C - (riskScore / 100) * C;
      }, 350);
    }

    // ─ Detected symptoms chips ──────────────────────────────────
    const symEl = document.getElementById("detectedSymptoms");
    if (symptoms && symptoms.length) {
      symEl.innerHTML = symptoms
        .map(s => `<span class="symptom-tag">${s.replace(/_/g, " ")}</span>`)
        .join("");
    } else {
      symEl.innerHTML = `<span class="symptom-tag">symptoms provided</span>`;
    }

    // ─ Prediction cards ─────────────────────────────────────────
    const predsEl = document.getElementById("predictionsContainer");
    predsEl.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉", "4️⃣"];

    predictions.forEach((pred, idx) => {
      const card = document.createElement("div");
      card.className = `prediction-card${idx === 0 ? " primary" : ""}`;
      card.style.animationDelay = `${idx * 0.1}s`;

      card.innerHTML = `
        <div class="pred-header">
          <div class="pred-rank">${medals[idx] ?? "•"}</div>
          <div class="pred-info">
            <h3 class="pred-name">${pred.disease.name}</h3>
            <span class="pred-icd">ICD: ${pred.disease.icd}</span>
          </div>
          <div class="pred-badge urgency-${pred.disease.urgency}">
            ${pred.disease.urgency}
          </div>
        </div>
        <div class="pred-stats">
          <div class="stat-block">
            <span class="stat-label">Match Probability</span>
            <div class="stat-bar-wrap">
              <div class="stat-bar"
                   style="width:0%;background:var(--primary);"
                   data-target="${pred.probability}">
              </div>
            </div>
            <span class="stat-val">${pred.probability}%</span>
          </div>
          <div class="stat-block">
            <span class="stat-label">Risk Score</span>
            <div class="stat-bar-wrap">
              <div class="stat-bar"
                   style="width:0%;background:${actions.color};"
                   data-target="${pred.riskScore}">
              </div>
            </div>
            <span class="stat-val">${pred.riskScore}/100</span>
          </div>
        </div>
        <div class="pred-footer">
          <span class="specialist-tag">👨‍⚕️ ${pred.disease.specialist}</span>
        </div>`;

      predsEl.appendChild(card);
    });

    // Animate progress bars after DOM paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll(".stat-bar[data-target]").forEach(bar => {
          bar.style.transition = "width 1.2s cubic-bezier(0.4,0,0.2,1)";
          bar.style.width      = bar.dataset.target + "%";
        });
      }, 300);
    });

    // ─ Immediate actions panel ──────────────────────────────────
    const actEl = document.getElementById("immediateActions");
    if (actEl) {
      actEl.style.background  = actions.bgColor;
      actEl.style.borderColor = actions.color;
    }
    const actTitle = document.getElementById("actionTitle");
    if (actTitle) {
      actTitle.textContent = actions.label;
      actTitle.style.color = actions.color;
    }
    const actList = document.getElementById("actionList");
    if (actList) {
      actList.innerHTML = actions.actions
        .map(a => `<li>${a}</li>`).join("");
    }

    // ─ Lifestyle recommendations ────────────────────────────────
    const lifeList = document.getElementById("lifestyleList");
    if (lifeList && lifestyle && lifestyle.length) {
      lifeList.innerHTML = lifestyle
        .map(l => `<li>${l}</li>`).join("");
    } else if (lifeList) {
      lifeList.innerHTML = `<li>Consult a general practitioner for personalised advice.</li>`;
    }

    // ─ Disclaimer date ──────────────────────────────────────────
    const dateEl = document.getElementById("disclaimerDate");
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric"
      });
    }
  }

  // ── Start Chat ────────────────────────────────────────────────
  async function startChat() {
    analysisDone    = false;
    conversationStep = 0;
    landingSection.classList.add("hidden");
    chatSection.classList.remove("hidden");

    await sleep(300);
    addMessage(
      "👋 Namaste! I'm <strong>Sakhi</strong> — your friendly AI health companion. " +
      "I'm here to help you understand your symptoms and guide you on the right next steps. 🤗",
      "bot"
    );

    await showTyping(1000);
    addMessage(
      "⚠️ <em>Quick note: Sakhi is an AI companion, not a medical professional. " +
      "Always consult a qualified doctor for diagnosis and treatment.</em>",
      "bot"
    );

    await showTyping(800);
    addMessage(
      "Tell me — <strong>how are you feeling today?</strong> Describe your symptoms in your own words. 💬<br/>" +
      "<small style='color:var(--text-muted)'>e.g. \"I have fever, headache and feel very weak\"</small>",
      "bot"
    );

    updateProgress();
    userInput.focus();
  }

  // ── Process free-text message ─────────────────────────────────
  async function processUserMessage() {
    const text = userInput.value.trim();
    if (!text || analysisDone) return;

    userInput.value = "";
    userInput.style.height = "auto";
    addMessage(text, "user");

    if (ai.phase === "greeting") {
      // --- First symptom input ---
      const found = ai.processInput(text);

      // Also try to detect any symptom keywords from the full text directly
      // so "I feel weak and my body is hot" etc. still maps
      if (found.size === 0) {
        // Attempt lenient match by checking all keywords manually
        for (const [group, keywords] of Object.entries(KNOWLEDGE_BASE.symptomGroups)) {
          for (const kw of keywords) {
            if (text.toLowerCase().includes(kw)) {
              ai.detectedSymptoms.add(group);
              found.add(group);
            }
          }
        }
      }

      // Even with 0 detected, proceed — user will confirm/clarify via questions
      if (found.size === 0) {
        await showTyping(700);
        addMessage(
          "I'm sorry you're not feeling well. 🙏 Let me ask a few gentle questions " +
          "to better understand what you're experiencing.",
          "bot"
        );
      } else {
        const symList = [...found]
          .map(s => `<span class="symptom-tag-inline">${s.replace(/_/g, " ")}</span>`)
          .join(" ");
        await showTyping(900);
        addMessage(`I've detected: ${symList}. Let me ask a few more questions.`, "bot");
      }

      // Sync sidebar
      syncSidebarSymptoms();

      ai.phase     = "profiling";
      conversationStep = 1;
      updateProgress();
      await sleep(400);
      await nextStep();

    } else if (ai.phase === "profiling") {
      // User typed extra info during profiling phase
      ai.processInput(text);
      syncSidebarSymptoms();
      await showTyping(500);
      addMessage("Got it! Sakhi has noted those additional details. 📝", "bot");
    }
  }

  // ── Sync sidebar symptom chips ────────────────────────────────
  function syncSidebarSymptoms() {
    const el = document.getElementById("sidebarSymptoms");
    if (!el) return;
    const syms = [...ai.detectedSymptoms];
    if (!syms.length) {
      el.innerHTML =
        `<span style="font-size:0.78rem;color:var(--text-muted)">
          Describe symptoms below
        </span>`;
      return;
    }
    el.innerHTML = syms
      .map(s => `<span class="sym-tag">${s.replace(/_/g, " ")}</span>`)
      .join("");
  }

  // ── Restart the full flow ─────────────────────────────────────
  function restart() {
    // Reset AI engine
    ai.detectedSymptoms = new Set();
    ai.userProfile      = {};
    ai.askedQuestions   = new Set();
    ai.phase            = "greeting";
    ai.results          = null;

    // Reset UI state
    conversationStep = 0;
    currentQuestion  = null;
    analysisDone     = false;

    // Rebuild chatMessages (also restores the typingIndicator to a fresh DOM node)
    chatMessages.innerHTML = `
      <div id="typingIndicator" class="typing-indicator hidden">
        <span></span><span></span><span></span>
        <small>Sakhi is thinking...</small>
      </div>`;

    // Reset sidebar
    syncSidebarSymptoms();
    updateProgress();
    progressBar.style.width   = "0%";
    stepIndicator.textContent = `Step 0 of ${TOTAL_STEPS}`;

    // Toggle sections
    resultSection.classList.add("hidden");
    resultSection.classList.remove("visible");
    chatSection.classList.add("hidden");
    landingSection.classList.remove("hidden");
  }

  // ── Event Listeners ───────────────────────────────────────────
  startBtn.addEventListener("click", startChat);
  restartBtn.addEventListener("click", restart);
  restartBtnResult.addEventListener("click", restart);

  sendBtn.addEventListener("click", processUserMessage);
  userInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      processUserMessage();
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
    document.querySelectorAll(".tab-btn")
      .forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel")
      .forEach(p => p.classList.add("hidden"));
    e.target.classList.add("active");
    const panel = document.getElementById(`tab-${tabId}`);
    if (panel) panel.classList.remove("hidden");
  });

  // Quick chips on landing page
  document.querySelectorAll(".quick-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (!landingSection.classList.contains("hidden")) {
        // Auto-start and pre-fill after greetings delay
        startChat().then(() => {
          setTimeout(() => {
            userInput.value = chip.dataset.symptom;
            userInput.style.height = "auto";
            userInput.focus();
          }, 2800);
        });
      } else {
        userInput.value = chip.dataset.symptom;
        userInput.focus();
      }
    });
  });

  // ── Particle canvas ───────────────────────────────────────────
  (function initParticles() {
    const canvas = document.getElementById("particleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 55 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a:  Math.random() * 0.45 + 0.08,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79,70,229,${p.a})`; // indigo for light mode
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;
      });
      requestAnimationFrame(draw);
    }
    draw();
  })();
});
