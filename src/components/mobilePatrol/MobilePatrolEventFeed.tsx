/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Mobile Patrol Event Feed Component
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Car, 
  Crosshair, 
  Zap, 
  Filter,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react';
import { 
  PatrolEventEvidence, 
  PatrolEventCategory,
  EventPriority 
} from '../../types/mobilePatrolTypes';

interface MobilePatrolEventFeedProps {
  events: PatrolEventEvidence[];
  selectedEventId: string | null;
  onSelectEvent: (event: PatrolEventEvidence) => void;
  onOpenReview: (event: PatrolEventEvidence) => void;
}

export const MobilePatrolEventFeed: React.FC<MobilePatrolEventFeedProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onOpenReview
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const filteredEvents = events.filter(evt => {
    if (filterPriority === 'ALL') return true;
    return evt.priority === filterPriority;
  });

  const getPriorityBadgeClass = (priority: EventPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW':
      case 'NORMAL':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getCategoryIcon = (category: PatrolEventCategory) => {
    switch (category) {
      case 'NO_HELMET':
        return <ShieldAlert size={14} className="text-rose-600" />;
      case 'TRIPLE_RIDING':
        return <AlertTriangle size={14} className="text-amber-600" />;
      case 'WATCHLIST_MATCH':
      case 'STOLEN_VEHICLE_MATCH':
        return <Crosshair size={14} className="text-purple-600" />;
      case 'HSRP_VERIFIED':
      case 'HSRP_CANDIDATE':
        return <CheckCircle2 size={14} className="text-emerald-600" />;
      case 'OVERSPEED_CANDIDATE':
        return <Zap size={14} className="text-blue-600" />;
      default:
        return <Car size={14} className="text-slate-600" />;
    }
  };

  const formatEventTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      
      {/* Header & Filter */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">Recent AI Events</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-100 text-blue-800">
            {events.length}
          </span>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter size={12} className="text-slate-500" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-md px-2 py-1 outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No events match selected filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = selectedEventId === evt.eventId;
            return (
              <div
                key={evt.eventId}
                onClick={() => onSelectEvent(evt)}
                className={`p-2.5 rounded-lg transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  
                  {/* Icon & Category */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                      {getCategoryIcon(evt.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                          {evt.category.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getPriorityBadgeClass(evt.priority)}`}>
                          {evt.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-mono">
                        <span className="font-semibold text-slate-800">{evt.plateText}</span>
                        <span>•</span>
                        <span>{formatEventTime(evt.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Status Pill */}
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      evt.reviewStatus === 'OFFICER_VERIFIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : evt.reviewStatus === 'CHALLAN_ISSUED'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {evt.reviewStatus === 'OFFICER_VERIFIED' ? (
                        <>
                          <Check size={10} />
                          VERIFIED
                        </>
                      ) : evt.reviewStatus === 'CHALLAN_ISSUED' ? (
                        'CHALLAN'
                      ) : (
                        'REVIEW REQ.'
                      )}
                    </span>
                  </div>

                </div>

                {/* Subtext Summary & Quick Button */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[180px]">
                    {evt.cameraId} · {evt.vehicleClass}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReview(evt);
                    }}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    <span>Review & Verify</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
