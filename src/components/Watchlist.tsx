import React, { useState } from 'react';
import { 
  Car, 
  User, 
  Search, 
  Plus, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Trash2, 
  Crosshair, 
  History, 
  CheckCircle2, 
  Eye, 
  X,
  ScanFace,
  FileText
} from 'lucide-react';
import { StatusBadge } from './ui/OfficerPrimitives';

interface VehicleTarget {
  id: string;
  plate: string;
  reason: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  dateAdded: string;
  status: 'ACTIVE' | 'INACTIVE';
  vehicleType: string;
  color: string;
}

interface PersonTarget {
  id: string;
  name: string;
  aliasCase: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  lastSeen: string;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string;
}

interface WatchlistProps {
  onNavigate?: (view: string) => void;
}

export function Watchlist({ onNavigate }: WatchlistProps) {
  const [activeTab, setActiveTab] = useState<'VEHICLES' | 'PERSONS'>('VEHICLES');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Vehicles Watchlist as specified in prompt
  const [vehicles, setVehicles] = useState<VehicleTarget[]>([
    {
      id: 'V-001',
      plate: 'GJ01AB1234',
      reason: 'Stolen Vehicle',
      riskLevel: 'HIGH',
      dateAdded: 'Yesterday',
      status: 'ACTIVE',
      vehicleType: 'Motorcycle',
      color: 'Black'
    },
    {
      id: 'V-002',
      plate: 'GJ05XY6789',
      reason: 'Wanted in Hit and Run Case #892',
      riskLevel: 'CRITICAL',
      dateAdded: '3 days ago',
      status: 'ACTIVE',
      vehicleType: 'Sedan',
      color: 'Silver'
    },
    {
      id: 'V-003',
      plate: 'GJ27CD5544',
      reason: 'Suspicious Reconnaissance - SG Highway',
      riskLevel: 'MEDIUM',
      dateAdded: '5 days ago',
      status: 'ACTIVE',
      vehicleType: 'SUV',
      color: 'White'
    }
  ]);

  // Initial Persons Watchlist as specified in prompt
  const [persons, setPersons] = useState<PersonTarget[]>([
    {
      id: 'P-001',
      name: 'Unknown Suspect',
      aliasCase: 'Case #412',
      riskLevel: 'CRITICAL',
      lastSeen: 'Ahmedabad',
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    },
    {
      id: 'P-002',
      name: 'Synthetic Subject Bravo',
      aliasCase: 'FIR #102/2026',
      riskLevel: 'HIGH',
      lastSeen: 'Surat',
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
    }
  ]);

  // Add Modals
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPlate, setNewPlate] = useState('');
  const [newReason, setNewReason] = useState('Stolen Vehicle');
  const [newRisk, setNewRisk] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');

  // Person Add Form
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonCase, setNewPersonCase] = useState('');
  const [newPersonLocation, setNewPersonLocation] = useState('Ahmedabad');

  // History / Matches Modal
  const [historyModalTarget, setHistoryModalTarget] = useState<VehicleTarget | null>(null);
  const [matchesModalPerson, setMatchesModalPerson] = useState<PersonTarget | null>(null);

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPersons = persons.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.aliasCase.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.lastSeen.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    setVehicles([
      {
        id: `V-${Date.now()}`,
        plate: newPlate.trim().toUpperCase(),
        reason: newReason,
        riskLevel: newRisk,
        dateAdded: 'Today',
        status: 'ACTIVE',
        vehicleType: 'Vehicle',
        color: 'Unspecified'
      },
      ...vehicles
    ]);
    setNewPlate('');
    setShowAddVehicleModal(false);
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    setPersons([
      {
        id: `P-${Date.now()}`,
        name: newPersonName,
        aliasCase: newPersonCase || 'General Investigation',
        riskLevel: newRisk,
        lastSeen: newPersonLocation,
        status: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      },
      ...persons
    ]);
    setNewPersonName('');
    setNewPersonCase('');
    setShowAddPersonModal(false);
  };

  const handleRemoveVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Watchlist
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Active surveillance hotlists for vehicles and persons of interest
          </p>
        </div>

        {/* Tab Switcher: [ Vehicles ] [ Persons ] */}
        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('VEHICLES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeTab === 'VEHICLES'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car size={16} />
            <span>Vehicles</span>
          </button>

          <button
            onClick={() => setActiveTab('PERSONS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer min-h-[38px] ${
              activeTab === 'PERSONS'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={16} />
            <span>Persons</span>
          </button>
        </div>
      </div>

      {/* 2. Action & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'VEHICLES' ? 'Search vehicle plate or reason...' : 'Search person name or case...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        {activeTab === 'VEHICLES' ? (
          <button
            onClick={() => setShowAddVehicleModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer min-h-[44px]"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAddPersonModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer min-h-[44px]"
          >
            <Plus size={16} />
            <span>Add Person</span>
          </button>
        )}
      </div>

      {/* 3. Cards Grid */}
      {activeTab === 'VEHICLES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((vehicle) => (
            <div 
              key={vehicle.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold font-mono text-slate-500">
                    {vehicle.id}
                  </span>
                  <StatusBadge 
                    status={vehicle.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING'} 
                    label={`RISK: ${vehicle.riskLevel}`} 
                    size="sm" 
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Vehicle:</span>
                    <span className="font-black font-mono text-base text-slate-900">{vehicle.plate}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Reason:</span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">{vehicle.reason}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Date Added:</span>
                    <span className="text-slate-600 font-medium">{vehicle.dateAdded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Status:</span>
                    <span className="font-bold text-emerald-700">{vehicle.status}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Card Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setHistoryModalTarget(vehicle)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                >
                  <History size={14} />
                  <span>View History</span>
                </button>

                <button
                  onClick={() => onNavigate?.('missions')}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer shadow-xs"
                >
                  <Crosshair size={14} />
                  <span>Track</span>
                </button>

                <button
                  onClick={() => handleRemoveVehicle(vehicle.id)}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs transition-colors flex items-center justify-center min-h-[40px] min-w-[40px] cursor-pointer"
                  title="Remove from Watchlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPersons.map((person) => (
            <div 
              key={person.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold font-mono text-slate-500">
                    {person.id}
                  </span>
                  <StatusBadge 
                    status={person.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING'} 
                    label={`RISK: ${person.riskLevel}`} 
                    size="sm" 
                  />
                </div>

                <div className="flex gap-4 items-center mb-3">
                  <img
                    src={person.imageUrl}
                    alt={person.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {person.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {person.aliasCase}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Alias / Case:</span>
                    <span className="font-bold text-slate-800">{person.aliasCase}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Last Seen:</span>
                    <span className="font-semibold text-slate-800">{person.lastSeen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500 uppercase text-[11px]">Status:</span>
                    <span className="font-bold text-emerald-700">{person.status}</span>
                  </div>
                </div>
              </div>

              {/* Person Card Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setMatchesModalPerson(person)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
                >
                  <Eye size={14} />
                  <span>View Matches</span>
                </button>

                <button
                  onClick={() => onNavigate?.('cameras')}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer shadow-xs"
                >
                  <ScanFace size={14} />
                  <span>Find in CCTV</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Vehicle to Watchlist</h3>
              <button onClick={() => setShowAddVehicleModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Registration Plate</label>
                <input
                  type="text"
                  required
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. GJ01AB1234"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Reason for Hotlist</label>
                <input
                  type="text"
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Stolen Vehicle, FIR #241"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Risk Level</label>
                <select
                  value={newRisk}
                  onChange={(e) => setNewRisk(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[44px]"
                >
                  Save to Hotlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Person of Interest</h3>
              <button onClick={() => setShowAddPersonModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPerson} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Subject Name or Unknown Description</label>
                <input
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="e.g. Unknown Suspect"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Alias / Case Reference</label>
                <input
                  type="text"
                  required
                  value={newPersonCase}
                  onChange={(e) => setNewPersonCase(e.target.value)}
                  placeholder="e.g. Case #412"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Last Seen Jurisdiction</label>
                <input
                  type="text"
                  value={newPersonLocation}
                  onChange={(e) => setNewPersonLocation(e.target.value)}
                  placeholder="e.g. Ahmedabad"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[44px]"
                >
                  Register Suspect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View History Drawer/Modal for Vehicle */}
      {historyModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-500">VEHICLE SIGHTING HISTORY</span>
                <h3 className="text-xl font-black font-mono text-slate-900">{historyModalTarget.plate}</h3>
              </div>
              <button onClick={() => setHistoryModalTarget(null)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">CAM-001 (Traffic Junction)</div>
                  <div className="text-slate-500">Ahmedabad • SG Highway</div>
                </div>
                <div className="text-right font-mono font-bold text-slate-700">11:49 AM Today</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">CAM-014 (Ashram Road)</div>
                  <div className="text-slate-500">Ahmedabad • Transit Corridor</div>
                </div>
                <div className="text-right font-mono font-bold text-slate-700">Yesterday 18:22</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHistoryModalTarget(null)}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Matches Modal for Person */}
      {matchesModalPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-500">CCTV MATCH CANDIDATES</span>
                <h3 className="text-xl font-bold text-slate-900">{matchesModalPerson.name}</h3>
              </div>
              <button onClick={() => setMatchesModalPerson(null)} className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-2">
              <div className="font-bold text-sm">Latest CCTV Correlation Match</div>
              <div className="flex justify-between">
                <span>Location:</span>
                <strong className="text-slate-900">Ahmedabad • CAM-001</strong>
              </div>
              <div className="flex justify-between">
                <span>Landmark Similarity:</span>
                <strong className="text-slate-900">89.4% (Requires Officer Verification)</strong>
              </div>
              <div className="flex justify-between">
                <span>Statutory Reference:</span>
                <span>BSA 2023 Sec 63-65 Electronic Record</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setMatchesModalPerson(null)}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
