import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { incidentCommandService } from '../services/IncidentCommandService';
import { sysEvents } from '../services/Architecture';
import { IncidentRecord, IncidentStatus, IncidentSeverity, IncidentType } from '../types';

interface IncidentCommandViewProps {
  initialIncidentId?: string;
  onNavigate?: (view: string) => void;
}

export const IncidentCommandView: React.FC<IncidentCommandViewProps> = ({ 
  initialIncidentId,
  onNavigate 
}) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIncidentId || '');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Decision Form State
  const [decisionAction, setDecisionAction] = useState('DISPATCH_PATROL');
  const [decisionJustification, setDecisionJustification] = useState('');
  const [decisionOfficer, setDecisionOfficer] = useState('Inspector V. Jadeja');

  // New Incident Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<IncidentType>('WATCHLIST_CANDIDATE');
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('HIGH');
  const [newLocation, setNewLocation] = useState('SG Highway Junction 4');

  const refreshIncidents = () => {
    const list = incidentCommandService.listIncidents();
    setIncidents(list);
    if (!selectedIncidentId && list.length > 0) {
      setSelectedIncidentId(list[0].incidentId);
    }
  };

  useEffect(() => {
    refreshIncidents();
    const unsub = sysEvents.on('INCIDENT_UPDATED', refreshIncidents);
    const unsub2 = sysEvents.on('INCIDENT_CREATED', refreshIncidents);
    return () => {
      unsub();
      unsub2();
    };
  }, []);

  useEffect(() => {
    if (initialIncidentId) {
      setSelectedIncidentId(initialIncidentId);
    }
  }, [initialIncidentId]);

  const filteredIncidents = incidents.filter(i => {
    if (filterStatus === 'ALL') return true;
    return i.status === filterStatus;
  });

  const selectedIncident = incidents.find(i => i.incidentId === selectedIncidentId) || filteredIncidents[0];

  const handleStatusTransition = (newStatus: IncidentStatus) => {
    if (!selectedIncident) return;
    incidentCommandService.updateIncidentStatus(
      selectedIncident.incidentId,
      newStatus,
      decisionOfficer,
      `Manual status change to ${newStatus}`
    );
    refreshIncidents();
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !decisionJustification.trim()) return;

    incidentCommandService.addDecision(
      selectedIncident.incidentId,
      decisionOfficer,
      decisionAction,
      decisionJustification.trim()
    );

    setDecisionJustification('');
    refreshIncidents();
  };

  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = incidentCommandService.createIncident({
      title: newTitle.trim(),
      type: newType,
      severity: newSeverity,
      location: newLocation.trim(),
      district: 'Ahmedabad'
    });

    setShowCreateModal(false);
    refreshIncidents();
    setSelectedIncidentId(created.incidentId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">OPERATIONAL INCIDENT COMMAND & TRIAGE</h1>
              <p className="text-xs text-slate-400">Statewide priority dispatch, live timeline tracking, and accountable officer decisions</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Incident</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'INVESTIGATING', 'AWAITING_HUMAN_REVIEW', 'ASSIGNED', 'RESOLVED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              filterStatus === status 
                ? 'bg-rose-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Main Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredIncidents.map((inc, idx) => {
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
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{inc.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 mt-2 border-t border-slate-800/80">
                    <span className="text-[11px]">{inc.type.replace(/_/g, ' ')}</span>
                    <span className="text-[11px] font-semibold text-indigo-400">{inc.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Detail (8 cols) */}
        {selectedIncident && (
          <div className="lg:col-span-8 space-y-6">
            {/* Header Detail Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
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
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedIncident.title}</h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
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
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition"
                    >
                      Resolve Incident
                    </button>
                  )}
                  {selectedIncident.status !== 'ESCALATED' && selectedIncident.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusTransition('ESCALATED')}
                      className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded text-xs font-semibold transition"
                    >
                      Escalate
                    </button>
                  )}
                </div>
              </div>

              {/* Cameras & Target Plates */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Involved CCTV Nodes:</span>
                  <span className="font-mono text-cyan-400 font-medium">
                    {selectedIncident.cameraIds.length > 0 ? selectedIncident.cameraIds.join(', ') : 'None assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Target Vehicle Plates:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {selectedIncident.vehiclePlates.length > 0 ? selectedIncident.vehiclePlates.join(', ') : 'None registered'}
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
                {selectedIncident.timeline.map((item, idx) => (
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
                ))}
              </div>
            </div>

            {/* Officer Decision Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Accountable Officer Decision Log</span>
              </h3>

              {/* Existing Decisions */}
              {selectedIncident.decisions.length > 0 && (
                <div className="space-y-3 mb-6">
                  {selectedIncident.decisions.map((dec, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs">
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
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
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center space-x-1.5 shadow transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Record Officer Decision</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Log Operational Incident</h3>
            <form onSubmit={handleCreateIncidentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Incident Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Red SUV Wrong-Way Ingress on SG Highway"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as IncidentType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Location</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-500 shadow"
                >
                  Log Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
