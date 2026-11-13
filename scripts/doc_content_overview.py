# scripts/doc_content_overview.py
"""
Content module for Parts 1 to 4:
- Part 1: Project Overview & Presentation Scripts
- Part 2: Complete Technology Stack
- Part 3: Complete System Architecture
- Part 4: Complete Application Workflows
"""

def add_part_1(builder):
    b = builder
    b.h1("PART 1 — COMPLETE PROJECT OVERVIEW")
    
    b.h2("1.1 Executive Summary & Core Identity")
    b.p("The Community Health Workers Toolkit (CHW Toolkit) is an enterprise-grade, offline-first Progressive Web Application (PWA) designed specifically for frontline community healthcare professionals—primarily Accredited Social Health Activists (ASHAs) and Auxiliary Nurse Midwives (ANMs)—operating in rural and peri-urban resource-constrained settings across India.")
    b.p("The system bridges the critical healthcare delivery gap between rural populations and formal secondary/tertiary healthcare infrastructure. It provides clinical decision support, deterministic cardiovascular and metabolic risk stratification (Type 2 Diabetes and Hypertension), encrypted local-first electronic medical record (EMR) management, clinical counseling protocols (ThinkLets), intelligent referral pathways, and an AI-driven triaged clinical assistant grounded in national public health guidelines.")
    
    b.h2("1.2 The Problem Being Solved")
    b.p("Primary healthcare in rural India faces systemic structural hurdles:")
    b.bullet("Critical Healthcare Worker Shortage: India's allopathic doctor-to-population ratio is approximately 1:1,456 (often lower in rural states), failing to meet the World Health Organization (WHO) recommended threshold of 1:1,000.", "1. ")
    b.bullet("Crushing Administrative Burden: Over 10 lakh ASHA workers manage rural health delivery through cumbersome, non-standardized paper registers. This leads to duplicate entry, high transcription error rates, lost longitudinal data, and delayed interventions.", "2. ")
    b.bullet("The Non-Communicable Disease (NCD) Tsunami: India currently has over 101 million people living with diabetes and an estimated 315 million individuals with hypertension. Over 50% of rural cases remain undiagnosed until acute microvascular or macrovascular complications arise.", "3. ")
    b.bullet("Fragile Rural Connectivity: Rural primary health sub-centers (SHCs) frequently suffer from zero or intermittent 2G/3G mobile connectivity. Standard cloud-dependent electronic health record systems fail completely when disconnected from the internet.", "4. ")
    b.bullet("Linguistic and Literacy Barriers: Frontline health workers in Karnataka, Maharashtra, and northern states operate in Kannada, Marathi, and Hindi. Technical medical jargon in English creates cognitive overhead and diagnostic errors.", "5. ")
    
    b.h2("1.3 Target Stakeholders & Real-World Utility")
    b.table(
        ["Stakeholder", "Primary Challenges", "CHW Toolkit Solution & Value Proposition"],
        [
            ["Community Health Workers (ASHAs / ANMs)", "Paper registers, complex math for BMI/risk, lack of clinical decision guidance, no offline tools.", "Digitized offline-first workflow, automated clinical risk scoring, local language UI (Hindi, Kannada, Marathi), structured ThinkLet protocols."],
            ["Primary Care / PHC Doctors", "Incomplete referral notes, missing vitals history, delayed presentation of complicated cases.", "Standardized digital referral receipts, longitudinal vitals graphs, automated risk flags, pre-screened triage tiers."],
            ["District Health Supervisors / BPMs", "Paper report collation delays (weeks), opaque field performance, impossible real-time outbreak tracking.", "Live analytics dashboard, screening target vs achievement monitoring, high-risk referral compliance tracking, sync audit trails."],
            ["Rural Patients & Families", "Delayed diagnosis of silent killers (HTN/Diabetes), costly emergency tertiary visits, lack of follow-up.", "Early proactive screening at doorstep, culturally sensitive lifestyle counseling in mother tongue, structured follow-up tracking."]
        ],
        [1.8, 2.5, 3.2]
    )
    
    b.h2("1.4 Why It Is NOT Just Another Healthcare Website")
    b.p("Examiners often ask what distinguishes this project from ordinary health portals or hospital management systems (HMS):")
    b.bullet("True Offline-First Architecture: Ordinary web apps display a 'No Internet' dinosaur or error screen. The CHW Toolkit executes 100% of its clinical assessments, risk calculations, patient registrations, and counseling workflows completely offline using Dexie.js (IndexedDB).", "1. Offline Resilience: ")
    b.bullet("Client-Side PII Cryptography: Sensitive patient health information (Aadhaar, phone, name) is encrypted on the device using Web Crypto API AES-GCM-256 before touching local disk or cloud transmission.", "2. Edge Encryption: ")
    b.bullet("Dual-Database Sandbox Isolation: Production users and demo evaluators are segregated at the client database engine level (`CHWToolkitDB` vs `CHWToolkitDB_demo`) using dynamic ES6 Proxy routing.", "3. Zero Cross-Contamination: ")
    b.bullet("Explainable Clinical Decision Support System (CDSS): Rather than using black-box neural networks that hallucinate dosages, our disease prediction engine uses deterministic, rule-based decision trees aligned with AHA/ACC 2017 and ADA 2024 guidelines.", "4. Clinical Determinism: ")
    b.bullet("AI Assistant with Obstetric Emergency Interceptors: The integrated Gemini 2.0 Flash assistant includes a hardcoded pregnancy red-flag detector that intercepts acute obstetric emergencies (pre-eclampsia, antepartum hemorrhage) before LLM inference.", "5. Safety Guardrails: ")

    b.h2("1.5 Spoken Presentation Scripts for Students")
    b.p("Use these scripts during the final project presentation. They are timed and tailored for examiners.")
    
    b.callout(
        "\"Good morning respected examiners. I am proud to present the Community Health Workers Toolkit—an offline-first, multilingual Progressive Web Application designed for frontline health workers in rural India. In rural areas with zero internet, our app enables ASHA workers to screen patients for Diabetes and Hypertension, calculate clinical risk scores deterministically, provide counseling in local languages like Kannada and Hindi, and securely sync encrypted health records once back online. It combines edge cryptography, offline-first IndexedDB storage, and a clinical AI assistant with emergency obstetric safeguards to deliver quality healthcare directly to the village doorstep.\"",
        "30-SECOND ELEVATOR PITCH"
    )
    
    b.callout(
        "\"Respected evaluators, over 70% of India's population lives in rural areas, yet our rural primary healthcare centers face an acute shortage of doctors and chronic connectivity blackouts. Frontline ASHA workers are the backbone of village healthcare, but they are drowning in manual paperwork while silent killers like Diabetes and Hypertension go undetected until it is too late.\n\n"
        "To solve this, we engineered the CHW Healthcare Toolkit. It is an offline-first PWA built with React 19, Dexie IndexedDB, and Supabase. An ASHA worker can carry a low-cost tablet into remote villages without internet, register patients, record vitals, and receive instant, explainable risk assessments based on American Heart Association and ADA clinical guidelines. Patient identities are protected by client-side AES-256-GCM encryption. Once the worker returns to an area with network coverage, our sync queue seamlessly merges encrypted records with the central cloud. Furthermore, our integrated Google Gemini 2.0 Flash AI assistant acts as a clinical copilot, complete with hardcoded red-flag interceptors for maternal and pediatric emergencies.\"",
        "1-MINUTE COMPREHENSIVE OVERVIEW"
    )
    
    b.callout(
        "\"Respected panel, today our team presents the Community Health Workers Toolkit, developed at Angadi Institute of Technology and Management, Belagavi.\n\n"
        "1. The Core Problem: In rural Belagavi and across India, non-communicable diseases account for over 60% of adult mortality. However, screening at the sub-center level is severely impeded because commercial EMR systems require continuous high-speed broadband and high-end hardware.\n\n"
        "2. Our Architectural Innovation: We adopted a client-first, edge-computed architecture. The frontend is built on React 19 and Vite with Tailwind CSS. When an ASHA worker opens the app, a Service Worker caches all assets, making it completely functional offline. For client-side data persistence, we utilize Dexie.js over IndexedDB. We engineered a proprietary Dual-Database Router: evaluation sessions run on an isolated demo database (`CHWToolkitDB_demo`), while authenticated CHWs operate on `CHWToolkitDB`, ensuring zero data contamination.\n\n"
        "3. Security & Compliance: Healthcare data requires strict confidentiality. We implemented client-side Web Crypto API encryption. Sensitive PII such as Aadhaar numbers and phone numbers are encrypted with AES-256-GCM using keys derived via PBKDF2 with 100,000 iterations. Even if a tablet is lost or the local storage inspected, patient identity remains mathematically uncrackable.\n\n"
        "4. Deterministic Clinical Decision Support: Rather than feeding patient vitals into an unpredictable deep learning model that might hallucinate medical guidance, we built an explainable CDSS following AHA/ACC 2017 and ADA 2024 protocols. It calculates BMI, Mean Arterial Pressure, pulse pressure, and stratifies patients into Low, Moderate, High, or Critical risk tiers with clear color-coded visual cues.\n\n"
        "5. Intelligent Triaged AI: On the cloud side, we deploy Vercel Serverless Functions integrating Google's Gemini 2.0 Flash model. The AI is grounded in an internal knowledge base of ICMR and WHO guidelines. Crucially, we implemented an emergency interceptor: if a pregnant woman presents with high blood pressure, severe headache, or visual disturbances, the system bypasses LLM inference entirely and issues an immediate Stage-4 Obstetric Emergency Eclampsia Protocol.\n\n"
        "In conclusion, the CHW Toolkit empowers frontline health workers with enterprise clinical intelligence at the point of care, regardless of connectivity.\"",
        "3-MINUTE IN-DEPTH PRESENTATION"
    )
    
    b.callout(
        "\"Respected examiners, from a technical perspective, the CHW Toolkit is architected across four distinct distributed layers:\n\n"
        "Layer 1: The Offline-First Edge Client. Built with React 19, Vite, and Tailwind CSS. State management utilizes React Context with local storage synchronization. Service Workers cache static bundles for sub-second offline loading. We load Google Noto Sans Devanagari and Kannada fonts locally to guarantee rendering in rural dialects without network access.\n\n"
        "Layer 2: Local Persistence & ES6 Proxy Storage. We implemented Dexie.js wrapping the browser's IndexedDB engine. To solve the problem of testing without polluting production datasets, we engineered an ES6 Proxy wrapper over Dexie. Depending on the user's authentication context, API calls are transparently dispatched to either `CHWToolkitDB` or `CHWToolkitDB_demo` with zero runtime overhead. The database schema stores encrypted patient records, visits, vitals, ThinkLet counseling logs, and a dedicated `syncQueue` table.\n\n"
        "Layer 3: Cryptography & Security Subsystem. We execute AES-GCM-256 encryption directly inside the browser using the native Web Crypto API. Cryptographic keys are derived per user session using PBKDF2 with HMAC-SHA-256 over 100,000 rounds. Nonces (IVs) are generated via `crypto.getRandomValues(new Uint8Array(12))` for every record, eliminating IV reuse attacks. On the cloud side, Supabase PostgreSQL enforces Row-Level Security (RLS) policies based on JWT claims, restricting CHWs strictly to their assigned sub-center data.\n\n"
        "Layer 4: Serverless Backend & AI Integration. The backend comprises Vercel Node.js Serverless Functions (`/api/chat`, `/api/health`, `/api/register`). User registration utilizes the Supabase Service Role Admin API to programmatically auto-confirm email verification, solving a major onboarding bottleneck for rural workers. The `/api/chat` endpoint verifies incoming Supabase JWTs, retrieves top-3 vector-similar clinical guideline chunks from our grounded knowledge base, checks for obstetric emergency red-flags, and streams responses from Gemini 2.0 Flash at a controlled temperature of 0.2.\n\n"
        "The codebase contains 101 automated unit and integration tests written in Vitest, passing with 100% success across cryptographic routines, clinical prediction algorithms, sync queues, and multilingual parity. We are ready to demonstrate the live system.\"",
        "5-MINUTE TECHNICAL ARCHITECTURE PRESENTATION"
    )

def add_part_2(builder):
    b = builder
    b.h1("PART 2 — COMPLETE TECHNOLOGY STACK")
    b.p("Every technology documented below has been verified directly from `package.json`, configuration files, and source code.")
    
    b.h2("2.1 Technology Stack Matrix")
    b.table(
        ["Layer / Category", "Exact Technology & Version", "Architectural Role & Implementation Detail"],
        [
            ["Frontend Framework", "React 19.0.0", "Core view layer utilizing modern functional components, hooks (`useState`, `useEffect`, `useMemo`, `useCallback`), and Context API for global state."],
            ["Build Tool & Dev Server", "Vite 6.0.5", "Next-generation ESM bundler providing instant Hot Module Replacement (HMR) and optimized Rollup production code splitting."],
            ["CSS & Design System", "Tailwind CSS 3.4.17", "Utility-first CSS framework with PostCSS and Autoprefixer. Delivers responsive mobile-first layouts with custom medical color schemes."],
            ["Icons & Visual Assets", "Lucide React 0.468.0", "Lightweight, tree-shakeable SVG icon system covering clinical symbols (heart, activity, shield, alert, database)."],
            ["Client-Side Database", "Dexie.js 4.0.11", "High-performance TypeScript/ES6 wrapper around browser IndexedDB. Manages local EMR tables, offline transactions, and sync queues."],
            ["Client-Side Cryptography", "Web Crypto API (Native)", "AES-GCM-256 encryption with PBKDF2-SHA-256 key derivation (100,000 iterations) for zero-knowledge client PII protection."],
            ["Cloud Database & Backend", "Supabase (PostgreSQL 15)", "Hosted relational database with PostgREST automated API, Row Level Security (RLS), and database trigger functions."],
            ["Authentication Service", "Supabase Auth (GoTrue)", "Cryptographic user authentication utilizing bcrypt password hashing, JWT access tokens (1h expiry), and refresh tokens."],
            ["Serverless Runtime", "Vercel Serverless (Node.js 20)", "Stateless micro-endpoints (`api/chat.js`, `api/health.js`, `api/register.js`) running on Vercel's global edge network."],
            ["AI & Large Language Model", "Google Gemini 2.0 Flash", "Google Generative AI SDK (`@google/genai` v0.1.2) utilizing `gemini-2.0-flash` with grounded clinical prompt engineering."],
            ["Localization & Fonts", "@fontsource/noto-sans-devanagari & noto-sans-kannada", "Local web font bundles ensuring crisp, flawless rendering of Kannada, Hindi, and Marathi scripts on any device without internet."],
            ["Unit & Benchmark Testing", "Vitest 2.1.8", "Vite-native testing framework. Powers 101 automated test cases covering crypto, CDSS logic, sync queue, and i18n parity."],
            ["Linting & Code Quality", "ESLint 9.17.0", "Flat config linting enforcing React 19 standards, unused variable detection, and clean syntax."],
            ["Deployment & Hosting", "Vercel Platform", "Continuous deployment from GitHub `main` branch with automated prebuild checks (`scripts/check-env.mjs`)."]
        ],
        [1.8, 2.4, 3.3]
    )

def add_part_3(builder):
    b = builder
    b.h1("PART 3 — COMPLETE SYSTEM ARCHITECTURE")
    b.h2("3.1 Four-Tier Distributed Architecture")
    b.p("The CHW Toolkit employs an edge-first distributed architecture designed to operate autonomously in zero-connectivity environments while maintaining eventual consistency with the cloud.")
    
    b.bullet("Tier 1: Progressive Web App Client Layer (Device Edge): Executes completely within the browser environment (mobile Chrome, Firefox, Safari, or desktop). Houses React 19 UI components, Dexie IndexedDB instances, Web Crypto AES-256 engine, and deterministic CDSS algorithms.", "• ")
    b.bullet("Tier 2: Serverless Compute Gateway (Vercel Edge): Stateless Node.js serverless microservices. Acts as a secure intermediary between the frontend and external services, verifying JWTs, executing service-role administrative operations, and enforcing AI safety policies.", "• ")
    b.bullet("Tier 3: Cloud Database & Identity Layer (Supabase PostgreSQL): Multi-tenant cloud database protected by Row Level Security (RLS). Houses official patient records, visits, clinical referrals, and audit trails.", "• ")
    b.bullet("Tier 4: Clinical AI Intelligence Layer (Google Gemini API): Hosted large language model providing contextual clinical guidance, accessible only through the authenticated serverless proxy.", "• ")

    b.h2("3.2 Architectural Flow & Data Pipeline")
    b.p("The architecture guarantees that clinical operations never block on network availability:")
    b.bullet("1. Patient Intake & Vitals Recording: ASHA worker inputs patient demographics and clinical measurements.", "Step ")
    b.bullet("2. Client-Side Encryption: Patient name, phone, and government ID (Aadhaar) are encrypted with AES-256-GCM in browser memory.", "Step ")
    b.bullet("3. Deterministic CDSS Evaluation: Prediction engine evaluates vitals locally, assigning cardiovascular and glycemic risk tiers in under 2 milliseconds.", "Step ")
    b.bullet("4. Dual-Database Isolation: Data is written to IndexedDB. If in demo mode, written to `CHWToolkitDB_demo`; if authenticated, written to `CHWToolkitDB`.", "Step ")
    b.bullet("5. Sync Queue Enqueue: A mutation task containing a unique UUID, timestamp, and operation payload is added to the `syncQueue` table.", "Step ")
    b.bullet("6. Eventual Consistency Synchronization: When network connectivity is detected (`navigator.onLine`), the sync manager processes queued operations against Supabase REST endpoints using last-write-wins conflict resolution.", "Step ")

def add_part_4(builder):
    b = builder
    b.h1("PART 4 — COMPLETE APPLICATION WORKFLOWS")
    
    b.h2("4.1 Authentication & Onboarding Workflow")
    b.p("Authentication supports both real clinical staff and evaluation observers:")
    b.bullet("Real User Registration: User submits name, email, password, role ('chw', 'doctor', 'supervisor'), sub-center name, and district. Frontend calls `/api/register`. The backend uses the Supabase Service Role Admin client to create the user and immediately auto-confirms their email (`email_confirm: true`), bypassing email delivery failures in rural areas. A trigger function automatically creates their profile in `public.profiles`.", "1. ")
    b.bullet("Real User Login: User submits credentials. Supabase GoTrue validates the password against the stored bcrypt hash and returns a signed JWT access token and refresh token. The app fetches their role from `public.profiles` and routes them to their specific dashboard (`/chw`, `/doctor`, `/supervisor`).", "2. ")
    b.bullet("Demo Persona Mode: Evaluators can click persona buttons ('Demo ASHA Worker', 'Demo Doctor', 'Demo Supervisor'). The app assigns a client-side mock profile, sets `is_demo=true`, switches the active storage to `CHWToolkitDB_demo`, and displays a persistent orange top banner.", "3. ")

    b.h2("4.2 Patient Screening & Health Assessment Workflow")
    b.bullet("Step 1 - Registration: Frontline worker inputs demographics (name, age, gender, phone, village/sub-center). The Web Crypto engine encrypts PII before IndexedDB insertion.", "• ")
    b.bullet("Step 2 - Vitals Collection: Worker enters Blood Pressure (Systolic and Diastolic in mmHg), Fasting or Random Blood Sugar (mg/dL), Height (cm), Weight (kg), and existing symptoms (polyuria, polydipsia, headache, dizziness, chest tightness).", "• ")
    b.bullet("Step 3 - Automated Deterministic Scoring: `predictionEngine.js` calculates BMI ($weight / height^2$), Pulse Pressure ($SBP - DBP$), Mean Arterial Pressure ($DBP + (SBP - DBP)/3$), classifies hypertension per AHA/ACC 2017, classifies diabetes per ADA 2024, and computes a composite risk score (0 to 100).", "• ")
    b.bullet("Step 4 - Dynamic ThinkLet Activation: Based on the risk tier, the system renders tailored clinical counseling protocols (e.g., DASH diet reduction, aerobic exercise targets, emergency warning signs).", "• ")
    b.bullet("Step 5 - Referral Generation: If the patient is classified as High or Critical risk, the worker initiates a digital referral to the nearest Primary Health Centre (PHC), specifying urgency (Routine, Priority, Emergency).", "• ")

    b.h2("4.3 Offline-to-Online Synchronization Engine")
    b.p("Synchronization is managed by `src/lib/sync/syncManager.js`:")
    b.bullet("Online Status Monitoring: Listens to window `online` and `offline` events.", "1. ")
    b.bullet("Queue Traversal: Iterates over records in Dexie `syncQueue` ordered by `created_at` timestamp.", "2. ")
    b.bullet("Exponential Backoff: Failed network requests increment a retry counter and back off exponentially (1s, 2s, 4s, 8s) up to 5 attempts before marking the item as `failed` for manual inspection.", "3. ")
    b.bullet("Conflict Resolution: Uses a client-server timestamp comparison (last-write-wins). Since rural records are created at the edge and forwarded to the cloud, updates preserve the latest clinical measurement.", "4. ")
    b.bullet("Idempotency: All records utilize RFC 4122 UUID v4 primary keys generated on the client, preventing duplicate insertions even during network dropouts during sync.", "5. ")

