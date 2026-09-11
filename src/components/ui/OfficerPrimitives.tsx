import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Eye, 
  MapPin, 
  Shield, 
  ChevronRight, 
  ChevronDown, 
  Info,
  X,
  Camera,
  Car,
  Compass,
  ArrowRight
} from 'lucide-react';

/**
 * StatusBadge: Accessible badge with meaningful icon + text and high contrast
 */
export function StatusBadge({ 
  status, 
  label,
  size = 'md'
}: { 
  status: 'LIVE' | 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'INFO' | 'REVIEW_REQUIRED' | 'VERIFIED' | 'OFFLINE' | 'DEMO';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  const configs = {
    LIVE: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      dot: 'bg-emerald-500',
      pulse: true,
      defaultLabel: 'LIVE'
    },
    HEALTHY: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      dot: 'bg-emerald-500',
      pulse: false,
      defaultLabel: 'HEALTHY'
    },
    CRITICAL: {
      bg: 'bg-rose-50 text-rose-700 border-rose-300',
      dot: 'bg-rose-500',
      pulse: true,
      defaultLabel: 'URGENT'
    },
    WARNING: {
      bg: 'bg-amber-50 text-amber-700 border-amber-300',
      dot: 'bg-amber-500',
      pulse: false,
      defaultLabel: 'WARNING'
    },
    REVIEW_REQUIRED: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      dot: 'bg-amber-600',
      pulse: true,
      defaultLabel: 'REVIEW REQUIRED'
    },
    VERIFIED: {
      bg: 'bg-blue-50 text-blue-700 border-blue-300',
      dot: 'bg-blue-500',
      pulse: false,
      defaultLabel: 'HUMAN VERIFIED'
    },
    INFO: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-400',
      pulse: false,
      defaultLabel: 'INFO'
    },
    OFFLINE: {
      bg: 'bg-slate-100 text-slate-500 border-slate-300',
      dot: 'bg-slate-400',
      pulse: false,
      defaultLabel: 'OFFLINE'
    },
    DEMO: {
      bg: 'bg-amber-50 text-amber-900 border-amber-400',
      dot: 'bg-amber-500',
      pulse: false,
      defaultLabel: 'SIMULATED DEMO'
    }
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs ${configs.bg} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${configs.dot} ${configs.pulse ? 'animate-pulse' : ''}`} />
      <span>{label || configs.defaultLabel}</span>
    </span>
  );
}

/**
 * MetricCard: High contrast top KPI card
 */
export function MetricCard({
  title,
  value,
  subtext,
  icon,
  variant = 'blue',
  onClick,
  active
}: {
  title: string;
  value: number | string;
  subtext?: string;
  icon?: React.ReactNode;
  variant?: 'red' | 'blue' | 'amber' | 'emerald' | 'purple' | 'slate';
  onClick?: () => void;
  active?: boolean;
}) {
  const variantStyles = {
    red: {
      border: 'border-rose-200 hover:border-rose-400',
      bg: 'bg-white hover:bg-rose-50/40',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
      activeBorder: 'border-rose-500 ring-2 ring-rose-200'
    },
    blue: {
      border: 'border-blue-200 hover:border-blue-400',
      bg: 'bg-white hover:bg-blue-50/40',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-700',
      activeBorder: 'border-blue-500 ring-2 ring-blue-200'
    },
    amber: {
      border: 'border-amber-200 hover:border-amber-400',
      bg: 'bg-white hover:bg-amber-50/40',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
      activeBorder: 'border-amber-500 ring-2 ring-amber-200'
    },
    emerald: {
      border: 'border-emerald-200 hover:border-emerald-400',
      bg: 'bg-white hover:bg-emerald-50/40',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-200'
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-400',
      bg: 'bg-white hover:bg-purple-50/40',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100 text-purple-700',
      activeBorder: 'border-purple-500 ring-2 ring-purple-200'
    },
    slate: {
      border: 'border-slate-200 hover:border-slate-400',
      bg: 'bg-white hover:bg-slate-50',
      text: 'text-slate-800',
      iconBg: 'bg-slate-100 text-slate-700',
      activeBorder: 'border-slate-500 ring-2 ring-slate-200'
    }
  }[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 shadow-xs select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${variantStyles.bg} ${variantStyles.border} ${
        active ? variantStyles.activeBorder : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {value}
          </div>
          {subtext && (
            <p className={`text-xs font-medium mt-1 ${variantStyles.text}`}>
              {subtext}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl shrink-0 ${variantStyles.iconBg}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ActionButton: Large, accessible touch-friendly button (min 44px)
 */
export function ActionButton({
  label,
  sublabel,
  icon,
  onClick,
  variant = 'primary',
  fullWidth = false,
  size = 'md'
}: {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';
  fullWidth?: boolean;
  size?: 'md' | 'lg';
}) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs border border-blue-700',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border border-rose-700',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs border border-amber-600',
    outline: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400'
  }[variant];

  const minH = size === 'lg' ? 'min-h-[52px]' : 'min-h-[44px]';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors cursor-pointer select-none ${minH} ${
        fullWidth ? 'w-full' : ''
      } ${styles}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex flex-col items-start leading-tight">
        <span>{label}</span>
        {sublabel && <span className="text-[11px] opacity-80 font-normal">{sublabel}</span>}
      </div>
    </button>
  );
}

/**
 * QuickActionGrid: Large "What do you want to do?" touch button array
 */
export function QuickActionGrid({
  onAction
}: {
  onAction: (actionId: string) => void;
}) {
  const actions = [
    { id: 'track_vehicle', label: 'Track Vehicle', sub: 'Corridor investigation', icon: <Car size={18} /> },
    { id: 'find_last_seen', label: 'Find Last Seen', sub: 'Plate lookup', icon: <Clock size={18} /> },
    { id: 'investigate_incident', label: 'Investigate Incident', sub: 'Triage queue', icon: <AlertTriangle size={18} /> },
    { id: 'check_camera', label: 'Check Camera', sub: 'Live CCTV feeds', icon: <Camera size={18} /> },
    { id: 'review_alert', label: 'Review Alert', sub: 'Pending verification', icon: <Eye size={18} /> },
    { id: 'search_evidence', label: 'Search Evidence', sub: 'Forensic records', icon: <Compass size={18} /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
      <h3 className="text-base font-bold text-slate-900 mb-1">What do you want to do?</h3>
      <p className="text-xs text-slate-500 mb-4">Quick operational actions for patrol officers and control room staff</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {actions.map((act) => (
          <button
            key={act.id}
            onClick={() => onAction(act.id)}
            className="flex flex-col items-start justify-center p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-800 hover:text-blue-700 transition-all text-left min-h-[72px] cursor-pointer group shadow-2xs"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-600 group-hover:border-blue-200 mb-2 shadow-2xs">
              {act.icon}
            </div>
            <span className="text-xs sm:text-sm font-semibold leading-tight">{act.label}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 leading-none">{act.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * TechnicalDetailsToggle: Collapsible container to house deep backend telemetry without cluttering
 */
export function TechnicalDetailsToggle({
  title = 'Technical Details',
  badge = 'ENGINEERING METRICS',
  children,
  defaultOpen = false
}: {
  title?: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-slate-400" />
          <span className="font-semibold text-slate-800">{title}</span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
            {badge}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200 bg-white space-y-3 font-mono">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * AlertDetailDrawer: Reusable Alert Detail Screen / Drawer for Officer Review
 */
export function AlertDetailDrawer({
  isOpen,
  onClose,
  alert,
  onViewEvidence,
  onViewMap,
  onTrackVehicle,
  onMarkReviewed,
  onSendHumanReview
}: {
  isOpen: boolean;
  onClose: () => void;
  alert: {
    id: string;
    violationType: string;
    vehiclePlate: string;
    vehicleType: string;
    cameraId: string;
    location: string;
    timestamp: string;
    confidence: number;
    evidenceUrl?: string;
    status?: string;
  } | null;
  onViewEvidence?: (alertId: string) => void;
  onViewMap?: (alertId: string) => void;
  onTrackVehicle?: (plate: string) => void;
  onMarkReviewed?: (alertId: string) => void;
  onSendHumanReview?: (alertId: string) => void;
}) {
  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                OFFICER ALERT REVIEW
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {alert.violationType}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Statutory Policy Disclaimer */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">AI Detection — Requires Human Review</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                AI candidate outputs are investigative leads and do not constitute automatic legal certainty. Review evidence before initiating enforcement.
              </p>
            </div>
          </div>

          {/* Evidence Frame Image Preview */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative aspect-video flex items-center justify-center">
            {alert.evidenceUrl ? (
              <img
                src={alert.evidenceUrl}
                alt="Alert Evidence Snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4 text-slate-400">
                <Camera size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Physical CCTV Frame Analyzed</p>
                <p className="text-[10px] font-mono text-slate-500">SHA-256 Digest Logged</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2.5 py-1 rounded text-[11px] font-mono">
              {alert.cameraId} • {alert.timestamp}
            </div>
            <div className="absolute top-2 right-2 bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
              {alert.confidence}% AI CONFIDENCE
            </div>
          </div>

          {/* Core Vehicle & Location Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Vehicle Plate</span>
              <p className="text-base font-black text-slate-900 font-mono tracking-wider">
                {alert.vehiclePlate}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Vehicle Type</span>
              <p className="text-sm font-bold text-slate-800">
                {alert.vehicleType}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Camera Node</span>
              <p className="text-sm font-bold text-slate-800 font-mono">
                {alert.cameraId}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Location</span>
              <p className="text-sm font-bold text-slate-800 truncate" title={alert.location}>
                {alert.location}
              </p>
            </div>
          </div>

          {/* Quick Navigations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Investigation Actions
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ActionButton
                label="View Full Evidence"
                icon={<Eye size={15} />}
                variant="outline"
                onClick={() => {
                  onViewEvidence?.(alert.id);
                  onClose();
                }}
              />
              <ActionButton
                label="View on Map"
                icon={<MapPin size={15} />}
                variant="outline"
                onClick={() => {
                  onViewMap?.(alert.id);
                  onClose();
                }}
              />
              <ActionButton
                label="Track Vehicle"
                icon={<Car size={15} />}
                variant="outline"
                onClick={() => {
                  onTrackVehicle?.(alert.vehiclePlate);
                  onClose();
                }}
              />
              <ActionButton
                label="Mark Reviewed"
                icon={<CheckCircle2 size={15} />}
                variant="secondary"
                onClick={() => {
                  onMarkReviewed?.(alert.id);
                  onClose();
                }}
              />
            </div>

            {/* Human Verification Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onSendHumanReview?.(alert.id);
                  onClose();
                }}
                className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Shield size={18} />
                <span>Send for Human Officer Verification</span>
              </button>
            </div>
          </div>

          {/* Technical Metadata (Collapsible) */}
          <TechnicalDetailsToggle title="Evidence Integrity & Pipeline Details" badge="BSA 2023">
            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div>Alert ID: <strong className="text-slate-900">{alert.id}</strong></div>
              <div>Digest Algorithm: <strong className="text-slate-900">SHA-256</strong></div>
              <div>Integrity Notice: SHA-256 Integrity Digest (Not a digital signature)</div>
              <div>Legal Admissibility: Subject to Bharatiya Sakshya Adhiniyam, 2023 procedures</div>
            </div>
          </TechnicalDetailsToggle>
        </div>
      </div>
    </div>
  );
}
