// =============================================================
//  AI Health Symptom Checker — Medical Knowledge Base
//  Symptoms → Conditions → Risk → Recommendations
// =============================================================

const KNOWLEDGE_BASE = {

  // ─── SYMPTOM GROUPS ──────────────────────────────────────────
  symptomGroups: {
    // ── Original 30 groups ──
    fever:              ["fever", "high temperature", "hot body", "body hot", "chills", "shivering", "burning up", "temperature", "pyrexia", "feverish"],
    headache:           ["headache", "head pain", "head ache", "migraine", "throbbing head", "head hurts", "pressure in head"],
    fatigue:            ["fatigue", "tiredness", "weakness", "weak", "exhausted", "exhaustion", "lethargy", "lethargic", "no energy", "feel weak"],
    cough:              ["cough", "coughing", "dry cough", "wet cough", "persistent cough", "cough up", "hack"],
    breathless:         ["breathless", "shortness of breath", "difficulty breathing", "can't breathe", "breathing difficulty", "dyspnea", "breathlessness", "hard to breathe"],
    chest_pain:         ["chest pain", "chest tightness", "chest pressure", "chest discomfort", "tight chest", "heart pain", "chest ache"],
    nausea:             ["nausea", "nauseous", "feel sick", "want to vomit", "queasy", "upset stomach"],
    vomiting:           ["vomiting", "vomit", "throwing up", "threw up", "puking", "puke"],
    diarrhea:           ["diarrhea", "loose stool", "watery stool", "loose motion", "frequent stools", "loose bowels", "runny stool"],
    abdominal:          ["abdominal pain", "stomach pain", "stomach ache", "belly pain", "abdomen pain", "tummy ache", "cramps", "stomach cramp"],
    sore_throat:        ["sore throat", "throat pain", "scratchy throat", "painful throat", "difficulty swallowing", "throat irritation"],
    rash:               ["rash", "skin rash", "redness", "spots", "blotches", "hives", "itching", "itchy skin", "skin irritation", "eruption"],
    joint_pain:         ["joint pain", "joint ache", "arthritis", "bone pain", "muscle ache", "muscle pain", "body ache", "aches", "myalgia"],
    swelling:           ["swelling", "edema", "bloating", "puffiness", "swollen"],
    dizziness:          ["dizziness", "dizzy", "vertigo", "lightheaded", "light-headed", "fainting", "giddiness", "spinning"],
    confusion:          ["confusion", "confused", "disoriented", "memory loss", "forgetful", "brain fog", "can't think clearly"],
    anxiety:            ["anxiety", "anxious", "panic", "stress", "worry", "nervous", "restless"],
    vision:             ["blurry vision", "vision loss", "double vision", "eye pain", "eye redness", "yellow eyes", "eyes yellow"],
    jaundice:           ["jaundice", "yellow skin", "skin yellow", "yellowing", "yellow eyes"],
    urinary:            ["burning urination", "frequent urination", "painful urination", "blood in urine", "dark urine", "urine problem"],
    bleeding:           ["bleeding", "blood", "hemorrhage", "nosebleed", "bleeding gums", "blood in stool"],
    numbness:           ["numbness", "tingling", "pins and needles", "loss of sensation", "limb feels numb"],
    weight_loss:        ["weight loss", "losing weight", "sudden weight loss", "unexplained weight loss"],
    appetite:           ["loss of appetite", "no appetite", "not hungry", "not eating", "anorexia"],
    palpitations:       ["palpitations", "heart racing", "heart pounding", "rapid heartbeat", "irregular heartbeat", "heart beat fast"],
    runny_nose:         ["runny nose", "nasal congestion", "stuffy nose", "blocked nose", "sneezing"],
    back_pain:          ["back pain", "lower back pain", "backache", "spine pain"],
    sleep:              ["insomnia", "can't sleep", "sleeplessness", "sleep problems", "disturbed sleep"],
    thirst:             ["excessive thirst", "very thirsty", "drinking a lot of water", "polydipsia"],
    frequent_urination: ["frequent urination", "urinating a lot", "polyuria", "peeing a lot"],

    // ── Extended 42 new symptom groups (total → 72) ──
    wheezing:           ["wheezing", "whistling breath", "noisy breathing", "wheeze"],
    night_sweats:       ["night sweats", "sweating at night", "waking up sweating", "drenched in sweat"],
    sweating:           ["sweating", "excessive sweating", "hyperhidrosis", "profuse sweat", "perspiring"],
    cold_intolerance:   ["sensitive to cold", "always cold", "cold intolerance", "feel cold all time", "cannot tolerate cold"],
    heat_intolerance:   ["sensitive to heat", "heat intolerance", "feel very hot", "cannot tolerate heat", "overheating"],
    hair_loss:          ["hair loss", "hair falling", "alopecia", "thinning hair", "bald patches", "losing hair"],
    dry_skin:           ["dry skin", "skin dryness", "flaky skin", "scaly skin", "rough skin"],
    constipation:       ["constipation", "hard stool", "cannot pass stool", "infrequent bowel", "straining to defecate"],
    heartburn:          ["heartburn", "acid reflux", "burning in chest", "sour taste", "indigestion", "regurgitation", "gerd"],
    ear_pain:           ["ear pain", "earache", "pain in ear", "ear ache", "ear infection"],
    ear_ringing:        ["ringing in ears", "tinnitus", "buzzing in ear", "ear ringing"],
    nasal_bleeding:     ["nosebleed", "nasal bleeding", "epistaxis", "blood from nose"],
    phlegm:             ["phlegm", "mucus", "sputum", "coughing up phlegm", "productive cough", "green phlegm", "yellow phlegm"],
    hoarseness:         ["hoarse voice", "hoarseness", "voice change", "raspy voice", "losing voice"],
    constipation_bloat: ["stomach bloating", "abdominal bloating", "bloated stomach", "gassy", "flatulence", "gas pain"],
    dark_stool:         ["black stool", "dark stool", "tarry stool", "melena", "bloody stool"],
    pale_skin:          ["pale skin", "pallor", "skin looks pale", "chalky skin", "whitish skin"],
    flushing:           ["skin flushing", "face flushing", "redness of face", "hot flashes", "blushing"],
    acne:               ["acne", "pimples", "zits", "skin breakout", "blackheads", "whiteheads"],
    peeling_skin:       ["peeling skin", "skin peeling", "skin shedding", "blistering", "blisters"],
    red_eyes:           ["red eyes", "eye redness", "pink eye", "conjunctivitis", "bloodshot eyes"],
    watery_eyes:        ["watery eyes", "tearing", "eye discharge", "eyes watering", "lacrimation"],
    sensitivity_light:  ["sensitivity to light", "photophobia", "light hurts eyes", "cannot tolerate light"],
    sensitivity_sound:  ["sensitivity to sound", "phonophobia", "noise sensitivity", "sounds too loud"],
    muscle_spasms:      ["muscle spasms", "muscle cramps", "muscle twitching", "leg cramps", "charley horse"],
    muscle_weakness:    ["muscle weakness", "can't lift", "arms weak", "legs weak", "limb weakness"],
    speech_problems:    ["slurred speech", "difficulty speaking", "cannot speak", "speech problem", "word finding difficulty"],
    difficulty_swallowing: ["difficulty swallowing", "dysphagia", "food stuck in throat", "hard to swallow", "painful swallowing"],
    depression:         ["depression", "sad", "hopeless", "depressed", "low mood", "feeling down", "grief", "emptiness"],
    mood_changes:       ["mood swings", "irritability", "mood changes", "emotional", "angry", "short tempered"],
    neck_stiffness:     ["neck stiffness", "stiff neck", "neck pain", "cannot move neck", "neck rigidity"],
    seizures:           ["seizure", "convulsion", "fits", "epilepsy", "shaking uncontrollably", "blackout"],
    tremors:            ["tremors", "shaking", "hand trembling", "body trembling", "shaky"],
    weight_gain:        ["weight gain", "gaining weight", "sudden weight gain", "obesity", "overweight"],
    increased_appetite: ["increased appetite", "always hungry", "polyphagia", "excessive hunger", "eating too much"],
    dry_mouth:          ["dry mouth", "xerostomia", "mouth dryness", "thirsty mouth", "parched mouth"],
    bad_breath:         ["bad breath", "halitosis", "mouth odour", "foul breath"],
    skin_lesions:       ["skin lesions", "ulcers on skin", "sores", "wounds", "non-healing wound"],
    swollen_glands:     ["swollen glands", "lymph nodes swollen", "swollen lymph nodes", "lumps in neck", "gland swelling"],
    face_swelling:      ["face swelling", "facial swelling", "puffy face", "swollen face"],
    leg_pain:           ["leg pain", "calf pain", "thigh pain", "leg ache", "shin pain"],
    frequent_infections:["frequent infections", "recurring infections", "low immunity", "getting sick often"],
    bedwetting:         ["bedwetting", "nocturnal enuresis", "urinating in sleep", "night urination"]
  },

  // ─── DISEASE PROFILES ────────────────────────────────────────
  diseases: [
    {
      id: "common_cold",
      name: "Common Cold / Viral URTI",
      symptoms: ["fever", "runny_nose", "sore_throat", "cough", "fatigue", "headache"],
      required: ["runny_nose", "sore_throat"],
      weight: { fever: 1, runny_nose: 3, sore_throat: 3, cough: 2, fatigue: 1, headache: 1 },
      baseRisk: 10,
      riskModifiers: { age_elderly: 15, duration_long: 10, breathless: 25 },
      urgency: "low",
      specialist: "General Practitioner",
      icd: "J06.9"
    },
    {
      id: "influenza",
      name: "Influenza (Flu)",
      symptoms: ["fever", "fatigue", "headache", "joint_pain", "cough", "runny_nose", "sore_throat"],
      required: ["fever", "fatigue"],
      weight: { fever: 3, fatigue: 3, headache: 2, joint_pain: 2, cough: 2, runny_nose: 1 },
      baseRisk: 25,
      riskModifiers: { age_elderly: 25, age_child: 20, duration_long: 15, breathless: 30 },
      urgency: "moderate",
      specialist: "General Practitioner / Infectious Disease",
      icd: "J11"
    },
    {
      id: "dengue",
      name: "Dengue Fever",
      symptoms: ["fever", "headache", "joint_pain", "rash", "nausea", "vomiting", "bleeding", "fatigue"],
      required: ["fever", "joint_pain"],
      weight: { fever: 4, headache: 2, joint_pain: 4, rash: 3, nausea: 1, bleeding: 4, fatigue: 2 },
      baseRisk: 65,
      riskModifiers: { bleeding: 30, rash: 10, age_child: 20, duration_long: 15 },
      urgency: "high",
      specialist: "Infectious Disease Specialist / Emergency Medicine",
      icd: "A90"
    },
    {
      id: "malaria",
      name: "Malaria",
      symptoms: ["fever", "chills", "headache", "fatigue", "nausea", "vomiting", "joint_pain", "sweating"],
      required: ["fever", "fatigue"],
      weight: { fever: 4, fatigue: 3, headache: 2, nausea: 2, vomiting: 2, joint_pain: 2 },
      baseRisk: 70,
      riskModifiers: { age_child: 25, age_elderly: 20, confusion: 35, duration_long: 20 },
      urgency: "high",
      specialist: "Infectious Disease Specialist",
      icd: "B54"
    },
    {
      id: "typhoid",
      name: "Typhoid Fever",
      symptoms: ["fever", "headache", "fatigue", "abdominal", "diarrhea", "nausea", "appetite", "rash"],
      required: ["fever", "abdominal"],
      weight: { fever: 4, headache: 2, fatigue: 2, abdominal: 3, diarrhea: 2, nausea: 2, appetite: 2 },
      baseRisk: 60,
      riskModifiers: { duration_long: 20, vomiting: 10, bleeding: 25 },
      urgency: "high",
      specialist: "Infectious Disease Specialist / Gastroenterologist",
      icd: "A01.0"
    },
    {
      id: "covid19",
      name: "COVID-19",
      symptoms: ["fever", "cough", "fatigue", "breathless", "headache", "sore_throat", "loss_smell"],
      required: ["fever", "cough"],
      weight: { fever: 3, cough: 3, fatigue: 2, breathless: 4, headache: 1, sore_throat: 1 },
      baseRisk: 55,
      riskModifiers: { breathless: 35, age_elderly: 30, chest_pain: 30, confusion: 35 },
      urgency: "high",
      specialist: "Pulmonologist / Emergency Medicine",
      icd: "U07.1"
    },
    {
      id: "gastroenteritis",
      name: "Acute Gastroenteritis",
      symptoms: ["nausea", "vomiting", "diarrhea", "abdominal", "fever", "fatigue"],
      required: ["nausea", "diarrhea"],
      weight: { nausea: 3, vomiting: 2, diarrhea: 3, abdominal: 2, fever: 1, fatigue: 1 },
      baseRisk: 30,
      riskModifiers: { duration_long: 15, age_child: 20, age_elderly: 20, bleeding: 25 },
      urgency: "moderate",
      specialist: "General Practitioner / Gastroenterologist",
      icd: "A09"
    },
    {
      id: "pneumonia",
      name: "Pneumonia",
      symptoms: ["fever", "cough", "breathless", "chest_pain", "fatigue", "nausea"],
      required: ["fever", "cough", "breathless"],
      weight: { fever: 3, cough: 3, breathless: 4, chest_pain: 3, fatigue: 2 },
      baseRisk: 75,
      riskModifiers: { age_elderly: 30, age_child: 25, duration_long: 20, confusion: 30 },
      urgency: "high",
      specialist: "Pulmonologist / Emergency Medicine",
      icd: "J18"
    },
    {
      id: "diabetes_t2",
      name: "Type 2 Diabetes (Suspected)",
      symptoms: ["thirst", "frequent_urination", "fatigue", "vision", "weight_loss", "numbness"],
      required: ["thirst", "frequent_urination"],
      weight: { thirst: 4, frequent_urination: 4, fatigue: 2, vision: 2, weight_loss: 3, numbness: 2 },
      baseRisk: 50,
      riskModifiers: { age_elderly: 10, weight_loss: 15, vision: 20 },
      urgency: "moderate",
      specialist: "Endocrinologist / Diabetologist",
      icd: "E11"
    },
    {
      id: "hypertension",
      name: "Hypertension (High Blood Pressure)",
      symptoms: ["headache", "dizziness", "palpitations", "vision", "chest_pain", "fatigue"],
      required: ["headache", "dizziness"],
      weight: { headache: 3, dizziness: 3, palpitations: 2, vision: 2, chest_pain: 3, fatigue: 1 },
      baseRisk: 55,
      riskModifiers: { chest_pain: 35, vision: 20, confusion: 30, age_elderly: 15 },
      urgency: "moderate",
      specialist: "Cardiologist / General Physician",
      icd: "I10"
    },
    {
      id: "heart_attack",
      name: "Myocardial Infarction (Heart Attack)",
      symptoms: ["chest_pain", "breathless", "palpitations", "fatigue", "nausea", "dizziness", "numbness"],
      required: ["chest_pain"],
      weight: { chest_pain: 5, breathless: 4, palpitations: 3, fatigue: 2, nausea: 2, dizziness: 2, numbness: 3 },
      baseRisk: 90,
      riskModifiers: { age_elderly: 15, breathless: 20, numbness: 15 },
      urgency: "emergency",
      specialist: "Emergency Medicine / Cardiologist",
      icd: "I21"
    },
    {
      id: "appendicitis",
      name: "Appendicitis",
      symptoms: ["abdominal", "fever", "nausea", "vomiting", "appetite"],
      required: ["abdominal", "fever"],
      weight: { abdominal: 5, fever: 3, nausea: 2, vomiting: 2, appetite: 2 },
      baseRisk: 80,
      riskModifiers: { duration_long: 20, vomiting: 10 },
      urgency: "emergency",
      specialist: "Emergency Medicine / General Surgeon",
      icd: "K37"
    },
    {
      id: "migraine",
      name: "Migraine",
      symptoms: ["headache", "nausea", "vision", "dizziness", "fatigue", "vomiting"],
      required: ["headache"],
      weight: { headache: 5, nausea: 2, vision: 3, dizziness: 2, fatigue: 1, vomiting: 2 },
      baseRisk: 25,
      riskModifiers: { vision: 15, duration_long: 10, vomiting: 10 },
      urgency: "low",
      specialist: "Neurologist",
      icd: "G43"
    },
    {
      id: "uti",
      name: "Urinary Tract Infection (UTI)",
      symptoms: ["urinary", "frequent_urination", "fever", "abdominal", "fatigue"],
      required: ["urinary"],
      weight: { urinary: 5, frequent_urination: 3, fever: 2, abdominal: 2, fatigue: 1 },
      baseRisk: 35,
      riskModifiers: { fever: 15, duration_long: 20, age_elderly: 15 },
      urgency: "moderate",
      specialist: "Urologist / General Practitioner",
      icd: "N39.0"
    },
    {
      id: "anaemia",
      name: "Anaemia",
      symptoms: ["fatigue", "dizziness", "breathless", "palpitations", "headache", "vision", "appetite"],
      required: ["fatigue", "dizziness"],
      weight: { fatigue: 4, dizziness: 3, breathless: 2, palpitations: 2, headache: 1 },
      baseRisk: 35,
      riskModifiers: { breathless: 20, palpitations: 15, age_elderly: 10 },
      urgency: "moderate",
      specialist: "Haematologist / General Physician",
      icd: "D64"
    },
    {
      id: "thyroid_hypo",
      name: "Hypothyroidism (Underactive Thyroid)",
      symptoms: ["fatigue", "weight_loss", "sleep", "joint_pain", "depression", "swelling", "cold"],
      required: ["fatigue"],
      weight: { fatigue: 4, weight_loss: 2, sleep: 2, joint_pain: 2, swelling: 3 },
      baseRisk: 30,
      riskModifiers: { swelling: 15, duration_long: 20 },
      urgency: "low",
      specialist: "Endocrinologist",
      icd: "E03.9"
    },
    {
      id: "liver_disease",
      name: "Hepatitis / Liver Disease",
      symptoms: ["jaundice", "fatigue", "abdominal", "nausea", "appetite", "weight_loss", "fever"],
      required: ["jaundice"],
      weight: { jaundice: 5, fatigue: 2, abdominal: 2, nausea: 2, appetite: 2, weight_loss: 2 },
      baseRisk: 70,
      riskModifiers: { bleeding: 30, duration_long: 15, confusion: 30 },
      urgency: "high",
      specialist: "Hepatologist / Gastroenterologist",
      icd: "K76"
    },
    {
      id: "anxiety_disorder",
      name: "Anxiety / Panic Disorder",
      symptoms: ["anxiety", "palpitations", "breathless", "dizziness", "chest_pain", "numbness", "sleep"],
      required: ["anxiety"],
      weight: { anxiety: 4, palpitations: 3, breathless: 2, dizziness: 2, chest_pain: 2, sleep: 2 },
      baseRisk: 20,
      riskModifiers: { chest_pain: 10, palpitations: 10, sleep: 10 },
      urgency: "low",
      specialist: "Psychiatrist / Psychologist",
      icd: "F41.1"
    },
    {
      id: "kidney_stone",
      name: "Kidney Stones (Nephrolithiasis)",
      symptoms: ["back_pain", "abdominal", "urinary", "nausea", "vomiting", "fever"],
      required: ["back_pain", "urinary"],
      weight: { back_pain: 4, abdominal: 3, urinary: 3, nausea: 2, vomiting: 2, fever: 2 },
      baseRisk: 60,
      riskModifiers: { fever: 25, vomiting: 15, duration_long: 10 },
      urgency: "high",
      specialist: "Urologist / Emergency Medicine",
      icd: "N20"
    },
    {
      id: "stroke",
      name: "Stroke (Cerebrovascular Accident)",
      symptoms: ["confusion", "numbness", "vision", "headache", "dizziness", "chest_pain"],
      required: ["confusion", "numbness"],
      weight: { confusion: 5, numbness: 4, vision: 3, headache: 2, dizziness: 3 },
      baseRisk: 95,
      riskModifiers: { age_elderly: 10, vision: 15, headache: 10 },
      urgency: "emergency",
      specialist: "Neurologist / Emergency Medicine",
      icd: "I64"
    },

    // ── 13 New Conditions (total → 33) ──────────────────────────
    {
      id: "asthma",
      name: "Asthma",
      symptoms: ["breathless", "wheezing", "cough", "chest_pain", "anxiety"],
      required: ["breathless", "wheezing"],
      weight: { breathless: 5, wheezing: 5, cough: 3, chest_pain: 2, anxiety: 1 },
      baseRisk: 50,
      riskModifiers: { age_child: 20, chest_pain: 20, duration_long: 15 },
      urgency: "high",
      specialist: "Pulmonologist / Allergist",
      icd: "J45"
    },
    {
      id: "tuberculosis",
      name: "Tuberculosis (TB)",
      symptoms: ["cough", "night_sweats", "weight_loss", "fatigue", "fever", "phlegm", "chest_pain"],
      required: ["cough", "night_sweats"],
      weight: { cough: 4, night_sweats: 4, weight_loss: 3, fatigue: 2, fever: 2, phlegm: 3, chest_pain: 2 },
      baseRisk: 70,
      riskModifiers: { duration_long: 25, bleeding: 20, weight_loss: 15 },
      urgency: "high",
      specialist: "Pulmonologist / Infectious Disease",
      icd: "A15"
    },
    {
      id: "gerd",
      name: "GERD / Acid Reflux Disease",
      symptoms: ["heartburn", "chest_pain", "nausea", "hoarseness", "difficulty_swallowing", "cough"],
      required: ["heartburn"],
      weight: { heartburn: 5, chest_pain: 2, nausea: 2, hoarseness: 2, difficulty_swallowing: 3, cough: 1 },
      baseRisk: 25,
      riskModifiers: { duration_long: 15, difficulty_swallowing: 20, bleeding: 30 },
      urgency: "low",
      specialist: "Gastroenterologist",
      icd: "K21"
    },
    {
      id: "ibs",
      name: "Irritable Bowel Syndrome (IBS)",
      symptoms: ["abdominal", "diarrhea", "constipation", "constipation_bloat", "anxiety", "nausea"],
      required: ["abdominal", "constipation_bloat"],
      weight: { abdominal: 4, diarrhea: 3, constipation: 3, constipation_bloat: 3, anxiety: 2, nausea: 1 },
      baseRisk: 20,
      riskModifiers: { duration_long: 20, anxiety: 10 },
      urgency: "low",
      specialist: "Gastroenterologist",
      icd: "K58"
    },
    {
      id: "sinusitis",
      name: "Sinusitis (Sinus Infection)",
      symptoms: ["headache", "runny_nose", "face_swelling", "fever", "fatigue", "sore_throat", "nasal_bleeding"],
      required: ["headache", "runny_nose"],
      weight: { headache: 3, runny_nose: 3, face_swelling: 3, fever: 2, fatigue: 1, sore_throat: 1 },
      baseRisk: 20,
      riskModifiers: { fever: 15, duration_long: 10, face_swelling: 10 },
      urgency: "low",
      specialist: "ENT Specialist",
      icd: "J32"
    },
    {
      id: "chickenpox",
      name: "Chickenpox (Varicella)",
      symptoms: ["rash", "fever", "itching", "fatigue", "headache", "appetite"],
      required: ["rash", "fever"],
      weight: { rash: 5, fever: 3, fatigue: 2, headache: 2, appetite: 1 },
      baseRisk: 30,
      riskModifiers: { age_child: 10, age_elderly: 25, duration_long: 10 },
      urgency: "moderate",
      specialist: "General Practitioner / Infectious Disease",
      icd: "B01"
    },
    {
      id: "meningitis",
      name: "Meningitis",
      symptoms: ["neck_stiffness", "fever", "headache", "sensitivity_light", "sensitivity_sound", "confusion", "vomiting"],
      required: ["neck_stiffness", "fever"],
      weight: { neck_stiffness: 5, fever: 4, headache: 3, sensitivity_light: 3, confusion: 3, vomiting: 2 },
      baseRisk: 90,
      riskModifiers: { confusion: 20, age_child: 20, bleeding: 25 },
      urgency: "emergency",
      specialist: "Neurologist / Emergency Medicine",
      icd: "G03"
    },
    {
      id: "epilepsy",
      name: "Epilepsy / Seizure Disorder",
      symptoms: ["seizures", "confusion", "tremors", "fatigue", "anxiety", "muscle_spasms"],
      required: ["seizures"],
      weight: { seizures: 6, confusion: 3, tremors: 3, fatigue: 1, muscle_spasms: 2 },
      baseRisk: 70,
      riskModifiers: { confusion: 20, duration_long: 10, age_child: 15 },
      urgency: "high",
      specialist: "Neurologist",
      icd: "G40"
    },
    {
      id: "rheumatoid_arthritis",
      name: "Rheumatoid Arthritis",
      symptoms: ["joint_pain", "swelling", "fatigue", "fever", "morning_stiffness", "muscle_weakness"],
      required: ["joint_pain", "swelling"],
      weight: { joint_pain: 5, swelling: 4, fatigue: 2, fever: 1, muscle_weakness: 2 },
      baseRisk: 35,
      riskModifiers: { duration_long: 20, age_elderly: 15, swelling: 10 },
      urgency: "moderate",
      specialist: "Rheumatologist",
      icd: "M05"
    },
    {
      id: "food_poisoning",
      name: "Food Poisoning (Foodborne Illness)",
      symptoms: ["nausea", "vomiting", "diarrhea", "abdominal", "fever", "fatigue"],
      required: ["nausea", "vomiting", "diarrhea"],
      weight: { nausea: 3, vomiting: 4, diarrhea: 4, abdominal: 3, fever: 2 },
      baseRisk: 35,
      riskModifiers: { age_child: 20, age_elderly: 20, duration_long: 15, bleeding: 20 },
      urgency: "moderate",
      specialist: "General Practitioner / Gastroenterologist",
      icd: "A05"
    },
    {
      id: "psoriasis",
      name: "Psoriasis / Chronic Skin Condition",
      symptoms: ["rash", "dry_skin", "peeling_skin", "joint_pain", "itching"],
      required: ["rash", "peeling_skin"],
      weight: { rash: 4, dry_skin: 3, peeling_skin: 4, joint_pain: 2 },
      baseRisk: 15,
      riskModifiers: { duration_long: 20, joint_pain: 15 },
      urgency: "low",
      specialist: "Dermatologist",
      icd: "L40"
    },
    {
      id: "depression",
      name: "Major Depressive Disorder",
      symptoms: ["depression", "fatigue", "sleep", "appetite", "anxiety", "confusion", "weight_loss"],
      required: ["depression"],
      weight: { depression: 5, fatigue: 3, sleep: 2, appetite: 2, anxiety: 2, confusion: 2 },
      baseRisk: 25,
      riskModifiers: { duration_long: 20, sleep: 10, anxiety: 10 },
      urgency: "moderate",
      specialist: "Psychiatrist / Clinical Psychologist",
      icd: "F32"
    },
    {
      id: "hyperthyroidism",
      name: "Hyperthyroidism (Overactive Thyroid)",
      symptoms: ["palpitations", "weight_loss", "heat_intolerance", "anxiety", "tremors", "fatigue", "sweating", "increased_appetite"],
      required: ["palpitations", "weight_loss"],
      weight: { palpitations: 4, weight_loss: 3, heat_intolerance: 3, anxiety: 2, tremors: 3, sweating: 2 },
      baseRisk: 40,
      riskModifiers: { duration_long: 15, palpitations: 15, age_elderly: 15 },
      urgency: "moderate",
      specialist: "Endocrinologist",
      icd: "E05"
    }
  ],

  // ─── FOLLOW-UP QUESTIONS ─────────────────────────────────────
  followUpQuestions: [
    {
      id: "duration",
      question: "How long have you been experiencing these symptoms?",
      options: ["Less than 24 hours", "1–3 days", "4–7 days", "More than a week", "More than a month"],
      key: "duration"
    },
    {
      id: "severity",
      question: "On a scale of 1–10, how severe would you rate your discomfort overall?",
      options: ["1–3 (Mild)", "4–6 (Moderate)", "7–8 (Severe)", "9–10 (Unbearable)"],
      key: "severity"
    },
    {
      id: "age",
      question: "What is your age group?",
      options: ["Under 12 (Child)", "13–17 (Teenager)", "18–40 (Adult)", "41–60 (Middle-aged)", "60+ (Senior)"],
      key: "age"
    },
    {
      id: "gender",
      question: "What is your biological sex?",
      options: ["Male", "Female", "Prefer not to say"],
      key: "gender"
    },
    {
      id: "comorbidities",
      question: "Do you have any pre-existing medical conditions?",
      options: ["Diabetes", "Hypertension", "Heart Disease", "Asthma/COPD", "None", "Other"],
      key: "comorbidities",
      multi: true
    },
    {
      id: "medications",
      question: "Are you currently taking any medications?",
      options: ["Yes, prescription drugs", "Yes, over-the-counter", "No medications", "Herbal/supplements"],
      key: "medications"
    },
    {
      id: "travel",
      question: "Have you recently traveled to a different region or country?",
      options: ["Yes, within the past 14 days", "Yes, within a month", "No recent travel"],
      key: "travel"
    },
    {
      id: "fever_degree",
      question: "Have you measured your temperature? If yes, what was the reading?",
      options: ["Normal (below 37.5°C / 99.5°F)", "Low-grade (37.5–38.5°C)", "High (38.5–40°C)", "Very high (above 40°C)", "Not measured"],
      key: "fever_degree",
      relevantTo: ["fever"]
    },
    {
      id: "breathing_context",
      question: "When does the breathing difficulty occur?",
      options: ["At rest", "During mild activity", "During strenuous activity only", "Only at night"],
      key: "breathing_context",
      relevantTo: ["breathless"]
    },
    {
      id: "chest_context",
      question: "How would you describe the chest pain?",
      options: ["Sharp, stabbing", "Dull ache", "Pressure/tightness", "Burning", "Radiating to arm/jaw"],
      key: "chest_context",
      relevantTo: ["chest_pain"]
    }
  ],

  // ─── FIRST AID & ACTIONS ─────────────────────────────────────
  immediateActions: {
    emergency: {
      label: "🚨 CALL EMERGENCY NOW",
      color: "#ff2d55",
      bgColor: "rgba(255,45,85,0.15)",
      actions: [
        "Call 108 (India) / 911 / 999 immediately",
        "Do NOT drive yourself — call an ambulance",
        "Stay calm and keep the patient still",
        "Loosen tight clothing",
        "Note the time symptoms started"
      ]
    },
    high: {
      label: "⚠️ VISIT HOSPITAL TODAY",
      color: "#ff9f0a",
      bgColor: "rgba(255,159,10,0.15)",
      actions: [
        "Visit the nearest emergency room or hospital today",
        "Do not delay — condition may worsen quickly",
        "Avoid self-medication",
        "Stay hydrated with water or ORS if unwell",
        "Keep someone with you"
      ]
    },
    moderate: {
      label: "📋 CONSULT DOCTOR SOON",
      color: "#ffd60a",
      bgColor: "rgba(255,214,10,0.15)",
      actions: [
        "Schedule a doctor's appointment within 24–48 hrs",
        "Monitor your temperature and symptoms",
        "Stay hydrated and take proper rest",
        "You may take OTC paracetamol if needed (follow dosage)",
        "Keep a log of your symptoms"
      ]
    },
    low: {
      label: "✅ SELF-CARE LIKELY SUFFICIENT",
      color: "#30d158",
      bgColor: "rgba(48,209,88,0.15)",
      actions: [
        "Rest and stay hydrated",
        "Consume light, nutritious meals",
        "Take OTC medicines as appropriate",
        "Monitor symptoms — revisit if worsening",
        "Schedule a routine GP visit if symptoms persist > 3 days"
      ]
    }
  },

  // ─── LIFESTYLE RECOMMENDATIONS ────────────────────────────────
  lifestyleRec: {
    common_cold:       ["Stay warm and rest", "Drink warm fluids (herbal tea, broth)", "Saline nasal rinse", "Vitamin C supplementation", "Avoid smoking"],
    influenza:         ["Complete bed rest", "High fluid intake", "Antiviral may be prescribed (consult doctor)", "Isolate from others", "Annual flu vaccine advised"],
    dengue:            ["Strict bed rest", "Papaya leaf extract may help (consult doctor)", "Monitor platelet count daily", "Avoid NSAIDs (aspirin, ibuprofen)", "Mosquito net use"],
    malaria:           ["Strict prescribed antimalarial medication", "Complete the full course", "Mosquito-proof your environment", "Avoid outdoor exposure at dusk/dawn", "Blood test for confirmation is essential"],
    typhoid:           ["Maintain strict food hygiene", "Drink only boiled/filtered water", "Complete antibiotic course", "Light, easily digestible foods", "Vaccination recommended after recovery"],
    covid19:           ["Isolate for at least 5–10 days", "Monitor oxygen levels (SpO2 > 95%)", "Rest and hydrate", "Contact tracing required", "Consult doctor for antiviral options"],
    gastroenteritis:   ["Oral rehydration solution (ORS) is critical", "Bland diet (BRAT: banana, rice, applesauce, toast)", "Avoid dairy and fatty foods", "Hand hygiene strictly", "Probiotics may help recovery"],
    pneumonia:         ["Hospital evaluation strongly recommended", "Complete prescribed antibiotic/antiviral course", "Steam inhalation may help", "Avoid cold air", "Vaccination (pneumococcal) after recovery"],
    diabetes_t2:       ["Monitor blood glucose regularly", "Low glycaemic index diet", "Regular 30-min walks", "Reduce sugar and refined carbs", "Doctor to evaluate HbA1c"],
    hypertension:      ["DASH diet (low sodium, high potassium)", "Reduce salt intake to < 5g/day", "Regular aerobic exercise", "Limit alcohol; quit smoking", "Stress reduction (yoga/meditation)"],
    heart_attack:      ["Emergency hospitalization required", "Aspirin 325mg if not allergic — chew one tablet", "Loosen tight clothing immediately", "Keep patient calm and still", "CPR if patient loses consciousness"],
    appendicitis:      ["Emergency surgery may be required", "Nothing by mouth (NPO)", "Rush to the nearest hospital", "Do not apply heat to abdomen", "Note exact location and time of pain onset"],
    migraine:          ["Rest in a dark, quiet room", "Cold or warm compress on forehead", "Triptans prescribed by neurologist", "Identify triggers (stress, foods, lights)", "Maintain regular sleep schedule"],
    uti:               ["Increase fluid intake (cranberry juice helps)", "Complete antibiotic course", "Urinate frequently — don't hold", "Maintain personal hygiene", "Avoid caffeinated drinks"],
    anaemia:           ["Iron-rich diet (spinach, lentils, red meat)", "Vitamin B12-rich foods or supplements", "Iron supplements as prescribed", "Avoid tea/coffee with meals", "Regular CBC blood tests"],
    thyroid_hypo:      ["Regular TSH blood test monitoring", "Levothyroxine as prescribed — don't skip doses", "Iodine-rich diet (seafood, iodized salt)", "Regular exercise", "Avoid soy products in excess"],
    liver_disease:     ["Complete alcohol abstinence", "Low-fat, high-fibre diet", "Adequate rest", "Medications as prescribed — avoid OTC drugs without consult", "Regular liver function tests"],
    anxiety_disorder:  ["Mindfulness and controlled breathing exercises", "Reduce caffeine intake", "Regular physical activity", "Cognitive Behavioural Therapy (CBT)", "Psychiatrist evaluation recommended"],
    kidney_stone:      ["Drink 2.5–3 litres of water daily", "Low oxalate diet (avoid spinach, nuts in excess)", "Reduce salt and animal protein", "Pain medication as prescribed", "Urology follow-up essential"],
    stroke:            ["Emergency medical care immediately", "Note time of symptom onset (critical for treatment window)", "FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call", "Do not give food or water", "Thrombolytic therapy window is 4.5 hours"],
    // ── New conditions ──
    asthma:            ["Use prescribed inhaler immediately", "Avoid known triggers (dust, pollen, smoke)", "Sit upright — do not lie down during attack", "Breathing exercises (pursed-lip breathing)", "Maintain a clean, dust-free environment"],
    tuberculosis:      ["Complete the full DOTS antibiotic course (6+ months)", "Isolate from others especially elderly/children", "High-protein, nutritious diet to rebuild strength", "Regular chest X-ray monitoring", "Wear a mask in public spaces"],
    gerd:              ["Avoid spicy, acidic foods and alcohol", "Eat small, frequent meals", "Do not lie down within 2–3 hrs of eating", "Elevate head of bed by 6–8 inches", "Avoid tight-fitting clothing around waist"],
    ibs:               ["Follow a low-FODMAP diet", "Identify and avoid personal food triggers", "Stress management — yoga and meditation", "Regular, gentle exercise", "Consult gastroenterologist for medication"],
    sinusitis:         ["Steam inhalation 2–3 times daily", "Saline nasal rinse (neti pot)", "Stay hydrated", "Warm compress on face", "Antibiotics only if bacterial — consult doctor"],
    chickenpox:        ["Calamine lotion to relieve itching", "Avoid scratching — risk of scarring", "Isolate from immunocompromised individuals", "Trimmed fingernails to prevent skin damage", "Varicella vaccine for contacts if not immunised"],
    meningitis:        ["Emergency hospitalisation — do NOT delay", "IV antibiotics started immediately", "Isolation and contact tracing", "Monitor for sepsis signs", "Lumbar puncture may be needed for diagnosis"],
    epilepsy:          ["Take anticonvulsant medications as prescribed", "Avoid sleep deprivation and high stress", "Do not operate heavy machinery or swim alone", "Wear a medical alert bracelet", "Keep a seizure diary for neurologist"],
    rheumatoid_arthritis: ["Disease-modifying antirheumatic drugs (DMARDs)", "Physiotherapy and joint mobility exercises", "Anti-inflammatory diet (turmeric, omega-3)", "Rest joints during flare-ups", "Regular rheumatology follow-ups"],
    food_poisoning:    ["ORS frequently to prevent dehydration", "Avoid solid food for first 6–8 hours", "BRAT diet when reintroducing food", "Strict hand hygiene", "Seek medical attention if blood in stool or fever > 38.5°C"],
    psoriasis:         ["Moisturise skin regularly with emollients", "Avoid triggers: stress, alcohol, infections", "Topical corticosteroids as prescribed", "UV phototherapy may be recommended", "Dermatologist review for systemic treatment"],
    depression:        ["Cognitive Behavioural Therapy (CBT) is highly effective", "Regular physical activity — even 30-min walks help", "Maintain a routine and social connections", "Antidepressants only as prescribed", "Emergency: call a helpline if thoughts of self-harm"],
    hyperthyroidism:   ["Antithyroid medications as prescribed", "Avoid iodine-rich foods (seaweed, iodised salt)", "Radioiodine therapy if recommended", "Reduce caffeine and stimulants", "Regular thyroid function tests"]
  }
};

// ─── CONVERSATIONAL AI ENGINE ────────────────────────────────────
class HealthAI {
  constructor() {
    this.detectedSymptoms = new Set();
    this.userProfile     = {};
    this.conversation    = [];
    this.questionQueue   = [];
    this.askedQuestions  = new Set();
    this.phase           = "greeting"; // greeting → symptom_input → profiling → analysis → result
    this.results         = null;
  }

  // Map raw text to symptom groups
  parseSymptoms(text) {
    const lower = text.toLowerCase();
    const found  = new Set();
    for (const [group, keywords] of Object.entries(KNOWLEDGE_BASE.symptomGroups)) {
      if (keywords.some(k => lower.includes(k))) found.add(group);
    }
    return found;
  }

  // Score each disease against detected symptoms
  scoreDisease(disease) {
    let score = 0;
    const maxScore = Object.values(disease.weight).reduce((a, b) => a + b, 0);

    // Check required symptoms
    const reqMet = disease.required.every(r => this.detectedSymptoms.has(r));
    if (!reqMet) return { score: 0, probability: 0, match: false };

    // Compute weighted score
    for (const sym of this.detectedSymptoms) {
      if (disease.weight[sym]) score += disease.weight[sym];
    }

    const probability = Math.min((score / maxScore) * 100, 100);
    return { score, probability, match: probability >= 8 }; // FIX: was 20, lowered to catch partial matches
  }

  // Compute risk score 0–100
  computeRiskScore(disease) {
    let risk = disease.baseRisk;

    // Age modifiers
    const age = this.userProfile.age || "";
    if (age.includes("60+") || age.includes("Senior")) {
      risk += (disease.riskModifiers.age_elderly || 0);
    }
    if (age.includes("Under 12") || age.includes("Child")) {
      risk += (disease.riskModifiers.age_child || 0);
    }

    // Duration modifiers
    const dur = this.userProfile.duration || "";
    if (dur.includes("week") || dur.includes("month")) {
      risk += (disease.riskModifiers.duration_long || 0);
    }

    // Comorbidities
    const comorbid = this.userProfile.comorbidities || [];
    if (comorbid.some(c => c !== "None")) risk += 10;

    // Symptom-based modifiers
    for (const [sym, mod] of Object.entries(disease.riskModifiers)) {
      if (sym.startsWith("age_") || sym === "duration_long") continue;
      if (this.detectedSymptoms.has(sym)) risk += mod;
    }

    // Severity modifier
    const sev = this.userProfile.severity || "";
    if (sev.includes("9–10")) risk += 15;
    else if (sev.includes("7–8")) risk += 8;

    return Math.min(Math.round(risk), 100);
  }

  // Run full analysis
  analyze() {
    const ranked = [];
    for (const disease of KNOWLEDGE_BASE.diseases) {
      const { probability, match } = this.scoreDisease(disease);
      if (match) {
        const riskScore = this.computeRiskScore(disease);
        ranked.push({ disease, probability: Math.round(probability), riskScore });
      }
    }
    // Sort by risk score × probability
    ranked.sort((a, b) => (b.riskScore * b.probability) - (a.riskScore * a.probability));

    // Cap at top 4
    const top = ranked.slice(0, 4);
    const primaryUrgency = top.length > 0 ? top[0].disease.urgency : "low";
    const maxRisk        = top.length > 0 ? top[0].riskScore : 10;

    this.results = {
      predictions: top,
      symptoms:    [...this.detectedSymptoms],
      profile:     this.userProfile,
      urgency:     primaryUrgency,
      riskScore:   maxRisk,
      actions:     KNOWLEDGE_BASE.immediateActions[primaryUrgency],
      lifestyle:   top.length > 0 ? (KNOWLEDGE_BASE.lifestyleRec[top[0].disease.id] || []) : []
    };
    return this.results;
  }

  // Get next question to ask
  getNextQuestion() {
    const questions = KNOWLEDGE_BASE.followUpQuestions;
    for (const q of questions) {
      if (this.askedQuestions.has(q.id)) continue;
      if (q.relevantTo && !q.relevantTo.some(s => this.detectedSymptoms.has(s))) continue;
      this.askedQuestions.add(q.id);
      return q;
    }
    // Generic questions
    for (const q of questions) {
      if (!this.askedQuestions.has(q.id) && !q.relevantTo) {
        this.askedQuestions.add(q.id);
        return q;
      }
    }
    return null;
  }

  // Handle user input  
  processInput(input) {
    const newSymptoms = this.parseSymptoms(input);
    newSymptoms.forEach(s => this.detectedSymptoms.add(s));
    return newSymptoms;
  }
}

// Export for use
window.KNOWLEDGE_BASE = KNOWLEDGE_BASE;
window.HealthAI = HealthAI;
