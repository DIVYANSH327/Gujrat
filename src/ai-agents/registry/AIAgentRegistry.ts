/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * AIAgentRegistry: Central Agent Discovery, Heartbeat Tracking & Health Governance
 */

import { IAIAgent, AgentCapability, AIAgentInfo, AgentType } from '../types';
import { sysEvents } from '../../services/Architecture';

export class AIAgentRegistry {
  private static instance: AIAgentRegistry | null = null;
  private agents: Map<string, IAIAgent> = new Map();
  private heartbeatInterval: any = null;

  private constructor() {
    this.startHeartbeatMonitor();
  }

  public static getInstance(): AIAgentRegistry {
    if (!AIAgentRegistry.instance) {
      AIAgentRegistry.instance = new AIAgentRegistry();
    }
    return AIAgentRegistry.instance;
  }

  public register(agent: IAIAgent): void {
    this.agents.set(agent.agentId, agent);
    sysEvents.emit('ai_agent_registered', {
      agentId: agent.agentId,
      agentType: agent.agentType,
      capabilities: agent.getCapabilities()
    });
  }

  public unregister(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.stop();
      this.agents.delete(agentId);
      sysEvents.emit('ai_agent_unregistered', { agentId });
      return true;
    }
    return false;
  }

  public getAgent(agentId: string): IAIAgent | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): IAIAgent[] {
    return Array.from(this.agents.values());
  }

  public getAllAgentInfos(): AIAgentInfo[] {
    return Array.from(this.agents.values()).map(a => a.getInfo());
  }

  public findAgentsByCapability(capability: AgentCapability): IAIAgent[] {
    return Array.from(this.agents.values()).filter(a => 
      a.getCapabilities().includes(capability) && 
      a.getStatus() !== 'OFFLINE' && 
      a.getStatus() !== 'ERROR'
    );
  }

  public findAgentsByType(agentType: AgentType): IAIAgent[] {
    return Array.from(this.agents.values()).filter(a => a.agentType === agentType);
  }

  public recordHeartbeat(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.recordHeartbeat();
      if (agent.getStatus() === 'OFFLINE' || agent.getStatus() === 'DEGRADED') {
        agent.resume();
      }
      return true;
    }
    return false;
  }

  public detectOfflineAgents(timeoutMs: number = 45000): string[] {
    const now = Date.now();
    const offlineIds: string[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      if (agent.getStatus() === 'OFFLINE') continue;

      const lastHb = new Date(agent.getInfo().lastHeartbeat).getTime();
      if (now - lastHb > timeoutMs) {
        agent.stop();
        offlineIds.push(agentId);
        sysEvents.emit('ai_agent_offline', { agentId, reason: 'HEARTBEAT_TIMEOUT' });
      }
    }

    return offlineIds;
  }

  public clear(): void {
    this.agents.clear();
  }

  private startHeartbeatMonitor(): void {
    if (typeof window !== 'undefined') {
      this.heartbeatInterval = setInterval(() => {
        this.detectOfflineAgents();
      }, 15000);
    }
  }

  public dispose(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const agentRegistry = AIAgentRegistry.getInstance();
