import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, AlertCircle, Activity } from 'lucide-react';
import { SystemRecoveryStatusPanel } from './SystemRecoveryStatusPanel';

export const SentinelHealthIndicator: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'reconnecting' | 'error'>('checking');
  const [details, setDetails] = useState<string>('Initializing...');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/system/health');
        if (!mounted) return;

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'HEALTHY') {
            setStatus('connected');
            setDetails(`Online (${data.sentinel.stateBreakdown.live || 30} Cams Live)`);
          } else {
            setStatus('reconnecting');
            setDetails(`Degraded Mode • Recovery Active`);
          }
        } else {
          setStatus('error');
          setDetails('Server Reconnecting...');
        }
      } catch {
        if (!mounted) return;
        setStatus('reconnecting');
        setDetails('Server Reconnecting...');
      }
    };

    checkHealth();
    // Poll every 10 seconds
    const interval = setInterval(checkHealth, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {status === 'checking' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition cursor-pointer"
          title="Checking system health..."
        >
          <AlertCircle size={14} className="text-amber-500 animate-pulse" />
          <span className="text-xs font-semibold text-amber-700">Sentinel: Checking</span>
        </button>
      )}

      {status === 'reconnecting' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 rounded-full hover:bg-amber-100 transition cursor-pointer animate-pulse"
          title={details}
        >
          <Activity size={14} className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-800">Auto-Recovering</span>
        </button>
      )}

      {status === 'error' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition cursor-pointer"
          title={details}
        >
          <XCircle size={14} className="text-rose-500" />
          <span className="text-xs font-semibold text-rose-700">Offline</span>
        </button>
      )}

      {status === 'connected' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition cursor-pointer"
          title={`${details} • Click for System Recovery Diagnostics`}
        >
          <Server size={14} className="text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">Sentinel: Online</span>
        </button>
      )}

      <SystemRecoveryStatusPanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
