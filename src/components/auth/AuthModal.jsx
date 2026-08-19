import { useState } from 'react';
import { X, Lock } from 'lucide-react';

export default function AuthModal({ onClose, currentUser, onLogin, onLogout, userRole, setUserRole }) {
  const [email, setEmail] = useState(currentUser ? currentUser.email : 'chw.agent@communityhealth.org');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState(userRole);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isResetting) {
      alert(`Password reset instructions sent to ${email}`);
      setIsResetting(false);
      return;
    }

    const nameMap = {
      chw: 'Sunita Patil (CHW)',
      patient: 'Priya Sharma (Patient)',
      doctor: 'Dr. Ananya Roy (M.D.)',
      supervisor: 'Vikram Singh (Supervisor)',
      admin: 'Admin Operations'
    };

    onLogin({
      name: nameMap[selectedRole] || 'Healthcare User',
      email,
      role: selectedRole
    });
    setUserRole(selectedRole);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header bg-gradient-to-r from-indigo-950 to-slate-900">
          <div className="flex items-center gap-2">
            <Lock className="text-indigo-400" size={20} />
            <h2>{isResetting ? 'Password Recovery' : 'Firebase Auth & User Session'}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close sign-in dialog"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {!isResetting ? (
            <>
              <div className="form-group mb-3">
                <label className="text-xs font-semibold text-gray-300">Select Access Role</label>
                <select 
                  value={selectedRole} 
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="chw">Community Health Worker (CHW)</option>
                  <option value="patient">Patient Portal & Mobile App</option>
                  <option value="doctor">Doctor / Clinician</option>
                  <option value="supervisor">🖥️ Supervisor</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="form-group mb-3">
                <label className="text-xs font-semibold text-gray-300">Email Address / User ID</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="form-group mb-3">
                <label className="text-xs font-semibold text-gray-300">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="flex justify-between items-center text-xs mb-3">
                <button type="button" className="text-indigo-400 hover:underline" onClick={() => setIsResetting(true)}>
                  Forgot password?
                </button>
              </div>
            </>
          ) : (
            <div className="form-group mb-3">
              <label className="text-xs font-semibold text-gray-300">Enter Account Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input text-xs"
                required
              />
            </div>
          )}

          <div className="modal-footer flex justify-between items-center mt-4">
            {currentUser && !isResetting && (
              <button type="button" className="btn btn-danger-outline text-xs" onClick={() => { onLogout(); onClose(); }}>
                Sign Out
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" className="btn btn-secondary text-xs" onClick={() => isResetting ? setIsResetting(false) : onClose()}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary text-xs">
                {isResetting ? 'Send Recovery Link' : 'Sign In / Switch Role'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
