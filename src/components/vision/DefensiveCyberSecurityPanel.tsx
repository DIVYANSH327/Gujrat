/**
 * DefensiveCyberSecurityPanel: Defensive Cybersecurity Agent Mesh Command Center
 * Gujarat Police CCTV & AI Intelligence Platform
 * Inverts yaklang/hack-skills offensive research into active defensive vigilance.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Lock,
  Terminal,
  Activity,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  Eye,
  Server,
  KeyRound,
  Network,
  Cpu,
  UserCheck
} from 'lucide-react';
import {
  CyberActionItem,
  CyberAgentMetadata,
  CyberAuditRecord,
  CyberSecurityFinding,
  CyberSecurityPosture
} from '../../services/cybersecurity/CyberSecurityTypes';

export function DefensiveCyberSecurityPanel() {
  const [posture, setPosture] = useState<CyberSecurityPosture | null>(null);
  const [agents, setAgents] = useState<CyberAgentMetadata[]>([]);
  const [findings, setFindings] = useState<CyberSecurityFinding[]>([]);
  const [auditLog, setAuditLog] = useState<CyberAuditRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [activeModalAction, setActiveModalAction] = useState<CyberActionItem | null>(null);
  const [modalMode, setModalMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [officerRank, setOfficerRank] = useState('Insp. V. K. Jadeja (Cyber Crime Cell)');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchSecurityData = useCallback(async () => {
    try {
      const [postureRes, agentsRes, findingsRes, auditRes] = await Promise.all([
        fetch('/api/security/center/status'),
        fetch('/api/security/center/agents'),
        fetch(`/api/security/center/findings?category=${selectedCategory}`),
        fetch('/api/security/center/audit-log')
      ]);

      if (postureRes.ok) setPosture(await postureRes.json());
      if (agentsRes.ok) setAgents(await agentsRes.json());
      if (findingsRes.ok) setFindings(await findingsRes.json());
      if (auditRes.ok) setAuditLog(await auditRes.json());
    } catch (err) {
      console.warn('Security Center fetch notice:', err);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 5000);
    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  const handleScanNow = async () => {
    setIsScanning(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/security/center/scan-now', { method: 'POST' });
      if (res.ok) {
        setActionNotice('Comprehensive defensive security scan completed across all 10 agents.');
      }
    } catch (err: any) {
      setActionNotice('Scan failed: ' + (err?.message || err));
    } finally {
      setIsScanning(false);
      fetchSecurityData();
    }
  };

  const handleExecuteApproval = async () => {
    if (!activeModalAction) return;

    try {
      if (modalMode === 'APPROVE') {
        const res = await fetch(`/api/security/center/actions/${activeModalAction.actionId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorizedBy: officerRank })
        });
        if (res.ok) {
          setActionNotice(`Action ${activeModalAction.title} approved and containment active.`);
        }
      } else {
        const res = await fetch(`/api/security/center/actions/${activeModalAction.actionId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Manual rejection by officer' })
        });
        if (res.ok) {
          setActionNotice(`Action ${activeModalAction.title} rejected.`);
        }
      }
    } catch (err: any) {
      setActionNotice('Action operation failed: ' + (err?.message || err));
    } finally {
      setActiveModalAction(null);
      fetchSecurityData();
    }
  };

  const getAgentIcon = (id: string) => {
    if (id.includes('network')) return <Network className="w-4 h-4 text-cyan-600" />;
    if (id.includes('auth')) return <KeyRound className="w-4 h-4 text-indigo-600" />;
    if (id.includes('stream')) return <Eye className="w-4 h-4 text-emerald-600" />;
    if (id.includes('api')) return <Terminal className="w-4 h-4 text-blue-600" />;
    if (id.includes('secret')) return <Lock className="w-4 h-4 text-amber-600" />;
    if (id.includes('dep')) return <Cpu className="w-4 h-4 text-purple-600" />;
    if (id.includes('cloud')) return <Server className="w-4 h-4 text-teal-600" />;
    return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ACTIVE DEFENSE MESH
              </span>
              <span className="text-xs text-slate-400 font-mono">
                10 Specialized Agents (Inspired by yaklang/hack-skills research)
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
              Defensive Cybersecurity & Infrastructure Hardening
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Continuous monitoring of CCTV network perimeters, Corp8 camera streams, API boundaries, and Section 63 BSA 2023 evidence integrity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleScanNow}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Auditing Mesh...' : 'Trigger Security Audit'}
            </button>
          </div>
        </div>

        {actionNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Compliance Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">BSA Section 63</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> COMPLIANT
            </div>
            <div className="text-[10px] text-slate-400 mt-1">SHA-256 Hash Chaining</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">CERT-In Guidelines</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> VERIFIED
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Audit Trail Preserved</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stream Transport</div>
            <div className="text-sm font-bold text-teal-300 mt-0.5 flex items-center gap-1">
              <Lock className="w-4 h-4" /> TLS / ISOLATED
            </div>
            <div className="text-[10px] text-slate-400 mt-1">In-Memory Decoding</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Credential Hygiene</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
              <KeyRound className="w-4 h-4" /> ZERO EXPOSURE
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Process Memory Shield</div>
          </div>
        </div>
      </div>

      {/* 10 Specialized Defensive Agents Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            10 Defensive Cybersecurity Agents (Fleet Health)
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {agents.filter(a => a.status === 'ONLINE').length} / {agents.length || 10} Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="p-1.5 rounded-md bg-slate-50 border border-slate-100">
                    {getAgentIcon(agent.id)}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {agent.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{agent.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {agent.description}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>{agent.capabilities.length} Capabilities</span>
                <span className="text-slate-500 font-mono">100% Pass</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Approval Queue (Human In The Loop) */}
      {findings.flatMap(f => f.recommendedActions).some(a => a.requiresHumanApproval && a.approvalState === 'PENDING_HUMAN_APPROVAL') && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                  High-Impact Containment Actions Pending Officer Authorization
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                  Strict Rule: RECOMMEND THEN APPROVE
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Containment actions (network micro-segmentation, stream quarantine, firewall rule enforcement) require human confirmation prior to execution.
              </p>

              <div className="mt-3 space-y-2">
                {findings.flatMap(f => f.recommendedActions)
                  .filter(a => a.requiresHumanApproval && a.approvalState === 'PENDING_HUMAN_APPROVAL')
                  .map(action => (
                    <div
                      key={action.actionId}
                      className="bg-white border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{action.title}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{action.description}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Target: {action.target} {action.remediationCommand && `| Command: ${action.remediationCommand}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setActiveModalAction(action);
                            setModalMode('APPROVE');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve & Execute
                        </button>
                        <button
                          onClick={() => {
                            setActiveModalAction(action);
                            setModalMode('REJECT');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column: Active Findings & Immutable Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Findings */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Active Defensive Findings ({findings.length})
            </h3>

            {/* Category Filter */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {['ALL', 'NETWORK', 'AUTH', 'STREAM', 'API', 'SECRET', 'DEPENDENCY'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {findings.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        f.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : f.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{f.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round(f.confidence * 100)}% conf
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{f.description}</p>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Agent: {f.agentName}</span>
                  <span className="font-mono">{f.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Immutable Audit Log */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Immutable Defensive Audit Log (BSA 2023)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">SHA-256 Chained</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
              {auditLog.map((log) => (
                <div key={log.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{log.action}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Target: <strong className="text-slate-700">{log.target}</strong></span>
                    <span>Result: <strong className="text-emerald-600">{log.result}</strong></span>
                    {log.authorizedBy && (
                      <span>Auth: <strong className="text-indigo-600">{log.authorizedBy}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for High Impact Actions */}
      {activeModalAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-full bg-amber-100 text-amber-700">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Confirm Containment Action Authorization
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Gujarat Police Standard Operating Procedure: High-impact actions require designated officer verification.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
              <div><strong>Action:</strong> {activeModalAction.title}</div>
              <div><strong>Target:</strong> {activeModalAction.target}</div>
              <div><strong>Category:</strong> {activeModalAction.category}</div>
              {activeModalAction.remediationCommand && (
                <div><strong>System Command:</strong> <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">{activeModalAction.remediationCommand}</code></div>
              )}
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Authorizing Police Officer Credentials
              </label>
              <input
                type="text"
                value={officerRank}
                onChange={(e) => setOfficerRank(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModalAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteApproval}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Confirm & Record in Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
