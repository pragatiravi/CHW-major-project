import { 
  Heart, 
  BrainCircuit, 
  WifiOff, 
  Hospital, 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  UserCheck, 
  ArrowRight,
  Database,
} from 'lucide-react';

export default function LandingPage({ 
  onNavigateToAuth, 
  onQuickDemoLogin 
}) {
  const handleOpenAuth = (role) => {
    if (onNavigateToAuth) onNavigateToAuth(role);
  };

  const handleDemoLaunch = (role) => {
    if (onQuickDemoLogin) onQuickDemoLogin(role);
    else handleOpenAuth(role);
  };

  return (
    <div className="public-landing-container">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* 1. PROFESSIONAL NAVIGATION TOPBAR */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="brand-icon-box">
              <Heart size={22} />
            </div>
            <div>
              <span className="brand-title">CHW Healthcare Toolkit</span>
              <span className="brand-subtitle">Clinical Decision Support & Community EMR</span>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a 
              href="#capabilities" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Capabilities
            </a>
            <a 
              href="#pathway" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('pathway')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Clinical Pathway
            </a>
            <a 
              href="#roles" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Role Solutions
            </a>
          </nav>

          <div className="landing-nav-cta">
            <button 
              className="btn btn-primary"
              onClick={() => handleOpenAuth('chw')}
            >
              Sign In to Workspace <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (2-COLUMN LAYOUT) */}
      <main id="main-content" className="landing-hero" tabIndex="-1">
        <div className="container">
          <div className="landing-hero-grid">
            {/* Left Column: Headline, Description & CTAs */}
            <div className="hero-text-column">
              <span className="hero-eyebrow">
                <BrainCircuit size={14} /> Clinical Decision Support & EMR
              </span>
              <h1 className="hero-headline">
                Intelligent chronic care, built for frontline healthcare.
              </h1>
              <p className="hero-description">
                Empowering Community Health Workers and Clinicians with offline-first risk stratification, standardized counselling protocols, and seamless hospital referral pathways.
              </p>

              <div className="hero-actions">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => handleDemoLaunch('chw')}
                >
                  Launch CHW Field Demo <ArrowRight size={16} />
                </button>
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => handleOpenAuth('chw')}
                >
                  Sign In to Workspace
                </button>
              </div>
            </div>

            {/* Right Column: Real Product Visual Mockup */}
            <div className="hero-visual-column">
              <div className="product-mockup-card">
                <div className="mockup-header">
                  <div>
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Clinical Screening Preview</span>
                    <strong className="text-base text-slate-900 font-bold block mt-0.5">Priya Sharma</strong>
                    <span className="text-xs text-slate-500 font-mono">ID: P7204 • Age 54 • Female</span>
                  </div>
                  <span className="badge badge-risk-high">High Risk</span>
                </div>

                {/* Vitals Row */}
                <div className="mockup-vitals-row">
                  <div className="mockup-vital-card sky">
                    <span className="text-2xs font-bold text-sky-800 uppercase block">Blood Pressure</span>
                    <div className="text-lg font-bold text-sky-950 mt-0.5">158 / 96 <span className="text-xs font-normal text-slate-500">mmHg</span></div>
                    <span className="text-2xs text-sky-700 font-medium block mt-0.5">Stage 2 Hypertension</span>
                  </div>

                  <div className="mockup-vital-card amber">
                    <span className="text-2xs font-bold text-amber-800 uppercase block">Blood Glucose</span>
                    <div className="text-lg font-bold text-amber-950 mt-0.5">142 <span className="text-xs font-normal text-slate-500">mg/dL</span></div>
                    <span className="text-2xs text-amber-700 font-medium block mt-0.5">Fasting Reading</span>
                  </div>
                </div>

                {/* Contributing Factor */}
                <div className="mockup-factor-box">
                  <strong className="text-slate-900 block text-xs mb-1">Key Contributing Clinical Factors:</strong>
                  <div className="text-2xs text-slate-600 space-y-1">
                    <div>• Systolic BP 158 mmHg (&gt; 140 Stage 2 guideline)</div>
                    <div>• Fasting glucose 142 mg/dL with family history</div>
                  </div>
                </div>

                {/* Action Recommendation */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="text-2xs text-slate-600">
                    Recommended: <strong>Doctor Referral & ThinkLets</strong>
                  </div>
                  <span className="badge badge-primary text-2xs">7-Day Recall</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/* 3. CAPABILITY STATISTICS (4 HORIZONTAL EQUAL-HEIGHT CARDS) */}
      <section className="landing-stats-section" id="capabilities">
        <div className="container">
          <div className="stats-grid-horizontal">
            <div className="stat-card-clean">
              <div className="stat-card-number">100%</div>
              <div className="stat-card-title">Offline-First</div>
              <div className="stat-card-sub">Zero internet required in the field</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-card-number">2</div>
              <div className="stat-card-title">Chronic Protocols</div>
              <div className="stat-card-sub">Hypertension & Diabetes guidelines</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-card-number">HL7 FHIR</div>
              <div className="stat-card-title">Interoperable R4</div>
              <div className="stat-card-sub">Standard LOINC medical exports</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-card-number">5</div>
              <div className="stat-card-title">Unified Portals</div>
              <div className="stat-card-sub">CHW, Doctor, Patient, Supervisor, Admin</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE CARDS GRID (3 CLEAN CARDS) */}
      <section className="landing-section">
        <div className="container">
          <div className="section-header-center">
            <span className="section-kicker">Core System Architecture</span>
            <h2 className="section-title">Designed specifically for community care</h2>
            <p className="section-desc">
              Bridging the last-mile gap between household screenings and hospital care.
            </p>
          </div>

          <div className="features-grid-3">
            <div className="feature-card-clean">
              <div className="feature-icon-box">
                <BrainCircuit size={24} />
              </div>
              <h3 className="feature-heading">Explainable Risk Assessment</h3>
              <p className="feature-body">
                Deterministic clinical decision support aligned with AHA and ADA guidelines. Transparent feature attribution explains why each risk level is flagged.
              </p>
            </div>

            <div className="feature-card-clean">
              <div className="feature-icon-box">
                <WifiOff size={24} />
              </div>
              <h3 className="feature-heading">Offline-First Field Care</h3>
              <p className="feature-body">
                Field screenings, patient vitals, and medication tracking persist locally without connectivity. Automated batch synchronization occurs when reconnected.
              </p>
            </div>

            <div className="feature-card-clean">
              <div className="feature-icon-box">
                <Hospital size={24} />
              </div>
              <h3 className="feature-heading">Connected Clinical Workflow</h3>
              <p className="feature-body">
                Closed-loop referral pipeline directly routes high-risk cases from frontline health workers to hospital doctors for fast clinical review and prescription approval.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CLINICAL PATHWAY (5-STEP CONTINUUM OF CARE) */}
      <section className="landing-section bg-white border-t border-b border-slate-200" id="pathway">
        <div className="container">
          <div className="section-header-center">
            <span className="section-kicker">Continuum of Care</span>
            <h2 className="section-title">5-Step Frontline Clinical Pathway</h2>
            <p className="section-desc">
              How the platform standardizes community health delivery from household screening to specialist consultation.
            </p>
          </div>

          <div className="pathway-grid-5">
            <div className="pathway-node-card">
              <div className="pathway-node-number">1</div>
              <h4 className="pathway-node-title">Screening</h4>
              <p className="pathway-node-desc">CHW collects vitals, symptoms, and biometrics in the field.</p>
            </div>

            <div className="pathway-node-card">
              <div className="pathway-node-number">2</div>
              <h4 className="pathway-node-title">Assessment</h4>
              <p className="pathway-node-desc">Clinical engine scores risk and attributes contributing factors.</p>
            </div>

            <div className="pathway-node-card">
              <div className="pathway-node-number">3</div>
              <h4 className="pathway-node-title">Counselling</h4>
              <p className="pathway-node-desc">ThinkLets scripts guide lifestyle counselling and salt reduction.</p>
            </div>

            <div className="pathway-node-card">
              <div className="pathway-node-number">4</div>
              <h4 className="pathway-node-title">Doctor Triage</h4>
              <p className="pathway-node-desc">Clinician reviews referral queue, adjusts meds, and approves plan.</p>
            </div>

            <div className="pathway-node-card">
              <div className="pathway-node-number">5</div>
              <h4 className="pathway-node-title">Follow-up</h4>
              <p className="pathway-node-desc">Household recall visit ensures medication adherence and vital checks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ROLE SOLUTIONS SECTION */}
      <section className="landing-section" id="roles">
        <div className="container">
          <div className="section-header-center">
            <span className="section-kicker">Tailored Workspaces</span>
            <h2 className="section-title">Role Solutions for Every Stakeholder</h2>
            <p className="section-desc">
              Dedicated interfaces optimized for field health workers, doctors, patients, supervisors, and administrators.
            </p>
          </div>

          <div className="roles-grid-5">
            {/* CHW Card */}
            <div className="role-solution-card">
              <div>
                <div className="feature-icon-box mb-3">
                  <Users size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Community Health Worker</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Household screening wizard, offline sync queue, ThinkLets voice-assisted counselling, and hospital referral generation.
                </p>
              </div>
              <button className="btn btn-secondary text-xs mt-4 w-full" onClick={() => handleDemoLaunch('chw')}>
                Sign in as CHW <ArrowRight size={14} />
              </button>
            </div>

            {/* Doctor Card */}
            <div className="role-solution-card">
              <div>
                <div className="feature-icon-box mb-3">
                  <Stethoscope size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Hospital Medical Officer</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Priority referral triage queue, explainable vital drivers, clinical orders, and prescription dosage approvals.
                </p>
              </div>
              <button className="btn btn-secondary text-xs mt-4 w-full" onClick={() => handleDemoLaunch('doctor')}>
                Sign in as Doctor <ArrowRight size={14} />
              </button>
            </div>

            {/* Patient Card */}
            <div className="role-solution-card">
              <div>
                <div className="feature-icon-box mb-3">
                  <Heart size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Patient & Family</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Bilingual English / Kannada health passport, daily pill checklist, prescription OCR scanner, and Emergency SOS dispatch.
                </p>
              </div>
              <button className="btn btn-secondary text-xs mt-4 w-full" onClick={() => handleDemoLaunch('patient')}>
                Sign in as Patient <ArrowRight size={14} />
              </button>
            </div>

            {/* Supervisor Card */}
            <div className="role-solution-card">
              <div>
                <div className="feature-icon-box mb-3">
                  <UserCheck size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Health Supervisor</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Population health analytics, CHW field monitoring, referral pipeline audits, and printable PDF/CSV summaries.
                </p>
              </div>
              <button className="btn btn-secondary text-xs mt-4 w-full" onClick={() => handleDemoLaunch('supervisor')}>
                Sign in as Supervisor <ArrowRight size={14} />
              </button>
            </div>

            {/* Admin Card */}
            <div className="role-solution-card">
              <div>
                <div className="feature-icon-box mb-3">
                  <Database size={20} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">System Administrator</h4>
                <p className="text-xs text-slate-600 mt-2">
                  Clinical Scoring Test Lab validation, HL7 FHIR R4 Bundle exports, CDSS threshold calibration, and audit trails.
                </p>
              </div>
              <button className="btn btn-secondary text-xs mt-4 w-full" onClick={() => handleDemoLaunch('admin')}>
                Sign in as Admin <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MEDICAL CDSS TRUST NOTICE */}
      <section className="container pb-12">
        <div className="trust-disclaimer-card">
          <ShieldCheck size={28} className="text-sky-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <strong className="text-slate-900 text-sm block">Clinical Decision Support System (CDSS) Notice</strong>
            <p>
              This platform provides rule-based and guideline-aligned clinical decision support based on AHA (American Heart Association) and ADA (American Diabetes Association) clinical standards.
            </p>
            <p className="text-2xs text-slate-500">
              CDSS outputs are advisory tools designed to assist qualified healthcare workers and do not replace professional medical diagnosis, laboratory testing, or clinical judgement.
            </p>
          </div>
        </div>
      </section>

      </main>

      {/* 8. FOOTER */}
      <footer className="landing-footer">
        <div className="container flex justify-between items-center flex-wrap gap-4">
          <div>
            <strong>CHW Healthcare Toolkit</strong> • Clinical Decision Support & Community EMR
          </div>
          <div className="text-2xs text-slate-400">
            Compliant with HL7 FHIR R4 & LOINC Standards • Offline-First Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
