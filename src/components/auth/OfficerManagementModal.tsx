/**
 * Copyright (c) 2026 Gujarat Police State Crime Records Bureau (SCRB)
 * Sentinel Grid — Officer Provisioning & Role Management Console (Admin Only)
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  UserCheck, 
  UserX, 
  Edit3, 
  RefreshCw, 
  Search, 
  Building2, 
  MapPin, 
  BadgeCheck, 
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SentinelUser, SentinelRole, SentinelAccountStatus } from '../../types/auth';

interface OfficerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficerManagementModal({ isOpen, onClose }: OfficerManagementModalProps) {
  const { officer, token } = useAuth();
  const [users, setUsers] = useState<SentinelUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selected user for editing / approving
  const [selectedUser, setSelectedUser] = useState<SentinelUser | null>(null);
  const [editRole, setEditRole] = useState<SentinelRole>('OPERATOR');
  const [editStatus, setEditStatus] = useState<SentinelAccountStatus>('ACTIVE');
  const [editBadgeId, setEditBadgeId] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to load officers: ${res.statusText}`);
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, token]);

  const handleOpenEdit = (target: SentinelUser) => {
    setSelectedUser(target);
    setEditRole(target.role);
    setEditStatus(target.status === 'PENDING' ? 'ACTIVE' : target.status);
    setEditBadgeId(target.badgeId || `GP-${target.role.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`);
    setEditDepartment(target.department === 'Awaiting Department Verification' ? 'City Surveillance Grid' : target.department);
    setEditDistrict(target.district || 'Ahmedabad Central');
    setActionSuccessMessage(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !token) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          role: editRole,
          status: editStatus,
          badgeId: editBadgeId,
          department: editDepartment,
          district: editDistrict
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update user');
      }

      const resData = await res.json();
      setActionSuccessMessage(`Successfully updated credentials for ${resData.user?.displayName || selectedUser.displayName}`);
      
      // Refresh local list
      await fetchUsers();
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update officer credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const pendingUsers = users.filter(u => u.status === 'PENDING');
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (u.badgeId && u.badgeId.toLowerCase().includes(searchFilter.toLowerCase())) ||
      u.district.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Officer Provisioning & Role Management</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  ADMIN CLEARANCE
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Gujarat Police State Surveillance Network • Controlled Credential & RBAC Allocation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={loading}
              title="Refresh Roster"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Pending Approval Notice Banner */}
          {pendingUsers.length > 0 && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Clock size={16} className="text-amber-600" />
                  <span>Pending Officer Intake Requests ({pendingUsers.length})</span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium">
                  Controlled Provisioning: Requires Admin Verification
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {pendingUsers.map(u => (
                  <div key={u.id} className="p-3 bg-white border border-amber-200 rounded-lg flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.displayName}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Signed in via Google • Status: PENDING</div>
                    </div>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    >
                      <UserCheck size={13} />
                      <span>Provision</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Edit / Provision Form Drawer */}
          {selectedUser && (
            <div className="p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Edit Officer Credentials: {selectedUser.displayName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as SentinelRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="COMMANDER">COMMANDER (Full District Oversight)</option>
                    <option value="INVESTIGATOR">INVESTIGATOR (Dossiers & Cross-Correlation)</option>
                    <option value="OPERATOR">OPERATOR (CCTV & Live Alerts)</option>
                    <option value="REVIEWER">REVIEWER (E-Challan & Evidence Validation)</option>
                    <option value="AUDITOR">AUDITOR (Section 63 BSA & Audit Logs)</option>
                    <option value="ADMIN">ADMIN (System & User Provisioning)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SentinelAccountStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE (Authorized to Operate)</option>
                    <option value="PENDING">PENDING (Awaiting Review)</option>
                    <option value="SUSPENDED">SUSPENDED (Temporarily Blocked)</option>
                    <option value="DISABLED">DISABLED (Decommissioned)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Police Badge / Service ID
                  </label>
                  <input
                    type="text"
                    value={editBadgeId}
                    onChange={(e) => setEditBadgeId(e.target.value)}
                    placeholder="e.g. GP-OP-4491"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Assigned Unit / Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jurisdiction / District
                  </label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isSubmitting ? 'Saving...' : 'Save & Enforce'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Roster Controls: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search officer name, email, badge..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Officer Roster Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Officer</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Badge ID</th>
                  <th className="py-2.5 px-3">Department & District</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{u.displayName}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : u.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : u.status === 'SUSPENDED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {u.badgeId || <span className="text-slate-400 italic">Not Assigned</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{u.department}</div>
                      <div className="text-[11px] text-slate-400">{u.district}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition cursor-pointer"
                      >
                        Modify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-slate-400" />
            <span>Changes are cryptographically logged in the SCRB audit chain</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
