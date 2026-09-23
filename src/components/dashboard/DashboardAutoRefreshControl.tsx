import React, { useState } from 'react';
import { 
  RefreshCw, 
  Play, 
  Pause, 
  Clock, 
  Check, 
  Sliders, 
  Eye, 
  Sparkles,
  ChevronDown,
  Activity,
  Zap
} from 'lucide-react';

export interface AutoRefreshControlProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  intervalSeconds: number;
  onIntervalChange: (interval: number) => void;
  remainingSeconds: number;
  lastRefreshedAt: Date | null;
  isRefreshing: boolean;
  onRefreshNow: () => void;
  pauseOnHover?: boolean;
  onTogglePauseOnHover?: (pause: boolean) => void;
  isHoverPaused?: boolean;
  compact?: boolean;
}

const INTERVAL_PRESETS = [
  { label: '1s', value: 1, desc: 'Ultra-Fast' },
  { label: '2s', value: 2, desc: 'Fast' },
  { label: '5s', value: 5, desc: 'Balanced' },
  { label: '10s', value: 10, desc: 'Standard' },
  { label: '30s', value: 30, desc: 'Low Bandwidth' }
];

export function DashboardAutoRefreshControl({
  isEnabled,
  onToggleEnabled,
  intervalSeconds,
  onIntervalChange,
  remainingSeconds,
  lastRefreshedAt,
  isRefreshing,
  onRefreshNow,
  pauseOnHover = false,
  onTogglePauseOnHover,
  isHoverPaused = false,
  compact = false
}: AutoRefreshControlProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(intervalSeconds.toString());

  // Calculate percentage of timer remaining for circular/bar progress
  const progressPercent = Math.max(0, Math.min(100, (remainingSeconds / intervalSeconds) * 100));

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Initializing...';
    const now = new Date();
    const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
    const timeStr = date.toTimeString().split(' ')[0];
    if (diffSec === 0) return `Just now (${timeStr})`;
    if (diffSec < 60) return `${diffSec}s ago (${timeStr})`;
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago (${timeStr})`;
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputValue, 10);
    if (!isNaN(val) && val >= 1 && val <= 300) {
      onIntervalChange(val);
      setShowCustomModal(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-[#090d16] border border-cyan-950/80 rounded-md px-2.5 py-1.5 font-mono text-xs">
        {/* Toggle On/Off */}
        <button
          onClick={() => onToggleEnabled(!isEnabled)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            isEnabled 
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
          }`}
          title={isEnabled ? 'Click to Pause Auto-Refresh' : 'Click to Enable Auto-Refresh'}
        >
          {isEnabled ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE ({intervalSeconds}s)</span>
            </>
          ) : (
            <>
              <Pause size={10} className="text-amber-400" />
              <span>PAUSED</span>
            </>
          )}
        </button>

        {/* Refresh Now */}
        <button
          onClick={onRefreshNow}
          disabled={isRefreshing}
          className="p-1 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Refresh Feeds Now"
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-cyan-400' : ''} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-[#090e1a]/90 backdrop-blur-md border border-cyan-900/60 rounded-lg p-3 text-zinc-100 font-mono shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Master Toggle & Live Status Badge */}
        <div className="flex items-center gap-2.5">
          {/* Main Toggle Button */}
          <button
            id="btn-toggle-autorefresh"
            onClick={() => onToggleEnabled(!isEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isEnabled
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-amber-950/40 text-amber-300 border border-amber-600/40 hover:bg-amber-900/40'
            }`}
          >
            {isEnabled ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" />
                  AUTO-REFRESH: ON
                </span>
              </>
            ) : (
              <>
                <Pause size={13} className="text-amber-400" />
                <span>AUTO-REFRESH: PAUSED</span>
              </>
            )}
          </button>

          {/* Hover Paused Indicator */}
          {isEnabled && isHoverPaused && (
            <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-1 rounded flex items-center gap-1 animate-pulse">
              <Eye size={11} /> HOVER PAUSED
            </span>
          )}

          {/* Countdown timer & progress indicator */}
          {isEnabled && !isHoverPaused && (
            <div className="flex items-center gap-2 bg-[#050811] px-2.5 py-1 rounded border border-cyan-950 text-xs">
              <Clock size={12} className="text-cyan-400" />
              <span className="text-zinc-400 text-[11px]">Next sync in:</span>
              <span className="text-cyan-300 font-bold w-10 text-right">
                {remainingSeconds.toFixed(1)}s
              </span>
              {/* Mini progress bar */}
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden ml-1">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${100 - progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center/Right: Configurable Interval Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold mr-1 flex items-center gap-1">
            <Sliders size={11} className="text-cyan-400" />
            SYNC INTERVAL:
          </span>

          {INTERVAL_PRESETS.map(preset => {
            const isSelected = intervalSeconds === preset.value;
            return (
              <button
                key={preset.value}
                id={`btn-interval-${preset.value}s`}
                onClick={() => onIntervalChange(preset.value)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-[#060a14] text-zinc-400 hover:text-zinc-200 hover:bg-slate-800 border border-cyan-950'
                }`}
                title={`${preset.desc} refresh (${preset.value}s)`}
              >
                {preset.label}
              </button>
            );
          })}

          {/* Custom interval button */}
          <button
            onClick={() => {
              setCustomInputValue(intervalSeconds.toString());
              setShowCustomModal(!showCustomModal);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              !INTERVAL_PRESETS.some(p => p.value === intervalSeconds)
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-[#060a14] text-zinc-400 hover:text-zinc-200 hover:bg-slate-800 border border-cyan-950'
            }`}
            title="Configure custom interval (seconds)"
          >
            <span>{!INTERVAL_PRESETS.some(p => p.value === intervalSeconds) ? `${intervalSeconds}s (Custom)` : 'Custom...'}</span>
            <ChevronDown size={11} />
          </button>

          {/* Manual Refresh Now Button */}
          <button
            id="btn-refresh-now"
            onClick={onRefreshNow}
            disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ml-1 transition-all cursor-pointer ${
              isRefreshing
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/50 cursor-not-allowed opacity-80'
                : 'bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-500/40 hover:border-cyan-400 shadow-sm'
            }`}
            title="Trigger instant data refresh"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin text-cyan-400' : 'text-cyan-300'} />
            <span>{isRefreshing ? 'REFRESHING...' : 'REFRESH NOW'}</span>
          </button>
        </div>
      </div>

      {/* Secondary Bar: Sync Details & Quick Preferences */}
      <div className="mt-2.5 pt-2 border-t border-cyan-950/60 flex flex-wrap items-center justify-between text-[10px] text-zinc-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="text-zinc-400">LAST SYNCED:</span>
            <span className="text-zinc-200 font-semibold">{formatLastSync(lastRefreshedAt)}</span>
          </span>
          <span className="text-zinc-400">•</span>
          <span className="flex items-center gap-1">
            <span className="text-zinc-400">TARGET:</span>
            <span className="text-cyan-400">LIVE CCTV & INFERENCE FEEDS</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Pause on hover toggle */}
          {onTogglePauseOnHover && (
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 select-none">
              <input 
                type="checkbox" 
                checked={pauseOnHover}
                onChange={e => onTogglePauseOnHover(e.target.checked)}
                className="rounded border-cyan-900/60 bg-[#050811] text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer h-3.5 w-3.5"
              />
              <span>Pause on feed hover</span>
            </label>
          )}

          <span className="text-[10px] text-emerald-400/90 flex items-center gap-1">
            <Zap size={11} className="text-emerald-400" />
            CONTINUOUS C4i STREAM
          </span>
        </div>
      </div>

      {/* Custom Interval Popup Modal */}
      {showCustomModal && (
        <div className="absolute top-full right-4 mt-2 z-50 bg-[#070b14] border border-cyan-600/60 rounded-lg p-3.5 shadow-[0_10px_25px_rgba(0,0,0,0.8)] w-64 text-zinc-100 font-mono">
          <div className="text-xs font-bold text-cyan-300 mb-2 flex items-center justify-between">
            <span>SET CUSTOM INTERVAL</span>
            <span className="text-[10px] text-zinc-400">1 - 300 SECONDS</span>
          </div>
          <form onSubmit={handleCustomSubmit} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="300"
                value={customInputValue}
                onChange={e => setCustomInputValue(e.target.value)}
                className="w-full bg-[#03060c] border border-cyan-900 rounded px-2.5 py-1.5 text-xs text-cyan-100 focus:outline-none focus:border-cyan-400 font-bold"
                placeholder="Interval in seconds"
                autoFocus
              />
              <span className="text-xs text-zinc-400">sec</span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
