import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Sentinel ErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore in sandboxed iframes
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-600 selection:text-white">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top red accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <ShieldAlert size={26} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide uppercase">Sentinel Grid Diagnostics</h2>
                <p className="text-xs text-slate-400">Command Center Interface Exception Intercepted</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
                <AlertTriangle size={14} />
                <span>Protected Fail-Safe Triggered</span>
              </div>
              <p className="text-slate-400 mb-2">
                A client-side execution interruption occurred. The backend command fabric remains operational.
              </p>
              {this.state.error && (
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-red-300 break-words max-h-32 overflow-y-auto">
                  {this.state.error.name}: {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <RefreshCw size={14} />
                <span>Reload Command Center</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetSession}
                className="flex-1 min-h-[44px] px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Reset Local Session</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
              State Crime Records Bureau (SCRB) • Gujarat Police Command Infrastructure
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
