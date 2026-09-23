/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * React Hooks for Persistent Background Video Intelligence
 * 
 * Allows React components to bind to decoupled background video tasks.
 * When the component unmounts, the subscription and UI bindings detach cleanly
 * while the background video acquisition and frame analysis continue running.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  persistentVideoIntelligenceService 
} from '../services/video/PersistentVideoIntelligenceService.js';
import { 
  PersistentVideoTaskConfig, 
  PersistentVideoTaskState 
} from '../services/video/PersistentVideoIntelligenceTypes.js';
import { RealVisionDetection, RealRoadSafetyEvent } from '../services/ai/types.js';

interface UsePersistentVideoTaskOptions {
  autoStart?: boolean;
  videoElementRef?: React.RefObject<HTMLVideoElement | null>;
  canvasElementRef?: React.RefObject<HTMLCanvasElement | null>;
  onDetections?: (detections: RealVisionDetection[]) => void;
  onViolation?: (event: RealRoadSafetyEvent) => void;
}

export function usePersistentVideoTask(
  configOrTaskId: string | PersistentVideoTaskConfig,
  options: UsePersistentVideoTaskOptions = {}
) {
  const taskId = typeof configOrTaskId === 'string' ? configOrTaskId : configOrTaskId.taskId;

  const [taskState, setTaskState] = useState<PersistentVideoTaskState | undefined>(() => {
    return persistentVideoIntelligenceService.getTask(taskId);
  });

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // 1. Task Registration and Subscription Lifecycle
  useEffect(() => {
    // If a full configuration object was passed, register or update task
    if (typeof configOrTaskId !== 'string') {
      persistentVideoIntelligenceService.registerTask(configOrTaskId);
    }

    // Subscribe to background task state changes
    const unsubscribe = persistentVideoIntelligenceService.subscribe(taskId, (updatedState) => {
      setTaskState(updatedState);

      if (updatedState.currentDetections.length > 0 && optionsRef.current.onDetections) {
        optionsRef.current.onDetections(updatedState.currentDetections);
      }
      if (updatedState.currentRoadEvents.length > 0 && optionsRef.current.onViolation) {
        for (const evt of updatedState.currentRoadEvents) {
          optionsRef.current.onViolation(evt);
        }
      }
    });

    // Auto-start if requested and currently idle
    const current = persistentVideoIntelligenceService.getTask(taskId);
    if (options.autoStart && current && (current.status === 'IDLE' || current.status === 'STOPPED')) {
      persistentVideoIntelligenceService.startTask(taskId).catch(err => {
        console.warn('[usePersistentVideoTask] Auto-start failed:', err);
      });
    }

    // CLEANUP ON UNMOUNT:
    // Notice: We detach the listener, but DO NOT stop the background task!
    return () => {
      unsubscribe();
    };
  }, [taskId]);

  // 2. Attach / Detach UI Video Element
  useEffect(() => {
    const videoEl = options.videoElementRef?.current;
    if (videoEl) {
      persistentVideoIntelligenceService.attachUiVideoElement(taskId, videoEl);
    }

    return () => {
      persistentVideoIntelligenceService.detachUiVideoElement(taskId);
    };
  }, [taskId, options.videoElementRef]);

  // 3. Attach / Detach UI Canvas Overlay
  useEffect(() => {
    const canvasEl = options.canvasElementRef?.current;
    if (canvasEl) {
      persistentVideoIntelligenceService.attachUiCanvas(taskId, canvasEl);
    }

    return () => {
      persistentVideoIntelligenceService.detachUiCanvas(taskId);
    };
  }, [taskId, options.canvasElementRef]);

  // Helper action methods
  const startTask = useCallback(async (mediaOverride?: File | string) => {
    return await persistentVideoIntelligenceService.startTask(taskId, mediaOverride);
  }, [taskId]);

  const pauseTask = useCallback(() => {
    persistentVideoIntelligenceService.pauseTask(taskId);
  }, [taskId]);

  const resumeTask = useCallback(() => {
    persistentVideoIntelligenceService.resumeTask(taskId);
  }, [taskId]);

  const stopTask = useCallback(() => {
    persistentVideoIntelligenceService.stopTask(taskId);
  }, [taskId]);

  const setFps = useCallback((fps: number) => {
    persistentVideoIntelligenceService.setTaskFps(taskId, fps);
  }, [taskId]);

  const attachVideo = useCallback((videoEl: HTMLVideoElement) => {
    persistentVideoIntelligenceService.attachUiVideoElement(taskId, videoEl);
  }, [taskId]);

  const attachCanvas = useCallback((canvasEl: HTMLCanvasElement) => {
    persistentVideoIntelligenceService.attachUiCanvas(taskId, canvasEl);
  }, [taskId]);

  return {
    task: taskState,
    status: taskState?.status || 'IDLE',
    isRunning: taskState?.status === 'RUNNING',
    isPaused: taskState?.status === 'PAUSED',
    metrics: taskState?.metrics,
    detections: taskState?.currentDetections || [],
    roadSafetyEvents: taskState?.currentRoadEvents || [],
    activeAiModel: taskState?.activeAiModel || 'Gemini Vision (Decoupled)',
    lastFrameSha256: taskState?.lastFrameSha256,
    isUiAttached: taskState?.isUiAttached ?? false,
    startTask,
    pauseTask,
    resumeTask,
    stopTask,
    setFps,
    attachVideo,
    attachCanvas
  };
}

/**
 * Hook to observe all active background video tasks across the platform
 */
export function useActiveBackgroundVideoTasks() {
  const [tasks, setTasks] = useState<PersistentVideoTaskState[]>(() => {
    return persistentVideoIntelligenceService.getAllTasks();
  });

  useEffect(() => {
    const unsub = persistentVideoIntelligenceService.subscribeAll((allTasks) => {
      setTasks([...allTasks]);
    });
    return unsub;
  }, []);

  const activeTasks = tasks.filter(t => t.status === 'RUNNING');
  const totalFramesAnalyzed = tasks.reduce((sum, t) => sum + (t.metrics?.framesAnalyzed || 0), 0);
  const totalDetections = tasks.reduce((sum, t) => sum + (t.metrics?.totalDetections || 0), 0);
  const totalViolations = tasks.reduce((sum, t) => sum + (t.metrics?.violationsDetected || 0), 0);

  return {
    tasks,
    activeTasks,
    activeCount: activeTasks.length,
    hasActiveTasks: activeTasks.length > 0,
    totalFramesAnalyzed,
    totalDetections,
    totalViolations
  };
}
