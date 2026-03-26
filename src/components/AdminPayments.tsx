
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PaymentMetrics {
  mrr: number; arr: number; churnRate: string; arpu: number;
  activePaid: number; totalActive: number; totalSubscriptions: number;
  rev30: number; rev60: number; revGrowth: string;
}

interface PaymentData {
  config: { test_mode: boolean; max_retry_attempts: number; retry_interval_hours: number };
  metrics: PaymentMetrics;
  planDistribution: Record<string, number>;
  cycleDistribution: Record<string, number>;
  revenueTrend: { month: string; revenue: number }[];
  recentTransactions: any[];
  failedPayments: any[];
  subscriptions: any[];
}

const COLORS = ['#0D7377', '#F97316', '#8B5CF6', '#EC4899', '#10B981'];
const PLAN_COLORS: Record<string, string> = { explorer: '#94A3B8', family: '#0D7377', academy: '#8B5CF6' };

const AdminPayments: React.FC = () => {
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [activeView, setActiveView] = useState<'overview' | 'transactions' | 'subscriptions' | 'failed' | 'settings'>('overview');

  // Mode toggle state
  const [showModeToggle, setShowModeToggle] = useState(false);
  const [modeConfirmText, setModeConfirmText] = useState('');
  const [togglingMode, setTogglingMode] = useState(false);

  // Refund state
  const [refundModal, setRefundModal] = useState<{ userId: string; txnId: string; amount: number; email: string } | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refunding, setRefunding] = useState(false);

  // Adjust state
  const [adjustModal, setAdjustModal] = useState<{ userId: string; email: string; currentPlan: string } | null>(null);
  const [adjustPlan, setAdjustPlan] = useState('');
  const [adjustStatus, setAdjustStatus] = useState('');
  const [adjustDays, setAdjustDays] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Retry state
  const [retrying, setRetrying] = useState(false);

  useEffect(() => { loadPaymentData(); }, []);

  const showMsg = (msg: string, type: 'success' | 'error') => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('checkout', {
        body: { action: 'admin-payment-analytics' },
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load payment data');
    }
    setLoading(false);
  };

  const toggleMode = async (newTestMode: boolean) => {
    if (!newTestMode && modeConfirmText !== 'ENABLE LIVE PAYMENTS') {
      showMsg('Type "ENABLE LIVE PAYMENTS" to confirm', 'error');
      return;
    }
    setTogglingMode(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('checkout', {
        body: { action: 'admin-toggle-mode', test_mode: newTestMode, confirm_text: modeConfirmText },
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      showMsg(result.message || 'Mode updated', 'success');
      setShowModeToggle(false);
      setModeConfirmText('');
      loadPaymentData();
    } catch (e: any) {
      showMsg(e.message || 'Failed to toggle mode', 'error');
    }
    setTogglingMode(false);
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setRefunding(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('checkout', {
        body: {
          action: 'admin-refund',
          transaction_id: refundModal.txnId,
          target_user_id: refundModal.userId,
          amount_cents: refundModal.amount,
          reason: refundReason,
        },
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      showMsg(`Refund of $${(refundModal.amount / 100).toFixed(2)} processed${result.test_mode ? ' (test)' : ''}`, 'success');
      setRefundModal(null);
      setRefundReason('');
      loadPaymentData();
    } catch (e: any) {
      showMsg(e.message || 'Refund failed', 'error');
    }
    setRefunding(false);
  };

  const handleAdjust = async () => {
    if (!adjustModal) return;
    setAdjusting(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('checkout', {
        body: {
          action: 'admin-adjust-subscription',
          target_user_id: adjustModal.userId,
          new_plan: adjustPlan || undefined,
          new_status: adjustStatus || undefined,
          extend_days: adjustDays ? parseInt(adjustDays) : undefined,
          reason: adjustReason,
        },
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      showMsg('Subscription adjusted successfully', 'success');
      setAdjustModal(null);
      setAdjustPlan(''); setAdjustStatus(''); setAdjustDays(''); setAdjustReason('');
      loadPaymentData();
    } catch (e: any) {
      showMsg(e.message || 'Adjustment failed', 'error');
    }
    setAdjusting(false);
  };

  const retryFailedPayments = async () => {
    setRetrying(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('checkout', {
        body: { action: 'retry-failed-payments' },
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      showMsg(`Retried ${result.retried} payments: ${result.succeeded} succeeded, ${result.failed} failed`, 'success');
      loadPaymentData();
    } catch (e: any) {
      showMsg(e.message || 'Retry failed', 'error');
    }
    setRetrying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="font-body text-sm text-charcoal/40 mt-3">Loading payment analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-center">
        <p className="font-body text-red-600">{error || 'No data'}</p>
        <button onClick={loadPaymentData} className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg font-body text-sm text-red-700 transition-all">Retry</button>
      </div>
    );
  }

  const m = data.metrics;
  const planData = Object.entries(data.planDistribution).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, fill: PLAN_COLORS[name] || '#94A3B8' }));
  const cycleData = Object.entries(data.cycleDistribution).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${messageType === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          {messageType === 'success' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          <span className={`font-body text-sm ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-charcoal">FamousPay Payments</h2>
          <p className="font-body text-sm text-charcoal/40">Revenue, subscriptions, and payment management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${data.config.test_mode ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
            <div className={`w-2 h-2 rounded-full ${data.config.test_mode ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
            <span className={`font-body text-xs font-bold ${data.config.test_mode ? 'text-amber-700' : 'text-green-700'}`}>
              {data.config.test_mode ? 'TEST MODE' : 'LIVE MODE'}
            </span>
          </div>
          <button onClick={loadPaymentData} className="p-2 hover:bg-gray-100 rounded-lg text-charcoal/40 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-gray-100 -mt-2">
        {[
          { id: 'overview' as const, label: 'Revenue Overview' },
          { id: 'transactions' as const, label: 'All Transactions' },
          { id: 'subscriptions' as const, label: 'Subscriptions' },
          { id: 'failed' as const, label: `Failed Payments${data.failedPayments.length > 0 ? ` (${data.failedPayments.length})` : ''}` },
          { id: 'settings' as const, label: 'Settings' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2.5 font-body text-xs font-semibold border-b-2 transition-all ${
              activeView === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeView === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'MRR', value: `$${m.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: `ARR: $${m.arr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Churn Rate', value: `${m.churnRate}%`, sub: 'Last 30 days', color: parseFloat(m.churnRate) > 5 ? 'text-red-600' : 'text-teal', bg: parseFloat(m.churnRate) > 5 ? 'bg-red-50' : 'bg-teal-50' },
              { label: 'ARPU', value: `$${m.arpu.toFixed(2)}`, sub: `${m.activePaid} paid subscribers`, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Revenue (30d)', value: `$${m.rev30.toFixed(2)}`, sub: `${m.revGrowth}% vs prev 30d`, color: parseFloat(m.revGrowth) >= 0 ? 'text-green-600' : 'text-red-600', bg: parseFloat(m.revGrowth) >= 0 ? 'bg-green-50' : 'bg-red-50' },
            ].map(kpi => (
              <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-5 border border-gray-100`}>
                <p className={`font-heading font-bold text-2xl ${kpi.color}`}>{kpi.value}</p>
                <p className="font-body text-xs text-charcoal/60 mt-1 font-semibold">{kpi.label}</p>
                <p className="font-body text-[10px] text-charcoal/30 mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Monthly Revenue Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`$${v.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Plan Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planData.length > 0 ? planData : [{ name: 'None', value: 1, fill: '#E5E7EB' }]}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {(planData.length > 0 ? planData : [{ name: 'None', value: 1, fill: '#E5E7EB' }]).map((entry, i) => (
                        <Cell key={i} fill={entry.fill || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {planData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="font-body text-xs text-charcoal/60">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
              {/* Cycle distribution */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-wider font-bold mb-2">Billing Cycle</p>
                {cycleData.map(c => (
                  <div key={c.name} className="flex justify-between items-center py-1">
                    <span className="font-body text-xs text-charcoal/60">{c.name}</span>
                    <span className="font-body text-xs font-bold text-charcoal">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TRANSACTIONS */}
      {activeView === 'transactions' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-sm text-charcoal">All Transactions ({data.recentTransactions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Date</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">User</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Type</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Status</th>
                  <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Amount</th>
                  <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentTransactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-body text-xs text-charcoal">{new Date(txn.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-charcoal/50">{txn.user_id?.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        txn.type === 'charge' ? 'bg-blue-50 text-blue-700' : txn.type === 'refund' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                      }`}>{txn.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        txn.status === 'succeeded' ? 'bg-green-50 text-green-700' : txn.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                      }`}>{txn.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-xs text-charcoal">{txn.amount_display}</td>
                    <td className="px-4 py-3 text-right">
                      {txn.type === 'charge' && txn.status === 'succeeded' && (
                        <button onClick={() => setRefundModal({ userId: txn.user_id, txnId: txn.transaction_id || txn.id, amount: txn.amount_cents, email: '' })}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-body text-[10px] font-bold rounded transition-all">
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBSCRIPTIONS */}
      {activeView === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-sm text-charcoal">All Subscriptions ({data.subscriptions.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">User</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Plan</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Status</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Cycle</th>
                  <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Renews</th>
                  <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-charcoal/50 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.subscriptions.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-body text-xs font-semibold text-charcoal">{sub.name || 'Unknown'}</p>
                      <p className="font-body text-[10px] text-charcoal/40">{sub.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        sub.plan === 'academy' ? 'bg-purple-50 text-purple-700' : sub.plan === 'family' ? 'bg-teal-50 text-teal' : 'bg-gray-50 text-gray-600'
                      }`}>{sub.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sub.status === 'active' ? 'bg-green-50 text-green-700' : sub.status === 'past_due' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
                      }`}>{sub.status}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal/60 capitalize">{sub.billing_cycle}</td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-xs text-charcoal">${((sub.amount_cents || 0) / 100).toFixed(2)}/mo</td>
                    <td className="px-4 py-3 font-body text-xs text-charcoal/50">{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setAdjustModal({ userId: sub.user_id, email: sub.email, currentPlan: sub.plan }); setAdjustPlan(sub.plan); setAdjustStatus(sub.status); }}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-body text-[10px] font-bold rounded transition-all">
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAILED PAYMENTS */}
      {activeView === 'failed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-charcoal">Failed Payments ({data.failedPayments.length})</h3>
            <button onClick={retryFailedPayments} disabled={retrying || data.failedPayments.length === 0}
              className="px-4 py-2 bg-teal hover:bg-teal-dark text-white font-body text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {retrying ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              )}
              {retrying ? 'Retrying...' : 'Retry All Failed'}
            </button>
          </div>

          {data.failedPayments.length === 0 ? (
            <div className="bg-green-50 rounded-2xl p-8 text-center border border-green-100">
              <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="font-heading font-bold text-green-700">No failed payments</p>
              <p className="font-body text-sm text-green-600/70 mt-1">All payments are processing normally.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.failedPayments.map(fp => (
                <div key={fp.id} className="bg-white rounded-xl p-5 border border-red-100 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      </div>
                      <div>
                        <p className="font-body font-bold text-sm text-charcoal">{fp.profiles?.full_name || fp.profiles?.email || 'Unknown User'}</p>
                        <p className="font-body text-xs text-charcoal/40">{fp.failure_reason || 'Payment declined'}</p>
                        <p className="font-body text-[10px] text-charcoal/30 mt-0.5">
                          {new Date(fp.created_at).toLocaleString()} · Retry #{fp.retry_count || 0} of {data.config.max_retry_attempts}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-lg text-red-600">${((fp.amount_cents || 0) / 100).toFixed(2)}</p>
                      {fp.next_retry_at && (
                        <p className="font-body text-[10px] text-charcoal/40">Next retry: {new Date(fp.next_retry_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {activeView === 'settings' && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-heading font-bold text-sm text-charcoal mb-2">Payment Processing Mode</h3>
            <p className="font-body text-xs text-charcoal/40 mb-4">Toggle between test and live payment processing.</p>

            <div className={`p-5 rounded-xl border-2 ${data.config.test_mode ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${data.config.test_mode ? 'bg-amber-100' : 'bg-green-100'}`}>
                    {data.config.test_mode ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    )}
                  </div>
                  <div>
                    <p className={`font-heading font-bold text-lg ${data.config.test_mode ? 'text-amber-800' : 'text-green-800'}`}>
                      {data.config.test_mode ? 'Test Mode Active' : 'Live Mode Active'}
                    </p>
                    <p className={`font-body text-xs ${data.config.test_mode ? 'text-amber-600' : 'text-green-600'}`}>
                      {data.config.test_mode ? 'No real charges are being made. Use test card numbers.' : 'Real payments are being processed via FamousPay.'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowModeToggle(!showModeToggle)}
                  className={`px-4 py-2 font-body text-sm font-bold rounded-lg transition-all ${
                    data.config.test_mode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}>
                  {data.config.test_mode ? 'Switch to Live' : 'Switch to Test'}
                </button>
              </div>

              {showModeToggle && (
                <div className="mt-4 pt-4 border-t border-current/10">
                  {data.config.test_mode ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-body text-xs font-bold text-red-700">Warning: Switching to live mode will process real payments.</p>
                        <p className="font-body text-[10px] text-red-600 mt-1">Ensure your GATEWAY_API_KEY is configured with a valid FamousPay API key.</p>
                      </div>
                      <div>
                        <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Type "ENABLE LIVE PAYMENTS" to confirm:</label>
                        <input type="text" value={modeConfirmText} onChange={e => setModeConfirmText(e.target.value)}
                          placeholder="ENABLE LIVE PAYMENTS"
                          className="w-full px-3 py-2.5 rounded-lg border border-red-200 font-heading font-bold text-sm tracking-wider bg-white focus:outline-none focus:ring-2 focus:ring-red-200" />
                      </div>
                      <button onClick={() => toggleMode(false)} disabled={togglingMode || modeConfirmText !== 'ENABLE LIVE PAYMENTS'}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-body font-bold text-sm rounded-lg transition-all disabled:opacity-50">
                        {togglingMode ? 'Switching...' : 'Confirm: Enable Live Payments'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="font-body text-xs text-charcoal/60">Switching to test mode will stop processing real payments. Existing subscriptions will remain active.</p>
                      <button onClick={() => toggleMode(true)} disabled={togglingMode}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-body font-bold text-sm rounded-lg transition-all disabled:opacity-50">
                        {togglingMode ? 'Switching...' : 'Switch to Test Mode'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Retry Config */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h3 className="font-heading font-bold text-sm text-charcoal mb-2">Payment Retry Configuration</h3>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-wider font-bold">Max Retry Attempts</p>
                <p className="font-heading font-bold text-2xl text-charcoal mt-1">{data.config.max_retry_attempts}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-wider font-bold">Retry Interval</p>
                <p className="font-heading font-bold text-2xl text-charcoal mt-1">{data.config.retry_interval_hours}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRefundModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Process Refund</h3>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="font-body text-xs text-purple-700">Refund amount: <span className="font-bold">${(refundModal.amount / 100).toFixed(2)}</span></p>
                <p className="font-mono text-[10px] text-purple-500 mt-1">Transaction: {refundModal.txnId?.slice(0, 20)}...</p>
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Reason for refund</label>
                <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3} placeholder="Enter reason..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRefundModal(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-charcoal font-body font-bold text-sm rounded-lg transition-all">Cancel</button>
                <button onClick={handleRefund} disabled={refunding}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-body font-bold text-sm rounded-lg transition-all disabled:opacity-50">
                  {refunding ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST MODAL */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAdjustModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-1">Adjust Subscription</h3>
            <p className="font-body text-xs text-charcoal/40 mb-4">{adjustModal.email}</p>
            <div className="space-y-4">
              <div>
                <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Change Plan</label>
                <select value={adjustPlan} onChange={e => setAdjustPlan(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal/30">
                  <option value="">No change</option>
                  <option value="explorer">Explorer (Free)</option>
                  <option value="family">Family ($19/mo)</option>
                  <option value="academy">Academy ($79/mo)</option>
                </select>
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Change Status</label>
                <select value={adjustStatus} onChange={e => setAdjustStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal/30">
                  <option value="">No change</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Extend by (days)</label>
                <input type="number" value={adjustDays} onChange={e => setAdjustDays(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-charcoal/60 mb-1 block">Reason</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason for adjustment"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-body text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal/30" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAdjustModal(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-charcoal font-body font-bold text-sm rounded-lg transition-all">Cancel</button>
                <button onClick={handleAdjust} disabled={adjusting}
                  className="flex-1 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-lg transition-all disabled:opacity-50">
                  {adjusting ? 'Saving...' : 'Apply Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
