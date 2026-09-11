import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const SentinelHealthIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [details, setDetails] = useState<string>('Initializing...');

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/sentinel/health');
        const data = await res.json();
        
        if (!mounted) return;

        if (res.ok && data.reachable && data.authenticated) {
          setStatus('connected');
          setDetails(`Connected (${data.cameraCount} Cams)`);
        } else {
          setStatus('error');
          setDetails('Integration Error');
        }
      } catch (err: any) {
        if (!mounted) return;
        setStatus('error');
        setDetails('Gateway Offline');
      }
    };

    checkHealth();
    // Poll every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full cursor-help" title="Checking Sentinel Gateway...">
        <AlertCircle size={14} className="text-amber-500 animate-pulse" />
        <span className="text-xs font-semibold text-amber-700">Sentinel: Checking</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full cursor-help" title={details}>
        <XCircle size={14} className="text-rose-500" />
        <span className="text-xs font-semibold text-rose-700">Sentinel: Error</span>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full cursor-help" title={details}>
      <Server size={14} className="text-emerald-500" />
      <span className="text-xs font-semibold text-emerald-700">Sentinel: Online</span>
    </div>
  );
};
