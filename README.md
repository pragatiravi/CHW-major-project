# Community Health Worker Healthcare Toolkit

A role-based React prototype for community screening, deterministic clinical decision support, referrals, medication workflows, patient self-service, program supervision, and system administration.

> This repository is a demonstration system built with synthetic data. It is not a production electronic medical record, diagnostic device, or substitute for qualified clinical judgment.

## Features

- Community Health Worker workspace: patient registration, seven-step screening, guideline-informed risk scoring, counselling, referrals, medications, follow-ups, and simulated offline sync.
- Medical Officer workspace: referral triage, patient record review, medication orders, and clinical notes.
- Patient workspace: health overview, medication checklist, scripted bilingual guidance, simulated prescription scanning, family health circle, and appointment booking.
- Supervisor workspace: population analytics, CHW activity, referral operations, and CSV/print reporting.
- Administrator workspace: facility registry, clinical scoring cutoffs, benchmark verification, FHIR R4 bundle export, and demonstration audit logs.
- Cross-cutting UI: responsive role navigation, light/dark themes, multilingual labels, notifications, and keyboard-accessible controls.

## Architecture

```text
Browser
  React 19 + Vite
    App.jsx                         application/session orchestration
    components/layout              authenticated shell and navigation
    components/{role}              role-specific workspaces
    components/shared              drawers, notifications, and reusable UI
    utils/predictionEngine.js      deterministic AHA/ADA-informed scoring
    utils/pdfExport.js             escaped print and CSV export helpers
    data/initialData.js            synthetic seed records
  Supabase Auth                    validated identity and persisted sessions
  Supabase Data API + Postgres     Medical Officer patient and medication data
  localStorage                     remaining prototype-only role workflows
```

The Medical Officer workspace now loads facility-authorized patient records and saves medication orders through Supabase. Other role workflows still use the synthetic browser-local data set while they are migrated incrementally.

## Core Data Model

Patient records are plain JavaScript objects with these major groups:

- Identity: `id`, `name`, `age`, `gender`, `phone`, `address`/`village`.
- Measurements: `systolic`, `diastolic`, `glucose`, `glucoseType`, `height`, `weight`, `bmi`.
- Risk inputs: symptoms, family history, smoking, alcohol, and activity status.
- Decision-support result: overall risk, hypertension and diabetes categories, factor explanations, referral requirement, and follow-up interval.
- Care workflow: referral, medicines, counselling sessions, reports, assigned CHW, and sync metadata.

The scoring engine is deterministic and guideline-informed. It does not load a trained machine-learning model and must not be described as autonomous diagnosis.

## Getting Started

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

### Supabase backend

The repository contains versioned Supabase configuration and the initial health schema:

```text
supabase/config.toml
supabase/migrations/20260819092330_initial_health_schema.sql
```

Authenticate the CLI with a personal access token, link the hosted project, and apply the migration:

```bash
npx supabase login --token YOUR_PERSONAL_ACCESS_TOKEN
npx supabase link --project-ref lwgobzgznhdockdptmcf
npx supabase db push
```

The migration creates facilities, profiles, patients, assignments, encounters, vitals, screenings, medication orders, referrals, and audit logs. Every exposed table has Row Level Security and explicit Data API grants.

To provision synthetic test users and records, copy `.env.supabase.example` to `.env.supabase.local`, add a temporary server secret key and strong demo password, then run:

```bash
npm run seed:supabase
```

The secret key is server-only. Never add it to `.env.local`, a `VITE_` variable, browser code, or source control. Remove it from `.env.supabase.local` after provisioning.

### Demo credentials

When `VITE_ENABLE_DEMO_ACCESS=true`, select the matching role and email shown by the sign-in page. The browser-only evaluator password is:

```text
clinical@123
```

With demo access disabled, the sign-in form uses Supabase Auth and verifies the selected workspace against the protected `profiles.role` value.

One-click persona access and in-app role switching are disabled by default. For a controlled evaluator session using synthetic data only:

```bash
copy .env.example .env.local
```

Then set `VITE_ENABLE_DEMO_ACCESS=true` and restart Vite. Never enable this flag for a deployment containing real or sensitive data.

## Quality Gates

```bash
npm run lint
npm test
npm run build
```

Vitest runs the five clinical benchmark fixtures plus export escaping checks. GitHub Actions executes installation, linting, tests, and the production build for pushes and pull requests.

## Security and Privacy Scope

Implemented prototype safeguards:

- Supabase email/password authentication, session restoration, sign-out, and password recovery.
- Server-controlled role verification; authorization never trusts editable user metadata.
- RLS on every exposed application table with facility, assignment, ownership, and role checks.
- Explicit Data API privileges and no anonymous clinical-data access.
- Atomic Medical Officer medication updates with append-only audit entries.
- Cloud patient records are not copied into browser `localStorage`.
- One-click evaluator bypass disabled unless explicitly configured.
- HTML escaping for patient-derived printable report fields.
- Spreadsheet-formula-aware CSV export handling is recommended before production use.
- Session data is cleared on logout.

Production requirements not implemented:

- MFA policy, account lockout policy, staff invitation workflow, and production SMTP.
- Consent records, retention rules, data-minimization enforcement, and centralized monitoring.
- Tamper-evident external audit retention beyond the database audit table.
- Backend validation and sanitization at every trust boundary.

Do not use real patient information with this prototype.

## Known Limitations and Next Architecture Phase

- CHW, patient, supervisor, and administrator feature data still uses browser-local persistence.
- Offline sync is simulated and has no server reconciliation or conflict-resolution strategy.
- Password recovery requires Supabase email delivery configuration.
- The health guidance assistant is scripted; it is not connected to an LLM or clinical service.
- Prescription OCR and nearby-facility GIS behavior are simulated.
- FHIR output is a client-generated R4 collection bundle and is not transmitted to an external health information exchange.
- Accessibility has received incremental keyboard and semantic improvements but still requires a formal WCAG audit with assistive technologies and contrast measurement.
- A production version needs an authenticated API, database, object storage for reports/labs, queue-backed sync, and server-enforced authorization.

## Clinical Disclaimer

Risk scores follow project-defined deterministic rules informed by AHA hypertension and ADA diabetes thresholds. They support trained personnel; they do not establish a diagnosis, replace laboratory confirmation, or replace a licensed clinician.
