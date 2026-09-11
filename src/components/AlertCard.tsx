import React from 'react';
import { 
  Eye, 
  FileCheck, 
  Car, 
  Video, 
  Sparkles, 
  Clock, 
  Info, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { StatusBadge } from './ui/OfficerPrimitives';

export interface AlertCardData {
  id: string;
  violationType: string;
  vehiclePlate: string;
  vehicleType: string;
  cameraId: string;
  sourceType?: string;
  location: string;
  timestamp: string;
  confidence: number;
  evidenceUrl: string;
}

export interface AlertCardProps {
  alert: AlertCardData;
  isReviewed?: boolean;
  onReviewAlert: () => void;
  onViewFullEvidence: () => void;
  onTrackVehicle: (plate: string) => void;
  onViewCamera?: (cameraId: string) => void;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  isReviewed = false,
  onReviewAlert,
  onViewFullEvidence,
  onTrackVehicle,
  onViewCamera,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl border-2 border-rose-200 p-4 sm:p-6 shadow-xs relative overflow-hidden ${className}`}>
      <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">
        {/* Evidence Frame Preview Thumbnail */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
            <img
              src={alert.evidenceUrl}
              alt="Active Alert Frame"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2.5 left-2.5">
              <StatusBadge status="CRITICAL" label="ACTIVE ALERT" size="sm" />
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 text-white px-2.5 py-1 rounded text-[11px] font-mono flex items-center justify-between">
              <span>{alert.cameraId}</span>
              <span>{alert.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Alert Core Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle size={12} className="text-rose-700" />
                  High Priority Violation
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  ID: {alert.id}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs font-bold text-purple-700">
                <Sparkles size={13} />
                <span>AI Detection: {alert.confidence}% Confidence</span>
              </div>
            </div>

            {/* Violation Title */}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{alert.violationType}</span>
              {isReviewed && (
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
                  REVIEWED
                </span>
              )}
            </h2>

            {/* Key Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Vehicle</span>
                <p className="text-base font-black text-slate-900 font-mono tracking-wider">
                  {alert.vehiclePlate}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Vehicle Type</span>
                <p className="text-sm font-bold text-slate-800">
                  {alert.vehicleType}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">{alert.sourceType ? alert.sourceType.replace(/_/g, ' ') : 'Camera'}</span>
                <p className="text-sm font-bold text-slate-800 font-mono">
                  {alert.cameraId}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">Location</span>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {alert.location}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
              <span className="inline-flex items-center gap-1">
                <Clock size={14} className="text-slate-400" />
                <span>Timestamp: <strong>{alert.timestamp}</strong></span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="inline-flex items-center gap-1">
                <Info size={14} className="text-slate-400" />
                <span>Supervisory human review required prior to automated challan dispatch</span>
              </span>
            </div>
          </div>

          {/* Action Buttons Section: Prioritized 'Review Alert' + Secondary Actions Row */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* 1. Prioritized Primary Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={onReviewAlert}
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm sm:text-base transition-all shadow-xs flex items-center justify-center gap-2.5 min-h-[48px] cursor-pointer active:scale-[0.99]"
              >
                <Eye size={19} className="shrink-0" />
                <span>Review Alert</span>
                <ArrowRight size={16} className="shrink-0 opacity-80" />
              </button>

              <span className="text-xs text-slate-500 hidden xl:inline-block">
                Immediate duty officer action: Verify infraction & license plate
              </span>
            </div>

            {/* 2. Touch-Friendly Secondary Actions Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline-block">
                Secondary Actions:
              </span>

              {/* View Full Evidence */}
              <button
                type="button"
                onClick={onViewFullEvidence}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors min-h-[44px] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <FileCheck size={16} className="text-slate-600 shrink-0" />
                <span className="whitespace-nowrap">View Full Evidence</span>
              </button>

              {/* Track Vehicle */}
              <button
                type="button"
                onClick={() => onTrackVehicle(alert.vehiclePlate)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors min-h-[44px] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Car size={16} className="text-slate-600 shrink-0" />
                <span className="whitespace-nowrap">Track Vehicle</span>
              </button>

              {/* View Camera (auxiliary) */}
              {onViewCamera && (
                <button
                  type="button"
                  onClick={() => onViewCamera(alert.cameraId)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-200 transition-colors min-h-[44px] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Video size={16} className="text-slate-600 shrink-0" />
                  <span className="whitespace-nowrap">View Camera</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
