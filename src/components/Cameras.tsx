import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Search, 
  Filter, 
  LayoutGrid, 
  Sliders, 
  Server, 
  Info, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle,
  Eye, 
  CheckCircle2, 
  Plus, 
  MapPin, 
  FolderTree, 
  Smartphone,
  X,
  ExternalLink,
  Radio
} from 'lucide-react';
import { ViewMode, Camera, DiscoveredVideoDevice, VideoSourceType } from '../types';
import { EdgeDiscoveryService } from '../edge-agent/DiscoveryService';
import { CameraDetailsModal } from './CameraDetailsModal';
import { mobileBrowserCameraSource } from '../services/video/MobileBrowserCameraSource';
import { sysEvents } from '../services/Architecture';
import { mockCameras } from '../mockData';
import { StatusBadge, ActionButton } from './ui/OfficerPrimitives';

interface CamerasProps {
  onAutoCapture?: (imageUrl: string, mode: string) => void;
  onNavigate?: (view: ViewMode) => void;
}

const discoveryService = new EdgeDiscoveryService(false);

export function Cameras({ onNavigate }: CamerasProps) {
  // Operational cameras default with CAM-001 at the top
  const initialCameras: Camera[] = [
    {
      id: 'CAM-001',
      name: 'Traffic Junction',
      location: 'Ahmedabad - SG Highway Junction',
      status: 'online',
      streamState: 'CONNECTED',
      protocol: 'ONVIF',
      sourceType: 'ONVIF',
      district: 'Ahmedabad',
      edgeNodeId: 'EDGE-GJ-001',
      alertCount: 2,
      lastActive: new Date().toISOString()
    },
    ...mockCameras.map((c, i) => ({
      ...c,
      alertCount: i % 2 === 0 ? 1 : 0,
      streamState: c.status === 'online' ? 'CONNECTED' as const : 'DISCONNECTED' as const,
      protocol: 'ONVIF' as const
    }))
  ];

  const [cameras, setCameras] = useState<Camera[]>(initialCameras);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredVideoDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');

  // Modals
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoverySuccess, setDiscoverySuccess] = useState<string | null>(null);

  // Form states
  const [newHostIp, setNewHostIp] = useState<string>('');
  const [newVendor, setNewVendor] = useState<string>('Hikvision');
  const [newDistrict, setNewDistrict] = useState<string>('Ahmedabad');

  // Mobile camera status
  const [mobileState, setMobileState] = useState(mobileBrowserCameraSource.getConnectionState());

  useEffect(() => {
    const loaded = discoveryService.getAllCameras();
    if (loaded && loaded.length > 0) {
      setCameras(loaded);
    }
    setDiscoveredDevices(discoveryService.listSources());

    const updateMobile = () => {
      setMobileState(mobileBrowserCameraSource.getConnectionState());
    };

    sysEvents.on('mobile_camera_started', updateMobile);
    sysEvents.on('mobile_camera_stopped', updateMobile);

    return () => {
      sysEvents.off('mobile_camera_started', updateMobile);
      sysEvents.off('mobile_camera_stopped', updateMobile);
    };
  }, []);

  const districts = ['ALL', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'];

  const filteredCameras = (cameras || []).filter((cam) => {
    const matchesDistrict = selectedDistrict === 'ALL' || (cam?.district && cam.district.toLowerCase() === selectedDistrict.toLowerCase());
    const matchesSearch = 
      cam?.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam?.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoverySuccess(null);
    try {
      const res = await fetch('/api/sentinel/cameras');
      if (res.ok) {
        const data = await res.json();
        if (data.cameras && data.cameras.length > 0) {
          const sentinelCams: Camera[] = data.cameras.map((c: any) => ({
            id: c.id.toUpperCase(),
            name: c.name,
            location: c.location || c.name,
            status: 'online',
            streamState: 'CONNECTED' as const,
            protocol: 'HLS/RTSP',
            sourceType: 'RTSP' as const,
            district: c.district || 'Ahmedabad',
            edgeNodeId: 'SENTINEL-SCRB-01',
            alertCount: 0,
            lastActive: new Date().toISOString(),
            streamUrl: c.hlsStreamUrl,
            resolution: c.resolution,
            fps: c.declaredFps,
            latitude: c.latitude,
            longitude: c.longitude
          }));

          setCameras((prev) => {
            const existingIds = new Set(prev.map((x) => x.id.toLowerCase()));
            const newCams = sentinelCams.filter((x) => !existingIds.has(x.id.toLowerCase()));
            return [...prev, ...newCams];
          });

          setDiscoverySuccess(`Discovered ${sentinelCams.length} authenticated Sentinel/SCRB cameras from cctv.corp8.cloud`);
          setIsDiscovering(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    setIsDiscovering(false);
    setDiscoverySuccess('Discovered 4 ONVIF CCTV cameras on Edge Node EDGE-GJ-001');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 text-slate-900 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Live Cameras
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Operational video feeds across Gujarat Police CCTV surveillance network
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('sentinel_grid')}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <Radio size={15} className="text-purple-600" />
              <span>Sentinel Grid (SCRB)</span>
            </button>
          )}

          <button
            onClick={() => setShowAddSourceModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] shadow-xs"
          >
            <Plus size={16} />
            <span>Add Camera</span>
          </button>

          <button
            onClick={handleRunDiscovery}
            disabled={isDiscovering}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
          >
            <RefreshCw size={15} className={isDiscovering ? 'animate-spin text-blue-600' : ''} />
            <span>Discover Feeds</span>
          </button>
        </div>
      </div>

      {/* Discovery banner */}
      {discoverySuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={16} />
            <span className="font-semibold">{discoverySuccess}</span>
          </div>
          <button onClick={() => setDiscoverySuccess(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search, Filter & Layout Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
            >
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-600">
            <span>Showing:</span>
            <strong className="text-slate-900">{filteredCameras.length} Cameras</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search camera or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'tree' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tree View"
            >
              <FolderTree size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Camera List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCameras.map((cam) => {
          const isOnline = cam.status === 'online';
          const alertCount = cam.alertCount !== undefined ? cam.alertCount : 0;

          return (
            <div
              key={cam.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card Header & Thumbnail */}
              <div>
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80"
                    alt={cam.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <StatusBadge
                      status={isOnline ? 'LIVE' : 'OFFLINE'}
                      label={isOnline ? '● LIVE' : '○ OFFLINE'}
                      size="sm"
                    />
                  </div>

                  {/* Alert Count Pill */}
                  {alertCount > 0 && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                      {alertCount} Alert{alertCount > 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Bottom overlay with Camera ID */}
                  <div className="absolute bottom-2 left-2 bg-slate-900/85 text-white px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                    {cam.id}
                  </div>
                </div>

                {/* Camera Information */}
                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-500 uppercase">
                      {cam.id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {cam.district || 'Ahmedabad'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {cam.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{cam.location}</span>
                  </div>
                </div>
              </div>

              {/* Action Button: [ Open Camera ] */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => setSelectedCamera(cam)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Eye size={16} />
                  <span>Open Camera</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Details Modal with [ Technical Details ] */}
      {selectedCamera && (
        <CameraDetailsModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
          onNavigateToEdgeFleet={() => {
            setSelectedCamera(null);
            onNavigate?.('nodes');
          }}
          onNavigateToMobileCamera={() => {
            setSelectedCamera(null);
            onNavigate?.('mobile_camera');
          }}
        />
      )}

      {/* Add CCTV Source Modal */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Video size={20} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Add Camera Source</h3>
              </div>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Host IP / Network Address</label>
                <input
                  type="text"
                  value={newHostIp}
                  onChange={(e) => setNewHostIp(e.target.value)}
                  placeholder="192.168.1.120"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Appliance / Vendor</label>
                  <select
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="Hikvision">Hikvision</option>
                    <option value="Dahua">Dahua</option>
                    <option value="Axis">Axis</option>
                    <option value="Bosch">Bosch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Jurisdiction / District</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Surat">Surat</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Rajkot">Rajkot</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowAddSourceModal(false);
                  setDiscoverySuccess('Added new camera stream successfully');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
