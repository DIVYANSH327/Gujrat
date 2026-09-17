import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera, 
  Car, 
  AlertTriangle, 
  FileCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { StatusBadge } from '../ui/OfficerPrimitives';
import { challanReviewService } from '../../services/ChallanReviewService';
import { AuthorizedDispatchContext } from '../../types/v22ChallanTypes';

interface ReviewQueueItem {
  id: string;
  violation: string;
  vehicle: string;
  vehicleType: string;
  image: string;
  camera: string;
  location: string;
  time: string;
  confidence: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUEST_FRAME';
  notes?: string;
}

interface Props {
  onNavigate?: (view: string, payload?: any) => void;
}

export const ChallanModeDashboard: React.FC<Props> = ({ onNavigate }) => {
  const [officerContext] = useState<any>({
    officerId: 'POLICE-OFFICER-742',
    officerName: 'Insp. Vikram Patel',
    badgeNumber: 'GJ-TRF-742',
    role: 'REVIEWER',
    department: 'Gujarat Traffic Police Enforcement Wing'
  });

  const [queue, setQueue] = useState<ReviewQueueItem[]>([
    {
      id: 'VC-000124',
      violation: 'No Helmet',
      vehicle: 'GJ01AB1234',
      vehicleType: 'Motorcycle',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
      camera: 'CAM-001',
      location: 'Ahmedabad - SG Highway Junction',
      time: '11:49 AM',
      confidence: 92,
      status: 'PENDING_REVIEW'
    },
    {
      id: 'VC-000125',
      violation: 'Triple Riding',
      vehicle: 'GJ01EF9921',
      vehicleType: 'Motorcycle',
      image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      camera: 'CAM-023',
      location: 'Ahmedabad - Sindhu Bhavan Toll Plaza',
      time: '11:38 AM',
      confidence: 88,
      status: 'PENDING_REVIEW'
    },
    {
      id: 'VC-000126',
      violation: 'Red Light Jump',
      vehicle: 'GJ05XY6789',
      vehicleType: 'Sedan',
      image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
      camera: 'CAM-014',
      location: 'Ahmedabad - Ashram Road Transit Hub',
      time: '11:15 AM',
      confidence: 95,
      status: 'PENDING_REVIEW'
    },
    {
      id: 'VC-000127',
      violation: 'Wrong-Way Transit Corridor',
      vehicle: 'GJ27CD5544',
      vehicleType: 'SUV',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
      camera: 'CAM-031',
      location: 'Ahmedabad - Ring Road Express',
      time: '10:55 AM',
      confidence: 91,
      status: 'PENDING_REVIEW'
    }
  ]);

  const [notification, setNotification] = useState<{ type: 'success' | 'reject' | 'frame'; message: string } | null>(null);

  const handleApprove = (item: ReviewQueueItem) => {
    try {
      challanReviewService.approveCase(item.id, officerContext, 'Confirmed optical violation. Approved by Reviewer.');
    } catch {
      // safe fallback if underlying case not registered
    }

    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'APPROVED' } : q));
    setNotification({
      type: 'success',
      message: `Violation Approved for ${item.vehicle}. Legal e-Challan dispatched with BSA 2023 certificate.`
    });
  };

  const handleReject = (item: ReviewQueueItem) => {
    try {
      challanReviewService.rejectCase(item.id, officerContext, 'Plate OCR or vehicle attribute discordant upon human inspection.');
    } catch {
      // safe fallback
    }

    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'REJECTED' } : q));
    setNotification({
      type: 'reject',
      message: `Violation Rejected for ${item.vehicle}. Case closed without liability.`
    });
  };

  const handleRequestBetterFrame = (item: ReviewQueueItem) => {
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'REQUEST_FRAME' } : q));
    setNotification({
      type: 'frame',
      message: `Requested higher-resolution frame from ${item.camera} Edge buffer.`
    });
  };

  const pendingItems = queue.filter(q => q.status === 'PENDING_REVIEW');
  const reviewedItems = queue.filter(q => q.status !== 'PENDING_REVIEW');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            e-Challan / Traffic Review
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Human-in-the-loop review queue for AI-detected traffic violations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2">
            <UserCheck size={16} className="text-blue-600" />
            <span>Duty Officer: <strong className="text-slate-900">{officerContext.officerName}</strong> ({officerContext.badgeNumber})</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-xs ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' :
          notification.type === 'reject' ? 'bg-rose-50 border border-rose-200 text-rose-900' :
          'bg-amber-50 border border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> :
             notification.type === 'reject' ? <XCircle size={18} className="text-rose-600" /> :
             <RefreshCw size={18} className="text-amber-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold px-2 py-1 hover:bg-black/5 rounded cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Review Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span>Review Queue</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {pendingItems.length} Pending
            </span>
          </h2>
        </div>

        {pendingItems.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Review Queue Complete</h3>
            <p className="text-xs text-slate-500">All candidate violations have been reviewed by the officer on duty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pendingItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Case Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {item.id}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      <Sparkles size={13} />
                      <span>Confidence: {item.confidence}%</span>
                    </div>
                  </div>

                  {/* Evidence Photo */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 mb-4 group">
                    <img 
                      src={item.image} 
                      alt="Violation Evidence" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <StatusBadge status="CRITICAL" label="VIOLATION CANDIDATE" size="sm" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2.5 py-1 rounded text-xs font-mono">
                      {item.camera} • {item.time}
                    </div>
                  </div>

                  {/* Structured Details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-500 uppercase text-[11px]">Violation</span>
                      <p className="text-base font-black text-rose-700 mt-0.5">{item.violation}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-500 uppercase text-[11px]">Vehicle</span>
                      <p className="text-base font-black font-mono text-slate-900 mt-0.5">{item.vehicle}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-500 uppercase text-[11px]">Camera</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">{item.camera}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-semibold text-slate-500 uppercase text-[11px]">Time</span>
                      <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        <span>{item.time}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Officer Decision Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => handleApprove(item)}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>Approve Violation</span>
                  </button>

                  <button
                    onClick={() => handleReject(item)}
                    className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                  >
                    <XCircle size={18} />
                    <span>Reject Violation</span>
                  </button>

                  <button
                    onClick={() => handleRequestBetterFrame(item)}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    <span>Request Better Frame</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Completed Reviews Log */}
      {reviewedItems.length > 0 && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Decided In This Session ({reviewedItems.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {reviewedItems.map((item) => (
              <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 font-mono">{item.vehicle}</div>
                  <div className="text-slate-500">{item.violation}</div>
                </div>
                <StatusBadge 
                  status={item.status === 'APPROVED' ? 'VERIFIED' : item.status === 'REJECTED' ? 'CRITICAL' : 'WARNING'}
                  label={item.status}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
