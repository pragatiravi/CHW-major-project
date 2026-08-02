import React, { useState, useEffect } from 'react';
import Header from './components/shared/Header';
import CHWPortal from './components/chw/CHWPortal';
import DoctorPortal from './components/doctor/DoctorPortal';
import SupervisorDashboard from './components/supervisor/SupervisorDashboard';
import AdminPortal from './components/admin/AdminPortal';
import PatientPortal from './components/patient/PatientPortal';
import NotificationsDrawer from './components/shared/NotificationsDrawer';
import AuthModal from './components/auth/AuthModal';

import { INITIAL_PATIENTS, INITIAL_CHWS, INITIAL_DOCTORS, INITIAL_HOSPITALS, INITIAL_AUDIT_LOGS } from './data/initialData';
import { assessPatientRisk } from './utils/predictionEngine';

export default function App() {
  const [userRole, setUserRole] = useState('chw'); // 'chw', 'doctor', 'supervisor', 'admin'
  const [theme, setTheme] = useState('light'); // Default to clean white & blue hospital theme
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

  const [chwList, setChwList] = useState(INITIAL_CHWS);

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

  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chw_patients', JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to persist patients:', e);
    }
  }, [patients]);

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

  // User Auth State
  const [currentUser, setCurrentUser] = useState({
    name: 'Sunita Patil (CHW)',
    email: 'sunita.patil@communityhealth.org',
    role: 'chw'
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      title: '🚨 Critical Hypertensive Crisis Alert',
      message: 'Fatima Begum (P4389) BP 185/112 mmHg with chest pain. Urgent referral generated.',
      time: '10 mins ago',
      type: 'CRITICAL_ALERT',
      read: false
    },
    {
      id: 'n-2',
      title: '💊 Missed Medication Alert',
      message: 'Priya Sharma (P7204) logged 1 missed dose for Amlodipine 5mg.',
      time: '1 hour ago',
      type: 'MEDICATION_ALERT',
      read: false
    },
    {
      id: 'n-3',
      title: '🏥 Doctor Referral Approved',
      message: 'Dr. Ananya Roy approved referral treatment plan for Priya Sharma (P7204).',
      time: '3 hours ago',
      type: 'REFERRAL_UPDATE',
      read: true
    }
  ]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Sync theme class to root
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    }
  }, [theme]);

  // Handlers for Patient Mutations & High-Risk Triage System
  const handleSavePatient = (patientRecord) => {
    const evaluation = assessPatientRisk(patientRecord);
    const isHighRisk = evaluation.overallRisk === 'High' || evaluation.overallRisk === 'Critical' || (parseFloat(patientRecord.systolic) >= 180);

    const evaluatedRecord = {
      ...patientRecord,
      evaluation,
      isPriority: isHighRisk,
      followUpDate: isHighRisk ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : patientRecord.followUpDate
    };

    // If High/Critical Risk, auto-trigger notifications for CHW, Patient, and Doctor
    if (isHighRisk) {
      const highRiskNotif = {
        id: 'n-' + Date.now(),
        title: `🚨 HIGH RISK ALERT: ${evaluatedRecord.name} (${evaluatedRecord.id})`,
        message: `AI predicted ${evaluation.overallRisk} Risk (BP ${evaluatedRecord.systolic}/${evaluatedRecord.diastolic} mmHg). Urgent Doctor & CHW follow-up scheduled.`,
        time: 'Just now',
        type: 'CRITICAL_ALERT',
        read: false
      };
      setNotifications(prev => [highRiskNotif, ...prev]);
    }

    if (isOffline) {
      setOfflineQueue(prev => [evaluatedRecord, ...prev]);
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

      // Log activity
      const logEntry = {
        id: 'L-' + Math.floor(9000 + Math.random() * 999),
        timestamp: new Date().toLocaleString(),
        type: isHighRisk ? 'High-Risk Priority Sync' : 'Instant Sync',
        count: 1,
        device: 'CHW Handheld App'
      };
      setSyncLogs(prev => [logEntry, ...prev]);
    }
  };

  const handleDeletePatient = (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      setPatients(prev => prev.filter(p => p.id !== patientId));
    }
  };

  const handleUpdatePatientMedicines = (patientId, newMedicines) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, medicines: newMedicines };
      }
      return p;
    }));
  };

  const handleAddReport = (patientId, newReport) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, reports: [newReport, ...(p.reports || [])] };
      }
      return p;
    }));
  };

  const handleSaveCounsellingSession = (patientId, sessionRecord) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, counsellingHistory: [sessionRecord, ...(p.counsellingHistory || [])] };
      }
      return p;
    }));
  };

  const handleSaveReferral = (patientId, referralObj) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, referral: referralObj };
      }
      return p;
    }));

    // Add notification
    const newNotif = {
      id: 'n-' + Date.now(),
      title: '🏥 New Hospital Referral Generated',
      message: `Referral submitted for patient ID ${patientId} to ${referralObj.hospitalName}.`,
      time: 'Just now',
      type: 'REFERRAL_UPDATE',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleApproveReferral = (patientId, doctorNotes) => {
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
  };

  const handleRejectReferral = (patientId, doctorNotes) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId && p.referral) {
        return {
          ...p,
          referral: {
            ...p.referral,
            status: 'Cancelled',
            notes: doctorNotes
          }
        };
      }
      return p;
    }));
  };

  // Sync Offline Queue
  const handleSyncOfflineData = () => {
    if (offlineQueue.length === 0) return;

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
  };

  const handleRestoreBackup = (restoredPatients) => {
    setPatients(restoredPatients.map(p => ({ ...p, evaluation: assessPatientRisk(p) })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-wrapper desktop-view">
      <Header 
        userRole={userRole}
        setUserRole={setUserRole}
        isOffline={isOffline}
        toggleOffline={() => setIsOffline(!isOffline)}
        offlineQueueCount={offlineQueue.length}
        onSyncNow={handleSyncOfflineData}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        unreadNotifications={unreadCount}
        onOpenNotifications={() => setShowNotificationsDrawer(true)}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      <main className="main-content-area">
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
          />
        )}

        {userRole === 'patient' && (
          <PatientPortal patients={patients} onSavePatient={handleSavePatient} />
        )}

        {userRole === 'doctor' && (
          <DoctorPortal 
            patients={patients}
            onApproveReferral={handleApproveReferral}
            onRejectReferral={handleRejectReferral}
            onOpenPatientDetail={(patient) => {
              setUserRole('chw');
            }}
            onOpenMedicationModal={(patient) => {
              setUserRole('chw');
            }}
          />
        )}

        {userRole === 'supervisor' && (
          <SupervisorDashboard 
            patients={patients}
            chwList={chwList}
            syncLogs={syncLogs}
            onOpenPatientDetail={(patient) => {
              setUserRole('chw');
            }}
          />
        )}

        {userRole === 'admin' && (
          <AdminPortal auditLogs={auditLogs} patients={patients} />
        )}
      </main>

      {/* Notifications Drawer Overlay */}
      {showNotificationsDrawer && (
        <NotificationsDrawer 
          notifications={notifications}
          onClose={() => setShowNotificationsDrawer(false)}
          onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        />
      )}

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          currentUser={currentUser}
          onLogin={(usr) => setCurrentUser(usr)}
          onLogout={() => setCurrentUser(null)}
          userRole={userRole}
          setUserRole={setUserRole}
        />
      )}
    </div>
  );
}
