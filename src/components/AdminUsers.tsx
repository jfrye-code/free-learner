import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UserEntry {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  school_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string | null;
  children_count: number;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  is_suspended: boolean;
}

interface UserDetail {
  profile: UserEntry;
  children: any[];
  referrals: any[];
  redemptions: any[];
  auth: {
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    created_at: string;
    banned_until: string | null;
  } | null;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Detail view
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'list-users',
          search: search || undefined,
          role_filter: roleFilter,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          per_page: 25,
        },
      });
      if (error) throw error;
      if (data?.users) setUsers(data.users);
      if (data?.total !== undefined) setTotal(data.total);
      if (data?.total_pages) setTotalPages(data.total_pages);
    } catch (err) {
      console.warn('Load users error:', err);
    }
    setLoading(false);
  }, [search, roleFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    const timer = setTimeout(() => loadUsers(), 300);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const showMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const viewUserDetail = async (userId: string) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const { data } = await supabase.functions.invoke('admin-users', {
        body: { action: 'get-user-detail', target_user_id: userId },
      });
      if (data) setSelectedUser(data);
    } catch { showMsg('Failed to load user details', 'error'); }
    setDetailLoading(false);
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'change-role', target_user_id: userId, new_role: newRole },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg(`Role changed to ${newRole}`, 'success');
      loadUsers();
      if (selectedUser?.profile.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, profile: { ...prev.profile, role: newRole } } : null);
      }
    } catch (err: any) { showMsg(err.message || 'Failed', 'error'); }
  };

  const toggleSuspend = async (userId: string, suspend: boolean) => {
    if (!confirm(suspend ? 'Suspend this user?' : 'Unsuspend this user?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'suspend-user', target_user_id: userId, suspend },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg(suspend ? 'User suspended' : 'User unsuspended', 'success');
      loadUsers();
    } catch (err: any) { showMsg(err.message || 'Failed', 'error'); }
  };

  const resetPassword = async (userId: string) => {
    if (!confirm('Send a password reset email to this user?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'reset-user-password', target_user_id: userId },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg(`Password reset sent to ${data.email}`, 'success');
    } catch (err: any) { showMsg(err.message || 'Failed', 'error'); }
  };

  const sendEmail = async () => {
    if (!actionUserId || !emailSubject || !emailMessage) { showMsg('Fill in all fields', 'error'); return; }
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'send-email', target_user_id: actionUserId, subject: emailSubject, message: emailMessage },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg('Email sent!', 'success');
      setShowEmailModal(false);
      setEmailSubject(''); setEmailMessage('');
    } catch (err: any) { showMsg(err.message || 'Failed', 'error'); }
    setActionLoading(false);
  };

  const applyDiscount = async () => {
    if (!actionUserId || !discountCode) { showMsg('Enter a discount code', 'error'); return; }
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'apply-discount', target_user_id: actionUserId, code: discountCode },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      showMsg(`Code ${data.code} applied!`, 'success');
      setShowDiscountModal(false);
      setDiscountCode('');
    } catch (err: any) { showMsg(err.message || 'Failed', 'error'); }
    setActionLoading(false);
  };

  const exportCSV = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'export-csv', role_filter: roleFilter },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freelearner-users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg(`Exported ${data.count} users`, 'success');
    } catch (err: any) { showMsg(err.message || 'Export failed', 'error'); }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={sortBy === field ? '#0D7377' : '#D1D5DB'} strokeWidth="2" strokeLinecap="round">
      {sortOrder === 'asc' && sortBy === field ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );

  return (
    <div>
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-body font-semibold text-sm ${
          messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>{message}</div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEmailModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Send Email</h3>
            <div className="space-y-4">
              <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm" />
              <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={6} placeholder="Message (HTML supported)" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm" />
              <div className="flex gap-3">
                <button onClick={sendEmail} disabled={actionLoading} className="flex-1 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-xl disabled:opacity-50">
                  {actionLoading ? 'Sending...' : 'Send Email'}
                </button>
                <button onClick={() => setShowEmailModal(false)} className="px-6 py-3 bg-gray-100 text-charcoal/60 font-body font-semibold rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDiscountModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Apply Discount Code</h3>
            <div className="space-y-4">
              <input type="text" value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())} placeholder="Enter code (e.g., FREELEARNER50)" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-heading font-bold text-lg tracking-wider uppercase" />
              <div className="flex gap-3">
                <button onClick={applyDiscount} disabled={actionLoading} className="flex-1 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-xl disabled:opacity-50">
                  {actionLoading ? 'Applying...' : 'Apply Code'}
                </button>
                <button onClick={() => setShowDiscountModal(false)} className="px-6 py-3 bg-gray-100 text-charcoal/60 font-body font-semibold rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Panel */}
      {showDetail && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-heading font-bold text-lg text-charcoal">User Details</h3>
              <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
              </div>
            ) : selectedUser ? (
              <div className="p-6 space-y-6">
                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center">
                    <span className="font-heading font-bold text-xl text-teal">
                      {(selectedUser.profile.full_name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg text-charcoal">{selectedUser.profile.full_name || 'Unknown'}</h4>
                    <p className="font-body text-sm text-charcoal/50">{selectedUser.profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                        selectedUser.profile.role === 'parent' ? 'bg-blue-50 text-blue-600' :
                        selectedUser.profile.role === 'educator' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>{selectedUser.profile.role}</span>
                      {selectedUser.profile.is_suspended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-red-50 text-red-600">SUSPENDED</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Joined', value: selectedUser.profile.created_at ? new Date(selectedUser.profile.created_at).toLocaleDateString() : '-' },
                    { label: 'Last Active', value: selectedUser.auth?.last_sign_in_at ? new Date(selectedUser.auth.last_sign_in_at).toLocaleDateString() : 'Never' },
                    { label: 'Email Confirmed', value: selectedUser.auth?.email_confirmed_at ? 'Yes' : 'No' },
                    { label: 'Children', value: selectedUser.children.length.toString() },
                    { label: 'School', value: selectedUser.profile.school_name || '-' },
                    { label: 'Phone', value: selectedUser.profile.phone || '-' },
                  ].map(item => (
                    <div key={item.label} className="bg-cream rounded-lg p-3">
                      <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-wider">{item.label}</p>
                      <p className="font-body text-sm font-semibold text-charcoal mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <h5 className="font-body text-xs font-bold text-charcoal/40 uppercase tracking-wider">Actions</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedUser.profile.role}
                      onChange={e => changeRole(selectedUser.profile.id, e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 font-body text-sm"
                    >
                      <option value="parent">Parent</option>
                      <option value="educator">Educator</option>
                      <option value="student">Student</option>
                    </select>
                    <button onClick={() => resetPassword(selectedUser.profile.id)} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-body text-sm font-semibold rounded-lg transition-all">
                      Reset Password
                    </button>
                    <button onClick={() => { setActionUserId(selectedUser.profile.id); setShowEmailModal(true); }} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-body text-sm font-semibold rounded-lg transition-all">
                      Send Email
                    </button>
                    <button onClick={() => { setActionUserId(selectedUser.profile.id); setShowDiscountModal(true); }} className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-body text-sm font-semibold rounded-lg transition-all">
                      Apply Discount
                    </button>
                    <button
                      onClick={() => toggleSuspend(selectedUser.profile.id, !selectedUser.profile.is_suspended)}
                      className={`px-3 py-2 font-body text-sm font-semibold rounded-lg transition-all col-span-2 ${
                        selectedUser.profile.is_suspended
                          ? 'bg-green-50 hover:bg-green-100 text-green-700'
                          : 'bg-red-50 hover:bg-red-100 text-red-700'
                      }`}
                    >
                      {selectedUser.profile.is_suspended ? 'Unsuspend Account' : 'Suspend Account'}
                    </button>
                  </div>
                </div>

                {/* Children */}
                {selectedUser.children.length > 0 && (
                  <div>
                    <h5 className="font-body text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-2">Children ({selectedUser.children.length})</h5>
                    <div className="space-y-2">
                      {selectedUser.children.map((c: any) => (
                        <div key={c.id} className="bg-cream rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-body text-sm font-semibold text-charcoal">{c.child_name}</p>
                            <p className="font-body text-xs text-charcoal/40">Age {c.age || '?'} · Grade {c.grade_level || '?'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referrals */}
                {selectedUser.referrals.length > 0 && (
                  <div>
                    <h5 className="font-body text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-2">Referrals ({selectedUser.referrals.length})</h5>
                    <div className="space-y-2">
                      {selectedUser.referrals.map((r: any) => (
                        <div key={r.id} className="bg-cream rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="font-body text-sm text-charcoal">{r.referred_email}</p>
                            <p className="font-body text-xs text-charcoal/40">{new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                            r.status === 'active' ? 'bg-green-50 text-green-700' :
                            r.status === 'signed_up' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Redemptions */}
                {selectedUser.redemptions.length > 0 && (
                  <div>
                    <h5 className="font-body text-xs font-bold text-charcoal/40 uppercase tracking-wider mb-2">Discount Redemptions ({selectedUser.redemptions.length})</h5>
                    <div className="space-y-2">
                      {selectedUser.redemptions.map((r: any) => (
                        <div key={r.id} className="bg-cream rounded-lg p-3">
                          <p className="font-body text-sm font-semibold text-charcoal">{r.discount_codes?.code || 'Unknown'}</p>
                          <p className="font-body text-xs text-charcoal/40">{r.discount_codes?.description} · {r.plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="font-heading font-bold text-lg text-charcoal">Users ({total})</h3>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button onClick={() => loadUsers()} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          <option value="all">All Roles</option>
          <option value="parent">Parents</option>
          <option value="educator">Educators</option>
          <option value="student">Students</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
          <p className="font-body text-sm text-charcoal/40">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    { key: 'full_name', label: 'Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'role', label: 'Role' },
                    { key: 'created_at', label: 'Joined' },
                    { key: 'last_sign_in', label: 'Last Active' },
                    { key: 'children', label: 'Children' },
                    { key: 'actions', label: 'Actions' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => col.key !== 'actions' && col.key !== 'children' && col.key !== 'last_sign_in' ? handleSort(col.key) : undefined}
                      className={`text-left px-4 py-3 font-body text-xs font-semibold text-charcoal/40 uppercase tracking-wider ${
                        col.key !== 'actions' && col.key !== 'children' && col.key !== 'last_sign_in' ? 'cursor-pointer hover:text-charcoal/60' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.key !== 'actions' && col.key !== 'children' && col.key !== 'last_sign_in' && <SortIcon field={col.key} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => viewUserDetail(user.id)} className="flex items-center gap-2 text-left hover:text-teal transition-colors">
                        <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-heading font-bold text-xs text-teal">
                            {(user.full_name || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-body text-sm font-semibold text-charcoal">{user.full_name || 'Unknown'}</p>
                          {user.is_suspended && (
                            <span className="text-[9px] font-body font-bold text-red-500 uppercase">Suspended</span>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal/60">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                        user.role === 'parent' ? 'bg-blue-50 text-blue-600' :
                        user.role === 'educator' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal/50">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal/50">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal/50 text-center">
                      {user.children_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewUserDetail(user.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-charcoal/30 hover:text-teal transition-all" title="View Details">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button onClick={() => { setActionUserId(user.id); setShowEmailModal(true); }} className="p-1.5 hover:bg-blue-50 rounded-lg text-charcoal/30 hover:text-blue-600 transition-all" title="Send Email">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </button>
                        <button
                          onClick={() => toggleSuspend(user.id, !user.is_suspended)}
                          className={`p-1.5 rounded-lg transition-all ${
                            user.is_suspended ? 'hover:bg-green-50 text-red-400 hover:text-green-600' : 'hover:bg-red-50 text-charcoal/30 hover:text-red-500'
                          }`}
                          title={user.is_suspended ? 'Unsuspend' : 'Suspend'}
                        >
                          {user.is_suspended ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="font-body text-xs text-charcoal/40">
                Page {page} of {totalPages} ({total} users)
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg font-body text-xs font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
