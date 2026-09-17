/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Command Center Header Officer Profile & Sign-Out Menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  User, 
  LogOut, 
  Lock, 
  ChevronDown, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  BadgeCheck, 
  Key, 
  FileText,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SentinelRole } from '../../types/auth';
import { OfficerManagementModal } from './OfficerManagementModal';

interface OfficerProfileMenuProps {
  onOpenSecurity?: () => void;
  onOpenAudit?: () => void;
}

export function OfficerProfileMenu({ onOpenSecurity, onOpenAudit }: OfficerProfileMenuProps) {
  const { officer, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!officer) return null;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
      setIsOpen(false);
    }
  };

  const getRoleBadgeStyle = (role: SentinelRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMMANDER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'INVESTIGATOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OPERATOR':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'REVIEWER':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'AUDITOR':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Initials for avatar fallback
  const initials = officer.displayName
    ? officer.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'GP';

  return (
    <div className="relative" ref={menuRef}>
      {/* Officer Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Officer Profile and Session Menu"
        className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 hover:bg-slate-50 py-1 px-2 rounded-xl transition cursor-pointer group"
      >
        {/* Officer Avatar / Google Photo */}
        {officer.photoURL ? (
          <img 
            src={officer.photoURL} 
            alt={officer.displayName} 
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-xl object-cover border border-slate-300 group-hover:border-blue-500 shadow-2xs transition"
          />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {initials}
          </div>
        )}

        {/* Officer Text Details */}
        <div className="hidden lg:flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[140px]">
              {officer.displayName}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(officer.role)}`}>
              {officer.role}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
              {officer.district}
            </span>
          </div>
        </div>

        <ChevronDown size={14} className={`text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Profile Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Card */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              {officer.photoURL ? (
                <img 
                  src={officer.photoURL} 
                  alt={officer.displayName} 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {officer.displayName}
                  </h4>
                  <BadgeCheck size={16} className="text-blue-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-500 truncate" title={officer.email}>
                  {officer.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(officer.role)}`}>
                    {officer.role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Departmental & Role Attributes */}
          <div className="p-3 space-y-2 text-xs border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Shield size={13} className="text-slate-400" /> Badge ID
              </span>
              <span className="font-semibold text-slate-800 font-mono">
                {officer.badgeId || 'NOT_CONFIGURED'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Building2 size={13} className="text-slate-400" /> Department
              </span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">
                {officer.department}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin size={13} className="text-slate-400" /> District Zone
              </span>
              <span className="font-semibold text-slate-800">
                {officer.district}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock size={13} className="text-slate-400" /> Session Expiry
              </span>
              <span className="font-medium text-slate-500 text-[11px]">
                60 min (Auto-refresh)
              </span>
            </div>
          </div>

          {/* Security & Verification Credentials */}
          <div className="p-3 bg-slate-50/70 border-b border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 size={12} className="text-emerald-600" />
              <span>Identity Verified via Firebase & Google ID Token</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Lock size={12} className="text-blue-500" />
              <span>Role-Based Access Control enforced on backend</span>
            </div>
          </div>

          {/* Admin Tools (If Officer has ADMIN role) */}
          {officer.role === 'ADMIN' && (
            <div className="p-2 border-b border-slate-100 bg-purple-50/50">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsUserMgmtOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-purple-800 bg-purple-100 hover:bg-purple-200/80 flex items-center justify-between transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-purple-700" />
                  <span>Officer Provisioning & Roster</span>
                </span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                  ADMIN
                </span>
              </button>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="p-2 bg-white">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <LogOut size={14} />
              <span>{isSigningOut ? 'Ending Session…' : 'Sign out of Sentinel'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Officer Management Modal */}
      {officer.role === 'ADMIN' && (
        <OfficerManagementModal 
          isOpen={isUserMgmtOpen} 
          onClose={() => setIsUserMgmtOpen(false)} 
        />
      )}
    </div>
  );
}
