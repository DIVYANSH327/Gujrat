import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Users, 
  Car, 
  Activity, 
  RefreshCw, 
  Clock, 
  TrendingUp, 
  BarChart2, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle,
  Info,
  Layers,
  Database
} from 'lucide-react';
import { CircuitBreaker } from '../services/resilience/CircuitBreaker';
import { SingleFlight } from '../services/resilience/SingleFlight';
import { ExponentialBackoff } from '../services/resilience/ExponentialBackoff';
import { globalAnalyticsCache } from '../services/resilience/AnalyticsCache';
import { globalTelemetryTracker } from '../services/resilience/RequestTelemetry';
import { sentinelFetchJson } from '../services/resilience/SentinelHttpClient';

export type AnalyticsStatus = 
  | 'IDLE' 
  | 'LOADING' 
  | 'READY' 
  | 'RATE_LIMITED' 
  | 'UNAVAILABLE' 
  | 'ERROR';

export interface HourlyDetectionData {
  hourLabel: string;
  timestamp: number;
  isoTime: string;
  personCount: number;
  vehicleCount: number;
  totalCount: number;
  liveEvents?: number;
}

export interface AnalyticsSummary {
  totalPersonDetections: number;
  totalVehicleDetections: number;
  totalDetections: number;
  personPercentage: number;
  vehiclePercentage: number;
  peakHour: string;
  peakCount: number;
  peakType: 'vehicle' | 'person';
  liveEventsCount: number;
}

export interface DetectionAnalyticsResponse {
  timeRange: {
    start: string;
    end: string;
    hours: number;
  };
  summary: AnalyticsSummary;
  hourlyData: HourlyDetectionData[];
}

export interface CommandCenterAnalyticsProps {
  onNavigate?: (viewId: string) => void;
  className?: string;
  analyticsAutoRefreshEnabled?: boolean;
  analyticsRefreshIntervalMs?: number;
}

type ViewMode = 'grouped' | 'stacked' | 'vehicles' | 'persons';
type TimeWindow = '24h' | '12h' | '6h';

// Singleton resilience controllers for Analytics
const analyticsBreaker = new CircuitBreaker({
  name: 'command-center-analytics',
  failureThreshold: 2,
  cooldownMs: 25000
});
const analyticsSingleFlight = new SingleFlight();
const ANALYTICS_ENDPOINT = '/api/analytics/detections-24h';

export const CommandCenterAnalytics: React.FC<CommandCenterAnalyticsProps> = ({
  onNavigate,
  className = '',
  analyticsAutoRefreshEnabled = false, // Safeguard default: false for Hackathon
  analyticsRefreshIntervalMs = 60000   // Conservative 60s default
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Cached fallback initial state
  const cachedInitial = useMemo(() => globalAnalyticsCache.get(), []);

  const [data, setData] = useState<DetectionAnalyticsResponse | null>(() => cachedInitial.data);
  const [status, setStatus] = useState<AnalyticsStatus>(() => cachedInitial.data ? 'READY' : 'IDLE');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => cachedInitial.cachedAt);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(analyticsAutoRefreshEnabled);
  const [isCachedData, setIsCachedData] = useState<boolean>(Boolean(cachedInitial.data));
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24h');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 320 });
  const [showTelemetryDetails, setShowTelemetryDetails] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    data: HourlyDetectionData;
    x: number;
    y: number;
  } | null>(null);

  // Fetch live analytics with SingleFlight + CircuitBreaker + Backoff + Telemetry
  const fetchAnalytics = useCallback(async (isManual = false) => {
    // 1. Circuit Breaker Check
    if (!analyticsBreaker.canExecute()) {
      setStatus('RATE_LIMITED');
      setStatusMessage('Analytics circuit breaker OPEN (Rate limit backoff active). Using cached baseline.');
      setIsCachedData(true);
      return;
    }

    if (isManual) setIsRefreshing(true);
    setStatus((prev) => (prev === 'IDLE' ? 'LOADING' : prev));

    try {
      // 2. SingleFlight Coalescing: Only one request in flight
      await analyticsSingleFlight.do('fetch-detections-24h', async () => {
        globalTelemetryTracker.recordStart(ANALYTICS_ENDPOINT);

        // 3. Execution with exponential backoff on 429
        const result = await ExponentialBackoff.executeWithBackoff(
          async () => {
            const res = await fetch(ANALYTICS_ENDPOINT, {
              headers: { 'Accept': 'application/json' }
            });

            if (res.status === 429) {
              const err: any = new Error('Rate limit exceeded');
              err.status = 429;
              err.is429 = true;
              throw err;
            }

            if (res.status === 403) {
              const err: any = new Error('Permission denied or cloud service unavailable');
              err.status = 403;
              throw err;
            }

            if (!res.ok) {
              const err: any = new Error(`Server returned HTTP ${res.status}`);
              err.status = res.status;
              throw err;
            }

            return await res.json() as DetectionAnalyticsResponse;
          },
          (err) => err?.status === 429,
          3 // Max 3 retries
        );

        // Success path
        analyticsBreaker.recordSuccess();
        globalTelemetryTracker.recordSuccess(ANALYTICS_ENDPOINT);
        globalAnalyticsCache.set(result);

        setData(result);
        setStatus('READY');
        setStatusMessage(null);
        setIsCachedData(false);
        setLastRefreshedAt(new Date());
      });
    } catch (err: any) {
      const httpStatus = err?.status;
      globalTelemetryTracker.recordError(ANALYTICS_ENDPOINT, httpStatus, err?.message);

      if (httpStatus === 429) {
        analyticsBreaker.recordFailure(true);
        setStatus('RATE_LIMITED');
        setStatusMessage('Analytics temporarily rate limited. Displaying last verified CCTV baseline.');
      } else if (httpStatus === 403) {
        analyticsBreaker.recordFailure(false);
        setStatus('UNAVAILABLE');
        setStatusMessage('Cloud service unavailable or permission required.');
      } else {
        analyticsBreaker.recordFailure(false);
        setStatus('ERROR');
        setStatusMessage(err?.message || 'Service temporarily unavailable.');
      }

      // Preserve existing cached data! Never erase valid data
      const cached = globalAnalyticsCache.get();
      if (cached.data) {
        setData(cached.data);
        setIsCachedData(true);
        if (cached.cachedAt) setLastRefreshedAt(cached.cachedAt);
      }
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchAnalytics(false);
  }, [fetchAnalytics]);

  // Guaranteed single timer per mounted component with cleanup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics(false);
    }, Math.max(20000, analyticsRefreshIntervalMs));

    return () => clearInterval(interval);
  }, [autoRefresh, analyticsRefreshIntervalMs, fetchAnalytics]);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({
          width,
          height: width < 640 ? 280 : 340
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter hourly dataset by active time window
  const activeHourlyData = useMemo(() => {
    if (!data?.hourlyData) return [];
    const count = timeWindow === '6h' ? 6 : timeWindow === '12h' ? 12 : 24;
    return data.hourlyData.slice(-count);
  }, [data, timeWindow]);

  // Computed summary for the active window
  const activeSummary = useMemo(() => {
    if (!activeHourlyData.length) {
      return data?.summary || {
        totalPersonDetections: 0,
        totalVehicleDetections: 0,
        totalDetections: 0,
        personPercentage: 0,
        vehiclePercentage: 0,
        peakHour: '10 AM',
        peakCount: 0,
        peakType: 'vehicle' as const,
        liveEventsCount: 0
      };
    }

    const persons = activeHourlyData.reduce((acc, h) => acc + h.personCount, 0);
    const vehicles = activeHourlyData.reduce((acc, h) => acc + h.vehicleCount, 0);
    const total = persons + vehicles;

    let peakH = activeHourlyData[0].hourLabel;
    let peakC = 0;
    let peakT: 'vehicle' | 'person' = 'vehicle';

    for (const h of activeHourlyData) {
      if (h.totalCount > peakC) {
        peakC = h.totalCount;
        peakH = h.hourLabel;
        peakT = h.vehicleCount >= h.personCount ? 'vehicle' : 'person';
      }
    }

    return {
      totalPersonDetections: persons,
      totalVehicleDetections: vehicles,
      totalDetections: total,
      personPercentage: total > 0 ? Math.round((persons / total) * 100) : 0,
      vehiclePercentage: total > 0 ? Math.round((vehicles / total) * 100) : 0,
      peakHour: peakH,
      peakCount: peakC,
      peakType: peakT,
      liveEventsCount: data?.summary?.liveEventsCount || 0
    };
  }, [activeHourlyData, data]);

  // Render D3 Bar Chart
  useEffect(() => {
    if (!svgRef.current || !activeHourlyData.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clean redraw

    const { width, height } = dimensions;
    const isMobile = width < 640;
    const margin = {
      top: 24,
      right: isMobile ? 12 : 24,
      bottom: isMobile ? 44 : 48,
      left: isMobile ? 38 : 48
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Hourly Bins)
    const x0 = d3
      .scaleBand()
      .domain(activeHourlyData.map((d) => d.hourLabel))
      .range([0, innerWidth])
      .paddingInner(isMobile ? 0.18 : 0.24)
      .paddingOuter(0.08);

    // Grouped X1 Scale for dual bars
    const categories: ('vehicle' | 'person')[] =
      viewMode === 'vehicles'
        ? ['vehicle']
        : viewMode === 'persons'
        ? ['person']
        : ['vehicle', 'person'];

    const x1 = d3
      .scaleBand()
      .domain(categories)
      .range([0, x0.bandwidth()])
      .padding(0.08);

    // Y Scale
    let maxY = 10;
    if (viewMode === 'stacked') {
      maxY = (d3.max(activeHourlyData, (d) => d.totalCount) || 10) * 1.12;
    } else if (viewMode === 'vehicles') {
      maxY = (d3.max(activeHourlyData, (d) => d.vehicleCount) || 10) * 1.12;
    } else if (viewMode === 'persons') {
      maxY = (d3.max(activeHourlyData, (d) => d.personCount) || 10) * 1.12;
    } else {
      maxY = (d3.max(activeHourlyData, (d) => Math.max(d.vehicleCount, d.personCount)) || 10) * 1.15;
    }

    const y = d3.scaleLinear().domain([0, maxY]).range([innerHeight, 0]).nice();

    // Color definitions
    const colorMap = {
      vehicle: '#2563eb', // Blue 600
      person: '#059669'   // Emerald 600
    };

    // Horizontal Grid Lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .call((grid) => grid.select('.domain').remove())
      .call((grid) =>
        grid
          .selectAll('.tick line')
          .attr('stroke', '#e2e8f0')
          .attr('stroke-dasharray', '3 3')
          .attr('stroke-width', 1)
      );

    // Draw Bars based on ViewMode
    if (viewMode === 'stacked') {
      const hourGroups = g
        .selectAll('.hour-group')
        .data(activeHourlyData)
        .enter()
        .append('g')
        .attr('class', 'hour-group')
        .attr('transform', (d) => `translate(${x0(d.hourLabel) || 0},0)`);

      // Vehicle segment (bottom)
      hourGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => y(d.vehicleCount))
        .attr('width', x0.bandwidth())
        .attr('height', (d) => innerHeight - y(d.vehicleCount))
        .attr('fill', colorMap.vehicle)
        .attr('rx', 3)
        .attr('cursor', 'pointer');

      // Person segment (top)
      hourGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', (d) => y(d.totalCount))
        .attr('width', x0.bandwidth())
        .attr('height', (d) => Math.max(0, y(d.vehicleCount) - y(d.totalCount)))
        .attr('fill', colorMap.person)
        .attr('rx', 3)
        .attr('cursor', 'pointer');

      // Interactive overlay
      hourGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', x0.bandwidth())
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
          setHoveredPoint({ data: d, x: mouseX, y: mouseY });
        })
        .on('mousemove', (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
          setHoveredPoint({ data: d, x: mouseX, y: mouseY });
        })
        .on('mouseleave', () => setHoveredPoint(null));
    } else {
      const hourGroups = g
        .selectAll('.hour-group')
        .data(activeHourlyData)
        .enter()
        .append('g')
        .attr('class', 'hour-group')
        .attr('transform', (d) => `translate(${x0(d.hourLabel) || 0},0)`);

      // Vehicle Bar
      if (viewMode === 'grouped' || viewMode === 'vehicles') {
        hourGroups
          .append('rect')
          .attr('x', () => (viewMode === 'grouped' ? x1('vehicle') || 0 : 0))
          .attr('y', (d) => y(d.vehicleCount))
          .attr('width', () => (viewMode === 'grouped' ? x1.bandwidth() : x0.bandwidth()))
          .attr('height', (d) => innerHeight - y(d.vehicleCount))
          .attr('fill', colorMap.vehicle)
          .attr('rx', 3)
          .attr('cursor', 'pointer');
      }

      // Person Bar
      if (viewMode === 'grouped' || viewMode === 'persons') {
        hourGroups
          .append('rect')
          .attr('x', () => (viewMode === 'grouped' ? x1('person') || 0 : 0))
          .attr('y', (d) => y(d.personCount))
          .attr('width', () => (viewMode === 'grouped' ? x1.bandwidth() : x0.bandwidth()))
          .attr('height', (d) => innerHeight - y(d.personCount))
          .attr('fill', colorMap.person)
          .attr('rx', 3)
          .attr('cursor', 'pointer');
      }

      // Interactive overlay
      hourGroups
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', x0.bandwidth())
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
          setHoveredPoint({ data: d, x: mouseX, y: mouseY });
        })
        .on('mousemove', (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
          setHoveredPoint({ data: d, x: mouseX, y: mouseY });
        })
        .on('mouseleave', () => setHoveredPoint(null));
    }

    // X Axis
    const xAxis = d3.axisBottom(x0).tickFormat((d) => {
      if (isMobile && activeHourlyData.length > 12) {
        const idx = activeHourlyData.findIndex((item) => item.hourLabel === d);
        return idx % 3 === 0 ? d : '';
      }
      if (activeHourlyData.length > 16) {
        const idx = activeHourlyData.findIndex((item) => item.hourLabel === d);
        return idx % 2 === 0 ? d : '';
      }
      return d;
    });

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.select('.domain').attr('stroke', '#cbd5e1'))
      .call((axis) => axis.selectAll('.tick line').attr('stroke', '#cbd5e1'))
      .call((axis) =>
        axis
          .selectAll('.tick text')
          .attr('font-size', isMobile ? '10px' : '11px')
          .attr('font-weight', '600')
          .attr('fill', '#475569')
          .attr('dy', '10px')
      );

    // Y Axis
    const yAxis = d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}`);

    g.append('g')
      .call(yAxis)
      .call((axis) => axis.select('.domain').remove())
      .call((axis) => axis.selectAll('.tick line').remove())
      .call((axis) =>
        axis
          .selectAll('.tick text')
          .attr('font-size', isMobile ? '10px' : '11px')
          .attr('font-weight', '600')
          .attr('fill', '#64748b')
          .attr('dx', '-4px')
      );

    // X Axis Label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + (isMobile ? 36 : 40))
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .text('Hour of Day (24-Hour Horizon)');

    // Y Axis Label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', isMobile ? -28 : -34)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .text('Detections / Hour');
  }, [activeHourlyData, dimensions, viewMode]);

  const telemetry = globalTelemetryTracker.get(ANALYTICS_ENDPOINT);

  return (
    <div 
      id="command-center-analytics"
      className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-5 ${className}`}
    >
      {/* 1. Header & Rate-Limit Resilience Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <BarChart2 size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                Detection Frequency Analytics
                {status === 'READY' && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    D3.JS READY
                  </span>
                )}
                {status === 'RATE_LIMITED' && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <ShieldAlert size={10} /> RATE LIMITED (CACHED)
                  </span>
                )}
                {status === 'UNAVAILABLE' && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    LOCAL STANDBY
                  </span>
                )}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Frequency distribution of Person vs. Vehicle detection events across 42 CCTV surveillance nodes (Last 24 Hours)
              </p>
            </div>
          </div>
        </div>

        {/* Resilience Controls & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Polling Mode Indicator */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs"
            title={lastRefreshedAt ? `Last verified: ${lastRefreshedAt.toLocaleTimeString()}` : 'No verified sync yet'}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-mono text-[11px]">
              {autoRefresh ? 'AUTO-POLL' : 'MANUAL SYNC'}
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline ml-1 cursor-pointer"
            >
              {autoRefresh ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* Time Window Buttons */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold">
            {(['24h', '12h', '6h'] as TimeWindow[]).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeWindow === tw
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tw.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Manual Refresh Action */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-50"
            title="Refresh Detection Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Non-Blocking Status Notification (if Rate Limited or Degraded) */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
          status === 'RATE_LIMITED' 
            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={status === 'RATE_LIMITED' ? 'text-amber-600' : 'text-slate-500'} />
            <span>{statusMessage}</span>
          </div>
          {isCachedData && lastRefreshedAt && (
            <span className="text-[11px] font-mono opacity-80">
              Cached at {lastRefreshedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Vehicles Detected */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Vehicle Detections
            </span>
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <Car size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {activeSummary.totalVehicleDetections.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-blue-700 font-semibold">
              <span>{activeSummary.vehiclePercentage}% of total</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px]">ANPR & Tracks</span>
            </div>
          </div>
        </div>

        {/* Persons Detected */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Person Detections
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {activeSummary.totalPersonDetections.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-emerald-700 font-semibold">
              <span>{activeSummary.personPercentage}% of total</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px]">Crowd & Pedestrians</span>
            </div>
          </div>
        </div>

        {/* Peak Intensity Hour */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-amber-100 bg-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Peak Traffic Hour
            </span>
            <div className="p-1.5 rounded-lg bg-amber-600 text-white">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {activeSummary.peakHour}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-amber-700 font-semibold">
              <span>{activeSummary.peakCount.toLocaleString()} events</span>
              <span className="text-slate-300">•</span>
              <span className="capitalize">{activeSummary.peakType} dominant</span>
            </div>
          </div>
        </div>

        {/* Total Aggregated Surveillance Events */}
        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Total Observations
            </span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-white">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {activeSummary.totalDetections.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-semibold">
              <span>{activeSummary.liveEventsCount} live alerts stored</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Chart Controls & Interactive Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Interactive Mode Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Chart View:
          </span>
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped (Dual Bars)
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'stacked'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stacked Total
            </button>
            <button
              onClick={() => setViewMode('vehicles')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'vehicles'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vehicles Only
            </button>
            <button
              onClick={() => setViewMode('persons')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'persons'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Persons Only
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-600 inline-block shadow-xs" />
            <span className="text-slate-700">Vehicle Events</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600 inline-block shadow-xs" />
            <span className="text-slate-700">Person Events</span>
          </div>
        </div>
      </div>

      {/* 4. D3.JS Chart Canvas Container */}
      <div 
        ref={containerRef} 
        className="relative w-full border border-slate-200 rounded-xl bg-slate-50/50 p-2 sm:p-4 overflow-hidden"
      >
        {!data && status === 'LOADING' ? (
          <div className="h-[280px] sm:h-[340px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Rendering D3.js temporal distribution...
            </span>
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-auto overflow-visible select-none"
            />

            {/* Interactive Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none z-30 bg-slate-900/95 text-white border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-xs text-xs space-y-2 transition-transform transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${hoveredPoint.x}px`,
                  top: `${Math.max(10, hoveredPoint.y - 12)}px`,
                  minWidth: '180px'
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-200">
                    Hour: {hoveredPoint.data.hourLabel}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(hoveredPoint.data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-1 font-mono">
                  <div className="flex items-center justify-between gap-3 text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Car size={12} /> Vehicles:
                    </span>
                    <strong className="text-white">
                      {hoveredPoint.data.vehicleCount.toLocaleString()}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Users size={12} /> Persons:
                    </span>
                    <strong className="text-white">
                      {hoveredPoint.data.personCount.toLocaleString()}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-1 text-slate-300 font-semibold">
                    <span>Total Events:</span>
                    <span className="text-white">
                      {hoveredPoint.data.totalCount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {hoveredPoint.data.liveEvents ? (
                  <div className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                    ⚡ {hoveredPoint.data.liveEvents} Real-Time Edge Alert(s)
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Footer Operational Intelligence & Diagnostics Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600" />
          <span>Decoupled telemetry: Real-time CCTV vision and YOLO inference operate independently of cloud analytics.</span>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowTelemetryDetails(!showTelemetryDetails)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <Activity size={12} />
            <span>{showTelemetryDetails ? 'Hide Diagnostics' : 'API Telemetry'}</span>
          </button>
          
          {onNavigate && (
            <button
              onClick={() => onNavigate('tracking')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Investigate CCTV Trajectories</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* 6. Technical Diagnostics Tray */}
      {showTelemetryDetails && (
        <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-slate-400 uppercase tracking-wider">
            <span>Analytics API Health & Resilience Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${
              status === 'READY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}>
              {status}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
            <div>
              <span className="text-slate-500 block">Total Requests:</span>
              <strong className="text-white">{telemetry?.requestCount ?? 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Successes:</span>
              <strong className="text-emerald-400">{telemetry?.successfulRequests ?? 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">429 Rate Limits:</span>
              <strong className={telemetry?.rateLimitCount ? 'text-amber-400' : 'text-slate-400'}>
                {telemetry?.rateLimitCount ?? 0}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Active In-Flight:</span>
              <strong className="text-white">{telemetry?.activeRequests ?? 0}</strong>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Circuit State: {analyticsBreaker.getState()}</span>
            <span>Last 429: {telemetry?.last429At ? telemetry.last429At.toLocaleTimeString() : 'None'}</span>
            <span>Last Success: {telemetry?.lastSuccessAt ? telemetry.lastSuccessAt.toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
