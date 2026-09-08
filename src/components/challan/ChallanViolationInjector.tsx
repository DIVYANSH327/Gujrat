/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * ChallanViolationInjector: Real-Time Violation Simulator & Video Frame Analyzer
 */

import React, { useState } from 'react';
import { 
  PlusCircle, 
  Upload, 
  Zap, 
  AlertTriangle, 
  Camera, 
  Check, 
  FileCheck,
  Shield,
  HelpCircle,
  EyeOff
} from 'lucide-react';
import { 
  ViolationType, 
  ViolationSourceType, 
  ViolationCase 
} from '../../types/v22ChallanTypes';
import { challanReviewService } from '../../services/ChallanReviewService';
import { violationEvidenceCaptureService } from '../../services/ViolationEvidenceCaptureService';

interface Props {
  onCaseCreated: (caseId: string) => void;
}

export const ChallanViolationInjector: React.FC<Props> = ({ onCaseCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CUSTOM'>('PRESETS');
  
  // Custom form state
  const [cameraId, setCameraId] = useState('CAM-014');
  const [location, setLocation] = useState('SG Highway (Ahmedabad)');
  const [plate, setPlate] = useState('GJ05AB1234');
  const [violationType, setViolationType] = useState<ViolationType>('OVERSPEEDING');
  const [speed, setSpeed] = useState(92);
  const [speedLimit, setSpeedLimit] = useState(60);
  const [sourceType, setSourceType] = useState<ViolationSourceType>('SIMULATION');
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState('Excess speed measured by radar sensor.');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setUploadedImageUri(uploadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createAndSubmitCase = (data: {
    cameraId: string;
    location: string;
    plate: string;
    violationType: ViolationType;
    observedValue: any;
    allowedValue: any;
    unit?: string;
    description: string;
    sourceType: ViolationSourceType;
    vehicleType?: string;
    makeModel?: string;
    plateConfidence?: number;
    aiConfidence?: number;
    contextImage?: string;
    speedSensor?: 'RADAR' | 'LASER' | 'AI_OPTICAL_TRACKING' | 'SIMULATED';
    signalRed?: boolean;
    stopLineCrossed?: boolean;
  }) => {
    const caseId = `VC-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestamp = new Date().toISOString();
    const ctxImg = data.contextImage || uploadedImageUri || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80';
    const vehImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
    const pltImg = 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80';

    const evidencePkg = violationEvidenceCaptureService.captureViolationEvidence({
      caseId,
      sourceType: data.sourceType,
      cameraId: data.cameraId,
      edgeNodeId: `EDGE-${data.cameraId}`,
      location: data.location,
      timestamp,
      contextFrameUri: ctxImg,
      vehicleCropUri: vehImg,
      plateCropUri: pltImg,
      preViolationFrameUri: ctxImg,
      violationFrameUri: vehImg,
      postViolationFrameUri: ctxImg,
      metadata: {
        violationType: data.violationType,
        observedValue: data.observedValue
      },
      isSimulated: data.sourceType === 'SIMULATION'
    });

    const newCase: ViolationCase = {
      caseId,
      eventId: `EV-${Date.now()}`,
      correlationId: `CORR-${caseId}`,
      sourceType: data.sourceType,
      cameraId: data.cameraId,
      edgeNodeId: `EDGE-${data.cameraId}`,
      timestamp,
      location: data.location,
      latitude: 23.0225,
      longitude: 72.5714,

      vehiclePlate: data.plate,
      normalizedPlate: data.plate.replace(/[^A-Z0-9]/g, ''),
      plateConfidence: data.plateConfidence ?? 0.96,
      vehicleObservationId: `OBS-${caseId}`,
      vehicleType: data.vehicleType || 'Car',
      vehicleMakeModel: data.makeModel || 'Observed Vehicle',
      vehicleColor: 'DARK',
      vehicleConfidence: 0.94,

      violationType: data.violationType,
      violationSeverity: data.violationType === 'RED_LIGHT_VIOLATION' || data.violationType === 'OVERSPEEDING' ? 'HIGH' : 'MEDIUM',
      violationDescription: data.description,

      observedValue: data.observedValue,
      allowedValue: data.allowedValue,
      unit: data.unit,

      aiConfidence: data.aiConfidence ?? 0.95,
      anprConfidence: data.plateConfidence ?? 0.96,
      evidenceQuality: (data.plateConfidence ?? 0.96) > 0.8 ? 'HIGH' : 'LOW',
      evidenceCompleteness: 'COMPLETE',

      fullContextEvidenceId: evidencePkg.frameReferences.contextFrame,
      vehicleCropEvidenceId: evidencePkg.frameReferences.vehicleCrop,
      plateCropEvidenceId: evidencePkg.frameReferences.plateCrop,
      additionalEvidenceIds: [
        evidencePkg.frameReferences.preViolationFrame!,
        evidencePkg.frameReferences.violationFrame!,
        evidencePkg.frameReferences.postViolationFrame!
      ],

      speedEvidence: data.violationType === 'OVERSPEEDING' ? {
        measuredSpeedKmH: Number(data.observedValue) || 90,
        allowedSpeedKmH: Number(data.allowedValue) || 60,
        speedSensorType: data.speedSensor || 'SIMULATED',
        zoneName: `${data.location} Speed Zone`
      } : undefined,

      signalStateEvidence: data.violationType === 'RED_LIGHT_VIOLATION' ? {
        signalColor: data.signalRed !== false ? 'RED' : 'GREEN',
        amberIntervalSec: 3.0,
        redElapsedSec: 2.1,
        stopLineCrossed: data.stopLineCrossed !== false
      } : undefined,

      status: 'PENDING_REVIEW',
      externalLookupStatus: 'NOT_PERFORMED',
      challanProvider: 'Gujarat e-Challan Simulation Gateway (Demonstration)',
      dispatchStatus: 'NONE',

      integrityHash: evidencePkg.integrityHash,
      evidencePackageId: evidencePkg.evidencePackageId,

      createdAt: timestamp,
      updatedAt: timestamp,
      sourceOfTruth: 'SIMULATED',

      retentionPolicy: {
        policyId: 'RET-TRAFFIC-STATUTORY-01',
        rawVideoDays: 30,
        statutoryEvidenceYears: 3,
        isTamperSealed: true,
        department: 'Traffic Enforcement Branch'
      },
      retentionUntil: new Date(Date.now() + 3 * 365 * 86400000).toISOString(),
      auditRecordIds: [],
      suggestedFineAmount: 1500,
      isSimulated: data.sourceType === 'SIMULATION'
    };

    challanReviewService.submitForReview(newCase);
    onCaseCreated(caseId);
    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600/30 to-amber-700/20 hover:from-amber-600/40 hover:to-amber-700/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold shadow-md transition"
      >
        <Zap size={14} className="text-amber-400" />
        Inject / Analyze Violation
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Live Violation Candidate Generator & Analyzer
                  </h3>
                  <p className="text-xs text-slate-400">
                    Simulate real-time CCTV events or upload authorized video frames
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
              <button
                onClick={() => setActiveTab('PRESETS')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'PRESETS'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Scenarios & Edge Cases
              </button>
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'CUSTOM'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Ingestion / Upload Frame
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {activeTab === 'PRESETS' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Preset 1: SG Highway Overspeeding */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-lg space-y-2.5 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">SG Highway Overspeeding</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                          CAM-014
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Plate: <span className="font-mono text-cyan-300">GJ05AB1234</span> • Observed: <strong className="text-amber-300">92 km/h</strong> (Limit 60 km/h). Complete high-resolution radar corroboration.
                      </p>
                    </div>
                    <button
                      onClick={() => createAndSubmitCase({
                        cameraId: 'CAM-014',
                        location: 'SG Highway (Ahmedabad)',
                        plate: 'GJ05AB1234',
                        violationType: 'OVERSPEEDING',
                        observedValue: 92,
                        allowedValue: 60,
                        unit: 'km/h',
                        description: 'Vehicle exceeded the speed limit of 60 km/h by 32 km/h on SG Highway corridor.',
                        sourceType: 'SIMULATION',
                        vehicleType: 'Car (SUV)',
                        makeModel: 'BMW X5'
                      })}
                      className="w-full py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 rounded font-medium transition"
                    >
                      Inject SG Highway Scenario
                    </button>
                  </div>

                  {/* Preset 2: Red Light Jump */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-lg space-y-2.5 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Navrangpura Red Light Jump</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                          CAM-008
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Plate: <span className="font-mono text-cyan-300">GJ01CD5678</span> • Crossed stop line 2.4s after red signal transition with multi-frame corroboration.
                      </p>
                    </div>
                    <button
                      onClick={() => createAndSubmitCase({
                        cameraId: 'CAM-008',
                        location: 'Navrangpura Crossroad',
                        plate: 'GJ01CD5678',
                        violationType: 'RED_LIGHT_VIOLATION',
                        observedValue: 'RED (2.4s elapsed)',
                        allowedValue: 'GREEN',
                        description: 'Crossed marked stopline 2.4 seconds after signal illuminated red.',
                        sourceType: 'SIMULATION',
                        vehicleType: 'Sedan',
                        makeModel: 'Honda City',
                        signalRed: true,
                        stopLineCrossed: true
                      })}
                      className="w-full py-1.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 rounded font-medium transition"
                    >
                      Inject Red Light Scenario
                    </button>
                  </div>

                  {/* Preset 3: Helmetless Riding */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-lg space-y-2.5 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">Ellis Bridge Helmetless Riding</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                          CAM-019
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Plate: <span className="font-mono text-cyan-300">GJ27EF9012</span> • Two-wheeler rider without helmet with clear unobstructed head region.
                      </p>
                    </div>
                    <button
                      onClick={() => createAndSubmitCase({
                        cameraId: 'CAM-019',
                        location: 'Ellis Bridge (West End)',
                        plate: 'GJ27EF9012',
                        violationType: 'HELMETLESS_RIDING',
                        observedValue: 'No Helmet Observed',
                        allowedValue: 'Standard ISI Helmet',
                        description: 'Two-wheeler rider observed operating vehicle without standard safety helmet.',
                        sourceType: 'SIMULATION',
                        vehicleType: 'Motorcycle',
                        makeModel: 'Hero Splendor'
                      })}
                      className="w-full py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 rounded font-medium transition"
                    >
                      Inject Helmetless Scenario
                    </button>
                  </div>

                  {/* Preset 4: Low-Confidence / Obscured Plate Edge Case */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-lg space-y-2.5 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <EyeOff size={13} className="text-rose-400" />
                          Edge Case: Obscured Plate
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          CAM-031
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Plate: <span className="font-mono text-rose-400">GJ01??9999</span> (Confidence 42%). Demonstrates No-False-Confidence downgrade & sufficiency block.
                      </p>
                    </div>
                    <button
                      onClick={() => createAndSubmitCase({
                        cameraId: 'CAM-031',
                        location: 'Kalupur Circle',
                        plate: 'GJ01??9999',
                        violationType: 'OVERSPEEDING',
                        observedValue: 85,
                        allowedValue: 50,
                        unit: 'km/h',
                        description: 'Possible overspeeding, but license plate is obscured by mud.',
                        sourceType: 'SIMULATION',
                        plateConfidence: 0.42,
                        aiConfidence: 0.65
                      })}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded font-medium transition"
                    >
                      Inject Low-Confidence Case
                    </button>
                  </div>

                  {/* Preset 5: YouTube Demo Source Edge Case */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-lg space-y-2.5 transition flex flex-col justify-between col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Shield size={14} className="text-amber-400" />
                          Edge Case: YouTube Public Demo Feed (Non-Enforceable)
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Demonstrates strict statutory policy: YouTube live feeds are display-only and strictly prohibited from challan issuance.
                        </p>
                      </div>
                      <button
                        onClick={() => createAndSubmitCase({
                          cameraId: 'CAM-YT-DEMO-01',
                          location: 'Public Stream Demo Feed',
                          plate: 'GJ01YT0001',
                          violationType: 'WRONG_LANE',
                          observedValue: 'Corridor Breach',
                          allowedValue: 'Normal Lane',
                          description: 'Observation flagged from YouTube public demonstration camera.',
                          sourceType: 'YOUTUBE_DEMO',
                          plateConfidence: 0.88
                        })}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded font-medium transition shrink-0 ml-4"
                      >
                        Inject YouTube Case
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Camera ID</label>
                      <input
                        type="text"
                        value={cameraId}
                        onChange={e => setCameraId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">License Plate Number</label>
                      <input
                        type="text"
                        value={plate}
                        onChange={e => setPlate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-amber-400 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Violation Type</label>
                      <select
                        value={violationType}
                        onChange={e => setViolationType(e.target.value as ViolationType)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="OVERSPEEDING">Overspeeding</option>
                        <option value="RED_LIGHT_VIOLATION">Red Light Violation</option>
                        <option value="HELMETLESS_RIDING">Helmetless Riding</option>
                        <option value="TRIPLE_RIDING">Triple Riding</option>
                        <option value="WRONG_LANE">Wrong Lane / BRTS Intrusion</option>
                        <option value="WRONG_SIDE_DRIVING">Wrong Side Driving</option>
                      </select>
                    </div>
                  </div>

                  {violationType === 'OVERSPEEDING' && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                      <div>
                        <label className="text-slate-400 block mb-1">Measured Speed (km/h)</label>
                        <input
                          type="number"
                          value={speed}
                          onChange={e => setSpeed(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-amber-400 font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Allowed Speed Limit (km/h)</label>
                        <input
                          type="number"
                          value={speedLimit}
                          onChange={e => setSpeedLimit(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-slate-400 block mb-1">Evidence Frame (Upload Snapshot)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                    />
                    {uploadedImageUri && (
                      <div className="mt-2 h-24 rounded border border-slate-800 overflow-hidden bg-black">
                        <img src={uploadedImageUri} alt="Uploaded frame" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => createAndSubmitCase({
                      cameraId,
                      location,
                      plate,
                      violationType,
                      observedValue: violationType === 'OVERSPEEDING' ? speed : 'Triggered',
                      allowedValue: violationType === 'OVERSPEEDING' ? speedLimit : 'Compliant',
                      unit: violationType === 'OVERSPEEDING' ? 'km/h' : undefined,
                      description: customDescription,
                      sourceType
                    })}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    Submit Custom Violation to Human Review Queue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
