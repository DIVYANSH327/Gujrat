import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Clock, 
  ChevronRight, 
  Radio,
  Zap,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { LatestEventInfo } from './AIDetectionAnalysisPanel';

export type PipelineStageStatus = 'READY' | 'PROCESSING' | 'COMPLETED' | 'WAITING' | 'FAILED' | 'REVIEW';

export interface PipelineStage {
  id: string;
  name: string;
  status: PipelineStageStatus;
}

interface AIBottomTelemetryRowProps {
  pipelineStages: PipelineStage[];
  gpuUsage: number | null; // null if unavailable
  cpuUsage: number;
  memoryUsage: number;
  videoFps: number | string;
  resolution: string;
  latencyMs: number;
  aiModelName: string;
  lastEvent: LatestEventInfo | null;
  onViewLastEvent: () => void;
  onViewAllEvents?: () => void;
}

export const AIBottomTelemetryRow: React.FC<AIBottomTelemetryRowProps> = ({
  pipelineStages,
  gpuUsage,
  cpuUsage,
  memoryUsage,
  videoFps,
  resolution,
  latencyMs,
  aiModelName,
  lastEvent,
  onViewLastEvent,
  onViewAllEvents
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. AI Pipeline Status Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            AI Pipeline Status
          </h3>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </span>
        </div>

        {/* Pipeline Nodes Flow */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-2">
          {pipelineStages.map((stage, idx) => {
            const isCompleted = stage.status === 'COMPLETED' || stage.status === 'READY';
            const isProcessing = stage.status === 'PROCESSING';

            return (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center text-center shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : isProcessing
                      ? 'bg-blue-600 text-white animate-spin'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={14} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 mt-1">
                    {stage.name}
                  </span>
                  <span className="text-[9px] text-slate-400 capitalize">
                    {stage.status.toLowerCase()}
                  </span>
                </div>

                {idx < pipelineStages.length - 1 && (
                  <div className="h-0.5 flex-1 bg-slate-200 min-w-[8px]" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. System Performance Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity size={14} className="text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              System Performance
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Live</span>
        </div>

        {/* 3 Circular / Progress Gauges */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* GPU Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-500"
                  strokeDasharray={`${gpuUsage !== null ? gpuUsage : 0}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-800 font-mono">
                {gpuUsage !== null ? `${gpuUsage}%` : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">GPU</span>
          </div>

          {/* CPU Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600 transition-all duration-500"
                  strokeDasharray={`${cpuUsage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-800 font-mono">
                {cpuUsage}%
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">CPU</span>
          </div>

          {/* Memory Gauge */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-600 transition-all duration-500"
                  strokeDasharray={`${memoryUsage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-bold text-slate-800 font-mono">
                {memoryUsage}%
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 mt-1 uppercase">Memory</span>
          </div>
        </div>
      </div>

      {/* 3. Live Stats Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio size={14} className="text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Live Stats
            </h3>
          </div>
          <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {aiModelName}
          </span>
        </div>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-500 uppercase font-medium">FPS</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{videoFps}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-500 uppercase font-medium">Resolution</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{resolution}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-500 uppercase font-medium">Latency</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{latencyMs} ms</div>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <div className="text-[10px] text-slate-500 uppercase font-medium">AI Model</div>
            <div className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">{aiModelName}</div>
          </div>
        </div>
      </div>

      {/* 4. Last Event Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Last Event
            </h3>
          </div>
          {onViewAllEvents && (
            <button
              type="button"
              onClick={onViewAllEvents}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              View All
            </button>
          )}
        </div>

        {lastEvent ? (
          <div
            onClick={onViewLastEvent}
            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all cursor-pointer group gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {lastEvent.thumbnailUrl ? (
                <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                  <img
                    src={lastEvent.thumbnailUrl}
                    alt="Event thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} />
                </div>
              )}

              <div className="min-w-0">
                <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded border border-rose-200 uppercase truncate">
                  {lastEvent.title}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {lastEvent.camera} • {lastEvent.time}
                </div>
              </div>
            </div>

            <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No events registered yet.
          </div>
        )}
      </div>
    </div>
  );
};
