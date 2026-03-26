import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminReferralLeaderboard from '@/components/AdminReferralLeaderboard';
import AdminCampaigns from '@/components/AdminCampaigns';
import AdminUsers from '@/components/AdminUsers';
import AdminAnalytics from '@/components/AdminAnalytics';
import AcademyManager from '@/components/AcademyManager';
import AdminPayments from '@/components/AdminPayments';

interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  applicable_plans: string[];
  free_months: number;
  is_active: boolean;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  role_counts: Record<string, number>;
  total_codes: number;
  active_codes: number;
  total_redemptions: number;
  total_referrals: number;
}

const AdminPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { user, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'create' | 'referrals' | 'campaigns' | 'users' | 'analytics' | 'content' | 'payments'>('overview');



  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Create form
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    max_uses: '',
    valid_until: '',
    applicable_plans: ['family', 'academy'],
    free_months: 0,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, [user?.id]);

  const checkAdmin = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'check-admin' },
      });
      setIsAdmin(data?.isAdmin || false);
      setAdminRole(data?.role || null);
      setAdminEmail(data?.email || null);
      if (data?.isAdmin) {
        loadCodes();
        loadStats();
      }
    } catch (err) {
      console.warn('Admin check error:', err);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'admin-stats' },
      });
      if (data) setStats(data);
    } catch (err) {
      console.warn('Stats load error:', err);
    }
  };

  const loadCodes = async () => {
    try {
      const { data } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'list' },
      });
      if (data?.codes) setCodes(data.codes);
    } catch (err) {
      console.warn('Load codes error:', err);
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const createCode = async () => {
    if (!newCode.code.trim()) { showMessage('Code is required', 'error'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-discount-codes', {
        body: {
          action: 'create',
          code: newCode.code.toUpperCase().trim(),
          description: newCode.description,
          discount_type: newCode.discount_type,
          discount_value: newCode.discount_value,
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          valid_until: newCode.valid_until || null,
          applicable_plans: newCode.applicable_plans,
          free_months: newCode.free_months,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showMessage(`Code "${newCode.code.toUpperCase()}" created!`, 'success');
      setNewCode({ code: '', description: '', discount_type: 'percentage', discount_value: 0, max_uses: '', valid_until: '', applicable_plans: ['family', 'academy'], free_months: 0 });
      loadCodes();
      setActiveTab('codes');
    } catch (err: any) {
      showMessage(err.message || 'Failed to create code', 'error');
    }
    setCreating(false);
  };

  const toggleCode = async (id: string, active: boolean) => {
    try {
      await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'toggle', code_id: id, is_active: active },
      });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: active } : c));
      showMessage(active ? 'Code activated' : 'Code deactivated', 'success');
    } catch (err) {
      showMessage('Failed to update code', 'error');
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Delete this discount code?')) return;
    try {
      await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'delete', code_id: id },
      });
      setCodes(prev => prev.filter(c => c.id !== id));
      showMessage('Code deleted', 'success');
    } catch (err) {
      showMessage('Failed to delete code', 'error');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'FL-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setNewCode(prev => ({ ...prev, code }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="font-body text-sm text-charcoal/40 mt-3">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 className="font-heading font-bold text-xl text-charcoal mb-2">Access Denied</h2>
          <p className="font-body text-sm text-charcoal/50 mb-2">
            This admin panel is restricted to authorized administrators only.
          </p>
          <p className="font-body text-xs text-charcoal/30 mb-6">
            If you believe you should have access, contact the master admin at jfrye@zen-fish.com.
          </p>
          <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="px-6 py-3 bg-charcoal hover:bg-charcoal/80 text-white font-body font-bold rounded-xl transition-all w-full">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Message */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-body font-semibold text-sm flex items-center gap-2 ${
          messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {messageType === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading font-bold text-xl text-charcoal">Admin Panel</h1>
                {adminRole === 'master_admin' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-body text-[10px] font-bold uppercase tracking-wider">
                    Master Admin
                  </span>
                )}
              </div>
              <p className="font-body text-xs text-charcoal/40 mt-0.5">
                Logged in as {adminEmail || profile?.email} · Manage coupons, discounts & referrals
              </p>
            </div>
            <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </button>
          </div>
          <div className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {[
              { id: 'overview' as const, label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'analytics' as const, label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'users' as const, label: 'Users', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
              { id: 'content' as const, label: 'Content CMS', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
              { id: 'codes' as const, label: 'Discount Codes', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
              { id: 'create' as const, label: 'Create Code', icon: 'M12 4v16m8-8H4' },
              { id: 'campaigns' as const, label: 'Campaigns', icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
              { id: 'referrals' as const, label: 'Referrals', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 font-body text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
              }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={tab.icon}/></svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'overview' && (
          <div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats?.total_users || 0, icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', color: 'text-teal', bg: 'bg-teal-50' },
                { label: 'Parents', value: stats?.role_counts?.parent || 0, icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Educators', value: stats?.role_counts?.educator || 0, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Active Codes', value: stats?.active_codes || 0, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Redemptions', value: stats?.total_redemptions || 0, icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Referrals', value: stats?.total_referrals || 0, icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-gray-100`}>
                  <svg className="mb-3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={stat.icon} className={stat.color} />
                  </svg>
                  <p className={`font-heading font-bold text-3xl ${stat.color}`}>{stat.value}</p>
                  <p className="font-body text-xs text-charcoal/40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Quick Actions</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button onClick={() => setActiveTab('create')} className="p-4 bg-teal-50 hover:bg-teal-100 rounded-xl text-left transition-all border border-teal/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <p className="font-body text-sm font-bold text-teal mt-2">Create Discount Code</p>
                  <p className="font-body text-xs text-charcoal/40 mt-1">New promo or influencer code</p>
                </button>
                <button onClick={() => setActiveTab('codes')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-left transition-all border border-purple-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                  <p className="font-body text-sm font-bold text-purple-700 mt-2">Manage Codes</p>
                  <p className="font-body text-xs text-charcoal/40 mt-1">{codes.length} codes total</p>
                </button>
                <button onClick={() => setActiveTab('referrals')} className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-left transition-all border border-amber-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                  <p className="font-body text-sm font-bold text-amber-700 mt-2">Referral Leaderboard</p>
                  <p className="font-body text-xs text-charcoal/40 mt-1">Track referral performance</p>
                </button>
                <button onClick={() => { loadStats(); loadCodes(); showMessage('Data refreshed!', 'success'); }} className="p-4 bg-green-50 hover:bg-green-100 rounded-xl text-left transition-all border border-green-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                  <p className="font-body text-sm font-bold text-green-700 mt-2">Refresh Data</p>
                  <p className="font-body text-xs text-charcoal/40 mt-1">Reload all admin data</p>
                </button>
              </div>
            </div>

            {/* Admin Info */}
            <div className="bg-gradient-to-r from-charcoal to-charcoal/90 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="font-heading font-bold text-sm">Master Admin Account</p>
                  <p className="font-body text-xs text-white/50">{adminEmail}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-body text-white/40 text-xs">Role</p>
                  <p className="font-body font-bold">{adminRole === 'master_admin' ? 'Master Admin' : 'Admin'}</p>
                </div>
                <div>
                  <p className="font-body text-white/40 text-xs">Permissions</p>
                  <p className="font-body font-bold">Full Access</p>
                </div>
                <div>
                  <p className="font-body text-white/40 text-xs">Security</p>
                  <p className="font-body font-bold">Email-locked to jfrye@zen-fish.com</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CODES LIST */}
        {activeTab === 'codes' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading font-bold text-lg text-charcoal">All Discount Codes ({codes.length})</h3>
              <button onClick={() => setActiveTab('create')} className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Code
              </button>
            </div>

            {codes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <p className="font-heading font-bold text-charcoal mb-2">No discount codes yet</p>
                <p className="font-body text-sm text-charcoal/40">Create your first discount code to offer promotions or free access.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map(code => (
                  <div key={code.id} className={`bg-white rounded-xl p-5 border transition-all ${code.is_active ? 'border-gray-100 hover:shadow-md' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-charcoal rounded-lg">
                          <span className="font-heading font-bold text-white text-lg tracking-wider">{code.code}</span>
                        </div>
                        <div>
                          <p className="font-body text-sm font-semibold text-charcoal">{code.description || 'No description'}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full font-body text-xs font-semibold ${
                              code.discount_type === 'free_access' ? 'bg-green-50 text-green-700' :
                              code.discount_type === 'percentage' ? 'bg-blue-50 text-blue-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {code.discount_type === 'free_access' ? 'Free Access' :
                               code.discount_type === 'percentage' ? `${code.discount_value}% off` :
                               `$${code.discount_value} off`}
                              {code.free_months > 0 ? ` · ${code.free_months} months` : ''}
                            </span>
                            <span className="font-body text-xs text-charcoal/40">
                              {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''} uses
                            </span>
                            <span className="font-body text-xs text-charcoal/40">
                              Plans: {code.applicable_plans?.join(', ')}
                            </span>
                            {code.valid_until && (
                              <span className="font-body text-xs text-charcoal/40">
                                Expires: {new Date(code.valid_until).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleCode(code.id, !code.is_active)} className={`w-10 h-5 rounded-full transition-all relative ${code.is_active ? 'bg-teal' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${code.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(code.code); showMessage('Code copied!', 'success'); }} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/40 transition-all" title="Copy code">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                        <button onClick={() => deleteCode(code.id)} className="p-2 hover:bg-red-50 rounded-lg text-charcoal/30 hover:text-red-500 transition-all" title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE CODE */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-xl text-charcoal mb-1">Create Discount Code</h3>
              <p className="font-body text-sm text-charcoal/40 mb-6">Create codes for influencers, early adopters, or promotional campaigns.</p>

              <div className="space-y-5">
                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={newCode.code} onChange={e => setNewCode(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="FREELEARNER50" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 font-heading font-bold text-lg tracking-wider bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30 uppercase" />
                    <button onClick={generateRandomCode} className="px-4 py-3 bg-charcoal/5 hover:bg-charcoal/10 rounded-xl font-body text-sm font-semibold text-charcoal transition-all">Generate</button>
                  </div>
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Description</label>
                  <input type="text" value={newCode.description} onChange={e => setNewCode(p => ({ ...p, description: e.target.value }))} placeholder="e.g., Early influencer access, Launch promo..." className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Discount Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'free_access', label: 'Free Access', desc: 'Full free access' },
                      { id: 'percentage', label: 'Percentage Off', desc: '% discount' },
                      { id: 'fixed', label: 'Fixed Amount', desc: '$ off' },
                    ].map(type => (
                      <button key={type.id} onClick={() => setNewCode(p => ({ ...p, discount_type: type.id }))} className={`p-4 rounded-xl border-2 text-center transition-all ${
                        newCode.discount_type === type.id ? 'border-teal bg-teal-50' : 'border-gray-200 hover:border-teal/30'
                      }`}>
                        <p className="font-body text-xs font-semibold text-charcoal">{type.label}</p>
                        <p className="font-body text-[10px] text-charcoal/40 mt-1">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {newCode.discount_type !== 'free_access' && (
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">
                      {newCode.discount_type === 'percentage' ? 'Discount Percentage' : 'Discount Amount ($)'}
                    </label>
                    <input type="number" value={newCode.discount_value} onChange={e => setNewCode(p => ({ ...p, discount_value: Number(e.target.value) }))} min={0} max={newCode.discount_type === 'percentage' ? 100 : 9999} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                )}

                {newCode.discount_type === 'free_access' && (
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Free Months</label>
                    <select value={newCode.free_months} onChange={e => setNewCode(p => ({ ...p, free_months: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30">
                      <option value={0}>Unlimited (lifetime)</option>
                      <option value={1}>1 month</option>
                      <option value={3}>3 months</option>
                      <option value={6}>6 months</option>
                      <option value={12}>12 months</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Max Uses (optional)</label>
                    <input type="number" value={newCode.max_uses} onChange={e => setNewCode(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" min={1} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-semibold text-charcoal/70 mb-1.5 block">Expires (optional)</label>
                    <input type="date" value={newCode.valid_until} onChange={e => setNewCode(p => ({ ...p, valid_until: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30" />
                  </div>
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-charcoal/70 mb-2 block">Applicable Plans</label>
                  <div className="flex gap-3">
                    {['family', 'academy'].map(plan => (
                      <label key={plan} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newCode.applicable_plans.includes(plan)} onChange={e => {
                          setNewCode(p => ({
                            ...p,
                            applicable_plans: e.target.checked ? [...p.applicable_plans, plan] : p.applicable_plans.filter(pp => pp !== plan),
                          }));
                        }} className="w-4 h-4 text-teal rounded border-gray-300 focus:ring-teal" />
                        <span className="font-body text-sm text-charcoal capitalize">{plan}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gradient-to-r from-teal-50 to-cream rounded-xl p-5 border border-teal/10">
                  <p className="font-body text-xs font-semibold text-teal mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 bg-charcoal rounded-lg">
                      <span className="font-heading font-bold text-white tracking-wider">{newCode.code || 'CODE'}</span>
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-charcoal">
                        {newCode.discount_type === 'free_access' ? `Free access${newCode.free_months > 0 ? ` for ${newCode.free_months} months` : ' (lifetime)'}` :
                         newCode.discount_type === 'percentage' ? `${newCode.discount_value}% off` :
                         `$${newCode.discount_value} off`}
                      </p>
                      <p className="font-body text-xs text-charcoal/40">
                        {newCode.applicable_plans.join(', ')} plans
                        {newCode.max_uses ? ` · ${newCode.max_uses} max uses` : ' · Unlimited uses'}
                      </p>
                    </div>
                  </div>
                </div>

                <button onClick={createCode} disabled={creating || !newCode.code.trim()} className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Discount Code'}
                </button>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-heading font-bold text-sm text-charcoal mb-4">Quick Templates</h4>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Influencer Free Access', code: 'INFLUENCER', type: 'free_access', value: 0, months: 6, uses: '50', desc: 'Free 6-month access for influencers' },
                  { label: 'Early Adopter 50% Off', code: 'EARLYBIRD50', type: 'percentage', value: 50, months: 0, uses: '100', desc: '50% off for early adopters' },
                  { label: 'Friend Referral', code: 'FRIEND25', type: 'percentage', value: 25, months: 0, uses: '', desc: '25% off referral code' },
                  { label: 'Lifetime Free Access', code: 'VIP-FREE', type: 'free_access', value: 0, months: 0, uses: '10', desc: 'Lifetime free access for VIPs' },
                ].map(t => (
                  <button key={t.label} onClick={() => setNewCode({ code: t.code, description: t.desc, discount_type: t.type, discount_value: t.value, max_uses: t.uses, valid_until: '', applicable_plans: ['family', 'academy'], free_months: t.months })} className="p-4 bg-cream rounded-xl text-left hover:bg-teal-50 transition-all border border-gray-100">
                    <p className="font-body text-sm font-semibold text-charcoal">{t.label}</p>
                    <p className="font-body text-xs text-charcoal/40 mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REFERRAL LEADERBOARD */}
        {activeTab === 'referrals' && (
          <AdminReferralLeaderboard />
        )}

        {/* CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <AdminCampaigns />
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <AdminUsers />
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <AdminAnalytics />
        )}

        {/* CONTENT CMS */}
        {activeTab === 'content' && (
          <AcademyManager />
        )}

      </div>
    </div>
  );
};

export default AdminPage;
