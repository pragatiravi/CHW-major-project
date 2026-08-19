import { useState, useEffect } from 'react';
import LandingPage from './components/public/LandingPage';
import SignInPage from './components/auth/SignInPage';
import AppShell from './components/layout/AppShell';

import CHWPortal from './components/chw/CHWPortal';
import DoctorPortal from './components/doctor/DoctorPortal';
import SupervisorDashboard from './components/supervisor/SupervisorDashboard';
import AdminPortal from './components/admin/AdminPortal';
import PatientPortal from './components/patient/PatientPortal';
import NotificationsDrawer from './components/shared/NotificationsDrawer';
import { ToastProvider, useToast } from './components/shared/ToastContainer';
import { LanguageProvider } from './components/shared/LanguageContext';

import { 
  INITIAL_PATIENTS, 
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
  fetchMedicalOfficerPatients,
  reviewMedicalOfficerReferral,
  syncMedicalOfficerMedicationOrders,
} from './lib/medicalOfficerData';

const DEMO_ACCESS_ENABLED = import.meta.env.VITE_ENABLE_DEMO_ACCESS !== 'false';

function AppContent() {
  const { toastSuccess, toastInfo, toastWarning, toastError } = useToast();

  // Session State: Default to null on fresh load (Public Landing)
  const [currentUser, setCurrentUser] = useState(() => {
    if (!DEMO_ACCESS_ENABLED) return null;
    try {
      const savedSession = sessionStorage.getItem('chw_auth_session');
      return savedSession ? JSON.parse(savedSession) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    if (!DEMO_ACCESS_ENABLED) return 'landing';
    try {
      const savedSession = sessionStorage.getItem('chw_auth_session');
      return savedSession ? 'app' : 'landing'; // 'landing' | 'auth' | 'app'
    } catch {
      return 'landing';
    }
  });

  const [userRole, setUserRole] = useState(() => {
    if (!DEMO_ACCESS_ENABLED) return 'chw';
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

  const [activeNavSection, setActiveNavSection] = useState('home');
  const [authReady, setAuthReady] = useState(false);
  const [medicalDataLoading, setMedicalDataLoading] = useState(false);

  useEffect(() => {
    let active = true;

    restoreAuthenticatedUser()
      .then((restoredUser) => {
        if (!active || !restoredUser) return;
        setCurrentUser(restoredUser);
        setUserRole(restoredUser.role);
        setActiveNavSection(restoredUser.role === 'doctor' ? 'triage' : 'overview');
        setCurrentView('app');
      })
      .catch((error) => {
        if (active) toastError(error.message);
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, [toastError]);

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

  // Core Data States with localStorage persistence
  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('chw_patients');
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

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

  useEffect(() => {
    if (currentUser?.source !== 'supabase' || userRole !== 'doctor') return undefined;

    let active = true;
    const loadSecuredPatients = async () => {
      await Promise.resolve();
      if (!active) return;

      setMedicalDataLoading(true);
      setPatients([]);

      try {
        const securedPatients = await fetchMedicalOfficerPatients();
        if (active) setPatients(securedPatients);
      } catch (error) {
        if (active) toastError(error.message, 7000);
      } finally {
        if (active) setMedicalDataLoading(false);
      }
    };

    loadSecuredPatients();

    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.source, userRole, toastError]);

  // Sync state changes to localStorage
  useEffect(() => {
    if (currentUser?.source === 'supabase') return;
    try {
      localStorage.setItem('chw_patients', JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to persist patients:', e);
    }
  }, [patients, currentUser?.source]);

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

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      title: 'Critical hypertensive crisis alert',
      message: 'Fatima Begum (P4389) BP 185/112 mmHg with chest pain. Urgent referral generated.',
      time: '10 mins ago',
      type: 'CRITICAL_ALERT',
      read: false
    },
    {
      id: 'n-2',
      title: 'Missed medication alert',
      message: 'Priya Sharma (P7204) logged 1 missed dose for Amlodipine 5mg.',
      time: '1 hour ago',
      type: 'MEDICATION_ALERT',
      read: false
    },
    {
      id: 'n-3',
      title: 'Doctor referral approved',
      message: 'Dr. Ananya Roy approved referral treatment plan for Priya Sharma (P7204).',
      time: '3 hours ago',
      type: 'REFERRAL_UPDATE',
      read: true
    }
  ]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // -------------------------------------------------------------
  // AUTH HANDLERS
  // -------------------------------------------------------------
  const handleLogin = (userObj) => {
    setCurrentUser(userObj);
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
    await requestPasswordReset(email);
  };

  const handleLogout = async () => {
    if (currentUser?.source === 'supabase') {
      try {
        await signOutAuthenticatedUser();
      } catch (error) {
        toastError(error.message);
        return;
      }
    }

    setCurrentUser(null);
    setUserRole('chw');
    setActiveNavSection('home');
    setCurrentView('landing');
    setShowNotificationsDrawer(false);
    setPatients(INITIAL_PATIENTS);
    toastInfo('You have been securely signed out.');
    try {
      sessionStorage.removeItem('chw_auth_session');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  const handleQuickDemoLogin = (role) => {
    if (!DEMO_ACCESS_ENABLED) {
      setUserRole(role || 'chw');
      setCurrentView('auth');
      toastInfo('One-click evaluator access is disabled. Enter the matching demo credentials to continue.');
      return;
    }

    const demoAccounts = {
      chw: { name: 'Sunita Patil (CHW)', email: 'sunita.patil@communityhealth.org', role: 'chw' },
      doctor: { name: 'Dr. Ananya Roy (M.D.)', email: 'ananya.roy@districtmed.org', role: 'doctor' },
      patient: { name: 'Priya Sharma (Patient)', email: 'priya.sharma@patienthealth.net', role: 'patient' },
      supervisor: { name: 'Vikram Singh (Supervisor)', email: 'vikram.singh@subdistrictops.org', role: 'supervisor' },
      admin: { name: 'Admin Operations', email: 'admin.lead@healthsystem.gov', role: 'admin' }
    };
    const targetUser = demoAccounts[role] || demoAccounts.chw;
    handleLogin(targetUser);
  };

  const handleSwitchDemoRole = (newRole) => {
    if (DEMO_ACCESS_ENABLED) handleQuickDemoLogin(newRole);
  };

  // -------------------------------------------------------------
  // PATIENT MUTATION HANDLERS
  // -------------------------------------------------------------
  const handleSavePatient = (patientRecord) => {
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
        title: `High risk alert: ${evaluatedRecord.name} (${evaluatedRecord.id})`,
        message: `Clinical engine flagged ${evaluation.overallRiskLevel} Risk (BP ${evaluatedRecord.systolic}/${evaluatedRecord.diastolic} mmHg). Priority follow-up required.`,
        time: 'Just now',
        type: 'CRITICAL_ALERT',
        read: false
      };
      setNotifications(prev => [highRiskNotif, ...prev]);
      toastWarning(`High Risk flagged for ${evaluatedRecord.name} (${evaluation.overallRiskLevel} Risk)`);
    } else {
      toastSuccess(`Patient record saved for ${evaluatedRecord.name}`);
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

  const handleDeletePatient = (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      setPatients(prev => prev.filter(p => p.id !== patientId));
      toastInfo(`Patient record ${patientId} removed.`);
    }
  };

  const handleUpdatePatientMedicines = async (patientId, newMedicines) => {
    if (currentUser?.source === 'supabase' && userRole === 'doctor') {
      const patient = patients.find((record) => record.id === patientId);
      const savedMedicines = await syncMedicalOfficerMedicationOrders(patient, newMedicines);
      setPatients((current) =>
        current.map((record) =>
          record.id === patientId ? { ...record, medicines: savedMedicines } : record,
        ),
      );
      toastSuccess('Medication orders securely saved to Supabase.');
      return savedMedicines;
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

  const handleSaveCounsellingSession = (patientId, sessionRecord) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, counsellingHistory: [sessionRecord, ...(p.counsellingHistory || [])] };
      }
      return p;
    }));
    toastSuccess('ThinkLets counselling session recorded.');
  };

  const handleSaveReferral = (patientId, referralObj) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, referral: referralObj };
      }
      return p;
    }));

    const newNotif = {
      id: 'n-' + Date.now(),
      title: 'Hospital referral dispatched',
      message: `Referral submitted for patient ID ${patientId} to ${referralObj.hospitalName}.`,
      time: 'Just now',
      type: 'REFERRAL_UPDATE',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    toastSuccess(`Hospital referral submitted to ${referralObj.hospitalName}`);
  };

  const handleApproveReferral = async (patientId, doctorNotes) => {
    if (currentUser?.source === 'supabase' && userRole === 'doctor') {
      try {
        const patient = patients.find((record) => record.id === patientId);
        const referral = await reviewMedicalOfficerReferral(
          patient,
          'approved',
          doctorNotes,
        );
        setPatients((current) =>
          current.map((record) =>
            record.id === patientId ? { ...record, referral } : record,
          ),
        );
        toastSuccess('Referral treatment plan securely approved.');
        return true;
      } catch (error) {
        toastError(error.message, 7000);
        return false;
      }
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId && p.referral) {
        return {
          ...p,
          referral: {
            ...p.referral,
            status: 'Approved',
            notes: doctorNotes
          }
        };
      }
      return p;
    }));
    toastSuccess(`Referral treatment plan approved for patient ID ${patientId}`);
    return true;
  };

  const handleRejectReferral = async (patientId, doctorNotes) => {
    if (currentUser?.source === 'supabase' && userRole === 'doctor') {
      try {
        const patient = patients.find((record) => record.id === patientId);
        const referral = await reviewMedicalOfficerReferral(
          patient,
          'declined',
          doctorNotes,
        );
        setPatients((current) =>
          current.map((record) =>
            record.id === patientId ? { ...record, referral } : record,
          ),
        );
        toastInfo('Referral securely declined for community care management.');
        return true;
      } catch (error) {
        toastError(error.message, 7000);
        return false;
      }
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId && p.referral) {
        return {
          ...p,
          referral: {
            ...p.referral,
            status: 'Declined',
            notes: doctorNotes
          }
        };
      }
      return p;
    }));
    toastInfo('Referral marked for community primary care management.');
    return true;
  };

  const handleSyncOfflineData = () => {
    if (offlineQueue.length === 0) {
      toastInfo('Offline queue is empty. Central registry is up to date.');
      return;
    }

    const syncedRecords = offlineQueue.map(p => ({ ...p, syncStatus: 'synced' }));
    setPatients(prev => [...syncedRecords, ...prev]);

    const newLog = {
      id: 'L-' + Math.floor(9000 + Math.random() * 999),
      timestamp: new Date().toLocaleString(),
      type: 'Batch Sync',
      count: offlineQueue.length,
      device: 'CHW Handheld Tablet'
    };
    setSyncLogs(prev => [newLog, ...prev]);
    setOfflineQueue([]);
    toastSuccess(`Successfully synced ${syncedRecords.length} record(s) with Central Health Registry!`);
  };

  const handleRestoreBackup = (restoredPatients) => {
    setPatients(restoredPatients.map(p => ({ ...p, evaluation: assessPatientRisk(p) })));
    toastSuccess('Backup database successfully restored.');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        onQuickDemoLogin={handleQuickDemoLogin}
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
        demoAccessEnabled={DEMO_ACCESS_ENABLED}
      />
    );
  }

  // 3. AUTHENTICATED APPLICATION
  return (
    <AppShell
      currentUser={currentUser}
      userRole={userRole}
      onSwitchRole={handleSwitchDemoRole}
      demoAccessEnabled={DEMO_ACCESS_ENABLED}
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
      {/* Role-Based Portal Routing */}
      {userRole === 'chw' && (
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
      )}

      {userRole === 'patient' && (
        <PatientPortal 
          patients={patients} 
          onSavePatient={handleSavePatient} 
          activeSection={activeNavSection}
        />
      )}

      {userRole === 'doctor' && (
        <DoctorPortal 
          patients={patients}
          onApproveReferral={handleApproveReferral}
          onRejectReferral={handleRejectReferral}
          onUpdatePatientMedicines={handleUpdatePatientMedicines}
          onAddReport={handleAddReport}
          onSaveReferral={handleSaveReferral}
          activeSection={activeNavSection}
          isLoading={medicalDataLoading}
        />
      )}

      {userRole === 'supervisor' && (
        <SupervisorDashboard 
          patients={patients}
          chwList={chwList}
          syncLogs={syncLogs}
          activeSection={activeNavSection}
        />
      )}

      {userRole === 'admin' && (
        <AdminPortal 
          auditLogs={auditLogs} 
          patients={patients} 
          activeSection={activeNavSection}
        />
      )}

      {/* Notifications Drawer Overlay */}
      {showNotificationsDrawer && (
        <NotificationsDrawer 
          notifications={notifications}
          onClose={() => setShowNotificationsDrawer(false)}
          onSelectNotification={(notification) => {
            setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
            setShowNotificationsDrawer(false);
            if (notification.type === 'CRITICAL_ALERT' || notification.type === 'MEDICATION_ALERT') {
              setActiveNavSection(userRole === 'patient' ? 'medicines' : 'patients');
            } else if (notification.type === 'REFERRAL_UPDATE' && userRole === 'chw') {
              setActiveNavSection('referrals');
            }
          }}
          onMarkAllRead={() => {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toastInfo('All notifications marked as read.');
          }}
        />
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </LanguageProvider>
  );
}
