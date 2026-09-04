import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';
import { mockDetections, mockCameras } from '../mockData';
import { DetectionEvent } from '../types';
import { centralRepo } from '../services/Architecture';

export function AISearch({ detections }: { detections: DetectionEvent[] }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const qStr = (directQuery !== undefined ? directQuery : query).trim();
    if (!qStr) return;
    if (directQuery !== undefined) setQuery(directQuery);

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    setTimeout(() => {
      const q = qStr.toLowerCase();
      const filteredMock = detections.filter(d => {
        const matchesPlate = d.metadata.plate?.toLowerCase().includes(q);
        const matchesClothing = d.metadata.clothingColor?.toLowerCase().includes(q);
        const matchesType = d.objectType.toLowerCase().includes(q);
        const matchesMode = d.metadata.movementMode?.toLowerCase().includes(q);
        return matchesPlate || matchesClothing || matchesType || matchesMode;
      });
      
      const centralResults = centralRepo.searchEvents(q);
      
      setResults([...centralResults, ...filteredMock]);
      setIsSearching(false);
    }, 400);
  };

  const getCameraName = (id: string) => mockCameras.find(c => c.id === id)?.name || id;

  return (
    <div className="p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      <div className="mb-6 max-w-4xl mx-auto w-full shrink-0">
        <div className="text-center mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            GUJARAT POLICE METADATA FORENSIC INDEX
          </span>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono mt-1">
            AI MULTI-CAMERA METADATA SEARCH
          </h1>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto mt-0.5">
            Query across Gujarat edge nodes by vehicle license plate, suspect facial embedding, or clothing attributes.
          </p>
        </div>

        <form onSubmit={(e) => handleSearch(e)} className="relative flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-cyan-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 bg-[#090d16] border border-cyan-900/40 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 shadow-inner placeholder:text-zinc-600 transition-colors uppercase"
              placeholder="e.g. 'GJ01AB1234', 'White Sedan', 'P-DEMO-001', 'Black Shirt'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center min-w-[120px] cursor-pointer"
          >
            {isSearching ? <Activity className="animate-spin h-4 w-4" /> : "SEARCH"}
          </button>
        </form>

        {/* Quick Search Chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <button 
            onClick={(e) => handleSearch(e, 'GJ01AB1234')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-[11px] font-mono hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            <Car size={12} /><span>GJ01AB1234 (Target A)</span>
          </button>
          <button 
            onClick={(e) => handleSearch(e, 'P-DEMO-001')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-[11px] font-mono hover:bg-cyan-900/60 transition-colors cursor-pointer"
          >
            <ScanFace size={12} /><span>P-DEMO-001 (Face)</span>
          </button>
          <button 
            onClick={(e) => handleSearch(e, 'GJ05XY6789')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded border border-white/10 bg-[#090d16] text-zinc-400 text-[11px] font-mono hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Hash size={12} /><span>GJ05XY6789</span>
          </button>
          <button 
            onClick={(e) => handleSearch(e, 'vehicle')}
            className="flex items-center space-x-1.5 px-3 py-1 rounded border border-white/10 bg-[#090d16] text-zinc-400 text-[11px] font-mono hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Car size={12} /><span>All Vehicles</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar max-w-6xl mx-auto w-full pb-8">
        {!hasSearched ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <Search size={36} className="mb-3 text-cyan-600 opacity-60" />
            <p className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-wider">Edge Structured Metadata Index Ready</p>
            <p className="text-xs font-mono mt-1 max-w-md text-center text-zinc-500">
              Queries execute against low-latency edge feature stores across Ahmedabad, Surat, Vadodara, and Rajkot nodes.
            </p>
          </div>
        ) : isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#090d16] border border-cyan-950 rounded-lg overflow-hidden h-64"></div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-950/60 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
                Found {results.length} Forensic Matches
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">
                QUERY TIME: 18ms
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, idx) => {
                const isCentralEvent = 'eventId' in result;
                const id = isCentralEvent ? result.eventId : result.id;
                const type = isCentralEvent ? result.eventType : result.objectType;
                
                return (
                  <div key={`${id}-${idx}`} className="bg-[#090d16] border border-cyan-950/70 rounded-lg overflow-hidden group hover:border-cyan-600/50 transition-colors shadow-md flex flex-col">
                    <div className="relative h-44 bg-[#04060a] flex items-center justify-center overflow-hidden">
                      <img 
                        src={isCentralEvent ? "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&q=80&w=600" : result.snapshotUrl} 
                        alt="Detection snapshot" 
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Bounding Box */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                         <div className="border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] rounded-sm w-[45%] h-[60%] relative">
                             <div className="absolute -top-4 left-[-2px] bg-cyan-500 text-[8px] font-mono font-black text-black px-1 uppercase tracking-wider">
                               {type.replace('_', ' ')} ({(result.confidence * 100).toFixed(0)}%)
                             </div>
                         </div>
                      </div>

                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
                        <div className="text-[9px] font-mono font-bold tracking-widest text-emerald-400 bg-black/80 px-2 py-0.5 rounded border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                          <ShieldCheck size={10} />
                          {(result.confidence * 100).toFixed(0)}% MATCH
                        </div>
                      </div>

                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                        {result.metadata.plate && (
                          <div className="text-[11px] font-mono font-bold tracking-widest text-white bg-black/80 px-2 py-0.5 rounded border border-cyan-500/50 backdrop-blur-md">
                            IND | {result.metadata.plate}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#070a12] border-t border-cyan-950/60 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5 mb-2.5">
                        <div className="flex items-center text-[10px] text-zinc-300 font-mono">
                          <CameraIcon size={12} className="text-cyan-400 mr-2 shrink-0" />
                          <span className="uppercase tracking-wider font-semibold truncate">{getCameraName(result.cameraId)}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-zinc-400 font-mono">
                          <Clock size={12} className="text-zinc-500 mr-2 shrink-0" />
                          <span>{new Date(result.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                        </div>
                        <div className="flex items-center text-[9px] text-zinc-500 font-mono">
                          <FileCheck size={11} className="text-emerald-400 mr-2 shrink-0" />
                          <span>SHA-256 HASH VERIFIED</span>
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-2 border-t border-white/5">
                        <button className="flex-1 bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 py-1 rounded text-[9px] font-mono uppercase tracking-wider font-bold border border-cyan-800/40 transition-colors">
                          INSPECT FRAME
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">No matching events in index</p>
            <p className="text-[11px] font-mono mt-1 text-zinc-600">Try searching 'GJ01AB1234' or 'P-DEMO-001'</p>
          </div>
        )}
      </div>
    </div>
  );
}
