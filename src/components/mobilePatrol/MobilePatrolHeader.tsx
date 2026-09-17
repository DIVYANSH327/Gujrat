/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Header Component
 */

import React from 'react';
import { 
  Car, 
  Video, 
  MapPin, 
  Cpu, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  HardDrive,
  CloudUpload,
  Gauge
} from 'lucide-react';
import { 
  PatrolCameraMetadata, 
  StorageEfficiencyMetrics,
  PatrolCameraMode 
} from '../../types/mobilePatrolTypes';

interface MobilePatrolHeaderProps {
  metadata: PatrolCameraMetadata;
  metrics: StorageEfficiencyMetrics;
  onOpenSettings: () => void;
  onSyncCloud: () => void;
  onChangeCameraMode: (mode: PatrolCameraMode) => void;
  isSyncing: boolean;
}

export const MobilePatrolHeader: React.FC<MobilePatrolHeaderProps> = ({
  metadata,
  metrics,
  onOpenSettings,
  onSyncCloud,
  onChangeCameraMode,
  isSyncing
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        {/* Unit Identity & Camera Mode */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Car size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-900 text-base tracking-tight">
                {metadata.vehicleId}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {metadata.callSign}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                EDGE NODE ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{metadata.assignedSector}</span>
              <span>•</span>
              <span className="font-mono text-slate-600">{metadata.cameraId}</span>
            </p>
          </div>
        </div>

        {/* Operational Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Camera Mode Selector */}
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onChangeCameraMode('PATROL_4K_CAMERA')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                metadata.cameraType === 'PATROL_4K_CAMERA'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4K UHD
            </button>
            <button
              onClick={() => onChangeCameraMode('PATROL_ANPR_CAMERA')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                metadata.cameraType === 'PATROL_ANPR_CAMERA'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ANPR 60FPS
            </button>
            <button
              onClick={() => onChangeCameraMode('PATROL_DUAL_CAMERA')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                metadata.cameraType === 'PATROL_DUAL_CAMERA'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DUAL VISION
            </button>
          </div>

          {/* GPS Telemetry */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <MapPin size={13} className="text-blue-600" />
            {metadata.gps.status === 'AVAILABLE' && metadata.gps.latitude ? (
              <span className="font-mono">
                {metadata.gps.latitude.toFixed(4)}°N, {metadata.gps.longitude?.toFixed(4)}°E
                {metadata.gps.speedKmH !== null && (
                  <span className="text-slate-500 ml-1.5">({metadata.gps.speedKmH} km/h)</span>
                )}
              </span>
            ) : (
              <span className="text-amber-600 font-medium">GPS_UNAVAILABLE</span>
            )}
          </div>

          {/* AI Engine Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <Cpu size={13} className="text-purple-600" />
            <span>YOLOv8 Edge ({metadata.accelerationMode})</span>
          </div>

          {/* Network & Cloud Sync Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            {metadata.networkStatus === 'ONLINE' ? (
              <>
                <Wifi size={13} className="text-emerald-600" />
                <span className="text-emerald-700 font-medium">ONLINE</span>
              </>
            ) : metadata.networkStatus === 'SYNCING' ? (
              <>
                <RefreshCw size={13} className="text-blue-600 animate-spin" />
                <span className="text-blue-700 font-medium">SYNCING...</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-amber-600" />
                <span className="text-amber-700 font-medium">OFFLINE (QUEUE)</span>
              </>
            )}
          </div>

          {/* Storage Efficiency Metric */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            <HardDrive size={13} className="text-emerald-600" />
            <span className="font-medium">{metrics.bandwidthReductionRatio}</span>
            <span className="text-emerald-600">({metrics.rawVideoStorageSavedGb} GB saved)</span>
          </div>

          {/* Action Buttons */}
          <button
            onClick={onSyncCloud}
            disabled={isSyncing}
            title="Sync offline queue to Google Cloud (Pub/Sub & BigQuery)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium transition-colors"
          >
            <CloudUpload size={13} className={isSyncing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Sync Cloud</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="Configure Patrol Node Parameters"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            <Sliders size={14} />
          </button>
        </div>

      </div>
    </header>
  );
};
