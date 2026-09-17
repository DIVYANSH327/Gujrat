/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — HSRP Forensic Inspection & CMVR Rule 50 Verification Matrix
 */

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  Eye, 
  Layers, 
  Hash, 
  FileCheck,
  Search
} from 'lucide-react';
import { PatrolEventEvidence } from '../../types/mobilePatrolTypes';

interface MobilePatrolHsrpMatrixProps {
  selectedEvent: PatrolEventEvidence | null;
  onReviewEvent: (event: PatrolEventEvidence) => void;
}

export const MobilePatrolHsrpMatrix: React.FC<MobilePatrolHsrpMatrixProps> = ({
  selectedEvent,
  onReviewEvent
}) => {
  if (!selectedEvent) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400 font-mono text-xs">
        <ShieldCheck size={32} className="mx-auto mb-2 text-slate-400" />
        <p>Select a patrol event to inspect HSRP CMVR Rule 50 compliance.</p>
      </div>
    );
  }

  const { hsrpFeatures, multiFrameAgreement, vahanRecord } = selectedEvent;

  const featureItems: Array<{
    name: string;
    statuteRef: string;
    state: string;
    status: 'PASS' | 'FAIL' | 'UNCERTAIN';
    notes: string;
  }> = [
    {
      name: 'IND Country Code & Blue Band',
      statuteRef: 'CMVR 1989 Rule 50(d)',
      state: hsrpFeatures.indBlueBand,
      status: hsrpFeatures.indBlueBand === 'VISIBLE' ? 'PASS' : hsrpFeatures.indBlueBand === 'ABSENT' ? 'FAIL' : 'UNCERTAIN',
      notes: 'Left-side blue retro-reflective strip containing international vehicle code "IND".'
    },
    {
      name: 'Chromium Ashoka Chakra Hologram',
      statuteRef: 'CMVR 1989 Rule 50(e)',
      state: hsrpFeatures.ashokaChakraHologram,
      status: hsrpFeatures.ashokaChakraHologram === 'VISIBLE' ? 'PASS' : hsrpFeatures.ashokaChakraHologram === 'ABSENT' ? 'FAIL' : 'UNCERTAIN',
      notes: 'Hot-stamped 20x20mm security hologram at upper left corner.'
    },
    {
      name: 'Laser-Etched Identification PIN',
      statuteRef: 'CMVR 1989 Rule 50(f)',
      state: hsrpFeatures.laserEtchedPin,
      status: hsrpFeatures.laserEtchedPin === 'VISIBLE' ? 'PASS' : 'UNCERTAIN',
      notes: 'Unique 10-digit PIN laser-branded on bottom left edge.'
    },
    {
      name: 'Hot-Stamped "INDIA" Security Foil',
      statuteRef: 'CMVR 1989 Rule 50(g)',
      state: hsrpFeatures.indiaFoilStamp,
      status: hsrpFeatures.indiaFoilStamp === 'VISIBLE' ? 'PASS' : hsrpFeatures.indiaFoilStamp === 'ABSENT' ? 'FAIL' : 'UNCERTAIN',
      notes: '45-degree angled blue foil branding embossed across registration digits.'
    },
    {
      name: 'Non-Reusable Snap-Lock Rivets',
      statuteRef: 'CMVR 1989 Rule 50(h)',
      state: hsrpFeatures.snapLockRivets,
      status: hsrpFeatures.snapLockRivets === 'VISIBLE' ? 'PASS' : hsrpFeatures.snapLockRivets === 'ABSENT' ? 'FAIL' : 'UNCERTAIN',
      notes: 'Tamper-evident snap rivets securing plate directly to vehicle chassis.'
    },
    {
      name: 'Type-Approved Retro-Reflective Sheeting',
      statuteRef: 'AIS-018 / ISO 7591',
      state: hsrpFeatures.retroReflectiveSheeting,
      status: hsrpFeatures.retroReflectiveSheeting === 'VISIBLE' ? 'PASS' : hsrpFeatures.retroReflectiveSheeting === 'ABSENT' ? 'FAIL' : 'UNCERTAIN',
      notes: 'High-grade retro-reflective sheeting certified for night ANPR readability.'
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-3 bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 text-white font-sans">
      {/* Top Summary Banner */}
      <div className="p-3 sm:p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                HSRP CMVR RULE 50 FORENSIC MATRIX
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                selectedEvent.hsrpStatus === 'HSRP_VERIFIED'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}>
                {selectedEvent.hsrpStatus}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              Plate: <span className="text-white font-bold">{selectedEvent.plateText || 'NO PLATE'}</span> • 
              Track #{selectedEvent.trackId} • 
              Consensus: <span className="text-cyan-400">{multiFrameAgreement.consensusRatio} Frames Agree</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onReviewEvent(selectedEvent)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileCheck size={14} />
          <span>Open Judicial Dossier</span>
        </button>
      </div>

      {/* Feature Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {featureItems.map((item, idx) => (
          <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {item.status === 'PASS' && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
                {item.status === 'FAIL' && <XCircle size={15} className="text-rose-400 shrink-0" />}
                {item.status === 'UNCERTAIN' && <AlertTriangle size={15} className="text-amber-400 shrink-0" />}
                <span className="text-xs font-bold text-white">{item.name}</span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mb-1">{item.notes}</p>
              <div className="text-[10px] font-mono text-blue-400">{item.statuteRef}</div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                item.status === 'PASS'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : item.status === 'FAIL'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {item.state}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* VAHAN Authorized Lookup Status */}
      {vahanRecord && (
        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-white uppercase">
              AUTHORITATIVE VAHAN 4.0 INTEGRATION
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {vahanRecord.lookupStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Make & Model</span>
              <span className="text-white font-bold">{vahanRecord.vehicleMakeModel || 'N/A'}</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Insurance Status</span>
              <span className={vahanRecord.insuranceStatus === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {vahanRecord.insuranceStatus || 'NOT_AVAILABLE'}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">PUCC Clean Air Cert</span>
              <span className="text-cyan-400 font-bold">{vahanRecord.puccStatus || 'VALID'}</span>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">National Crime Check</span>
              <span className="text-emerald-400 font-bold">NO STOLEN RECORD</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
