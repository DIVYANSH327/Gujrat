import React, { useState } from 'react';
import { Shield, Plus, Server, Send, CheckCircle2, Lock, FileCode, Cpu, AlertTriangle } from 'lucide-react';
import { SecurityRule } from '../types';

const CANONICAL_SECURITY_RULES: SecurityRule[] = [
  {
    id: 'RULE-ANPR-001',
    name: 'Statewide ANPR Hotlist Intercept',
    targetNode: 'ALL',
    condition: {
      object: 'vehicle',
      zone: 'HOTLIST_MATCH == TRUE',
      time: '00:00-23:59'
    },
    action: {
      event: 'DISPATCH_PATROL_ALERT',
      priority: 'critical'
    }
  },
  {
    id: 'RULE-PERIMETER-002',
    name: 'Restricted High-Security Zone Ingress',
    targetNode: 'EDGE-GJ-001',
    condition: {
      object: 'person | vehicle',
      zone: 'POLICE_HQ_PERIMETER',
      time: '22:00-06:00'
    },
    action: {
      event: 'TRIGGER_PERIMETER_ALARM',
      priority: 'critical'
    }
  },
  {
    id: 'RULE-TRAFFIC-003',
    name: 'Corridor Counter-Flow (Wrong Way)',
    targetNode: 'ALL',
    condition: {
      object: 'vehicle',
      zone: 'EXPRESSWAY_OPPOSITE_VECTOR',
      time: '00:00-23:59'
    },
    action: {
      event: 'LOG_TRAFFIC_VIOLATION',
      priority: 'high'
    }
  },
  {
    id: 'RULE-CROWD-004',
    name: 'Public Junction Crowd Convergence',
    targetNode: 'EDGE-SURAT-01',
    condition: {
      object: 'crowd_density > 45_PERSONS_PER_M2',
      zone: 'CIVIC_CENTER',
      time: '08:00-22:00'
    },
    action: {
      event: 'ALERT_TACTICAL_DESK',
      priority: 'medium'
    }
  },
  {
    id: 'RULE-SPEED-005',
    name: 'Expressway Over-Speed Telemetry',
    targetNode: 'ALL',
    condition: {
      object: 'vehicle_speed > 120_KMH',
      zone: 'NE1_EXPRESSWAY',
      time: '00:00-23:59'
    },
    action: {
      event: 'GENERATE_ECHALLAN_EVIDENCE',
      priority: 'high'
    }
  },
  {
    id: 'RULE-TAMPER-006',
    name: 'Optical Occlusion & Camera Tampering',
    targetNode: 'ALL',
    condition: {
      object: 'camera_feed_loss | lens_spray',
      zone: 'ANY',
      time: '00:00-23:59'
    },
    action: {
      event: 'DISPATCH_TECH_CREW',
      priority: 'critical'
    }
  }
];

export function SecurityPolicies() {
  const [rules, setRules] = useState<SecurityRule[]>(CANONICAL_SECURITY_RULES);
  const [pushedId, setPushedId] = useState<string | null>(null);

  const handlePush = (ruleId: string) => {
    setPushedId(ruleId);
    setTimeout(() => {
      setPushedId(null);
    }, 2000);
  };

  return (
    <div className="p-6 min-h-full flex flex-col bg-[#05070c] text-zinc-100 font-sans">
      {/* Header */}
      <div className="mb-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-950/50 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              GUJARAT POLICE RULE ENGINE
            </span>
            <span className="text-[10px] font-mono text-zinc-400">STATELESS PROPAGATION: ACTIVE</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-zinc-100 font-mono">
            SECURITY POLICIES & BEHAVIORAL RULES
          </h1>
          <p className="text-xs text-zinc-400">
            Centrally authored detection definitions propagated statelessly to edge nodes with cryptographic signatures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded border border-emerald-700/50 flex items-center gap-1.5 font-bold">
            <Lock size={14} />
            <span>ECDSA P-256 SIGNATURE ENFORCED</span>
          </span>
        </div>
      </div>

      {/* Grid of Rules */}
      <div className="flex-1 bg-[#090d16] border border-cyan-950/70 rounded-lg p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {rules.map(rule => (
            <div 
              key={rule.id} 
              className="bg-[#05070c] border border-cyan-950 rounded-lg flex flex-col shadow-sm overflow-hidden group hover:border-cyan-600/50 transition-all font-mono"
            >
              <div className="p-3.5 border-b border-cyan-950/80 bg-[#070a12] flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xs text-zinc-100 mb-1">{rule.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-cyan-400">{rule.id}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                      rule.action.priority === 'critical' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                      rule.action.priority === 'high' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                      'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                    }`}>
                      {rule.action.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-3">
                    <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mb-1 flex items-center gap-1">
                      <Server size={11} className="text-cyan-400" /> TARGET EDGE DEPLOYMENT
                    </div>
                    <div className="text-[11px] text-zinc-200 bg-[#080c16] px-2 py-1 rounded border border-cyan-950 inline-block font-semibold">
                      {rule.targetNode === 'ALL' ? 'GLOBAL (ALL GUJARAT NODES)' : rule.targetNode}
                    </div>
                  </div>

                  <div className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mb-1 flex items-center gap-1">
                    <FileCode size={11} className="text-cyan-400" /> RAW JSON DEFINITION
                  </div>
                  <div className="bg-[#030407] border border-cyan-950 rounded p-2.5 overflow-x-auto">
                    <pre className="text-[10px] text-cyan-300/90 leading-relaxed font-mono">
{`{
  "rule_id": "${rule.id}",
  "camera": "ANY",
  "condition": {
    "object": "${rule.condition.object}",
    "zone": "${rule.condition.zone}",
    "time": "${rule.condition.time}"
  },
  "action": {
    "event": "${rule.action.event}",
    "priority": "${rule.action.priority}"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="p-3 border-t border-cyan-950/80 bg-[#070a12] flex justify-between items-center text-[10px]">
                <div className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Shield size={12} /> ACTIVE ON EDGE
                </div>
                <button 
                  onClick={() => handlePush(rule.id)}
                  className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/40 px-2 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {pushedId === rule.id ? (
                    <>
                      <CheckCircle2 size={11} className="text-emerald-400" />
                      <span className="text-emerald-400">PROPAGATED</span>
                    </>
                  ) : (
                    <>
                      <Send size={11} />
                      <span>PUSH UPDATE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
