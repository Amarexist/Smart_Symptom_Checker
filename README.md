# Smart Symptom Checker

Smart Symptom Checker is a browser-based AI health companion called **Sakhi**. It lets users describe symptoms in natural language, asks follow-up questions, maps symptoms to likely conditions, computes a risk score, and shows recommended next steps in a clean report-style interface.

## Highlights

- Conversational symptom intake with free-text input
- In-browser symptom parsing and follow-up questioning
- Risk urgency scoring from `0-100`
- Top condition predictions with ICD codes and specialist suggestions
- Immediate action guidance and lifestyle recommendations
- Print-friendly results screen
- Private-by-default frontend flow with no sign-up required

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript

## Project Structure

```text
AI-Health-Symptom-Checker/
  index.html
  styles.css
  app.js
  knowledge-base.js
```

## How It Works

1. The user starts a symptom check from the landing page.
2. Sakhi detects symptom keywords from natural language input.
3. The app asks relevant follow-up questions to build a basic health profile.
4. A rule-based engine compares detected symptoms against the medical knowledge base.
5. The app returns up to 4 likely conditions, a risk score, urgency level, action steps, and lifestyle guidance.

## Running Locally

This is a static frontend project, so you can run it directly in a browser.

### Option 1: Open the file directly

Open `AI-Health-Symptom-Checker/index.html` in your browser.

### Option 2: Use a local server

From the project root:

```bash
cd AI-Health-Symptom-Checker
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Key Features in This Version

- Conversational UI for symptom entry
- Dynamic progress tracking during the chat flow
- Symptom detection sidebar
- Risk gauge and urgency badge on the report page
- Tabbed result sections for conditions, actions, and recommendations
- Fallback reporting flow so the user still gets guidance even when matches are weak

## Medical Knowledge Base

The app includes:

- 40+ disease profiles
- symptom-group mapping for natural language matching
- urgency-based immediate actions
- disease-specific lifestyle recommendations

The logic is rule-based and runs entirely in the browser.

## Important Disclaimer

This project is for **informational and educational purposes only**. It is **not** a medical diagnosis tool and does **not** replace consultation with a licensed healthcare professional. In any urgent or emergency medical situation, contact local emergency services immediately.

## Author

Created and maintained by [Amarexist](https://github.com/Amarexist).
