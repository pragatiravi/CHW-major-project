import { ShieldAlert, AlertCircle, ArrowLeft } from 'lucide-react';

export default function RoleGuard({ 
  currentUser, 
  requiredRole, 
  onRedirect, 
  children 
}) {
  if (!currentUser) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50" aria-live="polite">
        <div className="card-box text-center p-8 max-w-md w-full border-slate-200">
          <AlertCircle size={44} className="text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Session Required</h2>
          <p className="text-xs text-slate-500 mt-2">
            Please sign in to access this clinical workspace.
          </p>
        </div>
      </main>
    );
  }

  // Check account approval status
  if (currentUser.status !== 'approved') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50" aria-live="polite">
        <div className="card-box text-center p-8 max-w-lg w-full border-amber-200 bg-amber-50/40">
          <AlertCircle size={44} className="text-amber-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-amber-950">Registration Pending Approval</h2>
          <p className="text-xs text-amber-800 mt-2 leading-relaxed">
            Your staff account for <strong>{currentUser.name}</strong> ({currentUser.email}) is currently in{' '}
            <strong className="uppercase">{currentUser.status}</strong> status.
          </p>
          <p className="text-xs text-amber-700 mt-2">
            In compliance with healthcare security protocols, an institutional supervisor or system administrator must verify and approve your credentials before you can access patient medical records.
          </p>
        </div>
      </main>
    );
  }

  // Check role match
  if (currentUser.role !== requiredRole) {
    const roleTitles = {
      chw: 'Community Health Worker (CHW)',
      doctor: 'Medical Officer / Clinician',
      patient: 'Patient & Family Portal',
      supervisor: 'Health Program Supervisor',
      admin: 'System Administrator'
    };

    return (
      <div className="p-8 max-w-xl mx-auto my-8">
        <div className="card-box text-center p-8 border-rose-200 bg-rose-50/30">
          <ShieldAlert size={48} className="text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-950">Access Denied: Role Guard</h2>
          <p className="text-xs text-rose-800 mt-2 leading-relaxed">
            You are authenticated as <strong>{currentUser.name}</strong> with the{' '}
            <span className="badge badge-primary uppercase font-mono">{currentUser.role}</span> role.
          </p>
          <p className="text-xs text-rose-700 mt-2">
            You do not have administrative authorization to open the{' '}
            <strong>{roleTitles[requiredRole] || requiredRole}</strong> portal.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              onClick={() => onRedirect && onRedirect(currentUser.role)}
            >
              <ArrowLeft size={14} /> Return to My {roleTitles[currentUser.role] || 'Workspace'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
