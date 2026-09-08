import React from 'react';
import { 
  X, 
  Video, 
  CheckCircle2, 
  Cpu, 
  Network, 
  Server, 
  ShieldCheck, 
  ArrowRight,
  Info,
  Radio,
  FileCode,
  Layers
} from 'lucide-react';

interface ConfigureVideoSourceModalProps {
  cameraId?: string;
  cameraName?: string;
  onClose: () => void;
  onNavigateToFleet?: () => void;
}

export function ConfigureVideoSourceModal({ 
  cameraId = 'CAM-001', 
  cameraName = 'CCTV Stream Node', 
  onClose, 
  onNavigateToFleet 
}: ConfigureVideoSourceModalProps) {
  const supportedSources = [
    {
      id: 'onvif',
      name: 'ONVIF (Profile S / T)',
      protocol: 'ONVIF / WS-Discovery / SOAP / RTSP',
      status: 'INTEGRATION READY',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Standardized IP camera discovery and streaming profile. Negotiates RTSP media URIs and PTZ controls via local edge agent.',
      spec: 'Profile S (H.264/MJPEG video streaming), Profile T (H.265 video + analytics metadata).'
    },
    {
      id: 'rtsp',
      name: 'RTSP Direct Stream',
      protocol: 'RTSP / RTP / TCP (Port 554)',
      status: 'INTEGRATION READY',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Direct RTSP video transport encapsulated over TCP to prevent packet loss. Includes automatic reconnection & jitter buffer.',
      spec: 'H.264 / H.265 video codecs, AAC / PCM audio, digest/basic authentication.'
    },
    {
      id: 'vms',
      name: 'Authorized VMS Gateway',
      protocol: 'Milestone XProtect / Genetec Security Center',
      status: 'INTEGRATION READY',
      statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      description: 'Vendor-agnostic VMS adapter connecting to enterprise municipal video management systems via authenticated REST/gRPC API.',
      spec: 'Multi-channel directory sync, live media proxy, historical bookmarking.'
    },
    {
      id: 'edge',
      name: 'Edge Ingestion Agent',
      protocol: 'Local Edge Inference Daemon',
      status: 'INTEGRATION READY',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Ruggedized on-premise edge agent deployed at municipal junction for zero-WAN AI computer vision and local queueing.',
      spec: 'Local frame capture, ANPR / helmet model inference, TLS event transport.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#090d16] border border-cyan-500/40 rounded-xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-cyan-950/60 flex items-center justify-between bg-[#06080e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/30 rounded text-cyan-400">
              <Video size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono flex items-center gap-2">
                CONFIGURE PHYSICAL VIDEO SOURCE
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                TARGET NODE: <span className="text-cyan-300 font-bold">{cameraId}</span> ({cameraName})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="p-4 bg-cyan-950/20 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-cyan-400 mt-0.5 shrink-0" />
            <div className="text-xs font-mono text-zinc-300 space-y-1">
              <div className="font-bold text-cyan-300">VENDOR-AGNOSTIC PRODUCTION ARCHITECTURE</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Streaming physical live CCTV requires an authorized physical video source (DVR/NVR/VMS) connected
                via local network to an Edge Agent node. For hackathon visual demonstration, public YouTube live streams are rendered
                in the presentation layer.
              </p>
            </div>
          </div>
        </div>

        {/* Body: Protocols Grid */}
        <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
            AVAILABLE PHYSICAL INGEST PROTOCOLS
          </div>

          <div className="grid grid-cols-1 gap-3">
            {supportedSources.map(source => (
              <div 
                key={source.id}
                className="p-3.5 bg-[#06080d] border border-cyan-950/70 hover:border-cyan-500/40 rounded-lg transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-200 text-xs">{source.name}</span>
                    <span className="text-[10px] font-mono text-zinc-500">• {source.protocol}</span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${source.statusColor}`}>
                    {source.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-2 font-mono">
                  {source.description}
                </p>
                <div className="text-[10px] font-mono text-zinc-500 bg-[#0a0f1d] p-2 rounded border border-cyan-950/40">
                  <span className="text-cyan-400 font-bold">SPEC:</span> {source.spec}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-cyan-950/60 bg-[#06080e] flex items-center justify-between shrink-0">
          <span className="text-[10px] font-mono text-zinc-400">
            INTEGRATION MODE: <span className="text-cyan-400">DEMO PRESENTATION + EDGE AGENT ARCHITECTURE</span>
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToFleet && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToFleet();
                }}
                className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 rounded text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors"
              >
                <Server size={13} /> VIEW EDGE FLEET <ArrowRight size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-mono text-zinc-200 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
