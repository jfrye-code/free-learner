import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Guardian {
  id: string;
  student_id: string;
  guardian_user_id: string | null;
  guardian_email: string;
  guardian_name: string;
  role: string;
  relationship_label: string | null;
  status: string;
  permissions: {
    view_progress: boolean;
    view_reports: boolean;
    manage_controls: boolean;
    view_activity: boolean;
    manage_goals: boolean;
  };
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
}

interface GuardianManagerProps {
  studentId: string;
  studentName: string;
}

const ROLE_OPTIONS = [
  { value: 'parent', label: 'Parent', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', color: 'blue' },
  { value: 'guardian', label: 'Legal Guardian', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', color: 'indigo' },
  { value: 'grandparent', label: 'Grandparent', icon: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z', color: 'pink' },
  { value: 'tutor', label: 'Tutor', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'teal' },
  { value: 'teacher', label: 'Teacher / Educator', icon: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c0 2 4 3 6 3s6-1 6-3v-5', color: 'orange' },
  { value: 'other', label: 'Other Family / Caregiver', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', color: 'purple' },
];

const PERMISSION_OPTIONS = [
  { key: 'view_progress', label: 'View Learning Progress', desc: 'See subjects, grades, and completion data' },
  { key: 'view_reports', label: 'View Reports', desc: 'Access weekly and monthly progress reports' },
  { key: 'view_activity', label: 'View Activity Feed', desc: 'See real-time learning activity' },
  { key: 'manage_goals', label: 'Manage Learning Goals', desc: 'Create and edit learning goals' },
  { key: 'manage_controls', label: 'Manage Parental Controls', desc: 'Change time limits, content filters, etc.' },
];

const GuardianManager: React.FC<GuardianManagerProps> = ({ studentId, studentName }) => {
  const { user } = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    guardian_name: '',
    guardian_email: '',
    role: 'parent',
    relationship_label: '',
    permissions: {
      view_progress: true,
      view_reports: true,
      manage_controls: false,
      view_activity: true,
      manage_goals: false,
    },
  });

  const fetchGuardians = useCallback(async () => {
    if (!studentId || !user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_guardians')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setGuardians(data as Guardian[]);
      }
    } catch (err) {
      console.warn('Failed to fetch guardians:', err);
    }
    setLoading(false);
  }, [studentId, user?.id]);

  useEffect(() => {
    fetchGuardians();
  }, [fetchGuardians]);

  const resetForm = () => {
    setForm({
      guardian_name: '',
      guardian_email: '',
      role: 'parent',
      relationship_label: '',
      permissions: {
        view_progress: true,
        view_reports: true,
        manage_controls: false,
        view_activity: true,
        manage_goals: false,
      },
    });
    setShowInviteForm(false);
    setEditingId(null);
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleInvite = async () => {
    if (!form.guardian_name.trim()) { showMsg('error', 'Please enter a name.'); return; }
    if (!form.guardian_email.trim() || !form.guardian_email.includes('@')) { showMsg('error', 'Please enter a valid email.'); return; }
    if (!user?.id) return;

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('student_guardians')
          .update({
            guardian_name: form.guardian_name.trim(),
            guardian_email: form.guardian_email.trim().toLowerCase(),
            role: form.role,
            relationship_label: form.relationship_label.trim() || null,
            permissions: form.permissions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        showMsg('success', 'Guardian updated successfully.');
      } else {
        const { error } = await supabase
          .from('student_guardians')
          .insert({
            student_id: studentId,
            guardian_name: form.guardian_name.trim(),
            guardian_email: form.guardian_email.trim().toLowerCase(),
            role: form.role,
            relationship_label: form.relationship_label.trim() || null,
            permissions: form.permissions,
            invited_by: user.id,
            status: 'pending',
          });

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            showMsg('error', 'This person is already linked to this student.');
          } else {
            throw error;
          }
          setSaving(false);
          return;
        }
        showMsg('success', `Invitation sent to ${form.guardian_name}. They will have access once they create an account or log in.`);
      }
      resetForm();
      await fetchGuardians();
    } catch (err: any) {
      showMsg('error', err.message || 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const handleEdit = (g: Guardian) => {
    setEditingId(g.id);
    setForm({
      guardian_name: g.guardian_name,
      guardian_email: g.guardian_email,
      role: g.role,
      relationship_label: g.relationship_label || '',
      permissions: g.permissions || {
        view_progress: true,
        view_reports: true,
        manage_controls: false,
        view_activity: true,
        manage_goals: false,
      },
    });
    setShowInviteForm(true);
  };

  const handleRevoke = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_guardians')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMsg('success', 'Access revoked successfully.');
      setShowRevokeConfirm(null);
      await fetchGuardians();
    } catch (err: any) {
      showMsg('error', err.message || 'Failed to revoke access.');
    }
    setSaving(false);
  };

  const getRoleInfo = (role: string) => ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[5];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
      case 'revoked': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Revoked' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  const getRoleColor = (role: string) => {
    const r = getRoleInfo(role);
    switch (r.color) {
      case 'blue': return 'from-blue-400 to-blue-600';
      case 'indigo': return 'from-indigo-400 to-indigo-600';
      case 'pink': return 'from-pink-400 to-pink-600';
      case 'teal': return 'from-teal to-teal-dark';
      case 'orange': return 'from-orange to-orange-dark';
      case 'purple': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-indigo-900">Multi-Guardian Access for {studentName}</h3>
            <p className="font-body text-xs text-indigo-600/70 mt-1">
              Add parents, guardians, grandparents, tutors, or teachers who need access to {studentName}'s learning progress. 
              Each person gets their own login and customizable permissions. Perfect for divorced parents in separate households, 
              grandparents, and other educators.
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
        }`}>
          {message.type === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          <span className={`font-body text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</span>
        </div>
      )}

      {/* Guardian List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-charcoal">Linked Guardians & Educators</h2>
            <p className="font-body text-sm text-charcoal/50 mt-1">
              {guardians.length} {guardians.length === 1 ? 'person' : 'people'} linked to {studentName}'s account
            </p>
          </div>
          {!showInviteForm && (
            <button
              onClick={() => { resetForm(); setShowInviteForm(true); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-body font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Person
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Invite Form */}
          {showInviteForm && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 mb-6">
              <h3 className="font-heading font-bold text-sm text-charcoal mb-4">
                {editingId ? 'Edit Guardian / Educator' : 'Add Guardian / Educator'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.guardian_name}
                    onChange={(e) => setForm(prev => ({ ...prev, guardian_name: e.target.value }))}
                    placeholder="e.g., Jane Smith"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    value={form.guardian_email}
                    onChange={(e) => setForm(prev => ({ ...prev, guardian_email: e.target.value }))}
                    placeholder="e.g., jane@example.com"
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-4">
                <label className="block font-body font-semibold text-xs text-charcoal/60 mb-2">Role *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(prev => ({ ...prev, role: opt.value }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.role === opt.value
                          ? 'border-indigo-400 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={form.role === opt.value ? '#4F46E5' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={opt.icon} />
                        </svg>
                        <span className={`font-body text-xs font-semibold ${form.role === opt.value ? 'text-indigo-700' : 'text-charcoal/60'}`}>
                          {opt.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Relationship Label */}
              <div className="mb-4">
                <label className="block font-body font-semibold text-xs text-charcoal/60 mb-1.5">Custom Label (optional)</label>
                <input
                  type="text"
                  value={form.relationship_label}
                  onChange={(e) => setForm(prev => ({ ...prev, relationship_label: e.target.value }))}
                  placeholder="e.g., Dad's household, Math tutor, Grandma Rose"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <label className="block font-body font-semibold text-xs text-charcoal/60 mb-2">Permissions</label>
                <div className="space-y-2">
                  {PERMISSION_OPTIONS.map(perm => (
                    <div key={perm.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div>
                        <p className="font-body text-sm font-semibold text-charcoal">{perm.label}</p>
                        <p className="font-body text-xs text-charcoal/40">{perm.desc}</p>
                      </div>
                      <button
                        onClick={() => setForm(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, [perm.key]: !prev.permissions[perm.key as keyof typeof prev.permissions] }
                        }))}
                        className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${
                          form.permissions[perm.key as keyof typeof form.permissions] ? 'bg-indigo-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                          form.permissions[perm.key as keyof typeof form.permissions] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleInvite}
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-body font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                  )}
                  {editingId ? 'Update' : 'Add & Send Invite'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-5 py-2.5 font-body font-semibold text-sm text-charcoal/50 hover:text-charcoal hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Guardian Cards */}
          {loading ? (
            <div className="text-center py-12">
              <svg className="animate-spin mx-auto mb-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              <p className="font-body text-sm text-charcoal/40">Loading guardians...</p>
            </div>
          ) : guardians.length === 0 && !showInviteForm ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/>
                </svg>
              </div>
              <h3 className="font-heading font-bold text-charcoal mb-1">No guardians linked yet</h3>
              <p className="font-body text-sm text-charcoal/40 mb-4 max-w-md mx-auto">
                Add other parents, guardians, grandparents, tutors, or teachers who should have access to {studentName}'s learning progress.
              </p>
              <button
                onClick={() => { resetForm(); setShowInviteForm(true); }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-body font-bold text-sm rounded-xl shadow-sm transition-all"
              >
                Add First Guardian
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {guardians.map((g) => {
                const roleInfo = getRoleInfo(g.role);
                const statusBadge = getStatusBadge(g.status);
                return (
                  <div key={g.id} className="relative bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 transition-all group">
                    {/* Revoke Confirmation Overlay */}
                    {showRevokeConfirm === g.id && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 p-4">
                        <div className="text-center">
                          <p className="font-body font-bold text-sm text-charcoal mb-1">Remove {g.guardian_name}?</p>
                          <p className="font-body text-xs text-charcoal/50 mb-3">They will lose access to {studentName}'s data.</p>
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              onClick={() => handleRevoke(g.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-body font-bold text-xs rounded-lg transition-all"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => setShowRevokeConfirm(null)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-charcoal/60 font-body font-semibold text-xs rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRoleColor(g.role)} flex items-center justify-center text-white font-heading font-bold text-sm shadow-sm flex-shrink-0`}>
                        {g.guardian_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-bold text-sm text-charcoal">{g.guardian_name}</h4>
                          <span className={`px-2 py-0.5 ${statusBadge.bg} ${statusBadge.text} rounded-full text-[10px] font-body font-bold`}>
                            {statusBadge.label}
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-body font-bold">
                            {roleInfo.label}
                          </span>
                        </div>
                        <p className="font-body text-xs text-charcoal/40 mt-0.5">{g.guardian_email}</p>
                        {g.relationship_label && (
                          <p className="font-body text-xs text-indigo-500 mt-0.5">{g.relationship_label}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {g.permissions?.view_progress && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-body rounded">Progress</span>}
                          {g.permissions?.view_reports && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-body rounded">Reports</span>}
                          {g.permissions?.view_activity && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-body rounded">Activity</span>}
                          {g.permissions?.manage_goals && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-body rounded">Goals</span>}
                          {g.permissions?.manage_controls && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] font-body rounded">Controls</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(g)}
                          className="p-2 rounded-lg hover:bg-white text-charcoal/40 hover:text-indigo-600 transition-all"
                          title="Edit"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowRevokeConfirm(g.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-charcoal/40 hover:text-red-500 transition-all"
                          title="Remove"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardianManager;
