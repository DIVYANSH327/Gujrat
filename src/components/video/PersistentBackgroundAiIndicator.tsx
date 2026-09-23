/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * Persistent Background AI Tasks Indicator
 * Gujarat Police CCTV & AI Intelligence Platform (SCRB)
 * 
 * Floating HUD / Status badge informing officers of decoupled video acquisition
 * and frame analysis tasks that are running continuously in the background.
 */

import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Pause, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  Shield,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useActiveBackgroundVideoTasks } from '../../hooks/usePersistentVideoIntelligence.js';
import { persistentVideoIntelligenceService } from '../../services/video/PersistentVideoIntelligenceService.js';

interface PersistentBackgroundAiIndicatorProps {
  onNavigateToAnalysis?: () => void;
  className?: string;
}

export const PersistentBackgroundAiIndicator: React.FC<PersistentBackgroundAiIndicatorProps> = ({
  onNavigateToAnalysis,
  className = ''
}) => {
  const { activeTasks, activeCount, hasActiveTasks, totalFramesAnalyzed, totalDetections, totalViolations } = useActiveBackgroundVideoTasks();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!hasActiveTasks) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Floating Pill Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-900/95 border border-cyan-500/40 rounded-full shadow-2xl backdrop-blur-md cursor-pointer hover:border-cyan-400 transition-all text-white select-none"
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 relative" />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-200">
            {activeCount} Background AI {activeCount === 1 ? 'Task' : 'Tasks'} Active
          </span>
          <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded text-[10px] font-mono">
            {totalFramesAnalyzed} frames
          </span>
        </div>

        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        )}
      </div>

      {/* Expanded Task Flyout */}
      {isExpanded && (
        <div className="mt-2 w-96 bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-lg text-slate-200 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-100">Persistent Video AI Services</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
              Decoupled from UI
            </span>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 mb-3">
            Video acquisition and frame analysis continue running uninterrupted in background memory even when components unmount or you switch views.
          </div>

          {/* Active Tasks List */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {activeTasks.map(task => (
              <div 
                key={task.config.taskId}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 truncate max-w-[200px]" title={task.config.name}>
                    {task.config.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-1 text-[10px] bg-slate-900/80 p-1.5 rounded border border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-400 block">Analyzed</span>
                    <span className="text-cyan-300 font-bold">{task.metrics?.framesAnalyzed || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Detections</span>
                    <span className="text-amber-300 font-bold">{task.metrics?.totalDetections || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Violations</span>
                    <span className="text-rose-400 font-bold">{task.metrics?.violationsDetected || 0}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400 text-[10px]">
                    FPS: {task.config.fps} | UI: {task.isUiAttached ? 'Attached' : 'Decoupled (Background)'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => persistentVideoIntelligenceService.pauseTask(task.config.taskId)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[10px]"
                      title="Pause background task"
                    >
                      <Pause className="w-2.5 h-2.5" /> Pause
                    </button>
                    <button
                      onClick={() => persistentVideoIntelligenceService.stopTask(task.config.taskId)}
                      className="px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 flex items-center gap-1 text-[10px]"
                      title="Stop task"
                    >
                      <Square className="w-2.5 h-2.5" /> Stop
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick jump to Real AI Video Analysis */}
          {onNavigateToAnalysis && (
            <button
              onClick={() => {
                setIsExpanded(false);
                onNavigateToAnalysis();
              }}
              className="mt-3 w-full py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Open Real AI Video Analysis View
            </button>
          )}
        </div>
      )}
    </div>
  );
};
