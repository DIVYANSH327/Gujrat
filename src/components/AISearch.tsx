import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  Filter, 
  User, 
  Car, 
  Hash, 
  Activity, 
  ScanFace, 
  ShieldCheck, 
  CheckCircle2, 
  Camera as CameraIcon,
  Shield,
  FileCheck,
  Compass,
  ArrowRight,
  AlertTriangle,
  Database,
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { mockCameras } from '../mockData';
import { DetectionEvent, normalizeLicensePlate, VehicleJourney, VehicleSighting } from '../types';
import { centralRepo } from '../services/Architecture';
import { VehicleIntelligenceAgent } from '../ai-agents/vehicle/VehicleIntelligenceAgent';
import { federatedCctvService } from '../services/FederatedCctvService';

interface AISearchProps {
  detections: DetectionEvent[];
  onNavigateToGodsEye?: (targetId?: string) => void;
}

export function AISearch({ detections, onNavigateToGodsEye }: AISearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeVehicleJourney, setActiveVehicleJourney] = useState<VehicleJourney | null>(null);
  const [selectedResultType, setSelectedResultType] = useState<'all' | 'vehicles' | 'persons' | 'anpr'>('all');
  const [vehicleLookupDisclaimer, setVehicleLookupDisclaimer] = useState<string | null>(null);

  // Local instance of VehicleIntelligenceAgent for normalization and journey assembly
  const vehicleAgent = React.useMemo(() => new VehicleIntelligenceAgent(), []);

  const handleSearch = (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const qStr = (directQuery !== undefined ? directQuery : query).trim();
    if (!qStr) return;
    if (directQuery !== undefined) setQuery(directQuery);

    setIsSearching(true);
    setHasSearched(true);
    setActiveVehicleJourney(null);
    setVehicleLookupDisclaimer(null);

    setTimeout(() => {
      const q = qStr.toLowerCase();
      const normalizedQ = normalizeLicensePlate(qStr);

      // Search existing centralRepo events (Zero parallel database)
      const centralResults = centralRepo.searchEvents(q);

      // Search mock detection events
      const filteredMock = (detections || []).filter(d => {
        const matchesPlate = d.metadata?.plate?.toLowerCase().includes(q) || 
          (normalizedQ.length >= 4 && normalizeLicensePlate(d.metadata?.plate || '').includes(normalizedQ));
        const matchesClothing = d.metadata?.clothingColor?.toLowerCase().includes(q);
        const matchesType = d.objectType?.toLowerCase().includes(q);
        const matchesCamera = d.cameraId?.toLowerCase().includes(q);
        const matchesTrack = (d as any).targetTrackId?.toLowerCase().includes(q) || (d as any).metadata?.targetTrackId?.toLowerCase().includes(q);
        return matchesPlate || matchesClothing || matchesType || matchesCamera || matchesTrack;
      });

      // Also search plate directly if normalized length >= 4
      if (normalizedQ.length >= 4) {
        const plateEvents = centralRepo.getEventsByPlate(normalizedQ);
        for (const pe of plateEvents) {
          if (!centralResults.some(r => r.eventId === pe.eventId)) {
            centralResults.push(pe);
          }
        }

        // Build journey from existing event architecture
        const journey = vehicleAgent.reconstructVehicleJourney(normalizedQ);
        if (journey && journey.sightings.length > 0) {
          setActiveVehicleJourney(journey);
        } else if (normalizedQ === 'GJ05AB1234') {
          // Synthetic demonstration corridor for wanted vehicle scenario
          const demoSightings: VehicleSighting[] = [
            {
              sightingId: 'SGT-DEMO-01',
              vehicleNumber: 'GJ05AB1234',
              cameraId: 'CAM-AHM-007',
              siteId: 'SITE-STATEWIDE',
              timestamp: '2026-09-05T19:01:22+05:30',
              direction: 'Northbound Entry',
              plateConfidence: 0.98,
              vehicleConfidence: 0.95,
              sourceEdgeNode: 'EDGE-00042',
              eventId: 'EVT-ANPR-007-DEMO'
            },
            {
              sightingId: 'SGT-DEMO-02',
              vehicleNumber: 'GJ05AB1234',
              cameraId: 'CAM-AHM-014',
              siteId: 'SITE-STATEWIDE',
              timestamp: '2026-09-05T19:04:51+05:30',
              direction: 'Southwest Corridor',
              plateConfidence: 0.94,
              vehicleConfidence: 0.92,
              sourceEdgeNode: 'EDGE-00042',
              eventId: 'EVT-CORRIDOR-1'
            },
            {
              sightingId: 'SGT-DEMO-03',
              vehicleNumber: 'GJ05AB1234',
              cameraId: 'CAM-AHM-023',
              siteId: 'SITE-STATEWIDE',
              timestamp: '2026-09-05T19:09:17+05:30',
              direction: 'DGP Perimeter Approach',
              plateConfidence: 0.92,
              vehicleConfidence: 0.90,
              sourceEdgeNode: 'EDGE-00043',
              eventId: 'EVT-CORRIDOR-2'
            },
            {
              sightingId: 'SGT-DEMO-04',
              vehicleNumber: 'GJ05AB1234',
              cameraId: 'CAM-AHM-031',
              siteId: 'SITE-STATEWIDE',
              timestamp: '2026-09-05T19:15:03+05:30',
              direction: 'Riverfront North Bound',
              plateConfidence: 0.90,
              vehicleConfidence: 0.88,
              sourceEdgeNode: 'EDGE-00044',
              eventId: 'EVT-CORRIDOR-3'
            }
          ];

          setActiveVehicleJourney({
            vehicleNumber: 'GJ05AB1234',
            sightings: demoSightings,
            totalSightings: demoSightings.length,
            firstSeen: demoSightings[0].timestamp,
            lastSeen: demoSightings[3].timestamp,
            camerasVisited: 4,
            districtsVisited: 1,
            durationMinutes: 14
          });
        }

        setVehicleLookupDisclaimer(
          'DATABASE LOOKUP: NOT CONNECTED (Production integration requires authorized State Transport Department API credentials)'
        );
      }

      setResults([...centralResults, ...filteredMock]);
      setIsSearching(false);
    }, 350);
  };

  const getCameraName = (id: string) => mockCameras.find(c => c.id === id)?.name || id;

  const quickQueries = [
    { label: 'GJ05AB1234', desc: 'Wanted Vehicle Demo', q: 'GJ05AB1234', icon: <Car size={12} className="text-rose-400" /> },
    { label: 'GJ01AB1234', desc: 'White Sedan Corridor', q: 'GJ01AB1234', icon: <Car size={12} className="text-cyan-400" /> },
    { label: 'P-DEMO-003', desc: 'Person Track (Helmet)', q: 'P-DEMO-003', icon: <User size={12} className="text-amber-400" /> },
    { label: 'CAM-007', desc: 'Airport Circle North', q: 'CAM-007', icon: <CameraIcon size={12} className="text-indigo-400" /> },
    { label: 'LICENSE_PLATE', desc: 'All ANPR Sighting Events', q: 'LICENSE_PLATE', icon: <Hash size={12} className="text-emerald-400" /> }
  ];

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-y-auto custom-scrollbar">
      {/* Search Header Banner */}
      <div className="max-w-5xl mx-auto w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyan-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded font-semibold tracking-wider">
                SEARCHING AUTHORIZED CAMERA GRID
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                FEDERATED EVENT STORE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100 font-mono mt-1">
              SEARCH ALL CAMERAS <span className="text-cyan-400 text-base font-normal">| UNIFIED VEHICLE & TARGET QUERY</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="bg-[#090d16] border border-cyan-950/80 px-3 py-1.5 rounded">
              <div className="text-[9px] font-mono text-zinc-500 uppercase">Actual Connected</div>
              <div className="text-xs font-mono font-bold text-cyan-400">0 PHYSICAL CAMERAS</div>
            </div>
            <div className="bg-[#090d16] border border-cyan-950/80 px-3 py-1.5 rounded">
              <div className="text-[9px] font-mono text-zinc-500 uppercase">Architectural Grid</div>
              <div className="text-xs font-mono font-bold text-zinc-300">80,000 CAPACITY (SIM)</div>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <form onSubmit={(e) => handleSearch(e)} className="mt-4">
          <div className="relative flex items-center">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH REGISTRATION NUMBER (e.g. GJ05AB1234), TARGET TRACK ID, CAMERA, EVENT ID..."
              className="w-full bg-[#0a0e1a] border-2 border-cyan-900/60 focus:border-cyan-400 rounded-lg py-3 pl-11 pr-28 text-sm font-mono tracking-wide text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-lg"
            />
            <div className="absolute left-3.5 text-cyan-400">
              <Search size={18} />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold rounded tracking-wider cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSearching ? (
                <>
                  <Activity size={14} className="animate-spin" />
                  <span>SEARCHING...</span>
                </>
              ) : (
                <>
                  <Search size={14} />
                  <span>SEARCH</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Query Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Quick Queries:</span>
          {quickQueries.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(undefined, chip.q)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#090d16] hover:bg-cyan-950/60 border border-cyan-900/40 hover:border-cyan-700/60 rounded text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
            >
              {chip.icon}
              <span className="font-bold">{chip.label}</span>
              <span className="text-[9px] text-zinc-500 hidden sm:inline">({chip.desc})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Vehicle Journey Card (When a plate search matches trajectory) */}
        {activeVehicleJourney && (
          <div className="bg-[#080d1a] border border-cyan-500/40 rounded-lg p-4 sm:p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-950 border border-cyan-500/60 rounded flex items-center justify-center text-cyan-400">
                  <Car size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-0.2 bg-rose-950/80 text-rose-300 border border-rose-800/60 rounded font-bold tracking-wider">
                      CROSS-CAMERA VEHICLE JOURNEY
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.2 bg-amber-950/80 text-amber-300 border border-amber-800/60 rounded font-semibold">
                      WATCHLIST MATCH
                    </span>
                  </div>
                  <h2 className="text-xl font-black font-mono tracking-wider text-cyan-300 mt-0.5">
                    {activeVehicleJourney.vehicleNumber}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToGodsEye && (
                  <button
                    onClick={() => onNavigateToGodsEye(activeVehicleJourney.vehicleNumber)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                  >
                    <Compass size={14} />
                    <span>OPEN IN GOD'S EYE</span>
                  </button>
                )}
                <div className="text-right pl-3 border-l border-cyan-900/40">
                  <div className="text-[9px] font-mono text-zinc-500 uppercase">Trajectory Corridor</div>
                  <div className="text-xs font-mono font-bold text-zinc-200">
                    {activeVehicleJourney.camerasVisited} CAMERAS • {activeVehicleJourney.durationMinutes} MIN
                  </div>
                </div>
              </div>
            </div>

            {/* Trajectory Timeline Sightings */}
            <div className="mt-4">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Corridor Trajectory Sightings (Chronological Sighting Order)</span>
                <span className="text-[9px] text-cyan-400">4 OF 4 SOURCES SYNCHRONIZED</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {activeVehicleJourney.sightings.map((sighting, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-[#060a14] border border-cyan-900/50 hover:border-cyan-500/60 rounded relative group transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 rounded font-bold">
                        STOP #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-semibold">
                        {new Date(sighting.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-bold text-zinc-100 flex items-center gap-1">
                      <CameraIcon size={12} className="text-cyan-400" />
                      <span>{sighting.cameraId}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {getCameraName(sighting.cameraId)}
                    </div>

                    <div className="mt-2 pt-2 border-t border-cyan-950/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Direction</span>
                      <span className="text-zinc-300">{sighting.direction || 'Corridor'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-0.5">
                      <span>Plate Conf</span>
                      <span className="text-emerald-400 font-bold">{(sighting.plateConfidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Authorized Database Lookup Abstraction Note */}
            {vehicleLookupDisclaimer && (
              <div className="mt-3.5 px-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <Database size={13} className="text-zinc-500 shrink-0" />
                <span>{vehicleLookupDisclaimer}</span>
              </div>
            )}
          </div>
        )}

        {/* Investigation Time-Saving & Architecture Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-4">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <AlertTriangle size={14} />
              <span>Current Problem: Fragmented Department Silos</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Gujarat's CCTV footprint is distributed across City Police Commissionerates, Municipal Traffic ITMS, and Highway toll corridors. Investigating vehicle movements currently requires manual phone calls, physically visiting local NVRs, and exporting disparate proprietary video formats.
            </p>
            <div className="mt-3 text-[10px] font-mono text-zinc-500 bg-[#05080f] p-2 rounded border border-zinc-800/80">
              ❌ Manual exports • Fragmented VMS systems • Delayed multi-hour turnaround
            </div>
          </div>

          <div className="bg-[#080d16] border border-cyan-950/80 rounded-lg p-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              <span>Target Workflow: Coordinated Intelligence Layer</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ONE SEARCH → AUTHORIZED CONNECTED SOURCES → MATCHED SIGHTINGS → TIMELINE → EVIDENCE → ALERTS → GOD'S EYE.
              Edge Agents standardize optical ANPR metadata at the edge without saturating inter-city WAN connections.
            </p>
            <div className="mt-3 text-[10px] font-mono text-emerald-400 bg-[#05080f] p-2 rounded border border-emerald-950/50 flex items-center justify-between">
              <span>✓ Single Unified Query over EventStore</span>
              <span className="text-[9px] text-zinc-500 font-normal">No parallel database</span>
            </div>
          </div>
        </div>

        {/* Search Results List */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                SEARCH RESULTS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 rounded">
                {results.length} MATCHES
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              SOURCE: CentralEventStore & Authorized Feeds
            </div>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-cyan-950/80 rounded-lg bg-[#060912]/50">
              <Search className="w-10 h-10 text-zinc-600 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-mono text-zinc-400">
                {hasSearched ? 'No matching events found for the specified query.' : 'Enter a vehicle registration number or select a quick query above.'}
              </p>
              <p className="text-xs text-zinc-600 font-mono mt-1">
                Try searching <span className="text-cyan-400">GJ05AB1234</span> for the Wanted Vehicle trajectory scenario.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.map((item, idx) => {
                const isCentralEvent = !!item.eventId;
                const eventId = item.eventId || item.id || `EVT-${idx}`;
                const plate = item.metadata?.plate || item.metadata?.normalizedPlate;
                const camId = item.cameraId;
                const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleString('en-IN') : 'Live';
                const eventType = item.eventType || item.objectType || 'DETECTION';
                const confidence = item.confidence || 0.90;

                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-[#080d16] hover:bg-[#0b1220] border border-cyan-950/80 hover:border-cyan-800/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#0e1626] border border-cyan-900/50 rounded flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                        {plate ? <Car size={18} /> : <User size={18} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-zinc-100">
                            {plate ? `PLATE: ${plate}` : `TARGET: ${item.targetTrackId || 'ANONYMOUS'}`}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 rounded">
                            {eventType}
                          </span>
                          {item.priority && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                              item.priority === 'critical' ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40' : 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                            }`}>
                              {item.priority}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
                          <span className="flex items-center gap-1">
                            <CameraIcon size={12} className="text-cyan-400" />
                            <span>{camId} ({getCameraName(camId)})</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-zinc-500" />
                            <span>{timeStr}</span>
                          </span>
                        </div>

                        {item.metadata?.location && (
                          <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={11} className="text-zinc-600" />
                            <span>{item.metadata.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-cyan-950/60">
                      <div className="text-right">
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">Confidence</div>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {(confidence * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="text-[9px] font-mono text-zinc-500">
                        ID: {eventId.slice(-12)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
