import React, { useState, useEffect } from 'react';
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
  Layers,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { DetectionEvent, normalizeLicensePlate } from '../types';
import { StatusBadge } from './ui/OfficerPrimitives';

interface VerifiedObservation {
  observationId: string;
  vehicleObservationId?: string;
  plateObservationId?: string;
  cameraId: string;
  cameraName?: string;
  district?: string;
  location?: string;
  timestamp: string;
  frameTimestamp?: number;
  rawPlateText: string;
  normalizedPlateText: string;
  plateStatus?: string;
  ocrStatus?: string;
  ocrConfidence?: number;
  vehicleType?: string;
  vehicleColor?: string;
  vehicleMake?: string;
  direction?: string;
  confidence: number;
  evidenceId?: string;
  originalFrameHash?: string;
  sourceId?: string;
  sourceType?: string;
  verificationState: 'OBSERVED' | 'INFERRED' | 'UNCERTAIN';
  statutoryCompliance?: string;
}

interface SearchResponse {
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  normalizedQuery: string;
  results: VerifiedObservation[];
  message?: string;
}

interface AISearchProps {
  detections?: DetectionEvent[];
  onNavigateToGodsEye?: (targetId?: string) => void;
  onNavigate?: (viewId: string) => void;
  onSelectMission?: (missionId: string) => void;
}

export function AISearch({ 
  onNavigateToGodsEye, 
  onNavigate, 
  onSelectMission 
}: AISearchProps) {
  const [query, setQuery] = useState('GJ01AB1234');
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<VerifiedObservation | null>(null);
  const [missionStartedMsg, setMissionStartedMsg] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const filterChips = [
    'Today',
    'Last 24 Hours',
    'Last 7 Days',
    'Ahmedabad',
    'Surat',
    'Vadodara'
  ];

  const executeSearch = async (plateToQuery: string, filterToUse = selectedFilter) => {
    const raw = plateToQuery.trim();
    if (!raw) return;

    setIsSearching(true);
    setSearchError(null);
    setMissionStartedMsg(null);

    try {
      let timeRangeParam = 'ALL';
      let districtParam: string | undefined = undefined;

      if (filterToUse === 'Today') timeRangeParam = 'TODAY';
      else if (filterToUse === 'Last 24 Hours') timeRangeParam = 'LAST_24_HOURS';
      else if (filterToUse === 'Last 7 Days') timeRangeParam = 'LAST_7_DAYS';
      else if (filterToUse === 'Ahmedabad' || filterToUse === 'Surat' || filterToUse === 'Vadodara') {
        districtParam = filterToUse;
      }

      const res = await fetch('/api/investigation/vehicle-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: raw,
          timeRange: timeRangeParam,
          district: districtParam,
          limit: 25,
          page: 1
        })
      });

      if (!res.ok) {
        throw new Error(`Search service responded with HTTP ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setSearchResponse(data);
      setHasSearched(true);
      if (data.results && data.results.length > 0) {
        setSelectedObservation(data.results[0]);
      } else {
        setSelectedObservation(null);
      }
    } catch (err: any) {
      console.error('[AISearch] Search failed:', err);
      setSearchError(err?.message || 'Failed to connect to surveillance repository.');
      setSearchResponse(null);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Initial query on mount
    executeSearch('GJ01AB1234', 'Today');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, selectedFilter);
  };

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
    executeSearch(query, filter);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleStartMission = (plate: string) => {
    setMissionStartedMsg(`Initiating tracking mission for verified target ${plate}...`);
    if (onSelectMission) {
      setTimeout(() => onSelectMission(`MSN-${plate}`), 600);
    } else if (onNavigate) {
      setTimeout(() => onNavigate('missions'), 600);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Vehicle Search & Observations
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Verified license plate sightings and spatial observations across Gujarat Police CCTV network
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              Validation Environment · ~30 Cameras
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Enter License Plate (e.g. GJ01AB1234, GJ05XY6789, GJ27AX9999)"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
        </form>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase mr-1">Filter:</span>
          {filterChips.map((chip) => {
            const isSelected = selectedFilter === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => handleFilterClick(chip)}
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

      {/* Mission Started Banner */}
      {missionStartedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="text-emerald-600" size={20} />
          <span>{missionStartedMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {searchError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 text-sm font-semibold shadow-xs">
          <AlertCircle className="text-rose-600" size={20} />
          <span>{searchError}</span>
        </div>
      )}

      {/* 3. Search Results State */}
      {hasSearched && (
        <>
          {searchResponse && searchResponse.results.length > 0 ? (
            <div className="space-y-6">
              {/* Primary Focused Sighting */}
              {selectedObservation && (
                <div className="bg-white rounded-2xl border-2 border-blue-500/30 p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge 
                          status={selectedObservation.verificationState === 'OBSERVED' ? 'VERIFIED' : 'REVIEW_REQUIRED'} 
                          label={selectedObservation.verificationState === 'OBSERVED' ? 'VERIFIED OBSERVATION' : 'INFERRED'} 
                          size="sm" 
                        />
                        <span className="text-xs font-semibold text-slate-500">
                          OCR Confidence: {Math.round(selectedObservation.confidence * 100)}%
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 font-mono tracking-wide">
                        Target Plate: {selectedObservation.normalizedPlateText || selectedObservation.rawPlateText}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>Obs ID: {selectedObservation.observationId}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Live Camera Snapshot Container */}
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                      <img
                        src={`/api/cameras/${selectedObservation.cameraId}/thumbnail`}
                        alt={`Snapshot ${selectedObservation.cameraId}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Graceful fallback to camera badge if binary frame not loaded
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center pointer-events-none bg-slate-900/40">
                        <CameraIcon className="w-8 h-8 text-cyan-400 mb-1" />
                        <span className="text-xs font-mono font-bold text-white">{selectedObservation.cameraId}</span>
                        <span className="text-[10px] text-slate-300">{selectedObservation.location}</span>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white px-2 py-0.5 rounded text-xs font-mono border border-slate-700">
                        {new Date(selectedObservation.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    {/* Structured Sighting Metadata */}
                    <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">Vehicle Class</span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObservation.vehicleType || 'Vehicle'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">District</span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObservation.district || 'Ahmedabad'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">Direction</span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedObservation.direction || 'Corridor Transit'}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">Sighting Timestamp</span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                            {new Date(selectedObservation.timestamp).toLocaleString()}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">Camera Node</span>
                          <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">{selectedObservation.cameraId}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-semibold text-slate-500 uppercase text-[10px]">HSRP Verification</span>
                          <p className="text-sm font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 size={13} /> {selectedObservation.plateStatus || 'CONFIRMED'}
                          </p>
                        </div>
                      </div>

                      {/* Cryptographic SHA-256 Integrity Bar */}
                      {selectedObservation.originalFrameHash && (
                        <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Shield size={13} /> BSA Sec. 63 Electronic Evidence Hash
                            </span>
                            <button
                              onClick={() => handleCopyHash(selectedObservation.originalFrameHash!)}
                              className="hover:text-cyan-200 flex items-center gap-1 text-[10px] cursor-pointer"
                            >
                              {copiedHash === selectedObservation.originalFrameHash ? (
                                <span className="text-emerald-400 flex items-center gap-0.5"><Check size={12} /> COPIED</span>
                              ) : (
                                <span className="flex items-center gap-0.5"><Copy size={12} /> COPY SHA-256</span>
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate select-all">
                            {selectedObservation.originalFrameHash}
                          </p>
                        </div>
                      )}

                      {/* Action Triggers */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('vehicle_investigation');
                            }
                          }}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                        >
                          <FileCheck size={16} />
                          <span>Unified Investigation</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onNavigateToGodsEye) {
                              onNavigateToGodsEye(selectedObservation.normalizedPlateText);
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
                          onClick={() => handleStartMission(selectedObservation.normalizedPlateText)}
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

              {/* All Observations Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    <span>All Sighting Observations ({searchResponse.results.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Filter: {selectedFilter}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-y border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Camera</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Plate Text</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {searchResponse.results.map((obs) => {
                        const isSelected = selectedObservation?.observationId === obs.observationId;
                        return (
                          <tr 
                            key={obs.observationId} 
                            onClick={() => setSelectedObservation(obs)}
                            className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/70 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-900 whitespace-nowrap">
                              {new Date(obs.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 text-cyan-700 font-bold whitespace-nowrap">
                              {obs.cameraId}
                            </td>
                            <td className="py-2.5 px-3 font-sans truncate max-w-[200px]">
                              {obs.location}
                            </td>
                            <td className="py-2.5 px-3 text-blue-700 font-bold">
                              {obs.normalizedPlateText || obs.rawPlateText}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {obs.verificationState}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {Math.round(obs.confidence * 100)}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedObservation(obs);
                                }}
                                className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Honest Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  NO VERIFIED VEHICLE OBSERVATIONS
                </h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  No verified CCTV camera observations matching <strong className="text-slate-800 font-mono">"{query}"</strong> were recorded in the surveillance mesh for the selected window (<span className="font-semibold">{selectedFilter}</span>).
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 max-w-md mx-auto text-left text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl">
                <div className="font-bold uppercase tracking-wider text-slate-500 text-[11px] flex items-center gap-1.5">
                  <Info size={14} className="text-blue-600" /> Operational Guidance
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                  <li>Expand time filter to <strong>Last 7 Days</strong> or search across all corridors.</li>
                  <li>Verify plate characters conform to standard High Security Registration Plate (HSRP) format.</li>
                  <li>Check camera health status on the Cameras dashboard for active ANPR ingestion.</li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
