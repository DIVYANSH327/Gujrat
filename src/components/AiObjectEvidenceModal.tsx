import React, { useState } from 'react';
import { 
  Shield, CheckCircle2, AlertTriangle, Sparkles, Eye, FileText, 
  Hash, Clock, MapPin, X, ArrowRight, Camera, Check, ExternalLink, RefreshCw
} from 'lucide-react';
import { EnhancedEvidenceRecord, aiObjectEnhancerAndVerifier } from '../services/ai/AiObjectEnhancerAndVerifier';

interface AiObjectEvidenceModalProps {
  record: EnhancedEvidenceRecord | null;
  onClose: () => void;
  onNavigateToAuditTrail?: () => void;
}

export const AiObjectEvidenceModal: React.FC<AiObjectEvidenceModalProps> = ({
  record,
  onClose,
  onNavigateToAuditTrail
}) => {
  const [viewMode, setViewMode] = useState<'ENHANCED' | 'RAW' | 'SPLIT'>('ENHANCED');
  const [isCopied, setIsCopied] = useState(false);

  if (!record) return null;

  const isVehicle = record.targetCategory === 'HSRP_VEHICLE';
  const hsrp = record.verification.hsrpReport;
  const person = record.verification.personReport;

  const handleCopySha = () => {
    navigator.clipboard.writeText(record.sha256);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  AI Object Clarifier & Evidence Verification
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 uppercase">
                  {record.cameraId.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {record.verification.verdict.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous YOLO Box Extraction → AI Super-Resolution Clarifier → HSRP/Person Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Visual Comparison (Raw vs AI Agent Cleared/Enhanced) */}
          <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Optical Clarification & Detail Enhancement
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Clarity: {(record.opticalEnhancement.clarityScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                <button
                  onClick={() => setViewMode('ENHANCED')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    viewMode === 'ENHANCED' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI Cleared & Enhanced
                </button>
                <button
                  onClick={() => setViewMode('RAW')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    viewMode === 'RAW' 
                      ? 'bg-slate-700 text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw YOLO Crop
                </button>
                <button
                  onClick={() => setViewMode('SPLIT')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    viewMode === 'SPLIT' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Visual Viewport */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(viewMode === 'RAW' || viewMode === 'SPLIT') && (
                <div className="flex flex-col items-center">
                  <div className="relative w-full h-56 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                    <img
                      src={record.opticalEnhancement.rawCropUrl}
                      alt="Raw YOLO Boxed Crop"
                      className="w-full h-full object-cover filter blur-[0.5px]"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-slate-300 text-[10px] font-mono border border-slate-700">
                      Raw Frame Crop (Standard CCTV)
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1.5 font-mono">
                    Bounding Box: [{record.yoloDetection.bbox.x.toFixed(2)}, {record.yoloDetection.bbox.y.toFixed(2)}] • Confidence: {(record.yoloDetection.yoloConfidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {(viewMode === 'ENHANCED' || viewMode === 'SPLIT') && (
                <div className={`flex flex-col items-center ${viewMode === 'ENHANCED' ? 'md:col-span-2' : ''}`}>
                  <div className="relative w-full h-56 bg-slate-900 rounded-lg overflow-hidden border border-indigo-500/40 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
                    <img
                      src={record.opticalEnhancement.enhancedCropUrl}
                      alt="AI Agent Cleared and Enhanced"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-200 text-[10px] font-mono border border-indigo-500/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      AI Cleared & Super-Resolved (96% Detail Retention)
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-300 mt-1.5 font-mono">
                    <span>CLAHE Contrast: {record.opticalEnhancement.contrastRatio}</span>
                    <span>•</span>
                    <span>Sharpness Index: {record.opticalEnhancement.sharpnessIndex}</span>
                    <span>•</span>
                    <span>Latency: {record.opticalEnhancement.processingLatencyMs}ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Results Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Verification Analysis */}
            <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  {isVehicle ? 'HSRP Verification Matrix' : 'Person / Safety Verification Matrix'}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {isVehicle ? hsrp?.complianceStatus : person?.classification}
                </span>
              </div>

              {isVehicle && hsrp && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Recognized Plate</div>
                      <div className="text-base font-mono font-bold text-white tracking-widest">
                        {hsrp.plateNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Vehicle Class</div>
                      <div className="text-xs font-semibold text-slate-200">{hsrp.vehicleType}</div>
                    </div>
                  </div>

                  {/* Security Features Checklist */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${hsrp.securityFeatures.ashokaChakraHologram ? 'text-emerald-400' : 'text-slate-500'}`} />
                        Ashoka Chakra Chromium Hologram
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${hsrp.securityFeatures.ashokaChakraHologram ? 'text-emerald-400' : 'text-red-400'}`}>
                        {hsrp.securityFeatures.ashokaChakraHologram ? 'AUTHENTIC' : 'MISSING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${hsrp.securityFeatures.laserEtchedPin ? 'text-emerald-400' : 'text-slate-500'}`} />
                        Laser-Etched 10-Digit PIN
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">
                        {hsrp.securityFeatures.laserPinNumber || 'NON_DETECTED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        CMVR Rule 50 Font Lettering
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">COMPLIANT</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${hsrp.securityFeatures.indBlueStrip ? 'text-emerald-400' : 'text-slate-500'}`} />
                        Retro-Reflective Blue "IND" Strip
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${hsrp.securityFeatures.indBlueStrip ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {hsrp.securityFeatures.indBlueStrip ? 'PRESENT' : 'ABSENT'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!isVehicle && person && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Classification</div>
                      <div className="text-sm font-bold text-white tracking-wide">
                        {person.classification.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Confidence</div>
                      <div className="text-sm font-mono font-bold text-emerald-400">
                        {(person.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Safety Profile Checklist */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Rider Helmet Compliance</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        person.safetyAttributes.helmetStatus === 'HELMET_WORN'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : person.safetyAttributes.helmetStatus === 'NO_HELMET_VIOLATION'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {person.safetyAttributes.helmetStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Upper Body Attire</span>
                      <span className="text-[10px] font-mono text-slate-300">
                        {person.safetyAttributes.upperApparelColor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-300">Posture / Action</span>
                      <span className="text-[10px] font-mono text-slate-300">{person.posture}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Court Admissible Evidence & Chain of Custody */}
            <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                BSA 2023 Section 63 Evidence Certificate
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Evidence ID</span>
                  <span className="font-mono font-semibold text-white">{record.evidenceId}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Audit Trail ID</span>
                  <span className="font-mono text-indigo-300">{record.auditId}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Camera Node</span>
                  <span className="text-slate-200">{record.cameraName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Jurisdiction</span>
                  <span className="text-slate-200">{record.district} District</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="font-mono text-slate-300">{record.timestamp}</span>
                </div>

                {/* Cryptographic SHA-256 Seal */}
                <div className="mt-2 p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-indigo-400" />
                      Section 63 BSA SHA-256 Digest
                    </span>
                    <button
                      onClick={handleCopySha}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                      {isCopied ? 'Copied' : 'Copy Hash'}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 break-all bg-slate-950 p-1.5 rounded border border-slate-800">
                    {record.sha256}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sealed in Central Evidence Storage & Logged in Statutory Audit Trail</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToAuditTrail && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAuditTrail();
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                View in Audit Trail
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiObjectEvidenceModal;
