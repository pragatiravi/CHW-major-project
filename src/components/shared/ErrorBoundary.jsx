import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      sessionStorage.removeItem('chw_auth_session');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <AlertTriangle size={28} />
            </div>
            
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              The application encountered an unexpected issue. Your locally stored screening data is safe in offline storage.
            </p>

            {this.state.error && (
              <div className="p-3 mb-6 bg-slate-100 rounded-lg text-left text-3xs font-mono text-slate-700 overflow-x-auto border border-slate-200">
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                style={{ minHeight: '48px' }}
              >
                <RefreshCw size={16} />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                style={{ minHeight: '48px' }}
              >
                <Home size={16} />
                Return to Public Portal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
