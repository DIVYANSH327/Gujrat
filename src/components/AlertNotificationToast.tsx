import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  X, 
  ExternalLink, 
  Clock, 
  MapPin, 
  Camera, 
  Sparkles,
  Car,
  BellRing
} from 'lucide-react';
import { centralEventBus, GridEvent } from '../services/CentralEventBus';
import { audioAlertService } from '../services/AudioAlertService';
import { AlertImageProvenanceBadge } from './ui/AlertImageProvenanceBadge';

export interface AlertNotificationItem {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  category?: 'WATCHLIST' | 'TRAFFIC' | 'INCIDENT' | 'BEHAVIOR' | 'SYSTEM';
  cameraId?: string;
  location?: string;
  vehiclePlate?: string;
  timestamp: string;
  evidenceUrl?: string;
  confidence?: number;
  incidentId?: string;
  sourceType?: string;
  provenance?: 'CAMERA_FRAME' | 'EVIDENCE_FRAME' | 'UNVERIFIED' | 'DEMO_ASSET' | 'TEST_FIXTURE' | 'UNKNOWN';
  truthStatus?: 'OBSERVED' | 'UNVERIFIED' | 'DEMO' | 'TEST' | 'SUPPRESSED';
}

interface AlertNotificationToastProps {
  onNavigate?: (view: string) => void;
  onSelectIncident?: (incidentId: string) => void;
  onSelectCamera?: (cameraId: string) => void;
  maxToasts?: number;
}

export function AlertNotificationToast({
  onNavigate,
  onSelectIncident,
  onSelectCamera,
  maxToasts = 4
}: AlertNotificationToastProps) {
  const [notifications, setNotifications] = useState<AlertNotificationItem[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeNotification = useCallback((id: string) => {
    // Clear timer
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((item: AlertNotificationItem) => {
    setNotifications(prev => {
      // Prevent exact duplicate ID
      if (prev.some(n => n.id === item.id)) return prev;
      const updated = [item, ...prev].slice(0, maxToasts);
      return updated;
    });

    // Play operational audio tone if appropriate
    if (item.severity === 'CRITICAL') {
      audioAlertService.playTone('CRITICAL');
    } else if (item.severity === 'HIGH') {
      audioAlertService.playTone('HIGH');
    }

    // Schedule auto-dismiss (8 seconds)
    const timer = setTimeout(() => {
      removeNotification(item.id);
    }, 8000);
    timersRef.current.set(item.id, timer);
  }, [maxToasts, removeNotification]);

  // Subscribe to CentralEventBus for real-time incident & violation events
  useEffect(() => {
    const subId = centralEventBus.subscribe('*', (event: GridEvent) => {
      if (
        event.eventType === 'INCIDENT_CREATED' ||
        event.eventType === 'WATCHLIST_MATCH' ||
        event.eventType === 'VIOLATION_CASE_CREATED' ||
        event.eventType === 'VIOLATION_CANDIDATE_DETECTED' ||
        event.eventType === 'FACE_WATCHLIST_CANDIDATE'
      ) {
        const payload = event.payload || {};
        const severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO' = 
          event.eventType === 'WATCHLIST_MATCH' || event.priority === 'P0' 
            ? 'CRITICAL' 
            : event.priority === 'P1' 
              ? 'HIGH' 
              : 'MEDIUM';

        const toastItem: AlertNotificationItem = {
          id: event.eventId || `ALT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: payload.title || (
            event.eventType === 'WATCHLIST_MATCH' ? 'High Priority Watchlist Match' :
            event.eventType === 'VIOLATION_CASE_CREATED' ? 'Traffic Violation Flagged' :
            event.eventType === 'FACE_WATCHLIST_CANDIDATE' ? 'Facial Watchlist Sighting' :
            'Operational Incident Detected'
          ),
          message: payload.description || payload.justification || payload.notes || 'Automated AI sentinel correlation matched high-priority surveillance rule.',
          severity,
          category: event.eventType === 'WATCHLIST_MATCH' ? 'WATCHLIST' : 'TRAFFIC',
          cameraId: payload.cameraId || (payload.cameraIds && payload.cameraIds[0]) || 'CAM-001',
          location: payload.location || 'Gujarat Highway Surveillance Grid',
          vehiclePlate: payload.vehiclePlate || (payload.vehiclePlates && payload.vehiclePlates[0]) || undefined,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour12: true, timeZone: 'Asia/Kolkata' }),
          evidenceUrl: payload.snapshotUrl || payload.evidenceUrl || undefined,
          confidence: payload.confidence ? Math.round(payload.confidence * 100) : 92,
          incidentId: payload.incidentId || event.correlationId || undefined
        };

        addNotification(toastItem);
      }
    });

    return () => {
      centralEventBus.unsubscribe(subId);
      // Clear all active timers on unmount
      for (const [, timer] of timersRef.current.entries()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, [addNotification]);

  // Expose global window helper for testing/triggering alert notifications cleanly
  useEffect(() => {
    (window as any).__triggerAlertNotification = (customAlert?: Partial<AlertNotificationItem>) => {
      const sampleItem: AlertNotificationItem = {
        id: `ALT-DEMO-${Date.now()}`,
        title: customAlert?.title || 'Priority Traffic Incident Detected',
        message: customAlert?.message || 'ANPR vehicle camera flagged dangerous high-speed lane violation.',
        severity: customAlert?.severity || 'CRITICAL',
        category: customAlert?.category || 'TRAFFIC',
        cameraId: customAlert?.cameraId || 'CAM-012',
        location: customAlert?.location || 'SG Highway • Iskcon Flyover',
        vehiclePlate: customAlert?.vehiclePlate || 'GJ01AB1234',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: true, timeZone: 'Asia/Kolkata' }),
        confidence: customAlert?.confidence || 94,
        incidentId: customAlert?.incidentId || 'INC-2026-0841',
        ...customAlert
      };
      addNotification(sampleItem);
    };

    return () => {
      delete (window as any).__triggerAlertNotification;
    };
  }, [addNotification]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <aside 
      aria-label="Real-time incident notifications"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-[360px] sm:max-w-[420px] w-full pointer-events-none"
      id="incident-notification-container"
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((item) => {
          const isCritical = item.severity === 'CRITICAL';
          const isHigh = item.severity === 'HIGH';

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: 90, y: 15, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 90, scale: 0.9, transition: { duration: 0.22, ease: "easeInOut" } }}
              transition={{ 
                type: "spring", 
                stiffness: 420, 
                damping: 28,
                mass: 0.8
              }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`pointer-events-auto rounded-2xl shadow-xl border backdrop-blur-md overflow-hidden transition-all duration-200 ${
                isCritical 
                  ? 'bg-white/95 border-rose-300 ring-1 ring-rose-500/20' 
                  : isHigh 
                    ? 'bg-white/95 border-amber-300 ring-1 ring-amber-500/20' 
                    : 'bg-white/95 border-blue-200 ring-1 ring-blue-500/20'
              }`}
              id={`alert-toast-${item.id}`}
            >
              {/* Header Accent Bar */}
              <div className={`h-1.5 w-full ${
                isCritical ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-blue-600'
              }`} />

              <div className="p-4">
                {/* Top Badge & Close */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                      isCritical 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : isHigh 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {isCritical ? (
                        <ShieldAlert size={12} className="text-rose-700 animate-pulse" />
                      ) : (
                        <AlertTriangle size={12} className={isHigh ? "text-amber-700" : "text-blue-700"} />
                      )}
                      <span>{item.severity} Incident</span>
                    </span>

                    {/* Image / Alert Provenance Badge */}
                    <AlertImageProvenanceBadge 
                      provenance={item.provenance}
                      sourceType={item.sourceType}
                      truthStatus={item.truthStatus}
                      evidenceUrl={item.evidenceUrl}
                      size="xs"
                    />

                    {item.confidence && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        <Sparkles size={11} />
                        <span>{item.confidence}% Match</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeNotification(item.id)}
                    aria-label="Dismiss Notification"
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Title & Description */}
                <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {item.message}
                </p>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mb-3 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                  {item.vehiclePlate && (
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      <Car size={12} className="text-blue-600" />
                      <span>{item.vehiclePlate}</span>
                    </div>
                  )}

                  {item.cameraId && (
                    <div 
                      onClick={() => onSelectCamera && onSelectCamera(item.cameraId!)}
                      className="flex items-center gap-1 font-mono text-slate-700 hover:text-blue-600 cursor-pointer"
                    >
                      <Camera size={12} className="text-slate-400" />
                      <span>{item.cameraId}</span>
                    </div>
                  )}

                  {item.location && (
                    <div className="flex items-center gap-1 text-slate-500 truncate max-w-[140px]">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-slate-400 ml-auto font-mono text-[10px]">
                    <Clock size={11} />
                    <span>{item.timestamp}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (item.incidentId && onSelectIncident) {
                        onSelectIncident(item.incidentId);
                      } else if (onNavigate) {
                        onNavigate('incidents');
                      }
                      removeNotification(item.id);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCritical
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                        : isHigh
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Investigate Incident</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('alerts');
                      }
                      removeNotification(item.id);
                    }}
                    className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Alerts</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
