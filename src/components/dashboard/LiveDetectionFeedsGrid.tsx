import React, { useState } from 'react';
import { 
  Video, 
  Car, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Crosshair, 
  Eye, 
  Clock, 
  Cpu, 
  Radio, 
  Sparkles,
  Zap,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { ViewMode } from '../../types';
import { LiveStreamBackgroundAiPanel } from '../LiveStreamBackgroundAiPanel';

export interface LiveCameraFeedItem {
  id: string;
  name: string;
  district: string;
  location: string;
  status: 'active' | 'warning' | 'critical';
  fps: number;
  latencyMs: number;
  lastUpdated: string;
  snapshotUrl: string;
  currentDetection: {
    type: 'plate' | 'helmet' | 'speed' | 'face' | 'congestion';
    label: string;
    targetId: string;
    confidence: number;
    bbox?: { x: number; y: number; w: number; h: number }; // percentages
    violation?: boolean;
    speedReading?: string;
    details?: string;
  };
}

interface LiveDetectionFeedsGridProps {
  feeds: LiveCameraFeedItem[];
  isRefreshing: boolean;
  justRefreshed: boolean;
  onNavigate?: (view: ViewMode) => void;
  onHoverFeed?: (hovering: boolean) => void;
}

export function LiveDetectionFeedsGrid({
  feeds,
  isRefreshing,
  justRefreshed,
  onNavigate,
  onHoverFeed
}: LiveDetectionFeedsGridProps) {
  const [showBackgroundAi, setShowBackgroundAi] = useState<boolean>(false);
  const [selectedCameraForAi, setSelectedCameraForAi] = useState<string>('cam01');
  const [selectedCameraName, setSelectedCameraName] = useState<string>('Ahmedabad SG Highway Hub');
  const [capturingCameraId, setCapturingCameraId] = useState<string | null>(null);
  const [sealedToast, setSealedToast] = useState<string | null>(null);

  const handleQuickClickEvidence = async (feedId: string, feedName: string, feedLocation: string) => {
    if (capturingCameraId) return;
    setCapturingCameraId(feedId);
    try {
      const res = await fetch('/api/gcp/live-stream/click-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraId: feedId,
          cameraName: feedName,
          sourceType: 'OFFICER_MANUAL_CLICK',
          locationName: feedLocation
        })
      });
      const data = await res.json();
      if (data.evidence) {
        setSealedToast(`Evidence Sealed: ${data.evidence.formattedPlate} (${data.evidence.bsaCertificateId}) -> Saved to Firestore`);
        setTimeout(() => setSealedToast(null), 5000);
        setSelectedCameraForAi(feedId);
        setSelectedCameraName(feedName);
        setShowBackgroundAi(true);
      }
    } catch (err) {
      console.warn('Click evidence error:', err);
    } finally {
      setCapturingCameraId(null);
    }
  };

  return (
    <div 
      className="bg-[#090d16] border border-cyan-950/80 rounded-lg p-4 mb-5 flex flex-col font-mono"
      onMouseEnter={() => onHoverFeed && onHoverFeed(true)}
      onMouseLeave={() => onHoverFeed && onHoverFeed(false)}
    >
      {/* Sealed Toast Banner */}
      {sealedToast && (
        <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-600/70 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="font-bold">{sealedToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSealedToast(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 border-b border-cyan-950/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={16} className="text-emerald-400 animate-pulse" />
            {justRefreshed && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <span>LIVE CCTV DETECTION FEEDS (STATEWIDE CORRIDOR STREAMS)</span>
              {justRefreshed && (
                <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded animate-fade-in font-bold">
                  UPDATED
                </span>
              )}
            </h2>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
              Automated high-framerate vehicle ANPR, helmet compliance, and facial biometric ingestion across edge CCTV nodes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Background AI & Evidence Vault Toggle */}
          <button
            type="button"
            onClick={() => setShowBackgroundAi(prev => !prev)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer border ${
              showBackgroundAi
                ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/40'
                : 'bg-[#050811] text-cyan-300 hover:text-white border-cyan-950 hover:border-cyan-800'
            }`}
          >
            <Sparkles size={11} className={showBackgroundAi ? 'text-amber-300 animate-pulse' : 'text-cyan-400'} />
            <span>GCP BACKGROUND AI & EVIDENCE ({showBackgroundAi ? 'OPEN' : 'EXPAND'})</span>
          </button>

          <span className="text-[10px] text-zinc-400 bg-[#050811] px-2 py-1 rounded border border-cyan-950 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>4 / 4 CHANNELS STREAMING</span>
          </span>
          {onNavigate && (
            <button
              onClick={() => onNavigate('cameras')}
              className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/40 px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>ALL 50 CAMS</span>
              <ExternalLink size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Grid of 4 Live Stream Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {feeds.map((feed) => {
          const det = feed.currentDetection;
          const isCritical = det.violation && det.type === 'plate';
          const isWarning = det.violation && det.type !== 'plate';

          return (
            <div
              key={feed.id}
              className={`group relative bg-[#050811] rounded-lg border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                isCritical
                  ? 'border-rose-600/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:border-rose-500'
                  : isWarning
                  ? 'border-amber-600/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:border-amber-500'
                  : 'border-cyan-950 hover:border-cyan-500/40'
              }`}
            >
              {/* Camera Header Bar */}
              <div className="bg-[#0b101c]/90 px-2.5 py-1.5 border-b border-cyan-950/60 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <Video size={11} className={isCritical ? 'text-rose-400' : 'text-cyan-400'} />
                  <span className="font-bold text-zinc-100">{feed.id}</span>
                  <span className="text-zinc-400 text-[9px] truncate max-w-[85px]">{feed.district}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px]">
                  <span className="text-emerald-400">{feed.fps.toFixed(1)} FPS</span>
                  <span className="text-zinc-400">•</span>
                  <span className="text-cyan-400">{feed.latencyMs}ms</span>
                </div>
              </div>

              {/* Feed Image & Interactive Detection Stage */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={feed.snapshotUrl}
                  alt={feed.name}
                  className="w-full h-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />

                {/* Subtle Scanline Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[size:100%_4px] pointer-events-none opacity-40" />

                {/* Simulated Bounding Box */}
                {det.bbox && (
                  <div
                    className={`absolute border-2 transition-all duration-300 pointer-events-none ${
                      isCritical
                        ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : isWarning
                        ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                    }`}
                    style={{
                      left: `${det.bbox.x}%`,
                      top: `${det.bbox.y}%`,
                      width: `${det.bbox.w}%`,
                      height: `${det.bbox.h}%`
                    }}
                  >
                    {/* Bounding box corner brackets */}
                    <span className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t-2 border-l-2 border-white" />
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 border-t-2 border-r-2 border-white" />
                    <span className="absolute -bottom-1 -left-1 w-1.5 h-1.5 border-b-2 border-l-2 border-white" />
                    <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b-2 border-r-2 border-white" />

                    {/* Target tag inside box */}
                    <div 
                      className={`absolute -top-5 left-0 px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-sm ${
                        isCritical ? 'bg-rose-600' : isWarning ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                    >
                      {det.targetId} • {det.confidence}%
                    </div>
                  </div>
                )}

                {/* Top overlay pills */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                  <span className="bg-black/70 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded text-[8px] text-zinc-300 flex items-center gap-1 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    REC
                  </span>

                  <div className="flex items-center gap-1">
                    {feed.snapshotUrl?.includes('unsplash.com') && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-500/50 backdrop-blur-sm font-mono">
                        DEMO ASSET
                      </span>
                    )}
                    <span 
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm ${
                        isCritical
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-500/60 animate-pulse'
                          : isWarning
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                          : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                      }`}
                    >
                      {det.label}
                    </span>
                  </div>
                </div>

                {/* Just Refreshed Flash Overlay */}
                {justRefreshed && (
                  <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none animate-pulse" />
                )}
              </div>

              {/* Bottom Metadata & Detection Info */}
              <div className="p-2.5 bg-[#080d1a] flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-wider text-cyan-200">
                    {det.targetId}
                  </span>
                  <span className="text-[9px] text-zinc-400">
                    {feed.lastUpdated}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-300 font-sans truncate">
                  {det.details || feed.location}
                </div>

                {det.speedReading && (
                  <div className="flex items-center justify-between text-[9px] text-amber-300 font-mono bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/30">
                    <span>SPEED RADAR:</span>
                    <span className="font-bold">{det.speedReading}</span>
                  </div>
                )}

                {/* Quick actions row */}
                <div className="flex items-center justify-between pt-1.5 border-t border-cyan-950/60 text-[9px] gap-1">
                  <span className="text-zinc-400 text-[8px] truncate">
                    {feed.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={capturingCameraId === feed.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickClickEvidence(feed.id, feed.name, feed.location);
                      }}
                      className="text-amber-300 hover:text-white bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click Evidence & Seal to Google Cloud Firestore (BSA 2023)"
                    >
                      <Camera size={10} className={capturingCameraId === feed.id ? 'animate-spin' : ''} />
                      <span>{capturingCameraId === feed.id ? 'SEALING...' : 'EVIDENCE'}</span>
                    </button>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate('challenge')}
                        className="text-cyan-400 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>GOD'S EYE</span>
                        <Crosshair size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Integrated Google Cloud Background AI Panel */}
      {showBackgroundAi && (
        <div className="mt-4 pt-3 border-t border-cyan-950/80 animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Active Edge Node: {selectedCameraName} ({selectedCameraForAi.toUpperCase()})
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Firestore Connected
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {feeds.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedCameraForAi(f.id);
                    setSelectedCameraName(f.name);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                    selectedCameraForAi === f.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {f.id.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <LiveStreamBackgroundAiPanel
            cameraId={selectedCameraForAi}
            cameraName={selectedCameraName}
          />
        </div>
      )}
    </div>
  );
}
