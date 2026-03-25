import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const CHILD_COLORS = ['#0D7377', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6', '#22C55E'];
const CHILD_BG_COLORS = ['bg-teal-50', 'bg-purple-50', 'bg-amber-50', 'bg-pink-50', 'bg-blue-50', 'bg-green-50'];
const CHILD_TEXT_COLORS = ['text-teal', 'text-purple-600', 'text-amber-600', 'text-pink-600', 'text-blue-600', 'text-green-600'];

const CATEGORY_ICONS: Record<string, string> = {
  clock: 'M12 6v6l4 2M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z',
  fire: 'M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z',
  book: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  check: 'M9 12l2 2 4-4M22 11.08V12a10 10 0 1 1-5.93-9.14',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  target: 'M22 12h-4M6 12H2M12 6V2M12 22v-4M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 12m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  award: 'M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5zM12 8a6 6 0 1 0 0-12 6 6 0 0 0 0 12z',
};

interface ChildInfo {
  id: string;
  name: string;
  age?: number;
}

interface FamilyOverviewProps {
  children: ChildInfo[];
  parentId: string;
}

const FamilyOverview: React.FC<FamilyOverviewProps> = ({ children: childrenList, parentId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [weeksBack, setWeeksBack] = useState(4);
  const [activeView, setActiveView] = useState<'overview' | 'leaderboard' | 'details'>('overview');

  const loadFamilyData = useCallback(async () => {
    if (childrenList.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('generate-report', {
        body: {
          action: 'family-overview',
          children: childrenList.map(c => ({ id: c.id, name: c.name, age: c.age })),
          weeksBack,
        },
      });
      if (err) throw err;
      setData(result);
    } catch (err: any) {
      console.error('Failed to load family overview:', err);
      setError('Failed to load family data. Please try again.');
    }
    setLoading(false);
  }, [childrenList, weeksBack]);

  useEffect(() => { loadFamilyData(); }, [loadFamilyData]);

  if (childrenList.length < 2) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3 className="font-heading font-bold text-lg text-charcoal mb-2">Add More Students</h3>
        <p className="font-body text-sm text-charcoal/40 max-w-md mx-auto">
          The Family Overview requires at least 2 children to compare. Add another student in Account Settings to unlock this feature.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal rounded-2xl p-8 text-white">
          <h2 className="font-heading font-bold text-2xl mb-1">Family Overview</h2>
          <p className="font-body text-sm text-white/70">Loading family comparison data...</p>
        </div>
        <div className="text-center py-16">
          <svg className="animate-spin mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="font-body text-sm text-charcoal/40">Analyzing learning data for all children...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal rounded-2xl p-8 text-white">
          <h2 className="font-heading font-bold text-2xl mb-1">Family Overview</h2>
          <p className="font-body text-sm text-white/70">Compare your children's learning side by side</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 text-center">
          <p className="font-body text-sm text-red-600 mb-4">{error || 'Failed to load data'}</p>
          <button onClick={loadFamilyData} className="px-6 py-2.5 bg-teal text-white font-heading font-bold text-sm rounded-xl hover:bg-teal-dark transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { childMetrics, leaderboard, comparisonChartData, dailyComparisonChart, familySummary, collaborativeActivities, familyHighlights, parentTips, childNames } = data;

  // Radar chart data
  const radarData = [
    { metric: 'Learning Time', fullMark: 100 },
    { metric: 'Streak', fullMark: 100 },
    { metric: 'Subjects', fullMark: 100 },
    { metric: 'Modules', fullMark: 100 },
    { metric: 'Quiz Score', fullMark: 100 },
    { metric: 'Engagement', fullMark: 100 },
  ].map(item => {
    const entry: any = { ...item };
    childMetrics.forEach((c: any, i: number) => {
      const maxVals: Record<string, number> = {
        'Learning Time': Math.max(...childMetrics.map((cm: any) => cm.metrics.avgMinutesPerWeek || 1)),
        'Streak': 7,
        'Subjects': Math.max(...childMetrics.map((cm: any) => cm.metrics.subjectsCovered || 1)),
        'Modules': Math.max(...childMetrics.map((cm: any) => cm.metrics.modulesCompleted || 1)),
        'Quiz Score': 100,
        'Engagement': 100,
      };
      const metricMap: Record<string, string> = {
        'Learning Time': 'avgMinutesPerWeek',
        'Streak': 'currentStreak',
        'Subjects': 'subjectsCovered',
        'Modules': 'modulesCompleted',
        'Quiz Score': 'avgQuizScore',
        'Engagement': 'engagementScore',
      };
      const val = c.metrics[metricMap[item.metric]] || 0;
      const maxVal = maxVals[item.metric] || 1;
      entry[c.name] = Math.round((val / maxVal) * 100);
    });
    return entry;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal to-teal-dark rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="font-heading font-bold text-xl lg:text-2xl">Family Learning Overview</h2>
                <p className="font-body text-sm text-white/60">{childNames?.join(', ')} · Last {weeksBack} weeks</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={weeksBack} onChange={(e) => setWeeksBack(Number(e.target.value))} className="px-4 py-2.5 rounded-xl bg-white/15 text-white font-body text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer">
              <option value={2} className="text-charcoal">Last 2 weeks</option>
              <option value={4} className="text-charcoal">Last 4 weeks</option>
              <option value={8} className="text-charcoal">Last 8 weeks</option>
            </select>
            <button onClick={loadFamilyData} className="px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl font-body text-sm font-semibold transition-all flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Family Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="font-heading font-bold text-xl lg:text-2xl">{childMetrics.length}</p>
            <p className="font-body text-[10px] text-white/50">Students</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="font-heading font-bold text-xl lg:text-2xl">{childMetrics.reduce((s: number, c: any) => s + c.metrics.totalHours, 0).toFixed(1)}h</p>
            <p className="font-body text-[10px] text-white/50">Total Family Learning</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="font-heading font-bold text-xl lg:text-2xl">{childMetrics.reduce((s: number, c: any) => s + c.metrics.modulesCompleted, 0)}</p>
            <p className="font-body text-[10px] text-white/50">Total Modules</p>
          </div>
          <div className="text-center p-3 bg-white/10 rounded-xl">
            <p className="font-heading font-bold text-xl lg:text-2xl">{new Set(childMetrics.flatMap((c: any) => c.topSubjects)).size}</p>
            <p className="font-body text-[10px] text-white/50">Unique Subjects</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'overview' as const, label: 'Comparison', icon: 'M18 20V10M12 20V4M6 20v-6' },
          { id: 'leaderboard' as const, label: 'Leaderboard', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          { id: 'details' as const, label: 'AI Summary', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold transition-all whitespace-nowrap ${
              activeView === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white border border-gray-200 text-charcoal/60 hover:border-emerald-200'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={tab.icon}/></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* COMPARISON VIEW */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeView === 'overview' && (
        <>
          {/* Child Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {childMetrics.map((child: any, i: number) => (
              <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${CHILD_BG_COLORS[i % CHILD_BG_COLORS.length]}`}>
                    <span className="font-heading font-bold text-lg" style={{ color: CHILD_COLORS[i % CHILD_COLORS.length] }}>
                      {child.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-charcoal">{child.name}</p>
                    <div className="flex items-center gap-2">
                      {child.age && <span className="font-body text-xs text-charcoal/40">Age {child.age}</span>}
                      {child.latestGrade && (
                        <span className={`px-2 py-0.5 rounded font-heading font-bold text-[10px] ${
                          child.latestGrade.startsWith('A') ? 'bg-green-50 text-green-700' :
                          child.latestGrade.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{child.latestGrade}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Time/wk', value: `${child.metrics.avgMinutesPerWeek}m`, color: CHILD_COLORS[i] },
                    { label: 'Streak', value: `${child.metrics.currentStreak}d`, color: '#F59E0B' },
                    { label: 'Modules', value: child.metrics.modulesCompleted, color: '#22C55E' },
                    { label: 'Subjects', value: child.metrics.subjectsCovered, color: '#3B82F6' },
                    { label: 'Quiz Avg', value: child.metrics.avgQuizScore !== null ? `${child.metrics.avgQuizScore}%` : 'N/A', color: '#8B5CF6' },
                    { label: 'Goals', value: `${child.metrics.goalCompletionRate}%`, color: '#EC4899' },
                  ].map((stat, j) => (
                    <div key={j} className="p-2.5 bg-gray-50 rounded-lg">
                      <p className="font-heading font-bold text-sm" style={{ color: stat.color }}>{stat.value}</p>
                      <p className="font-body text-[10px] text-charcoal/40">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {child.topSubjects.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="font-body text-[10px] text-charcoal/30 mb-1.5">Top Subjects</p>
                    <div className="flex flex-wrap gap-1">
                      {child.topSubjects.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-body text-[10px] font-semibold rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Grouped Bar Chart - Key Metrics */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              Side-by-Side Metrics Comparison
            </h3>
            <p className="font-body text-xs text-charcoal/40 mb-4">All children compared across key learning metrics</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {childNames.map((name: string, i: number) => (
                    <Bar key={name} dataKey={name} fill={CHILD_COLORS[i % CHILD_COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Time Comparison */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Daily Learning Time This Week
            </h3>
            <p className="font-body text-xs text-charcoal/40 mb-4">Minutes spent learning each day by each child</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyComparisonChart} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9CA3AF' } }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {childNames.map((name: string, i: number) => (
                    <Bar key={name} dataKey={name} fill={CHILD_COLORS[i % CHILD_COLORS.length]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
              Learning Profile Comparison
            </h3>
            <p className="font-body text-xs text-charcoal/40 mb-4">Relative performance across all dimensions (normalized to 100)</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  {childNames.map((name: string, i: number) => (
                    <Radar key={name} name={name} dataKey={name} stroke={CHILD_COLORS[i % CHILD_COLORS.length]} fill={CHILD_COLORS[i % CHILD_COLORS.length]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              Detailed Comparison Table
            </h3>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-4 font-body text-xs font-semibold text-charcoal/40 uppercase">Metric</th>
                  {childMetrics.map((c: any, i: number) => (
                    <th key={c.id} className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHILD_COLORS[i % CHILD_COLORS.length] }} />
                        <span className="font-body text-xs font-semibold text-charcoal">{c.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Total Learning Time', key: 'totalHours', fmt: (v: number) => `${v}h` },
                  { label: 'Avg Time/Week', key: 'avgMinutesPerWeek', fmt: (v: number) => `${v}min` },
                  { label: 'Current Streak', key: 'currentStreak', fmt: (v: number) => `${v} days` },
                  { label: 'Subjects Covered', key: 'subjectsCovered', fmt: (v: number) => `${v}` },
                  { label: 'Modules Completed', key: 'modulesCompleted', fmt: (v: number) => `${v}` },
                  { label: 'Avg Quiz Score', key: 'avgQuizScore', fmt: (v: number | null) => v !== null ? `${v}%` : 'N/A' },
                  { label: 'Goal Completion', key: 'goalCompletionRate', fmt: (v: number) => `${v}%` },
                  { label: 'Engagement Score', key: 'engagementScore', fmt: (v: number) => `${v}/100` },
                  { label: 'Badges Earned', key: 'badgesEarned', fmt: (v: number) => `${v}` },
                ].map((row) => {
                  const values = childMetrics.map((c: any) => c.metrics[row.key]);
                  const maxVal = Math.max(...values.filter((v: any) => v !== null && v !== undefined));
                  return (
                    <tr key={row.key} className="border-b border-gray-50 hover:bg-cream/30 transition-colors">
                      <td className="py-3 px-4 font-body text-sm text-charcoal/70">{row.label}</td>
                      {childMetrics.map((c: any, i: number) => {
                        const val = c.metrics[row.key];
                        const isMax = val === maxVal && val > 0;
                        return (
                          <td key={c.id} className="py-3 px-4 text-center">
                            <span className={`font-heading font-bold text-sm ${isMax ? CHILD_TEXT_COLORS[i % CHILD_TEXT_COLORS.length] : 'text-charcoal/70'}`}>
                              {row.fmt(val)}
                            </span>
                            {isMax && val > 0 && (
                              <svg className="inline-block ml-1" width="12" height="12" viewBox="0 0 24 24" fill={CHILD_COLORS[i % CHILD_COLORS.length]} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEADERBOARD VIEW */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeView === 'leaderboard' && (
        <>
          {/* Leaderboard Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-charcoal">Family Leaderboard</h3>
                <p className="font-body text-xs text-charcoal/40">See who's leading in each learning category</p>
              </div>
            </div>
            <p className="font-body text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2 mt-3">
              <svg className="inline-block mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              This is a friendly family comparison to celebrate each child's unique strengths. Every child learns differently!
            </p>
          </div>

          {/* Category Leaderboards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {leaderboard.map((cat: any, catIdx: number) => {
              if (!cat.leader || cat.rankings.length === 0) return null;
              return (
                <div key={cat.key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.star} />
                      </svg>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-charcoal">{cat.category}</p>
                      <p className="font-body text-[10px] text-charcoal/30">Leader: {cat.leader.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cat.rankings.map((rank: any, ri: number) => {
                      const childIdx = childMetrics.findIndex((c: any) => c.id === rank.id);
                      const color = CHILD_COLORS[childIdx >= 0 ? childIdx % CHILD_COLORS.length : 0];
                      const maxVal = cat.rankings[0]?.value || 1;
                      const pct = maxVal > 0 ? Math.round((rank.value / maxVal) * 100) : 0;
                      return (
                        <div key={rank.id} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            ri === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white' :
                            ri === 1 ? 'bg-gray-200 text-gray-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            <span className="font-heading font-bold text-xs">{rank.rank}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-body text-sm font-semibold text-charcoal">{rank.name}</span>
                              <span className="font-heading font-bold text-sm" style={{ color }}>{rank.value}{cat.unit}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Win Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Category Wins
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {childMetrics.map((child: any, i: number) => {
                const wins = leaderboard.filter((l: any) => l.leader?.name === child.name).length;
                return (
                  <div key={child.id} className={`p-4 rounded-xl border-2 text-center ${wins > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}>
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${CHILD_BG_COLORS[i % CHILD_BG_COLORS.length]}`}>
                      <span className="font-heading font-bold text-lg" style={{ color: CHILD_COLORS[i % CHILD_COLORS.length] }}>
                        {child.name.charAt(0)}
                      </span>
                    </div>
                    <p className="font-heading font-bold text-sm text-charcoal">{child.name}</p>
                    <p className="font-heading font-bold text-2xl mt-1" style={{ color: CHILD_COLORS[i % CHILD_COLORS.length] }}>{wins}</p>
                    <p className="font-body text-[10px] text-charcoal/40">{wins === 1 ? 'category lead' : 'category leads'}</p>
                    {wins > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 justify-center">
                        {leaderboard.filter((l: any) => l.leader?.name === child.name).map((l: any) => (
                          <span key={l.key} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 font-body text-[9px] font-bold rounded">{l.category.split(' ')[0]}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AI SUMMARY VIEW */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeView === 'details' && (
        <>
          {/* AI Family Summary */}
          {familySummary && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </div>
                <h3 className="font-heading font-bold text-lg text-charcoal">AI Family Learning Summary</h3>
                <span className="ml-auto px-2 py-0.5 bg-emerald-50 text-emerald-600 font-body text-[10px] font-bold rounded">AI Generated</span>
              </div>
              <div className="font-body text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{familySummary}</div>
            </div>
          )}

          {/* Family Highlights */}
          {(familyHighlights || []).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Family Highlights
              </h3>
              <div className="space-y-2">
                {familyHighlights.map((h: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-green-50/50 rounded-xl">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span className="font-body text-sm text-charcoal/70">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collaborative Activities */}
          {(collaborativeActivities || []).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Collaborative Learning Activities
              </h3>
              <p className="font-body text-xs text-charcoal/40 mb-5">Activities your children can do together to learn from each other</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {collaborativeActivities.map((activity: any, i: number) => (
                  <div key={i} className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/20 hover:bg-indigo-50/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <span className="font-heading font-bold text-sm text-indigo-600">{i + 1}</span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-charcoal">{activity.title}</h4>
                    </div>
                    <p className="font-body text-sm text-charcoal/60 mb-3">{activity.description}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1">
                        {(activity.subjects || []).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-body text-[10px] font-semibold rounded">{s}</span>
                        ))}
                      </div>
                      {activity.estimated_time && (
                        <span className="ml-auto font-body text-[10px] text-charcoal/30 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {activity.estimated_time}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parent Tips */}
          {(parentTips || []).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                Tips for Fostering Family Learning
              </h3>
              <div className="space-y-3">
                {parentTips.map((tip: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="font-heading font-bold text-xs text-amber-700">{i + 1}</span>
                    </div>
                    <span className="font-body text-sm text-charcoal/70">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Strengths */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Individual Strengths
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {childMetrics.map((child: any, i: number) => (
                <div key={child.id} className="p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${CHILD_BG_COLORS[i % CHILD_BG_COLORS.length]}`}>
                      <span className="font-heading font-bold text-sm" style={{ color: CHILD_COLORS[i % CHILD_COLORS.length] }}>{child.name.charAt(0)}</span>
                    </div>
                    <p className="font-heading font-bold text-sm text-charcoal">{child.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    {(child.strengths || []).map((s: string, j: number) => (
                      <div key={j} className="flex items-start gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={CHILD_COLORS[i % CHILD_COLORS.length]} strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span className="font-body text-xs text-charcoal/60">{s}</span>
                      </div>
                    ))}
                    {(!child.strengths || child.strengths.length === 0) && (
                      <p className="font-body text-xs text-charcoal/40">Building momentum - keep going!</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FamilyOverview;
