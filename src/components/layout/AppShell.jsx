import React, { useState } from 'react';
import { 
  Heart, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Users, 
  BrainCircuit, 
  BookOpen, 
  Pill, 
  Hospital, 
  Clock, 
  Activity, 
  Settings, 
  FileText, 
  ShieldCheck, 
  Camera, 
  Bot, 
  Home, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle, 
  Stethoscope, 
  FlaskConical, 
  Database,
  Search,
  Languages,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../shared/LanguageContext';

export default function AppShell({
  children,
  currentUser,
  userRole,
  onLogout,
  onSwitchRole,
  isOffline,
  toggleOffline,
  offlineQueueCount,
  onSyncNow,
  theme,
  toggleTheme,
  unreadNotifications,
  onOpenNotifications,
  activeNav,
  setActiveNav,
  globalSearch,
  setGlobalSearch
}) {
  const { t, language, setLanguage, languages } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showDemoRoleMenu, setShowDemoRoleMenu] = useState(false);

  const roleMeta = {
    chw: {
      title: t('roleCHW'),
      badge: 'Frontline Field EMR',
      icon: Users,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50'
    },
    doctor: {
      title: t('roleDoctor'),
      badge: 'Clinical Referral Review',
      icon: Stethoscope,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    patient: {
      title: t('rolePatient'),
      badge: 'Personal Health Passport',
      icon: Heart,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    supervisor: {
      title: t('roleSupervisor'),
      badge: 'Population Analytics',
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    admin: {
      title: t('roleAdmin'),
      badge: 'Infrastructure & FHIR',
      icon: Settings,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  };

  const navConfigs = {
    chw: [
      { id: 'home', label: t('navDashboard'), icon: Home },
      { id: 'patients', label: t('navPatients'), icon: Users },
      { id: 'screening', label: t('navScreening'), icon: BrainCircuit, badge: '7-Step' },
      { id: 'counselling', label: t('navCounselling'), icon: BookOpen },
      { id: 'referrals', label: t('navReferrals'), icon: Hospital },
      { id: 'medications', label: t('navMedications'), icon: Pill },
      { id: 'followups', label: t('navFollowups'), icon: Clock },
      { id: 'offline', label: t('navOfflineSync'), icon: WifiOff, count: offlineQueueCount }
    ],
    doctor: [
      { id: 'triage', label: t('navTriage'), icon: Hospital, badge: 'Priority' },
      { id: 'patients', label: t('navDoctorRecords'), icon: Users },
      { id: 'prescriptions', label: t('navPrescriptions'), icon: Pill }
    ],
    patient: [
      { id: 'overview', label: t('navHealthOverview'), icon: Home },
      { id: 'medicines', label: t('navDailyMeds'), icon: Pill },
      { id: 'chatbot', label: t('navAssistant'), icon: Bot, badge: 'AI' },
      { id: 'ocr', label: t('navPrescriptionScanner'), icon: Camera },
      { id: 'family', label: t('navFamily'), icon: Users },
      { id: 'appointments', label: t('navAppointments'), icon: Hospital }
    ],
    supervisor: [
      { id: 'overview', label: t('navSystemOverview'), icon: Activity },
      { id: 'analytics', label: t('navAnalytics'), icon: BrainCircuit },
      { id: 'chws', label: t('navCHWActivity'), icon: Users },
      { id: 'referrals', label: t('navReferrals'), icon: Hospital },
      { id: 'reports', label: t('navReports'), icon: FileText }
    ],
    admin: [
      { id: 'overview', label: t('navSystemOverview'), icon: Activity },
      { id: 'test_lab', label: t('navTestLab'), icon: FlaskConical, badge: 'CDSS' },
      { id: 'users', label: t('navUsers'), icon: Users },
      { id: 'hospitals', label: t('navHospitals'), icon: Hospital },
      { id: 'ml_config', label: t('navClinicalCutoffs'), icon: BrainCircuit },
      { id: 'fhir', label: t('navFHIR'), icon: Database, badge: 'LOINC' },
      { id: 'audit', label: t('navAuditLogs'), icon: ShieldCheck }
    ]
  };

  const currentNavItems = navConfigs[userRole] || navConfigs.chw;
  const currentRoleMeta = roleMeta[userRole] || roleMeta.chw;
  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="authenticated-app-shell">
      {/* TOPBAR */}
      <header className="shell-topbar">
        <div className="shell-brand">
          <div className="brand-icon-box" style={{ width: 34, height: 34 }}>
            <Heart size={18} />
          </div>
          <div>
            <span className="shell-brand-name">CHW Healthcare Toolkit</span>
            <span className="shell-brand-sub">{currentRoleMeta.title}</span>
          </div>
        </div>

        {/* Global Search */}
        {(userRole === 'chw' || userRole === 'supervisor' || userRole === 'doctor') && (
          <div className="shell-search-box">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patient name, ID (e.g. P7204), or village..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="shell-search-input text-xs"
            />
            {globalSearch && (
              <button 
                onClick={() => setGlobalSearch('')}
                style={{ position: 'absolute', right: 10, color: '#94a3b8', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="shell-topbar-right">
          {/* Connectivity Status Toggle */}
          <button 
            className={`shell-connectivity-badge ${isOffline ? 'offline' : 'online'}`}
            onClick={toggleOffline}
            title={isOffline ? 'Offline Mode Active. Click to simulate Cloud Online.' : 'Cloud Synchronized. Click to simulate Offline.'}
          >
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span>{isOffline ? 'Offline Mode' : 'Cloud Sync'}</span>
          </button>

          {/* Sync Trigger */}
          {offlineQueueCount > 0 && (
            <button 
              className="shell-sync-btn"
              onClick={onSyncNow}
              title={`${offlineQueueCount} record(s) queued for sync.`}
            >
              <RefreshCw size={12} />
              <span>{t('syncNow')} ({offlineQueueCount})</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              className="shell-icon-btn"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              title="Change Application Language"
              style={{ width: 'auto', padding: '0 10px', gap: '6px', fontSize: '0.78rem', fontWeight: 600 }}
            >
              <Languages size={15} />
              <span>{currentLangObj.native}</span>
            </button>

            {showLanguageMenu && (
              <div 
                className="demo-role-dropdown-menu" 
                style={{ top: '110%', bottom: 'auto', right: 0, left: 'auto', width: 140 }}
              >
                {languages.map(l => (
                  <button
                    key={l.code}
                    className={`demo-role-item ${language === l.code ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLanguageMenu(false);
                    }}
                  >
                    <strong>{l.native}</strong> ({l.label})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Trigger */}
          <button 
            className="shell-icon-btn"
            onClick={onOpenNotifications}
            title="Clinical Alerts & Notifications"
          >
            <Bell size={16} />
            {unreadNotifications > 0 && (
              <span className="shell-notif-dot">{unreadNotifications}</span>
            )}
          </button>

          {/* Theme Toggle */}
          <button 
            className="shell-icon-btn"
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Profile & Logout */}
          <div className="shell-user-block">
            <div className="shell-avatar">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="shell-user-text">
              <span className="shell-user-name">{currentUser?.name || 'Staff User'}</span>
              <span className="shell-user-role">{currentRoleMeta.badge}</span>
            </div>
            <button 
              className="btn btn-danger-outline text-xs py-1 px-2.5"
              onClick={onLogout}
              title="Sign Out of Session"
            >
              <LogOut size={13} />
              <span>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* APP BODY */}
      <div className="shell-body">
        {/* SIDEBAR NAVIGATION */}
        <aside className="shell-sidebar">
          <div className="sidebar-role-header">
            <span className="metric-label text-2xs block mb-1">Active Workspace</span>
            <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 flex items-center gap-2.5">
              <currentRoleMeta.icon size={18} className="text-sky-700" />
              <div>
                <strong className="text-xs text-slate-900 block font-bold leading-tight">
                  {currentRoleMeta.title.split(' ')[0]} {currentRoleMeta.title.split(' ')[1] || ''}
                </strong>
                <span className="text-3xs text-sky-700 font-semibold">Verified Session</span>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <span className="metric-label text-2xs block px-2 mb-1">Navigation</span>
            {currentNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && <span className="badge badge-primary text-3xs">{item.badge}</span>}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="badge badge-risk-high text-3xs">{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ISOLATED DEMO SANDBOX DRAWER AT BOTTOM */}
          <div className="sidebar-demo-box">
            <span className="metric-label text-3xs text-slate-400 block mb-1">Evaluator Sandbox</span>
            <button
              className="btn btn-secondary text-xs w-full justify-between"
              onClick={() => setShowDemoRoleMenu(!showDemoRoleMenu)}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Layers size={14} className="text-indigo-600" /> Switch Demo Role
              </span>
              <span className="text-3xs text-slate-400">▲</span>
            </button>

            {showDemoRoleMenu && (
              <div className="demo-role-dropdown-menu">
                <button 
                  className={`demo-role-item ${userRole === 'chw' ? 'active' : ''}`}
                  onClick={() => { onSwitchRole('chw'); setShowDemoRoleMenu(false); }}
                >
                  👩‍⚕️ CHW Field Worker
                </button>
                <button 
                  className={`demo-role-item ${userRole === 'doctor' ? 'active' : ''}`}
                  onClick={() => { onSwitchRole('doctor'); setShowDemoRoleMenu(false); }}
                >
                  👨‍⚕️ Medical Officer / Doctor
                </button>
                <button 
                  className={`demo-role-item ${userRole === 'patient' ? 'active' : ''}`}
                  onClick={() => { onSwitchRole('patient'); setShowDemoRoleMenu(false); }}
                >
                  👤 Patient Health Hub
                </button>
                <button 
                  className={`demo-role-item ${userRole === 'supervisor' ? 'active' : ''}`}
                  onClick={() => { onSwitchRole('supervisor'); setShowDemoRoleMenu(false); }}
                >
                  📊 Health Supervisor
                </button>
                <button 
                  className={`demo-role-item ${userRole === 'admin' ? 'active' : ''}`}
                  onClick={() => { onSwitchRole('admin'); setShowDemoRoleMenu(false); }}
                >
                  ⚙️ System Administrator
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main className="shell-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
