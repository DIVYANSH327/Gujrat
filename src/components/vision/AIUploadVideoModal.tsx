/**
 * AIUploadVideoModal Component
 * Gujarat Police AI CCTV Intelligence Platform — Sentinel Grid
 * 
 * Crisp white modal interface for uploading and analyzing recorded traffic video clips
 * using the real Sentinel YOLOv8 + OCR + HSRP AI Pipeline.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  X, 
  FileVideo, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Clock, 
  HardDrive,
  Eye
} from 'lucide-react';
import { UploadedVideoFrameSource } from '../../services/video/UploadedVideoFrameSource';
import { realAIEvidencePipeline, EvidenceRecord, RealAIDetection } from '../../services/ai/RealAIEvidencePipeline';
import { ViewMode } from '../../types';

interface AIUploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewMode) => void;
  onEvidenceCreated?: (evidence: EvidenceRecord) => void;
}

interface VideoMetadata {
  file: File;
  name: string;
  sizeMb: number;
  durationSec: number;
  resolution: string;
  previewUrl: string;
}

export const AIUploadVideoModal: React.FC<AIUploadVideoModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onEvidenceCreated
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [videoMeta, setVideoMeta] = useState<VideoMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [samplingFps, setSamplingFps] = useState<number>(1.0);

  // Detections & Evidence Output
  const [analyzedDetections, setAnalyzedDetections] = useState<RealAIDetection[]>([]);
  const [generatedEvidence, setGeneratedEvidence] = useState<EvidenceRecord[]>([]);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const frameSourceRef = useRef<UploadedVideoFrameSource | null>(null);
  const isCanceledRef = useRef<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      if (videoMeta?.previewUrl) {
        URL.revokeObjectURL(videoMeta.previewUrl);
      }
    };
  }, [videoMeta]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setProgressPercent(0);
      setCurrentStage('IDLE');
      setIsProcessing(false);
      isCanceledRef.current = false;
    }
  }, [isOpen]);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const validExtensions = ['.mp4', '.webm', '.mov', '.mkv'];
    
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!validTypes.includes(file.type) && !hasValidExt) {
      setErrorMessage('Unsupported video format. Please upload MP4, WebM, or MOV files.');
      return;
    }

    if (file.size > 250 * 1024 * 1024) {
      setErrorMessage('Video exceeds configured upload limit of 250 MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = previewUrl;

    tempVideo.onloadedmetadata = () => {
      setVideoMeta({
        file,
        name: file.name,
        sizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
        durationSec: Math.round(tempVideo.duration || 0),
        resolution: `${tempVideo.videoWidth || 1920} × ${tempVideo.videoHeight || 1080}`,
        previewUrl
      });
    };

    tempVideo.onerror = () => {
      setErrorMessage('Could not decode video file metadata. The file may be corrupt.');
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Run Real Frame-by-Frame AI Pipeline
  const handleStartAnalysis = async () => {
    if (!videoMeta || !videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    isCanceledRef.current = false;
    setErrorMessage(null);
    setAnalyzedDetections([]);
    setGeneratedEvidence([]);
    setProgressPercent(5);
    setCurrentStage('FRAME EXTRACTION');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    try {
      video.src = videoMeta.previewUrl;
      await video.play();

      const duration = video.duration || videoMeta.durationSec || 10;
      const stepIntervalSec = 1.0 / samplingFps;
      let currentSampleTime = 0;
      const newEvidences: EvidenceRecord[] = [];
      const collectedDetections: RealAIDetection[] = [];

      while (currentSampleTime < duration && !isCanceledRef.current) {
        video.currentTime = currentSampleTime;
        
        // Wait for seek to complete
        await new Promise((resolve) => {
          const onSeeked = () => {
            video.removeEventListener('seeked', onSeeked);
            resolve(true);
          };
          video.addEventListener('seeked', onSeeked);
        });

        // Extract frame onto canvas
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
        }

        const frameBase64 = canvas.toDataURL('image/jpeg', 0.85);
        const frameId = `UP-FRM-${Date.now()}-${Math.floor(currentSampleTime * 10)}`;

        setCurrentStage('YOLOv8 PERCEPTION & OCR');

        // Process through real pipeline
        const result = await realAIEvidencePipeline.processFrame({
          frameId,
          frameBase64,
          sourceId: 'UPLOADED_VIDEO_NODE',
          sourceType: 'UPLOADED_VIDEO'
        });

        if (result.result?.detections) {
          collectedDetections.push(...result.result.detections);
          setAnalyzedDetections([...collectedDetections]);
        }

        if (result.evidenceRecords && result.evidenceRecords.length > 0) {
          newEvidences.push(...result.evidenceRecords);
          setGeneratedEvidence([...newEvidences]);
          result.evidenceRecords.forEach((ev) => onEvidenceCreated?.(ev));
        }

        currentSampleTime += stepIntervalSec;
        const pct = Math.min(95, Math.round((currentSampleTime / duration) * 100));
        setProgressPercent(pct);
      }

      setCurrentStage('COMPLETED');
      setProgressPercent(100);

    } catch (err: any) {
      console.error('Video upload analysis error:', err);
      setErrorMessage(err?.message || 'Video analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelAnalysis = () => {
    isCanceledRef.current = true;
    setIsProcessing(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl sm:max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
      >
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div>
            <h3 id="upload-modal-title" className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload size={18} className="text-blue-600" />
              <span>Upload Video</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analyze a recorded traffic video using Sentinel AI
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isProcessing) onClose();
              else handleCancelAnalysis();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hidden video and canvas for background frame extraction */}
          <video ref={videoRef} className="hidden" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          {/* Drag & Drop Upload Zone (when no file selected) */}
          {!videoMeta ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all flex flex-col items-center justify-center gap-3 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <Upload size={24} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Upload video
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Drag & drop video here or choose a file
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Choose Video
              </button>

              <p className="text-[11px] text-slate-400 mt-2">
                Supported: MP4, WebM, MOV (Max 250 MB)
              </p>
            </div>
          ) : (
            /* Video Selected State */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileVideo size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      Video Selected
                    </div>
                    <div className="text-sm font-semibold text-slate-900 truncate" title={videoMeta.name}>
                      {videoMeta.name}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                      <span>{videoMeta.resolution}</span>
                      <span>•</span>
                      <span>{videoMeta.durationSec}s</span>
                      <span>•</span>
                      <span>{videoMeta.sizeMb} MB</span>
                    </div>
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideoMeta(null);
                      setAnalyzedDetections([]);
                      setGeneratedEvidence([]);
                      setProgressPercent(0);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors font-medium cursor-pointer self-end sm:self-center"
                  >
                    Change File
                  </button>
                )}
              </div>

              {/* Video Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video max-h-56 mx-auto">
                <video
                  src={videoMeta.previewUrl}
                  controls={!isProcessing}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Analysis Settings */}
              {!isProcessing && progressPercent === 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-slate-700">Analysis Frame Rate:</span>
                  <div className="inline-flex p-0.5 bg-white border border-slate-200 rounded-lg">
                    {[0.5, 1.0, 2.0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setSamplingFps(rate)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                          samplingFps === rate
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {rate} FPS
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                      {currentStage}
                    </span>
                    <span className="font-mono">{progressPercent}%</span>
                  </div>

                  <div className="w-full bg-blue-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-blue-700">
                    Processing frame-by-frame with YOLOv8 & HSRP Verifier...
                  </div>
                </div>
              )}

              {/* Completed Results Summary */}
              {progressPercent === 100 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Analysis Completed Successfully</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-emerald-100">
                      <div className="text-slate-500 text-[10px] uppercase font-semibold">Detections</div>
                      <div className="text-sm font-bold text-slate-900">{analyzedDetections.length}</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-100">
                      <div className="text-slate-500 text-[10px] uppercase font-semibold">Evidence Created</div>
                      <div className="text-sm font-bold text-blue-600">{generatedEvidence.length}</div>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-emerald-100">
                      <div className="text-slate-500 text-[10px] uppercase font-semibold">BSA 2023</div>
                      <div className="text-sm font-bold text-emerald-600">SEALED</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Modal Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              if (isProcessing) handleCancelAnalysis();
              else onClose();
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {isProcessing ? 'Cancel Analysis' : 'Cancel'}
          </button>

          {videoMeta && progressPercent < 100 && !isProcessing && (
            <button
              type="button"
              onClick={handleStartAnalysis}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Analyze Video</span>
            </button>
          )}

          {progressPercent === 100 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate?.('alerts');
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={14} />
              <span>View Evidence Vault</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
