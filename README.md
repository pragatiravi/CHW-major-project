# Community Health Worker (CHW) Healthcare Toolkit

A role-based React web application for community screening, deterministic clinical decision support, emergency referrals, medication workflows, patient self-service, program supervision, and system administration.

> **Clinical Disclaimer**: This application is a demonstration prototype built with synthetic data for trained community health personnel. Risk scores follow deterministic rules informed by AHA hypertension and ADA diabetes guidelines. It does not establish an autonomous medical diagnosis, replace laboratory confirmation, or substitute for qualified clinical judgment.

---

## 🌟 Key Features

- **Community Health Worker (CHW) Workspace**: Patient registration, 7-step guided screening wizard, AHA/ADA risk stratification, ThinkLets interactive patient counselling, medication delivery tracking, and offline batch sync.
- **Medical Officer / Clinician Workspace**: Priority referral triage queue, historical patient vitals review, clinical medication ordering, and referral approval/decline workflows.
- **Patient & Family Health Portal**: Bilingual health passport, daily medication adherence checklist with missed-dose tracking, simulated prescription OCR, family health circle, and appointment booking.
- **Supervisor Dashboard**: Population risk analytics, CHW field coverage metrics, referral pipeline performance, and CSV / PDF report exports.
- **System Administrator Portal**: Facility registry management, clinical scoring cutoffs configurator, algorithm benchmark lab (5 clinical test cases), and HL7 FHIR R4 JSON bundle exporter.
- **Cross-Cutting UX**: Light/dark themes, multilingual support (English, Hindi, Marathi, Telugu), unread notification drawer, global search, and accessible keyboard controls.

---

## 🏗️ Architecture

```text
Browser Client
  React 19 + Vite
    App.jsx                         Application & session orchestration
    components/layout               App shell, navigation, theme & language controls
    components/{role}               Role-specific portals (CHW, Doctor, Patient, Supervisor, Admin)
    components/shared               Drawers, toasts, detail modals, and reusable UI
    utils/predictionEngine.js       Guideline-informed AHA/ADA risk scoring engine (CDSS)
    utils/pdfExport.js              Escaped print & CSV export utilities
    data/initialData.js             Synthetic seed records
  Client Storage
    sessionStorage                  Active user session persistence
    localStorage                    Offline screening queue, patient records, sync logs
```

---

## 🧠 Clinical Decision Support Engine (CHW-CDSS v2.4.1)

The application incorporates a **Deterministic, Guideline-Informed Decision Support System**. It relies on transparent, explainable expert algorithms rather than black-box machine learning models, ensuring 100% auditability and clinical safety.

### Clinical Guidelines Implemented
1. **AHA/ACC 2017 Hypertension Guidelines** (American Heart Association / American College of Cardiology)
2. **ADA 2024 Standards of Care in Diabetes** (American Diabetes Association)
3. **WHO PEN Guidelines** (Package of Essential Noncommunicable Disease Interventions)

---

### Configurable Scoring Models

Administrators can toggle between **3 risk calculation algorithms**:

#### 1. Guideline Ensemble Score (Default)
Combines categorical clinical thresholds with continuous non-linear vital sign penalties and risk factors.

##### Hypertension Risk Formula
$$\text{RawHypertensionScore} = \text{BasePoints} + 0.65 \times \max(0, \text{Systolic} - 120)$$
$$\text{Hypertension Risk \%} = \min(99, \max(5, \text{RawHypertensionScore}))$$

- **Blood Pressure Cutoffs (AHA 2017)**:
  - **Hypertensive Crisis** ($\ge 180 / \ge 120$ mmHg): **+55%**
  - **Stage 2 Hypertension** ($\ge 140 / \ge 90$ mmHg): **+38%**
  - **Stage 1 Hypertension** ($130\text{--}139 / 80\text{--}89$ mmHg): **+22%**
  - **Elevated BP** ($120\text{--}129 / <80$ mmHg): **+12%**
- **Demographic & Behavioral Factors**:
  - Age $\ge 60$: **+18%** | Age $45\text{--}59$: **+10%**
  - Obesity ($\text{BMI} \ge 30$): **+15%** | Overweight ($\text{BMI } 25\text{--}29.9$): **+8%**
  - Active Tobacco: **+14%** | Hereditary History: **+12%** | Sedentary: **+8%** | Alcohol: **+6%**
- **Symptom Flags**:
  - Chest Pain / Angina: **+28%** *(Triggers Emergency Red Flag)*
  - Vascular Headache / Dizziness: **+12%**

##### Diabetes Risk Formula
$$\text{ScoringBaseline} = \begin{cases} 100 & \text{Fasting} \\ 140 & \text{Postprandial} \\ 200 & \text{Random} \end{cases}$$
$$\text{RawDiabetesScore} = \text{BasePoints} + 0.38 \times \max(0, \text{Glucose} - \text{ScoringBaseline})$$
$$\text{Diabetes Risk \%} = \min(99, \max(5, \text{RawDiabetesScore}))$$

- **Glucose Tiers (ADA 2024)**:
  - **Severe Hyperglycemia** ($\ge 300$ mg/dL): **+55%**
  - **Diabetic Range** ($\ge 126$ Fasting / $\ge 200$ Random): **+38%**
  - **Prediabetes** ($100\text{--}125$ Fasting / $140\text{--}199$ Postprandial): **+20%**
- **Osmotic Symptoms**:
  - Polyuria: **+12%** | Polydipsia: **+12%** | Blurred Vision: **+10%** | Fatigue: **+6%**

---

#### 2. Multivariable Logistic Risk Formula
Calculates probabilistic risk using a logistic sigmoid equation:
$$P(X) = \frac{1}{1 + e^{-z}}$$

- **Hypertension Logit ($z_{\text{HT}}$)**:
  $$z_{\text{HT}} = -3.5 + 0.035(\text{Systolic}) + 0.04(\text{Diastolic}) + 0.03(\text{Age}) + 0.04(\text{BMI}) + 0.8(\text{Smoking})$$

- **Diabetes Logit ($z_{\text{DB}}$)**:
  $$z_{\text{DB}} = -3.8 + 0.022(\text{Glucose}) + 0.05(\text{BMI}) + 0.025(\text{Age}) + 0.9(\text{FamilyHistory})$$

---

#### 3. Hierarchical Clinical Decision Tree
Evaluates risk using sequential branching nodes:
1. `Systolic >= 180 OR Chest Pain` $\rightarrow$ **95% Probability (Critical)**
2. `Systolic >= 140 AND Age >= 45` $\rightarrow$ **78% Probability (High)**
3. `Systolic >= 130 OR BMI >= 28` $\rightarrow$ **48% Probability (Moderate)**
4. `Otherwise` $\rightarrow$ **12% Probability (Low)**

---

### Triage Matrix & Clinical Action Plan

| Risk Level | Trigger Criteria | Automated Clinical Action |
|---|---|---|
| **Critical** | $\text{BP} \ge 180/120$ or Glucose $\ge 300$ or Chest Pain | Urgent 24–48h Emergency Referral; Alert Medical Officer; 2-day follow-up. |
| **High** | $\text{BP} \ge 140/90$ or Glucose $\ge 126$ Fasting / $\ge 200$ Random | 7-day Primary Care consultation; Lab confirmation (HbA1c/BP series). |
| **Moderate** | $\text{BP} \ge 130/80$ or Glucose $\ge 100$ Fasting / $\ge 140$ Random | 14-day CHW re-screening; ThinkLets sodium/dietary counselling. |
| **Low** | Normal Vitals & No Symptoms | Routine healthy lifestyle maintenance; 30–60 day annual follow-up. |

---

## 🌐 Interoperability & Data Standards

- **HL7 FHIR R4 Bundle Export**: Generates compliant FHIR R4 JSON bundles containing `Patient`, `Observation`, and `DiagnosticReport` resources mapped to standard LOINC codes:
  - `85354-9`: Blood Pressure Panel (Systolic / Diastolic)
  - `2339-0`: Glucose measurement
  - `39156-5`: Body Mass Index (BMI)
- **Printable Medical Summaries**: HTML-escaped print export for physical clinical referral slips and patient health passports.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Execution

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pragatiravi/CHW-major-project.git
   cd CHW-major-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Demo Access Personas

The application includes built-in demo personas for evaluator sessions:

| Role | Demo Name | Institutional Email | Key Workflows |
|---|---|---|---|
| **CHW** | Sunita Patil | `sunita.patil@communityhealth.org` | Screening, vitals entry, ThinkLets counselling, offline sync |
| **Doctor** | Dr. Ananya Roy (M.D.) | `ananya.roy@districtmed.org` | Referral triage, medication orders, clinical notes |
| **Patient** | Priya Sharma | `priya.sharma@patienthealth.net` | Health passport, daily med checklist, appointment booking |
| **Supervisor** | Vikram Singh | `vikram.singh@subdistrictops.org` | Population risk analytics, CHW coverage, CSV reporting |
| **Admin** | Admin Operations | `admin.lead@healthsystem.gov` | Facility registry, scoring model lab, FHIR R4 bundle export |

---

## 🧪 Quality Gates & Testing

Run automated tests and quality checks:

```bash
# Run unit tests (prediction engine & export escaping checks)
npm test

# Run ESLint check
npm run lint

# Build production bundle
npm run build
```

---

## 📄 License

This project is released under the **MIT License**.
