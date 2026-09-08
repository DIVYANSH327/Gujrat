import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Video, 
  Radio, 
  Server, 
  Cpu, 
  Activity, 
  Lock, 
  CheckCircle2, 
  Info,
  ExternalLink,
  Sliders
} from 'lucide-react';
import { Camera, CameraSourceAvailability } from '../types';
import { DemoVideoSource } from '../video/types';

interface CameraDetailsModalProps {
  camera?: Camera | null;
  demoSource?: DemoVideoSource | null;
  onClose: () => void;
  onConfigureVideo?: () => void;
  onNavigateToEdgeFleet?: () => void;
  onNavigateToMobileCamera?: () => void;
}

export function CameraDetailsModal({
  camera,
  demoSource,
  onClose,
  onConfigureVideo,
  onNavigateToEdgeFleet,
  onNavigateToMobileCamera
}: CameraDetailsModalProps) {
  if (!camera && !demoSource) return null;

  const isMobile = camera?.sourceType === 'MOBILE_CAMERA';
  const displayId = demoSource?.id || camera?.id || 'UNKNOWN-NODE';
  const displayName = isMobile ? 'Android Phone Camera' : (demoSource?.name || camera?.name || 'CCTV Video Stream');
  const district = isMobile ? 'Mobile Field Unit' : (demoSource?.district || camera?.district || 'Ahmedabad');
  const location = isMobile ? 'Browser getUserMedia Adapter' : (demoSource?.locationLabel || camera?.location || 'Municipal Corridor');
  const isDemo = Boolean(demoSource) || camera?.sourceType === 'YOUTUBE_DEMO' || camera?.sourceType === 'YOUTUBE_LIVE';
  const videoProvider = isMobile ? 'Real Phone Camera (Browser getUserMedia)' : isDemo ? 'YouTube Live Stream (Demo Embed)' : 'Local Edge / DVR Stream';
  const videoStatus = isMobile ? (camera?.status === 'online' ? 'CONNECTED' : 'DISCONNECTED') : isDemo ? (demoSource?.status === 'UNAVAILABLE' ? 'STREAM UNAVAILABLE' : 'LIVE DEMO') : (camera?.status === 'online' ? 'ONLINE' : 'OFFLINE');
  const edgeNodeId = camera?.edgeNodeId || 'EDGE-GJ-001';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl w-full max-w-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-cyan-950/60 flex items-center justify-between bg-[#06080e] shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700/50 rounded">
              {displayId}
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono flex items-center gap-2">
                {displayName}
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono uppercase">
                JURISDICTION: GUJARAT POLICE ({district}) • {isDemo ? 'DEMO STREAM LAYER' : 'PHYSICAL CCTV NODE'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Status Callout */}
        <div className="p-3.5 bg-cyan-950/20 border-b border-cyan-900/40 flex items-center justify-between shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${isDemo ? 'bg-emerald-400 animate-pulse' : (camera?.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400')}`} />
            <div>
              <span className="text-zinc-400">VIDEO STATUS: </span>
              <span className={`font-bold ${isDemo ? 'text-emerald-300' : (camera?.status === 'online' ? 'text-emerald-300' : 'text-rose-400')}`}>
                {videoStatus}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#05070c] border border-cyan-800/40 text-cyan-300">
            {isDemo ? 'SOURCE: YOUTUBE DEMO STREAM' : `PROTOCOL: ${camera?.protocol || 'ONVIF'}`}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-xs font-mono">
          {/* Main Grid: Metadata & Architecture Attributes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Card: Stream / Source Details */}
            <div className="p-3.5 bg-[#06080d] border border-cyan-950/60 rounded space-y-2">
              <div className="text-[11px] font-bold text-cyan-400 border-b border-cyan-950/40 pb-1.5 flex items-center gap-1.5">
                <Video size={13} /> STREAM CONFIGURATION
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">CAMERA ID:</span>
                  <span className="text-zinc-200 font-bold">{displayId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">STREAM NAME:</span>
                  <span className="text-zinc-300 truncate max-w-[180px]">{displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">DISTRICT:</span>
                  <span className="text-zinc-300">{district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">LOCATION:</span>
                  <span className="text-zinc-300">{location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">SOURCE TYPE:</span>
                  <span className="text-cyan-300 font-bold">{isMobile ? 'MOBILE_CAMERA' : isDemo ? 'YOUTUBE_DEMO' : (camera?.sourceType || 'ONVIF')}</span>
                </div>
                {isMobile && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">DEVICE TYPE:</span>
                      <span className="text-emerald-400 font-bold">ANDROID_BROWSER</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">AI ANALYSIS:</span>
                      <span className="text-zinc-400 font-bold">NOT_STARTED (PHASE 1)</span>
                    </div>
                  </>
                )}
                {isDemo && demoSource && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">YOUTUBE VIDEO ID:</span>
                    <span className="text-amber-300 font-bold">{demoSource.youtubeVideoId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Architecture & Ingestion Isolation */}
            <div className="p-3.5 bg-[#06080d] border border-cyan-950/60 rounded space-y-2">
              <div className="text-[11px] font-bold text-cyan-400 border-b border-cyan-950/40 pb-1.5 flex items-center gap-1.5">
                <Server size={13} /> INGESTION & PIPELINE ARCHITECTURE
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">VIDEO PROVIDER:</span>
                  <span className="text-zinc-300">{videoProvider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">INTEGRATION STATUS:</span>
                  <span className="text-zinc-300">{isMobile ? 'REAL BROWSER CAMERA' : isDemo ? 'DEMONSTRATION SOURCE' : 'INTEGRATION_READY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">EDGE AGENT LINK:</span>
                  <span className="text-zinc-400">{isMobile ? 'BROWSER ADAPTER (LOCAL EVENT BUS)' : isDemo ? 'ISOLATED (NO EDGE HOOK)' : edgeNodeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">STREAM PROTOCOL:</span>
                  <span className="text-zinc-400">{isMobile ? 'WebRTC / getUserMedia' : isDemo ? 'YouTube Embed (HTTPS)' : (camera?.protocol || 'RTSP/TCP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">RESOLUTION:</span>
                  <span className="text-zinc-400">{isMobile ? (camera?.resolution || '1920x1080 (Detected)') : isDemo ? 'Managed by YouTube Player' : (camera?.resolution || '1080p')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Separation Notice */}
          <div className="p-3.5 bg-[#060a14] border border-cyan-900/40 rounded space-y-2">
            <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
              <Info size={13} className="text-cyan-400" /> SYSTEM ARCHITECTURE SEPARATION
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {isMobile ? (
                <span>
                  <strong className="text-zinc-200">Mobile Camera Test Mode:</strong> Uses the Android device camera through the browser API and is intended for development and field testing. It functions as an ICameraSource adapter within the Unified CCTV Intelligence Grid.
                </span>
              ) : (
                <span>
                  <strong className="text-zinc-200">Demonstration Video vs Production Ingest:</strong> YouTube live streams are rendered exclusively in the visual presentation layer for hackathon demonstration. The production Gujarat Police CCTV architecture employs ruggedized on-premise Edge Agent nodes consuming real-time ONVIF/RTSP feeds from municipal DVR/NVR hardware.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cyan-950/60 bg-[#06080e] flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-zinc-500">
            GUJARAT POLICE COMMAND CENTER • {isMobile ? 'MOBILE CAMERA ADAPTER' : 'CCTV INGESTION LAYER'}
          </span>
          <div className="flex items-center gap-2">
            {isMobile && onNavigateToMobileCamera && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToMobileCamera();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                OPEN MOBILE CAMERA TEST
              </button>
            )}
            {onConfigureVideo && !isMobile && (
              <button
                onClick={onConfigureVideo}
                className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 rounded text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Sliders size={13} /> CONFIGURE ONVIF/RTSP
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-mono text-zinc-200 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
