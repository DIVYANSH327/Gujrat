import React, { useState } from 'react';
import { mockAlerts } from '../mockData';
import { CheckCircle2, ShieldAlert, AlertTriangle, FileCheck, Check, Filter, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { Alert } from '../types';
import { audioAlertService } from '../services/AudioAlertService';

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'UNACK'>('ALL');
  const [isMuted, setIsMuted] = useState(() => audioAlertService.isMuted());

  const toggleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a));
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const handleTestAudioAlert = () => {
    audioAlertService.playTone('TEST_ALERT');
  };

  const handleToggleMute = () => {
    const next = audioAlertService.toggleMute();
    setIsMuted(next);
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'CRITICAL') return a.severity === 'critical';
    if (filter === 'UNACK') return !a.isRead;
    return true;
  });

  return (
    <div className="p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 shrink-0 border-b border-cyan-950/50 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
              STATEWIDE DISPATCH FEED
            </span>
            <span className="text-[10px] font-mono text-zinc-400">UNACKNOWLEDGED: {alerts.filter(a => !a.isRead).length}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            AUTOMATED SECURITY & RULE ALERTS
          </h1>
          <p className="text-xs text-zinc-400">
            Rule engine triggers, watchlist hit notifications, candidate verification packages, and court-admissible evidence snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestAudioAlert}
            title="Play Test Alert Tone (Web Audio API)"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#090d16] border border-cyan-900/40 rounded hover:bg-[#131b2e] transition-colors text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cursor-pointer"
          >
            <Volume2 size={13} />
            <span>TEST ALERT CHIME</span>
          </button>
          <button 
            onClick={markAllRead}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#090d16] border border-cyan-900/40 rounded hover:bg-[#131b2e] transition-colors text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 cursor-pointer"
          >
            <CheckCircle2 size={13} />
            <span>ACKNOWLEDGE ALL</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold'
              : 'bg-[#090d16] text-zinc-400 border border-white/5'
          }`}
        >
          ALL ALERTS ({alerts.length})
        </button>
        <button
          onClick={() => setFilter('CRITICAL')}
          className={`px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer ${
            filter === 'CRITICAL'
              ? 'bg-rose-950 text-rose-300 border border-rose-500/50 font-bold'
              : 'bg-[#090d16] text-zinc-400 border border-white/5'
          }`}
        >
          CRITICAL ONLY ({alerts.filter(a => a.severity === 'critical').length})
        </button>
        <button
          onClick={() => setFilter('UNACK')}
          className={`px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer ${
            filter === 'UNACK'
              ? 'bg-amber-950 text-amber-300 border border-amber-500/50 font-bold'
              : 'bg-[#090d16] text-zinc-400 border border-white/5'
          }`}
        >
          UNACKNOWLEDGED ({alerts.filter(a => !a.isRead).length})
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="space-y-3 max-w-4xl pb-6">
          {filteredAlerts.map((alert, idx) => (
            <div 
              key={alert.id ? `${alert.id}-${idx}` : `alert-${idx}`} 
              className={`p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-start transition-all relative overflow-hidden ${
                alert.isRead 
                  ? 'bg-[#080b12] border border-cyan-950/40 opacity-70' 
                  : `bg-[#090d16] border shadow-md ${
                      alert.severity === 'critical' ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
                      alert.severity === 'high' ? 'border-amber-500/40' : 'border-cyan-500/40'
                    }`
              }`}
            >
              {!alert.isRead && (
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  alert.severity === 'critical' ? 'bg-rose-500' :
                  alert.severity === 'high' ? 'bg-amber-500' : 'bg-cyan-500'
                }`} />
              )}
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={15} className={
                      alert.severity === 'critical' ? 'text-rose-400' :
                      alert.severity === 'high' ? 'text-amber-400' : 'text-cyan-400'
                    }/>
                    <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                      alert.severity === 'critical' ? 'text-rose-400' :
                      alert.severity === 'high' ? 'text-amber-400' : 'text-cyan-400'
                    }`}>
                      {alert.type} DETECTED
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500">[{alert.id}]</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(alert.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </span>
                </div>

                <p className="text-xs font-medium text-zinc-200 mb-3 font-mono leading-relaxed">
                  {alert.description}
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <FileCheck size={12} />
                    <span>FORENSIC EVIDENCE HASH VERIFIED</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleAcknowledge(alert.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        alert.isRead
                          ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900'
                      }`}
                    >
                      {alert.isRead ? 'ACKNOWLEDGED' : 'MARK AS READ'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 w-36 h-24 bg-black rounded border border-cyan-950 overflow-hidden relative group">
                <img 
                  src={alert.snapshotUrl} 
                  alt="Event" 
                  className="w-full h-full object-cover mix-blend-luminosity opacity-80 group-hover:mix-blend-normal group-hover:opacity-100 transition-all cursor-pointer"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-zinc-400 border border-white/10">
                  {alert.cameraId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
