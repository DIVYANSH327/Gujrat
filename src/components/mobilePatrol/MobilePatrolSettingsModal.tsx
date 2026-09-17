/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Settings & Edge Node Configuration Modal
 */

import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Cpu, 
  HardDrive, 
  Video, 
  Cloud, 
  Check, 
  Shield 
} from 'lucide-react';
import { 
  PatrolNodeConfiguration, 
  PatrolCameraMode,
  AiAccelerationMode 
} from '../../types/mobilePatrolTypes';

interface MobilePatrolSettingsModalProps {
  config: PatrolNodeConfiguration;
  onClose: () => void;
  onSaveConfig: (config: Partial<PatrolNodeConfiguration>) => void;
}

export const MobilePatrolSettingsModal: React.FC<MobilePatrolSettingsModalProps> = ({
  config,
  onClose,
  onSaveConfig
}) => {
  const [bufferSec, setBufferSec] = useState<number>(config.rollingBufferSeconds);
  const [cameraMode, setCameraMode] = useState<PatrolCameraMode>(config.cameraMode);
  const [accelerationMode, setAccelerationMode] = useState<AiAccelerationMode>(config.accelerationMode);
  const [retentionDays, setRetentionDays] = useState<number>(config.eventRetentionDays);
  const [autoSync, setAutoSync] = useState<boolean>(config.autoCloudSync);
  const [strictHdr, setStrictHdr] = useState<boolean>(config.strictHdrDeblur);

  const handleSave = () => {
    onSaveConfig({
      rollingBufferSeconds: bufferSec,
      cameraMode,
      accelerationMode,
      eventRetentionDays: retentionDays,
      autoCloudSync: autoSync,
      strictHdrDeblur: strictHdr
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders size={18} className="text-blue-400" />
            <h3 className="text-sm font-bold tracking-tight">Patrol Vision Node Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Bounded Rolling Buffer Duration */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                Sliding Rolling Buffer Duration:
              </label>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {bufferSec} seconds
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="15"
              step="1"
              value={bufferSec}
              onChange={(e) => setBufferSec(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="text-[11px] text-slate-500">
              Only retains past {bufferSec}s in edge device RAM. Discards old non-event video continuously.
            </p>
          </div>

          {/* Camera Sensor Mode */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Video size={13} className="text-slate-500" />
              Patrol Camera Mode:
            </label>
            <select
              value={cameraMode}
              onChange={(e) => setCameraMode(e.target.value as PatrolCameraMode)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium outline-hidden"
            >
              <option value="PATROL_4K_CAMERA">1. 4K Ultra HD Normal Camera (3840x2160 @ 30FPS)</option>
              <option value="PATROL_ANPR_CAMERA">2. ANPR-Capable High-Shutter Camera (1080p @ 60FPS)</option>
              <option value="PATROL_DUAL_CAMERA">3. Dual Sensor Mode (4K Overview + ANPR Zoom)</option>
            </select>
          </div>

          {/* Hardware Acceleration Mode */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Cpu size={13} className="text-slate-500" />
              AI Inference Hardware Acceleration:
            </label>
            <select
              value={accelerationMode}
              onChange={(e) => setAccelerationMode(e.target.value as AiAccelerationMode)}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium outline-hidden"
            >
              <option value="GPU">Edge GPU / TensorRT (Default High Speed)</option>
              <option value="AUTO">Auto (Dynamic Edge Load Balancing)</option>
              <option value="CPU">CPU Only (Low Power / Fallback)</option>
              <option value="OFF">Inference Suspended (Sensor Only)</option>
            </select>
          </div>

          {/* Event Retention Policy */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <HardDrive size={13} className="text-slate-500" />
              Event-Only Evidence Retention (Cloud Storage):
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium outline-hidden"
            >
              <option value="30">30 Days (Standard Minor Violations)</option>
              <option value="90">90 Days (Gujarat SCRB Standard Policy)</option>
              <option value="180">180 Days (High Priority Intercepts)</option>
              <option value="365">365 Days (Criminal & Judicial Record)</option>
            </select>
            <p className="text-[10px] text-slate-400">
              Raw unflagged video retention: 0 hours (Event-Only architecture).
            </p>
          </div>

          {/* Auto Cloud Sync Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <span className="font-semibold text-slate-800 block">Automatic Cloud Sync</span>
              <span className="text-[11px] text-slate-500">Dispatch verified events to Pub/Sub and BigQuery</span>
            </div>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            <Check size={14} />
            <span>Apply Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
};
