import { useState, useEffect, useCallback } from 'react';
import { centralHealthMonitor } from '../services/resilience/CentralHealthMonitor';

export interface GcpServiceHealth {
  name: string;
  status: string; // 'CONNECTED' | 'HEALTHY' | 'LOCAL_ACTIVE' | 'SPOOLED' | 'BACKPRESSURE' | 'ERROR' | 'STANDBY_LOCAL';
  topic?: string;
  bucket?: string;
  runner?: string;
  dataset?: string;
  active?: boolean;
  eventsPublished?: number;
  spooledCount?: number;
  failures?: number;
  activeWindows?: number;
  eventsProcessed?: number;
  totalEvidenceCount?: number;
  integrityStatus?: string;
  details?: string;
  messageRate?: string;
  transport?: string;
  deduplicationRate?: string;
  slidingWindowSeconds?: number;
  heavyVideoRejected?: boolean;
  evidenceHierarchy?: string;
  statutoryCompliance?: string;
  partitioning?: string;
  tablesCount?: number;
}

export interface GcpHealthCheckData {
  timestamp: string;
  probeLatencyMs: number;
  gcpConnectivity: {
    enabled: boolean;
    cloudMode: 'LOCAL_ONLY' | 'EVENT_ONLY' | 'HYBRID';
    overallStatus: 'CONNECTED' | 'DEGRADED' | 'STANDBY_LOCAL' | 'OFFLINE';
    projectId: string;
    region: string;
    billingProtected: boolean;
    geminiReasoningEnabled: boolean;
  };
  services: {
    pubsub: GcpServiceHealth;
    dataflow: GcpServiceHealth;
    cloudStorage: GcpServiceHealth;
    bigquery?: GcpServiceHealth;
  };
  metrics?: {
    cloudEventsPublished: number;
    cloudBytesUploaded: number;
    evidenceBytesUploaded: number;
    pubsubFailures: number;
    cloudStorageUploads: number;
    dataflowProcessingErrors: number;
    spooledEventsCount: number;
    geminiInvocations: number;
  };
}

export interface UseGcpHealthMonitoringReturn {
  healthData: GcpHealthCheckData | null;
  loading: boolean;
  probing: boolean;
  toggling: boolean;
  autoProbe: boolean;
  setAutoProbe: (enabled: boolean) => void;
  lastProbeAt: Date;
  notice: string | null;
  clearNotice: () => void;
  probeNow: () => Promise<void>;
  toggleGcpMode: () => Promise<void>;
  // Derived badge statuses
  badges: {
    pubsub: {
      statusText: string;
      colorClass: string;
      isLive: boolean;
    };
    dataflow: {
      statusText: string;
      colorClass: string;
      isLive: boolean;
    };
    cloudStorage: {
      statusText: string;
      colorClass: string;
      isLive: boolean;
    };
    overall: {
      statusText: string;
      colorClass: string;
      isLive: boolean;
    };
  };
}

export function useGcpHealthMonitoring(pollIntervalMs: number = 30000): UseGcpHealthMonitoringReturn {
  const [healthData, setHealthData] = useState<GcpHealthCheckData | null>(() => centralHealthMonitor.getHealthData());
  const [loading, setLoading] = useState<boolean>(() => !centralHealthMonitor.getHealthData());
  const [probing, setProbing] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);
  const [autoProbe, setAutoProbe] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastProbeAt, setLastProbeAt] = useState<Date>(() => centralHealthMonitor.getLastProbeAt() || new Date());

  const probeNow = useCallback(async () => {
    setProbing(true);
    try {
      const data = await centralHealthMonitor.probeNow(true);
      if (data) {
        setHealthData(data);
        setLastProbeAt(new Date());
      }
    } finally {
      setLoading(false);
      setProbing(false);
    }
  }, []);

  const toggleGcpMode = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    const targetState = !healthData?.gcpConnectivity?.enabled;
    try {
      const res = await fetch('/api/cloud-scale/gcp-health-check/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setNotice(data.notice);
      }
      await probeNow();
    } catch (err: any) {
      setNotice(`Failed to toggle GCP connectivity: ${err?.message || 'Network error'}`);
    } finally {
      setToggling(false);
    }
  }, [toggling, healthData, probeNow]);

  // Subscribe to singleton updates
  useEffect(() => {
    const unsubscribe = centralHealthMonitor.subscribe((data) => {
      if (data) {
        setHealthData(data);
        setLastProbeAt(new Date());
        setLoading(false);
      }
    });

    if (autoProbe) {
      centralHealthMonitor.startAutoProbe(pollIntervalMs);
    } else {
      centralHealthMonitor.stopAutoProbe();
    }

    return () => {
      unsubscribe();
    };
  }, [autoProbe, pollIntervalMs]);

  // Derive status badge styles and labels
  const pubsubStatus = healthData?.services.pubsub.status || 'CONNECTED';
  const pubsubBadge = {
    statusText: pubsubStatus,
    colorClass:
      pubsubStatus === 'CONNECTED'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : pubsubStatus === 'LOCAL_ACTIVE'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : 'bg-slate-800 text-slate-300 border-slate-700',
    isLive: pubsubStatus === 'CONNECTED'
  };

  const dfStatus = healthData?.services.dataflow.status || 'HEALTHY';
  const dataflowBadge = {
    statusText: dfStatus,
    colorClass:
      dfStatus === 'HEALTHY'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    isLive: dfStatus === 'HEALTHY'
  };

  const gcsIntegrity = healthData?.services.cloudStorage.integrityStatus || healthData?.services.cloudStorage.status || 'VERIFIED';
  const cloudStorageBadge = {
    statusText: gcsIntegrity,
    colorClass:
      gcsIntegrity === 'VERIFIED' || gcsIntegrity === 'HEALTHY'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    isLive: gcsIntegrity === 'VERIFIED' || gcsIntegrity === 'HEALTHY'
  };

  const overallStatus = healthData?.gcpConnectivity.overallStatus || 'CONNECTED';
  const overallBadge = {
    statusText: overallStatus,
    colorClass:
      overallStatus === 'CONNECTED'
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : overallStatus === 'STANDBY_LOCAL'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    isLive: overallStatus === 'CONNECTED'
  };

  return {
    healthData,
    loading,
    probing,
    toggling,
    autoProbe,
    setAutoProbe,
    lastProbeAt,
    notice,
    clearNotice: () => setNotice(null),
    probeNow,
    toggleGcpMode,
    badges: {
      pubsub: pubsubBadge,
      dataflow: dataflowBadge,
      cloudStorage: cloudStorageBadge,
      overall: overallBadge
    }
  };
}
