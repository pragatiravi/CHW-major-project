import { useState } from 'react';
import { 
  Heart, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bell, 
  Sun, 
  Moon,
  Search,
} from 'lucide-react';

export default function Header({
  userRole,
  setUserRole,
  isOffline,
  toggleOffline,
  offlineQueueCount,
  onSyncNow,
  theme,
  toggleTheme,
  unreadNotifications,
  onOpenNotifications,
  globalSearch,
  setGlobalSearch,
  currentUser,
  onOpenAuthModal
}) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roleLabels = {
    chw: { label: 'Community Health Worker (CHW)', badge: 'Field Care', icon: '🩺' },
    patient: { label: 'Patient Portal & Mobile App', badge: 'Personal Care', icon: 'PT' },
    doctor: { label: 'Doctor / Medical Officer', badge: 'Clinical Triage', icon: 'MD' },
    supervisor: { label: 'Health Supervisor', badge: 'Analytics & Ops', icon: 'HS' },
    admin: { label: 'System Administrator', badge: 'System Config', icon: 'AD' }
  };

  return (
    <header className="app-header">
      {/* Brand Logo & Title */}
      <div className="header-brand-container">
        <div className="brand-logo-icon">
          <Heart className="brand-heart-icon" size={22} />
        </div>
        <div>
          <h1 className="brand-title">
            CHW Toolkit <span className="brand-badge-ai">AI PRO</span>
          </h1>
          <span className="brand-subtext">AI-Assisted Field Triage & EMR Platform</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="header-search-bar">
        <Search className="search-icon" size={16} />
        <input 
          type="text" 
          placeholder="Search patient name, ID (e.g. P4389), village..." 
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="search-input"
        />
        {globalSearch && (
          <button className="search-clear-btn" onClick={() => setGlobalSearch('')}>×</button>
        )}
      </div>

      {/* Header Action Items */}
      <div className="header-actions">
        {/* Role Selector Dropdown */}
        <div className="role-selector-wrapper">
          <button 
            className="role-selector-btn"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            title="Switch User Role Persona"
          >
            <span>{roleLabels[userRole]?.icon} {roleLabels[userRole]?.label}</span>
            <span className="role-pill">{roleLabels[userRole]?.badge}</span>
          </button>

          {showRoleDropdown && (
            <div className="role-dropdown-menu">
              <div className="dropdown-header">Select Operating Persona</div>
              {Object.keys(roleLabels).map((roleKey) => (
                <button
                  key={roleKey}
                  className={`role-dropdown-item ${userRole === roleKey ? 'active' : ''}`}
                  onClick={() => {
                    setUserRole(roleKey);
                    setShowRoleDropdown(false);
                  }}
                >
                  <span className="role-icon">{roleLabels[roleKey].icon}</span>
                  <div className="role-info">
                    <div className="role-title">{roleLabels[roleKey].label}</div>
                    <div className="role-desc">{roleLabels[roleKey].badge} access</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Offline / Online Sync Indicator */}
        <div className="connectivity-pill-container">
          <button 
            className={`connectivity-toggle-btn ${isOffline ? 'offline' : 'online'}`}
            onClick={toggleOffline}
            title={isOffline ? 'Currently Offline. Click to simulate Online.' : 'Currently Online. Click to simulate Offline.'}
          >
            {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
            <span>{isOffline ? 'Offline Mode' : 'Cloud Online'}</span>
          </button>

          {offlineQueueCount > 0 && (
            <button 
              className="sync-trigger-btn pulse"
              onClick={onSyncNow}
              title={`${offlineQueueCount} record(s) queued for sync.`}
            >
              <RefreshCw size={14} className="spin-icon" />
              <span>Sync ({offlineQueueCount})</span>
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <button className="icon-action-btn notification-btn" onClick={onOpenNotifications} title="Notifications">
          <Bell size={18} />
          {unreadNotifications > 0 && (
            <span className="notification-badge">{unreadNotifications}</span>
          )}
        </button>

        {/* Theme Toggle */}
        <button className="icon-action-btn theme-btn" onClick={toggleTheme} title="Toggle Light/Dark Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Account / Auth Modal Trigger */}
        <div className="user-profile-badge" onClick={onOpenAuthModal} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">{currentUser ? currentUser.name.charAt(0) : 'U'}</div>
          <div className="user-details">
            <span className="user-name">{currentUser ? currentUser.name : 'CHW Field Agent'}</span>
            <span className="user-role-text">{userRole.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
