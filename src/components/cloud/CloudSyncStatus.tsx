/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Cloud Sync Status Component
 * 
 * Displays real-time synchronization progress between the local offline database
 * and Google Cloud Firestore (`ai-studio-gujrat-217890ee-4c63-4e61-90de-a0dc591996f6`),
 * featuring a circular progress indicator, granular per-item batch progress bar,
 * pending tasks queue, and last successful sync timestamp.
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  CloudAlert, 
  RefreshCw, 
  Database, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HardDrive, 
  ShieldCheck, 
  FileText, 
  Wifi,
  Layers,
  Sparkles,
  PlusCircle,
  Activity
} from 'lucide-react';
import { 
  cloudSyncService, 
  CloudSyncSnapshot, 
  PendingSyncTask 
} from '../../services/cloud/CloudSyncService';

interface CloudSyncStatusProps {
  className?: string;
}

export const CloudSyncStatus: React.FC<CloudSyncStatusProps> = ({ className = '' }) => {
  const [snapshot, setSnapshot] = useState<CloudSyncSnapshot>(cloudSyncService.getSnapshot());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncingManually, setIsSyncingManually] = useState(false);
  const [relativeTimeStr, setRelativeTimeStr] = useState<string>('');

  useEffect(() => {
    const unsubscribe = cloudSyncService.subscribe((newSnap) => {
      setSnapshot(newSnap);
    });
    return () => unsubscribe();
  }, []);

  // Update relative time ("Just now", "45s ago") every 5 seconds
  useEffect(() => {
    const updateRelative = () => {
      if (!snapshot.lastSuccessfulSync) {
        setRelativeTimeStr('Never');
        return;
      }
      const diffSec = Math.floor((Date.now() - new Date(snapshot.lastSuccessfulSync).getTime()) / 1000);
      if (diffSec < 10) {
        setRelativeTimeStr('Just now');
      } else if (diffSec < 60) {
        setRelativeTimeStr(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        setRelativeTimeStr(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setRelativeTimeStr(`${Math.floor(diffSec / 3600)}h ago`);
      }
    };

    updateRelative();
    const timer = setInterval(updateRelative, 5000);
    return () => clearInterval(timer);
  }, [snapshot.lastSuccessfulSync]);

  const handleManualSync = async () => {
    setIsSyncingManually(true);
    await cloudSyncService.triggerSync();
    setTimeout(() => {
      setIsSyncingManually(false);
    }, 400);
  };

  const handleSeedBatch = () => {
    cloudSyncService.seedSampleBatchTasks();
  };

  const isSyncing = snapshot.syncState === 'SYNCING' || isSyncingManually;
  const isPending = snapshot.pendingTasksCount > 0;
  const isOffline = !snapshot.isOnline || snapshot.syncState === 'OFFLINE_QUEUED';

  // Format exact timestamp for display
  const exactLastSyncFormatted = snapshot.lastSuccessfulSync 
    ? new Date(snapshot.lastSuccessfulSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Pending';

  // Circular progress calculations for header pill (diameter 22px, radius 8px)
  const pillRadius = 8;
  const pillCircumference = 2 * Math.PI * pillRadius;
  const pillOffset = pillCircumference - (snapshot.syncProgress / 100) * pillCircumference;

  // Circular progress calculations for modal hero dial (diameter 76px, radius 32px)
  const dialRadius = 32;
  const dialCircumference = 2 * Math.PI * dialRadius;
  const dialOffset = dialCircumference - (snapshot.syncProgress / 100) * dialCircumference;

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Compact Header Pill Trigger with Circular Progress Indicator */}
        <button
          id="cloud-sync-status-trigger"
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`group relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
            isSyncing
              ? 'bg-blue-50/95 border-blue-300 text-blue-800'
              : isOffline
              ? 'bg-amber-50/95 border-amber-300 text-amber-800'
              : isPending
              ? 'bg-indigo-50/95 border-indigo-200 text-indigo-800'
              : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
          }`}
          title={`Firebase Cloud Sync: ${snapshot.syncState} (${snapshot.syncProgress}%) • Last: ${relativeTimeStr} • Click for details`}
        >
          {/* Dynamic Circular Progress Indicator in Pill */}
          <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
            <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 22 22">
              {/* Background Track */}
              <circle
                cx="11"
                cy="11"
                r={pillRadius}
                className="text-slate-200"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Dynamic Progress Fill */}
              <circle
                cx="11"
                cy="11"
                r={pillRadius}
                className={`transition-all duration-300 ease-out ${
                  isSyncing 
                    ? 'text-blue-600' 
                    : isOffline 
                    ? 'text-amber-500' 
                    : isPending 
                    ? 'text-indigo-600' 
                    : 'text-emerald-500'
                }`}
                strokeWidth="2.5"
                strokeDasharray={pillCircumference}
                strokeDashoffset={pillOffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Centered Micro-Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isSyncing ? (
                <RefreshCw size={9} className="text-blue-700 animate-spin" />
              ) : isOffline ? (
                <CloudAlert size={10} className="text-amber-700" />
              ) : isPending ? (
                <Cloud size={10} className="text-indigo-700" />
              ) : (
                <CheckCircle2 size={10} className="text-emerald-700" />
              )}
            </div>
          </div>

          {/* Text Label */}
          <div className="flex items-center gap-1.5 text-xs font-semibold leading-none">
            <span className="hidden sm:inline text-slate-500 font-medium">Cloud:</span>
            {isSyncing ? (
              <span className="text-blue-700 font-bold flex items-center gap-1">
                Syncing {snapshot.syncProgress}%
              </span>
            ) : isOffline ? (
              <span className="text-amber-700 font-bold">Offline Queue</span>
            ) : isPending ? (
              <span className="text-indigo-700 font-bold">{snapshot.pendingTasksCount} Pending</span>
            ) : (
              <span className="text-emerald-700 font-bold">Synced</span>
            )}
          </div>
        </button>

        {/* Dedicated 'Sync Now' Action Button with Loading State */}
        <button
          id="cloud-sync-now-button"
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-2xs select-none ${
            isSyncing
              ? 'bg-blue-600 text-white border-blue-600 cursor-wait shadow-sm shadow-blue-500/30'
              : 'bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 border-slate-200 hover:border-blue-300 active:scale-95'
          }`}
          title="Manually trigger synchronization with Firebase Cloud Firestore"
          aria-label="Sync Now with Firebase Cloud Firestore"
        >
          <RefreshCw 
            size={12} 
            className={`shrink-0 ${isSyncing ? 'animate-spin text-white' : 'text-blue-600'}`} 
          />
          <span className="font-semibold leading-none">
            {isSyncing ? (
              <span className="flex items-center gap-1">
                Syncing<span className="hidden md:inline font-mono"> {snapshot.syncProgress}%</span>...
              </span>
            ) : (
              'Sync Now'
            )}
          </span>
        </button>
      </div>

      {/* Detailed Cloud Synchronization Modal */}
      {isModalOpen && (
        <div 
          id="cloud-sync-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-sync-modal-title"
        >
          <div 
            id="cloud-sync-modal-dialog"
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Database size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 id="cloud-sync-modal-title" className="text-base font-bold text-slate-900">
                      Cloud Synchronization & Offline Pipeline
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 uppercase font-mono">
                      FIREBASE FIRESTORE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gujarat Police Sentinel Grid • High-Availability Multi-Tier State Machine
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                title="Close Sync Status"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs text-slate-700 leading-relaxed">
              
              {/* Hero Status Card: Circular Progress Indicator & Granular Batch Upload Bar */}
              <div className={`p-5 rounded-2xl border transition-colors ${
                isSyncing 
                  ? 'bg-blue-50/70 border-blue-200 shadow-xs' 
                  : isPending
                  ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                  : 'bg-emerald-50/70 border-emerald-200 shadow-xs'
              }`}>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Circular Progress Gauge */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 76 76">
                      {/* Background Dial Track */}
                      <circle
                        cx="38"
                        cy="38"
                        r={dialRadius}
                        className="text-slate-200"
                        strokeWidth="5"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      {/* Animated Active Progress Arc */}
                      <circle
                        cx="38"
                        cy="38"
                        r={dialRadius}
                        className={`transition-all duration-300 ease-out ${
                          isSyncing 
                            ? 'text-blue-600' 
                            : isPending 
                            ? 'text-indigo-600' 
                            : 'text-emerald-500'
                        }`}
                        strokeWidth="5"
                        strokeDasharray={dialCircumference}
                        strokeDashoffset={dialOffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>

                    {/* Centered Percentage & Status Badge */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-base font-extrabold text-slate-900 leading-none">
                        {snapshot.syncProgress}%
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                        {isSyncing ? 'Syncing' : isPending ? 'Pending' : 'Synced'}
                      </span>
                    </div>
                  </div>

                  {/* Right Header Text & Batch Status */}
                  <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {isSyncing ? 'Batch Cloud Upload in Progress' :
                         isPending ? `${snapshot.pendingTasksCount} Local Items Queued for Cloud Commit` :
                         'All Local Records Synchronized with Firebase'}
                      </h4>

                      {isSyncing && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 animate-pulse">
                          <Activity size={10} /> Active Stream
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {isSyncing && snapshot.currentSyncingItemTitle 
                        ? `Current commit: ${snapshot.currentSyncingItemTitle}`
                        : `Target database: ${snapshot.cloudDatabaseId} • BSA Section 63 Validated`}
                    </p>

                    {/* Granular Batch Completion Counts */}
                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                      <span>Batch: <strong className="text-slate-800">{snapshot.activeBatchCompleted}</strong> of <strong className="text-slate-800">{snapshot.activeBatchTotal || snapshot.pendingTasksCount}</strong> items</span>
                      <span>•</span>
                      <span>Mode: <strong className="text-slate-800">{snapshot.transportMode}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Granular Multi-Segmented Batch Progress Bar */}
                <div className="mt-4 pt-3.5 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Granular Item Upload Progress:</span>
                      {isSyncing && (
                        <span className="font-mono text-blue-700 font-bold">
                          Item {snapshot.activeBatchCompleted + 1}/{snapshot.activeBatchTotal}
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-slate-600">
                      {snapshot.syncProgress}%
                    </span>
                  </div>

                  {/* Segmented / Granular Progress Track */}
                  {snapshot.pendingTasks.length > 0 ? (
                    <div className="flex items-center gap-1 w-full h-3">
                      {snapshot.pendingTasks.map((task, idx) => {
                        const isTaskDone = task.status === 'COMPLETED';
                        const isTaskActive = task.status === 'SYNCING';
                        return (
                          <div 
                            key={task.id} 
                            className="flex-1 h-full bg-slate-200 rounded-sm overflow-hidden relative"
                            title={`Item ${idx + 1}: ${task.itemTitle} (${task.status} - ${task.progressPercent}%)`}
                          >
                            <div 
                              className={`h-full transition-all duration-200 ${
                                isTaskDone 
                                  ? 'bg-emerald-500' 
                                  : isTaskActive 
                                  ? 'bg-blue-600 animate-pulse' 
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Default full bar when completely synced */
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-full" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" /> Completed
                      <span className="w-2 h-2 rounded-xs bg-blue-600 inline-block ml-2" /> Uploading
                      <span className="w-2 h-2 rounded-xs bg-slate-300 inline-block ml-2" /> Queued
                    </span>
                    <span>Continuous Local Persistence</span>
                  </div>
                </div>
              </div>

              {/* 4 Key Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Last Sync */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    <Clock size={12} className="text-slate-400" />
                    <span>Last Sync</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {relativeTimeStr}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {exactLastSyncFormatted}
                  </div>
                </div>

                {/* 2. Pending Tasks */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    <Layers size={12} className="text-indigo-500" />
                    <span>Pending Queue</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {snapshot.pendingTasksCount} Tasks
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {snapshot.pendingTasksCount === 0 ? 'All caught up' : 'Queued for commit'}
                  </div>
                </div>

                {/* 3. Local Cache */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    <HardDrive size={12} className="text-blue-500" />
                    <span>Local Cache</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {snapshot.localCachedItemsCount} Items
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    IndexedDB & Memory
                  </div>
                </div>

                {/* 4. Synced Today */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1 mb-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>Synced Today</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {snapshot.syncedTodayCount} Records
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                    100% Hash Validated
                  </div>
                </div>
              </div>

              {/* Pending Queue Task Breakdown with Granular Progress per Item */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <FileText size={14} className="text-blue-600" />
                    <span>Active Batch Items & Queue ({snapshot.pendingTasks.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={handleSeedBatch}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                    title="Add test batch items to observe granular progress bar"
                  >
                    <PlusCircle size={12} />
                    <span>Queue Sample Batch</span>
                  </button>
                </div>

                {snapshot.pendingTasks.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No Pending Tasks in Queue</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All local offline incident reports, officer decisions, and surveillance evidence are synchronized with Firestore.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto custom-scrollbar">
                    {snapshot.pendingTasks.map((task, idx) => (
                      <div key={task.id} className="p-3 bg-white hover:bg-slate-50 flex flex-col gap-2 transition">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase shrink-0 mt-0.5 ${
                              task.collection === 'incidents' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              task.collection === 'evidence' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              task.collection === 'challans' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              /{task.collection}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-900 truncate">
                                {task.itemTitle}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                Op: <span className="font-semibold text-slate-600">{task.operation}</span> • {task.payloadSizeKb} KB • Queued: {new Date(task.queuedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                              task.status === 'SYNCING' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                              task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {task.status === 'SYNCING' ? `${task.progressPercent}%` : task.status}
                            </span>
                          </div>
                        </div>

                        {/* Granular Item Progress Bar */}
                        <div className="flex items-center gap-2 w-full pt-0.5">
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-200 rounded-full ${
                                task.status === 'COMPLETED' ? 'bg-emerald-500' :
                                task.status === 'SYNCING' ? 'bg-blue-600' :
                                'bg-slate-300'
                              }`}
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 w-10 text-right">
                            {task.uploadedKb || 0}/{task.payloadSizeKb}k
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Cloud Highway Topology */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Cloud Highway Configuration</span>
                  <span className="text-emerald-700 font-mono text-[10px] font-bold">LONG-POLLING ACTIVE</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-mono text-[10px]">
                  <div>Firebase Project: <strong className="text-slate-800">{snapshot.cloudProjectId}</strong></div>
                  <div>Firestore Engine: <strong className="text-slate-800">{snapshot.cloudDatabaseId}</strong></div>
                  <div>Transport: <strong className="text-slate-800">Direct HTTP Long-Polling</strong></div>
                  <div>Evidentiary Law: <strong className="text-slate-800">BSA 2023 Sec 63 Immutability</strong></div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500 font-mono">
                Last Batch Duration: {snapshot.lastSyncDurationMs}ms
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  id="modal-sync-now-button"
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-wait"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? `Syncing (${snapshot.syncProgress}%)...` : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CloudSyncStatus;
