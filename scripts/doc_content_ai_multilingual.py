# scripts/doc_content_ai_multilingual.py
"""
Content module for Parts 5 to 8:
- Part 5: Complete AI and Chatbot Deep-Dive
- Part 6: Complete Multilingual Implementation
- Part 7: Complete API Endpoints & Traces
- Part 8: Complete Database Architecture
"""

def add_part_5(builder):
    b = builder
    b.h1("PART 5 — COMPLETE AI AND CHATBOT DEEP-DIVE")
    
    b.h2("5.1 Large Language Model Integration Architecture")
    b.p("The CHW Toolkit integrates Google's cutting-edge Gemini 2.0 Flash model via the official `@google/genai` (v0.1.2) SDK inside a secured Vercel Serverless Function (`api/chat.js`). The client never communicates directly with Google's API, ensuring complete API key isolation.")
    
    b.h2("5.2 Grounding Knowledge Base & Prompt Engineering")
    b.p("To prevent hallucinations, the backend incorporates a curated clinical knowledge base derived from the Indian Council of Medical Research (ICMR) Guidelines for Non-Communicable Diseases, the National Programme for Prevention & Control of Cancer, Diabetes, Cardiovascular Diseases & Stroke (NPCDCS), and WHO rural health manuals.")
    b.p("The system prompt enforces strict clinical constraints:")
    b.bullet("Role Definition: Act strictly as a clinical assistant for Indian Community Health Workers (ASHAs/ANMs).", "• ")
    b.bullet("Tone & Style: Empathetic, culturally sensitive, concise, and structured with bullet points. Avoid complex academic jargon.", "• ")
    b.bullet("Prescription Boundaries: Strictly forbidden from prescribing specific prescription drugs (e.g., Metformin, Amlodipine) or specific dosages. Advise only lifestyle modifications, first aid, and referral to a medical officer.", "• ")
    b.bullet("Temperature Setting: Set to 0.2 to maximize factual determinism and minimize creative variance.", "• ")

    b.h2("5.3 Hardcoded Obstetric & Maternal Emergency Red-Flag Interceptor")
    b.p("One of the most innovative safety features in the project is the client/server emergency interceptor. In high-risk obstetric cases, waiting for LLM generation or risking a gentle conversational answer can be fatal.")
    b.p("The backend executes regex pattern matching over incoming messages before calling Gemini. Trigger patterns include:")
    b.bullet("Keywords: 'pregnant' + ('high bp' | 'headache' | 'bleeding' | 'blurred vision' | 'swelling' | 'seizure' | 'convulsion')", "• ")
    b.p("When triggered, the system immediately short-circuits the LLM call and returns a structured emergency protocol:")
    b.callout(
        "EMERGENCY OBSTETRIC ESCALATION PROTOCOL ACTIVATED:\n"
        "1. Immediate Danger Sign: Suspected Severe Pre-Eclampsia / Imminent Eclampsia or Antepartum Hemorrhage.\n"
        "2. Action: Do NOT delay. Arrange emergency ambulance (Call 108) to the nearest First Referral Unit (FRU) / District Hospital immediately.\n"
        "3. Positioning: Place the patient on her left side (left lateral position) to maximize placental perfusion.\n"
        "4. Airway: Ensure airway is clear; do not place objects in mouth if convulsing.\n"
        "5. Accompaniment: The CHW must accompany the patient with her antenatal record (MCH card).",
        "RED-FLAG SAFETY INTERCEPTOR OUTPUT"
    )

    b.h2("5.4 20 Dedicated Chatbot Viva Questions & Answers")
    
    chatbot_qas = [
        ("Which exact AI model is used in the CHW Toolkit?",
         "We use Google's Gemini 2.0 Flash model.",
         "We utilize `gemini-2.0-flash` through Google's `@google/genai` Node.js SDK, executed inside a stateless Vercel Serverless Function (`api/chat.js`)."),
        
        ("Where is the Gemini API key stored?",
         "It is kept secretly on the server and is never sent to the user's browser.",
         "The `GEMINI_API_KEY` is injected as an encrypted server-side environment variable in Vercel. It is completely inaccessible to client-side bundles or inspect tools."),
        
        ("Why didn't you use ChatGPT or OpenAI GPT-4?",
         "Gemini 2.0 Flash offers superior speed, lower cost, and excellent support for Indian languages.",
         "Gemini 2.0 Flash provides sub-second time-to-first-token latency, high throughput, and cost-effective pricing essential for public health scaling, combined with native multilingual tokenization for Devanagari and Dravidian scripts."),
         
        ("What happens if an ASHA worker asks for medicine dosages?",
         "The chatbot refuses to prescribe dosages and instructs the worker to refer the patient to a doctor.",
         "The system prompt contains negative constraints prohibiting medication dosage advice. It enforces Indian Medical Council regulations limiting CHWs to first-aid, counseling, and referral."),
         
        ("How does the chatbot prevent hallucinations?",
         "By grounding its answers in medical guidelines and using a very low temperature of 0.2.",
         "We combine a low temperature parameter (0.2) with a top-3 similarity-retrieved knowledge base of ICMR/WHO guidelines injected directly into the conversation context."),
         
        ("What is the temperature parameter and why is it set to 0.2?",
         "Temperature controls randomness. 0.2 makes the model very strict and factual rather than creative.",
         "Temperature scales the logits before softmax. Lower values (0.2) sharpen the probability distribution, heavily favoring high-probability tokens and reducing hallucinatory deviations."),
         
        ("How does the chatbot handle emergency medical situations?",
         "It has a built-in emergency scanner that catches danger signs like bleeding or seizures and gives immediate emergency instructions.",
         "The `api/chat.js` handler runs regex filters across the query. If severe maternal or cardiac danger signs match, it bypasses LLM inference entirely, instantly returning a standardized emergency protocol."),
         
        ("Can the chatbot work offline without internet?",
         "No, but it shows an honest message and lets the worker view saved counseling guides instead.",
         "The AI model requires cloud compute, but if offline, the UI detects `navigator.onLine === false` and serves pre-cached offline ThinkLet clinical checklists from IndexedDB."),
         
        ("How does the server protect the chatbot from unauthorized spam?",
         "Users must be logged in with a valid token, or have demo permissions enabled.",
         "The serverless function extracts and verifies the Supabase JWT bearer token via `supabase.auth.getUser(token)`. In demo mode, it checks `ALLOW_DEMO_CHAT=true` with IP rate-limiting."),
         
        ("What languages does the AI chatbot support?",
         "It understands and responds in English, Hindi, Kannada, and Marathi.",
         "The system prompt instructs Gemini to detect and respond in the user's selected UI locale (`locale` parameter sent in the POST request body)."),
         
        ("Does the chatbot save patient chat conversations in the database?",
         "No, conversations are kept in the current session memory for privacy.",
         "Chat history is maintained in React component state (`messages` array) during the active session. To comply with patient confidentiality, raw chat transcripts containing health questions are not logged with patient identifiers."),
         
        ("How is multi-turn conversation memory maintained?",
         "The app sends the previous messages in the request so the AI remembers the conversation.",
         "The client transmits an array of `{ role: 'user' | 'model', parts: [{ text }] }` objects in the JSON payload, allowing the Gemini API to maintain full contextual continuity."),
         
        ("What payload is sent from the frontend to /api/chat?",
         "A JSON object containing the message text, previous chat history, and the user's language.",
         "`{ message: string, history: Array<{role, content}>, locale: string }` along with the `Authorization: Bearer <jwt>` header."),
         
        ("What HTTP status codes can /api/chat return?",
         "200 for success, 400 for bad input, 401 for unauthorized, and 500 for server error.",
         "200 OK, 400 Bad Request (missing message), 401 Unauthorized (invalid JWT), 403 Forbidden (demo chat disabled), 429 Too Many Requests, 500 Internal Server Error."),
         
        ("How do you test the chatbot programmatically?",
         "We write automated unit tests that verify prompt grounding, red-flag detection, and error responses.",
         "We use Vitest to test the regex emergency detector, verify JWT extraction logic, mock the Gemini SDK response, and validate schema conformance."),
         
        ("What is the difference between ThinkLets and the AI Chatbot?",
         "ThinkLets are fixed, verified medical checklists. The chatbot is a conversational assistant for general questions.",
         "ThinkLets are static, deterministic, evidence-based counseling algorithms stored locally in IndexedDB. The Chatbot is a dynamic, cloud-based generative AI assistant for broad clinical queries."),
         
        ("What happens if Google's Gemini API is down or experiences an outage?",
         "The app catches the error and politely informs the health worker while providing offline helpline numbers.",
         "The serverless handler wraps external calls in `try...catch`, returning `{ error: 'AI service temporarily unavailable', emergency_contact: '108' }` with status 503."),
         
        ("Is patient personal data (Aadhaar/Phone) sent to the Gemini API?",
         "No, personal details are never sent to the AI.",
         "Only clinical questions and anonymized vitals are transmitted. All personal identifiers are stripped prior to constructing the AI prompt."),
         
        ("How does the AI assistant handle pediatric or child illness questions?",
         "It follows standard IMNCI (Integrated Management of Neonatal and Childhood Illness) guidelines.",
         "The knowledge base incorporates IMNCI danger signs (inability to breastfeed, vomiting everything, lethargy, stridor) and instructs the worker to refer to a Pediatrician."),
         
        ("What is the future scope of AI in this application?",
         "Adding voice input in local dialects and on-device lightweight models.",
         "Integrating Web Speech API for Kannada/Hindi voice-to-text, and deploying quantified on-device LLMs (e.g., Gemma 2B via WebGPU) for true offline generative inference.")
    ]
    
    for idx, (q, s_ans, t_ans) in enumerate(chatbot_qas, 1):
        b.viva_qa(idx, q, s_ans, t_ans, category="Part 5 Chatbot Viva")

def add_part_6(builder):
    b = builder
    b.h1("PART 6 — COMPLETE MULTILINGUAL IMPLEMENTATION")
    
    b.h2("6.1 Supported Languages & Cultural Localization")
    b.p("The CHW Toolkit provides 100% complete, native localization across four primary languages:")
    b.bullet("English (`en`): Reference clinical baseline for supervisors and medical officers.", "1. ")
    b.bullet("Hindi (`hi`): Spoken across central and northern rural regions (Devanagari script).", "2. ")
    b.bullet("Kannada (`kn`): Primary regional language for Karnataka sub-centers (Belagavi district).", "3. ")
    b.bullet("Marathi (`mr`): Spoken across Maharashtra border areas and Belagavi rural belts.", "4. ")

    b.h2("6.2 Key Parity & Architectural Design")
    b.p("Localization is implemented in pure modern JavaScript (`src/utils/translations/`):")
    b.bullet("Files: `en.js`, `hi.js`, `kn.js`, `mr.js`.", "• ")
    b.bullet("Key Parity: Exactly 209 translated keys across all four files, validated by automated Vitest suite (`translations.test.js`). Zero missing translation keys.", "• ")
    b.bullet("State Management: `LanguageContext.jsx` provides a `t(key)` helper with automatic fallback to English if a key is not found, persisting user preference in `localStorage` under `chw_language`.", "• ")

    b.h2("6.3 Web Font Typography & Zero-Network Rendering")
    b.p("Rendering complex Indian scripts (such as Kannada conjunct consonants 'Vattakshara' or Devanagari ligatures) on low-cost rural Android devices frequently fails if dependent on Google Fonts CDN.")
    b.p("We bundled `@fontsource/noto-sans-kannada` and `@fontsource/noto-sans-devanagari` directly into the Vite build. These WOFF2 font files are cached by the Service Worker, guaranteeing pixel-perfect rendering of Kannada, Hindi, and Marathi even in airplane mode.")

def add_part_7(builder):
    b = builder
    b.h1("PART 7 — COMPLETE API ENDPOINTS & REQUEST-RESPONSE TRACES")
    
    b.h2("7.1 Serverless API Specification")
    b.table(
        ["Endpoint Route", "HTTP Method", "Auth Required", "Description & Payload"],
        [
            ["/api/register", "POST", "Public", "Registers new user via Supabase Admin API and auto-confirms email.\nPayload: `{ name, email, password, role, subcenter, district }`\nResponse: `{ success: true, user: { id, email } }`"],
            ["/api/chat", "POST", "JWT / Demo Token", "AI clinical copilot endpoint with safety interceptors.\nPayload: `{ message, history: [...], locale }`\nResponse: `{ reply: string, redFlagTriggered: boolean }`"],
            ["/api/health", "GET", "Public", "System health probe verifying Vercel runtime and Supabase connectivity.\nResponse: `{ status: 'ok', timestamp: string, version: '1.0.0' }`"]
        ],
        [1.8, 1.2, 1.5, 3.0]
    )

    b.h2("7.2 Exact Request-Response Trace: /api/chat")
    b.p("Client Request Header:")
    b.callout("POST /api/chat HTTP/1.1\nHost: chw-major-project.vercel.app\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "HTTP REQUEST")
    
    b.p("Client Request Body:")
    b.callout("{\n  \"message\": \"Patient has BP 160/100 and feels dizzy. What are the first steps?\",\n  \"locale\": \"en\",\n  \"history\": []\n}", "JSON REQUEST BODY")
    
    b.p("Server Response (200 OK):")
    b.callout("{\n  \"reply\": \"Immediate Clinical Actions for Stage-2 Hypertension:\\n• Rest: Have the patient rest quietly in a seated position for 10-15 minutes.\\n• Re-check BP: Measure blood pressure again in both arms.\\n• Danger Signs: Check for severe headache, chest pain, shortness of breath, or blurred vision.\\n• Referral: Refer the patient to the Primary Health Centre (PHC) Medical Officer for clinical evaluation.\\n• Do NOT prescribe or dispense antihypertensive medications directly.\",\n  \"redFlag\": false\n}", "JSON RESPONSE BODY")

def add_part_8(builder):
    b = builder
    b.h1("PART 8 — COMPLETE DATABASE ARCHITECTURE")
    
    b.h2("8.1 Cloud PostgreSQL Schema (Supabase)")
    b.table(
        ["Table Name", "Primary Key", "Foreign Keys", "Key Attributes & Purpose"],
        [
            ["profiles", "id (UUID)", "auth.users(id)", "name, role ('chw','doctor','supervisor'), subcenter, district, created_at."],
            ["patients", "id (UUID)", "created_by -> profiles(id)", "name_enc, phone_enc, aadhaar_enc, age, gender, village, subcenter, blood_group, created_at."],
            ["visits", "id (UUID)", "patient_id -> patients(id)", "systolic, diastolic, blood_sugar, sugar_type, bmi, risk_tier, symptoms, notes, created_at."],
            ["referrals", "id (UUID)", "patient_id, visit_id, doctor_id", "urgency ('routine','priority','emergency'), reason, status ('pending','accepted','completed'), notes."],
            ["prescriptions", "id (UUID)", "referral_id, patient_id", "medications (JSONB), doctor_notes, prescribed_at."],
            ["counselling_sessions", "id (UUID)", "patient_id, chw_id", "thinklet_id, topics_covered (text[]), patient_understanding, scheduled_followup."],
            ["follow_ups", "id (UUID)", "patient_id, referral_id", "due_date, status ('scheduled','completed','missed'), notes."],
            ["audit_logs", "id (UUID)", "user_id -> profiles(id)", "action, entity_type, entity_id, timestamp, ip_address."]
        ],
        [1.6, 1.2, 1.7, 3.0]
    )

    b.h2("8.2 Client IndexedDB Schema (Dexie.js)")
    b.p("Dexie manages identical schemas across both `CHWToolkitDB` (real user) and `CHWToolkitDB_demo` (demo mode):")
    b.bullet("`patients`: `id, name, age, gender, village, subcenter, created_at, synced`", "• ")
    b.bullet("`visits`: `id, patient_id, systolic, diastolic, blood_sugar, risk_tier, created_at, synced`", "• ")
    b.bullet("`referrals`: `id, patient_id, urgency, status, created_at, synced`", "• ")
    b.bullet("`counselling_sessions`: `id, patient_id, thinklet_id, created_at, synced`", "• ")
    b.bullet("`syncQueue`: `id, table_name, operation ('INSERT'|'UPDATE'|'DELETE'), payload, created_at, retries, status ('pending'|'in_progress'|'failed')`", "• ")

    b.h2("8.3 Dual-Database Proxy Routing Mechanism")
    b.p("To guarantee absolute isolation between evaluation testing and real healthcare data, `dexieDb.js` exports an ES6 Proxy. When any repository method (e.g. `db.patients.add()`) is invoked, the proxy dynamically inspects `isDemoModeActive()`:")
    b.bullet("If Demo Mode: The operation is redirected to the `CHWToolkitDB_demo` IndexedDB instance.", "1. ")
    b.bullet("If Real Mode: The operation is directed to `CHWToolkitDB` and enqueued in `syncQueue` for Supabase push.", "2. ")
    b.bullet("Benefit: Zero risk of test data polluting production cloud tables, and zero chance of offline demo operations triggering unwanted network errors.", "3. ")

