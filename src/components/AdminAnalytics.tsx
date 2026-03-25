
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  overview: {
    totalUsers: number; newUsers30: number; newUsersPrev30: number;
    roleCounts: Record<string, number>; monthlyRevenue: number;
    totalSubscriptions: number; subCounts: Record<string, number>;
  };
  signupTrend: { date: string; count: number }[];
  revenueTrend: { month: string; revenue: number }[];
  referrals: { total: number; link_clicked: number; visited: number; signed_up: number; active: number; conversionRate: string };
  refTrend: { date: string; referrals: number }[];
  discounts: { totalCodes: number; activeCodes: number; totalRedemptions: number };
  campaigns: { total: number; sent: number; totalRecipients: number };
  content: { total: number; published: number };
  popularTopics: { topic: string; count: number }[];
  cohorts: { month: string; size: number; weeks: number[] }[];
}

const COLORS = ['#0D7377', '#F97316', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#EF4444'];

const AdminAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('admin-analytics', {
        body: { action: 'dashboard' }
      });
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg className="animate-spin mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="font-body text-sm text-charcoal/40 mt-3">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 rounded-xl p-6 text-center">
        <p className="font-body text-red-600">{error || 'No data available'}</p>
        <button onClick={loadAnalytics} className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg font-body text-sm text-red-700 transition-all">Retry</button>
      </div>
    );
  }

  const userGrowth = data.overview.newUsersPrev30 > 0
    ? (((data.overview.newUsers30 - data.overview.newUsersPrev30) / data.overview.newUsersPrev30) * 100).toFixed(1)
    : data.overview.newUsers30 > 0 ? '100' : '0';

  const planData = [
    { name: 'Explorer', value: data.overview.subCounts.explorer || 0 },
    { name: 'Family', value: data.overview.subCounts.family || 0 },
    { name: 'Academy', value: data.overview.subCounts.academy || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-charcoal">Analytics Dashboard</h2>
          <p className="font-body text-sm text-charcoal/40">Business metrics and growth insights</p>
        </div>
        <button onClick={loadAnalytics} className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal font-body text-sm font-semibold rounded-lg transition-all flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: data.overview.totalUsers, change: `+${data.overview.newUsers30} this month`, color: 'text-teal', bg: 'bg-teal-50', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' },
          { label: 'Monthly Revenue', value: `$${data.overview.monthlyRevenue.toLocaleString()}`, change: `${data.overview.subCounts.family + data.overview.subCounts.academy} paid subs`, color: 'text-green-600', bg: 'bg-green-50', icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2' },
          { label: 'User Growth', value: `${userGrowth}%`, change: `vs last 30 days`, color: parseFloat(userGrowth) >= 0 ? 'text-blue-600' : 'text-red-600', bg: 'bg-blue-50', icon: 'M23 6l-9.5 9.5-5-5L1 18' },
          { label: 'Referral Conversion', value: `${data.referrals.conversionRate}%`, change: `${data.referrals.total} total referrals`, color: 'text-purple-600', bg: 'bg-purple-50', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684' },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-5 border border-gray-100`}>
            <svg className="mb-2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={kpi.icon} className={kpi.color} /></svg>
            <p className={`font-heading font-bold text-2xl ${kpi.color}`}>{kpi.value}</p>
            <p className="font-body text-xs text-charcoal/40 mt-1">{kpi.label}</p>
            <p className="font-body text-[10px] text-charcoal/30 mt-0.5">{kpi.change}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signup Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Daily Signups (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.signupTrend}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} labelFormatter={v => new Date(v).toLocaleDateString()} />
                <Area type="monotone" dataKey="count" stroke="#0D7377" fill="url(#signupGrad)" strokeWidth={2} name="Signups" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Monthly Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Plan Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData.length > 0 ? planData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(planData.length > 0 ? planData : [{ name: 'No data', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {planData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="font-body text-xs text-charcoal/60">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Funnel */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Referral Funnel</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Sent', value: data.referrals.total, pct: 100, color: 'bg-blue-500' },
              { label: 'Clicked Link', value: data.referrals.link_clicked, pct: data.referrals.total > 0 ? (data.referrals.link_clicked / data.referrals.total * 100) : 0, color: 'bg-indigo-500' },
              { label: 'Visited Site', value: data.referrals.visited, pct: data.referrals.total > 0 ? (data.referrals.visited / data.referrals.total * 100) : 0, color: 'bg-purple-500' },
              { label: 'Signed Up', value: data.referrals.signed_up, pct: data.referrals.total > 0 ? (data.referrals.signed_up / data.referrals.total * 100) : 0, color: 'bg-teal' },
              { label: 'Active', value: data.referrals.active, pct: data.referrals.total > 0 ? (data.referrals.active / data.referrals.total * 100) : 0, color: 'bg-green-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-xs text-charcoal/60">{item.label}</span>
                  <span className="font-body text-xs font-bold text-charcoal">{item.value} ({item.pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${Math.max(2, item.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'Discount Codes', value: `${data.discounts.activeCodes} active / ${data.discounts.totalCodes} total`, sub: `${data.discounts.totalRedemptions} redemptions` },
              { label: 'Email Campaigns', value: `${data.campaigns.sent} sent / ${data.campaigns.total} total`, sub: `${data.campaigns.totalRecipients} recipients` },
              { label: 'Content Modules', value: `${data.content.published} published / ${data.content.total} total`, sub: 'Learning content' },
              { label: 'User Roles', value: `${data.overview.roleCounts.parent || 0} parents, ${data.overview.roleCounts.educator || 0} educators`, sub: `${data.overview.roleCounts.student || 0} students` },
            ].map(s => (
              <div key={s.label} className="p-3 bg-cream rounded-xl">
                <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-wider font-bold">{s.label}</p>
                <p className="font-body text-sm font-semibold text-charcoal mt-1">{s.value}</p>
                <p className="font-body text-[10px] text-charcoal/30">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral Trend */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Referral Activity (Last 30 Days)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.refTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} labelFormatter={v => new Date(v).toLocaleDateString()} />
              <Line type="monotone" dataKey="referrals" stroke="#8B5CF6" strokeWidth={2} dot={false} name="Referrals" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Retention Cohorts */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-heading font-bold text-sm text-charcoal mb-4">Retention Cohort Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Cohort</th>
                <th className="text-center px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Size</th>
                <th className="text-center px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Week 0</th>
                <th className="text-center px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Week 1</th>
                <th className="text-center px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Week 2</th>
                <th className="text-center px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Week 3</th>
                <th className="text-center px-3 py-2 font-body text-xs font-semibold text-charcoal/50">Week 4</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map(cohort => (
                <tr key={cohort.month} className="border-t border-gray-50">
                  <td className="px-3 py-2 font-body text-sm font-semibold text-charcoal">{cohort.month}</td>
                  <td className="text-center px-3 py-2 font-body text-sm text-charcoal/60">{cohort.size}</td>
                  {[0, 1, 2, 3, 4].map(w => {
                    const val = cohort.weeks[w];
                    if (val === undefined) return <td key={w} className="text-center px-3 py-2 font-body text-xs text-charcoal/20">-</td>;
                    const opacity = val / 100;
                    return (
                      <td key={w} className="text-center px-3 py-2">
                        <span className="inline-block px-2 py-1 rounded font-body text-xs font-bold" style={{
                          backgroundColor: `rgba(13, 115, 119, ${opacity * 0.3})`,
                          color: val > 50 ? '#0D7377' : '#6B7280'
                        }}>
                          {val}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
