import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import LandingPage from './components/public/LandingPage';
import SignInPage from './components/auth/SignInPage';
import AppShell from './components/layout/AppShell';
import RoleGuard from './components/auth/RoleGuard';

// Route-Based Code Splitting: CHWs on rural 3G do not download monolithic Doctor/Supervisor/Admin code
const CHWPortal = lazy(() => import('./components/chw/CHWPortal'));
const DoctorPortal = lazy(() => import('./components/doctor/DoctorPortal'));
const SupervisorDashboard = lazy(() => import('./components/supervisor/SupervisorDashboard'));
const AdminPortal = lazy(() => import('./components/admin/AdminPortal'));
const PatientPortal = lazy(() => import('./components/patient/PatientPortal'));

import NotificationsDrawer from './components/shared/NotificationsDrawer';
import { ToastProvider, useToast } from './components/shared/ToastContainer';
import { LanguageProvider, useLanguage } from './components/shared/LanguageContext';
import ErrorBoundary from './components/shared/ErrorBoundary';

import { 
  INITIAL_CHWS, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { assessPatientRisk } from './utils/predictionEngine';
import {
  requestPasswordReset,
  restoreAuthenticatedUser,
  signInWithRole,
  signOutAuthenticatedUser,
} from './lib/auth';
import {
  fetchPatients,
  savePatient,
  deletePatient,
  saveReferral,
  updateReferralStatus,
  savePrescriptions,
  saveCounsellingSession,
  logAuditEvent
} from './lib/db';
import { initSyncEngine, executeSync } from './lib/sync/syncEngine';
import { getPendingSyncQueue, clearLocalDataIfClean } from './lib/db/dexieDb';
import { addNotification, countUnreadNotifications, deleteNotification, loadNotifications, markAllNotificationsRead, markNotificationRead, saveNotifications } from './lib/notifications/notificationStore';
import { getNotificationPermissionState, requestNotificationPermission, showBrowserNotification } from './lib/notifications/browserNotifications';

function PortalFallback() {
  return (
    <div className="card-box p-8 text-center text-slate-500 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-sky-600 border-t-transparent animate-spin mx-auto mb-3" />
      <span className="text-xs font-semibold">Loading clinical workspace...</span>
    </div>
  );
}


function AppContent() {
  const { toastSuccess, toastInfo, toastWarning, toastError } = useToast();
  const { t } = useLanguage();

  // Session State: Default to null on fresh load (Public Landing)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedSession = sessionStorage.getItem('chw_auth_session');
      return savedSession ? JSON.parse(savedSession) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      const savedSession = sessionStorage.getItem('chw_auth_session');
      return savedSession ? 'app' : 'landing'; // 'landing' | 'auth' | 'app'
    } catch {
      return 'landing';
    }
  });

  const [userRole, setUserRole] = useState(() => {
    try {
      const savedSession = sessionStorage.getItem('chw_auth_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        return parsed.role || 'chw';
      }
      return 'chw';
    } catch {
      return 'chw';
    }
  });

  const [activeNavSection, setActiveNavSection] = useState(() => new URLSearchParams(window.location.search).get('section') || 'home');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    restoreAuthenticatedUser()
      .then((restoredUser) => {
        if (!restoredUser) return;
        setCurrentUser(restoredUser);
        setUserRole(restoredUser.role);
        setActiveNavSection(restoredUser.role === 'doctor' ? 'triage' : 'overview');
        setCurrentView('app');
      })
      .catch(() => {})
      .finally(() => setAuthReady(true));
  }, []);

  // Theme State with localStorage persistence
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('chw_app_theme');
      return savedTheme === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [isOffline, setIsOffline] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // User-scoped patient dataset
  const [patients, setPatients] = useState([]);
  const [notifications, setNotifications] = useState(() => loadNotifications(currentUser?.id));
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermissionState);
  const [systemNotificationsEnabled, setSystemNotificationsEnabled] = useState(() => localStorage.getItem(`chw_system_notifications:${currentUser?.id || 'anonymous'}`) === 'true');
  const notificationsRef = useRef(notifications);
  const notificationSettingsRef = useRef({ permission: notificationPermission, enabled: systemNotificationsEnabled });

  useEffect(() => {
    notificationsRef.current = notifications;
    notificationSettingsRef.current = { permission: notificationPermission, enabled: systemNotificationsEnabled };
  }, [notifications, notificationPermission, systemNotificationsEnabled]);

  useEffect(() => {
    let active = true;
    if (!currentUser) return;

    fetchPatients(currentUser)
      .then((dbPatients) => {
        if (active && Array.isArray(dbPatients)) {
          setPatients(dbPatients);
          const today = new Date().toISOString().slice(0, 10);
          const due = dbPatients.filter(patient => {
            const date = patient.followUpDate || patient.follow_up_date;
            return date && String(date).slice(0, 10) <= today;
          });
          const newDue = due.map(patient => ({
              id: `follow-up-${patient.id}-${today}`,
              entityId: patient.id,
              dedupeKey: `follow-up:${currentUser.id}:${patient.id}:${today}`,
              titleKey: 'notificationFollowUpDue',
              messageKey: 'notificationFollowUpDueBody',
              time: 'Today', type: 'FOLLOW_UP', deepLink: 'patients'
            })).filter(item => !notificationsRef.current.some(existing => existing.dedupeKey === item.dedupeKey));
          if (newDue.length) {
            setNotifications(current => newDue.reduce((items, notification) => addNotification(items, notification), current));
            toastWarning(t('notificationFollowUpDue'));
            if (notificationSettingsRef.current.enabled && notificationSettingsRef.current.permission === 'granted') {
              newDue.forEach(notification => showBrowserNotification({ ...notification, title: t(notification.titleKey), browserBody: t('browserAlertBody') }, (clicked) => {
                if (clicked.deepLink) setActiveNavSection(clicked.deepLink);
                setShowNotificationsDrawer(true);
              }));
            }
          }
        }
      })
      .catch((err) => {
        console.warn('Could not initialize patients for user:', err);
        if (active) setPatients([]);
      });

    return () => { active = false; };
  }, [currentUser, t, toastWarning]);

  // Real-time synchronization engine background listeners
  useEffect(() => {
    const cleanup = initSyncEngine();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const [chwList] = useState(INITIAL_CHWS);

  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('chw_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [syncLogs, setSyncLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('chw_sync_logs');
      return saved ? JSON.parse(saved) : [
        { id: 'L-9101', timestamp: '2026-06-12 09:30 AM', type: 'Daily Batch Sync', count: 2, device: 'CHW Handheld Tablet #1' },
        { id: 'L-9102', timestamp: '2026-06-11 04:15 PM', type: 'Instant Sync', count: 1, device: 'CHW Handheld Tablet #2' }
      ];
    } catch {
      return [
        { id: 'L-9101', timestamp: '2026-06-12 09:30 AM', type: 'Daily Batch Sync', count: 2, device: 'CHW Handheld Tablet #1' },
        { id: 'L-9102', timestamp: '2026-06-11 04:15 PM', type: 'Instant Sync', count: 1, device: 'CHW Handheld Tablet #2' }
      ];
    }
  });

  const [auditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Medical data loading is handled via local state only

  // Sync state changes to scoped localStorage
  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`chw_patients_${currentUser.id}`, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to persist scoped patients:', e);
    }
  }, [patients, currentUser?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('chw_offline_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      console.error('Failed to persist offline queue:', e);
    }
  }, [offlineQueue]);

  useEffect(() => {
    try {
      localStorage.setItem('chw_sync_logs', JSON.stringify(syncLogs));
    } catch (e) {
      console.error('Failed to persist sync logs:', e);
    }
  }, [syncLogs]);

  // Sync theme to root and persist
  useEffect(() => {
    try {
      localStorage.setItem('chw_app_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      const root = document.getElementById('root');
      if (root) {
        root.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
      }
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  }, [theme]);

  useEffect(() => {
    saveNotifications(currentUser?.id, notifications);
  }, [currentUser?.id, notifications]);

  const publishNotification = (notification) => {
    setNotifications((current) => addNotification(current, notification));
    if (systemNotificationsEnabled && notificationPermission === 'granted') {
      showBrowserNotification({ ...notification, title: t(notification.titleKey) || notification.title, browserBody: t('browserAlertBody') }, (clicked) => {
        if (clicked.deepLink) setActiveNavSection(clicked.deepLink);
        setShowNotificationsDrawer(true);
      });
    }
  };

  const handleToggleSystemNotifications = async () => {
    if (systemNotificationsEnabled) {
      setSystemNotificationsEnabled(false);
      localStorage.setItem(`chw_system_notifications:${currentUser?.id || 'anonymous'}`, 'false');
      return;
    }
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      setSystemNotificationsEnabled(true);
      localStorage.setItem(`chw_system_notifications:${currentUser?.id || 'anonymous'}`, 'true');
    }
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const handleNotificationClick = (event) => {
      if (event.data?.type !== 'CHW_NOTIFICATION_CLICK') return;
      if (event.data.deepLink) setActiveNavSection(event.data.deepLink);
      setShowNotificationsDrawer(true);
    };
    navigator.serviceWorker.addEventListener('message', handleNotificationClick);
    return () => navigator.serviceWorker.removeEventListener('message', handleNotificationClick);
  }, []);

  // -------------------------------------------------------------
  // AUTH HANDLERS
  // -------------------------------------------------------------
  const handleLogin = (userObj) => {
    setCurrentUser(userObj);
    setNotifications(loadNotifications(userObj.id));
    setSystemNotificationsEnabled(localStorage.getItem(`chw_system_notifications:${userObj.id || 'anonymous'}`) === 'true');
    setUserRole(userObj.role || 'chw');
    setActiveNavSection(userObj.role === 'doctor' ? 'triage' : (userObj.role === 'patient' ? 'overview' : (userObj.role === 'supervisor' ? 'overview' : (userObj.role === 'admin' ? 'overview' : 'home'))));
    setCurrentView('app');
    toastSuccess(`Welcome back, ${userObj.name}!`);
    try {
      sessionStorage.setItem('chw_auth_session', JSON.stringify(userObj));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const handleAuthenticate = async (credentials) => {
    const authenticatedUser = await signInWithRole(credentials);
    handleLogin(authenticatedUser);
  };

  const handlePasswordReset = async (email) => {
    return await requestPasswordReset(email);
  };

  const handleLogout = async () => {
    try {
      const pending = await getPendingSyncQueue();
      if (pending && pending.length > 0) {
        const confirmed = window.confirm(
          `Notice: You have ${pending.length} unsynced record(s) stored locally on this device.\n\n` +
          `If you log out now, local data cannot be synced to the clinic central registry until you sign back in.\n\n` +
          `Do you still want to proceed with signing out?`
        );
        if (!confirmed) return;
      } else {
        await clearLocalDataIfClean();
      }
    } catch (e) {
      console.warn('Sync queue check on logout notice:', e);
    }

    try {
      await signOutAuthenticatedUser();
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setCurrentUser(null);
    setNotifications(loadNotifications(null));
    setSystemNotificationsEnabled(localStorage.getItem('chw_system_notifications:anonymous') === 'true');
    setUserRole('chw');
    setPatients([]);
    setActiveNavSection('home');
    setCurrentView('landing');
    setShowNotificationsDrawer(false);
    toastInfo('You have been securely signed out.');
    try {
      sessionStorage.removeItem('chw_auth_session');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  // -------------------------------------------------------------
  // PATIENT MUTATION HANDLERS (Connected to Database Layer)
  // -------------------------------------------------------------
  const handleSavePatient = async (patientRecord) => {
    const evaluation = assessPatientRisk(patientRecord);
    const isHighRisk = evaluation.overallRiskLevel === 'High' || evaluation.overallRiskLevel === 'Critical' || (parseFloat(patientRecord.systolic) >= 180);

    const evaluatedRecord = {
      ...patientRecord,
      evaluation,
      isPriority: isHighRisk,
      followUpDate: isHighRisk ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : (patientRecord.followUpDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    };

    if (isHighRisk) {
      const highRiskNotif = {
        id: 'n-' + Date.now(),
        titleKey: 'notificationHighRisk',
        messageKey: 'notificationHighRiskBody',
        time: 'Just now',
        type: 'CRITICAL_ALERT',
        read: false
      };
      highRiskNotif.entityId = evaluatedRecord.id;
      highRiskNotif.dedupeKey = `critical:${evaluatedRecord.id}:${new Date().toISOString().slice(0, 10)}`;
      highRiskNotif.deepLink = 'screening';
      publishNotification(highRiskNotif);
      toastWarning(`High Risk flagged for ${evaluatedRecord.name} (${evaluation.overallRiskLevel} Risk)`);
    } else {
      toastSuccess(`Patient record saved for ${evaluatedRecord.name}`);
    }

    // Persist via Database Access Layer (records patient & creates a new visit row)
    try {
      await savePatient(evaluatedRecord, currentUser);
      await logAuditEvent('SCREENING_SAVED', 'visits', evaluatedRecord.id, `Recorded vitals encounter BP ${evaluatedRecord.systolic}/${evaluatedRecord.diastolic}`, currentUser);
    } catch (err) {
      console.error('Error saving patient to database layer:', err);
      toastError(`Cloud Save Error: ${err.message || 'Database connection error'}. Queued in offline store for retry.`);
      setOfflineQueue(prev => [evaluatedRecord, ...prev]);
    }

    if (isOffline) {
      setOfflineQueue(prev => [evaluatedRecord, ...prev]);
      toastInfo('Offline mode active. Record queued locally for synchronization.');
    } else {
      setPatients(prev => {
        const index = prev.findIndex(p => p.id === evaluatedRecord.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = evaluatedRecord;
          return next;
        }
        return [evaluatedRecord, ...prev];
      });

      const logEntry = {
        id: 'L-' + Math.floor(9000 + Math.random() * 999),
        timestamp: new Date().toLocaleString(),
        type: isHighRisk ? 'High-Risk Priority Sync' : 'Instant Sync',
        count: 1,
        device: 'CHW Handheld Field App'
      };
      setSyncLogs(prev => [logEntry, ...prev]);
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      try {
        await deletePatient(patientId, currentUser);
        await logAuditEvent('PATIENT_DELETED', 'patients', patientId, 'Patient record soft deleted', currentUser);
        setPatients(prev => prev.filter(p => p.id !== patientId));
        toastInfo(`Patient record ${patientId} removed.`);
      } catch (err) {
        console.error('Delete patient error:', err);
        toastError(`Failed to delete patient ${patientId}: ${err.message || 'Operation failed'}. Please retry.`);
      }
    }
  };

  const handleUpdatePatientMedicines = async (patientId, newMedicines) => {
    try {
      await savePrescriptions(patientId, newMedicines);
      await logAuditEvent('PRESCRIPTIONS_UPDATED', 'prescriptions', patientId, `Updated ${newMedicines.length} medication orders`, currentUser);
    } catch (err) {
      console.warn('Save prescriptions error:', err);
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, medicines: newMedicines };
      }
      return p;
    }));
    toastSuccess('Medication orders updated.');
    return newMedicines;
  };

  const handleAddReport = (patientId, newReport) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, reports: [newReport, ...(p.reports || [])] };
      }
      return p;
    }));
    toastSuccess('Clinical report uploaded.');
  };

  const handleSaveCounsellingSession = async (patientId, sessionRecord) => {
    try {
      await saveCounsellingSession(patientId, sessionRecord);
      await logAuditEvent('COUNSELLING_RECORDED', 'counselling_sessions', patientId, `ThinkLets session ${sessionRecord.scriptId || ''} completed`, currentUser);
    } catch (err) {
      console.warn('Save counselling error:', err);
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, counsellingHistory: [sessionRecord, ...(p.counsellingHistory || [])] };
      }
      return p;
    }));
    toastSuccess('ThinkLets counselling session recorded.');
  };

  const handleSaveReferral = async (patientId, referralObj) => {
    try {
      await saveReferral(patientId, referralObj);
      await logAuditEvent('REFERRAL_DISPATCHED', 'referrals', patientId, `Referral sent to ${referralObj.hospitalName}`, currentUser);
    } catch (err) {
      console.warn('Save referral error:', err);
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, referral: referralObj };
      }
      return p;
    }));

    const newNotif = {
      id: 'n-' + Date.now(),
      titleKey: 'notificationReferralCreated',
      messageKey: 'notificationReferralCreatedBody',
      time: 'Just now',
      type: 'REFERRAL_UPDATE',
      read: false
    };
    newNotif.entityId = patientId;
    newNotif.dedupeKey = `referral-created:${patientId}`;
    newNotif.deepLink = 'referrals';
    publishNotification(newNotif);
    toastSuccess(`Hospital referral submitted to ${referralObj.hospitalName}`);
  };

  const handleApproveReferral = async (patientId, doctorNotes) => {
    try {
      await updateReferralStatus(patientId, 'approved', doctorNotes);
      await logAuditEvent('REFERRAL_APPROVED', 'referrals', patientId, doctorNotes, currentUser);
    } catch (err) {
      console.warn('Approve referral error:', err);
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId && p.referral) {
        return {
          ...p,
          referral: { ...p.referral, status: 'Approved', notes: doctorNotes }
        };
      }
      return p;
    }));
    toastSuccess(`Referral treatment plan approved for patient ID ${patientId}`);
    publishNotification({
      id: `referral-approved-${patientId}-${Date.now()}`,
      entityId: patientId,
      dedupeKey: `referral-approved:${patientId}`,
      titleKey: 'notificationReferralApproved',
      messageKey: 'notificationReferralApprovedBody',
      time: 'Just now', type: 'REFERRAL_UPDATE', deepLink: 'referrals'
    });
    return true;
  };

  const handleRejectReferral = async (patientId, doctorNotes) => {
    try {
      await updateReferralStatus(patientId, 'declined', doctorNotes);
      await logAuditEvent('REFERRAL_DECLINED', 'referrals', patientId, doctorNotes, currentUser);
    } catch (err) {
      console.warn('Reject referral error:', err);
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId && p.referral) {
        return {
          ...p,
          referral: { ...p.referral, status: 'Declined', notes: doctorNotes }
        };
      }
      return p;
    }));
    toastInfo('Referral marked for community primary care management.');
    return true;
  };

  const handleSyncOfflineData = async () => {
    try {
      toastInfo('Starting cloud synchronization with central health registry...');
      const result = await executeSync(currentUser);

      if (result.success) {
        const refreshed = await fetchPatients(currentUser);
        if (Array.isArray(refreshed)) {
          setPatients(refreshed);
        }
        if (result.pushed > 0) {
          const newLog = {
            id: 'L-' + Math.floor(9000 + Math.random() * 999),
            timestamp: new Date().toLocaleString(),
            type: 'Outbox Sync',
            count: result.pushed,
            device: 'CHW Handheld Tablet'
          };
          setSyncLogs(prev => [newLog, ...prev]);
          toastSuccess(`Synchronized ${result.pushed} record(s) successfully!`);
        } else {
          toastSuccess('All records are already fully synchronized.');
        }
      } else if (result.reason === 'offline') {
        toastWarning('Network is currently offline. Screenings remain safely queued on device.');
      } else {
        toastError(result.error || `${result.failed || 1} record(s) failed to sync. Review the sync queue.`);
      }
    } catch (err) {
      console.error('Sync execution failure:', err);
      toastError(`Sync failed: ${err.message || 'Network error'}`);
    }
  };

  const handleRestoreBackup = (restoredPatients) => {
    setPatients(restoredPatients.map(p => ({ ...p, evaluation: assessPatientRisk(p) })));
    toastSuccess('Backup database successfully restored.');
  };

  const unreadCount = countUnreadNotifications(notifications);

  // -------------------------------------------------------------
  // CONDITIONAL RENDERING FLOW
  // -------------------------------------------------------------

  if (!authReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50" aria-live="polite">
        <div className="card-box text-center p-8">
          <strong className="text-sm text-slate-900 block">Verifying secure session</strong>
          <span className="text-xs text-slate-500 mt-1 block">Connecting to the health data service...</span>
        </div>
      </main>
    );
  }

  // 1. PUBLIC LANDING PAGE
  if (!currentUser && currentView === 'landing') {
    return (
      <LandingPage 
        onNavigateToAuth={(preferredRole) => {
          if (preferredRole) setUserRole(preferredRole);
          setCurrentView('auth');
        }}
      />
    );
  }

  // 2. DEDICATED AUTHENTICATION PAGE
  if (!currentUser && currentView === 'auth') {
    return (
      <SignInPage 
        onLogin={handleLogin}
        onAuthenticate={handleAuthenticate}
        onResetPassword={handlePasswordReset}
        onBackToLanding={() => setCurrentView('landing')}
        initialRole={userRole}
      />
    );
  }

  // 3. AUTHENTICATED APPLICATION
  return (
    <AppShell
      currentUser={currentUser}
      userRole={userRole}
      onLogout={handleLogout}
      isOffline={isOffline}
      toggleOffline={() => {
        setIsOffline(!isOffline);
        if (!isOffline) {
          toastWarning('Offline mode activated. Field screenings will be stored locally.');
        } else {
          toastSuccess('Cloud connectivity restored.');
        }
      }}
      offlineQueueCount={offlineQueue.length}
      onSyncNow={handleSyncOfflineData}
      theme={theme}
      toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
      unreadNotifications={unreadCount}
      onOpenNotifications={() => setShowNotificationsDrawer(true)}
      globalSearch={globalSearch}
      setGlobalSearch={setGlobalSearch}
      activeNav={activeNavSection}
      setActiveNav={setActiveNavSection}
    >
      {/* Role-Based Portal Routing with Suspense Code Splitting */}
      <Suspense fallback={<PortalFallback />}>
        {userRole === 'chw' && (
          <RoleGuard currentUser={currentUser} requiredRole="chw" onRedirect={(r) => setUserRole(r)}>
            <CHWPortal 
              patients={patients}
              onSavePatient={handleSavePatient}
              onDeletePatient={handleDeletePatient}
              onUpdatePatientMedicines={handleUpdatePatientMedicines}
              onAddReport={handleAddReport}
              onSaveCounsellingSession={handleSaveCounsellingSession}
              onSaveReferral={handleSaveReferral}
              isOffline={isOffline}
              toggleOffline={() => setIsOffline(!isOffline)}
              offlineQueue={offlineQueue}
              syncLogs={syncLogs}
              onSyncOfflineData={handleSyncOfflineData}
              onRestoreBackup={handleRestoreBackup}
              userRole={userRole}
              globalSearch={globalSearch}
              activeSection={activeNavSection}
              currentUser={currentUser}
            />
          </RoleGuard>
        )}

        {userRole === 'patient' && (
          <RoleGuard currentUser={currentUser} requiredRole="patient" onRedirect={(r) => setUserRole(r)}>
            <PatientPortal 
              patients={patients} 
              onSavePatient={handleSavePatient} 
              activeSection={activeNavSection}
            />
          </RoleGuard>
        )}

        {userRole === 'doctor' && (
          <RoleGuard currentUser={currentUser} requiredRole="doctor" onRedirect={(r) => setUserRole(r)}>
            <DoctorPortal 
              patients={patients}
              onApproveReferral={handleApproveReferral}
              onRejectReferral={handleRejectReferral}
              onUpdatePatientMedicines={handleUpdatePatientMedicines}
              onAddReport={handleAddReport}
              onSaveReferral={handleSaveReferral}
              activeSection={activeNavSection}
              isLoading={false}
            />
          </RoleGuard>
        )}

        {userRole === 'supervisor' && (
          <RoleGuard currentUser={currentUser} requiredRole="supervisor" onRedirect={(r) => setUserRole(r)}>
            <SupervisorDashboard 
              patients={patients}
              chwList={chwList}
              syncLogs={syncLogs}
              activeSection={activeNavSection}
            />
          </RoleGuard>
        )}

        {userRole === 'admin' && (
          <RoleGuard currentUser={currentUser} requiredRole="admin" onRedirect={(r) => setUserRole(r)}>
            <AdminPortal 
              auditLogs={auditLogs} 
              patients={patients} 
              activeSection={activeNavSection}
            />
          </RoleGuard>
        )}
      </Suspense>

      {/* Notifications Drawer Overlay */}
      {showNotificationsDrawer && (
        <NotificationsDrawer 
          notifications={notifications}
          onClose={() => setShowNotificationsDrawer(false)}
          permissionState={notificationPermission}
          systemNotificationsEnabled={systemNotificationsEnabled}
          onToggleSystemNotifications={handleToggleSystemNotifications}
          onSelectNotification={(notification) => {
            setNotifications((current) => markNotificationRead(current, notification.id));
            setShowNotificationsDrawer(false);
            if (notification.deepLink) {
              setActiveNavSection(notification.deepLink);
            } else if (notification.type === 'CRITICAL_ALERT' || notification.type === 'MEDICATION_ALERT') {
              setActiveNavSection(userRole === 'patient' ? 'medicines' : 'patients');
            } else if (notification.type === 'REFERRAL_UPDATE' && userRole === 'chw') {
              setActiveNavSection('referrals');
            }
          }}
          onMarkRead={(id) => setNotifications(current => markNotificationRead(current, id))}
          onDeleteNotification={(id) => setNotifications(current => deleteNotification(current, id))}
          onMarkAllRead={() => {
            setNotifications(prev => markAllNotificationsRead(prev));
            toastInfo('All notifications marked as read.');
          }}
        />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
