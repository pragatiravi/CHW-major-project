/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toastSuccess = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const toastError = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const toastWarning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
  const toastInfo = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, toastSuccess, toastError, toastWarning, toastInfo, removeToast }}>
      {children}
      <div className="toast-portal-container" aria-live="polite">
        {toasts.map(t => {
          let icon = <Info size={18} className="toast-icon info" />;
          if (t.type === 'success') icon = <CheckCircle2 size={18} className="toast-icon success" />;
          if (t.type === 'warning') icon = <AlertTriangle size={18} className="toast-icon warning" />;
          if (t.type === 'error') icon = <AlertCircle size={18} className="toast-icon error" />;

          return (
            <div key={t.id} className={`toast-card toast-${t.type}`} role="alert">
              <div className="toast-body">
                {icon}
                <span className="toast-message">{t.message}</span>
              </div>
              <button 
                className="toast-close-btn" 
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: (msg) => console.log('Toast:', msg),
      toastSuccess: (msg) => console.log('Toast Success:', msg),
      toastError: (msg) => console.error('Toast Error:', msg),
      toastWarning: (msg) => console.warn('Toast Warning:', msg),
      toastInfo: (msg) => console.log('Toast Info:', msg),
      removeToast: () => {}
    };
  }
  return context;
}
