"""
train_model.py  —  Sakhi v3 ML Training Pipeline
GenAI Concepts: Supervised Multi-label Classification + RAG Integration
Trains a RandomForest model on 75+ conditions × 90+ symptom features.
Run: python train_model.py
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, hamming_loss, accuracy_score
from sklearn.pipeline import Pipeline
import joblib, json, os, random

# ─── 1. SYMPTOM VOCABULARY (90 multi-category features) ──────────
SYMPTOM_CATEGORIES = {
    "systemic":        ["fever","fatigue","weight_loss","night_sweats","appetite_loss","chills","malaise","weight_gain"],
    "neurological":    ["headache","dizziness","confusion","seizures","numbness","tremors","speech_problems","vision_blur","memory_loss","neck_stiffness","sensitivity_light","sensitivity_sound"],
    "cardiovascular":  ["chest_pain","palpitations","breathless","leg_swelling","syncope","rapid_heart","irregular_heart","cyanosis"],
    "respiratory":     ["cough","wheezing","phlegm","hoarseness","nasal_congestion","sneezing","sore_throat","pleuritic_pain"],
    "gastrointestinal":["nausea","vomiting","diarrhea","constipation","abdominal_pain","jaundice","rectal_bleeding","heartburn","bloating","difficulty_swallowing","dark_stool"],
    "musculoskeletal": ["joint_pain","muscle_pain","back_pain","morning_stiffness","muscle_weakness","muscle_spasms","bone_pain","limited_range"],
    "dermatological":  ["rash","itching","dry_skin","peeling_skin","hair_loss","pale_skin","flushing","skin_lesions","urticaria","blisters"],
    "endocrine":       ["excessive_thirst","frequent_urination","heat_intolerance","cold_intolerance","increased_appetite","goiter","moon_face","buffalo_hump"],
    "psychiatric":     ["depression","anxiety","mood_swings","insomnia","hallucinations","paranoia","panic_attacks","low_energy"],
    "urological":      ["burning_urination","urinary_frequency","blood_urine","cloudy_urine","urinary_retention","flank_pain"],
    "ent":             ["ear_pain","ear_ringing","nasal_bleeding","facial_pain","throat_pain","voice_change","post_nasal_drip"],
    "haematological":  ["easy_bruising","prolonged_bleeding","swollen_lymph","pallor","petechiae","splenomegaly"],
}

ALL_SYMPTOMS = [s for cat in SYMPTOM_CATEGORIES.values() for s in cat]

# ─── 2. DISEASE DEFINITIONS (75+ conditions) ─────────────────────
# Format: (id, name, category, urgency, required_symptoms, common_symptoms, risk)
DISEASES_COMPACT = [
    # ── INFECTIOUS / TROPICAL ────────────────────────────────────
    ("common_cold","Common Cold","infectious","low",
     ["nasal_congestion","sore_throat"],
     ["fever","fatigue","headache","cough","sneezing"],10),
    ("influenza","Influenza (Flu)","infectious","moderate",
     ["fever","fatigue"],
     ["headache","joint_pain","cough","nasal_congestion","chills"],25),
    ("covid19","COVID-19","infectious","high",
     ["fever","cough"],
     ["fatigue","breathless","headache","sore_throat","malaise"],55),
    ("dengue","Dengue Fever","infectious","high",
     ["fever","joint_pain"],
     ["headache","rash","nausea","easy_bruising","fatigue","chills"],65),
    ("malaria","Malaria","infectious","high",
     ["fever","chills"],
     ["headache","fatigue","nausea","vomiting","joint_pain","night_sweats"],70),
    ("typhoid","Typhoid Fever","infectious","high",
     ["fever","abdominal_pain"],
     ["headache","fatigue","diarrhea","nausea","appetite_loss","rash"],60),
    ("chickenpox","Chickenpox","infectious","moderate",
     ["rash","fever"],
     ["itching","fatigue","headache","appetite_loss","blisters"],30),
    ("tuberculosis","Tuberculosis (TB)","infectious","high",
     ["cough","night_sweats"],
     ["weight_loss","fatigue","fever","phlegm","chest_pain"],70),
    ("chikungunya","Chikungunya","infectious","moderate",
     ["fever","joint_pain"],
     ["rash","headache","fatigue","muscle_pain","morning_stiffness"],50),
    ("leptospirosis","Leptospirosis","infectious","high",
     ["fever","muscle_pain"],
     ["headache","nausea","vomiting","rash","jaundice","chills"],65),
    ("hepatitis_a","Hepatitis A","infectious","moderate",
     ["jaundice","nausea"],
     ["fever","fatigue","abdominal_pain","appetite_loss","dark_stool"],50),
    ("hepatitis_b","Hepatitis B","infectious","high",
     ["jaundice","fatigue"],
     ["abdominal_pain","nausea","appetite_loss","dark_stool","weight_loss"],65),
    ("measles","Measles","infectious","moderate",
     ["rash","fever"],
     ["cough","nasal_congestion","sensitivity_light","fatigue","sneezing"],45),
    ("mumps","Mumps","infectious","moderate",
     ["fever","facial_pain"],
     ["headache","fatigue","appetite_loss","throat_pain"],40),
    ("hiv_early","HIV (Early Stage)","infectious","high",
     ["fever","swollen_lymph"],
     ["fatigue","night_sweats","rash","weight_loss","sore_throat","headache"],70),

    # ── CARDIOVASCULAR ───────────────────────────────────────────
    ("heart_attack","Myocardial Infarction","cardiovascular","emergency",
     ["chest_pain"],
     ["breathless","palpitations","fatigue","nausea","dizziness","numbness"],90),
    ("angina","Angina Pectoris","cardiovascular","high",
     ["chest_pain","rapid_heart"],
     ["breathless","dizziness","fatigue","palpitations"],70),
    ("hypertension","Hypertension","cardiovascular","moderate",
     ["headache","dizziness"],
     ["palpitations","vision_blur","chest_pain","fatigue"],55),
    ("heart_failure","Heart Failure (CHF)","cardiovascular","high",
     ["breathless","leg_swelling"],
     ["fatigue","chest_pain","cough","palpitations","weight_gain"],75),
    ("arrhythmia","Cardiac Arrhythmia","cardiovascular","high",
     ["palpitations","irregular_heart"],
     ["dizziness","breathless","chest_pain","syncope","fatigue"],65),
    ("dvt","Deep Vein Thrombosis","cardiovascular","high",
     ["leg_swelling","bone_pain"],
     ["limited_range","flushing","breathless"],60),
    ("pulmonary_embolism","Pulmonary Embolism","cardiovascular","emergency",
     ["breathless","chest_pain"],
     ["rapid_heart","syncope","cyanosis","leg_swelling"],88),
    ("pericarditis","Pericarditis","cardiovascular","high",
     ["chest_pain","fever"],
     ["breathless","fatigue","palpitations","cough"],65),

    # ── RESPIRATORY ──────────────────────────────────────────────
    ("pneumonia","Pneumonia","respiratory","high",
     ["fever","cough","breathless"],
     ["chest_pain","fatigue","phlegm","nausea","chills"],75),
    ("asthma","Asthma","respiratory","high",
     ["breathless","wheezing"],
     ["cough","chest_pain","anxiety","insomnia"],50),
    ("copd","COPD / Emphysema","respiratory","high",
     ["breathless","cough"],
     ["wheezing","phlegm","fatigue","cyanosis","weight_loss"],72),
    ("bronchitis","Acute Bronchitis","respiratory","moderate",
     ["cough","phlegm"],
     ["fever","chest_pain","fatigue","hoarseness","breathless"],35),
    ("pleurisy","Pleurisy","respiratory","high",
     ["pleuritic_pain","breathless"],
     ["cough","fever","fatigue","chest_pain"],60),
    ("pneumothorax","Pneumothorax","respiratory","emergency",
     ["chest_pain","breathless"],
     ["rapid_heart","cyanosis","dizziness","fatigue"],85),
    ("sleep_apnea","Sleep Apnea","respiratory","moderate",
     ["insomnia","fatigue"],
     ["headache","depression","mood_swings","memory_loss","weight_gain"],30),

    # ── NEUROLOGICAL ─────────────────────────────────────────────
    ("migraine","Migraine","neurological","low",
     ["headache"],
     ["nausea","vision_blur","dizziness","sensitivity_light","sensitivity_sound","vomiting"],25),
    ("stroke","Stroke (CVA)","neurological","emergency",
     ["confusion","numbness"],
     ["vision_blur","headache","dizziness","speech_problems"],95),
    ("meningitis","Meningitis","neurological","emergency",
     ["neck_stiffness","fever"],
     ["headache","sensitivity_light","sensitivity_sound","confusion","vomiting","rash"],90),
    ("epilepsy","Epilepsy / Seizure","neurological","high",
     ["seizures"],
     ["confusion","tremors","fatigue","anxiety","muscle_spasms"],70),
    ("parkinsons","Parkinson's Disease","neurological","moderate",
     ["tremors","muscle_stiffness"],
     ["muscle_weakness","speech_problems","depression","insomnia","memory_loss"],45),
    ("ms","Multiple Sclerosis","neurological","high",
     ["numbness","vision_blur"],
     ["fatigue","muscle_weakness","dizziness","tremors","muscle_spasms","speech_problems"],65),
    ("bells_palsy","Bell's Palsy","neurological","moderate",
     ["facial_pain"],
     ["speech_problems","headache","dizziness","vision_blur"],40),
    ("cluster_headache","Cluster Headache","neurological","moderate",
     ["headache","sensitivity_light"],
     ["nasal_congestion","watery_eyes","facial_pain","restlessness"],35),
    ("alzheimers","Alzheimer's Disease","neurological","moderate",
     ["memory_loss","confusion"],
     ["speech_problems","depression","mood_swings","insomnia","paranoia"],40),

    # ── GASTROINTESTINAL ─────────────────────────────────────────
    ("gastroenteritis","Gastroenteritis","gastrointestinal","moderate",
     ["nausea","diarrhea"],
     ["vomiting","abdominal_pain","fever","fatigue","malaise"],30),
    ("appendicitis","Appendicitis","gastrointestinal","emergency",
     ["abdominal_pain","fever"],
     ["nausea","vomiting","appetite_loss","rebound_tenderness"],80),
    ("gerd","GERD / Acid Reflux","gastrointestinal","low",
     ["heartburn"],
     ["chest_pain","nausea","hoarseness","difficulty_swallowing","cough"],25),
    ("ibs","Irritable Bowel Syndrome","gastrointestinal","low",
     ["abdominal_pain","bloating"],
     ["diarrhea","constipation","nausea","anxiety","fatigue"],20),
    ("peptic_ulcer","Peptic Ulcer Disease","gastrointestinal","moderate",
     ["abdominal_pain","heartburn"],
     ["nausea","rectal_bleeding","weight_loss","dark_stool","vomiting"],55),
    ("crohns","Crohn's Disease","gastrointestinal","moderate",
     ["abdominal_pain","diarrhea"],
     ["weight_loss","fever","fatigue","rectal_bleeding","joint_pain","rash"],50),
    ("ulcerative_colitis","Ulcerative Colitis","gastrointestinal","moderate",
     ["diarrhea","rectal_bleeding"],
     ["abdominal_pain","fatigue","fever","weight_loss"],55),
    ("pancreatitis","Pancreatitis","gastrointestinal","high",
     ["abdominal_pain","nausea"],
     ["vomiting","fever","rapid_heart","jaundice","weight_loss"],72),
    ("liver_disease","Hepatitis / Liver Disease","gastrointestinal","high",
     ["jaundice","fatigue"],
     ["abdominal_pain","nausea","appetite_loss","weight_loss","dark_stool","easy_bruising"],70),
    ("cholecystitis","Cholecystitis (Gallbladder)","gastrointestinal","high",
     ["abdominal_pain","fever"],
     ["nausea","vomiting","jaundice","chills"],68),
    ("food_poisoning","Food Poisoning","gastrointestinal","moderate",
     ["nausea","vomiting","diarrhea"],
     ["abdominal_pain","fever","fatigue","malaise"],35),

    # ── ENDOCRINE / METABOLIC ────────────────────────────────────
    ("diabetes_t2","Type 2 Diabetes","endocrine","moderate",
     ["excessive_thirst","frequent_urination"],
     ["fatigue","vision_blur","weight_loss","numbness","skin_lesions","increased_appetite"],50),
    ("diabetes_t1","Type 1 Diabetes","endocrine","high",
     ["excessive_thirst","frequent_urination"],
     ["weight_loss","fatigue","vision_blur","nausea","increased_appetite","malaise"],65),
    ("hypothyroidism","Hypothyroidism","endocrine","low",
     ["fatigue","cold_intolerance"],
     ["weight_gain","depression","hair_loss","dry_skin","constipation","joint_pain","memory_loss"],30),
    ("hyperthyroidism","Hyperthyroidism","endocrine","moderate",
     ["palpitations","heat_intolerance"],
     ["weight_loss","anxiety","tremors","increased_appetite","fatigue","goiter","insomnia"],40),
    ("cushings","Cushing's Syndrome","endocrine","moderate",
     ["weight_gain","moon_face"],
     ["buffalo_hump","fatigue","depression","muscle_weakness","easy_bruising","skin_lesions"],50),
    ("pcos","PCOS","endocrine","low",
     ["irregular_heart","weight_gain"],
     ["hair_loss","acne","fatigue","depression","mood_swings"],30),
    ("gout","Gout","endocrine","moderate",
     ["joint_pain","flushing"],
     ["fever","swelling","bone_pain","limited_range"],45),
    ("hypoglycemia","Hypoglycemia","endocrine","high",
     ["dizziness","confusion"],
     ["tremors","palpitations","sweating","anxiety","fatigue","headache","syncope"],65),

    # ── MUSCULOSKELETAL ──────────────────────────────────────────
    ("rheumatoid_arthritis","Rheumatoid Arthritis","musculoskeletal","moderate",
     ["joint_pain","morning_stiffness"],
     ["swollen_lymph","fatigue","fever","muscle_weakness","weight_loss"],35),
    ("osteoarthritis","Osteoarthritis","musculoskeletal","low",
     ["joint_pain","limited_range"],
     ["bone_pain","muscle_weakness","morning_stiffness"],20),
    ("fibromyalgia","Fibromyalgia","musculoskeletal","moderate",
     ["muscle_pain","fatigue"],
     ["insomnia","headache","depression","anxiety","memory_loss","joint_pain"],30),
    ("ankylosing_spondylitis","Ankylosing Spondylitis","musculoskeletal","moderate",
     ["back_pain","morning_stiffness"],
     ["fatigue","joint_pain","limited_range","chest_pain"],40),
    ("lupus","Lupus (SLE)","musculoskeletal","high",
     ["rash","joint_pain"],
     ["fever","fatigue","hair_loss","chest_pain","sensitivity_light","kidney_pain","depression"],65),
    ("osteoporosis","Osteoporosis","musculoskeletal","moderate",
     ["bone_pain","back_pain"],
     ["limited_range","muscle_weakness","fatigue"],30),

    # ── DERMATOLOGICAL ───────────────────────────────────────────
    ("psoriasis","Psoriasis","dermatological","low",
     ["rash","peeling_skin"],
     ["itching","dry_skin","joint_pain","nail_changes"],15),
    ("eczema","Eczema / Atopic Dermatitis","dermatological","low",
     ["rash","itching"],
     ["dry_skin","flushing","anxiety","insomnia"],15),
    ("urticaria","Urticaria / Hives","dermatological","moderate",
     ["urticaria","itching"],
     ["rash","flushing","breathless","dizziness"],35),
    ("cellulitis","Cellulitis","dermatological","high",
     ["rash","fever"],
     ["skin_lesions","flushing","pain_tenderness","swollen_lymph"],60),
    ("shingles","Shingles (Herpes Zoster)","dermatological","moderate",
     ["rash","pain_tenderness"],
     ["itching","blisters","fever","fatigue","sensitivity_light"],45),
    ("acne_severe","Severe Acne / Acne Cystica","dermatological","low",
     ["skin_lesions","rash"],
     ["depression","anxiety","mood_swings"],10),

    # ── PSYCHIATRIC ──────────────────────────────────────────────
    ("depression","Major Depressive Disorder","psychiatric","moderate",
     ["depression","fatigue"],
     ["insomnia","appetite_loss","weight_loss","memory_loss","anxiety","low_energy"],25),
    ("anxiety_disorder","Generalised Anxiety Disorder","psychiatric","low",
     ["anxiety","insomnia"],
     ["palpitations","breathless","dizziness","muscle_spasms","fatigue","headache"],20),
    ("bipolar","Bipolar Disorder","psychiatric","moderate",
     ["mood_swings","insomnia"],
     ["hallucinations","depression","anxiety","low_energy","rapid_speech"],35),
    ("ptsd","PTSD","psychiatric","moderate",
     ["anxiety","insomnia"],
     ["depression","mood_swings","paranoia","fatigue","panic_attacks"],30),
    ("schizophrenia","Schizophrenia","psychiatric","high",
     ["hallucinations","paranoia"],
     ["speech_problems","depression","anxiety","insomnia","confusion"],55),
    ("ocd","OCD","psychiatric","low",
     ["anxiety","panic_attacks"],
     ["insomnia","depression","fatigue","mood_swings"],20),

    # ── UROLOGICAL / RENAL ───────────────────────────────────────
    ("uti","Urinary Tract Infection","urological","moderate",
     ["burning_urination","urinary_frequency"],
     ["fever","abdominal_pain","fatigue","cloudy_urine","flank_pain"],35),
    ("kidney_stone","Kidney Stones","urological","high",
     ["flank_pain","blood_urine"],
     ["nausea","vomiting","urinary_frequency","burning_urination","fever"],60),
    ("ckd","Chronic Kidney Disease","urological","high",
     ["fatigue","leg_swelling"],
     ["frequent_urination","nausea","breathless","pallor","blood_urine","confusion"],70),
    ("bph","Benign Prostatic Hyperplasia","urological","moderate",
     ["urinary_retention","urinary_frequency"],
     ["burning_urination","flank_pain","sleep_disruption"],35),
    ("kidney_infection","Pyelonephritis","urological","high",
     ["fever","flank_pain"],
     ["burning_urination","nausea","vomiting","chills","fatigue","blood_urine"],65),

    # ── HAEMATOLOGICAL ───────────────────────────────────────────
    ("anaemia","Anaemia","haematological","moderate",
     ["fatigue","pallor"],
     ["dizziness","breathless","palpitations","headache","cold_intolerance"],35),
    ("leukaemia","Leukaemia (Suspected)","haematological","high",
     ["fatigue","easy_bruising"],
     ["swollen_lymph","weight_loss","fever","pallor","night_sweats","petechiae","bone_pain"],80),
    ("thrombocytopenia","Thrombocytopenia","haematological","high",
     ["easy_bruising","petechiae"],
     ["prolonged_bleeding","pallor","fatigue","splenomegaly"],70),
    ("lymphoma","Lymphoma","haematological","high",
     ["swollen_lymph","night_sweats"],
     ["fever","weight_loss","fatigue","itching","chest_pain"],75),

    # ── ENT ──────────────────────────────────────────────────────
    ("sinusitis","Sinusitis","ent","low",
     ["headache","nasal_congestion"],
     ["facial_pain","fever","fatigue","sore_throat","post_nasal_drip","nasal_bleeding"],20),
    ("otitis_media","Otitis Media (Ear Infection)","ent","moderate",
     ["ear_pain","fever"],
     ["headache","fatigue","dizziness","post_nasal_drip","hearing_loss"],35),
    ("tonsillitis","Tonsillitis","ent","moderate",
     ["sore_throat","fever"],
     ["headache","fatigue","swollen_lymph","difficulty_swallowing","appetite_loss"],35),
    ("laryngitis","Laryngitis","ent","low",
     ["voice_change","throat_pain"],
     ["cough","fever","fatigue","difficulty_swallowing"],20),
]

print(f"✅ Loaded {len(DISEASES_COMPACT)} medical conditions")

# ─── 3. SYNTHETIC DATASET GENERATION ─────────────────────────────
def generate_dataset(n_samples=8000, noise_rate=0.08):
    """
    GenAI Pattern: Synthetic data generation from domain knowledge.
    Each sample = symptom vector (binary) → disease label(s).
    """
    random.seed(42)
    np.random.seed(42)

    all_symptom_list = ALL_SYMPTOMS.copy()
    # Add symptoms mentioned in diseases but not in ALL_SYMPTOMS
    disease_syms = set()
    for d in DISEASES_COMPACT:
        disease_syms.update(d[4])  # required
        disease_syms.update(d[5])  # common
    extra = [s for s in disease_syms if s not in all_symptom_list]
    all_symptom_list += extra
    sym_idx = {s: i for i, s in enumerate(all_symptom_list)}
    n_feats = len(all_symptom_list)

    X, y = [], []

    for _ in range(n_samples):
        # Pick 1–3 random diseases
        n_diseases = random.choices([1, 2, 3], weights=[0.65, 0.25, 0.10])[0]
        diseases = random.sample(DISEASES_COMPACT, n_diseases)

        vec = np.zeros(n_feats)
        labels = []

        for dis in diseases:
            labels.append(dis[0])  # disease id

            # Always include required symptoms
            for s in dis[4]:
                if s in sym_idx:
                    vec[sym_idx[s]] = 1.0

            # Include common symptoms with probability
            for s in dis[5]:
                if s in sym_idx and random.random() > 0.35:
                    vec[sym_idx[s]] = 1.0

        # Add random noise (false positives)
        noise_syms = random.sample(range(n_feats), int(n_feats * noise_rate))
        for i in noise_syms:
            if random.random() > 0.5:
                vec[i] = 1.0

        X.append(vec)
        y.append(labels)

    return np.array(X), y, all_symptom_list


# ─── 4. BUILD & TRAIN ML MODEL ────────────────────────────────────
def train():
    print("\n🔬 Generating synthetic clinical dataset...")
    X, y_raw, symptom_list = generate_dataset(n_samples=10000)

    print(f"   Dataset shape: {X.shape} | Symptom features: {len(symptom_list)}")

    # Multi-label binarizer
    mlb = MultiLabelBinarizer()
    Y = mlb.fit_transform(y_raw)
    print(f"   Label classes: {len(mlb.classes_)} conditions")

    # Train / test split
    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.2, random_state=42
    )

    # ── Model: OneVsRest Random Forest (best for multi-label) ────
    print("\n🤖 Training OneVsRest RandomForest classifier...")
    clf = OneVsRestClassifier(
        RandomForestClassifier(
            n_estimators=200,
            max_depth=18,
            min_samples_split=4,
            n_jobs=1,
            random_state=42,
            class_weight="balanced",
        ),
        n_jobs=1,
    )
    clf.fit(X_train, Y_train)

    # ── Evaluate ─────────────────────────────────────────────────
    Y_pred = clf.predict(X_test)
    hl = hamming_loss(Y_test, Y_pred)
    subset_acc = accuracy_score(Y_test, Y_pred)

    print(f"\n📊 Evaluation Results:")
    print(f"   Hamming Loss (lower=better): {hl:.4f}")
    print(f"   Exact Match Accuracy:        {subset_acc:.4f}")

    # Per-class report (top 10)
    report = classification_report(
        Y_test, Y_pred,
        target_names=mlb.classes_,
        zero_division=0,
        output_dict=True
    )
    top = sorted(
        [(c, v["f1-score"]) for c, v in report.items() if isinstance(v, dict)],
        key=lambda x: -x[1]
    )[:10]
    print("\n   Top-10 Conditions by F1-Score:")
    for name, f1 in top:
        print(f"   • {name:<35} F1={f1:.3f}")

    # ── Save artifacts ────────────────────────────────────────────
    os.makedirs("models", exist_ok=True)
    joblib.dump(clf, "models/symptom_classifier.joblib")
    joblib.dump(mlb, "models/label_binarizer.joblib")
    joblib.dump(symptom_list, "models/symptom_list.joblib")

    # Save metadata as JSON for the chatbot engine
    metadata = {
        "n_conditions":   len(mlb.classes_),
        "n_symptoms":     len(symptom_list),
        "conditions":     list(mlb.classes_),
        "symptoms":       symptom_list,
        "hamming_loss":   round(hl, 4),
        "subset_accuracy": round(subset_acc, 4),
        "model_type":     "OneVsRest(RandomForest)",
        "train_samples":  len(X_train),
    }
    with open("models/model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\n✅ Model saved to backend/models/")
    print(f"   • symptom_classifier.joblib")
    print(f"   • label_binarizer.joblib")
    print(f"   • symptom_list.joblib")
    print(f"   • model_metadata.json")
    print(f"\n🚀 {len(mlb.classes_)} conditions · {len(symptom_list)} symptom features · Ready for inference!")

    return clf, mlb, symptom_list


if __name__ == "__main__":
    train()
