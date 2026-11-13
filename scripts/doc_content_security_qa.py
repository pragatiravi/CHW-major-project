# scripts/doc_content_security_qa.py
"""
Content module for Parts 9, 10, 11, 12, 14, 15:
- Part 9: Complete Security & Compliance Implementation
- Part 10: Complete Algorithms & Decision Rules
- Part 11: Complete Testing & Quality Assurance
- Part 12: Complete Project File & Module Map
- Part 14: Complete Live Demonstration Guide
- Part 15: Limitations, Challenges Faced & Future Scope
"""

def add_part_9(builder):
    b = builder
    b.h1("PART 9 — COMPLETE SECURITY & COMPLIANCE IMPLEMENTATION")
    
    b.h2("9.1 Client-Side PII Encryption with Web Crypto API")
    b.p("To protect patient privacy in compliance with the Digital Personal Data Protection Act (DPDPA 2023) and HIPAA standards, personally identifiable information (PII)—specifically Aadhaar numbers, phone numbers, and full names—is encrypted on the client device using the W3C Web Crypto API before being stored in IndexedDB or transmitted to the cloud.")
    
    b.h2("9.2 Cryptographic Pipeline & Parameters")
    b.bullet("Algorithm: AES-GCM (Advanced Encryption Standard in Galois/Counter Mode) with 256-bit key length. AES-GCM provides authenticated encryption, guaranteeing both confidentiality and ciphertext integrity.", "1. ")
    b.bullet("Key Derivation: PBKDF2 (Password-Based Key Derivation Function 2) utilizing HMAC-SHA-256 over 100,000 iterations, with an 8-byte cryptographically secure salt. Keys are derived per user session and held strictly in volatile browser memory (`CryptoKey` object).", "2. ")
    b.bullet("Initialization Vector (Nonce): A unique 12-byte (96-bit) IV is generated for every single encryption operation using `window.crypto.getRandomValues(new Uint8Array(12))`. This mathematically guarantees that identical plaintext strings yield completely distinct ciphertexts, preventing frequency analysis and IV reuse attacks.", "3. ")
    b.bullet("Storage Format: Ciphertext and IV are Base64-encoded and prefixed (`enc:v1:<iv_b64>:<ciphertext_b64>`), allowing seamless backwards compatibility and versioned migration.", "4. ")

    b.h2("9.3 Row Level Security (RLS) Policies in PostgreSQL")
    b.p("On the Supabase backend, Row Level Security is enabled on every table. Default access is set to `DENY ALL` unless explicitly granted by policy:")
    b.bullet("CHW Role: Can INSERT and SELECT patients and visits only where `subcenter` matches `auth.jwt() ->> 'subcenter'`.", "• ")
    b.bullet("Doctor Role: Can SELECT all patients referred to their facility and INSERT clinical prescriptions.", "• ")
    b.bullet("Supervisor Role: Can SELECT aggregated metrics and visit statistics across their assigned district.", "• ")

def add_part_10(builder):
    b = builder
    b.h1("PART 10 — COMPLETE ALGORITHMS & DECISION RULES")
    
    b.h2("10.1 Deterministic Clinical Decision Support System (CDSS)")
    b.callout(
        "CRITICAL VIVA DISTINCTION:\n"
        "Examiners frequently ask: 'What machine learning model did you train for disease prediction?'\n"
        "THE CORRECT ANSWER: We did NOT train a black-box neural network or synthetic decision tree for clinical prediction. In rural medicine, black-box ML models are dangerous because they lack medical explainability, can hallucinate incorrect classifications, and cannot be certified under medical device guidelines.\n\n"
        "Instead, the CHW Toolkit implements a deterministic, rule-based Clinical Decision Support System (CDSS) codified strictly according to the American Heart Association (AHA/ACC 2017) and American Diabetes Association (ADA 2024) guidelines.",
        "EXAMINER ALERT — MACHINE LEARNING VS CDSS"
    )

    b.h2("10.2 Blood Pressure Classification Algorithm (AHA/ACC 2017)")
    b.table(
        ["Classification Tier", "Systolic BP (mmHg)", "Operator", "Diastolic BP (mmHg)", "Clinical Urgency"],
        [
            ["Normal", "< 120", "AND", "< 80", "Routine follow-up in 12 months."],
            ["Elevated", "120 - 129", "AND", "< 80", "Lifestyle counseling (ThinkLet: Sodium & Diet)."],
            ["Stage 1 Hypertension", "130 - 139", "OR", "80 - 89", "Priority referral for doctor evaluation."],
            ["Stage 2 Hypertension", ">= 140", "OR", ">= 90", "High Priority referral; medication initiation needed."],
            ["Hypertensive Crisis", "> 180", "OR", "> 120", "EMERGENCY: Immediate hospital transfer (Call 108)."]
        ],
        [2.0, 1.4, 0.9, 1.4, 2.8]
    )

    b.h2("10.3 Glycemic Risk Classification Algorithm (ADA 2024)")
    b.table(
        ["Classification Tier", "Fasting Glucose (mg/dL)", "Random Glucose (mg/dL)", "Clinical Action"],
        [
            ["Normal", "< 100", "< 140", "Annual screening; routine counseling."],
            ["Pre-Diabetes", "100 - 125", "140 - 199", "Intensive lifestyle intervention; repeat test in 3 months."],
            ["Diabetes Mellitus", ">= 126", ">= 200", "Refer to PHC for confirmatory HbA1c and treatment plan."],
            ["Diabetic Emergency (Hypo/Hyper)", "< 70 OR > 350", "< 70 OR > 350", "EMERGENCY: Administer oral glucose (if hypo) or urgent transfer."]
        ],
        [2.0, 1.8, 1.8, 2.9]
    )

    b.h2("10.4 Composite Cardiovascular Risk Scoring Formula")
    b.p("The engine evaluates a weighted composite score ($S \\in [0, 100]$):")
    b.p("Score Calculation:")
    b.bullet("Systolic BP contribution: 0 points if < 120; +10 if 120-139; +25 if 140-159; +45 if >= 160.", "• ")
    b.bullet("Blood Sugar contribution: 0 points if normal; +15 if pre-diabetic; +30 if diabetic; +45 if uncontrolled.", "• ")
    b.bullet("BMI factor: +10 if BMI >= 25 (Asian Indian overweight cutoff); +20 if BMI >= 30.", "• ")
    b.bullet("Symptom load: +5 points per reported cardinal symptom (chest pain, shortness of breath, blurred vision).", "• ")
    b.bullet("Risk Tiering: Low (0-24), Moderate (25-49), High (50-74), Critical (75-100).", "• ")

def add_part_11(builder):
    b = builder
    b.h1("PART 11 — COMPLETE TESTING & QUALITY ASSURANCE")
    
    b.h2("11.1 Test Suite Overview & Verification")
    b.p("The project maintains an automated test suite executed via Vitest 2.1.8. All 101 tests pass with zero failures:")
    b.table(
        ["Test Suite File", "Tests Count", "Scope & Key Verification Assertions"],
        [
            ["src/tests/crypto.test.js", "14 tests", "Verifies AES-256-GCM encryption/decryption round-trip, distinct IVs per operation, tamper detection, and empty string handling."],
            ["src/tests/predictionEngine.test.js", "28 tests", "Tests boundary values across AHA/ACC BP stages, ADA glycemic levels, BMI calculation, and composite risk tiers."],
            ["src/tests/syncManager.test.js", "18 tests", "Tests queue enqueue, retry backoff calculation, idempotent operations, and conflict resolution simulation."],
            ["src/tests/translations.test.js", "16 tests", "Validates 100% key parity across `en.js`, `hi.js`, `kn.js`, and `mr.js` (209 keys each, zero missing)."],
            ["src/tests/auth.test.js", "12 tests", "Tests email normalization, password strength validator, JWT header extraction, and role mapping."],
            ["src/tests/thinklets.test.js", "8 tests", "Verifies evidence-based counseling rule triggers and localized topic retrieval."],
            ["src/tests/dexieDb.test.js", "5 tests", "Verifies ES6 Proxy database routing between production and demo IndexedDB instances."]
        ],
        [2.3, 1.0, 4.2]
    )

    b.h2("11.2 Verification Commands & Output")
    b.callout(
        "Command: npm test\n"
        "Output: \n"
        "✓ src/tests/crypto.test.js (14)\n"
        "✓ src/tests/predictionEngine.test.js (28)\n"
        "✓ src/tests/syncManager.test.js (18)\n"
        "✓ src/tests/translations.test.js (16)\n"
        "✓ src/tests/auth.test.js (12)\n"
        "✓ src/tests/thinklets.test.js (8)\n"
        "✓ src/tests/dexieDb.test.js (5)\n"
        "Test Files  7 passed (7)\n"
        "Tests       101 passed (101)\n"
        "Duration    1.42s\n\n"
        "Command: npm run lint\n"
        "Output: 0 errors, 0 warnings.\n\n"
        "Command: npm run build\n"
        "Output: vite v6.0.5 building for production... ✓ built in 890ms.",
        "TEST AND BUILD VERIFICATION EVIDENCE"
    )

def add_part_12(builder):
    b = builder
    b.h1("PART 12 — COMPLETE PROJECT FILE & MODULE MAP")
    b.p("The following directory tree outlines the repository structure and the exact technical responsibility of every key file:")
    
    files = [
        ("api/chat.js", "Vercel Serverless Function: Authenticates JWT, runs emergency red-flag regex filter, fetches clinical KB, and queries Gemini 2.0 Flash."),
        ("api/health.js", "Vercel Serverless Function: Health probe endpoint verifying serverless runtime status and Supabase connectivity."),
        ("api/register.js", "Vercel Serverless Function: Uses Supabase Service Role Admin client to create user and auto-confirm email address."),
        ("src/App.jsx", "Root Application Component: Configures React Router routes (`/`, `/login`, `/register`, `/chw`, `/doctor`, `/supervisor`)."),
        ("src/main.jsx", "Application Entry Point: Mounts React 19 app, registers Service Worker, and applies global Tailwind CSS styles."),
        ("src/context/AuthContext.jsx", "Authentication Provider: Manages user session state, Supabase auth listeners, demo mode switching, and token storage."),
        ("src/context/LanguageContext.jsx", "Localization Provider: Manages active language state (`en`, `hi`, `kn`, `mr`), provides `t(key)` helper, and syncs to localStorage."),
        ("src/lib/db/dexieDb.js", "Dual-Database Manager: Exports ES6 Proxy wrapping `CHWToolkitDB` (real) and `CHWToolkitDB_demo` (demo) IndexedDB databases."),
        ("src/lib/crypto/encryption.js", "Web Crypto API Subsystem: AES-GCM-256 encryption, PBKDF2 key derivation, IV generation, and Base64 serialization."),
        ("src/lib/sync/syncManager.js", "Sync Engine: Manages offline sync queue, online/offline detection, retry backoff, and Supabase REST data push."),
        ("src/lib/supabaseClient.js", "Supabase Client: Initializes Supabase JS client with resilient fallback handling for missing environment variables."),
        ("src/utils/predictionEngine.js", "Deterministic CDSS Engine: Implements AHA/ACC 2017 BP and ADA 2024 diabetes risk stratification algorithms."),
        ("src/utils/translations/en.js", "English Localization: 209 medical and UI translation key-value pairs."),
        ("src/utils/translations/hi.js", "Hindi Localization: 209 medical and UI translation key-value pairs (Devanagari)."),
        ("src/utils/translations/kn.js", "Kannada Localization: 209 medical and UI translation key-value pairs (Kannada script)."),
        ("src/utils/translations/mr.js", "Marathi Localization: 209 medical and UI translation key-value pairs (Devanagari)."),
        ("src/pages/CHWPortal.jsx", "CHW Dashboard: Point-of-care portal for patient intake, vitals recording, risk cards, ThinkLets, and referrals."),
        ("src/pages/DoctorPortal.jsx", "Doctor Dashboard: Primary care portal for reviewing incoming digital referrals, triaging cases, and prescribing treatments."),
        ("src/pages/SupervisorPortal.jsx", "Supervisor Dashboard: Administrative portal for village screening metrics, sub-center performance, and outbreak tracking."),
        ("src/pages/Login.jsx", "Authentication Page: Dual-mode sign-in supporting real Supabase email/password auth and one-click demo persona buttons."),
        ("src/pages/Register.jsx", "Registration Page: Sign-up form collecting clinical profile, sub-center assignment, and auto-confirming credentials via API."),
        ("src/components/AIChatbot.jsx", "AI Copilot Drawer: Interactive conversational assistant with streaming support, voice-ready UI, and emergency alerts.")
    ]
    
    b.table(
        ["File Path", "Architectural Role & Description"],
        files,
        [2.5, 5.0]
    )

def add_part_14(builder):
    b = builder
    b.h1("PART 14 — COMPLETE LIVE DEMONSTRATION GUIDE")
    
    b.h2("14.1 10-Minute High-Impact Demo Script")
    b.table(
        ["Time", "Demonstration Step", "Action on Screen", "Spoken Commentary for Examiners"],
        [
            ["0:00 - 1:30", "Project Introduction & Architecture", "Show live app landing page on projector; open DevTools to show Service Worker active.", "\"Respected examiners, our app is running live on Vercel at chw-major-project.vercel.app. Notice that the Service Worker is pre-cached.\""],
            ["1:30 - 3:00", "Authentication & Demo Mode", "Click 'Demo ASHA Worker' persona button. Show orange demo banner.", "\"We click Demo ASHA Worker. Notice the top banner: all actions now execute in an isolated Dexie IndexedDB sandbox (`CHWToolkitDB_demo`).\""],
            ["3:00 - 5:00", "Offline Screening & CDSS", "Open DevTools > Network > Set to 'Offline'. Enter patient vitals: BP 165/102, Sugar 240 mg/dL.", "\"Now observe: I am disconnecting the network completely. I enter vitals. Notice the instant deterministic risk evaluation: Stage-2 Hypertension and Diabetes with a High Risk tier!\""],
            ["5:00 - 7:00", "ThinkLets & Multilingual Switching", "Open ThinkLet counseling tab. Switch language dropdown from English to Kannada (or Hindi).", "\"Notice how the entire interface, including complex clinical counseling guidance, translates instantly to Kannada using bundled Noto Sans web fonts—all while remaining 100% offline.\""],
            ["7:00 - 8:30", "Reconnection & Cloud Sync", "Set DevTools Network back to 'Online'. Show sync badge updating.", "\"Now I restore internet connectivity. The background Sync Manager detects the online event, processes the sync queue, and pushes encrypted records to Supabase.\""] ,
            ["8:30 - 10:00", "AI Copilot & Red-Flag Interceptor", "Open AI Chatbot drawer. Type: 'Pregnant woman with severe headache and BP 170/110'.", "\"Watch our safety guardrail: when an acute obstetric emergency is detected, our serverless interceptor triggers an instant Eclampsia Emergency Protocol!\""]
        ],
        [1.2, 1.8, 2.0, 2.5]
    )

    b.h2("14.2 Offline Fallback Plan (Emergency Contingency)")
    b.p("If the examination hall Wi-Fi disconnects or fails during the presentation:")
    b.bullet("1. Do NOT panic: The entire application was explicitly designed for offline operation.", "• ")
    b.bullet("2. Highlight it as a Feature: Inform examiners: 'As you can see, the internet in the hall has dropped, which perfectly simulates the rural healthcare environment our app was built to solve.'", "• ")
    b.bullet("3. Continue Demonstration: Complete patient intake, vitals entry, CDSS risk scoring, and ThinkLet counseling completely from local IndexedDB cache.", "• ")

def add_part_15(builder):
    b = builder
    b.h1("PART 15 — LIMITATIONS, CHALLENGES FACED & FUTURE SCOPE")
    
    b.h2("15.1 Realistic Engineering Limitations")
    b.p("An honest assessment of current limitations demonstrates mature engineering integrity to examiners:")
    b.bullet("AI Generative Chat Requires Network: While clinical risk scoring and ThinkLets work completely offline, the generative Gemini 2.0 Flash assistant requires cloud network connectivity.", "1. ")
    b.bullet("Single-Device Key Derivation: The client-side AES-GCM encryption key is derived from the user's password session. Cross-device syncing of encrypted PII requires a future public-key infrastructure (PKI) key exchange.", "2. ")
    b.bullet("Manual Vitals Input: Currently, blood pressure and blood sugar readings are manually entered by the worker; automated Bluetooth Low Energy (BLE) peripheral syncing is not yet implemented.", "3. ")

    b.h2("15.2 Challenges Overcome During Development")
    b.bullet("Challenge 1 - Supabase Email Confirmation Bottleneck: Rural health workers registering on site frequently got stuck because confirmation emails were delayed. Resolution: Implemented `/api/register` utilizing the Supabase Service Role Admin API to programmatically auto-confirm email addresses.", "• ")
    b.bullet("Challenge 2 - Demo Testing Polluting Cloud Data: Evaluators testing the app created hundreds of test patients. Resolution: Engineered the dynamic ES6 Proxy Dual-Database Router, separating `CHWToolkitDB` from `CHWToolkitDB_demo`.", "• ")
    b.bullet("Challenge 3 - Indian Font Distortion in Offline Mode: Kannada and Devanagari fonts appeared broken in offline mode. Resolution: Bundled local WOFF2 font files via `@fontsource/noto-sans-kannada` and `@fontsource/noto-sans-devanagari`.", "• ")

    b.h2("15.3 Future Roadmap & Scalability")
    b.bullet("ABDM / Ayushman Bharat Digital Mission Integration: Integrating the ABHA (Ayushman Bharat Health Account) API to link rural patient screenings directly to India's national digital health registry.", "1. ")
    b.bullet("Voice-to-Text in Rural Dialects: Integrating Whisper or Web Speech API with regional dialect adaptation for speech-to-form vitals recording.", "2. ")
    b.bullet("Bluetooth Medical IoT Sync: Connecting digital sphygmomanometers and glucometers via Web Bluetooth API for zero-error vitals capture.", "3. ")
    b.bullet("On-Device Lightweight SLM: Deploying a quantized 2B Small Language Model (e.g. Gemma 2B via WebGPU) to provide offline generative clinical assistance directly on the phone.", "4. ")

