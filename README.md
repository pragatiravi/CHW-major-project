# Community Health Worker (CHW) Healthcare Toolkit

An offline-first, clinical decision support Progressive Web App (PWA) designed for frontline Community Health Workers (ASHAs) and Primary Health Centres in rural India (Karnataka & Maharashtra). Built with React 19, Vite 8, Dexie.js (IndexedDB), Supabase (PostgreSQL 16-table schema), Web Crypto AES-GCM 256, and Vercel Serverless AI.

> **Clinical Decision Support Disclaimer**: This application is a decision-support and community triage tool intended for trained community healthcare personnel (ASHAs, ANMs, Medical Officers). Risk predictions follow deterministic algorithms informed by American Heart Association (AHA) and American Diabetes Association (ADA) guidelines. It does not provide autonomous clinical diagnoses, replace diagnostic laboratory testing, or prescribe prescription medications.

---

## 🌟 Key Capabilities

- **Frontline CHW Workspace**: Offline-first patient registry, 7-step guided clinical screening wizard, deterministic AHA/ADA risk stratification, interactive ThinkLets audio/visual patient counselling, and automatic background outbox synchronization.
- **Medical Officer Referral Triage**: Priority-sorted referral queue, longitudinal vital trends, clinical medication ordering, and structured referral accept/decline decisions.
- **Patient & Family Health Passport**: Bilingual health passport, daily medication adherence checklist with missed-dose tracking, prescription scanner, and family health circle.
- **Supervisor Dashboard**: Population risk analytics, CHW village coverage metrics, staff registration approval queue (Approve / Suspend / Reject), and CSV / PDF report exports.
- **System Administrator Portal**: Facility registry, clinical scoring cutoffs configurator, algorithm benchmark lab, account status control, and HL7 FHIR R4 JSON bundle exporter.
- **Multilingual & Low-Literacy Support**: 100% key parity across English (`en-IN`), Kannada (`kn-IN`), Hindi (`hi-IN`), and Marathi (`mr-IN`), Web Speech API STT/TTS, and 48px touch targets for mobile accessibility.
- **Clinical Chatbot & Red-Flag Detector**: Deterministic emergency detector (cardiac, stroke, severe dyspnea, hemorrhage, vitals crisis) that immediately triggers emergency guidance (108 Ambulance) before falling back to Vercel Serverless Gemini 1.5 Flash or bundled offline knowledge retrieval.

---

## 🏗️ Technical Architecture

```text
Frontline Device (Mobile PWA / Tablet)
  ├── React 19 + Vite 8 Single Page App
  ├── Offline Storage: Dexie.js (IndexedDB)
  │     ├── patients (PII encrypted at rest via AES-GCM 256)
  │     ├── visits (longitudinal encounters)
  │     ├── referrals, prescriptions, counselling_sessions
  │     └── sync_queue (persistent outbox with exponential backoff)
  ├── Security Layer: Web Crypto API (PBKDF2 100,000 iterations + Device Salt)
  ├── Offline Engine: Fuse.js + Bundled ICMR/WHO-PEN NCD Knowledge Base
  └── Voice Engine: Web Speech API (STT & TTS in kn-IN, hi-IN, mr-IN, en-IN)
          │
          │ (Background Bidirectional Sync when Online)
          ▼
Central Cloud Tier (Supabase & Vercel)
  ├── Supabase Auth (GoTrue JWT, role derived strictly from server-side profiles)
  ├── PostgreSQL Database (16 Normalized Tables with Row-Level Security)
  │     ├── profiles, patients, visits, predictions, counselling_sessions
  │     ├── referrals, doctors, medications, prescriptions, follow_ups
  │     ├── vaccinations, emergency_reports, inventory, inventory_transactions
  │     └── chat_logs, audit_logs
  └── Vercel Serverless Function: POST /api/chat
        ├── Bearer Token Verification & IP Rate Limiting (30 req/min)
        └── Google Gemini 1.5 Flash Proxy with Clinical Guardrails
```

---

## 🗄️ Database Architecture (16 Normalized Tables)

The production Supabase PostgreSQL database implements 16 relational tables with Row-Level Security (RLS) policies:

1. `profiles`: Extends `auth.users` with `role` (`chw`, `doctor`, `supervisor`, `admin`), `status` (`pending`, `approved`, `suspended`, `rejected`), and `subcenter`.
2. `patients`: Demographics, `custom_id`, `legacy_id`, village, encrypted contact details, ABHA ID, and consent tracking.
3. `visits`: Longitudinal vital encounters (systolic, diastolic, glucose, glucose_type, BMI, symptoms, lifestyle). Historical encounters are never overwritten.
4. `predictions`: CDSS audit log capturing risk scores, algorithm used, and clinical flags for each screening.
5. `counselling_sessions`: ThinkLets protocol completion logs, comprehension scores, and audio playback tracking.
6. `referrals`: Bi-directional triage queue linking CHW screening to PHC / CHC facility with urgency tiers (`routine`, `priority`, `emergency`).
7. `doctors`: Hospital clinician registry with specialty and facility affiliations.
8. `medications`: National essential medicines list formulary with strength and dosage forms.
9. `prescriptions`: Clinical medication orders, active status, duration, and instructions.
10. `follow_ups`: Scheduled CHW home visit dates and completion status.
11. `vaccinations`: Adult and community immunization records.
12. `emergency_reports`: Critical distress alerts and SOS logs.
13. `inventory`: Subcentre medical supply stock tracking (glucometer strips, BP cuffs, essential tablets).
14. `inventory_transactions`: Stock additions, dispatches, and expiry adjustments.
15. `chat_logs`: Clinical assistant interactions (logged only when explicit patient consent is granted).
16. `audit_logs`: Immutable security audit trail recording patient views, exports, referral decisions, and role approvals.

---

## 🔒 Security & DPDP Act Compliance

- **Endpoint Protection at Rest**: Sensitive patient PII (`phone`, `address`, `notes`) stored in browser IndexedDB is encrypted using AES-GCM 256. Cryptographic keys are derived in volatile memory via PBKDF2 (100,000 iterations, SHA-256) using a persistent device salt and user identity.
- **Encryption Key Lifecycle**:
  - *On Logout*: The in-memory `CryptoKey` instance is destroyed and garbage-collected; session tokens are removed from `sessionStorage`. The local IndexedDB cache retains ciphertexts safely encrypted on disk.
  - *On a New Device*: Because the PBKDF2 salt is a unique, cryptographically random device salt (`localStorage.getItem('chw_device_salt')`), raw IndexedDB databases cannot be ported between devices. When logging in on a new device, the app syncs clean authorized records directly from the central Supabase PostgreSQL server over TLS.
  - *If Device is Stolen*: An attacker dumping browser IndexedDB files without the user's password and active volatile session memory cannot decrypt patient PII.
- **Server-Side Role Authority**: User roles and approval statuses are enforced by database triggers and RLS policies on the server (`supabase/migrations/20261102000000_auth_hardening.sql`). Client-side role spoofing is blocked by `<RoleGuard />`.
- **Brute-Force Rate Limiting**: Client-side authentication enforces a sliding window lockout after 5 consecutive failed attempts. The `/api/chat` serverless proxy enforces an IP-based limit of 30 requests per minute.
- **Production Demo Gating**: Evaluator demo personas (`*.demo@ruralhealth.org`) require `VITE_DEMO_MODE=true` to function. When disabled in production, demo logins are completely blocked and a visible banner alerts the user whenever demo mode is active.
- **HTTP Security Headers & CSP**: Configured via `vercel.json` with strict Content Security Policy (`connect-src` allowing Supabase REST/WebSockets and Gemini; `img-src` allowing data/blob URLs; strict frame denial and HSTS).
- **PWA Lifecycle & Update Prompt**: Automatic registration via Workbox (`registerSW`) with user reload prompt when a new production bundle is deployed.

---

## 🧪 Automated Testing Suite

The repository includes a rigorous Vitest test suite with **77 passing tests** across 7 test modules, plus automated i18n key parity verification:

```bash
npm test
npm run check:i18n
npm run lint
npm run build
```

- `src/lib/auth.test.js` (21 tests): Role guards, brute-force lockout, session restoration, demo gating, patient self-registration, server-side approval constraints, and user cache isolation.
- `src/lib/chat/chat.test.js` (18 tests): Deterministic red-flag emergency detector, Fuse.js offline retrieval, consent-based chat logging, and the **30-Item Clinical AI & Triage Benchmark**.
- `src/lib/sync/syncEngine.test.js` (13 tests): IndexedDB storage, outbox push queue, conflict resolution (tablet vs clinic), AES-GCM encryption, PBKDF2 device salt derivation, safe logout checks, and local-to-cloud migration on first login.
- `src/lib/speech/speech.test.js` (11 tests): Web Speech STT transcript parsing (BP numbers, decimals), TTS voice controllers, and 4-language dialect mappings.
- `src/utils/predictionEngine.test.js` (7 tests): AHA 2017 hypertension tiers, ADA 2024 glucose thresholds, logistic risk formulas, and decision tree edge cases.
- `src/utils/translations.test.js` (5 tests): 100% key parity across English, Kannada, Hindi, and Marathi dictionaries, and ThinkLets counselling scripts.
- `src/utils/pdfExport.test.js` (2 tests): Escaped clinical printing and CSV sanitization.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v24)
- npm or pnpm

### Installation & Local Setup

1. Clone repository and install dependencies:
   ```bash
   git clone https://github.com/pragatiravi/CHW-major-project.git
   cd CHW-major-project
   npm install
   ```

2. Environment configuration:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your Supabase credentials:
   ```ini
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_DEMO_MODE=true
   ```

3. Run local development server:
   ```bash
   npm run dev
   ```
   The local Vite dev server includes an embedded `/api/chat` serverless middleware so the AI assistant functions locally without 404s.

4. Run test suite & linter:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
