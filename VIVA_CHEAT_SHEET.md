# Community Health Worker (CHW) Healthcare Toolkit
## Comprehensive Viva Defense & Evaluation Cheat Sheet

> **Audience**: Student Engineering Team presenting to academic examiners, external evaluators, and healthcare reviewers.
> **Key Objective**: Deliver a confident, technically precise, and ethically honest defense of the system architecture, clinical decisions, and security model.

---

## 🎯 1. 30-Second Elevator Pitch

> *"The CHW Healthcare Toolkit is an offline-first Progressive Web Application designed for frontline Accredited Social Health Activists (ASHAs) and Primary Health Centres in rural India. Addressing the challenge of intermittent connectivity in rural areas like Belagavi and rural Maharashtra, the system operates completely offline using browser IndexedDB and Web Crypto AES-GCM encryption, synchronizing bidirectionally with a 16-table Supabase PostgreSQL database when network is restored.*
>
> *Unlike unpredictable black-box AI, our clinical decision support uses transparent, auditable algorithms based on AHA 2017 hypertension and ADA 2024 diabetes guidelines, coupled with a deterministic multilingual red-flag triage detector across Kannada, Hindi, Marathi, and English to guarantee emergency safety."*

---

## 🏛️ 2. Core Architectural Pillars

| Component | Technology | Technical Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 | Minimal bundle size (<650 KB gzip), sub-second cold boot on low-cost Android tablets, robust component modularity. |
| **Client Storage** | Dexie.js (IndexedDB) | Transactional, structured NoSQL layer inside the browser; capable of storing thousands of patient encounters offline. |
| **At-Rest Encryption** | Web Crypto API (AES-GCM 256 + PBKDF2) | Protects cached patient PII on stolen or lost frontline devices without relying on third-party native libraries. |
| **Central Database** | Supabase (PostgreSQL 15+) | 16 normalized relational tables with Row-Level Security (RLS) policies enforcing role access directly in the database engine. |
| **Offline Search** | Fuse.js (Fuzzy String Matching) | Sub-15ms client-side retrieval across a bundled 4-language ICMR/WHO-PEN NCD knowledge base with zero network overhead. |
| **AI Assistant** | Vercel Serverless + Gemini 1.5 Flash | Server-side API key proxy with bearer authorization, IP rate limiting (30 req/min), and strict non-prescribing guardrails. |
| **Voice Engine** | Web Speech API (STT & TTS) | Hands-free vitals entry and audio counselling in `kn-IN`, `hi-IN`, `mr-IN`, and `en-IN` for low-literacy field interactions. |

---

## 🗄️ 3. Database Architecture (The 16 Relational Tables)

Examiners often ask: *"How is your database structured?"* or *"Why do you have 16 tables?"*

```text
       ┌───────────────┐          ┌───────────────┐
       │  auth.users   │ ◄─────── │   profiles    │ (Role & Approval Status)
       └───────┬───────┘          └───────┬───────┘
               │                          │
               ▼                          ▼
       ┌───────────────┐ 1:N      ┌───────────────┐
       │   patients    │ ───────► │    visits     │ (Immutable Longitudinal Vitals)
       └───────┬───────┘          └───────┬───────┘
               │                          │
         1:N   │                          │ 1:1
               ├──────────────────────────┼───────────────► ┌───────────────┐
               │                          │                 │  predictions  │ (CDSS Audit Trail)
               ▼                          ▼                 └───────────────┘
       ┌───────────────┐          ┌───────────────┐
       │ prescriptions │          │   referrals   │ ─────►  ┌───────────────┐
       └───────────────┘          └───────────────┘         │    doctors    │
               │                                            └───────────────┘
               ▼
       ┌───────────────┐
       │  medications  │ (Essential Formulary)
       └───────────────┘

Additional Operational Tables:
- counselling_sessions (ThinkLets completion & audio logs)
- follow_ups           (Scheduled home visit calendar)
- vaccinations         (Community immunization records)
- emergency_reports    (SOS critical alert logs)
- inventory            (Subcentre medical supply stock)
- inventory_transactions (Stock additions, dispatches, expiry)
- chat_logs            (Consent-gated clinical assistant history)
- audit_logs           (Immutable security access audit trail)
```

### Key Examiner Questions on Database Design:
- **Q: Why are vitals in a separate `visits` table instead of columns in `patients`?**
  - **Answer**: *"Healthcare data is longitudinal. Overwriting previous blood pressure or glucose readings destroys historical vital trends. The `visits` table maintains an immutable record of every field screening, allowing clinicians to observe whether a patient's hypertension is improving or deteriorating over time."*
- **Q: How is data scoped between different health workers?**
  - **Answer**: *"Through PostgreSQL Row-Level Security (RLS). A frontline CHW's database session can only query patients assigned to their subcentre (`assigned_chw = auth.uid()`), whereas Medical Officers and Supervisors can review all referred patients in their cluster. System administrators cannot bypass audit logging."*

---

## ⚖️ 4. Honesty Audit: Claims vs. Technical Reality

Evaluators respect candidates who clearly distinguish between fully implemented production features and prototype scope boundaries. Use this table to answer honestly:

| Feature Area | Presentation / Report Claim | Real Technical Implementation | Examiner Explanation |
| :--- | :--- | :--- | :--- |
| **Clinical Decision Support (CDSS)** | Deterministic AHA/ADA Guideline Engine | **100% Real**: Implemented in `src/utils/predictionEngine.js` with 3 mathematical models and 7 unit tests. | *"We deliberately chose transparent, guideline-based algorithms over black-box deep learning to guarantee clinical explainability and prevent hallucinated risk scores."* |
| **Emergency Triage Detector** | Multilingual Red-Flag Engine | **100% Real**: Implemented in `src/lib/chat/redFlagDetector.js` covering cardiac, stroke, dyspnea, hemorrhage, and vitals crisis across 4 languages. | *"Runs deterministically before any AI call. If an emergency symptom is detected, the app immediately shows a 108 emergency card and never waits on an AI network response."* |
| **Offline-First Sync Engine** | Bi-directional Outbox & Conflict Resolution | **100% Real**: Implemented in `src/lib/sync/syncEngine.js` using Dexie.js outbox, idempotent upserts, exponential backoff, and conflict resolution modal. | *"Mutations are recorded locally first. When online, pending items push to Supabase. If both field tablet and hospital server modified a record, our UI presents 'Your Tablet Record' vs 'Hospital Server Record' for frontline CHW choice."* |
| **Storage Encryption** | DPDP Act / HIPAA Compliance | **Endpoint Protection at Rest**: Client-side AES-GCM 256 using PBKDF2 derived keys with device salt. | *"It secures cached data on the handheld tablet if physically lost or stolen. It is NOT zero-knowledge end-to-end encryption, because the central PostgreSQL database must process patient records once synced."* |
| **Prescription Scanner** | Prescription OCR Workflow | **Simulated OCR Workflow**: Browser canvas pre-processing with regex parsing of dosage and frequency patterns. | *"The UI and workflow represent an end-to-end simulation. A full production pipeline would deploy an Indian regional handwriting model (e.g. TrOCR or Google Document AI), which was out of scope for this lightweight PWA."* |
| **ABHA Health ID** | Ayushman Bharat Health Account Integration | **Compliant Field & Validator**: ABHA 14-digit format validation (`XX-XXXX-XXXX-XXXX`) and storage in database. | *"The schema is fully ABHA-ready. Live integration with the ABDM sandbox requires government gateway credentials and OTP verification webhooks, which are restricted to registered healthcare facilities."* |
| **Clinical Chatbot** | Hybrid Online/Offline AI Assistant | **Real Hybrid Engine**: Vercel Serverless proxy with Gemini 1.5 Flash + Fuse.js fuzzy search on bundled ICMR/WHO knowledge base. | *"When online and configured, queries route through a server-side proxy preventing API key exposure. When offline or unconfigured, it searches a bundled clinical knowledge base with polite fallback for unknown queries."* |

---

## 🛡️ 5. Security & DPDP Act 2023 Defense

### 1. What is the Digital Personal Data Protection (DPDP) Act 2023 compliance strategy?
- **Data Minimization**: Only vital demographic and clinical attributes required for NCD triage are collected.
- **Explicit Consent**: Consent tracking is recorded with timestamps (`consent_given`, `consent_at`) in `public.patients`.
- **Endpoint Encryption**: PII (`phone`, `address`) stored in browser IndexedDB is encrypted with AES-GCM 256. If a worker leaves their tablet in a rural bus, the raw SQLite/IndexedDB file cannot be extracted in plaintext without the derived key.
- **Audit Logging**: Every view, export, and referral action writes an immutable record to `public.audit_logs`.
- **Purpose Limitation**: Chatbot interactions are only logged if the user explicitly opts in via `consentGiven: true`.

### 2. How is authentication protected against brute-force attacks?
- Client-side sliding window rate limiter in `src/lib/authRateLimiter.js`: 5 consecutive failed sign-in attempts lock the account for 60 seconds.
- Evaluator demo accounts (`*.demo@ruralhealth.org`) are disabled in production builds unless `VITE_DEMO_MODE=true` is explicitly provided.
- Role tampering is prevented by deriving permissions strictly from the server-side `profiles` table rather than user-editable tokens or client cookies.

---

## ❓ 6. Top 8 Tough Examiner Questions & Bulletproof Answers

### Q1: "Why not use a Machine Learning model like Random Forest or XGBoost for screening?"
> **Answer**: *"In frontline healthcare, clinical explainability and regulatory liability are paramount. If a machine learning model assigns an 80% risk score, an ASHA worker cannot explain why to the patient. With our deterministic AHA/ADA engine, every percentage point is traceable to a specific clinical cutoff (e.g., +38% for Stage 2 BP, +15% for obesity). Furthermore, deterministic algorithms execute instantaneously offline without requiring heavy TensorFlow.js runtimes on cheap sub-$100 tablets."*

### Q2: "What happens if a worker is offline for two weeks in a remote village?"
> *"All patient registrations, screening encounters, and counselling logs persist reliably in IndexedDB. Every mutation is queued in the `sync_queue` outbox table. When the tablet re-connects to Wi-Fi at the Primary Health Centre, the sync engine executes with exponential backoff and idempotent upserts on client-generated UUIDs, ensuring zero record duplication."*

### Q3: "What happens if two workers edit the same patient offline?"
> *"Our sync engine implements timestamped conflict detection. If a remote update has occurred since the last sync, the engine flags the record into the `conflicts` table. The CHW is presented with a non-technical comparison modal: 'Your Tablet Record (Field)' vs 'Hospital Server Record (Clinic Cloud)'. The worker can review the vitals side-by-side and choose which version to retain."*

### Q4: "How does the system ensure safety in the clinical chatbot?"
> *"Through a three-layer defense-in-depth architecture:*
> 1. *Layer 1 (Deterministic Red-Flag Detector): Scans for emergency keywords in Kannada, Hindi, Marathi, and English. If detected, it immediately terminates AI execution and displays 108 ambulance instructions.*
> 2. *Layer 2 (System Clinical Prompt): The serverless proxy enforces strict medical guardrails: never prescribe medications, never change dosages, and limit answers to 120 words.*
> 3. *Layer 3 (Offline Fuse.js Fallback): When offline, it only retrieves from verified ICMR/WHO guidelines, returning a humble 'I don't know, consult your Medical Officer' for out-of-domain queries without hallucinating."*

### Q5: "Why did you implement 4 languages (English, Kannada, Hindi, Marathi)?"
> *"Our target deployment covers the Belagavi district of Karnataka, bordering Maharashtra. Frontline ASHA workers in this region frequently communicate in Kannada and Marathi, while national NHM protocols are published in Hindi and English. We achieved 100% translation key parity across all four languages, validated by automated unit tests."*

### Q6: "Why did you use Supabase instead of a custom Express/Node.js backend?"
> *"Supabase provides battle-tested PostgreSQL with Row-Level Security, GoTrue JWT authentication, and automatic connection pooling. Implementing custom backend auth and relational security from scratch would introduce security vulnerabilities and divert time from clinical engineering. Supabase allowed us to implement 16 production-grade relational tables with strict database triggers in a fraction of the time."*

### Q7: "How do you handle low-literacy frontline workers?"
> *"We followed WCAG 2.5.5 and Android accessibility standards: all interactive buttons have a minimum 48px touch target on mobile viewports; color-coded risk badges (green, amber, red, purple) accompany all numerical values; and the Web Speech API allows voice-based vitals entry and audio playback of ThinkLets counselling scripts."*

### Q8: "How do you know your code is reliable?"
> *"We maintain 74 automated unit and integration tests in Vitest covering all core subsystems: risk prediction formulas, Web Speech transcript parsing, AES-GCM encryption key derivation, outbox sync queues, 4-language translation parity, role guards, and a dedicated 30-item clinical AI triage benchmark. The entire suite passes in under 7 seconds."*

---

## 📊 7. 30-Item Clinical AI Benchmark Summary (Quick Reference)

In Phase 3, we evaluated 30 benchmark queries across 3 categories:

1. **10 Emergency Queries (100% Emergency Detection Rate)**:
   - Cardiac chest pain (`en`, `kn`, `hi`, `mr`) -> Flagged `cardiac`, 108 emergency card.
   - Severe dyspnea / choking (`en`, `kn`) -> Flagged `respiratory`, 108 emergency card.
   - Acute stroke / facial droop (`hi`, `mr`) -> Flagged `stroke`, 108 emergency card.
   - Hypertensive crisis (BP 220/130) -> Flagged `critical_vitals`.
   - Hyperglycemic crisis (Sugar 480 mg/dL) -> Flagged `critical_vitals`.
2. **10 Non-Emergency NCD Clinical Inquiries (100% Guideline Retrieval Rate)**:
   - Normal fasting sugar, salt restriction, ragi/millet diet, hypoglycemia 15-rule, medication adherence across all 4 languages -> Accurately retrieved from bundled ICMR/WHO knowledge base with zero false emergency alarms.
3. **10 Out-Of-Domain Non-Clinical Inquiries (0% Hallucination Rate)**:
   - Mechanics, astronomy, pop culture, cricket, politics, weather across all 4 languages -> Accurately caught and returned polite "I don't know, consult doctor" fallback without fabricating advice.
