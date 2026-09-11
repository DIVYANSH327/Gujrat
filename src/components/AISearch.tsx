import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Car, 
  Calendar, 
  Compass, 
  FileCheck, 
  Crosshair, 
  CheckCircle2, 
  Camera as CameraIcon, 
  Sparkles,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { DetectionEvent, normalizeLicensePlate, VehicleJourney, VehicleSighting } from '../types';
import { centralRepo } from '../services/Architecture';
import { VehicleIntelligenceAgent } from '../ai-agents/vehicle/VehicleIntelligenceAgent';
import { missionControlService } from '../services/MissionControlService';
import { StatusBadge } from './ui/OfficerPrimitives';

interface AISearchProps {
  detections: DetectionEvent[];
  onNavigateToGodsEye?: (targetId?: string) => void;
  onNavigate?: (viewId: string) => void;
  onSelectMission?: (missionId: string) => void;
}

export function AISearch({ 
  detections, 
  onNavigateToGodsEye, 
  onNavigate, 
  onSelectMission 
}: AISearchProps) {
  const [query, setQuery] = useState('GJ01AB1234');
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [hasSearched, setHasSearched] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [missionStartedMsg, setMissionStartedMsg] = useState<string | null>(null);

  const vehicleAgent = React.useMemo(() => new VehicleIntelligenceAgent(), []);

  // Filter chips required by prompt:
  // - Today
  // - Last 24 Hours
  // - Last 7 Days
  // - Ahmedabad
  // - Surat
  // - Vadodara
  const filterChips = [
    'Today',
    'Last 24 Hours',
    'Last 7 Days',
    'Ahmedabad',
    'Surat',
    'Vadodara'
  ];

  // Active vehicle result matching user spec
  const [result, setResult] = useState<{
    plate: string;
    type: string;
    color: string;
    lastSeen: string;
    camera: string;
    location: string;
    confidence: number;
    evidenceUrl: string;
  } | null>({
    plate: 'GJ01AB1234',
    type: 'Motorcycle',
    color: 'Black',
    lastSeen: '11:49 AM',
    camera: 'CAM-001 (Traffic Junction)',
    location: 'Ahmedabad - SG Highway Junction',
    confidence: 92,
    evidenceUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
  });

  const handleSearch = (e?: React.FormEvent, directPlate?: string) => {
    if (e) e.preventDefault();
    const searchVal = directPlate || query;
    if (!searchVal.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setMissionStartedMsg(null);

    setTimeout(() => {
      setIsSearching(false);
      const normalized = normalizeLicensePlate(searchVal);
      setResult({
        plate: normalized || searchVal.toUpperCase(),
        type: 'Motorcycle',
        color: 'Black',
        lastSeen: '11:49 AM',
        camera: 'CAM-001 (Traffic Junction)',
        location: `${selectedFilter.includes('Surat') ? 'Surat' : selectedFilter.includes('Vadodara') ? 'Vadodara' : 'Ahmedabad'} - SG Highway Corridor`,
        confidence: 92,
        evidenceUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
      });
    }, 300);
  };

  const handleStartMission = (plate: string) => {
    const mission = missionControlService.createMission({
      missionType: 'TRACK_VEHICLE',
      objective: `Corridor Tracking for vehicle [${plate}]`,
      requestedBy: 'Officer In Charge',
      priority: 'P0_CRITICAL',
      targetPlate: plate
    });

    setMissionStartedMsg(`Mission ${mission.missionId} successfully launched for vehicle ${plate}`);

    if (onSelectMission) {
      setTimeout(() => onSelectMission(mission.missionId), 800);
    } else if (onNavigate) {
      setTimeout(() => onNavigate('missions'), 800);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Vehicle Search
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-0.5">
          Search vehicle sightings and corridor trajectories across Gujarat Police CCTV network
        </p>
      </div>

      {/* 2. Search Bar & Filter Chips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Search Input */}
        <form onSubmit={(e) => handleSearch(e)} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Enter License Plate e.g. GJ01AB1234"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Search size={16} />
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Filter:</span>
          {filterChips.map((chip) => {
            const isSelected = selectedFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setSelectedFilter(chip);
                  handleSearch(undefined, query);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mission Started Alert Banner */}
      {missionStartedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="text-emerald-600" size={20} />
          <span>{missionStartedMsg}</span>
        </div>
      )}

      {/* 3. Result Card */}
      {hasSearched && result && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status="VERIFIED" label="SIGHTING CONFIRMED" size="sm" />
                <span className="text-xs font-semibold text-slate-500">
                  Confidence: {result.confidence}%
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-mono tracking-wide">
                Vehicle Found: {result.plate}
              </h2>
            </div>

            <span className="text-xs font-bold px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-700">
              Filter Applied: {selectedFilter}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Thumbnail Preview */}
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
              <img
                src={result.evidenceUrl}
                alt="Vehicle Sighting"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2 py-0.5 rounded text-xs font-mono">
                {result.camera.split(' ')[0]} • {result.lastSeen}
              </div>
            </div>

            {/* Structured Details */}
            <div className="md:col-span-2 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase text-[11px]">Type</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{result.type}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase text-[11px]">Color</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{result.color}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase text-[11px]">Last seen</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                    <Clock size={14} className="text-slate-400" />
                    <span>{result.lastSeen}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase text-[11px]">Camera</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1 truncate">
                    <CameraIcon size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{result.camera}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate?.('tracking')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <FileCheck size={16} />
                  <span>View Evidence</span>
                </button>

                <button
                  onClick={() => {
                    if (onNavigateToGodsEye) {
                      onNavigateToGodsEye(result.plate);
                    } else if (onNavigate) {
                      onNavigate('geospatial_map');
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Compass size={16} />
                  <span>Track on Map</span>
                </button>

                <button
                  onClick={() => handleStartMission(result.plate)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Crosshair size={16} />
                  <span>Start Mission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
