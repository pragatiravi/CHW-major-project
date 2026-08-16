import React, { useState } from 'react';
import { 
  Heart, 
  Lock, 
  Mail, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Stethoscope, 
  UserCheck, 
  Activity, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function SignInPage({ onLogin, onBackToLanding, initialRole = 'chw' }) {
  const [email, setEmail] = useState('sunita.patil@communityhealth.org');
  const [password, setPassword] = useState('clinical@123');
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const demoAccounts = [
    {
      role: 'chw',
      name: 'Sunita Patil',
      title: 'Community Health Worker (CHW)',
      email: 'sunita.patil@communityhealth.org',
      icon: User,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderHover: 'hover:border-sky-400',
      desc: 'Field screening, vitals recording, ThinkLets counselling & offline sync'
    },
    {
      role: 'doctor',
      name: 'Dr. Ananya Roy (M.D.)',
      title: 'Medical Officer / Clinician',
      email: 'ananya.roy@districtmed.org',
      icon: Stethoscope,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderHover: 'hover:border-indigo-400',
      desc: 'Hospital referral triage queue review, clinical orders & prescriptions'
    },
    {
      role: 'patient',
      name: 'Priya Sharma',
      title: 'Patient & Family Health Portal',
      email: 'priya.sharma@patienthealth.net',
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderHover: 'hover:border-emerald-400',
      desc: 'Bilingual health passport, daily medication adherence & Emergency SOS'
    },
    {
      role: 'supervisor',
      name: 'Vikram Singh',
      title: 'Health Program Supervisor',
      email: 'vikram.singh@subdistrictops.org',
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderHover: 'hover:border-amber-400',
      desc: 'Population risk analytics, CHW field coverage & audit reporting'
    },
    {
      role: 'admin',
      name: 'Admin Operations',
      title: 'System Administrator',
      email: 'admin.lead@healthsystem.gov',
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderHover: 'hover:border-purple-400',
      desc: 'Hospital facility registry, ML thresholds & HL7 FHIR R4 export'
    }
  ];

  const handleStandardSubmit = (e) => {
    e.preventDefault();
    if (isForgotPassword) {
      setResetSent(true);
      return;
    }

    const matchedDemo = demoAccounts.find(d => d.role === selectedRole);
    onLogin({
      name: matchedDemo ? matchedDemo.name : 'Authorized Staff Member',
      email: email,
      role: selectedRole
    });
  };

  const handleQuickDemoLogin = (account) => {
    onLogin({
      name: account.name,
      email: account.email,
      role: account.role
    });
  };

  return (
    <div className="signin-page-wrapper">
      {/* Top Header Bar */}
      <header className="signin-topbar">
        <button 
          className="btn btn-secondary text-xs flex items-center gap-1.5" 
          onClick={onBackToLanding}
        >
          <ArrowLeft size={14} /> Return to Public Portal
        </button>
        <div className="flex items-center gap-2">
          <div className="brand-icon-box-sm">
            <Heart className="text-sky-600" size={18} />
          </div>
          <span className="font-bold text-slate-800 text-sm">CHW Healthcare Toolkit</span>
        </div>
      </header>

      {/* Split Auth Container */}
      <div className="signin-container">
        {/* Left Column: Platform Trust & Features */}
        <div className="signin-left-col">
          <div className="signin-left-content">
            <div className="auth-badge">
              <ShieldCheck size={14} className="text-sky-600" />
              <span>Verified Clinical Access</span>
            </div>
            <h2 className="signin-headline">
              Empowering frontline care with clinical intelligence.
            </h2>
            <p className="signin-subtext">
              Secure, role-authorized access for Community Health Workers, physicians, supervisors, administrators, and patients.
            </p>

            <div className="signin-highlights">
              <div className="highlight-item">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>Offline-First Synchronization</strong>
                  <p className="text-2xs text-slate-500">Field triage and patient screening records persist safely offline.</p>
                </div>
              </div>
              <div className="highlight-item">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>Explainable Decision Support</strong>
                  <p className="text-2xs text-slate-500">Transparent factor contributions for Hypertension and Diabetes risk.</p>
                </div>
              </div>
              <div className="highlight-item">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>HL7 FHIR R4 Interoperability</strong>
                  <p className="text-2xs text-slate-500">Export clinical observations aligned with standard LOINC terminologies.</p>
                </div>
              </div>
            </div>

            <div className="signin-security-note">
              <ShieldCheck size={16} className="text-slate-400 flex-shrink-0" />
              <span>
                Authorized healthcare personnel only. All access events and clinical actions are recorded in immutable audit logs.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form & Demo Personas */}
        <div className="signin-right-col">
          <div className="signin-form-card">
            {!isForgotPassword ? (
              <>
                <div className="signin-header">
                  <h3 className="text-xl font-bold text-slate-900">Sign In to Your Workspace</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter institutional credentials or launch an evaluator demo persona below.
                  </p>
                </div>

                <form onSubmit={handleStandardSubmit} className="signin-form">
                  <div className="form-group">
                    <label className="form-label">Select Operating Role</label>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setSelectedRole(newRole);
                        const matched = demoAccounts.find(d => d.role === newRole);
                        if (matched) setEmail(matched.email);
                      }}
                      className="form-input text-xs"
                    >
                      <option value="chw">👩‍⚕️ Community Health Worker (CHW)</option>
                      <option value="doctor">👨‍⚕️ Medical Officer / Clinician</option>
                      <option value="patient">👤 Patient & Family Health Hub</option>
                      <option value="supervisor">📊 Health Program Supervisor</option>
                      <option value="admin">⚙️ System Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Institutional Email or Staff ID</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. staff.id@communityhealth.org"
                        className="form-input text-xs pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="flex justify-between items-center mb-1">
                      <label className="form-label mb-0">Password</label>
                      <button 
                        type="button" 
                        className="text-xs text-sky-600 hover:underline"
                        onClick={() => setIsForgotPassword(true)}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="form-input text-xs pl-9"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-full text-xs font-semibold py-2.5 shadow-sm">
                    Authenticate & Enter Workspace
                  </button>
                </form>

                {/* Visually Separated Demo Personas Section */}
                <div className="demo-access-divider">
                  <span>OR SELECT AN EVALUATION PERSONA</span>
                </div>

                <div className="demo-personas-grid">
                  {demoAccounts.map((account) => {
                    const IconComponent = account.icon;
                    return (
                      <button
                        key={account.role}
                        type="button"
                        className={`demo-persona-card ${account.borderHover}`}
                        onClick={() => handleQuickDemoLogin(account)}
                      >
                        <div className={`demo-icon-box ${account.bgColor} ${account.color}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="demo-info">
                          <strong className="demo-name">{account.name}</strong>
                          <span className="demo-role">{account.title}</span>
                          <span className="demo-desc">{account.desc}</span>
                        </div>
                        <span className="demo-arrow text-slate-400">➔</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="password-reset-view">
                <h3 className="text-lg font-bold text-slate-900">Password Recovery</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered institutional email to dispatch a secure password reset link.
                </p>

                {resetSent ? (
                  <div className="reset-success-box">
                    <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
                    <strong className="text-xs text-slate-800 block">Recovery Instructions Sent</strong>
                    <p className="text-2xs text-slate-600 mt-1">
                      A secure password reset link has been dispatched to <strong>{email}</strong>.
                    </p>
                    <button 
                      className="btn btn-primary text-xs w-full mt-4"
                      onClick={() => { setIsForgotPassword(false); setResetSent(false); }}
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleStandardSubmit} className="mt-4 space-y-3">
                    <div className="form-group">
                      <label className="form-label">Registered Institutional Email</label>
                      <div className="input-with-icon">
                        <Mail size={16} className="input-icon" />
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input text-xs pl-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button" 
                        className="btn btn-secondary text-xs flex-1"
                        onClick={() => setIsForgotPassword(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary text-xs flex-1">
                        Send Recovery Link
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

