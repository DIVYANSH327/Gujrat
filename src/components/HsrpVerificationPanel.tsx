/**
 * Corp8 Sentinel Agentic HSRP Verification Panel
 * Displays real-time vehicle tracking, optical plate detection, and HSRP security verification.
 * Backed by genuine server-side CAM-01 RTSP frame extraction and SHA-256 evidence integrity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Camera,
  Cpu,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Hash,
  ExternalLink,
  Sliders,
  Sparkles,
  Zap,
  Info,
  Car,
  FileCheck
} from 'lucide-react';
import { HSRPVerificationResult, VisionMeshTelemetry } from '../services/vision/visionTypes';

export function HsrpVerificationPanel() {
  const [telemetry, setTelemetry] = useState<VisionMeshTelemetry | null>(null);
  const [recentVerifications, setRecentVerifications] = useState<HSRPVerificationResult[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<HSRPVerificationResult | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, verifRes] = await Promise.all([
        fetch('/api/sentinel/ai-status/cam01'),
        fetch('/api/sentinel/hsrp/verifications')
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setTelemetry(data);
        if (data.latestVerification && !selectedVerification) {
          setSelectedVerification(data.latestVerification);
        }
      }

      if (verifRes.ok) {
        const list = await verifRes.json();
        setRecentVerifications(list || []);
      }

      setLastRefreshed(new Date());
    } catch (err: any) {
      console.warn('Failed to poll HSRP status:', err);
    }
  }, [selectedVerification]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleManualTrigger = async () => {
    setIsTriggering(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/sentinel/ai-trigger/cam01', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        if (data.verification) {
          setSelectedVerification(data.verification);
        }
      } else {
        setErrorNotice('Inference trigger returned status ' + res.status);
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Failed to trigger inference');
    } finally {
      setIsTriggering(false);
      fetchStatus();
    }
  };

  const getStatusBadge = (state?: string) => {
    switch (state) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI MESH LIVE
          </span>
        );
      case 'AI_PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw size={12} className="animate-spin text-blue-600" />
            INFERENCE IN PROGRESS
          </span>
        );
      case 'AI_KEY_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={12} className="text-amber-600" />
            GEMINI_API_KEY REQUIRED
          </span>
        );
      case 'STREAM_BUFFERING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock size={12} className="text-yellow-600" />
            STREAM BUFFERING
          </span>
        );
      case 'CAMERA_OFFLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-600" />
            CAM01 OFFLINE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            STANDBY
          </span>
        );
    }
  };

  const getDecisionBadge = (decision?: string) => {
    switch (decision) {
      case 'HSRP_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs">
            <ShieldCheck size={14} />
            HSRP VERIFIED
          </span>
        );
      case 'HSRP_NOT_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-xs">
            <ShieldAlert size={14} />
            HSRP INCONSISTENT
          </span>
        );
      case 'NEEDS_BETTER_CAPTURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-sky-600 text-white shadow-xs">
            <RefreshCw size={14} />
            NEEDS BETTER CAPTURE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-xs">
            <AlertTriangle size={14} />
            UNCERTAIN
          </span>
        );
    }
  };

  const activeResult = selectedVerification || telemetry?.latestVerification;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Sentinel CAM-01 Agentic HSRP Vision Mesh
              </h3>
              {getStatusBadge(telemetry?.pipelineState)}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Chiman bhai Bridge (Ahmedabad)</span>
              <span>•</span>
              <span className="font-mono text-slate-600">Rule 50 CMVR 1989 Compliance</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={handleManualTrigger}
            disabled={isTriggering}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Zap size={13} className={isTriggering ? 'animate-spin' : ''} />
            <span>{isTriggering ? 'Running AI Mesh...' : 'Trigger Immediate Inference'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 border-b border-slate-200 bg-white divide-x divide-y sm:divide-y-0 divide-slate-100 text-xs">
        <div className="p-3">
          <span className="text-slate-400 font-medium block text-[11px]">Frames Sampled</span>
          <span className="text-sm font-bold text-slate-900 font-mono">
            {telemetry?.framesCaptured ?? 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-400 font-medium block text-[11px]">Vehicles Detected</span>
          <span className="text-sm font-bold text-slate-900 font-mono">
            {telemetry?.vehiclesDetected ?? 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-400 font-medium block text-[11px]">Active Tracks</span>
          <span className="text-sm font-bold text-blue-700 font-mono">
            {telemetry?.activeTracks ?? 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-400 font-medium block text-[11px]">Plates Detected</span>
          <span className="text-sm font-bold text-slate-900 font-mono">
            {telemetry?.platesDetected ?? 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-400 font-medium block text-[11px]">HSRP Verified</span>
          <span className="text-sm font-bold text-emerald-600 font-mono">
            {telemetry?.HSRPVerified ?? 0}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-400 font-medium block text-[11px]">Inconsistent</span>
          <span className="text-sm font-bold text-rose-600 font-mono">
            {telemetry?.HSRPNotVerified ?? 0}
          </span>
        </div>
        <div className="p-3 col-span-2 sm:col-span-1">
          <span className="text-slate-400 font-medium block text-[11px]">Avg AI Latency</span>
          <span className="text-sm font-bold text-slate-800 font-mono">
            {telemetry?.averageLatency ? `${telemetry.averageLatency} ms` : '—'}
          </span>
        </div>
      </div>

      {/* Main Content: Evidence & Inspection */}
      <div className="p-4 sm:p-5 space-y-4">
        {errorNotice && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
            <span>{errorNotice}</span>
          </div>
        )}

        {telemetry?.lastError && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={15} className="text-blue-600 shrink-0" />
              <span>{telemetry.lastError}</span>
            </div>
            {telemetry.pipelineState === 'AI_KEY_REQUIRED' && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                Configure in Settings
              </span>
            )}
          </div>
        )}

        {activeResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Cryptographic Evidence Images (Full Frame + Plate Crop) */}
            <div className="lg:col-span-5 space-y-3">
              {/* Full Frame Snapshot */}
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group">
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[10px] font-mono">
                    FULL FRAME EVIDENCE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-mono">
                    CAM-01
                  </span>
                </div>
                <img
                  src={activeResult.fullFrameUrl}
                  alt="Real CAM01 RTSP Evidence Frame"
                  className="w-full aspect-16/9 object-cover bg-slate-950"
                  onError={(e) => {
                    // Fallback to placeholder if snapshot expired
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="p-2 bg-slate-950/90 text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800">
                  <span className="truncate max-w-[200px]" title={activeResult.fullFrameSha256}>
                    SHA: {activeResult.fullFrameSha256?.substring(0, 16)}...
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Cryptographically Sealed
                  </span>
                </div>
              </div>

              {/* Plate Crop Snapshot */}
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center gap-4">
                <div className="w-36 h-16 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center shrink-0">
                  {activeResult.plateCropUrl ? (
                    <img
                      src={activeResult.plateCropUrl}
                      alt="Plate Crop"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500">NO CROP</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    OPTICAL PLATE REGION
                  </span>
                  <div className="text-sm font-black font-mono text-white tracking-widest">
                    {activeResult.registrationNumber || 'UNREADABLE'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    HASH: {activeResult.plateCropSha256?.substring(0, 14)}...
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Multi-Agent Assessment Breakdown */}
            <div className="lg:col-span-7 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
              {/* Decision Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Track:
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {activeResult.vehicleTrackId}
                    </span>
                    <span className="text-xs text-slate-400 font-medium capitalize">
                      ({activeResult.vehicleClass})
                    </span>
                  </div>
                </div>
                <div>{getDecisionBadge(activeResult.decision)}</div>
              </div>

              {/* Agent Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. OCR Agent */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Plate OCR Agent
                  </span>
                  <div className="text-xs font-semibold text-slate-800">
                    {activeResult.agents?.ocr?.data?.normalizedText ? (
                      <span className="font-mono font-bold text-blue-700 text-sm">
                        {activeResult.agents.ocr.data.normalizedText}
                      </span>
                    ) : (
                      <span className="text-slate-400">Incomplete or Obscured</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Confidence:{' '}
                    <strong>{Math.round((activeResult.agents?.ocr?.confidence || 0) * 100)}%</strong>
                  </p>
                </div>

                {/* 2. Evidence Quality Agent */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Evidence Quality Score
                  </span>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    {activeResult.evidenceQuality} / 100
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Status:{' '}
                    <strong className={activeResult.evidenceQuality >= 45 ? 'text-emerald-600' : 'text-amber-600'}>
                      {activeResult.evidenceQuality >= 45 ? 'Adequate for Verification' : 'Low Resolution'}
                    </strong>
                  </p>
                </div>

                {/* 3. HSRP Security Features */}
                <div className="sm:col-span-2 bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      HSRP Security Attributes (CMVR Rule 50)
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      Result: <strong>{activeResult.agents?.hsrp?.data?.result || 'UNCERTAIN'}</strong>
                    </span>
                  </div>

                  {activeResult.agents?.hsrp?.data?.characteristics &&
                  activeResult.agents.hsrp.data.characteristics.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeResult.agents.hsrp.data.characteristics.map((char, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium"
                        >
                          <CheckCircle2 size={10} className="text-emerald-600" />
                          {char}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      No security characteristics definitively confirmed in current frame.
                    </p>
                  )}

                  {activeResult.agents?.hsrp?.data?.inconsistencies &&
                    activeResult.agents.hsrp.data.inconsistencies.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {activeResult.agents.hsrp.data.inconsistencies.map((inc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded"
                          >
                            <XCircle size={12} className="shrink-0 text-rose-600" />
                            <span>{inc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {/* Reasons & Findings */}
              {activeResult.reasons && activeResult.reasons.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Analytical Findings
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700">
                    {activeResult.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Statutory Legal Admissibility Disclaimer */}
              <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-[10px] text-blue-900 space-y-1">
                <div className="flex items-center gap-1 font-bold text-blue-950">
                  <FileCheck size={12} className="text-blue-700 shrink-0" />
                  <span>Statutory Compliance Notice (Bharatiya Sakshya Adhiniyam, 2023)</span>
                </div>
                <p className="text-[10px] text-blue-800 leading-normal">
                  {activeResult.auditNotice}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
            <Camera size={32} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">
              Awaiting Vehicle Detection on CAM-01
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Frames from Sentinel CAM-01 are continuously extracted via RTSP. When a vehicle crosses
              the camera viewing area, the Agentic Vision Mesh will track it, extract the plate, and verify HSRP compliance.
            </p>
          </div>
        )}

        {/* Recent Verifications History Strip */}
        {recentVerifications.length > 1 && (
          <div className="pt-3 border-t border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
              Recent Verifications (Past Observations)
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {recentVerifications.map((v, i) => {
                const isSelected = selectedVerification?.vehicleTrackId === v.vehicleTrackId;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedVerification(v)}
                    className={`shrink-0 p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-10 h-7 bg-slate-900 rounded overflow-hidden flex items-center justify-center shrink-0">
                      {v.plateCropUrl ? (
                        <img src={v.plateCropUrl} alt="crop" className="w-full h-full object-contain" />
                      ) : (
                        <Car size={12} className="text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0 pr-1">
                      <div className="text-xs font-bold font-mono text-slate-900 truncate">
                        {v.registrationNumber || 'Unreadable'}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span>{v.decision === 'HSRP_VERIFIED' ? 'Verified' : v.decision}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
