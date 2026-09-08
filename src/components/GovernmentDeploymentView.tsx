/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * GovernmentDeploymentView
 * On-Premise Government Network, Air-Gapped Intranet, GPU Tensor Nodes & NAS Cluster Architecture.
 * Certified compliant with Bharatiya Sakshya Adhiniyam, 2023 (BSA 2023).
 */

import React, { useState } from 'react';
import {
  Server,
  ShieldCheck,
  Cpu,
  HardDrive,
  Network,
  Lock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
  Terminal,
  FileCheck,
  RefreshCw,
  Zap,
  Globe,
  Radio,
  EyeOff
} from 'lucide-react';
import { deploymentArchitectureService } from '../services/DeploymentArchitectureService';
import { nasEvidenceStorageService } from '../services/NasEvidenceStorageService';

export function GovernmentDeploymentView() {
  const [config, setConfig] = useState(() => deploymentArchitectureService.getDeploymentConfig());
  const [audit, setAudit] = useState(() => deploymentArchitectureService.verifyAirGappedIntegrity());
  const [isReauditing, setIsReauditing] = useState(false);

  const triggerAudit = () => {
    setIsReauditing(true);
    setTimeout(() => {
      setAudit(deploymentArchitectureService.verifyAirGappedIntegrity());
      setConfig(deploymentArchitectureService.getDeploymentConfig());
      setIsReauditing(false);
    }, 500);
  };

  const clusterHealth = nasEvidenceStorageService.getClusterHealth();

  return (
    <div className="h-full flex flex-col bg-[#050811] text-zinc-100 font-sans select-none overflow-y-auto p-4 sm:p-6 space-y-5">
      
      {/* 1. TOP HEADER & STATUTORY ADMISSIBILITY BADGE */}
      <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-400">
                <Server size={20} />
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-mono uppercase">
                Government On-Premise & Air-Gapped Architecture
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded border border-emerald-500/30 uppercase font-mono">
                ZERO CLOUD DEPENDENCY
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Installation: <span className="text-zinc-200">{config.installationName}</span> • Tier: <span className="text-cyan-400">{config.governmentTier}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerAudit}
              disabled={isReauditing}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold rounded-lg border border-white/10 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={13} className={isReauditing ? 'animate-spin text-blue-400' : ''} />
              <span>{isReauditing ? 'Verifying...' : 'Run Security Audit'}</span>
            </button>
            <button
              onClick={() => {
                const report = JSON.stringify({ config, audit, clusterHealth, timestamp: new Date().toISOString() }, null, 2);
                const blob = new Blob([report], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `GOV_DEPLOYMENT_AUDIT_${Date.now()}.json`;
                a.click();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 shadow transition-all"
            >
              <Download size={13} />
              <span>Export Audit Certificate</span>
            </button>
          </div>
        </div>

        {/* Legal Certification Banner */}
        <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck size={16} className="text-emerald-400 flex-none" />
            <span>{audit.statutoryAdmissibility}</span>
          </div>
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            Tamper Seal Protocol: SHA-256 / WORM Vault
          </span>
        </div>
      </div>

      {/* 2. AIR-GAPPED SECURITY AUDIT CHECKLIST */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
          <Lock size={15} className="text-cyan-400" />
          <span>Air-Gapped Intranet & Sovereign Data Controls</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {audit.checks.map((c, idx) => (
            <div key={idx} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-white">{c.check}</span>
                <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                  {c.result}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-1 leading-relaxed">
                {c.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GPU INFERENCE CLUSTER */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
            <Cpu size={15} className="text-purple-400" />
            <span>On-Premise GPU Tensor Inference Fleet</span>
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            Total Edge Nodes: <strong className="text-white">{config.edgeIngressNodesCount}</strong> • Cameras: <strong className="text-cyan-400">{config.totalConfiguredCameras.toLocaleString()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.gpuInferenceNodes.map(node => (
            <div key={node.nodeId} className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold font-mono text-white">{node.gpuModel}</h3>
                  <span className="text-[10px] text-zinc-400 font-mono block">{node.hostName}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                  {node.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">VRAM Allocation</span>
                  <span className="text-white font-bold">{node.usedVramGB} / {node.totalVramGB} GB</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Throughput</span>
                  <span className="text-cyan-400 font-bold">{node.fpsThroughput} FPS</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Thermals</span>
                  <span className="text-amber-400 font-bold">{node.temperatureCelsius}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Runtime</span>
                  <span className="text-purple-400 font-bold">Podman Gov</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-zinc-400 font-mono uppercase block mb-1">Loaded Edge Models:</span>
                <div className="flex flex-wrap gap-1">
                  {node.modelsLoaded.map((m, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 text-[9px] font-mono rounded border border-white/5">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. GOVERNMENT FORENSIC NAS STORAGE VAULT */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono text-white uppercase flex items-center gap-2">
            <HardDrive size={15} className="text-emerald-400" />
            <span>Government Forensic NAS Vault Cluster Topology</span>
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            {clusterHealth.freeCapacityTB} TB Available of {clusterHealth.totalCapacityTB} TB Total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {config.nasClusterConfig.nodes.map(node => (
            <div key={node.nodeId} className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-white">{node.nodeId}</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-mono rounded">
                  {node.role}
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 space-y-0.5">
                <div>IP: <span className="text-zinc-200">{node.ipAddress}</span></div>
                <div>Mount: <span className="text-zinc-200">{node.mountPoint}</span></div>
                <div>Storage: <span className="text-emerald-400 font-bold">{node.usedCapacityTB} / {node.totalCapacityTB} TB</span></div>
                <div>Latency: <span className="text-cyan-400">{node.readWriteLatencyMs} ms</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
