# scripts/doc_content_viva_qa.py
"""
Content module for Part 13:
120+ Viva Questions & Answers across 20 Categories.
Each question provides both a Simple Answer and an in-depth Technical Answer.
"""

def add_part_13(builder):
    b = builder
    b.h1("PART 13 — 120+ VIVA QUESTIONS & ANSWERS ACROSS 20 CATEGORIES")
    b.p("This section contains comprehensive, categorised viva questions and answers covering every facet of the project. Each question has a Simple Explanation (for general / clinical examiners) and an in-depth Technical Explanation (for external software engineering examiners).")

    categories = [
        # CATEGORY 1: Project Concept & Motivation
        ("Category 1: Project Concept & Motivation", [
            ("What is the primary motivation behind developing the CHW Toolkit?",
             "To help village healthcare workers (ASHAs) screen rural citizens for diabetes and hypertension easily, without relying on paper registers or continuous internet.",
             "To resolve the primary healthcare delivery bottleneck in rural India, where doctor-to-population ratios are 1:1456, non-communicable diseases (NCDs) cause 60% of deaths, and remote sub-centers experience frequent connectivity blackouts. The PWA provides offline-first, client-side encrypted EMR and deterministic CDSS."),
            
            ("Who are the primary end users of this application?",
             "ASHA workers, ANMs, Primary Health Centre doctors, and district health supervisors.",
             "The system serves a role-based clinical hierarchy: Frontline Community Health Workers (ASHAs/ANMs) at rural sub-centers, Medical Officers at Primary Health Centres (PHCs), and Block/District Health Supervisors managing regional health indicators."),
             
            ("Why did you focus specifically on Diabetes and Hypertension?",
             "Because they are 'silent killers' that cause heart attacks, strokes, and kidney failure if not detected early in rural areas.",
             "Cardiovascular diseases and diabetes constitute the largest share of preventable mortality in India. Early detection of pre-hypertension and pre-diabetes through community screening allows non-pharmacological lifestyle interventions before irreversible vascular damage occurs."),
             
            ("How does your project align with National Health Mission (NHM) objectives?",
             "It supports the government's screening programs by providing digital tools that work in remote villages.",
             "It directly operationalizes the Comprehensive Primary Health Care (CPHC) mandate under Ayushman Bharat and the NPCDCS guidelines by digitizing community-level NCD screening and structured referrals."),
             
            ("What was the biggest design challenge you identified during research?",
             "Making sure the app still works 100% when there is zero mobile signal in remote villages.",
             "Engineering an offline-first architecture that provides instant clinical risk calculations and local encrypted data persistence on low-spec mobile devices without requiring cloud round-trips."),
             
            ("Is this app intended to replace doctors in rural areas?",
             "No, it empowers health workers to screen and refer patients so doctors can treat high-risk cases faster.",
             "The system is strictly a triage and clinical decision support system (CDSS) for frontline screening; it enforces clear referral pathways and explicitly prohibits CHWs from prescribing medication.")
        ]),

        # CATEGORY 2: Frontend & React 19
        ("Category 2: Frontend & React 19", [
            ("Why did you choose React 19 instead of older versions or plain HTML/JS?",
             "React 19 makes the user interface very fast, modular, and reactive to user inputs.",
             "React 19 introduces optimized concurrent rendering, improved asset loading, and cleaner hooks. Its virtual DOM and component-driven architecture allow high reusability of clinical UI components across distinct portals."),
            
            ("How do you manage application state across components?",
             "We use React Context API combined with local storage persistence.",
             "We use dedicated React Context providers (`AuthContext.jsx`, `LanguageContext.jsx`) leveraging `useContext`, `useReducer`, and custom hooks to propagate authentication tokens, active user roles, and translation dictionaries without prop drilling."),
             
            ("What is Vite and why did you use it instead of Create React App (CRA)?",
             "Vite is a modern build tool that starts in seconds and builds smaller, faster production files.",
             "Vite uses native ES modules (ESM) during development for instantaneous Hot Module Replacement (HMR) and utilizes Rollup under the hood with tree-shaking for lean production asset bundles."),
             
            ("How does Tailwind CSS improve your application?",
             "It lets us style components quickly with clean, responsive mobile designs without writing huge CSS files.",
             "Tailwind CSS uses utility-first styling with PostCSS, purging unused CSS during production builds to generate a minimal footprint (under 30KB) critical for 2G rural mobile bandwidths."),
             
            ("What are React Hooks and which ones did you use extensively?",
             "Hooks are special React functions that let components hold data and handle side effects.",
             "We heavily use `useState` for UI state, `useEffect` for lifecycle side-effects (e.g. online/offline listeners), `useMemo` for expensive CDSS risk calculations, and `useCallback` to prevent unnecessary component re-renders."),
             
            ("How do you ensure the UI is responsive on cheap smartphones?",
             "Tailwind's mobile-first breakpoints and flexible grid layouts adapt to any screen size.",
             "We designed using a mobile-first philosophy (`sm:`, `md:`, `lg:` utility classes) with touch-friendly 48px touch targets compliant with WCAG 2.1 accessibility standards.")
        ]),

        # CATEGORY 3: Progressive Web App (PWA) & Service Workers
        ("Category 3: Progressive Web App (PWA) & Service Workers", [
            ("What is a Progressive Web Application (PWA)?",
             "A website that acts like an installable mobile app and works even without an internet connection.",
             "A PWA combines web standards with native app capabilities using a Web App Manifest (`manifest.json`) and Service Workers to enable background caching, home screen installation, and offline execution."),
            
            ("What is a Service Worker and how does it work in your project?",
             "It is a background script in the browser that caches app files so the app opens instantly offline.",
             "A Service Worker is an event-driven JavaScript background worker running on a separate thread from the UI. It intercepts HTTP fetch requests, serving pre-cached HTML, CSS, JS, and font assets via a Cache-First strategy."),
            
            ("What caching strategy do you use for static assets versus API calls?",
             "Static files use 'Cache First', while API calls use 'Network First' with local fallback.",
             "Static assets (JS bundles, CSS, WOFF2 fonts) use a `Cache-First, Fallback-to-Network` strategy for instantaneous sub-second loading. Dynamic API endpoints (`/api/chat`) use `Network-Only with Graceful Offline Fallback`."),
             
            ("Can a user install the CHW Toolkit on an Android tablet without Google Play Store?",
             "Yes, by clicking 'Add to Home Screen' directly from the browser.",
             "The PWA meets all installability criteria: served over HTTPS, valid `manifest.json` with icons and standalone display mode, and an active Service Worker with a fetch handler."),
             
            ("How do Service Workers update when you deploy new code?",
             "The browser detects changes in the worker file in the background and activates the new version on next visit.",
             "When a new build is deployed to Vercel, the browser fetches the new Service Worker script, triggers the `install` phase, skips waiting via `clients.claim()`, and invalidates stale caches."),
             
            ("Why is a PWA better than a native Android APK for rural health deployments?",
             "It works across Android, iPhone, and laptops with zero installation friction and automatic updates without Play Store downloads.",
             "PWAs eliminate APK distribution overhead, bypass device fragmentation issues, require minimal storage (<5MB vs 50MB+ native apps), and update instantly via web deployment.")
        ]),

        # CATEGORY 4: Offline Architecture & Dexie.js (IndexedDB)
        ("Category 4: Offline Architecture & Dexie.js (IndexedDB)", [
            ("What is IndexedDB and why couldn't you just use localStorage?",
             "IndexedDB is a real database inside the browser that can store thousands of records; localStorage is too small.",
             "IndexedDB is an asynchronous, transactional, NoSQL object-store database capable of holding hundreds of megabytes of structured data with indexes. `localStorage` is synchronous, blocking, and limited to 5MB of string data."),
            
            ("What is Dexie.js and what role does it play?",
             "Dexie.js is a library that makes working with IndexedDB clean, simple, and reliable using JavaScript promises.",
             "Dexie.js is an advanced TypeScript/ES6 wrapper over the complex low-level IndexedDB API. It provides a clean, fluent query syntax, automated schema upgrades, compound indexing, and transactional ACID guarantees."),
            
            ("How much clinical data can be stored locally on a health worker's device?",
             "Thousands of patient records and vitals can easily fit in the browser's storage.",
             "Modern browsers allow IndexedDB to consume up to 60-80% of available disk space (often tens of gigabytes). A complete patient record with vitals is approximately 1.5 KB, allowing over 50,000 patient records locally."),
             
            ("What happens to local data if the user clears their browser cache?",
             "Standard cache clearing does not delete IndexedDB; only clearing 'Site Data' or cookies removes it.",
             "IndexedDB is persisted in durable browser storage. To protect data from browser eviction under low disk conditions, we request persistent storage via `navigator.storage.persist()`."),
             
            ("Can multiple tabs open the local database at the same time?",
             "Yes, IndexedDB supports multiple tabs safely.",
             "Dexie handles cross-tab concurrency using IndexedDB's native transaction locks and database version change events."),
             
            ("How do you query local records by sub-center or risk tier?",
             "Dexie indexes let us search and filter patients instantly.",
             "We define secondary indexes in our Dexie schema: `db.version(1).stores({ visits: 'id, patient_id, risk_tier, created_at, synced' })`, allowing `db.visits.where('risk_tier').equals('Critical').toArray()` in sub-millisecond time.")
        ]),

        # CATEGORY 5: Dual-Database Scheme & Demo Isolation
        ("Category 5: Dual-Database Scheme & Demo Isolation", [
            ("What is the Dual-Database scheme and why did you build it?",
             "We created two separate databases in the browser so that demo testing never mixes with real patient data.",
             "To eliminate test data pollution, the application maintains two isolated IndexedDB databases: `CHWToolkitDB` for authenticated clinical staff and `CHWToolkitDB_demo` for evaluator personas, routed transparently at runtime."),
            
            ("How does the code switch between the real database and demo database?",
             "We built a smart router using JavaScript ES6 Proxy that checks if the user is in demo mode.",
             "The database module exports an ES6 Proxy wrapping Dexie. Every table access (e.g. `db.patients`) dynamically inspects the active session state and routes calls to either `realDb` or `demoDb` without altering caller code."),
            
            ("Does demo mode data ever sync to the Supabase cloud database?",
             "No, demo data is strictly kept inside the local browser and never uploaded.",
             "The `syncManager` verifies `isDemoModeActive()`. If true, the synchronization worker is completely inhibited, ensuring zero demo records are pushed to Supabase REST endpoints."),
             
            ("How does an evaluator reset their demo data?",
             "By clicking the 'Reset Demo Data' button in the demo banner.",
             "The reset function executes `demoDb.delete().then(() => demoDb.open())`, wiping and re-seeding the demo IndexedDB instance with fresh sample patients without touching real records."),
             
            ("How can examiners verify that demo credentials aren't bundled in production?",
             "By inspecting the production build or disabling the demo flag in environment variables.",
             "Setting `VITE_DEMO_MODE=false` strips demo components and personas during Vite's Rollup tree-shaking phase, completely eliminating mock credentials from the production bundle."),
             
            ("What visual indicator shows that the application is running in demo mode?",
             "A prominent orange notification banner at the top of the screen stating 'DEMO MODE: sample data only'.",
             "A persistent alert banner conditionally mounts at the root DOM level whenever `isDemo===true`, providing visual clarity to prevent clinical confusion.")
        ]),

        # CATEGORY 6: Data Synchronization & Conflict Resolution
        ("Category 6: Data Synchronization & Conflict Resolution", [
            ("How does offline data get sent to the cloud when internet returns?",
             "A sync queue stores all offline changes and automatically uploads them when network is detected.",
             "Every mutation (create/update) writes to a Dexie `syncQueue` table. The `syncManager` listens to the browser `online` event, reads pending queue records in FIFO order, and dispatches them to Supabase REST endpoints."),
            
            ("What happens if the internet drops in the middle of syncing 10 records?",
             "The app stops gracefully, remembers where it stopped, and retries the rest when internet returns.",
             "The sync manager processes records sequentially inside an asynchronous loop. If an HTTP request fails, the failed record's retry count increments, and synchronization halts until the next network reconnect event."),
            
            ("How do you prevent duplicate records if the same data is submitted twice?",
             "Every record has a globally unique ID (UUID) created on the device.",
             "All entities use RFC 4122 UUID v4 primary keys generated on the client via `crypto.randomUUID()`. Supabase enforces a primary key unique constraint, making database insertions idempotent."),
             
            ("How do you handle conflict resolution if two workers edit the same patient?",
             "We use 'Last-Write-Wins' based on the newest timestamp.",
             "We implement a deterministic Last-Write-Wins (LWW) strategy. The cloud database compares the incoming `updated_at` ISO timestamp against the stored record, accepting updates with newer timestamps."),
             
            ("What is exponential backoff in your sync manager?",
             "It means the app waits progressively longer (1s, 2s, 4s, 8s) before retrying a failed upload to avoid overloading the network.",
             "Exponential backoff calculates delay as $T = 2^{\\text{retries}} \\times 1000\\text{ms}$. If a request fails, it prevents denial-of-service hammering on fragile rural cellular networks."),
             
            ("How does the UI show the user whether their data is synced?",
             "A small badge shows 'Synced' in green or 'Pending Sync' in amber.",
             "The UI subscribes to Dexie's live query observer on `syncQueue`. When `count() > 0`, it displays an amber sync counter badge; when zero, it displays a green synced status.")
        ]),

        # CATEGORY 7: Database Architecture & PostgreSQL (Supabase)
        ("Category 7: Database Architecture & PostgreSQL (Supabase)", [
            ("Why did you choose PostgreSQL / Supabase for the cloud database?",
             "Postgres is a powerful, reliable relational database with built-in security and user management.",
             "Supabase provides managed PostgreSQL 15 with automatic RESTful API generation (PostgREST), built-in GoTrue authentication, native JSONB support, and robust Row Level Security (RLS)."),
            
            ("What are the main tables in your PostgreSQL database?",
             "Profiles, Patients, Visits, Referrals, Prescriptions, Counselling Sessions, and Audit Logs.",
             "The schema comprises `profiles` (user roles), `patients` (demographics), `visits` (clinical vitals), `referrals` (doctor triage), `prescriptions` (pharmacotherapy), `counselling_sessions` (ThinkLet tracking), and `audit_logs` (compliance)."),
            
            ("Why are patient names and phones stored as encrypted text in Postgres?",
             "To protect patient privacy so even database administrators cannot read sensitive personal data.",
             "In accordance with healthcare privacy regulations (DPDPA/HIPAA), fields like `name_enc`, `phone_enc`, and `aadhaar_enc` are stored as Base64-encoded AES-GCM ciphertexts, achieving zero-knowledge cloud storage."),
             
            ("What is the relationship between the profiles table and Supabase auth.users?",
             "Every login account in auth.users has exactly one matching profile with their role and sub-center.",
             "`public.profiles.id` is a foreign key referencing `auth.users.id` with `ON DELETE CASCADE`. A PostgreSQL trigger (`on_auth_user_created`) automatically seeds a profile row upon successful user registration."),
             
            ("Why is the sub-center column critical in the database?",
             "It groups health workers and patients by their local village clinic for security and reporting.",
             "`subcenter` serves as the tenant partitioning key. It enables Row Level Security policies to filter records so workers only see patients residing in their geographic jurisdiction."),
             
            ("What indexes did you create in PostgreSQL to optimize queries?",
             "Indexes on patient IDs, visit dates, sub-center names, and referral statuses.",
             "We created B-tree indexes on `visits(patient_id)`, `visits(created_at)`, `patients(subcenter)`, and `referrals(status, urgency)` to ensure sub-10ms lookup times during dashboard aggregation.")
        ]),

        # CATEGORY 8: Row Level Security (RLS) & Access Control
        ("Category 8: Row Level Security (RLS) & Access Control", [
            ("What is Row Level Security (RLS)?",
             "A security feature inside the database that controls which rows a user is allowed to read or write.",
             "RLS is a PostgreSQL feature that evaluates security expressions per row for every SQL query, enforcing fine-grained authorization at the database engine level rather than relying solely on application middleware."),
            
            ("Why is RLS better than checking user permissions in the frontend?",
             "Because a smart user can bypass frontend code, but nobody can bypass database RLS.",
             "Frontend checks are purely cosmetic. If an attacker inspects network traffic and calls the Supabase REST API directly with their JWT, PostgreSQL RLS policies evaluate the JWT claims and reject unauthorized rows at the database layer."),
            
            ("Can an ASHA worker from Sub-Center A see patients from Sub-Center B?",
             "No, the database automatically hides patients from other sub-centers.",
             "The RLS policy specifies: `USING (subcenter = (SELECT subcenter FROM profiles WHERE id = auth.uid()))`. The database engine automatically appends this `WHERE` clause to all `SELECT` and `UPDATE` statements."),
             
            ("Can a doctor write a prescription for a patient who was not referred?",
             "No, doctors can only prescribe for patients with an active referral.",
             "RLS enforces foreign key ownership checks ensuring a doctor can only insert rows into `prescriptions` where a corresponding `referrals.doctor_id = auth.uid()` exists."),
             
            ("What happens if someone tries to query Supabase without an auth token?",
             "The database returns an empty list or an authorization error.",
             "Default RLS table settings specify `DENY ALL` for the `anon` role unless an authenticated JWT signed by the Supabase JWT secret is provided in the `Authorization: Bearer` header."),
             
            ("How does the supervisor role bypass sub-center restrictions?",
             "Supervisors have a special policy that lets them see aggregated data across all sub-centers in their district.",
             "Supervisor policies check `(SELECT role FROM profiles WHERE id = auth.uid()) = 'supervisor'` AND `district = (SELECT district FROM profiles WHERE id = auth.uid())`, providing district-wide visibility.")
        ]),

        # CATEGORY 9: Security, Web Crypto & AES-256-GCM Encryption
        ("Category 9: Security, Web Crypto & AES-256-GCM Encryption", [
            ("How do you encrypt patient data on the device?",
             "We use the browser's built-in Web Crypto API with military-grade AES-256 encryption.",
             "We utilize `window.crypto.subtle` executing AES-GCM (Galois/Counter Mode) with a 256-bit symmetric key derived via PBKDF2 with 100,000 iterations of SHA-256."),
            
            ("What is an Initialization Vector (IV) and why is it important?",
             "It is a unique random number added to the encryption so the same word looks completely different each time.",
             "An IV (or nonce) ensures cryptographic freshness. We generate a 12-byte cryptographically secure pseudorandom IV via `crypto.getRandomValues(new Uint8Array(12))` for every encryption. This prevents replay attacks and ciphertext pattern analysis."),
            
            ("Where is the encryption key stored?",
             "It stays only in the device's temporary memory while the user is logged in.",
             "The `CryptoKey` object is maintained in JavaScript volatile memory (RAM). It is never saved to `localStorage`, `IndexedDB`, cookies, or sent to server logs, ensuring zero-knowledge privacy."),
             
            ("What happens if someone steals the tablet or downloads the database file?",
             "They will only see scrambled, unreadable encrypted text.",
             "Without the session key derived from the authenticated credentials, the AES-256-GCM ciphertext cannot be decrypted in any feasible computational timeframe ($2^{256}$ operations)."),
             
            ("Why did you use AES-GCM instead of AES-CBC?",
             "AES-GCM is faster and includes built-in protection against tampering.",
             "AES-GCM is an Authenticated Encryption with Associated Data (AEAD) scheme. It calculates an authentication tag during encryption, verifying both data confidentiality and authenticity in a single pass without vulnerability to padding oracle attacks."),
             
            ("How does this satisfy Indian data privacy regulations (DPDPA 2023)?",
             "It guarantees that sensitive personal health data is anonymized and encrypted before cloud transfer.",
             "The Digital Personal Data Protection Act (DPDPA 2023) mandates data minimization and reasonable security safeguards. Client-side edge encryption ensures patient PII is protected even in transit and at rest.")
        ]),

        # CATEGORY 10: Authentication, GoTrue & User Roles
        ("Category 10: Authentication, GoTrue & User Roles", [
            ("How does user login work from a technical perspective?",
             "The user enters email and password, Supabase verifies the password hash and returns an encrypted token.",
             "Supabase Auth (GoTrue) verifies the plaintext password against the stored bcrypt hash in `auth.users`. Upon validation, it signs and returns a JSON Web Token (JWT) containing user UUID and metadata, with an expiry of 1 hour."),
            
            ("How does the application know if a user is a CHW, Doctor, or Supervisor?",
             "The app checks their verified role from the profiles table in the database.",
             "Upon login, `AuthContext.jsx` queries `public.profiles` for the authenticated `uid`. The verified `role` enum ('chw', 'doctor', 'supervisor') is stored in state and dictates the React Router navigation guard."),
            
            ("Why did you create a custom /api/register endpoint instead of calling Supabase signup directly?",
             "Because rural health workers cannot easily check confirmation emails; our server auto-confirms them.",
             "Default Supabase signup sends an email confirmation link. In rural deployments with limited email access, this causes user onboarding failure. Our `/api/register` serverless function uses the Supabase Service Role Admin client to create the user and immediately set `email_confirm: true`."),
             
            ("What is a JWT and what information does it carry?",
             "A digitally signed web token that proves the user is logged in.",
             "A JSON Web Token consists of a Header, Payload, and Signature. The payload contains `sub` (user UUID), `iss` (Supabase issuer), `exp` (expiration timestamp), and `role` claims, cryptographically signed with HMAC-SHA256."),
             
            ("How does the app stay logged in if the user refreshes the page?",
             "The session token is saved securely in the browser and checked on startup.",
             "Supabase client persists the session in `localStorage` or `sessionStorage` and automatically fires `onAuthStateChange` during initial render, rehydrating the user session seamlessly."),
             
            ("What happens when a user clicks 'Logout'?",
             "The app destroys the session token, clears the encryption key from memory, and returns to the login screen.",
             "`supabase.auth.signOut()` invalidates the session, clears cached tokens, wipes the in-memory Web Crypto key, resets active component state, and redirects to `/login`.")
        ]),

        # CATEGORY 11: Backend & Vercel Serverless Architecture
        ("Category 11: Backend & Vercel Serverless Architecture", [
            ("What is a Serverless Function?",
             "A piece of code that runs in the cloud only when called, without needing a full server running 24/7.",
             "Serverless functions are event-driven, ephemeral compute micro-containers (AWS Lambda / Vercel Functions). They instantiate on-demand to process incoming HTTP requests, auto-scale horizontally, and terminate upon response completion."),
            
            ("What backend serverless functions exist in your project?",
             "/api/chat for AI consultation, /api/register for user creation, and /api/health for system checks.",
             "We maintain three Node.js serverless functions: `api/chat.js` (clinical LLM proxy and red-flag interceptor), `api/register.js` (admin-privileged onboarding), and `api/health.js` (monitoring probe)."),
            
            ("Why use Vercel Serverless instead of a traditional Express.js/Node.js server?",
             "It costs zero dollars when idle, scales automatically for thousands of workers, and needs no server maintenance.",
             "Serverless architecture eliminates server maintenance, OS patching, and fixed hosting costs. Vercel automatically deploys endpoints globally at the edge with automatic SSL termination and low cold-start times (<200ms)."),
             
            ("How does /api/chat protect against denial of service or spam?",
             "It checks that the user has a valid login token before allowing them to use the AI.",
             "The endpoint validates the incoming `Authorization: Bearer <token>` against the Supabase Auth API. Unauthenticated requests are rejected with HTTP 401 Unauthorized before triggering any LLM costs."),
             
            ("What are environment variables and which ones are kept secret?",
             "Settings stored securely on the server, like the Gemini API Key and Supabase Service Role Key.",
             "Variables prefixed with `VITE_` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are client-public. Secret variables (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) exist strictly in Vercel's encrypted runtime environment."),
             
            ("What happens during a 'cold start' in serverless functions?",
             "A very slight delay (about 200 milliseconds) on the first request while the server wakes up.",
             "A cold start occurs when a serverless container spins up from an idle state. Because our microservices use lightweight ES modules with minimal dependencies, cold start latency is under 250ms.")
        ]),

        # CATEGORY 12: Disease Prediction Engine & Clinical Decision Support (CDSS)
        ("Category 12: Disease Prediction Engine & Clinical Decision Support (CDSS)", [
            ("What is a Clinical Decision Support System (CDSS)?",
             "A software tool that helps health workers make accurate clinical decisions based on established medical rules.",
             "A CDSS is an active knowledge system that uses patient health data to generate clinical assessments, risk stratification, and evidence-based recommendations at the point of care."),
            
            ("Did you use Machine Learning or Rule-Based algorithms for disease prediction?",
             "We used a deterministic, rule-based algorithm based on official clinical guidelines, not black-box machine learning.",
             "We deliberately implemented a deterministic, rule-based expert system. Black-box ML models are prone to hallucinations, require massive training datasets, lack medical explainability, and pose serious patient safety risks in frontline healthcare."),
            
            ("Where is predictionEngine.js executed?",
             "Directly inside the health worker's mobile phone browser, completely offline.",
             "It executes on the client-side JavaScript engine (`src/utils/predictionEngine.js`). This enables sub-millisecond risk evaluation with zero network dependency."),
             
            ("What inputs are required to calculate patient risk?",
             "Blood pressure, blood sugar, height, weight, and reported symptoms.",
             "Systolic BP, Diastolic BP, Fasting/Random Blood Glucose, Height (cm), Weight (kg), and a boolean array of cardinal symptoms (chest pain, polyuria, polydipsia, blurred vision, dizziness)."),
             
            ("What are the four risk categories calculated by the engine?",
             "Low Risk (Green), Moderate Risk (Yellow), High Risk (Orange), and Critical Emergency (Red).",
             "Low (composite score 0-24), Moderate (25-49), High (50-74), and Critical (75-100), mapped to clear clinical escalation protocols."),
             
            ("What clinical formulas are calculated in real time?",
             "Body Mass Index (BMI), Pulse Pressure, and Mean Arterial Pressure.",
             "$\text{BMI} = \text{weight}(\text{kg}) / (\text{height}(\text{m}))^2$, $\text{Pulse Pressure} = \text{SBP} - \text{DBP}$, and $\text{Mean Arterial Pressure (MAP)} = \text{DBP} + \frac{\text{SBP} - \text{DBP}}{3}$.")
        ]),

        # CATEGORY 13: Clinical Guidelines (AHA/ACC, ADA, ICMR)
        ("Category 13: Clinical Guidelines (AHA/ACC, ADA, ICMR)", [
            ("Which clinical guideline do you follow for Blood Pressure?",
             "The 2017 American Heart Association / American College of Cardiology (AHA/ACC) guidelines.",
             "The 2017 AHA/ACC Hypertension Clinical Practice Guidelines, which define Normal (<120/<80), Elevated (120-129/<80), Stage 1 (130-139 or 80-89), Stage 2 (>=140 or >=90), and Hypertensive Crisis (>180 or >120)."),
            
            ("Which clinical guideline do you follow for Diabetes?",
             "The American Diabetes Association (ADA 2024) Standards of Care.",
             "The ADA 2024 Standards of Care: Fasting Glucose <100 mg/dL (Normal), 100-125 mg/dL (Pre-diabetes), >=126 mg/dL (Diabetes); Random Glucose <140 mg/dL (Normal), 140-199 mg/dL (Pre-diabetes), >=200 mg/dL (Diabetes)."),
            
            ("Why is the BMI cutoff for Asian Indians lower than Western standards?",
             "Because Indians develop diabetes and heart disease at lower body weights due to higher body fat percentages.",
             "Per ICMR and WHO Asian classification, overweight begins at BMI >= 23.0 (vs 25.0 Western) and obesity at BMI >= 25.0 (vs 30.0 Western) due to the 'Asian Indian Phenotype' characterized by greater visceral adiposity and insulin resistance."),
             
            ("What is a Hypertensive Crisis and what action does the app take?",
             "When blood pressure exceeds 180 over 120; the app triggers an immediate red emergency alert to rush the patient to hospital.",
             "SBP > 180 mmHg or DBP > 120 mmHg indicates impending target organ damage (stroke, myocardial infarction). The app bypasses routine referral and instructs immediate emergency 108 ambulance transfer."),
             
            ("How does the app handle hypoglycemia (low blood sugar)?",
             "If sugar drops below 70 mg/dL, it gives urgent instructions to feed the patient sugar or glucose immediately.",
             "Blood glucose < 70 mg/dL triggers the acute hypoglycemia protocol: administer 15-20g of fast-acting oral carbohydrates (glucose powder, fruit juice, sugar) and re-test in 15 minutes per ADA guidelines."),
             
            ("Why is Mean Arterial Pressure (MAP) clinically useful?",
             "It shows the average pressure delivering blood to vital organs like the brain and kidneys.",
             "MAP represents the perfusion pressure seen by organs. A MAP below 65 mmHg indicates shock/hypoperfusion, while MAP above 110 mmHg indicates dangerous systemic vascular resistance.")
        ]),

        # CATEGORY 14: ThinkLets & Clinical Decision Pathways
        ("Category 14: ThinkLets & Clinical Decision Pathways", [
            ("What is a ThinkLet in your application?",
             "A step-by-step clinical counseling checklist that guides the health worker on what advice to give the patient.",
             "A ThinkLet is an atomic, modular clinical counseling protocol based on the concept of cognitive facilitation. It provides structured guidance on dietary, physical, and medical lifestyle interventions tailored to the patient's risk profile."),
            
            ("How are ThinkLets selected for a patient?",
             "The app automatically picks the right ThinkLet based on the patient's vitals and risk tier.",
             "The CDSS maps calculated risk factors to specific ThinkLet modules: e.g., elevated BP triggers the 'Sodium & DASH Diet' ThinkLet; elevated blood sugar triggers the 'Glycemic Control & Carb Reduction' ThinkLet."),
            
            ("What topics do the ThinkLets cover?",
             "Salt reduction, daily walking, stopping tobacco, recognizing danger signs, and taking prescribed medicines.",
             "Modules cover Dietary Sodium Restriction (<5g/day), Aerobic Physical Activity (150 min/week), Tobacco/Bidi Cessation, Diabetic Foot Care, Medication Adherence, and Acute Red-Flag Recognition."),
             
            ("Are ThinkLets available when the phone is offline?",
             "Yes, all ThinkLet guides are stored permanently inside the phone's database.",
             "ThinkLets are compiled as static clinical data objects and stored locally in IndexedDB, guaranteeing 100% offline availability without server calls."),
             
            ("Can the health worker record that a counseling session was completed?",
             "Yes, the worker checks off the topics discussed and saves the session.",
             "The completion state, topics covered, and scheduled follow-up date are saved to `counselling_sessions` in IndexedDB and queued for cloud synchronization."),
             
            ("How do ThinkLets improve healthcare quality in villages?",
             "They ensure that every patient receives accurate, standardized medical advice rather than informal or forgotten guidance.",
             "ThinkLets eliminate cognitive variance, ensuring that even newly recruited ASHA workers deliver evidence-based counseling standardized across public health guidelines.")
        ]),

        # CATEGORY 15: Artificial Intelligence, Google Gemini 2.0 Flash & Prompt Engineering
        ("Category 15: AI, Gemini 2.0 Flash & Prompt Engineering", [
            ("What is Google Gemini 2.0 Flash?",
             "Google's newest and fastest AI model, built for rapid responses and strong reasoning.",
             "Gemini 2.0 Flash is Google's next-generation multimodal LLM optimized for ultra-low latency, high throughput, and cost-efficient inference with strong multilingual capabilities."),
            
            ("Why is low latency crucial for this application?",
             "Because health workers in the field cannot wait 20 seconds for an answer while treating a patient.",
             "Gemini 2.0 Flash delivers time-to-first-token in under 600ms, providing a responsive conversational copilot experience even over sluggish 3G/4G cellular connections."),
            
            ("What is Prompt Engineering and how did you use it?",
             "It is the science of writing exact instructions to guide the AI to behave like a safe, professional medical assistant.",
             "We designed a structured system prompt establishing Persona (Indian CHW Assistant), Clinical Scope (NCDs, maternal health, triage), Negative Constraints (no prescription dosages), and Output Formatting (bulleted action points in local languages)."),
             
            ("What is Knowledge Grounding?",
             "Giving the AI verified medical guidelines so it answers from official facts instead of guessing.",
             "Grounding injects curated, domain-specific text snippets (ICMR/WHO clinical manuals) into the prompt context, anchoring the model's responses to authoritative public health protocols."),
             
            ("Can Gemini 2.0 Flash understand Indian medical terms like 'ASHA' or 'Sub-center'?",
             "Yes, it has strong pre-trained knowledge of Indian healthcare systems.",
             "Gemini's extensive multi-corpus training encompasses Indian public health terminology (ASHA, ANM, PHC, CHC, Anganwadi, RCH) and regional epidemiological contexts."),
             
            ("How do you manage the context length of chat conversations?",
             "We send only the last few messages to keep the request lightweight and fast.",
             "We maintain a sliding window of the last 6-10 conversation turns in the request payload, preserving contextual continuity while bounding token consumption.")
        ]),

        # CATEGORY 16: Chatbot Safety, Red-Flag Interceptors & Obstetric Emergencies
        ("Category 16: Chatbot Safety & Obstetric Red-Flags", [
            ("What is the Red-Flag Interceptor in the chatbot?",
             "A safety scanner that immediately detects life-threatening emergencies and gives urgent first-aid instructions without waiting for the AI.",
             "A deterministic regex-based safety filter in `api/chat.js` that evaluates incoming queries for critical clinical danger signs, bypassing generative LLM inference to deliver immediate emergency instructions."),
            
            ("What emergency situations does the red-flag filter detect?",
             "Pregnant women with severe high blood pressure, bleeding, seizures, chest pain, or loss of consciousness.",
             "Severe Pre-Eclampsia / Imminent Eclampsia, Antepartum Hemorrhage, Acute Myocardial Infarction, Hypertensive Encephalopathy, and Severe Dehydration in infants."),
            
            ("Why is pregnant woman with high BP a medical emergency?",
             "Because it can lead to Eclampsia—convulsions, brain damage, or death of mother and baby.",
             "Pre-eclampsia can rapidly progress to Eclampsia (generalized tonic-clonic seizures), placental abruption, HELLP syndrome, and maternal/fetal mortality. It requires immediate parenteral Magnesium Sulfate and urgent delivery at a First Referral Unit (FRU)."),
             
            ("Why bypass the AI model during emergencies?",
             "Because AI might write a polite, slow paragraph when every second counts for the mother's life.",
             "Generative models can introduce latency (2-5s), conversational fluff, or ambiguous phrasing. Deterministic code returns standardized, life-saving protocols in 10 milliseconds."),
             
            ("What first-aid advice does the app give for severe pre-eclampsia?",
             "Call 108 ambulance immediately, turn the mother on her left side, keep airway clear, and accompany her to hospital.",
             "Immediate 108 escalation, left lateral decubitus positioning (prevents vena cava compression), airway maintenance, and accompaniment with Mother-Child Health (MCH) record card."),
             
            ("Does the red-flag alert notify doctors automatically?",
             "The CHW generates an Emergency Referral in the app which flags the PHC doctor's portal in red.",
             "The worker triggers an 'Emergency' referral in `referrals`, updating the doctor dashboard with an urgent red badge and audio-visual alert.")
        ]),

        # CATEGORY 17: Multilingual Architecture & Localization (i18n)
        ("Category 17: Multilingual Architecture & Localization", [
            ("Which languages are supported in the CHW Toolkit?",
             "English, Hindi, Kannada, and Marathi.",
             "English (`en`), Hindi (`hi`), Kannada (`kn`), and Marathi (`mr`), providing native coverage for the Belagavi border region and central/southern India."),
            
            ("How is language switching handled in the code?",
             "Through a Language Context that provides a `t()` translation function.",
             "`LanguageContext.jsx` exposes a `t(key)` helper that looks up keys in the active locale dictionary, defaulting to English if undefined, and saves user choice to `localStorage`."),
            
            ("How many translation keys exist and are any missing?",
             "There are exactly 209 translation keys, and all 4 languages have 100% complete translations.",
             "Our automated Vitest suite (`translations.test.js`) parses all 4 dictionaries and verifies that exactly 209 keys match bidirectionally with zero missing translations."),
             
            ("How do you render Kannada and Hindi fonts when the phone has no internet?",
             "We included the Google Noto Sans font files directly inside the application files.",
             "We bundle `@fontsource/noto-sans-kannada` and `@fontsource/noto-sans-devanagari` WOFF2 fonts into the production bundle, cached by the Service Worker for zero-network font rendering."),
             
            ("Why did you choose Kannada and Marathi specifically?",
             "Because our college is in Belagavi, Karnataka, which borders Maharashtra, where both languages are spoken daily.",
             "Angadi Institute of Technology and Management is located in Belagavi, a bilingual border district where rural frontline workers communicate interchangeably in Kannada and Marathi."),
             
            ("Can the chatbot respond in Kannada and Marathi?",
             "Yes, the AI detects the selected language and replies in that language.",
             "The serverless function passes the user's `locale` parameter in the prompt context, instructing Gemini 2.0 Flash to synthesize medical explanations directly in the requested vernacular script.")
        ]),

        # CATEGORY 18: Testing, Code Quality & Vitest
        ("Category 18: Testing, Code Quality & Vitest", [
            ("What testing framework did you use and why?",
             "Vitest, because it runs extremely fast and integrates natively with Vite.",
             "Vitest 2.1.8 is Vite-native, sharing the same configuration, plugins, and transform pipeline. It provides sub-second execution, native ESM support, and Jest-compatible assertion syntax."),
            
            ("How many automated tests are in the project?",
             "101 tests across 7 test files, and all 101 tests pass 100%.",
             "The project maintains 101 unit and benchmark tests across 7 test suites covering crypto, prediction engine, sync manager, translations, auth, thinklets, and dexieDb."),
            
            ("How do you test the encryption system?",
             "We encrypt text, decrypt it, and check that it matches the original text perfectly.",
             "`crypto.test.js` tests key derivation, AES-GCM encryption/decryption round-trip, validates that distinct nonces produce unique ciphertexts for identical plaintext, and verifies error handling for corrupted tags."),
            
            ("How do you test the clinical prediction engine?",
             "We test boundary numbers for blood pressure and sugar to make sure every stage is classified correctly.",
             "`predictionEngine.test.js` tests exact cutoff values (e.g., SBP 119 vs 120, 139 vs 140, 179 vs 180) to mathematically verify conformity to AHA/ACC and ADA clinical thresholds."),
            
            ("What is ESLint and what is its status in your project?",
             "ESLint is a code quality checker that catches errors; our project has 0 errors and 0 warnings.",
             "ESLint 9.17.0 runs via `npm run lint`. It enforces React 19 rules of hooks, catches unhandled promises, prevents unused variables, and reports clean compliance across the entire codebase."),
             
            ("What is the prebuild script in your project?",
             "`scripts/check-env.mjs`, which verifies that required environment variables are set before building.",
             "A Node.js prebuild hook (`check-env.mjs`) that inspects `process.env` before Rollup compilation, verifying the presence of Supabase URLs without exposing credential values in logs.")
        ]),

        # CATEGORY 19: Deployment, CI/CD & Production Hosting (Vercel)
        ("Category 19: Deployment, CI/CD & Production Hosting", [
            ("Where is your application hosted and what is the live URL?",
             "It is hosted on Vercel at https://chw-major-project.vercel.app.",
             "The production frontend and serverless functions are deployed on Vercel's Edge Network connected to GitHub repository branch `main`."),
            
            ("What happens when you push code to GitHub?",
             "Vercel automatically detects the push, runs tests, builds the project, and updates the live website.",
             "Continuous Integration and Continuous Deployment (CI/CD) automatically triggers on git push. Vercel runs `npm run prebuild`, compiles static assets with Vite, packages serverless lambdas, and atomic-swaps the production deployment."),
            
            ("How do you keep your API keys and database passwords safe on Vercel?",
             "They are stored in Vercel's encrypted Environment Variables dashboard, not in Git.",
             "Sensitive secrets (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are stored in Vercel's encrypted environment vault, accessible strictly to serverless execution environments and excluded from client bundles."),
             
            ("What is the production bundle size of your app?",
             "The total compressed code bundle is only a few hundred kilobytes, loading in under one second.",
             "Thanks to Vite Rollup code-splitting, the main JavaScript chunk is approximately 180KB gzipped, and CSS is under 25KB, ensuring rapid loading even on 2G rural mobile connections."),
             
            ("What is HTTPS and why is it mandatory for this app?",
             "HTTPS is encrypted web communication; it is required for Service Workers and Web Crypto to work.",
             "W3C security standards mandate HTTPS (TLS 1.3) for Service Workers and the Web Crypto API (`window.crypto.subtle` is undefined on insecure HTTP origins)."),
             
            ("How do you monitor application errors in production?",
             "Using Vercel Serverless Function logs and health check endpoints.",
             "Real-time invocation logs, execution latencies, and HTTP status codes are monitored via Vercel Runtime Logs and the `/api/health` monitoring probe.")
        ]),

        # CATEGORY 20: Healthcare Domain, Ethics, Limitations & Future Scope
        ("Category 20: Healthcare Domain, Ethics & Future Scope", [
            ("What are the ethical considerations of using AI in healthcare?",
             "Patient safety comes first: AI must never prescribe medicines on its own or replace human doctors.",
             "Ethical principles mandate Beneficence, Non-Maleficence, and Accountability. The AI copilot is strictly non-prescriptive, adheres to explainable decision pathways, protects patient privacy, and requires human clinician oversight."),
            
            ("What is the Digital Personal Data Protection Act (DPDPA 2023) and how do you comply?",
             "India's new data privacy law that requires keeping citizens' personal information secure and encrypted.",
             "DPDPA 2023 mandates purpose limitation, data minimization, and robust security safeguards for digital health data. Our client-side AES-256 encryption and role-based RLS ensure compliance."),
            
            ("What are the main limitations of your project today?",
             "The AI chatbot requires internet, and vitals must be typed in manually.",
             "1. Generative AI requires cloud connectivity; 2. Manual entry of vitals introduces human error risk; 3. Encryption keys are currently session-scoped on a single device rather than synchronized via public-key infrastructure."),
             
            ("What is Ayushman Bharat Digital Mission (ABDM) and how can your project connect to it?",
             "It is India's national digital health registry; our app can connect to it to link patient records using their ABHA ID.",
             "ABDM provides national digital health infrastructure. Future integration will connect to the ABHA (Ayushman Bharat Health Account) API and Unified Health Interface (UHI) for standardized longitudinal health record exchange across Indian hospitals."),
             
            ("How could you automate vitals collection in the future?",
             "By connecting digital blood pressure monitors and glucometers to the phone via Bluetooth.",
             "Utilizing the Web Bluetooth API to connect directly to standard Bluetooth Low Energy (BLE) blood pressure cuffs and glucometers for automated, error-free vitals ingestion."),
             
            ("Can this project run offline on-device AI in the future?",
             "Yes, by using new compact AI models that can run directly inside mobile phones.",
             "By quantizing Small Language Models (SLMs) such as Google Gemma 2B or Microsoft Phi-3 to 4-bit precision and running them via WebGPU directly in mobile browser hardware, achieving true offline generative AI."),
             
            ("How does your project contribute to rural women's empowerment?",
             "It gives village ASHA workers professional digital tools that earn them greater respect and efficiency in their communities.",
             "ASHA workers are all women recruited from their local villages. Giving them modern digital clinical tools elevates their status, reduces their unpaid administrative overtime, and improves maternal-child survival rates."),
             
            ("What was your role in this project as an engineering student?",
             "Designing the architecture, building the offline-first database, implementing encryption, and creating the clinical decision algorithms.",
             "Collaborating on full-stack engineering: implementing the React 19 PWA, engineering the Dexie dual-database proxy, developing the Web Crypto AES-GCM security pipeline, codifying the AHA/ACC CDSS algorithms, and integrating the Gemini 2.0 Flash serverless AI copilot."),
             
            ("What did you learn during this final year project?",
             "How to build mission-critical, secure software that solves real-world human problems under tough constraints.",
             "Mastering offline-first distributed systems, cryptographic key management, clinical decision support algorithms, modern serverless architecture, and designing software for social impact."),
             
            ("What is your final message to the examination panel?",
             "The CHW Toolkit proves that modern technology can reach the most remote villages to save lives and make healthcare accessible to all.",
             "The CHW Toolkit demonstrates that high-performance cloud technologies, edge cryptography, and clinical artificial intelligence can be harmonized to empower frontline workers and bridge the rural healthcare divide.")
        ])
    ]

    total_q = 0
    for cat_name, qas in categories:
        b.h2(cat_name)
        for q, s_ans, t_ans in qas:
            total_q += 1
            b.viva_qa(total_q, q, s_ans, t_ans, category=cat_name)

    print(f"Total Viva Questions generated: {total_q}")

