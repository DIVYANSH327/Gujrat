import React, { useState } from 'react';
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
  Sliders,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  HardDrive
} from 'lucide-react';
import { Camera, CameraSourceAvailability } from '../types';
import { DemoVideoSource } from '../video/types';
import { StatusBadge } from './ui/OfficerPrimitives';
import { SentinelStreamPlayer } from './SentinelStreamPlayer';

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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!camera && !demoSource) return null;

  const isMobile = camera?.sourceType === 'MOBILE_CAMERA';
  const displayId = demoSource?.id || camera?.id || 'CAM-001';
  const displayName = isMobile ? 'Android Phone Camera' : (demoSource?.name || camera?.name || 'Traffic Junction');
  const district = isMobile ? 'Mobile Field Unit' : (demoSource?.district || camera?.district || 'Ahmedabad');
  const location = isMobile ? 'Browser getUserMedia Adapter' : (demoSource?.locationLabel || camera?.location || 'Ahmedabad');
  const isDemo = Boolean(demoSource) || camera?.sourceType === 'YOUTUBE_DEMO' || camera?.sourceType === 'YOUTUBE_LIVE';
  const videoProvider = isMobile ? 'Real Phone Camera (Browser getUserMedia)' : isDemo ? 'YouTube Live Stream (Demo Embed)' : 'Local Edge / DVR Stream';
  const isOnline = camera?.status === 'online' || isDemo;
  const edgeNodeId = camera?.edgeNodeId || 'EDGE-GJ-001';
  const alertCount = camera?.alertCount !== undefined ? camera.alertCount : 1;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Video size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                  {displayId}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {district}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                {displayName}
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Main Camera Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Camera ID</span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {displayId}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Status</span>
              <div className="mt-1">
                <StatusBadge 
                  status={isOnline ? 'LIVE' : 'OFFLINE'} 
                  label={isOnline ? 'LIVE' : 'OFFLINE'} 
                  size="sm" 
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Alerts</span>
              <p className="text-sm font-bold text-rose-600 mt-0.5">
                {alertCount} Pending
              </p>
            </div>

            <div className="col-span-2 sm:col-span-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Location: </span>
                <span className="text-xs font-semibold text-slate-800">{location}</span>
              </div>
            </div>
          </div>

          {/* Camera Viewport: Real Sentinel Stream if Sentinel camera, otherwise default */}
          {displayId.toLowerCase().startsWith('cam') || camera?.streamUrl?.includes('sentinel') ? (
            <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-950 shadow-sm">
              <SentinelStreamPlayer
                cameraId={displayId}
                cameraName={displayName}
                location={location}
                district={district}
                streamUrl={camera?.streamUrl || `/api/sentinel/stream/${displayId}/index.m3u8`}
                aspectRatio="16/9"
                showControls={true}
                showTelemetryOverlay={false}
              />
            </div>
          ) : (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex flex-col items-center justify-center text-white">
              <img
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80"
                alt="Live Camera Feed"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-slate-900/85 px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE FEED</span>
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-900/85 px-3 py-1 rounded-lg text-xs font-mono">
                {displayId} • {district} • 25 FPS
              </div>
            </div>
          )}

          {/* Collapsible Technical Details Button */}
          <div className="pt-1">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-between border border-slate-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-slate-500" />
                <span>Technical Details</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span>{showTechnicalDetails ? 'Hide' : 'Show'}</span>
                {showTechnicalDetails ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>

            {/* Technical Details Content */}
            {showTechnicalDetails && (
              <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs font-mono text-slate-700">
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Source Type:</span>
                  <span className="font-bold text-slate-900">{isMobile ? 'MOBILE_CAMERA' : isDemo ? 'YOUTUBE_DEMO' : (camera?.sourceType || 'ONVIF')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Protocol:</span>
                  <span className="font-bold text-slate-900">{isMobile ? 'WebRTC / getUserMedia' : isDemo ? 'HTTPS / Embed' : (camera?.protocol || 'RTSP/ONVIF')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Stream State:</span>
                  <span className="font-bold text-emerald-700">{isOnline ? 'CONNECTED' : 'OFFLINE'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Edge Agent Node:</span>
                  <span className="font-bold text-slate-900">{edgeNodeId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Camera Hardware ID:</span>
                  <span className="font-bold text-slate-900">{displayId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">DVR/NVR Appliance:</span>
                  <span className="font-bold text-slate-900">{camera?.vendor || 'Hikvision / Axis VMS'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Network Latency:</span>
                  <span className="font-bold text-slate-900">18ms (Edge Handoff)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Health State:</span>
                  <span className="font-bold text-emerald-700">OPTIMAL</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
