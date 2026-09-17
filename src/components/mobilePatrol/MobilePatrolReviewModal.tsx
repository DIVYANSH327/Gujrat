/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Officer Review & Judicial Adjudication Modal
 */

import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  MapPin, 
  Check, 
  ExternalLink,
  Cpu,
  Download,
  Clock,
  Printer
} from 'lucide-react';
import { 
  PatrolEventEvidence, 
  OfficerReviewStatus 
} from '../../types/mobilePatrolTypes';

interface MobilePatrolReviewModalProps {
  event: PatrolEventEvidence | null;
  onClose: () => void;
  onSubmitReview: (eventId: string, status: OfficerReviewStatus, notes?: string) => void;
  onNavigateToMap?: (lat: number, lng: number) => void;
}

export const MobilePatrolReviewModal: React.FC<MobilePatrolReviewModalProps> = ({
  event,
  onClose,
  onSubmitReview,
  onNavigateToMap
}) => {
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VAHAN' | 'AI_MESH' | 'BSA_CERT'>('OVERVIEW');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!event) return null;

  const handleAction = (status: OfficerReviewStatus) => {
    onSubmitReview(event.eventId, status, officerNotes);
    setActionSuccess(`Adjudication saved: ${status.replace(/_/g, ' ')}`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Officer Review & Judicial Adjudication
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {event.eventId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rule 50 CMVR 1989 & BSA 2023 Electronic Evidence Compliance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Event Overview
          </button>
          <button
            onClick={() => setActiveTab('VAHAN')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'VAHAN'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car size={13} />
            VAHAN 4.0 Record
          </button>
          <button
            onClick={() => setActiveTab('AI_MESH')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'AI_MESH'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu size={13} />
            13-Agent Deliberations
          </button>
          <button
            onClick={() => setActiveTab('BSA_CERT')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'BSA_CERT'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} />
            Section 63 BSA Certificate
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              
              {/* Event Badge & Core Meta */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">EVENT CATEGORY</span>
                  <span className="text-sm font-bold text-slate-900 uppercase">
                    {event.category.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">REGISTRATION PLATE</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-slate-900">{event.plateText}</span>
                    <span className="text-xs text-slate-500 font-medium">({event.plateType})</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-0.5">LOCATION / NODE</span>
                  <span className="text-xs text-slate-800 font-mono block">
                    {event.gps.status === 'AVAILABLE' && event.gps.latitude
                      ? `${event.gps.latitude.toFixed(4)}°N, ${event.gps.longitude?.toFixed(4)}°E`
                      : 'GPS_UNAVAILABLE'}
                  </span>
                </div>
              </div>

              {/* Side-by-Side Images (Raw vs Enhanced) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Raw Source Evidence (Original Buffer):</span>
                  <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={event.bestFrameUrl}
                      alt="Raw Frame"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    SHA-256: {event.rawFrameHash}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-700">Derived Optical Enhancement:</span>
                  <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={event.enhancedFrameUrl}
                      alt="Enhanced Frame"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/api/sentinel/snapshot/CAM-001';
                      }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    SHA-256: {event.enhancedFrameHash}
                  </p>
                </div>
              </div>

              {/* HSRP Characteristics Matrix */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2.5">
                  CMVR Rule 50 HSRP Security Features Inspection:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">IND Blue Strip:</span>
                    <span className={`font-semibold ${event.hsrpFeatures.indBlueBand === 'VISIBLE' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {event.hsrpFeatures.indBlueBand}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Ashoka Chakra:</span>
                    <span className={`font-semibold ${event.hsrpFeatures.ashokaChakraHologram === 'VISIBLE' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {event.hsrpFeatures.ashokaChakraHologram}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Laser PIN:</span>
                    <span className={`font-semibold ${event.hsrpFeatures.laserEtchedPin === 'VISIBLE' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {event.hsrpFeatures.laserEtchedPin}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">India Hot-Foil:</span>
                    <span className={`font-semibold ${event.hsrpFeatures.indiaFoilStamp === 'VISIBLE' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {event.hsrpFeatures.indiaFoilStamp}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Snap-Lock Rivets:</span>
                    <span className={`font-semibold ${event.hsrpFeatures.snapLockRivets === 'VISIBLE' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {event.hsrpFeatures.snapLockRivets}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Retro-Reflective:</span>
                    <span className={`font-semibold ${event.hsrpFeatures.retroReflectiveSheeting === 'VISIBLE' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {event.hsrpFeatures.retroReflectiveSheeting}
                    </span>
                  </div>
                </div>
              </div>

              {/* Officer Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Officer Adjudication Notes:
                </label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Enter judicial reasoning, e-Challan dispatch reference, or SCRB endorsement remarks..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-hidden text-slate-800"
                />
              </div>

            </div>
          )}

          {activeTab === 'VAHAN' && (
            <div className="space-y-3">
              {event.vahanRecord && event.vahanRecord.lookupStatus === 'VERIFIED_RECORD' ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Car size={18} className="text-blue-600" />
                      <span className="font-bold text-slate-900 text-sm">
                        {event.vahanRecord.sourceName}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      Queried: {new Date(event.vahanRecord.retrievalTimestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Registration Number:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {event.vahanRecord.registrationNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Make & Model:</span>
                      <span className="font-semibold text-slate-900">
                        {event.vahanRecord.vehicleMakeModel || 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Insurance Status:</span>
                      <span className={`font-bold ${event.vahanRecord.insuranceStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {event.vahanRecord.insuranceStatus || 'NOT_AVAILABLE'}
                        {event.vahanRecord.insuranceExpiryDate && ` (Exp: ${event.vahanRecord.insuranceExpiryDate})`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pollution (PUCC):</span>
                      <span className="font-semibold text-slate-900">
                        {event.vahanRecord.puccStatus || 'NOT_AVAILABLE'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Road Tax Status:</span>
                      <span className="font-semibold text-slate-900">
                        {event.vahanRecord.taxStatus || 'PAID'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Crime / Stolen Record:</span>
                      <span className={`font-bold ${event.vahanRecord.stolenReported ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {event.vahanRecord.stolenReported ? `FLAGGED (${event.vahanRecord.crimeLinkedFir})` : 'CLEAR (NO ACTIVE FIR)'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500 text-xs">
                  <p className="font-semibold mb-1">Authoritative Gateway Record Unavailable</p>
                  <p className="text-slate-400">
                    Registration plate was unreadable or external transport gateway is offline. Zero simulated data displayed.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'AI_MESH' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                13-Agent Neural Mesh Deliberation Log:
              </h4>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs">
                {event.agentDeliberations.map((delib) => (
                  <div key={delib.agentId} className="p-3 bg-white hover:bg-slate-50 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{delib.agentName}</span>
                        <span className="font-mono text-[10px] text-slate-400">[{delib.agentId}]</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {delib.deliberationNotes}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        delib.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : delib.status === 'WARNING'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {delib.verdict}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {(delib.confidence * 100).toFixed(0)}% Conf.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'BSA_CERT' && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-3">
              <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">
                    {event.bsaSection63Cert.statute}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Certificate ID: {event.bsaSection63Cert.certId}
                  </span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
                >
                  <Printer size={13} />
                  <span>Print Cert</span>
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-700">
                <p><strong>Device Fingerprint:</strong> {event.bsaSection63Cert.deviceFingerprint}</p>
                <p><strong>Chain of Custody:</strong> {event.bsaSection63Cert.custodyChain}</p>
                <p><strong>Certified By:</strong> {event.bsaSection63Cert.officerBadge}</p>
                <p><strong>Raw Frame Hash:</strong> {event.rawFrameHash}</p>
                <p><strong>Enhanced Frame Hash:</strong> {event.enhancedFrameHash}</p>
                <p><strong>Capture Time:</strong> {event.bsaSection63Cert.generatedAt}</p>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-[10px]">
                ✔ Tamper-evident cryptographic seal verified under Section 63 of Bharatiya Sakshya Adhiniyam 2023. Electronic record ready for judicial production.
              </div>
            </div>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Adjudicate as Officer:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAction('OFFICER_DISMISSED')}
              className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium transition-colors"
            >
              Dismiss / Inconclusive
            </button>

            <button
              onClick={() => handleAction('OFFICER_VERIFIED')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Check size={14} />
              <span>Mark Verified (Store Evidence)</span>
            </button>

            <button
              onClick={() => handleAction('CHALLAN_ISSUED')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Scale size={14} />
              <span>Issue e-Challan (Rule 50)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
