import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ReferralDetail {
  id: string;
  referred_email: string;
  referred_name: string;
  status: string;
  referral_code: string;
  created_at: string;
  link_clicked_at: string | null;
  visited_at: string | null;
  signed_up_at: string | null;
  activated_at: string | null;
}

interface LeaderboardEntry {
  referrer_id: string;
  email: string;
  full_name: string;
  role: string;
  joined_at: string;
  total_referrals: number;
  signed_up: number;
  active: number;
  visited: number;
  pending: number;
  never_clicked: number;
  discount_percent: number;
  is_free: boolean;
  referrals: ReferralDetail[];
}

interface Summary {
  total_referrers: number;
  total_referrals: number;
  total_signed_up: number;
  total_active: number;
  total_visited: number;
  total_pending: number;
  conversion_rate: number;
}

const AdminReferralLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [sortBy, setSortBy] = useState<'total' | 'active' | 'signed_up' | 'pending'>('total');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'referral-leaderboard' },
      });
      if (error) throw error;
      if (data?.leaderboard) setLeaderboard(data.leaderboard);
      if (data?.summary) setSummary(data.summary);
    } catch (err: any) {
      showMessage(err.message || 'Failed to load referral data', 'error');
    }
    setLoading(false);
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    setUpdatingStatus(referralId);
    try {
      const { error } = await supabase.functions.invoke('manage-discount-codes', {
        body: { action: 'update-referral-status', referral_id: referralId, new_status: newStatus },
      });
      if (error) throw error;
      showMessage(`Status updated to "${newStatus}"`, 'success');
      await loadLeaderboard();
    } catch (err: any) {
      showMessage(err.message || 'Failed to update status', 'error');
    }
    setUpdatingStatus(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200';
      case 'signed_up': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'visited': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'link_clicked': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'pending': return 'bg-gray-50 text-gray-500 border-gray-200';
      case 'churned': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
      case 'signed_up':
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
      case 'visited':
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
      case 'link_clicked':
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
      case 'pending':
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
      case 'churned':
        return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
      default:
        return null;
    }
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    switch (sortBy) {
      case 'active': return b.active - a.active;
      case 'signed_up': return b.signed_up - a.signed_up;
      case 'pending': return b.pending - a.pending;
      default: return b.total_referrals - a.total_referrals;
    }
  });

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-teal/20 border-t-teal rounded-full animate-spin" />
        <p className="font-body text-sm text-charcoal/40">Loading referral data...</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg font-body font-semibold text-sm flex items-center gap-2 ${
          messageType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {message}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { label: 'Total Referrers', value: summary.total_referrers, color: 'text-charcoal', bg: 'bg-white' },
            { label: 'Total Referrals', value: summary.total_referrals, color: 'text-teal', bg: 'bg-teal-50' },
            { label: 'Signed Up', value: summary.total_signed_up, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active', value: summary.total_active, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Visited', value: summary.total_visited, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Pending', value: summary.total_pending, color: 'text-gray-500', bg: 'bg-gray-50' },
            { label: 'Conversion', value: `${summary.conversion_rate}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
              <p className={`font-heading font-bold text-2xl ${stat.color}`}>{stat.value}</p>
              <p className="font-body text-xs text-charcoal/40 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-lg text-charcoal">
          Referral Leaderboard ({leaderboard.length} users)
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-charcoal/40">Sort by:</span>
          {[
            { id: 'total' as const, label: 'Total' },
            { id: 'active' as const, label: 'Active' },
            { id: 'signed_up' as const, label: 'Signed Up' },
            { id: 'pending' as const, label: 'Pending' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
                sortBy === s.id ? 'bg-teal text-white' : 'bg-gray-100 text-charcoal/60 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={loadLeaderboard}
            className="ml-2 p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors"
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      {sortedLeaderboard.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          <p className="font-heading font-bold text-charcoal mb-2">No referrals yet</p>
          <p className="font-body text-sm text-charcoal/40">When users share referral links, their activity will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLeaderboard.map((entry, idx) => (
            <div key={entry.referrer_id} className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              {/* Main row */}
              <button
                onClick={() => setExpandedUser(expandedUser === entry.referrer_id ? null : entry.referrer_id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left"
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm ${
                  idx === 0 ? 'bg-amber-400 text-amber-900' :
                  idx === 1 ? 'bg-gray-300 text-gray-700' :
                  idx === 2 ? 'bg-amber-600 text-amber-100' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {idx + 1}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-bold text-charcoal truncate">{entry.full_name || 'Unknown'}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-bold ${
                      entry.role === 'parent' ? 'bg-blue-50 text-blue-600' :
                      entry.role === 'educator' ? 'bg-orange-50 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>{entry.role}</span>
                    {entry.is_free && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-body font-bold bg-green-50 text-green-700">FREE ACCOUNT</span>
                    )}
                  </div>
                  <p className="font-body text-xs text-charcoal/40 truncate">{entry.email}</p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="font-heading font-bold text-lg text-charcoal">{entry.total_referrals}</p>
                    <p className="font-body text-[10px] text-charcoal/40">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading font-bold text-lg text-green-600">{entry.active}</p>
                    <p className="font-body text-[10px] text-charcoal/40">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading font-bold text-lg text-blue-600">{entry.signed_up}</p>
                    <p className="font-body text-[10px] text-charcoal/40">Signed Up</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading font-bold text-lg text-amber-600">{entry.visited}</p>
                    <p className="font-body text-[10px] text-charcoal/40">Visited</p>
                  </div>
                  <div className="text-center">
                    <p className="font-heading font-bold text-lg text-gray-400">{entry.pending}</p>
                    <p className="font-body text-[10px] text-charcoal/40">Never Clicked</p>
                  </div>
                </div>

                {/* Discount badge */}
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg font-body text-xs font-bold ${
                    entry.discount_percent >= 100 ? 'bg-green-100 text-green-700' :
                    entry.discount_percent > 0 ? 'bg-teal-50 text-teal' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {entry.discount_percent >= 100 ? 'FREE' : `${entry.discount_percent}% off`}
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
                    className={`transition-transform ${expandedUser === entry.referrer_id ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {/* Mobile stats row */}
              <div className="md:hidden px-5 pb-3 flex items-center gap-4">
                <span className="font-body text-xs"><span className="font-bold text-charcoal">{entry.total_referrals}</span> total</span>
                <span className="font-body text-xs"><span className="font-bold text-green-600">{entry.active}</span> active</span>
                <span className="font-body text-xs"><span className="font-bold text-blue-600">{entry.signed_up}</span> signed up</span>
                <span className="font-body text-xs"><span className="font-bold text-amber-600">{entry.visited}</span> visited</span>
                <span className="font-body text-xs"><span className="font-bold text-gray-400">{entry.pending}</span> pending</span>
              </div>

              {/* Expanded details */}
              {expandedUser === entry.referrer_id && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-body text-xs font-bold text-charcoal/60 uppercase tracking-wider">Individual Referrals</h4>
                    <span className="font-body text-xs text-charcoal/40">
                      Joined {entry.joined_at ? new Date(entry.joined_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  {entry.referrals.length === 0 ? (
                    <p className="font-body text-sm text-charcoal/40 py-4 text-center">No referral details available</p>
                  ) : (
                    <div className="space-y-2">
                      {entry.referrals.map(ref => (
                        <div key={ref.id} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm font-semibold text-charcoal truncate">
                              {ref.referred_name || ref.referred_email}
                            </p>
                            <p className="font-body text-xs text-charcoal/40">{ref.referred_email}</p>
                            <p className="font-body text-[10px] text-charcoal/30 mt-1">
                              Invited {new Date(ref.created_at).toLocaleDateString()} 
                              {ref.link_clicked_at && ` · Clicked ${new Date(ref.link_clicked_at).toLocaleDateString()}`}
                              {ref.visited_at && ` · Visited ${new Date(ref.visited_at).toLocaleDateString()}`}
                              {ref.signed_up_at && ` · Signed up ${new Date(ref.signed_up_at).toLocaleDateString()}`}
                              {ref.activated_at && ` · Active since ${new Date(ref.activated_at).toLocaleDateString()}`}
                            </p>
                          </div>

                          {/* Current status badge */}
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-body font-bold ${getStatusColor(ref.status)}`}>
                            {getStatusIcon(ref.status)}
                            <span className="capitalize">{ref.status.replace('_', ' ')}</span>
                          </div>

                          {/* Status change dropdown */}
                          <select
                            value={ref.status}
                            onChange={(e) => updateReferralStatus(ref.id, e.target.value)}
                            disabled={updatingStatus === ref.id}
                            className="px-2 py-1 rounded-lg border border-gray-200 font-body text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="link_clicked">Link Clicked</option>
                            <option value="visited">Visited</option>
                            <option value="signed_up">Signed Up</option>
                            <option value="active">Active</option>
                            <option value="churned">Churned</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Funnel visualization */}
      {summary && summary.total_referrals > 0 && (
        <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100">
          <h4 className="font-heading font-bold text-sm text-charcoal mb-4">Referral Funnel</h4>
          <div className="space-y-3">
            {[
              { label: 'Invitations Sent', value: summary.total_referrals, color: 'bg-charcoal', pct: 100 },
              { label: 'Visited Site', value: summary.total_visited + summary.total_signed_up + summary.total_active, color: 'bg-amber-500', pct: Math.round(((summary.total_visited + summary.total_signed_up + summary.total_active) / summary.total_referrals) * 100) },
              { label: 'Signed Up', value: summary.total_signed_up + summary.total_active, color: 'bg-blue-500', pct: Math.round(((summary.total_signed_up + summary.total_active) / summary.total_referrals) * 100) },
              { label: 'Active Users', value: summary.total_active, color: 'bg-green-500', pct: Math.round((summary.total_active / summary.total_referrals) * 100) },
            ].map(step => (
              <div key={step.label} className="flex items-center gap-4">
                <span className="font-body text-xs text-charcoal/60 w-32 text-right">{step.label}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${step.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-3`}
                    style={{ width: `${Math.max(step.pct, 2)}%` }}
                  >
                    {step.pct > 15 && (
                      <span className="font-body text-xs font-bold text-white">{step.value}</span>
                    )}
                  </div>
                  {step.pct <= 15 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-body text-xs font-bold text-charcoal/60">{step.value}</span>
                  )}
                </div>
                <span className="font-body text-xs font-bold text-charcoal/40 w-12">{step.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferralLeaderboard;
