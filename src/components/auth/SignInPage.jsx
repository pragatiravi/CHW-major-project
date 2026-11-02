import { useState, useEffect } from 'react';
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
  LogIn,
  AlertTriangle,
  Clock,
  FlaskConical
} from 'lucide-react';
import { 
  isDemoModeActive, 
  getAvailableDemoCredentials, 
  signUpWithCredentials 
} from '../../lib/auth';
import { getLockoutStatus } from '../../lib/authRateLimiter';

export default function SignInPage({
  onAuthenticate,
  onResetPassword,
  onBackToLanding,
  initialRole = 'chw',
}) {
  const isDemo = isDemoModeActive();
  const demoAccountsMap = getAvailableDemoCredentials();
  const initialCreds = isDemo && demoAccountsMap[initialRole] ? demoAccountsMap[initialRole] : { email: '', password: '' };

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [accountType, setAccountType] = useState('staff'); // 'staff' | 'patient'
  const [selectedStaffRole, setSelectedStaffRole] = useState('chw');
  const [email, setEmail] = useState(initialCreds.email || '');
  const [password, setPassword] = useState(initialCreds.password || '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [languagePref, setLanguagePref] = useState('en');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(() => {
    const status = getLockoutStatus(initialCreds.email || '');
    return status.isLocked ? status.remainingSeconds : 0;
  });

  // Live countdown timer for brute force lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setAuthError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const demoAccounts = isDemo ? [
    {
      role: 'chw',
      name: 'Sunita Patil',
      title: 'Community Health Worker (CHW)',
      email: demoAccountsMap.chw?.email || '',
      password: demoAccountsMap.chw?.password || '',
      icon: User,
      color: 'text-sky-600',
      desc: 'Field screening, vitals recording & ThinkLets counselling'
    },
    {
      role: 'doctor',
      name: 'Dr. Ananya Roy (M.D.)',
      title: 'Medical Officer / Clinician',
      email: demoAccountsMap.doctor?.email || '',
      password: demoAccountsMap.doctor?.password || '',
      icon: Stethoscope,
      color: 'text-indigo-600',
      desc: 'Hospital referral triage queue review & clinical orders'
    },
    {
      role: 'supervisor',
      name: 'Vikram Singh',
      title: 'Health Program Supervisor',
      email: demoAccountsMap.supervisor?.email || '',
      password: demoAccountsMap.supervisor?.password || '',
      icon: Activity,
      color: 'text-amber-600',
      desc: 'Population risk analytics, CHW field coverage & staff approvals'
    },
    {
      role: 'admin',
      name: 'Admin Operations',
      title: 'System Administrator',
      email: demoAccountsMap.admin?.email || '',
      password: demoAccountsMap.admin?.password || '',
      icon: Settings,
      color: 'text-purple-600',
      desc: 'Facility registry, role management & HL7 FHIR R4 export'
    },
    {
      role: 'patient',
      name: 'Priya Sharma',
      title: 'Patient & Family Portal',
      email: demoAccountsMap.patient?.email || '',
      password: demoAccountsMap.patient?.password || '',
      icon: UserCheck,
      color: 'text-emerald-600',
      desc: 'Bilingual health passport & daily medication tracking'
    }
  ] : [];

  const handleFillDemoCredentials = (account) => {
    if (!isDemo) return;
    setEmail(account.email);
    setPassword(account.password);
    setMode('signin');
    setAuthError('');
    const status = getLockoutStatus(account.email);
    setLockoutSeconds(status.isLocked ? status.remainingSeconds : 0);
    setAuthSuccess(`Loaded demo credentials for ${account.name}. Click "Sign In" below to authenticate.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setAuthError('');
    setAuthSuccess('');
    setIsSubmitting(true);

    try {
      if (mode === 'forgot') {
        const sent = await onResetPassword(email);
        if (sent) {
          setAuthSuccess('Password recovery email dispatched. Please check your inbox.');
        } else {
          setAuthError('Could not send reset instructions. Please verify your email format.');
        }
        return;
      }

      if (mode === 'signup') {
        const targetRole = accountType === 'patient' ? 'patient' : selectedStaffRole;
        const result = await signUpWithCredentials({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim() || email.split('@')[0],
          role: targetRole,
          languagePref,
          phone: phone.trim(),
          village: village.trim()
        });

        setAuthSuccess(result.message || 'Registration submitted! Staff accounts require supervisor approval.');
        setMode('signin');
        return;
      }

      // Standard authentication
      await onAuthenticate({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please verify your credentials.');
      // Update lockout state
      const status = getLockoutStatus(email);
      if (status.isLocked) {
        setLockoutSeconds(status.remainingSeconds);
      }
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
          {isDemo ? (
            <span className="badge badge-warning text-3xs font-mono font-bold flex items-center gap-1">
              <FlaskConical size={11} /> DEMO MODE
            </span>
          ) : (
            <span className="badge badge-success text-3xs font-mono font-bold flex items-center gap-1">
              <ShieldCheck size={11} /> PRODUCTION AUTH
            </span>
          )}
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
                  <strong>Brute-Force Attack Prevention</strong>
                  <p className="text-2xs text-slate-500">Automated lockouts after 5 consecutive failures protect rural accounts from credential stuffing.</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Pre-Fill Selector (Visible ONLY when VITE_DEMO_MODE=true) */}
            {isDemo && demoAccounts.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="metric-label text-3xs text-slate-500 block">Evaluator Demo Accounts</span>
                  <span className="badge badge-warning text-3xs font-mono">VITE_DEMO_MODE=true</span>
                </div>
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
            )}
          </div>
        </div>

        {/* Right Column: Sign In / Register Form */}
        <div className="signin-right-col">
          <div className="signin-form-card">
            <div className="signin-header">
              <div className="flex justify-between items-center mb-3">
                <div className="auth-badge">
                  <ShieldCheck size={14} className="text-sky-600" aria-hidden="true" />
                  <span>{mode === 'signup' ? 'New Account Registration' : 'Verified Credentials'}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${mode === 'signin' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => { setMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${mode === 'signup' ? 'bg-sky-100 text-sky-800' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => { setMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                  >
                    Register
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {mode === 'signup' ? 'Create Health Platform Account' : (mode === 'forgot' ? 'Reset Account Password' : 'Sign In to Workspace')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'signup'
                  ? 'Frontline staff accounts require supervisor approval. Patient self-registrations activate immediately.'
                  : (mode === 'forgot'
                    ? 'Enter your registered email address to receive password recovery instructions.'
                    : 'Enter your institutional email address and password to continue.')}
              </p>
            </div>

            {/* Lockout Warning Banner */}
            {lockoutSeconds > 0 && (
              <div className="p-3 my-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 font-medium">
                <Clock size={16} className="text-amber-700 animate-pulse flex-shrink-0" />
                <span>Account temporarily locked due to failed attempts. Please wait <strong>{lockoutSeconds}s</strong>.</span>
              </div>
            )}

            {authError && (
              <div className="p-3 my-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error:</span> {authError}
                </div>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 my-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="signin-form space-y-3 mt-4">
              {/* Account Type Selector for Registration */}
              {mode === 'signup' && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-1.5 px-2 text-xs font-semibold rounded border text-center transition-all ${accountType === 'staff' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 border-slate-300'}`}
                      onClick={() => setAccountType('staff')}
                    >
                      Frontline Staff
                    </button>
                    <button
                      type="button"
                      className={`py-1.5 px-2 text-xs font-semibold rounded border text-center transition-all ${accountType === 'patient' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300'}`}
                      onClick={() => setAccountType('patient')}
                    >
                      Patient / Family
                    </button>
                  </div>

                  {accountType === 'staff' ? (
                    <div className="mt-2">
                      <label className="text-2xs text-slate-500 block mb-1">Target Healthcare Role (Approval Required)</label>
                      <select
                        value={selectedStaffRole}
                        onChange={(e) => setSelectedStaffRole(e.target.value)}
                        className="form-input text-xs w-full"
                      >
                        <option value="chw">Community Health Worker (ASHA)</option>
                        <option value="doctor">Medical Officer (PHC Clinician)</option>
                        <option value="supervisor">Health Program Supervisor</option>
                      </select>
                    </div>
                  ) : (
                    <p className="text-3xs text-emerald-700 font-medium">
                      ✓ Instant access to bilingual Health Passport and medication schedule upon registration.
                    </p>
                  )}
                </div>
              )}

              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-name">Full Name *</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      id="signup-name"
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={accountType === 'patient' ? "e.g. Priya Sharma" : "e.g. Sunita Patil"}
                      className="form-input text-xs pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="signin-email">Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input 
                    id="signin-email"
                    type="email" 
                    value={email}
                    onChange={(e) => { 
                      const newEmail = e.target.value;
                      setEmail(newEmail); 
                      setAuthError(''); 
                      const status = getLockoutStatus(newEmail);
                      setLockoutSeconds(status.isLocked ? status.remainingSeconds : 0);
                    }}
                    placeholder={mode === 'signup' && accountType === 'patient' ? "patient@example.com" : "staff@communityhealth.org"}
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-phone">Mobile Phone</label>
                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-village">Village / Ward</label>
                    <input
                      id="signup-village"
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Vimanapura"
                      className="form-input text-xs"
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
                disabled={isSubmitting || lockoutSeconds > 0}
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : lockoutSeconds > 0 ? (
                  <span>Locked ({lockoutSeconds}s)</span>
                ) : mode === 'signup' ? (
                  <span className="flex items-center gap-1.5">
                    <UserPlus size={15} /> 
                    {accountType === 'patient' ? 'Complete Patient Registration' : 'Submit Staff Registration'}
                  </span>
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
