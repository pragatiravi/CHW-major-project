import { useState, useEffect } from 'react';
import { 
  Heart, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  Sun, 
  Moon, 
  LogOut,
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
  Stethoscope, 
  FlaskConical, 
  Database,
  Search,
  Languages,
  Menu,
  X,
  Download,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../shared/LanguageContext';
import { subscribeSyncStatus, executeSync } from '../../lib/sync/syncEngine';
import { subscribeToInstallPrompt, promptPWAInstall } from '../../registerServiceWorker';

export default function AppShell({
  children,
  currentUser,
  userRole,
  onLogout,
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
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [syncState, setSyncState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    status: 'synced',
    pendingCount: offlineQueueCount || 0,
    conflictsCount: 0,
    lastSyncedAt: null,
    lastError: null
  });

  useEffect(() => {
    const unsubSync = subscribeSyncStatus((state) => {
      setSyncState(state);
    });
    const unsubInstall = subscribeToInstallPrompt((canInstall) => {
      setCanInstallPWA(canInstall);
    });
    return () => {
      unsubSync();
      unsubInstall();
    };
  }, []);

  const handleManualSync = async () => {
    if (onSyncNow) {
      await onSyncNow();
    } else {
      await executeSync(currentUser);
    }
  };

  const handleInstallClick = async () => {
    const installed = await promptPWAInstall();
    if (installed) {
      setCanInstallPWA(false);
    }
  };

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
      { id: 'chatbot', label: t('navAssistant'), icon: Bot, badge: 'Guide' },
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
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {/* TOPBAR */}
      <header className="shell-topbar">
        <button
          className="shell-mobile-menu-btn"
          type="button"
          onClick={() => setShowMobileNav((open) => !open)}
          aria-label={showMobileNav ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={showMobileNav}
          aria-controls="primary-sidebar"
        >
          {showMobileNav ? <X size={20} /> : <Menu size={20} />}
        </button>

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
                type="button"
                onClick={() => setGlobalSearch('')}
                className="shell-search-clear"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="shell-topbar-right">
          {/* Live Sync Status Indicator */}
          {(!syncState.isOnline || isOffline) ? (
            <button 
              type="button"
              className="shell-connectivity-badge offline"
              onClick={toggleOffline}
              title="Offline Mode Active. Click to simulate Cloud Online."
            >
              <WifiOff size={14} />
              <span>Offline ({syncState.pendingCount || offlineQueueCount || 0})</span>
            </button>
          ) : syncState.status === 'syncing' ? (
            <button 
              type="button"
              className="shell-connectivity-badge syncing"
              title="Synchronizing local mutations with central registry..."
            >
              <RefreshCw size={14} className="animate-spin text-amber-700" />
              <span>Syncing...</span>
            </button>
          ) : syncState.status === 'error' ? (
            <button 
              type="button"
              className="shell-connectivity-badge offline"
              onClick={handleManualSync}
              title={syncState.lastError || 'Sync failed. Click to retry.'}
            >
              <AlertCircle size={14} />
              <span>Sync Issue ({syncState.pendingCount})</span>
            </button>
          ) : (
            <button 
              type="button"
              className="shell-connectivity-badge online"
              onClick={toggleOffline}
              title={syncState.lastSyncedAt ? `Last synced: ${new Date(syncState.lastSyncedAt).toLocaleTimeString()}` : 'Cloud Synchronized. Click to toggle offline mode.'}
            >
              <Wifi size={14} />
              <span>{syncState.pendingCount > 0 ? `${syncState.pendingCount} Pending` : 'Cloud Synced'}</span>
            </button>
          )}

          {/* Sync Conflicts Alert */}
          {syncState.conflictsCount > 0 && (
            <button 
              type="button"
              className="badge badge-risk-critical text-2xs cursor-pointer flex items-center gap-1 py-1 px-2"
              onClick={() => setActiveNav('offline')}
              title={`${syncState.conflictsCount} sync conflict(s) require manual resolution in the Sync Hub`}
            >
              <AlertCircle size={12} />
              <span>Conflicts ({syncState.conflictsCount})</span>
            </button>
          )}

          {/* Sync Trigger */}
          {(syncState.pendingCount > 0 || offlineQueueCount > 0) && (
            <button 
              type="button"
              className="shell-sync-btn"
              onClick={handleManualSync}
              disabled={syncState.status === 'syncing'}
              title={`${syncState.pendingCount || offlineQueueCount} record(s) queued for sync.`}
            >
              <RefreshCw size={12} className={syncState.status === 'syncing' ? 'animate-spin' : ''} />
              <span>{t('syncNow')} ({syncState.pendingCount || offlineQueueCount})</span>
            </button>
          )}

          {/* PWA Install Button */}
          {canInstallPWA && (
            <button 
              type="button"
              className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
              onClick={handleInstallClick}
              title="Install CHW Toolkit as an Offline Android PWA App"
            >
              <Download size={13} className="text-sky-600" />
              <span>Install App</span>
            </button>
          )}

          {/* Language Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              type="button"
              className="shell-icon-btn"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              title="Change Application Language"
              aria-label={`Change language. Current language: ${currentLangObj.label}`}
              aria-expanded={showLanguageMenu}
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
            type="button"
            className="shell-icon-btn"
            onClick={onOpenNotifications}
            title="Clinical Alerts & Notifications"
            aria-label={`Open notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
          >
            <Bell size={16} />
            {unreadNotifications > 0 && (
              <span className="shell-notif-dot">{unreadNotifications}</span>
            )}
          </button>

          {/* Theme Toggle */}
          <button 
            type="button"
            className="shell-icon-btn"
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
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
        {showMobileNav && (
          <button
            type="button"
            className="shell-sidebar-backdrop"
            onClick={() => setShowMobileNav(false)}
            aria-label="Close navigation menu"
          />
        )}
        <aside id="primary-sidebar" className={`shell-sidebar ${showMobileNav ? 'is-open' : ''}`}>
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
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveNav(item.id);
                    setShowMobileNav(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
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
        </aside>

        {/* MAIN WORKSPACE CONTENT */}
        <main id="main-content" className="shell-main-content" tabIndex="-1">
          {children}
        </main>
      </div>
    </div>
  );
}
