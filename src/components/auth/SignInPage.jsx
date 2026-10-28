import { useState } from 'react';
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
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';
import { DEMO_CREDENTIALS, signUpWithCredentials } from '../../lib/auth';

export default function SignInPage({
  onAuthenticate,
  onResetPassword,
  onBackToLanding,
  initialRole = 'chw',
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const initialCreds = DEMO_CREDENTIALS[initialRole] || DEMO_CREDENTIALS.chw;
  const [email, setEmail] = useState(initialCreds.email);
  const [password, setPassword] = useState(initialCreds.password);
  const [fullName, setFullName] = useState('');
  const [languagePref, setLanguagePref] = useState('en');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoAccounts = [
    {
      role: 'chw',
      name: 'Sunita Patil',
      title: 'Community Health Worker (CHW)',
      email: DEMO_CREDENTIALS.chw.email,
      password: DEMO_CREDENTIALS.chw.password,
      icon: User,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderHover: 'hover:border-sky-400',
      desc: 'Field screening, vitals recording & ThinkLets counselling'
    },
    {
      role: 'doctor',
      name: 'Dr. Ananya Roy (M.D.)',
      title: 'Medical Officer / Clinician',
      email: DEMO_CREDENTIALS.doctor.email,
      password: DEMO_CREDENTIALS.doctor.password,
      icon: Stethoscope,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderHover: 'hover:border-indigo-400',
      desc: 'Hospital referral triage queue review & clinical orders'
    },
    {
      role: 'supervisor',
      name: 'Vikram Singh',
      title: 'Health Program Supervisor',
      email: DEMO_CREDENTIALS.supervisor.email,
      password: DEMO_CREDENTIALS.supervisor.password,
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderHover: 'hover:border-amber-400',
      desc: 'Population risk analytics, CHW field coverage & staff approvals'
    },
    {
      role: 'admin',
      name: 'Admin Operations',
      title: 'System Administrator',
      email: DEMO_CREDENTIALS.admin.email,
      password: DEMO_CREDENTIALS.admin.password,
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderHover: 'hover:border-purple-400',
      desc: 'Facility registry, role management & HL7 FHIR R4 export'
    },
    {
      role: 'patient',
      name: 'Priya Sharma',
      title: 'Patient & Family Portal',
      email: DEMO_CREDENTIALS.patient.email,
      password: DEMO_CREDENTIALS.patient.password,
      icon: UserCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderHover: 'hover:border-emerald-400',
      desc: 'Bilingual health passport & daily medication tracking'
    }
  ];

  const handleFillDemoCredentials = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setMode('signin');
    setAuthError('');
    setAuthSuccess(`Loaded demo credentials for ${account.name}. Click "Sign In" below to authenticate.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        const sent = await onResetPassword(email);
        if (sent) {
          setAuthSuccess('Password reset link sent! Please check your email inbox.');
        } else {
          setAuthError('Could not send reset link. Please verify your email format.');
        }
        return;
      }

      if (mode === 'signup') {
        const result = await signUpWithCredentials({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim() || email.split('@')[0],
          languagePref
        });
        setAuthSuccess(result.message || 'Registration submitted! Your account is pending supervisor approval.');
        setMode('signin');
        return;
      }

      // Standard real authentication
      await onAuthenticate({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signin-page-wrapper">
      <a className="skip-link" href="#main-content">Skip to sign-in form</a>
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
      <main id="main-content" className="signin-container" tabIndex="-1">
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
              Secure, server-verified authentication for Community Health Workers, physicians, supervisors, administrators, and patients.
            </p>

            <div className="signin-highlights">
              <div className="highlight-item">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>Server-Enforced Role Security</strong>
                  <p className="text-2xs text-slate-500">Roles are cryptographically verified from the PostgreSQL database, not client state.</p>
                </div>
              </div>
              <div className="highlight-item">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>Supervisor Approval Gate</strong>
                  <p className="text-2xs text-slate-500">New frontline registrations default to pending status until verified by a supervisor.</p>
                </div>
              </div>
              <div className="highlight-item">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <strong>Longitudinal Encounters</strong>
                  <p className="text-2xs text-slate-500">Every screening persists a new visit row with complete vital trends over time.</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Pre-Fill Selector */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <span className="metric-label text-3xs text-slate-400 block mb-2">Evaluator Demo Credential Helper</span>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map(account => (
                  <button
                    key={account.role}
                    type="button"
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between text-left text-xs transition-all"
                    onClick={() => handleFillDemoCredentials(account)}
                  >
                    <div className="flex items-center gap-2">
                      <account.icon size={14} className={account.color} />
                      <div>
                        <strong className="text-slate-900 block text-2xs">{account.name} ({account.title.split(' ')[0]})</strong>
                        <span className="text-3xs text-slate-400 font-mono">{account.email}</span>
                      </div>
                    </div>
                    <span className="badge badge-neutral text-3xs font-mono">Fill Form</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In / Register Form */}
        <div className="signin-right-col">
          <div className="signin-form-card">
            <div className="signin-header">
              <div className="flex justify-between items-center mb-3">
                <div className="auth-badge">
                  <ShieldCheck size={14} className="text-sky-600" aria-hidden="true" />
                  <span>{mode === 'signup' ? 'Staff Self-Registration' : 'Institutional Credentials'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`text-xs font-semibold px-2 py-1 rounded ${mode === 'signin' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => { setMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`text-xs font-semibold px-2 py-1 rounded ${mode === 'signup' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => { setMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                  >
                    Register
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {mode === 'signup' ? 'Create Frontline Staff Account' : (mode === 'forgot' ? 'Reset Account Password' : 'Sign In to Workspace')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'signup'
                  ? 'Sign up for community health screening access. Accounts require supervisor approval.'
                  : (mode === 'forgot'
                    ? 'Enter your registered email address to receive password recovery instructions.'
                    : 'Enter your verified institutional email and password to continue.')}
              </p>
            </div>

            {authError && (
              <div className="p-3 my-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <span className="font-bold">Error:</span> {authError}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 my-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="signin-form space-y-3.5 mt-4">
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-name">Full Legal Name *</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      id="signup-name"
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Geeta Kulkarni"
                      className="form-input text-xs pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="signin-email">Institutional Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    id="signin-email"
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAuthError(''); }}
                    placeholder="e.g. staff.id@communityhealth.org"
                    className="form-input text-xs pl-9"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="form-group">
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label mb-0" htmlFor="signin-password">Password *</label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        className="text-xs text-sky-600 hover:underline"
                        onClick={() => { setMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input 
                      id="signin-password"
                      type="password" 
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                      placeholder="Minimum 8 characters"
                      className="form-input text-xs pl-9"
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-lang">Preferred Regional Language</label>
                  <select
                    id="signup-lang"
                    value={languagePref}
                    onChange={(e) => setLanguagePref(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="en">English (Default)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="mr">Marathi (मराठी)</option>
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary text-xs w-full justify-center font-bold mt-2 py-2.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Connecting to secure auth...</span>
                ) : mode === 'signup' ? (
                  <span className="flex items-center gap-1.5"><UserPlus size={15} /> Submit Registration</span>
                ) : mode === 'forgot' ? (
                  <span className="flex items-center gap-1.5"><KeyRound size={15} /> Send Recovery Instructions</span>
                ) : (
                  <span className="flex items-center gap-1.5"><LogIn size={15} /> Sign In to Workspace</span>
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  className="btn btn-secondary text-xs w-full justify-center mt-2"
                  onClick={() => { setMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                >
                  Back to Sign In
                </button>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
