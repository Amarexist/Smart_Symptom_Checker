"""
ml_inference.py — Trained ML Model Inference
GenAI Pattern: ML Model as a RAG-like retriever for condition prediction.
Loads the trained RandomForest (89 conditions × 113 symptoms) and
provides probability-ranked predictions to the chatbot engine.
"""

import os, json
import numpy as np
from typing import List, Dict, Any

# Lazy-load heavy dependencies
_clf = None
_mlb = None
_symptom_list = None
_metadata = None
_model_ready = False

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")

# ── Condition metadata (urgency, specialist, lifestyle) ───────────
CONDITION_META = {
    "common_cold":           {"urgency":"low",       "specialist":"General Practitioner",                   "icd":"J06.9"},
    "influenza":             {"urgency":"moderate",   "specialist":"General Practitioner",                   "icd":"J11"},
    "covid19":               {"urgency":"high",       "specialist":"Pulmonologist / Emergency Medicine",     "icd":"U07.1"},
    "dengue":                {"urgency":"high",       "specialist":"Infectious Disease Specialist",          "icd":"A90"},
    "malaria":               {"urgency":"high",       "specialist":"Infectious Disease Specialist",          "icd":"B54"},
    "typhoid":               {"urgency":"high",       "specialist":"Infectious Disease / Gastroenterologist","icd":"A01.0"},
    "chickenpox":            {"urgency":"moderate",   "specialist":"General Practitioner",                   "icd":"B01"},
    "tuberculosis":          {"urgency":"high",       "specialist":"Pulmonologist / Infectious Disease",     "icd":"A15"},
    "chikungunya":           {"urgency":"moderate",   "specialist":"Infectious Disease Specialist",          "icd":"A92.0"},
    "leptospirosis":         {"urgency":"high",       "specialist":"Infectious Disease Specialist",          "icd":"A27"},
    "hepatitis_a":           {"urgency":"moderate",   "specialist":"Gastroenterologist / Hepatologist",      "icd":"B15"},
    "hepatitis_b":           {"urgency":"high",       "specialist":"Gastroenterologist / Hepatologist",      "icd":"B16"},
    "measles":               {"urgency":"moderate",   "specialist":"General Practitioner",                   "icd":"B05"},
    "mumps":                 {"urgency":"moderate",   "specialist":"General Practitioner",                   "icd":"B26"},
    "hiv_early":             {"urgency":"high",       "specialist":"Infectious Disease Specialist",          "icd":"B20"},
    "heart_attack":          {"urgency":"emergency",  "specialist":"Emergency Medicine / Cardiologist",      "icd":"I21"},
    "angina":                {"urgency":"high",       "specialist":"Cardiologist",                           "icd":"I20"},
    "hypertension":          {"urgency":"moderate",   "specialist":"Cardiologist / General Physician",       "icd":"I10"},
    "heart_failure":         {"urgency":"high",       "specialist":"Cardiologist",                           "icd":"I50"},
    "arrhythmia":            {"urgency":"high",       "specialist":"Cardiologist",                           "icd":"I49"},
    "dvt":                   {"urgency":"high",       "specialist":"Vascular Surgeon / Haematologist",       "icd":"I82"},
    "pulmonary_embolism":    {"urgency":"emergency",  "specialist":"Emergency Medicine / Pulmonologist",     "icd":"I26"},
    "pericarditis":          {"urgency":"high",       "specialist":"Cardiologist",                           "icd":"I30"},
    "pneumonia":             {"urgency":"high",       "specialist":"Pulmonologist / Emergency Medicine",     "icd":"J18"},
    "asthma":                {"urgency":"high",       "specialist":"Pulmonologist / Allergist",              "icd":"J45"},
    "copd":                  {"urgency":"high",       "specialist":"Pulmonologist",                          "icd":"J44"},
    "bronchitis":            {"urgency":"moderate",   "specialist":"General Practitioner / Pulmonologist",   "icd":"J20"},
    "pleurisy":              {"urgency":"high",       "specialist":"Pulmonologist",                          "icd":"R09.1"},
    "pneumothorax":          {"urgency":"emergency",  "specialist":"Emergency Medicine / Thoracic Surgery",  "icd":"J93"},
    "sleep_apnea":           {"urgency":"moderate",   "specialist":"Pulmonologist / Sleep Specialist",       "icd":"G47.3"},
    "migraine":              {"urgency":"low",        "specialist":"Neurologist",                            "icd":"G43"},
    "stroke":                {"urgency":"emergency",  "specialist":"Neurologist / Emergency Medicine",       "icd":"I64"},
    "meningitis":            {"urgency":"emergency",  "specialist":"Neurologist / Emergency Medicine",       "icd":"G03"},
    "epilepsy":              {"urgency":"high",       "specialist":"Neurologist",                            "icd":"G40"},
    "parkinsons":            {"urgency":"moderate",   "specialist":"Neurologist",                            "icd":"G20"},
    "ms":                    {"urgency":"high",       "specialist":"Neurologist",                            "icd":"G35"},
    "bells_palsy":           {"urgency":"moderate",   "specialist":"Neurologist",                            "icd":"G51.0"},
    "cluster_headache":      {"urgency":"moderate",   "specialist":"Neurologist",                            "icd":"G44.0"},
    "alzheimers":            {"urgency":"moderate",   "specialist":"Neurologist / Geriatrician",             "icd":"G30"},
    "gastroenteritis":       {"urgency":"moderate",   "specialist":"General Practitioner / Gastroenterologist","icd":"A09"},
    "appendicitis":          {"urgency":"emergency",  "specialist":"Emergency Medicine / General Surgeon",   "icd":"K37"},
    "gerd":                  {"urgency":"low",        "specialist":"Gastroenterologist",                     "icd":"K21"},
    "ibs":                   {"urgency":"low",        "specialist":"Gastroenterologist",                     "icd":"K58"},
    "peptic_ulcer":          {"urgency":"moderate",   "specialist":"Gastroenterologist",                     "icd":"K27"},
    "crohns":                {"urgency":"moderate",   "specialist":"Gastroenterologist",                     "icd":"K50"},
    "ulcerative_colitis":    {"urgency":"moderate",   "specialist":"Gastroenterologist",                     "icd":"K51"},
    "pancreatitis":          {"urgency":"high",       "specialist":"Gastroenterologist / General Surgeon",   "icd":"K85"},
    "liver_disease":         {"urgency":"high",       "specialist":"Hepatologist / Gastroenterologist",      "icd":"K76"},
    "cholecystitis":         {"urgency":"high",       "specialist":"General Surgeon / Gastroenterologist",   "icd":"K81"},
    "food_poisoning":        {"urgency":"moderate",   "specialist":"General Practitioner / Gastroenterologist","icd":"A05"},
    "diabetes_t2":           {"urgency":"moderate",   "specialist":"Endocrinologist / Diabetologist",        "icd":"E11"},
    "diabetes_t1":           {"urgency":"high",       "specialist":"Endocrinologist",                        "icd":"E10"},
    "hypothyroidism":        {"urgency":"low",        "specialist":"Endocrinologist",                        "icd":"E03.9"},
    "hyperthyroidism":       {"urgency":"moderate",   "specialist":"Endocrinologist",                        "icd":"E05"},
    "cushings":              {"urgency":"moderate",   "specialist":"Endocrinologist",                        "icd":"E24"},
    "pcos":                  {"urgency":"low",        "specialist":"Gynaecologist / Endocrinologist",        "icd":"E28.2"},
    "gout":                  {"urgency":"moderate",   "specialist":"Rheumatologist",                         "icd":"M10"},
    "hypoglycemia":          {"urgency":"high",       "specialist":"Endocrinologist / Emergency Medicine",   "icd":"E16.0"},
    "rheumatoid_arthritis":  {"urgency":"moderate",   "specialist":"Rheumatologist",                         "icd":"M05"},
    "osteoarthritis":        {"urgency":"low",        "specialist":"Orthopaedist / Rheumatologist",          "icd":"M19"},
    "fibromyalgia":          {"urgency":"moderate",   "specialist":"Rheumatologist",                         "icd":"M79.7"},
    "ankylosing_spondylitis":{"urgency":"moderate",   "specialist":"Rheumatologist",                         "icd":"M45"},
    "lupus":                 {"urgency":"high",       "specialist":"Rheumatologist / Immunologist",          "icd":"M32"},
    "osteoporosis":          {"urgency":"moderate",   "specialist":"Endocrinologist / Orthopaedist",         "icd":"M81"},
    "psoriasis":             {"urgency":"low",        "specialist":"Dermatologist",                          "icd":"L40"},
    "eczema":                {"urgency":"low",        "specialist":"Dermatologist",                          "icd":"L20"},
    "urticaria":             {"urgency":"moderate",   "specialist":"Dermatologist / Allergist",              "icd":"L50"},
    "cellulitis":            {"urgency":"high",       "specialist":"Dermatologist / Emergency Medicine",     "icd":"L03"},
    "shingles":              {"urgency":"moderate",   "specialist":"Dermatologist / Neurologist",            "icd":"B02"},
    "acne_severe":           {"urgency":"low",        "specialist":"Dermatologist",                          "icd":"L70"},
    "depression":            {"urgency":"moderate",   "specialist":"Psychiatrist / Psychologist",            "icd":"F32"},
    "anxiety_disorder":      {"urgency":"low",        "specialist":"Psychiatrist / Psychologist",            "icd":"F41.1"},
    "bipolar":               {"urgency":"moderate",   "specialist":"Psychiatrist",                           "icd":"F31"},
    "ptsd":                  {"urgency":"moderate",   "specialist":"Psychiatrist / Psychologist",            "icd":"F43.1"},
    "schizophrenia":         {"urgency":"high",       "specialist":"Psychiatrist",                           "icd":"F20"},
    "ocd":                   {"urgency":"low",        "specialist":"Psychiatrist / Psychologist",            "icd":"F42"},
    "uti":                   {"urgency":"moderate",   "specialist":"Urologist / General Practitioner",       "icd":"N39.0"},
    "kidney_stone":          {"urgency":"high",       "specialist":"Urologist / Emergency Medicine",         "icd":"N20"},
    "ckd":                   {"urgency":"high",       "specialist":"Nephrologist",                           "icd":"N18"},
    "bph":                   {"urgency":"moderate",   "specialist":"Urologist",                              "icd":"N40"},
    "kidney_infection":      {"urgency":"high",       "specialist":"Urologist / Emergency Medicine",         "icd":"N10"},
    "anaemia":               {"urgency":"moderate",   "specialist":"Haematologist / General Physician",      "icd":"D64"},
    "leukaemia":             {"urgency":"high",       "specialist":"Haematologist / Oncologist",             "icd":"C91"},
    "thrombocytopenia":      {"urgency":"high",       "specialist":"Haematologist",                          "icd":"D69.6"},
    "lymphoma":              {"urgency":"high",       "specialist":"Haematologist / Oncologist",             "icd":"C85"},
    "sinusitis":             {"urgency":"low",        "specialist":"ENT Specialist",                         "icd":"J32"},
    "otitis_media":          {"urgency":"moderate",   "specialist":"ENT Specialist",                         "icd":"H66"},
    "tonsillitis":           {"urgency":"moderate",   "specialist":"ENT Specialist",                         "icd":"J35.0"},
    "laryngitis":            {"urgency":"low",        "specialist":"ENT Specialist",                         "icd":"J04.0"},
}

LIFESTYLE_TIPS = {
    "emergency":  ["Call 108 (India) / 911 (USA) IMMEDIATELY","Do NOT drive yourself","Keep patient calm and still","Note exact time symptoms started","Begin CPR if unconscious and not breathing"],
    "high":       ["Go to the nearest emergency room today","Do not delay — condition may worsen rapidly","Avoid self-medication","Stay hydrated with water or ORS","Keep someone with you at all times"],
    "moderate":   ["Book a doctor's appointment within 24–48 hours","Monitor your temperature and symptoms closely","Rest and stay well hydrated","Record a symptom diary to share with doctor","Take OTC paracetamol only if needed"],
    "low":        ["Rest and stay hydrated","Eat light nutritious meals","Take appropriate OTC medicines","Monitor — revisit if symptoms worsen after 3 days","Schedule a routine GP check-up"],
}


def load_model() -> bool:
    """Load trained model artifacts from disk."""
    global _clf, _mlb, _symptom_list, _metadata, _model_ready
    try:
        import joblib
        meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
        if not os.path.exists(meta_path):
            return False
        _clf          = joblib.load(os.path.join(MODEL_DIR, "symptom_classifier.joblib"))
        _mlb          = joblib.load(os.path.join(MODEL_DIR, "label_binarizer.joblib"))
        _symptom_list = joblib.load(os.path.join(MODEL_DIR, "symptom_list.joblib"))
        with open(meta_path) as f:
            _metadata = json.load(f)
        _model_ready = True
        print(f"✅ ML Model loaded: {_metadata['n_conditions']} conditions × {_metadata['n_symptoms']} symptoms")
        return True
    except Exception as e:
        print(f"⚠️  ML Model not loaded: {e}")
        return False


def symptoms_to_vector(detected_symptoms: List[str]) -> np.ndarray:
    """Convert detected symptom list to binary feature vector."""
    if _symptom_list is None:
        return np.array([])
    vec = np.zeros(len(_symptom_list))
    sym_idx = {s: i for i, s in enumerate(_symptom_list)}
    for sym in detected_symptoms:
        # Direct match
        if sym in sym_idx:
            vec[sym_idx[sym]] = 1.0
        # Fuzzy map common aliases
        for mapped in _ALIAS_MAP.get(sym, []):
            if mapped in sym_idx:
                vec[sym_idx[mapped]] = 1.0
    return vec.reshape(1, -1)


def predict(detected_symptoms: List[str], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Run ML inference and return top-N ranked conditions.
    Returns list of dicts with name, probability, urgency, specialist, icd.
    """
    if not _model_ready:
        return []

    vec = symptoms_to_vector(detected_symptoms)
    if vec.size == 0:
        return []

    try:
        # OneVsRestClassifier.predict_proba → shape (n_samples, n_classes)
        proba_matrix = _clf.predict_proba(vec)  # shape: (1, n_conditions)
        probs = proba_matrix[0]                  # shape: (n_conditions,)

        # Rank by probability
        top_indices = np.argsort(probs)[::-1][:top_n]
        conditions  = _mlb.classes_

        results = []
        for idx in top_indices:
            prob = float(probs[idx])
            if prob < 0.08:  # filter very low confidence
                continue
            cond_id = conditions[idx]
            meta    = CONDITION_META.get(cond_id, {})
            urgency = meta.get("urgency", "low")
            results.append({
                "name":       _id_to_name(cond_id),
                "id":         cond_id,
                "icd":        meta.get("icd", "R68.89"),
                "probability": round(prob * 100, 1),
                "risk_score": _urgency_to_risk(urgency, prob),
                "urgency":    urgency,
                "specialist": meta.get("specialist", "General Practitioner"),
                "lifestyle":  LIFESTYLE_TIPS.get(urgency, LIFESTYLE_TIPS["low"]),
            })

        return results[:top_n]

    except Exception as e:
        print(f"⚠️  ML inference error: {e}")
        return []


def get_model_info() -> Dict[str, Any]:
    """Return metadata about the loaded model."""
    if not _model_ready or not _metadata:
        return {"ready": False}
    return {
        "ready":            True,
        "n_conditions":     _metadata.get("n_conditions", 0),
        "n_symptoms":       _metadata.get("n_symptoms", 0),
        "hamming_loss":     _metadata.get("hamming_loss", 0),
        "subset_accuracy":  _metadata.get("subset_accuracy", 0),
        "model_type":       _metadata.get("model_type", ""),
    }


# ── Internal helpers ──────────────────────────────────────────────
def _id_to_name(cond_id: str) -> str:
    return cond_id.replace("_", " ").title()

def _urgency_to_risk(urgency: str, prob: float) -> int:
    base = {"emergency": 88, "high": 68, "moderate": 45, "low": 20}.get(urgency, 20)
    return min(int(base + prob * 15), 100)

# Alias map: symptom_group names → ML feature names
_ALIAS_MAP = {
    "fever":           ["fever"],
    "fatigue":         ["fatigue","malaise","low_energy"],
    "headache":        ["headache"],
    "cough":           ["cough"],
    "breathless":      ["breathless"],
    "chest_pain":      ["chest_pain","pleuritic_pain"],
    "nausea":          ["nausea"],
    "vomiting":        ["vomiting"],
    "diarrhea":        ["diarrhea"],
    "abdominal":       ["abdominal_pain"],
    "sore_throat":     ["sore_throat","throat_pain"],
    "rash":            ["rash","urticaria"],
    "joint_pain":      ["joint_pain","bone_pain"],
    "swelling":        ["leg_swelling"],
    "dizziness":       ["dizziness","syncope"],
    "confusion":       ["confusion","memory_loss"],
    "anxiety":         ["anxiety","panic_attacks"],
    "vision":          ["vision_blur"],
    "jaundice":        ["jaundice"],
    "urinary":         ["burning_urination","urinary_frequency"],
    "bleeding":        ["prolonged_bleeding","rectal_bleeding","easy_bruising"],
    "numbness":        ["numbness"],
    "weight_loss":     ["weight_loss"],
    "appetite":        ["appetite_loss"],
    "palpitations":    ["palpitations","irregular_heart","rapid_heart"],
    "runny_nose":      ["nasal_congestion","sneezing"],
    "back_pain":       ["back_pain","flank_pain"],
    "sleep":           ["insomnia"],
    "thirst":          ["excessive_thirst"],
    "frequent_urination": ["urinary_frequency","frequent_urination"],
    "wheezing":        ["wheezing"],
    "night_sweats":    ["night_sweats"],
    "sweating":        ["flushing"],
    "neck_stiffness":  ["neck_stiffness"],
    "seizures":        ["seizures"],
    "tremors":         ["tremors"],
    "heartburn":       ["heartburn"],
    "phlegm":          ["phlegm"],
    "depression":      ["depression"],
    "heat_intolerance":["heat_intolerance"],
    "weight_gain":     ["weight_gain"],
    "muscle_weakness": ["muscle_weakness"],
    "sensitivity_light":["sensitivity_light"],
    "sensitivity_sound":["sensitivity_sound"],
    "muscle_spasms":   ["muscle_spasms"],
    "dry_skin":        ["dry_skin"],
    "peeling_skin":    ["peeling_skin"],
    "increased_appetite": ["increased_appetite"],
    "pale_skin":       ["pallor","pale_skin"],
    "hair_loss":       ["hair_loss"],
    "swollen_glands":  ["swollen_lymph","splenomegaly"],
    "chills":          ["chills"],
    "itching":         ["itching"],
}

# Auto-load on import
load_model()
