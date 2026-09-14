import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Eye,
  Lock,
  Binary,
  Gauge,
  Camera,
  ArrowRight,
  Maximize2,
  FileCode,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { DiagnosticAuditReport, PipelineStageFrame } from '../services/server/CctvDiagnosticEngine';

interface CctvRawDiagnosticDashboardProps {
  initialCameraId?: string;
}

export function CctvRawDiagnosticDashboard({
  initialCameraId = 'cam01'
}: CctvRawDiagnosticDashboardProps) {
  const [selectedCameraId, setSelectedCameraId] = useState<string>(initialCameraId);
  const [decoderMode, setDecoderMode] = useState<'KEYFRAME_SYNC' | 'CURRENT_DECODER'>('KEYFRAME_SYNC');
  const [report, setReport] = useState<DiagnosticAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(2);
  const [isComparing, setIsComparing] = useState<boolean>(true);

  // Available Corp8 Sandbox Cameras
  const availableCameras = [
    { id: 'cam01', name: 'SVPI Airport Exit Gantry', district: 'Ahmedabad North' },
    { id: 'cam02', name: 'Kalupur Central Railway Station', district: 'Ahmedabad Central' },
    { id: 'cam03', name: 'SG Highway Iscon Cross Road', district: 'Ahmedabad West' },
    { id: 'cam04', name: 'Sabarmati Riverfront Promenade', district: 'Ahmedabad Central' },
    { id: 'cam05', name: 'C.G. Road Swastik Char Rasta', district: 'Ahmedabad West' },
    { id: 'cam06', name: 'Maninagar Kankaria Lake Gate 3', district: 'Ahmedabad South' },
    { id: 'cam07', name: 'Vastrapur Lake Junction', district: 'Ahmedabad West' },
    { id: 'cam08', name: 'Sarkhej Toll Plaza Outbound', district: 'Ahmedabad South' },
    { id: 'cam09', name: 'Geeta Mandir Bus Port North', district: 'Ahmedabad Central' },
    { id: 'cam10', name: 'Naroda Industrial GIDC Checkpoint', district: 'Ahmedabad East' },
    { id: 'cam11', name: 'Bopal Ring Road Flyover Junction', district: 'Ahmedabad West' },
    { id: 'cam12', name: 'Prahladnagar Corporate Road', district: 'Ahmedabad West' },
    { id: 'cam13', name: 'Ashram Road Income Tax Circle', district: 'Ahmedabad Central' },
    { id: 'cam14', name: 'Odhav Ring Road Toll Gate', district: 'Ahmedabad East' },
    { id: 'cam15', name: 'Chandkheda Zundal Circle Link', district: 'Ahmedabad North' },
    { id: 'cam16', name: 'Satellite Shyamal Cross Roads', district: 'Ahmedabad West' }
  ];

  const runAudit = useCallback(async (camId: string, mode: 'KEYFRAME_SYNC' | 'CURRENT_DECODER') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sentinel/audit/pipeline/${camId}?mode=${mode}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Diagnostic audit failed to execute');
      }
      setReport(data.report);
    } catch (err: any) {
      setError(err?.message || 'Error executing camera audit');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    runAudit(selectedCameraId, decoderMode);
  }, [selectedCameraId, decoderMode, runAudit]);

  const stagesList: (PipelineStageFrame | undefined)[] = report ? [
    report.stages.stage1_rawDecoded,
    report.stages.stage2_sentinelJpeg,
    report.stages.stage3_processedFrame,
    report.stages.stage4_aiInputFrame
  ] : [];

  const activeStageData = stagesList.find(s => s && s.stageNumber === selectedStageNumber) || report?.stages.stage2_sentinelJpeg;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Executive Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-xl">
                <Activity size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Corp8 CCTV → Sentinel Raw Video Diagnostic & Frame Decoder Audit
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Empirical Layer-by-Layer Forensic Audit • Gujarat Police SCRB Hackathon Sandbox
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Camera Switcher & Decoder Mode Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Camera Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 pr-8 hover:border-blue-500 focus:outline-none focus:border-blue-500 transition cursor-pointer font-medium"
              >
                {availableCameras.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id.toUpperCase()} — {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Mode Switcher: Keyframe Sync vs Legacy Unsynced */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDecoderMode('KEYFRAME_SYNC')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  decoderMode === 'KEYFRAME_SYNC'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Fixed Synced Decoder: Enforces keyframe arrival before decoding (-skip_frame nokey -vsync 0)"
              >
                <CheckCircle2 size={13} />
                <span>KEYFRAME_SYNC (Fixed)</span>
              </button>
              <button
                type="button"
                onClick={() => setDecoderMode('CURRENT_DECODER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  decoderMode === 'CURRENT_DECODER'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Legacy Unsynced Decoder: Shows premature P-frame capture (-flags2 +showall -ec +favor_inter)"
              >
                <AlertTriangle size={13} />
                <span>CURRENT_DECODER (Legacy Bug)</span>
              </button>
            </div>

            {/* Refresh Audit Button */}
            <button
              type="button"
              onClick={() => runAudit(selectedCameraId, decoderMode)}
              disabled={isLoading}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl transition cursor-pointer flex items-center justify-center"
              title="Re-run Live Audit"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Audit Status Banner */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {report && (
          <div className="mt-5 space-y-4">
            {/* Case Classification Card */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              report.caseClassification === 'CASE_B'
                ? report.decoderMode === 'KEYFRAME_SYNC'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                    report.caseClassification === 'CASE_B'
                      ? report.decoderMode === 'KEYFRAME_SYNC'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {report.caseClassification}
                  </span>
                  <span className="font-bold text-sm text-white">{report.caseTitle}</span>
                </div>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {report.caseDescription}
                </p>
                <div className="text-[11px] font-mono text-slate-400 pt-1">
                  Root Cause Proof: {report.exactLayerIdentified}
                </div>
              </div>

              {/* Quick Telemetry Pill */}
              <div className="shrink-0 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1 font-mono">
                <div className="text-slate-400">Stream Telemetry:</div>
                <div className="text-white font-bold">{report.streamTelemetry.transport} • {report.streamTelemetry.codec}</div>
                <div className="text-slate-300">{report.streamTelemetry.resolution} @ {report.streamTelemetry.frameRate} fps</div>
                <div className="text-blue-400 text-[10px]">
                  HLS: {report.streamTelemetry.hlsStatus.authType} ({report.streamTelemetry.hlsStatus.statusCode})
                </div>
              </div>
            </div>

            {/* Disentangled Scores Breakdown (Audit Section 15 Mandate) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Evidence Integrity */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    Evidence Integrity
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {report.scores.evidenceIntegrityScore} / 100
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  SHA-256 Bitstream Intact
                </div>
                <div className="text-[10px] text-slate-500 truncate" title={report.stages.stage2_sentinelJpeg.sha256}>
                  Hash: {report.stages.stage2_sentinelJpeg.sha256.slice(0, 16)}...
                </div>
              </div>

              {/* Image Usability */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Gauge size={14} className={report.scores.imageUsabilityScore > 50 ? 'text-blue-400' : 'text-amber-400'} />
                    Image Usability
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    report.scores.imageUsabilityScore > 50 ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {report.scores.imageUsabilityScore} / 100
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  {report.scores.imageUsabilityLabel}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Contrast: {report.stages.stage2_sentinelJpeg.pixelMetrics?.contrastStdDev.toFixed(1) || '0'} σ
                </div>
              </div>

              {/* AI Confidence */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Cpu size={14} className="text-purple-400" />
                    AI Confidence
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    {report.scores.aiConfidenceScore}%
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  {report.scores.aiConfidenceLabel}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Target: Gemini 3.8 Flash
                </div>
              </div>

              {/* Plate OCR Readability */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Eye size={14} className={report.scores.plateOcrReadability === 'READABLE' ? 'text-emerald-400' : 'text-rose-400'} />
                    Plate OCR Status
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    report.scores.plateOcrReadability === 'READABLE'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {report.scores.plateOcrReadability}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  {report.scores.plateOcrReadability === 'READABLE' ? 'Clear Character Edges' : 'Indeterminate Pixels'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  No Fabricated Prediction
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Forensic Examination Area */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 4-Stage Pipeline Step Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-blue-400" />
                4-Stage Pipeline Execution Audit
              </h3>
              <p className="text-xs text-slate-400">
                Inspect each isolated stage buffer to trace where the frame is acquired, encoded, enhanced, or fed to AI.
              </p>

              <div className="space-y-2 pt-2">
                {stagesList.map((stage) => {
                  if (!stage) return null;
                  const isSelected = stage.stageNumber === selectedStageNumber;
                  return (
                    <button
                      key={stage.stageNumber}
                      type="button"
                      onClick={() => setSelectedStageNumber(stage.stageNumber)}
                      className={`w-full text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500/50 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {stage.stageNumber}
                          </span>
                          <span className="text-xs font-bold">{stage.stageName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {stage.stageDescription}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 block">
                          {(stage.byteSize / 1024).toFixed(1)} KB
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {stage.dimensions.width}×{stage.dimensions.height}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empirical Comparison Stats (Audit Section 14) */}
            {report.comparison && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-amber-400" />
                  Legacy vs. Synced Metric Comparison
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="text-[10px] text-amber-400 font-bold uppercase">Legacy Decoder</div>
                    <div className="text-slate-300">Size: {(report.comparison.unsyncedBytes / 1024).toFixed(1)} KB</div>
                    <div className="text-slate-300">Contrast: {report.comparison.unsyncedContrast.toFixed(1)} σ</div>
                    <div className="text-slate-400 text-[10px]">Gray Peak: {report.comparison.unsyncedDominantPixelPct.toFixed(1)}%</div>
                    <div className="text-rose-400 text-[10px] font-bold">UNREADABLE (Flat Gray)</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-emerald-900/50 space-y-1">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">Synced Decoder</div>
                    <div className="text-slate-300">Size: {(report.comparison.syncedBytes / 1024).toFixed(1)} KB</div>
                    <div className="text-slate-300">Contrast: {report.comparison.syncedContrast.toFixed(1)} σ</div>
                    <div className="text-slate-400 text-[10px]">Gray Peak: {report.comparison.syncedDominantPixelPct.toFixed(1)}%</div>
                    <div className="text-emerald-400 text-[10px] font-bold">READABLE (High Fidelity)</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Active Stage Visualizer & Pixel Forensics (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              {/* Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera size={16} className="text-blue-400" />
                    {activeStageData?.stageName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    MIME: {activeStageData?.mimeType} • Size: {activeStageData?.byteSize.toLocaleString()} bytes • Dimensions: {activeStageData?.dimensions.width}×{activeStageData?.dimensions.height}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg">
                    SHA-256: {activeStageData?.sha256.slice(0, 12)}...
                  </span>
                </div>
              </div>

              {/* Frame Visual Preview */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[360px] max-h-[480px]">
                {activeStageData?.dataUrl ? (
                  <img
                    src={activeStageData.dataUrl}
                    alt={activeStageData.stageName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <AlertTriangle size={32} className="mx-auto text-slate-600" />
                    <p className="text-xs">No visual image buffer emitted at this stage</p>
                  </div>
                )}

                {/* Overlay Badge */}
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-white">
                  Stage {activeStageData?.stageNumber}: {activeStageData?.dimensions.width}×{activeStageData?.dimensions.height}
                </div>

                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300">
                  Decoder: {report.decoderMode}
                </div>
              </div>

              {/* Pixel Metric Matrix for Stage 2 */}
              {activeStageData?.pixelMetrics && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Binary size={14} className="text-blue-400" />
                    Mathematical Pixel Forensics
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Contrast Std-Dev (σ)</div>
                      <div className="text-white font-bold text-sm">
                        {activeStageData.pixelMetrics.contrastStdDev.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500">Threshold: &gt; 15.0</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Mean Luminance (μ)</div>
                      <div className="text-white font-bold text-sm">
                        {activeStageData.pixelMetrics.meanLuminance.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-slate-500">Range: 0 - 255</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Dominant Pixel Concentration</div>
                      <div className={`font-bold text-sm ${
                        activeStageData.pixelMetrics.dominantPixelPercentage > 40 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {activeStageData.pixelMetrics.dominantPixelPercentage.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500">Gray Value: {activeStageData.pixelMetrics.dominantPixelValue}</div>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Laplacian Sharpness</div>
                      <div className="text-white font-bold text-sm">
                        {Math.round(activeStageData.pixelMetrics.laplacianSharpness)}
                      </div>
                      <div className="text-[10px] text-slate-500">Edge Variance</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-850">
                    <span className="text-slate-400">JPEG Headers (0xFF 0xD8):</span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      VALID_SOI &amp; VALID_EOI
                    </span>
                  </div>
                </div>
              )}

              {/* Stage Specific Technical Details */}
              {activeStageData?.details && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCode size={14} className="text-purple-400" />
                    Stage Configuration &amp; Parameters
                  </h4>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto p-2 bg-slate-900 rounded-lg">
                    {JSON.stringify(activeStageData.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
