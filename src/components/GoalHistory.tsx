import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GOAL_TYPE_CONFIG: Record<string, { label: string; unit: string; color: string; bg: string; icon: string }> = {
  time_minutes: { label: 'Learning Time', unit: 'min', color: '#0D7377', bg: 'bg-teal-50', icon: 'M12 6v6l4 2' },
  modules_completed: { label: 'Modules Completed', unit: '', color: '#22C55E', bg: 'bg-green-50', icon: 'M9 12l2 2 4-4' },
  subjects_covered: { label: 'Subjects Covered', unit: '', color: '#3B82F6', bg: 'bg-blue-50', icon: 'M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z' },
  streak_days: { label: 'Streak Days', unit: 'd', color: '#F59E0B', bg: 'bg-amber-50', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  quiz_score_avg: { label: 'Avg Quiz Score', unit: '%', color: '#8B5CF6', bg: 'bg-purple-50', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
};

interface GoalHistoryProps {
  childId: string;
  childName: string;
  parentId: string;
  onApplyTarget?: (goalType: string, target: number) => void;
}

const GoalHistory: React.FC<GoalHistoryProps> = ({ childId, childName, parentId, onApplyTarget }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>('time_minutes');
  const [weeksBack, setWeeksBack] = useState(12);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-report', {
        body: { action: 'goal-history', childId, weeksBack },
      });
      if (error) throw error;
      setData(result);
    } catch (err) {
      console.warn('Failed to load goal history:', err);
      setData(null);
    }
    setLoading(false);
  }, [childId, weeksBack]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <svg className="animate-spin mx-auto mb-4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
        <p className="font-body text-sm text-charcoal/40">Loading goal history...</p>
      </div>
    );
  }

  if (!data || !data.weeklyData || data.weeklyData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
        </div>
        <h3 className="font-heading font-bold text-lg text-charcoal mb-2">No History Yet</h3>
        <p className="font-body text-sm text-charcoal/40 max-w-md mx-auto">
          Set goals and generate weekly reports to start tracking {childName}'s progress over time.
        </p>
      </div>
    );
  }

  const { weeklyData, typeStats, overallStats } = data;
  const selectedConfig = GOAL_TYPE_CONFIG[selectedType] || GOAL_TYPE_CONFIG.time_minutes;
  const selectedStats = typeStats?.[selectedType] || {};

  // Build chart data for selected type
  const chartData = weeklyData.map((w: any) => {
    const gt = w.goal_types[selectedType] || {};
    return {
      week: w.week_label,
      actual: gt.actual || 0,
      target: gt.target || null,
    };
  });

  // Heatmap data
  const heatmapWeeks = weeklyData.filter((w: any) => w.goals_set > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="font-heading font-bold text-xl lg:text-2xl mb-1">Goal History & Trends</h2>
            <p className="font-body text-sm text-white/70">
              Track {childName}'s goal performance over the last {weeksBack} weeks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={weeksBack}
              onChange={(e) => setWeeksBack(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl bg-white/15 text-white font-body text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer"
            >
              <option value={8} className="text-charcoal">Last 8 weeks</option>
              <option value={12} className="text-charcoal">Last 12 weeks</option>
            </select>
          </div>
        </div>
        {/* Overall Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Weeks Tracked', value: overallStats.total_weeks_tracked },
            { label: 'All Goals Met', value: overallStats.weeks_all_met },
            { label: 'Partial Weeks', value: overallStats.weeks_partial },
            { label: 'Completion Rate', value: `${overallStats.overall_completion_rate}%` },
          ].map((s, i) => (
            <div key={i} className="text-center p-3 bg-white/10 rounded-xl">
              <p className="font-heading font-bold text-xl lg:text-2xl">{s.value}</p>
              <p className="font-body text-[10px] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Type Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(GOAL_TYPE_CONFIG).map(([type, cfg]) => {
          const stats = typeStats?.[type] || {};
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-body text-sm font-semibold whitespace-nowrap transition-all ${
                selectedType === type
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-100 bg-white text-charcoal/60 hover:border-indigo-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cfg.bg}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round"><path d={cfg.icon}/></svg>
              </div>
              {cfg.label}
              {stats.weeks_tracked > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  stats.completion_rate >= 70 ? 'bg-green-100 text-green-700' :
                  stats.completion_rate >= 40 ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{stats.completion_rate}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trend Line Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-heading font-bold text-lg text-charcoal flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selectedConfig.color} strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            {selectedConfig.label} Trend
          </h3>
          {selectedStats.trend && selectedStats.trend !== 'insufficient_data' && (
            <span className={`px-2.5 py-1 rounded-lg font-body text-xs font-bold ${
              selectedStats.trend === 'improving' ? 'bg-green-50 text-green-700' :
              selectedStats.trend === 'declining' ? 'bg-red-50 text-red-600' :
              'bg-gray-50 text-gray-500'
            }`}>
              {selectedStats.trend === 'improving' ? 'Trending Up' : selectedStats.trend === 'declining' ? 'Trending Down' : 'Stable'}
            </span>
          )}
        </div>
        <p className="font-body text-xs text-charcoal/40 mb-4">Actual values vs targets over the last {weeksBack} weeks</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(value: any, name: string) => [
                  `${value}${selectedConfig.unit}`,
                  name === 'actual' ? 'Actual' : 'Target'
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={selectedConfig.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: selectedConfig.color }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target"
                stroke="#D1D5DB"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: '#D1D5DB' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats + Optimal Target */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Per-Type Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {selectedConfig.label} Stats
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Weeks Tracked', value: selectedStats.weeks_tracked || 0 },
              { label: 'Weeks Met', value: selectedStats.weeks_met || 0 },
              { label: 'Completion Rate', value: `${selectedStats.completion_rate || 0}%` },
              { label: 'Avg Target', value: `${selectedStats.avg_target || 0}${selectedConfig.unit}` },
              { label: 'Avg Actual', value: `${selectedStats.avg_actual || 0}${selectedConfig.unit}` },
              { label: 'Best Week', value: `${selectedStats.max_actual || 0}${selectedConfig.unit}` },
              { label: 'Lowest Week', value: `${selectedStats.min_actual || 0}${selectedConfig.unit}` },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="font-body text-sm text-charcoal/60">{item.label}</span>
                <span className="font-heading font-bold text-sm text-charcoal">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Optimal Target Suggestion */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            Optimal Target
          </h3>
          {selectedStats.suggested_target ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <p className="font-body text-xs text-amber-700 font-semibold mb-2">Recommended Target</p>
                <p className="font-heading font-bold text-3xl" style={{ color: selectedConfig.color }}>
                  {selectedStats.suggested_target}{selectedConfig.unit}
                </p>
                <p className="font-body text-xs text-charcoal/40 mt-2">
                  Based on {childName}'s average performance ({selectedStats.avg_actual}{selectedConfig.unit}) with a 10% stretch factor
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="font-heading font-bold text-lg text-charcoal">{selectedStats.avg_actual}{selectedConfig.unit}</p>
                  <p className="font-body text-[10px] text-charcoal/40">Average</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="font-heading font-bold text-lg text-charcoal">{selectedStats.suggested_target}{selectedConfig.unit}</p>
                  <p className="font-body text-[10px] text-charcoal/40">Suggested</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="font-heading font-bold text-lg text-charcoal">{selectedStats.max_actual}{selectedConfig.unit}</p>
                  <p className="font-body text-[10px] text-charcoal/40">Best</p>
                </div>
              </div>
              {onApplyTarget && (
                <button
                  onClick={() => onApplyTarget(selectedType, selectedStats.suggested_target)}
                  className="w-full py-2.5 bg-indigo-600 text-white font-heading font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Apply This Target
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
              <p className="font-body text-sm text-charcoal/40">Need at least 3 weeks of data to suggest optimal targets</p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Rate by Goal Type */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Completion Rates by Goal Type
        </h3>
        <div className="space-y-4">
          {Object.entries(GOAL_TYPE_CONFIG).map(([type, cfg]) => {
            const stats = typeStats?.[type] || {};
            if (stats.weeks_tracked === 0) return null;
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round"><path d={cfg.icon}/></svg>
                    </div>
                    <span className="font-body text-sm font-semibold text-charcoal">{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-charcoal/40">{stats.weeks_met}/{stats.weeks_tracked} weeks</span>
                    <span className={`font-heading font-bold text-sm ${
                      stats.completion_rate >= 70 ? 'text-green-600' :
                      stats.completion_rate >= 40 ? 'text-amber-600' : 'text-red-500'
                    }`}>{stats.completion_rate}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.completion_rate}%`, backgroundColor: cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Heatmap Calendar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Weekly Goal Achievement Heatmap
        </h3>
        <p className="font-body text-xs text-charcoal/40 mb-5">Each cell represents one week's goal achievement status</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {weeklyData.map((w: any, i: number) => {
            const statusColors: Record<string, string> = {
              all_met: 'bg-green-500 text-white',
              partial: 'bg-amber-400 text-white',
              missed: 'bg-red-400 text-white',
              no_goals: 'bg-gray-100 text-gray-400',
            };
            return (
              <div
                key={i}
                className={`p-3 rounded-xl text-center transition-all hover:scale-105 ${statusColors[w.status] || 'bg-gray-100 text-gray-400'}`}
                title={`Week of ${w.week_label}: ${w.goals_set} goals set, ${w.goals_met} met`}
              >
                <p className="font-body text-[10px] opacity-80">{w.week_label}</p>
                <p className="font-heading font-bold text-sm">
                  {w.goals_set > 0 ? `${w.goals_met}/${w.goals_set}` : '-'}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          {[
            { label: 'All Met', color: 'bg-green-500' },
            { label: 'Partial', color: 'bg-amber-400' },
            { label: 'Missed', color: 'bg-red-400' },
            { label: 'No Goals', color: 'bg-gray-200' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="font-body text-xs text-charcoal/40">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoalHistory;
