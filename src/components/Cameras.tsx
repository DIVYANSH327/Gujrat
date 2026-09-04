import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, 
  Settings2, 
  Signal, 
  Video, 
  Filter, 
  Search, 
  Activity, 
  Server, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  X,
  Camera as CameraIcon,
  Radio
} from 'lucide-react';

interface CameraItem {
  id: string;
  name: string;
  location: string;
  district: 'Ahmedabad' | 'Surat' | 'Vadodara' | 'Rajkot';
  status: 'online' | 'warning' | 'offline';
  fps: number;
  resolution: string;
  bitrateKbps: number;
  edgeNodeId: string;
  transport: 'RTSP' | 'ONVIF' | 'SIMULATED';
  sampleUrl: string;
}

// Generate the full 50-camera Gujarat Municipal CCTV Matrix
const generateGujaratCameras = (): CameraItem[] => {
  const districts = [
    { name: 'Ahmedabad' as const, count: 24, node: 'EDGE-GJ-001', prefix: 'AMD', locations: ['SG Highway North', 'Ashram Road Hub', 'Sindhu Bhavan Toll', 'Ring Road Interchange', 'Law Garden Crossing', 'Prahlad Nagar Junction', 'Vastrapur Lake East', 'Bopal Crossing', 'Kalupur Central Gate', 'Navrangpura Circle', 'Sabarmati Riverfront 1', 'Sabarmati Riverfront 2', 'Maninagar Station Rd', 'Naroda GIDC Toll', 'Ellis Bridge North', 'C.G. Road Axis', 'Paldi Cross Road', 'Vejalpur Axis', 'Ghatlodiya Ring', 'Chandkheda Toll', 'Ranip Terminal', 'Iscon Cross Road', 'Satellite Axis', 'Thaltej Hub'] },
    { name: 'Surat' as const, count: 14, node: 'EDGE-GJ-002', prefix: 'SRT', locations: ['Ring Road Textile Gate 1', 'Textile Market West', 'Athwa Gate Circle', 'Ghod Dod Road', 'Varachha Main Rd', 'Dumas Beach Road', 'Adajan Cross Roads', 'Katargam Axis', 'Udhna Main Gate', 'Piplod Junction', 'Vesu Boulevard', 'Rander Causeway', 'Surat Railway Plaza', 'Majura Gate'] },
    { name: 'Vadodara' as const, count: 8, node: 'EDGE-GJ-003', prefix: 'VAD', locations: ['Alkapuri Circle', 'Sayaji Baug Gate', 'Fatehgunj Hub', 'Manjalpur Axis', 'Karelibaug Junction', 'Gorwa Industrial Rd', 'Waghodia Cross', 'Akota Bridge North'] },
    { name: 'Rajkot' as const, count: 4, node: 'EDGE-GJ-004', prefix: 'RJK', locations: ['Kalavad Road Axis', 'Yagnik Road Cross', '150ft Ring Road', 'Kuvadva Road Toll'] }
  ];

  const cams: CameraItem[] = [];
  let index = 1;

  districts.forEach(dist => {
    for (let i = 0; i < dist.count; i++) {
      const camId = `CAM-${index < 10 ? `00${index}` : index < 100 ? `0${index}` : index}`;
      const location = dist.locations[i] || `${dist.name} Sector ${i + 1}`;
      
      let status: 'online' | 'warning' | 'offline' = 'online';
      if (camId === 'CAM-023') status = 'warning';
      if (camId === 'CAM-048') status = 'offline';

      const sampleImages = [
        'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=600&h=380',
        'https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?auto=format&fit=crop&q=80&w=600&h=380',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600&h=380',
        'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600&h=380',
        'https://images.unsplash.com/photo-1549424888-c92eb295ff68?auto=format&fit=crop&q=80&w=600&h=380'
      ];

      cams.push({
        id: camId,
        name: `${dist.name} - ${location}`,
        location: `${dist.name} - ${location}`,
        district: dist.name,
        status,
        fps: status === 'offline' ? 0 : 25,
        resolution: camId === 'CAM-007' || camId === 'CAM-014' ? '3840x2160 (4K)' : '1920x1080 (FHD)',
        bitrateKbps: status === 'offline' ? 0 : 4096,
        edgeNodeId: dist.node,
        transport: 'SIMULATED',
        sampleUrl: sampleImages[(index - 1) % sampleImages.length]
      });
      index++;
    }
  });

  return cams;
};

const gujaratCameras = generateGujaratCameras();

export function Cameras({ onAutoCapture }: { onAutoCapture?: (image: string, mode: string) => void }) {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectCam, setInspectCam] = useState<CameraItem | null>(null);

  // Local device camera integration for CAM-001 (optional local edge test)
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        activeStream = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        setCamError('LOCAL HARDWARE NOT CONNECTED');
      }
    }
    setupCamera();
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!stream || !onAutoCapture) return;
    const interval = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const modes = ['walking', 'car', 'bike'];
          const randomMode = modes[Math.floor(Math.random() * modes.length)];
          onAutoCapture(dataUrl, randomMode);
          
          setIsCapturing(true);
          setTimeout(() => setIsCapturing(false), 500);
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [stream, onAutoCapture]);

  const filteredCameras = gujaratCameras.filter(c => {
    const matchesDistrict = selectedDistrict === 'ALL' || c.district === selectedDistrict;
    const matchesSearch = c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  return (
    <div className="p-5 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <div className="mb-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyan-950/50 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              GUJARAT STATEWIDE SURVEILLANCE
            </span>
            <span className="text-[10px] font-mono text-zinc-400">TOTAL: 50 CCTV CHANNELS</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            LIVE CCTV FEEDS MATRIX (SIMULATED STREAM INFRASTRUCTURE)
          </h1>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CAMERA / JURISDICTION..." 
              className="bg-[#090d16] border border-cyan-900/30 rounded py-1.5 pl-8 pr-3 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 w-64 focus:outline-none focus:border-cyan-500/60 uppercase"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-500" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* District & Status Filters Bar */}
      <div className="flex items-center justify-between gap-2 mb-3 shrink-0 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          {['ALL', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'].map(d => {
            const count = d === 'ALL' ? gujaratCameras.length : gujaratCameras.filter(c => c.district === d).length;
            return (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`px-3 py-1 rounded text-xs font-mono tracking-wider transition-colors cursor-pointer shrink-0 ${
                  selectedDistrict === d
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : 'bg-[#090d16] text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {d.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 48 ONLINE
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 1 WARN
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-600" /> 1 OFFLINE
          </span>
        </div>
      </div>

      {/* Grid of 50 Camera Feeds */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {filteredCameras.map((camera, index) => {
            const isLocalCam = camera.id === 'CAM-001' && stream;

            return (
              <div 
                key={camera.id} 
                className="group relative bg-[#090d16] border border-cyan-950/60 rounded-lg overflow-hidden flex flex-col h-[260px] hover:border-cyan-600/50 transition-all shadow-md"
              >
                {/* Top Video Overlay Bar */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#05070c]/90 text-cyan-300 border border-cyan-900/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                      {camera.id}
                    </span>
                    <span className="bg-black/80 text-zinc-300 border border-white/10 text-[9px] font-mono px-1.5 py-0.5 rounded truncate max-w-[130px]">
                      {camera.district}
                    </span>
                  </div>

                  {camera.status === 'online' ? (
                    <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      SIMULATED LIVE
                    </span>
                  ) : camera.status === 'warning' ? (
                    <span className="bg-amber-950/80 text-amber-400 border border-amber-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      DEGRADED
                    </span>
                  ) : (
                    <span className="bg-zinc-900 text-zinc-500 border border-zinc-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                      DISCONNECTED
                    </span>
                  )}
                </div>

                {/* Feed Visual / Synthetic Frame */}
                <div className="w-full flex-1 bg-[#04060a] relative overflow-hidden flex items-center justify-center">
                  {camera.status !== 'offline' ? (
                    isLocalCam ? (
                      <>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" 
                        />
                        <canvas ref={canvasRef} className="hidden" />
                      </>
                    ) : (
                      <img 
                        src={camera.sampleUrl} 
                        alt={camera.name} 
                        className="w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:opacity-90 group-hover:mix-blend-normal transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-600 gap-1">
                      <Signal size={22} className="opacity-40" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">FEED OFFLINE</span>
                    </div>
                  )}

                  {/* Synthetic HUD scan line effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[size:100%_4px] pointer-events-none opacity-40" />

                  {/* Inspect button on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button 
                      onClick={() => setInspectCam(camera)}
                      className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Maximize2 size={13} />
                      <span>INSPECT STREAM</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Telemetry Bar */}
                <div className="p-2.5 bg-[#070a12] border-t border-cyan-950/60 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
                  <div className="truncate pr-2 font-semibold text-zinc-300">
                    {camera.name}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-zinc-500">
                    <span>{camera.fps} FPS</span>
                    <span>•</span>
                    <span>{camera.edgeNodeId}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stream Inspection Modal */}
      {inspectCam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-cyan-950/60 flex items-center justify-between bg-[#06080e]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-700/50 rounded">
                  {inspectCam.id}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 font-mono">
                    {inspectCam.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    JURISDICTION: GUJARAT POLICE {inspectCam.district.toUpperCase()} • NODE: {inspectCam.edgeNodeId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setInspectCam(null)}
                className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col md:flex-row gap-5">
              {/* Large Frame Preview */}
              <div className="flex-1 aspect-video bg-black rounded-lg border border-cyan-950 overflow-hidden relative flex items-center justify-center">
                <img 
                  src={inspectCam.sampleUrl} 
                  alt="Inspect feed" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SIMULATED LIVE (4K DOWNSAMPLED)
                </div>
                <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-[10px] font-mono text-zinc-300 border border-white/10">
                  SHA-256: e8b9f42c...a891
                </div>
              </div>

              {/* Live Technical Metrics */}
              <div className="w-full md:w-72 space-y-3 font-mono text-xs">
                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  TELEMETRY DIAGNOSTICS
                </div>
                <div className="bg-[#05070c] border border-cyan-950/80 rounded p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">RESOLUTION:</span>
                    <span className="text-zinc-200">{inspectCam.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">FRAME RATE:</span>
                    <span className="text-emerald-400">{inspectCam.fps} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">BITRATE:</span>
                    <span className="text-zinc-200">{inspectCam.bitrateKbps} Kbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">TRANSPORT:</span>
                    <span className="text-cyan-300">{inspectCam.transport} / H.265</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">RTT LATENCY:</span>
                    <span className="text-emerald-400">12 ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PACKET LOSS:</span>
                    <span className="text-emerald-400">0.00%</span>
                  </div>
                </div>

                <div className="bg-[#05070c] border border-cyan-950/80 rounded p-3 space-y-1 text-[11px]">
                  <div className="text-zinc-400 font-bold mb-1">LOCAL INFERENCE STATE</div>
                  <div className="text-zinc-500">ANPR OCR: <span className="text-emerald-400">ACTIVE</span></div>
                  <div className="text-zinc-500">HELMET SCAN: <span className="text-emerald-400">ACTIVE</span></div>
                  <div className="text-zinc-500">RULE COMPLIANCE: <span className="text-emerald-400">NOMINAL</span></div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#06080e] border-t border-cyan-950/60 flex justify-end">
              <button 
                onClick={() => setInspectCam(null)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-mono font-bold"
              >
                CLOSE INSPECTOR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
