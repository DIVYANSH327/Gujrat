/**
 * Copyright (c) 2026 DIVYANSH Shrivastava.
 * All rights reserved.
 * 
 * SourceOfTruthBadge: Strict Epistemic Labeling Component
 * Differentiates Physical Sensors, AI Predictions, Human Decisions, and External Gateways
 */

import React from 'react';
import { SourceOfTruthCategory } from '../../types';
import { Camera, Cpu, UserCheck, ShieldCheck, PlayCircle, Compass } from 'lucide-react';

interface Props {
  category: SourceOfTruthCategory;
  size?: 'sm' | 'md';
}

export const SourceOfTruthBadge: React.FC<Props> = ({ category, size = 'sm' }) => {
  const getBadgeConfig = () => {
    switch (category) {
      case 'CAMERA_OBSERVED':
        return {
          label: 'CAMERA OBSERVED',
          bg: 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400',
          icon: Camera
        };
      case 'AI_INFERRED':
        return {
          label: 'AI INFERRED',
          bg: 'bg-indigo-950/50 border-indigo-500/40 text-indigo-400',
          icon: Cpu
        };
      case 'HUMAN_VERIFIED':
        return {
          label: 'HUMAN VERIFIED',
          bg: 'bg-amber-950/50 border-amber-500/40 text-amber-300',
          icon: UserCheck
        };
      case 'EXTERNAL_AUTHORIZED':
        return {
          label: 'EXTERNAL AUTHORIZED',
          bg: 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300',
          icon: ShieldCheck
        };
      case 'SIMULATED':
        return {
          label: 'SIMULATED DEMO',
          bg: 'bg-slate-900/60 border-slate-700 text-slate-400',
          icon: PlayCircle
        };
      case 'PREDICTED':
        return {
          label: 'PREDICTED CORRIDOR',
          bg: 'bg-purple-950/50 border-purple-500/40 text-purple-300',
          icon: Compass
        };
      default:
        return {
          label: category,
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Cpu
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span 
      id={`badge-truth-${category.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded border font-mono font-medium tracking-wide uppercase ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};
