import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Eye, 
  Crosshair, 
  X, 
  Clock, 
  MapPin, 
  Camera, 
  Sparkles,
  Filter
} from 'lucide-react';
import { StatusBadge, AlertDetailDrawer } from './ui/OfficerPrimitives';
import { audioAlertService } from '../services/AudioAlertService';

interface OperationalAlert {
  id: string;
  category: 'WATCHLIST' | 'TRAFFIC' | 'BEHAVIOR';
  violationType: string;
  vehiclePlate: string;
  vehicleType: string;
  cameraId: string;
  location: string;
  timestamp: string;
  confidence: number;
  status: 'CRITICAL' | 'HIGH' | 'REVIEW REQUIRED';
  isDismissed?: boolean;
  evidenceUrl: string;
}

interface AlertsProps {
  onNavigate?: (view: string) => void;
}

export function Alerts({ onNavigate }: AlertsProps) {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WATCHLIST' | 'TRAFFIC' | 'BEHAVIOR'>('ALL');
  const [isMuted, setIsMuted] = useState(() => audioAlertService.isMuted());
  const [selectedAlertForReview, setSelectedAlertForReview] = useState<OperationalAlert | null>(null);

  // Core operational alerts matching prompt
  const [alertsList, setAlertsList] = useState<OperationalAlert[]>([
    {
      id: 'ALT-001',
      category: 'TRAFFIC',
      violationType: 'NO HELMET',
      vehiclePlate: 'GJ01AB1234',
      vehicleType: 'Motorcycle',
      cameraId: 'CAM-001',
      location: 'Traffic Junction • SG Highway',
      timestamp: '11:49 AM',
      confidence: 92,
      status: 'CRITICAL',
      evidenceUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'ALT-002',
      category: 'WATCHLIST',
      violationType: 'WATCHLIST TARGET MATCH',
      vehiclePlate: 'GJ05XY6789',
      vehicleType: 'Sedan',
      cameraId: 'CAM-014',
      location: 'Ashram Road Transit Hub',
      timestamp: '11:45 AM',
      confidence: 95,
      status: 'CRITICAL',
      evidenceUrl: 'https://images.unsplash.com/photo-1549424888-c92eb295ff68?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'ALT-003',
      category: 'TRAFFIC',
      violationType: 'TRIPLE RIDING',
      vehiclePlate: 'GJ01EF9921',
      vehicleType: 'Motorcycle',
      cameraId: 'CAM-023',
      location: 'Sindhu Bhavan Toll Plaza',
      timestamp: '11:38 AM',
      confidence: 88,
      status: 'HIGH',
      evidenceUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'ALT-004',
      category: 'BEHAVIOR',
      violationType: 'WRONG WAY DRIVING',
      vehiclePlate: 'GJ27CD5544',
      vehicleType: 'SUV',
      cameraId: 'CAM-031',
      location: 'Ring Road Express Interchange',
      timestamp: '11:22 AM',
      confidence: 91,
      status: 'REVIEW REQUIRED',
      evidenceUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'ALT-005',
      category: 'TRAFFIC',
      violationType: 'RED LIGHT VIOLATION',
      vehiclePlate: 'GJ01MN3411',
      vehicleType: 'Car',
      cameraId: 'CAM-001',
      location: 'Traffic Junction',
      timestamp: '11:15 AM',
      confidence: 96,
      status: 'HIGH',
      evidenceUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80'
    },
    {
      id: 'ALT-006',
      category: 'BEHAVIOR',
      violationType: 'SUSPICIOUS LOITERING IN CORRIDOR',
      vehiclePlate: 'GJ03KL7712',
      vehicleType: 'Hatchback',
      cameraId: 'CAM-042',
      location: 'Surat Ring Road Gate 1',
      timestamp: '10:58 AM',
      confidence: 86,
      status: 'REVIEW REQUIRED',
      evidenceUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&auto=format&fit=crop&q=80'
    }
  ]);

  const handleDismiss = (id: string) => {
    setAlertsList(alertsList.filter(a => a.id !== id));
  };

  const handleTestAudio = () => {
    audioAlertService.playTone('TEST_ALERT');
  };

  const handleToggleMute = () => {
    const next = audioAlertService.toggleMute();
    setIsMuted(next);
  };

  const filteredAlerts = alertsList.filter(a => {
    if (activeFilter === 'WATCHLIST') return a.category === 'WATCHLIST';
    if (activeFilter === 'TRAFFIC') return a.category === 'TRAFFIC';
    if (activeFilter === 'BEHAVIOR') return a.category === 'BEHAVIOR';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Alerts
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Real-time optical triggers and automated detection events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          >
            {isMuted ? <VolumeX size={15} className="text-rose-600" /> : <Volume2 size={15} className="text-blue-600" />}
            <span>{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          <button
            onClick={handleTestAudio}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          >
            <span>Test Chime</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Buttons:
          [ All Alerts ]
          [ Watchlist Hits ]
          [ Traffic Violations ]
          [ Suspicious Behavior ]
      */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
            activeFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          All Alerts ({alertsList.length})
        </button>

        <button
          onClick={() => setActiveFilter('WATCHLIST')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
            activeFilter === 'WATCHLIST'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          Watchlist Hits ({alertsList.filter(a => a.category === 'WATCHLIST').length})
        </button>

        <button
          onClick={() => setActiveFilter('TRAFFIC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
            activeFilter === 'TRAFFIC'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          Traffic Violations ({alertsList.filter(a => a.category === 'TRAFFIC').length})
        </button>

        <button
          onClick={() => setActiveFilter('BEHAVIOR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
            activeFilter === 'BEHAVIOR'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          Suspicious Behavior ({alertsList.filter(a => a.category === 'BEHAVIOR').length})
        </button>
      </div>

      {/* 3. Alerts Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header with Status Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold font-mono text-slate-500 uppercase">
                  {alert.id}
                </span>
                <StatusBadge
                  status={
                    alert.status === 'CRITICAL'
                      ? 'CRITICAL'
                      : alert.status === 'HIGH'
                      ? 'WARNING'
                      : 'REVIEW_REQUIRED'
                  }
                  label={alert.status}
                  size="sm"
                />
              </div>

              {/* Title: NO HELMET, etc. */}
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                {alert.violationType}
              </h2>

              {/* Vehicle Registration */}
              <div className="text-base font-black font-mono text-blue-700 tracking-wider my-1">
                {alert.vehiclePlate}
              </div>

              {/* Location & Time: CAM-001 • Traffic Junction • 11:49 AM */}
              <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
                <span className="font-mono font-bold text-slate-800">{alert.cameraId}</span>
                <span className="text-slate-300">•</span>
                <span className="truncate">{alert.location}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">{alert.timestamp}</span>
              </div>

              {/* Confidence */}
              <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <Sparkles size={12} className="text-purple-600" />
                <span>Confidence: {alert.confidence}%</span>
              </div>
            </div>

            {/* Actions: [ Review ] [ Track ] [ Dismiss ] */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAlertForReview(alert)}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 min-h-[40px] cursor-pointer shadow-xs"
              >
                <Eye size={14} />
                <span>Review</span>
              </button>

              <button
                onClick={() => onNavigate?.('missions')}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 min-h-[40px] border border-slate-300 cursor-pointer"
              >
                <Crosshair size={14} />
                <span>Track</span>
              </button>

              <button
                onClick={() => handleDismiss(alert.id)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 min-h-[40px] border border-slate-200 cursor-pointer"
                title="Dismiss alert"
              >
                <X size={15} />
                <span>Dismiss</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over Alert Drawer */}
      {selectedAlertForReview && (
        <AlertDetailDrawer
          isOpen={Boolean(selectedAlertForReview)}
          onClose={() => setSelectedAlertForReview(null)}
          alert={selectedAlertForReview}
          onViewEvidence={() => onNavigate?.('tracking')}
          onViewMap={() => onNavigate?.('geospatial_map')}
          onTrackVehicle={(plate) => onNavigate?.('missions')}
          onMarkReviewed={() => setSelectedAlertForReview(null)}
          onSendHumanReview={() => setSelectedAlertForReview(null)}
        />
      )}
    </div>
  );
}
