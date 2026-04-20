# <div align="center">Smart Symptom Checker</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Plus+Jakarta+Sans&weight=700&size=26&duration=2800&pause=900&color=2563EB&center=true&vCenter=true&width=900&lines=Sakhi+%E2%80%94+Your+AI+Health+Companion;Conversational+Symptom+Analysis;Risk+Scoring+%E2%80%A2+Condition+Prediction+%E2%80%A2+Care+Guidance" alt="Typing SVG" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-0f172a?style=for-the-badge&labelColor=1e3a8a" alt="Frontend Badge" />
  <img src="https://img.shields.io/badge/Privacy-Runs%20In%20Browser-059669?style=for-the-badge&labelColor=064e3b" alt="Privacy Badge" />
  <img src="https://img.shields.io/badge/Experience-Conversational%20UI-7c3aed?style=for-the-badge&labelColor=4c1d95" alt="Experience Badge" />
</div>

<br />

<div align="center">
  <b>Sakhi</b> is a browser-based AI health companion that turns natural-language symptom descriptions into
  structured follow-up questions, likely condition matches, urgency scoring, and practical next-step guidance.
</div>

---

## Overview

This project is designed as a polished, privacy-friendly symptom checker that works entirely on the frontend. Users can describe how they feel in plain language, and the app responds with a guided health assessment experience that feels conversational instead of clinical.

## Why It Stands Out

| Feature | What It Does |
| --- | --- |
| Conversational intake | Lets users describe symptoms naturally instead of filling rigid forms |
| Smart follow-up flow | Asks relevant questions based on detected symptoms |
| Risk scoring | Generates a `0-100` urgency-oriented health risk score |
| Condition matching | Suggests likely conditions with ICD references |
| Care guidance | Recommends actions and specialist directions |
| Result experience | Presents findings in a modern, report-style UI |

## Interface Highlights

```text
Sakhi Experience
├── Modern landing page with quick symptom chips
├── Chat-style symptom collection
├── Live progress tracker
├── Sidebar showing detected symptoms
├── Animated risk gauge in the report view
└── Tabs for conditions, actions, and recommendations
```

## Tech Stack

<div align="center">

| HTML | CSS | JavaScript |
| --- | --- | --- |
| Semantic page structure | Premium light-mode UI styling | Symptom parsing + rule engine |

</div>

## Project Structure

```text
AI-Health-Symptom-Checker/
  index.html
  styles.css
  app.js
  knowledge-base.js
```

## How It Works

1. The user starts the symptom check from the landing page.
2. Sakhi parses natural-language input and detects symptom groups.
3. The app asks follow-up questions to build a simple health profile.
4. A rule-based engine compares the detected symptoms against the knowledge base.
5. The app returns likely conditions, urgency level, risk score, and care guidance.

## Core Capabilities

- Conversational symptom intake
- Natural-language symptom keyword matching
- Follow-up question engine
- Multi-condition prediction output
- Urgency classification and risk scoring
- Specialist recommendation display
- Fallback result generation when symptom matches are weak
- Print-ready health report screen

## Run Locally

This is a static frontend app, so setup is simple.

### Open directly

Open `AI-Health-Symptom-Checker/index.html` in your browser.

### Run with a local server

```bash
cd AI-Health-Symptom-Checker
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Medical Knowledge Base

The app currently includes:

- 40+ disease profiles
- broad symptom-group mapping for natural-language detection
- urgency-based action recommendations
- disease-linked lifestyle suggestions
- ICD-coded condition output

All matching logic runs directly in the browser through a rule-based approach.

## Product Vision

The goal of Smart Symptom Checker is to make early symptom understanding feel more accessible, more human, and less intimidating. The interface is intentionally designed to feel supportive while still reminding users that professional medical care is essential for diagnosis.

## Important Disclaimer

> This project is for informational and educational purposes only.
> It does not provide medical diagnosis, treatment, or professional clinical advice.
> In any emergency, contact local emergency services or a licensed healthcare professional immediately.

## Author

<div align="center">
  Created and maintained by <a href="https://github.com/Amarexist">Amarexist</a>
</div>
