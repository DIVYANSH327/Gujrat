import React, { useState, useEffect } from 'react';
import { mockNodes } from '../mockData';
import { Server, Usb, HardDrive, Shield, Video, Network, AlertTriangle, ArrowUpRight, ArrowDownRight, Info, Play, WifiOff, Wifi, Cpu, MemoryStick, Database, CheckCircle2 } from 'lucide-react';
import { EdgeNode, CommLogEntry } from '../types';
import { sysEvents, centralAPI, edgeRuntime, runArchitectureTests } from '../services/Architecture';

export function EdgeFleet() {
  const [nodes, setNodes] = useState<EdgeNode[]>(mockNodes);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedNode, setSelectedNode] = useState<EdgeNode | null>(null);
  
  // Architecture State
  const [isCentralOffline, setIsCentralOffline] = useState(false);
  const [liveLogs, setLiveLogs] = useState<CommLogEntry[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [showTests, setShowTests] = useState(false);
  const [runtimeDiagnostics, setRuntimeDiagnostics] = useState<any>(null);

  useEffect(() => {
    const pollCentral = async () => {
      try {
        const stateRes = await fetch('/api/central/state');
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          setIsCentralOffline(stateData.isOffline);
          
          const hb = stateData.heartbeats.find((h: any) => h[0] === 'EDGE-GJ-001' || h[0] === 'EDGE-00042')?.[1];
          if (hb) {
            setNodes(prev => prev.map(n => (n.id === 'EDGE-GJ-001' || n.id === 'EDGE-00042') ? {
              ...n,
              status: hb.status === 'ONLINE' ? 'online' : 'syncing',
              dvrCount: hb.connectedDvrCount,
              camerasConnected: hb.connectedCameraCount,
              lastHeartbeat: hb.timestamp,
              version: hb.agentVersion
            } : n));
            
            if (selectedNode?.id === 'EDGE-GJ-001' || selectedNode?.id === 'EDGE-00042') {
              setSelectedNode(prev => prev ? {
                ...prev,
                status: hb.status === 'ONLINE' ? 'online' : 'syncing',
                dvrCount: hb.connectedDvrCount,
                camerasConnected: hb.connectedCameraCount,
                lastHeartbeat: hb.timestamp,
                version: hb.agentVersion
              } : null);
            }
          }
        }

        const logRes = await fetch('/api/central/logs');
        if (logRes.ok) {
          const logsData = await logRes.json();
          setLiveLogs(logsData);
        }
      } catch (e) {
        // Ignored
      }
    };

    const interval = setInterval(pollCentral, 2000);
    pollCentral();
    return () => clearInterval(interval);
  }, [selectedNode?.id]);

  useEffect(() => {
    const onQueueUpdate = (count: number) => {
      setNodes(prev => prev.map(n => (n.id === 'EDGE-GJ-001' || n.id === 'EDGE-00042') ? { ...n, queuedEvents: count } : n));
      if (selectedNode?.id === 'EDGE-GJ-001' || selectedNode?.id === 'EDGE-00042') {
        setSelectedNode(prev => prev ? { ...prev, queuedEvents: count } : null);
        setRuntimeDiagnostics(edgeRuntime.getDiagnostics());
      }
    };
    
    const onSyncState = (state: any) => {
      setNodes(prev => prev.map(n => (n.id === 'EDGE-GJ-001' || n.id === 'EDGE-00042') ? { ...n, syncState: state } : n));
      if (selectedNode?.id === 'EDGE-GJ-001' || selectedNode?.id === 'EDGE-00042') {
        setSelectedNode(prev => prev ? { ...prev, syncState: state } : null);
        setRuntimeDiagnostics(edgeRuntime.getDiagnostics());
      }
    };

    sysEvents.on('QUEUE_UPDATED', onQueueUpdate);
    sysEvents.on('SYNC_STATE_CHANGED', onSyncState);
    
    if (selectedNode?.id === 'EDGE-GJ-001' || selectedNode?.id === 'EDGE-00042') {
      setRuntimeDiagnostics(edgeRuntime.getDiagnostics());
    }
  }, [selectedNode]);

  const toggleCentralState = async () => {
    try {
      const res = await fetch('/api/central/toggle-offline', { method: 'POST' });
      const data = await res.json();
      setIsCentralOffline(data.isOffline);
      if (!data.isOffline) edgeRuntime.syncManager.triggerSync();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerDetection = () => {
    edgeRuntime.eventManager.createEvent('GJ01AB1234', 'CAM-014', (msg) => sysEvents.emit('LOG', msg));
  };

  const runTests = async () => {
    setShowTests(true);
    setTestResults(['Running Gujarat Police Edge & Central Architecture Verification...']);
    const res = await runArchitectureTests();
    setTestResults(res);
  };

  const simulateProvisioning = () => {
    if (isProvisioning) return;
    setIsProvisioning(true);
    setIsComplete(false);
    setSelectedNode(null);
    setTerminalLines([]);

    const sequence = [
      { text: "INITIALIZING GUJARAT POLICE USB PROVISIONING MODULE...", delay: 500 },
      { text: "DETECTING HARDWARE: EDGE-GJ-007 (GANDHINAGAR HQ)", delay: 1200 },
      { text: "INSTALLING SECURE EDGE AGENT v0.7-PROD...", delay: 2000 },
      { text: "✓ Edge Agent installed and kernel modules verified", delay: 3500 },
      { text: "SCANNING GUJARAT MUNICIPAL FIBER & DVRs...", delay: 4200 },
      { text: "✓ DVR discovered (IP: 10.14.8.50 - Gandhinagar C4i)", delay: 5500 },
      { text: "✓ 16 IP cameras bound to local RTSP stream relay", delay: 6000 },
      { text: "ESTABLISHING TLS 1.3 SECURE TUNNEL TO STATE CENTRAL COMMAND...", delay: 7200 },
      { text: "✓ Device certificate cert-gj-gan-07 validated (ECDSA P-256)", delay: 8500 },
      { text: "DOWNLOADING STATEWIDE POLICIES & WATCHLIST SIGNATURES...", delay: 9200 },
      { text: "✓ 6 active policies and 4 watchlist profiles synchronized", delay: 10000 },
      { text: "NODE ONLINE. ZERO-TOUCH DEPLOYMENT COMPLETE.", delay: 11000 },
    ];

    sequence.forEach((step, index) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, step.text]);
        if (index === sequence.length - 1) {
          setIsComplete(true);
          setTimeout(() => {
            setNodes([{
              id: 'EDGE-GJ-007',
              siteId: 'GJ-GANDHINAGAR-01',
              status: 'online',
              ipAddress: '10.14.8.50',
              camerasConnected: 16,
              dvrCount: 2,
              lastHeartbeat: new Date().toISOString(),
              version: 'v0.7-PROD',
              deviceCertificateId: 'cert-gj-gan-07',
              capabilities: ['face_recognition', 'lpr_ocr', 'helmet_detection'],
              createdAt: new Date().toISOString(),
              lastSeenAt: new Date().toISOString(),
              queuedEvents: 0,
              syncState: 'synchronized',
              lastConfigUpdate: new Date().toISOString(),
              policyVersion: 'pol-v2.1.4',
              securityState: 'secure'
            }, ...nodes]);
            setIsProvisioning(false);
          }, 3000);
        }
      }, step.delay);
    });
  };

  return (
    <div className="p-6 h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <div className="mb-5 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-cyan-950/50 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              STATEWIDE DISTRIBUTED COMPUTE
            </span>
            <span className="text-[10px] font-mono text-zinc-400">TOTAL NODES: {nodes.length}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            EDGE FLEET MANAGEMENT & PROVISIONING
          </h1>
          <p className="text-xs text-zinc-400">
            Monitor offline-first edge inferencing clusters, local SQLite queues, and zero-touch USB deployments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={toggleCentralState}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isCentralOffline 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] text-white' 
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white'
            }`}
          >
            {isCentralOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            <span>{isCentralOffline ? 'SIMULATE CENTRAL OFFLINE' : 'CENTRAL ONLINE'}</span>
          </button>
          
          <button 
            onClick={triggerDetection}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] cursor-pointer"
          >
            <Video size={14} />
            <span>EMIT LOCAL ANPR</span>
          </button>

          <button 
            onClick={runTests}
            className="flex items-center space-x-1.5 bg-[#0d121f] hover:bg-[#131b2e] border border-cyan-800/40 text-cyan-300 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Play size={14} />
            <span>RUN ARCH TESTS</span>
          </button>

          <button 
            onClick={simulateProvisioning}
            disabled={isProvisioning}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Usb size={14} />
            <span>USB PROVISION</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 overflow-hidden">
        {/* Left: Active Nodes List */}
        <div className="flex-1 bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col min-w-0 shadow-md">
          <div className="p-3.5 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <Server size={14} /> ACTIVE EDGE NODES ({nodes.length})
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/30">
              {nodes.filter(n => n.status === 'online').length} / {nodes.length} ONLINE
            </span>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 pb-4">
              {nodes.map(node => (
                <div 
                  key={node.id} 
                  onClick={() => {
                    setSelectedNode(node);
                    if (isProvisioning) setIsProvisioning(false);
                  }}
                  className={`bg-[#05070c] border rounded-lg p-3.5 cursor-pointer transition-all group font-mono ${
                    selectedNode?.id === node.id 
                      ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-[#070b14]' 
                      : 'border-cyan-950/80 hover:border-cyan-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div>
                      <h3 className="font-bold text-xs text-zinc-100 uppercase tracking-wider">{node.siteId}</h3>
                      <div className="text-[10px] text-zinc-500">{node.id} • {node.ipAddress}</div>
                    </div>
                    <div className="flex gap-1.5">
                      {node.queuedEvents > 0 && (
                        <div className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                          <AlertTriangle size={10} />
                          {node.queuedEvents} QUEUED
                        </div>
                      )}
                      <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        node.status === 'online' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      }`}>
                        {node.status === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        {node.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 bg-[#080c16] rounded border border-cyan-950/60 text-[10px]">
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">CONNECTED HARDWARE</div>
                      <div className="text-zinc-300 flex items-center gap-1">
                        <Video size={11} className="text-cyan-400" />
                        {node.dvrCount} DVRs / {node.camerasConnected} Cams
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">SYNC STATE</div>
                      <div className={`flex items-center gap-1 font-bold ${node.syncState === 'synchronized' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        <Network size={11} />
                        {node.syncState.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">ACTIVE POLICY</div>
                      <div className="text-zinc-300 flex items-center gap-1">
                        <Shield size={11} className="text-emerald-400" />
                        {node.policyVersion}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">LAST HEARTBEAT</div>
                      <div className="text-zinc-400">{new Date(node.lastHeartbeat).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Provisioning Terminal OR Node Diagnostics */}
        <div className="w-full lg:w-[440px] bg-[#090d16] border border-cyan-950/70 rounded-lg flex flex-col shrink-0 overflow-hidden shadow-md">
          {!selectedNode ? (
            <>
              <div className="p-3 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between">
                <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <HardDrive size={13} /> ZERO-TOUCH PROVISIONING TERMINAL
                </h2>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col justify-end min-h-0 bg-[#04060a]">
                {terminalLines.length === 0 && !isProvisioning && (
                  <div className="text-zinc-600 text-center h-full flex flex-col items-center justify-center opacity-60">
                    <Usb size={32} className="mb-2 text-cyan-600" />
                    <div className="font-bold text-[11px] text-zinc-400">USB HARDWARE DISCOVERY IDLE</div>
                    <div className="text-[10px] mt-1 text-zinc-600">CLICK "USB PROVISION" OR SELECT A NODE TO AUDIT</div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {terminalLines.map((line, idx) => (
                    <div key={idx} className={`${line.includes('✓') ? 'text-emerald-400 font-bold' : line.includes('COMPLETE') ? 'text-cyan-300 font-bold' : 'text-zinc-400'}`}>
                      <span className="text-cyan-600 mr-2">{'>'}</span>{line}
                    </div>
                  ))}
                  {isProvisioning && !isComplete && (
                    <div className="text-cyan-400 animate-pulse">
                      <span className="text-cyan-600 mr-2">{'>'}</span>_
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 border-b border-cyan-950/60 bg-[#06080e] flex items-center justify-between font-mono">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Info size={13} /> NODE DIAGNOSTICS: {selectedNode.id}
                </h2>
                <button onClick={() => setSelectedNode(null)} className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold cursor-pointer">
                  ✕ CLOSE
                </button>
              </div>
              
              <div className="p-4 border-b border-cyan-950/60 bg-[#070a12] font-mono">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">IDENTITY CERTIFICATE</div>
                    <div className="text-xs text-cyan-300 font-bold">{selectedNode.deviceCertificateId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">AGENT VERSION</div>
                    <div className="text-xs text-zinc-300">{selectedNode.version}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">INFERENCE CAPABILITIES</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.capabilities.map(cap => (
                      <span key={cap} className="px-2 py-0.5 bg-cyan-950/50 rounded text-[9px] text-cyan-300 border border-cyan-800/40">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {(selectedNode.id === 'EDGE-GJ-001' || selectedNode.id === 'EDGE-00042') && runtimeDiagnostics && (
                <div className="p-4 border-b border-cyan-950/60 bg-[#05070c] font-mono">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-2 flex items-center gap-1.5">
                    <Server size={12} /> EDGE RUNTIME HARDWARE TELEMETRY
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">RUNTIME STATE</div>
                      <div className="font-bold text-emerald-400">{runtimeDiagnostics.state}</div>
                    </div>
                    <div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">SQLITE QUEUE</div>
                      <div className="text-zinc-200">{runtimeDiagnostics.queueSize} PENDING</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-cyan-950/60">
                    <div className="flex flex-col items-center p-2 bg-[#090d16] rounded border border-cyan-950">
                      <Cpu size={12} className="text-cyan-400 mb-1" />
                      <div className="text-xs font-bold text-zinc-200">{runtimeDiagnostics.cpu}%</div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 mt-0.5">CPU</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-[#090d16] rounded border border-cyan-950">
                      <MemoryStick size={12} className="text-cyan-400 mb-1" />
                      <div className="text-xs font-bold text-zinc-200">{runtimeDiagnostics.memory} MB</div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 mt-0.5">RAM</div>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-[#090d16] rounded border border-cyan-950">
                      <Database size={12} className="text-cyan-400 mb-1" />
                      <div className="text-xs font-bold text-zinc-200">{runtimeDiagnostics.storage}%</div>
                      <div className="text-[8px] uppercase tracking-wider text-zinc-500 mt-0.5">NVME</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 border-b border-cyan-950/60 bg-[#06080e]">
                <h3 className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 font-bold">NODE COMMUNICATION LOGS</h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-[#04060a] space-y-2">
                {(selectedNode.id === 'EDGE-GJ-001' || selectedNode.id === 'EDGE-00042' ? liveLogs : []).map(log => (
                  <div key={log.id} className="bg-[#090d16] border border-cyan-950/60 rounded p-2 flex flex-col gap-1.5 font-mono">
                    <div className="flex justify-between items-center text-[9px]">
                      <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase">
                        {log.direction === 'inbound' ? <ArrowDownRight size={11} className="text-emerald-400" /> : <ArrowUpRight size={11} className="text-cyan-400" />}
                        <span className={log.direction === 'inbound' ? 'text-emerald-400' : 'text-cyan-400'}>{log.direction}</span>
                      </div>
                      <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-300 font-semibold">{log.type}</span>
                      <span className="text-emerald-400 font-bold">{log.status} | {log.payloadSize}B</span>
                    </div>
                  </div>
                ))}
                {(selectedNode.id !== 'EDGE-GJ-001' && selectedNode.id !== 'EDGE-00042') && (
                  <div className="text-center text-zinc-600 text-xs mt-8 font-mono">
                    Edge telemetry nominal. Select EDGE-GJ-001 for live bus stream.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showTests && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#090d16] border border-cyan-500/50 rounded-lg w-full max-w-2xl flex flex-col max-h-full shadow-[0_0_50px_rgba(6,182,212,0.2)]">
            <div className="p-4 border-b border-cyan-950/60 bg-[#06080e] flex justify-between items-center">
              <h2 className="font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2 text-sm">
                <Play size={16} /> AUTOMATED ARCHITECTURE TEST SUITE (69/69 VERIFICATION)
              </h2>
              <button onClick={() => setShowTests(false)} className="text-zinc-400 hover:text-white uppercase text-xs font-mono font-bold cursor-pointer">
                ✕ CLOSE
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2.5 font-mono text-xs max-h-[480px] custom-scrollbar bg-[#04060a]">
              {testResults.map((line, idx) => (
                <div key={idx} className={`${line.includes('✅') || line.includes('PASS') ? 'text-emerald-400' : line.includes('❌') ? 'text-rose-400 font-bold' : 'text-zinc-300'}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
