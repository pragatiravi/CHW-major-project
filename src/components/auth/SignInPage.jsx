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
  Eye,
  EyeOff,
  PhoneCall,
  Database,
  HelpCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  isDemoModeActive, 
  getAvailableDemoCredentials, 
  signUpWithCredentials 
} from '../../lib/auth';
import { getLockoutStatus } from '../../lib/authRateLimiter';
import { isSupabaseConfigured, getSupabaseDiagnostics } from '../../lib/supabaseClient';
import { useLanguage } from '../shared/LanguageContext';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import { mapSupabaseAuthError } from '../../utils/supabaseErrorMapper';

export default function SignInPage({
  onAuthenticate,
  onResetPassword,
  onBackToLanding,
  initialRole = 'chw',
}) {
  const { t, language } = useLanguage();
  const isDemo = isDemoModeActive();
  const demoAccountsMap = getAvailableDemoCredentials();
  const initialCreds = isDemo && demoAccountsMap[initialRole] ? demoAccountsMap[initialRole] : { email: '', password: '' };

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [accountType, setAccountType] = useState('staff'); // 'staff' | 'patient'
  const [selectedStaffRole, setSelectedStaffRole] = useState('chw');
  const [email, setEmail] = useState(initialCreds.email || '');
  const [password, setPassword] = useState(initialCreds.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const languagePref = language || 'en';
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [lockoutSeconds, setLockoutSeconds] = useState(() => {
    const status = getLockoutStatus(initialCreds.email || '');
    return status.isLocked ? status.remainingSeconds : 0;
  });

  const diagnostics = getSupabaseDiagnostics();

  const [isDeviceOnline, setIsDeviceOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsDeviceOnline(true);
    const handleOffline = () => setIsDeviceOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Brute force lockout timer
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

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200', text: '' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 3) return { score: 65, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(password);

  const demoAccounts = isDemo ? [
    {
      role: 'chw',
      name: 'Sunita Patil',
      title: 'Community Health Worker (ASHA)',
      email: demoAccountsMap.chw?.email || '',
      password: demoAccountsMap.chw?.password || '',
      icon: User,
      color: 'text-sky-600',
      desc: 'Field screening, vitals recording & ThinkLets counselling'
    },
    {
      role: 'doctor',
      name: 'Dr. Ananya Roy (M.D.)',
      title: 'Medical Officer / PHC Clinician',
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
    setAuthSuccess(`Loaded demo credentials for ${account.name}. Click "Sign In" below.`);
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

        setAuthSuccess(result.message || 'Registration submitted successfully.');
        setMode('signin');
        return;
      }

      // Standard authentication
      await onAuthenticate({
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (error) {
      const friendlyError = mapSupabaseAuthError(error, language);
      setAuthError(friendlyError || error.message || 'Authentication failed. Please verify credentials.');
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

      {/* Top Header Bar with Language Switcher */}
      <header className="signin-topbar" style={{ minHeight: '64px' }}>
        <button 
          type="button"
          className="btn btn-secondary text-xs flex items-center gap-1.5" 
          onClick={onBackToLanding}
          style={{ minHeight: '44px' }}
        >
          <ArrowLeft size={16} /> 
          <span>{t('returnToPublic') || 'Return to Public Portal'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="brand-icon-box-sm">
            <Heart className="text-sky-600" size={18} />
          </div>
          <span className="font-bold text-slate-800 text-sm hidden sm:inline">
            CHW Healthcare Toolkit
          </span>

          {/* Network Status Badge (Truthful: checks actual internet connectivity) */}
          {isDeviceOnline ? (
            <span className="badge badge-success text-3xs font-semibold flex items-center gap-1 py-1 px-2" title="Device is connected to the internet">
              <Wifi size={12} className="text-emerald-700" />
              <span>Online</span>
            </span>
          ) : (
            <span className="badge badge-danger text-3xs font-semibold flex items-center gap-1 py-1 px-2" title="Device has no internet connection">
              <WifiOff size={12} className="text-rose-700" />
              <span>Offline</span>
            </span>
          )}

          {/* Cloud Database Status Badge */}
          {isSupabaseConfigured ? (
            <span className="badge badge-primary text-3xs font-semibold flex items-center gap-1 py-1 px-2" title="Connected to remote Supabase Postgres cloud">
              <ShieldCheck size={12} className="text-sky-700" />
              <span>Cloud Connected</span>
            </span>
          ) : (
            <span className="badge badge-warning text-3xs font-semibold flex items-center gap-1 py-1 px-2" title="Running in local evaluation mode (no cloud database configured)">
              <Database size={12} className="text-amber-700" />
              <span>Local-only</span>
            </span>
          )}

          {/* Multilingual Selector */}
          <LanguageSwitcher variant="compact" />
        </div>
      </header>

      {/* Evaluator Banner when Demo Mode is Active */}
      {isDemo && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between border-b border-amber-600 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-3xs font-mono uppercase">
              Evaluator Mode
            </span>
            <span>Evaluator demo access is active. Select any persona card below to pre-fill credentials.</span>
          </div>
          <span className="text-3xs hidden md:inline font-normal">Turn off in production</span>
        </div>
      )}

      {/* Main Split Authentication Container */}
      <main id="main-content" className="signin-container" tabIndex="-1">
        {/* Left Column: Clinical Context, Network & Technical Diagnostics */}
        <div className="signin-left-col">
          <div className="signin-left-content space-y-5">
            <div>
              <div className="auth-badge mb-2">
                <ShieldCheck size={14} className="text-sky-600" />
                <span>Verified Clinical Platform</span>
              </div>
              <h2 className="signin-headline" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: 1.2 }}>
                Empowering frontline care with clinical intelligence.
              </h2>
              <p className="signin-subtext text-xs leading-relaxed mt-2 text-slate-600">
                Offline-first clinical decision support for Community Health Workers, physicians, supervisors, and rural families in Karnataka and Maharashtra.
              </p>
            </div>

            {/* Clinical Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white/90 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <strong className="text-xs text-slate-900">NCD Protocols</strong>
                </div>
                <p className="text-3xs text-slate-500 leading-normal">
                  Standardized AHA/ADA 2024 screening for Hypertension, Type 2 Diabetes, and Cardiovascular risks.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white/90 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <PhoneCall size={16} className="text-rose-600 flex-shrink-0" />
                  <strong className="text-xs text-slate-900">108 Emergency SOS</strong>
                </div>
                <p className="text-3xs text-slate-500 leading-normal">
                  Instant triage classification and emergency transfer slip generation for acute cardiac and stroke red flags.
                </p>
              </div>
            </div>

            {/* Offline-First Storage Guarantee */}
            <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/70 text-slate-700 text-xs flex items-start gap-3">
              <Database size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 text-xs block">Offline-First Resilience</strong>
                <p className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                  Field workers can complete complete patient visits and ThinkLets counselling even with zero cellular signal. Mutations sync securely when internet connectivity resumes.
                </p>
              </div>
            </div>

            {/* Startup Connection Diagnostic Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${diagnostics.isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="font-bold text-xs text-slate-800">
                    {diagnostics.isConfigured ? 'Cloud Backend Connected' : 'Cloud Setup Notice'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="text-3xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
                >
                  <HelpCircle size={12} />
                  <span>{showDiagnostics ? 'Hide details' : 'View diagnostic'}</span>
                </button>
              </div>

              {!diagnostics.isConfigured && (
                <p className="text-3xs text-amber-800 mt-2 leading-relaxed bg-amber-50 p-2 rounded border border-amber-200">
                  New account registration requires Supabase keys in production. If you have already added keys in Vercel, please trigger a fresh <strong>Redeploy without build cache</strong>.
                </p>
              )}

              {showDiagnostics && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-3xs font-mono text-slate-600">
                  <div className="font-semibold text-slate-700 mb-1">Environment Variables Checked:</div>
                  {diagnostics.lookedUp?.map(v => (
                    <div key={v.name} className="flex justify-between items-center py-0.5">
                      <span>{v.name}:</span>
                      <span className={v.found ? 'text-emerald-600 font-bold' : 'text-slate-400 font-normal'}>
                        {v.found ? '✓ Present' : '✗ Missing'}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span>Active Key Source:</span>
                    <span className="font-bold text-slate-700">{diagnostics.activeKeySource || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Key Format:</span>
                    <span className={diagnostics.keyValid ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {diagnostics.keyFormat}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evaluator Demo:</span>
                    <span className="text-slate-800 font-bold">{isDemo ? 'Active' : 'Disabled'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Evaluator Quick Demo Selector (Visible when VITE_DEMO_MODE=true) */}
            {isDemo && demoAccounts.length > 0 && (
              <div className="pt-2">
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  1-Click Evaluator Sign-In
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoAccounts.map(account => (
                    <button
                      key={account.role}
                      type="button"
                      className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-sky-300 flex items-center justify-between text-left text-xs transition-all shadow-2xs"
                      onClick={() => handleFillDemoCredentials(account)}
                      style={{ minHeight: '48px' }}
                    >
                      <div className="flex items-center gap-2">
                        <account.icon size={16} className={account.color} />
                        <div>
                          <strong className="text-slate-900 block text-2xs">{account.name}</strong>
                          <span className="text-3xs text-slate-400 font-mono">{account.role.toUpperCase()}</span>
                        </div>
                      </div>
                      <span className="text-3xs text-sky-600 font-semibold">Fill</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sign In / Registration Form Card */}
        <div className="signin-right-col">
          <div className="signin-form-card">
            {/* Header with Mode Tabs */}
            <div className="signin-header">
              <div className="flex justify-between items-center mb-3">
                <div className="auth-badge">
                  <ShieldCheck size={14} className="text-sky-600" aria-hidden="true" />
                  <span>{mode === 'signup' ? 'New Registration' : (mode === 'forgot' ? 'Account Recovery' : 'Secure Login')}</span>
                </div>
                <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${mode === 'signin' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    onClick={() => { setMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                    style={{ minHeight: '36px' }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${mode === 'signup' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    onClick={() => { setMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                    style={{ minHeight: '36px' }}
                  >
                    Register
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {mode === 'signup' ? 'Create Health Platform Account' : (mode === 'forgot' ? 'Reset Account Password' : (t('signInToWorkspace') || 'Sign In to Workspace'))}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {mode === 'signup'
                  ? 'Frontline staff accounts require supervisor verification. Patient self-registrations activate immediately.'
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

            {/* Error Message Banner */}
            {authError && (
              <div className="p-3 my-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <strong className="block text-rose-900 font-bold mb-0.5">Authentication Notice</strong>
                  {authError}
                </div>
              </div>
            )}

            {/* Success Message Banner */}
            {authSuccess && (
              <div className="p-3 my-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {authSuccess}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="signin-form space-y-4 mt-3">
              {/* Account Type Selector for Registration - Accessible 52px Touch Targets */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-2xs font-bold text-slate-700 uppercase tracking-wider block">
                    Account Category *
                  </label>
                  <div className="account-type-grid">
                    <button
                      type="button"
                      className={`account-type-card ${accountType === 'staff' ? 'active-staff' : ''}`}
                      onClick={() => setAccountType('staff')}
                      aria-pressed={accountType === 'staff'}
                    >
                      <User size={18} className="text-sky-600 flex-shrink-0" />
                      <div>
                        <strong className="text-xs text-slate-900 block font-bold">Healthcare Staff</strong>
                        <span className="text-3xs text-slate-500 block leading-tight">ASHA / Doctor / Supervisor</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`account-type-card ${accountType === 'patient' ? 'active-patient' : ''}`}
                      onClick={() => setAccountType('patient')}
                      aria-pressed={accountType === 'patient'}
                    >
                      <UserCheck size={18} className="text-emerald-600 flex-shrink-0" />
                      <div>
                        <strong className="text-xs text-slate-900 block font-bold">Patient / Family</strong>
                        <span className="text-3xs text-slate-500 block leading-tight">Instant Passport Access</span>
                      </div>
                    </button>
                  </div>

                  {accountType === 'staff' ? (
                    <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <label className="text-2xs font-bold text-slate-700 block mb-1" htmlFor="signup-staff-role">
                        Target Healthcare Role (Approval Required) *
                      </label>
                      <select
                        id="signup-staff-role"
                        value={selectedStaffRole}
                        onChange={(e) => setSelectedStaffRole(e.target.value)}
                        className="form-input text-xs w-full"
                        style={{ minHeight: '44px' }}
                      >
                        <option value="chw">Community Health Worker (ASHA)</option>
                        <option value="doctor">Medical Officer (PHC Clinician)</option>
                        <option value="supervisor">Health Program Supervisor</option>
                      </select>
                      <span className="text-3xs text-slate-500 block mt-1">
                        Frontline staff accounts default to pending status until verified by a supervisor.
                      </span>
                    </div>
                  ) : (
                    <p className="text-3xs text-emerald-800 font-medium bg-emerald-50 p-2 rounded border border-emerald-200">
                      ✓ Instant access to bilingual Health Passport, medication schedule, and AI health guidance.
                    </p>
                  )}
                </div>
              )}

              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label text-xs font-semibold text-slate-700" htmlFor="signup-name">
                    Full Name *
                  </label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input 
                      id="signup-name"
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={accountType === 'patient' ? "e.g. Priya Sharma" : "e.g. Sunita Patil"}
                      className="form-input text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label text-xs font-semibold text-slate-700" htmlFor="auth-email">
                  Email Address *
                </label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input 
                    id="auth-email"
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
                    className="form-input text-xs"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field with Show/Hide Toggle & Strength Meter */}
              {mode !== 'forgot' && (
                <div className="form-group">
                  <div className="flex justify-between items-center mb-1">
                    <label className="form-label text-xs font-semibold text-slate-700 mb-0" htmlFor="auth-password">
                      Password *
                    </label>
                    {mode === 'signin' && (
                      <button 
                        type="button" 
                        className="text-xs text-sky-600 hover:underline font-medium"
                        onClick={() => { setMode('forgot'); setAuthError(''); setAuthSuccess(''); }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="input-with-icon">
                    <Lock size={18} className="input-icon" />
                    <input 
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                      placeholder="Minimum 8 characters"
                      className="form-input text-xs has-trailing"
                      required
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      className="input-trailing-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter on Registration */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="password-strength-container">
                      <div className="flex justify-between items-center text-3xs mb-1">
                        <span className="text-slate-500">Password Strength:</span>
                        <span className={`font-bold ${pwdStrength.text}`}>{pwdStrength.label}</span>
                      </div>
                      <div className="password-strength-track">
                        <div 
                          className={`password-strength-fill ${pwdStrength.color}`} 
                          style={{ width: `${pwdStrength.score}%` }} 
                        />
                      </div>
                      {password.length < 8 && (
                        <span className="text-3xs text-rose-600 block mt-1">
                          Must be at least 8 characters long.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Optional Phone & Village Fields for Sign Up */}
              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="form-group">
                    <label className="form-label text-xs font-semibold text-slate-700" htmlFor="signup-phone">
                      Mobile Phone
                    </label>
                    <input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="form-input text-xs"
                      style={{ minHeight: '44px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs font-semibold text-slate-700" htmlFor="signup-village">
                      Village / Ward
                    </label>
                    <input
                      id="signup-village"
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="e.g. Vimanapura"
                      className="form-input text-xs"
                      style={{ minHeight: '44px' }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button with 48px minimum touch target */}
              <button 
                type="submit" 
                className="btn btn-primary text-xs w-full justify-center font-bold py-3 mt-3 shadow-md"
                disabled={isSubmitting || lockoutSeconds > 0}
                style={{ minHeight: '48px' }}
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : lockoutSeconds > 0 ? (
                  <span>Locked ({lockoutSeconds}s)</span>
                ) : mode === 'signup' ? (
                  <span className="flex items-center gap-2">
                    <UserPlus size={16} /> 
                    {accountType === 'patient' ? 'Complete Patient Registration' : 'Submit Staff Registration'}
                  </span>
                ) : mode === 'forgot' ? (
                  <span className="flex items-center gap-2">
                    <KeyRound size={16} /> Send Recovery Instructions
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={16} /> Sign In to Workspace
                  </span>
                )}
              </button>

              {mode === 'forgot' && (
                <button
                  type="button"
                  className="btn btn-secondary text-xs w-full justify-center mt-2"
                  onClick={() => { setMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                  style={{ minHeight: '44px' }}
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
