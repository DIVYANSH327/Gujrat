import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertOctagon, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  UserCheck, 
  CheckCircle2, 
  Send, 
  Plus, 
  FileText,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  Database,
  RefreshCw,
  Eye,
  Camera,
  Car,
  Tag,
  Shield,
  SlidersHorizontal
} from 'lucide-react';
import { incidentCommandService } from '../services/IncidentCommandService';
import { firestoreIncidentService } from '../services/FirestoreIncidentService';
import { sysEvents } from '../services/Architecture';
import { IncidentRecord, IncidentStatus, IncidentSeverity, IncidentType } from '../types';
import { useSentinelAuth } from '../hooks/useSentinelAuth';

interface IncidentCommandViewProps {
  initialIncidentId?: string;
  onNavigate?: (view: string) => void;
}

export type DateFilterOption = 'ALL' | 'TODAY' | 'LAST_24H' | 'LAST_7D' | 'CUSTOM';

export const IncidentCommandView: React.FC<IncidentCommandViewProps> = ({ 
  initialIncidentId,
  onNavigate 
}) => {
  const { officer, canManageIncidents } = useSentinelAuth();

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIncidentId || '');
  const [syncSource, setSyncSource] = useState<'FIRESTORE_LIVE' | 'LOCAL_FALLBACK'>('LOCAL_FALLBACK');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtering State
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [dateFilterOption, setDateFilterOption] = useState<DateFilterOption>('ALL');
  const [customDate, setCustomDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Decision Form State
  const [decisionAction, setDecisionAction] = useState('DISPATCH_PATROL');
  const [decisionJustification, setDecisionJustification] = useState('');
  const [decisionOfficer, setDecisionOfficer] = useState(
    officer?.displayName || 'Inspector V. Jadeja'
  );

  // Keep officer updated if auth changes
  useEffect(() => {
    if (officer?.displayName) {
      setDecisionOfficer(officer.displayName);
    }
  }, [officer]);

  // New Incident Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<IncidentType>('WATCHLIST_CANDIDATE');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('HIGH');
  const [newLocation, setNewLocation] = useState('SG Highway Junction 4');
  const [newPlates, setNewPlates] = useState('');
  const [newCameras, setNewCameras] = useState('');

  // Subscribe to Real-Time Cloud Firestore incidents with local fallback
  useEffect(() => {
    setIsRefreshing(true);
    const unsubscribe = firestoreIncidentService.subscribeToRealtimeIncidents(
      (data, source) => {
        setIncidents(data);
        setSyncSource(source);
        setIsRefreshing(false);
        if (data.length > 0 && !selectedIncidentId) {
          setSelectedIncidentId(data[0].incidentId);
        }
      },
      () => {
        setIsRefreshing(false);
      }
    );

    // Also listen to local bus events for instant optimistic UI responses
    const unsubUpdate = sysEvents.on('INCIDENT_UPDATED', () => {
      setIncidents(incidentCommandService.listIncidents());
    });
    const unsubCreate = sysEvents.on('INCIDENT_CREATED', () => {
      setIncidents(incidentCommandService.listIncidents());
    });

    return () => {
      unsubscribe();
      unsubUpdate();
      unsubCreate();
    };
  }, []);

  useEffect(() => {
    if (initialIncidentId) {
      setSelectedIncidentId(initialIncidentId);
    }
  }, [initialIncidentId]);

  // Comprehensive Date & Status & Search Filter Logic
  const filteredIncidents = useMemo(() => {
    const now = new Date();

    return incidents.filter(inc => {
      // 1. Status Filter
      if (filterStatus !== 'ALL' && inc.status !== filterStatus) {
        return false;
      }

      // 2. Severity Filter
      if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) {
        return false;
      }

      // 3. Date Filter
      const detectedDate = new Date(inc.detectedAt);
      if (dateFilterOption === 'TODAY') {
        const isToday = 
          detectedDate.getDate() === now.getDate() &&
          detectedDate.getMonth() === now.getMonth() &&
          detectedDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilterOption === 'LAST_24H') {
        const diffMs = now.getTime() - detectedDate.getTime();
        if (diffMs > 24 * 60 * 60 * 1000) return false;
      } else if (dateFilterOption === 'LAST_7D') {
        const diffMs = now.getTime() - detectedDate.getTime();
        if (diffMs > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (dateFilterOption === 'CUSTOM' && customDate) {
        const customDateObj = new Date(customDate);
        const matchesCustom = 
          detectedDate.getDate() === customDateObj.getDate() &&
          detectedDate.getMonth() === customDateObj.getMonth() &&
          detectedDate.getFullYear() === customDateObj.getFullYear();
        if (!matchesCustom) return false;
      }

      // 4. Keyword Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = inc.incidentId.toLowerCase().includes(q);
        const matchesTitle = inc.title.toLowerCase().includes(q);
        const matchesLoc = inc.location.toLowerCase().includes(q);
        const matchesDistrict = inc.district?.toLowerCase().includes(q);
        const matchesPlates = inc.vehiclePlates?.some(p => p.toLowerCase().includes(q));
        const matchesCameras = inc.cameraIds?.some(c => c.toLowerCase().includes(q));
        if (!matchesId && !matchesTitle && !matchesLoc && !matchesDistrict && !matchesPlates && !matchesCameras) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, filterStatus, filterSeverity, dateFilterOption, customDate, searchQuery]);

  const selectedIncident = useMemo(() => {
    return incidents.find(i => i.incidentId === selectedIncidentId) || filteredIncidents[0] || null;
  }, [incidents, selectedIncidentId, filteredIncidents]);

  const handleStatusTransition = async (newStatus: IncidentStatus) => {
    if (!selectedIncident) return;
    
    // 1. Update in local in-memory command service
    incidentCommandService.updateIncidentStatus(
      selectedIncident.incidentId,
      newStatus,
      decisionOfficer,
      `Manual status change to ${newStatus}`
    );

    // 2. Persist in Cloud Firestore in real-time
    await firestoreIncidentService.updateIncidentStatus(
      selectedIncident,
      newStatus,
      decisionOfficer,
      `Manual status change to ${newStatus}`
    );
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !decisionJustification.trim()) return;

    // 1. Update local service
    incidentCommandService.addDecision(
      selectedIncident.incidentId,
      decisionOfficer,
      decisionAction,
      decisionJustification.trim()
    );

    // 2. Persist in Cloud Firestore
    await firestoreIncidentService.addDecision(
      selectedIncident,
      decisionOfficer,
      decisionAction,
      decisionJustification.trim()
    );

    setDecisionJustification('');
  };

  const handleCreateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const plates = newPlates
      .split(',')
      .map(p => p.trim().toUpperCase())
      .filter(Boolean);

    const cameras = newCameras
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    // 1. Create in local service
    const created = incidentCommandService.createIncident({
      title: newTitle.trim(),
      type: newType,
      severity: newSeverity,
      location: newLocation.trim(),
      district: 'Ahmedabad',
      vehiclePlates: plates,
      cameraIds: cameras,
      initialActor: decisionOfficer
    });

    // 2. Persist to Cloud Firestore
    await firestoreIncidentService.createIncident(created);

    setShowCreateModal(false);
    setSelectedIncidentId(created.incidentId);
    setNewTitle('');
    setNewPlates('');
    setNewCameras('');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header with Live Sync Status & New Incident CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">OPERATIONAL INCIDENT COMMAND & TRIAGE</h1>
                {/* Real-time Firestore Connection Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                  syncSource === 'FIRESTORE_LIVE'
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-950/70 border-amber-500/40 text-amber-400'
                }`}>
                  <Database size={11} className={syncSource === 'FIRESTORE_LIVE' ? 'text-emerald-400' : 'text-amber-400'} />
                  <span>{syncSource === 'FIRESTORE_LIVE' ? 'FIRESTORE REAL-TIME' : 'LOCAL CACHE'}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${syncSource === 'FIRESTORE_LIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time Cloud Firestore incident reports, chronological audit trails, and accountable officer decisions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            title="Refresh Incidents"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
          </button>

          <button
            id="create-new-incident-button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Incident</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar: Status, Date, Severity & Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow space-y-3">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Filter size={12} />
              <span>Status:</span>
            </span>
            {['ALL', 'INVESTIGATING', 'AWAITING_HUMAN_REVIEW', 'ASSIGNED', 'ESCALATED', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap text-xs ${
                  filterStatus === st 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, plate, location, camera..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Date Filter & Severity Row */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
              <Calendar size={12} />
              <span>Date:</span>
            </span>

            {(['ALL', 'TODAY', 'LAST_24H', 'LAST_7D', 'CUSTOM'] as DateFilterOption[]).map(opt => (
              <button
                key={opt}
                onClick={() => setDateFilterOption(opt)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  dateFilterOption === opt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {opt === 'ALL' ? 'All Time' :
                 opt === 'TODAY' ? 'Today' :
                 opt === 'LAST_24H' ? 'Last 24 Hours' :
                 opt === 'LAST_7D' ? 'Last 7 Days' : 'Pick Date'}
              </button>
            ))}

            {/* Custom Date Input */}
            {dateFilterOption === 'CUSTOM' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:border-blue-500 ml-1"
              />
            )}
          </div>

          {/* Severity Dropdown Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Severity:</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <span className="text-slate-500 text-[11px] ml-2">
              Showing <span className="font-bold text-white">{filteredIncidents.length}</span> of {incidents.length} reports
            </span>
          </div>
        </div>
      </div>

      {/* Main Master-Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 space-y-2">
                <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No incident reports match filters</p>
                <p className="text-xs text-slate-500">Try changing status, date range, or clear your search term.</p>
                <button
                  onClick={() => {
                    setFilterStatus('ALL');
                    setDateFilterOption('ALL');
                    setFilterSeverity('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredIncidents.map((inc, idx) => {
                const isSelected = inc.incidentId === selectedIncident?.incidentId;
                return (
                  <div
                    key={`${inc.incidentId}-${idx}`}
                    onClick={() => setSelectedIncidentId(inc.incidentId)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected 
                        ? 'bg-slate-800 border-rose-500 shadow-md ring-1 ring-rose-500/30' 
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-slate-300">{inc.incidentId}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        inc.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1">{inc.title}</h3>
                    <div className="flex items-center text-xs text-slate-400 space-x-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                      <span className="truncate">{inc.location}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 mt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock size={11} className="text-slate-500" />
                        <span>{new Date(inc.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-400">{inc.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Incident Detail (8 cols) */}
        {selectedIncident ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Header Detail Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {selectedIncident.incidentId}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      selectedIncident.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      selectedIncident.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {selectedIncident.severity}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedIncident.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(selectedIncident.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{selectedIncident.location} ({selectedIncident.district})</span>
                  </p>
                </div>

                {/* Status Transition Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {selectedIncident.status.replace(/_/g, ' ')}
                  </span>
                  {selectedIncident.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusTransition('RESOLVED')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      Resolve Incident
                    </button>
                  )}
                  {selectedIncident.status !== 'ESCALATED' && selectedIncident.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusTransition('ESCALATED')}
                      className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Escalate
                    </button>
                  )}
                </div>
              </div>

              {/* Cameras & Target Plates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-semibold">
                    <Camera size={13} className="text-cyan-400" />
                    <span>Involved CCTV Nodes:</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-medium">
                    {selectedIncident.cameraIds && selectedIncident.cameraIds.length > 0 
                      ? selectedIncident.cameraIds.join(', ') 
                      : 'None assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-semibold">
                    <Car size={13} className="text-indigo-400" />
                    <span>Target Vehicle Plates:</span>
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">
                    {selectedIncident.vehiclePlates && selectedIncident.vehiclePlates.length > 0 
                      ? selectedIncident.vehiclePlates.join(', ') 
                      : 'None registered'}
                  </span>
                </div>
              </div>
            </div>

            {/* Incident Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Operational Timeline & Audit Log</span>
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2.5 before:w-0.5 before:bg-slate-800">
                {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                  selectedIncident.timeline.map((item, idx) => (
                    <div key={idx} className="relative pl-7 text-xs">
                      <div className="absolute left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{item.actor}</span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-0.5">{item.action}</p>
                      {item.notes && (
                        <p className="text-slate-400 italic mt-0.5 font-mono">Note: {item.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No timeline progression events logged yet.</p>
                )}
              </div>
            </div>

            {/* Officer Decision Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Accountable Officer Decision Log</span>
              </h3>

              {/* Existing Decisions */}
              {selectedIncident.decisions && selectedIncident.decisions.length > 0 && (
                <div className="space-y-3 mb-6">
                  {selectedIncident.decisions.map((dec, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-400">{dec.decision}</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {new Date(dec.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mb-1">{dec.justification}</p>
                      <span className="text-[10px] text-slate-400 block">Authorized by: {dec.officer}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Decision Form */}
              <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Decision Action</label>
                    <select
                      value={decisionAction}
                      onChange={(e) => setDecisionAction(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="DISPATCH_PATROL">DISPATCH PATROL UNIT</option>
                      <option value="INTERCEPT_COORDINATION_ORDERED">ORDER INTERCEPT CORRIDOR</option>
                      <option value="SUMMONS_ISSUED">ISSUE NOTICE / SUMMONS</option>
                      <option value="DISMISS_FALSE_ALARM">DISMISS AS FALSE ALARM</option>
                      <option value="ESCALATE_TO_SP">ESCALATE TO SUPERINTENDENT OF POLICE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Authorizing Officer</label>
                    <input
                      type="text"
                      value={decisionOfficer}
                      onChange={(e) => setDecisionOfficer(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Justification & Legal Rationale (Mandatory)</label>
                  <textarea
                    required
                    rows={2}
                    value={decisionJustification}
                    onChange={(e) => setDecisionJustification(e.target.value)}
                    placeholder="Enter formal justification for operational record..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Record Officer Decision in Firestore</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
            Select an incident report from the list to view operational telemetry and decision log.
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                <span>Log Operational Incident</span>
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Firestore Synced
              </span>
            </div>

            <form onSubmit={handleCreateIncidentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Incident Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Red SUV Wrong-Way Ingress on SG Highway"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as IncidentType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="WATCHLIST_CANDIDATE">WATCHLIST CANDIDATE</option>
                    <option value="DANGEROUS_DRIVING">DANGEROUS DRIVING</option>
                    <option value="TRAFFIC_VIOLATION">TRAFFIC VIOLATION</option>
                    <option value="CAMERA_OUTAGE">CAMERA OUTAGE</option>
                    <option value="MISSING_VEHICLE">MISSING VEHICLE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Location / Landmark</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Pakwan Cross Road, SG Highway, Ahmedabad"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Target Plate(s) (comma separated)</label>
                  <input
                    type="text"
                    value={newPlates}
                    onChange={(e) => setNewPlates(e.target.value)}
                    placeholder="e.g. GJ01AB1234, GJ05CD5678"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">CCTV Camera ID(s) (comma separated)</label>
                  <input
                    type="text"
                    value={newCameras}
                    onChange={(e) => setNewCameras(e.target.value)}
                    placeholder="e.g. CAM-007, CAM-014"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-500 shadow cursor-pointer"
                >
                  Log & Sync Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentCommandView;
