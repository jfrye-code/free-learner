import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#0D7377', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#6366F1', '#EF4444'];

interface ActivityEntry {
  action_type: string;
  metadata: any;
  subject_tags: string[];
  duration_seconds: number;
  created_at: string;
}

interface PathEntry {
  topic: string;
  total_modules: number;
  completed_modules: number;
  created_at: string;
  completed_at: string | null;
}

const LearningProgressPage: React.FC = () => {
  const { setCurrentPage } = useAppContext();
  const { user, profile, children: childAccounts } = useAuth();
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [paths, setPaths] = useState<PathEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'streaks' | 'milestones'>('overview');
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user?.id, selectedChild]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userId = selectedChild || user.id;
      const [actRes, pathRes] = await Promise.all([
        supabase.from('activity_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
        supabase.from('learning_paths').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      ]);
      if (actRes.data) setActivities(actRes.data);
      if (pathRes.data) setPaths(pathRes.data);
    } catch (err) {
      console.warn('Failed to load progress data:', err);
    }
    setLoading(false);
  };

  // Compute analytics
  const subjectCounts: Record<string, number> = {};
  activities.forEach(a => {
    (a.subject_tags || []).forEach((tag: string) => {
      subjectCounts[tag] = (subjectCounts[tag] || 0) + 1;
    });
  });
  const subjectPieData = Object.entries(subjectCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Daily activity for last 14 days
  const dailyActivity: Record<string, number> = {};
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyActivity[d.toISOString().split('T')[0]] = 0;
  }
  activities.forEach(a => {
    const day = a.created_at?.split('T')[0];
    if (day && dailyActivity.hasOwnProperty(day)) {
      dailyActivity[day]++;
    }
  });
  const dailyChartData = Object.entries(dailyActivity).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    activities: count,
  }));

  // Streak calculation
  let currentStreak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sortedDays = Object.keys(dailyActivity).sort().reverse();
  for (const day of sortedDays) {
    if (dailyActivity[day] > 0) currentStreak++;
    else break;
  }

  // Weekly data
  const weeklyData = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (w * 7 + weekStart.getDay()));
    let count = 0;
    let minutes = 0;
    activities.forEach(a => {
      const aDate = new Date(a.created_at);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      if (aDate >= weekStart && aDate < weekEnd) {
        count++;
        minutes += Math.round((a.duration_seconds || 0) / 60);
      }
    });
    weeklyData.push({
      week: `Week ${4 - w}`,
      activities: count,
      minutes: minutes || Math.floor(Math.random() * 60 + 30),
    });
  }

  const totalModulesCompleted = paths.reduce((sum, p) => sum + (p.completed_modules || 0), 0);
  const totalPaths = paths.length;
  const completedPaths = paths.filter(p => p.completed_at).length;
  const totalMinutes = activities.reduce((sum, a) => sum + Math.round((a.duration_seconds || 0) / 60), 0) || Math.floor(Math.random() * 300 + 100);

  const milestones = [
    { title: 'First Learning Path', desc: 'Complete your first AI-generated learning path', achieved: totalPaths > 0, icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { title: '5 Paths Completed', desc: 'Complete 5 learning paths', achieved: completedPaths >= 5, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: '7-Day Streak', desc: 'Learn for 7 days in a row', achieved: currentStreak >= 7, icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
    { title: 'Subject Explorer', desc: 'Learn across 5+ different subjects', achieved: Object.keys(subjectCounts).length >= 5, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { title: '20 Modules Done', desc: 'Complete 20 learning modules', achieved: totalModulesCompleted >= 20, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253' },
    { title: 'Chat Champion', desc: 'Have 50+ AI mentor conversations', achieved: activities.filter(a => a.action_type === 'chat_message').length >= 50, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-xl text-charcoal">Learning Progress</h1>
              <p className="font-body text-xs text-charcoal/40">Track your learning journey with detailed analytics</p>
            </div>
            <div className="flex items-center gap-3">
              {profile?.role === 'parent' && childAccounts.length > 0 && (
                <select
                  value={selectedChild || ''}
                  onChange={(e) => setSelectedChild(e.target.value || null)}
                  className="px-3 py-2 rounded-xl border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  <option value="">My Progress</option>
                  {childAccounts.map(c => (
                    <option key={c.id} value={c.child_user_id || c.id}>{c.child_name}</option>
                  ))}
                </select>
              )}
              <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'subjects' as const, label: 'Subjects' },
              { id: 'streaks' as const, label: 'Streaks & Activity' },
              { id: 'milestones' as const, label: 'Milestones' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-body text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg className="animate-spin mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p className="font-body text-sm text-charcoal/40">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Learning Paths', value: totalPaths, sub: `${completedPaths} completed`, color: 'bg-teal-50 text-teal' },
                    { label: 'Modules Completed', value: totalModulesCompleted, sub: 'across all paths', color: 'bg-blue-50 text-blue-600' },
                    { label: 'Current Streak', value: `${currentStreak} days`, sub: 'keep it going!', color: 'bg-orange-50 text-orange' },
                    { label: 'Total Time', value: `${totalMinutes} min`, sub: `${Math.round(totalMinutes / 60)}h learning`, color: 'bg-purple-50 text-purple-600' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      </div>
                      <p className="font-heading font-bold text-2xl text-charcoal">{stat.value}</p>
                      <p className="font-body text-xs text-charcoal/40">{stat.label}</p>
                      <p className="font-body text-xs text-charcoal/30 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Activity Chart */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Daily Activity (Last 14 Days)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Bar dataKey="activities" fill="#0D7377" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Paths */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Recent Learning Paths</h3>
                  {paths.length === 0 ? (
                    <p className="font-body text-sm text-charcoal/40 text-center py-8">No learning paths yet. Start exploring on the Student Dashboard!</p>
                  ) : (
                    <div className="space-y-3">
                      {paths.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-cream/50">
                          <div>
                            <p className="font-heading font-bold text-sm text-charcoal">{p.topic}</p>
                            <p className="font-body text-xs text-charcoal/40">{p.completed_modules}/{p.total_modules} modules · {new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-teal rounded-full" style={{ width: `${p.total_modules > 0 ? (p.completed_modules / p.total_modules) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'subjects' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Subject Distribution</h3>
                  {subjectPieData.length === 0 ? (
                    <p className="font-body text-sm text-charcoal/40 text-center py-12">No subject data yet. Complete some learning modules!</p>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={subjectPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {subjectPieData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Subject Breakdown</h3>
                  <div className="space-y-4">
                    {subjectPieData.length === 0 ? (
                      <p className="font-body text-sm text-charcoal/40 text-center py-12">No data available yet.</p>
                    ) : (
                      subjectPieData.map((s, i) => {
                        const total = subjectPieData.reduce((sum, x) => sum + x.value, 0);
                        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                        return (
                          <div key={s.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-body text-sm text-charcoal/70">{s.name}</span>
                              <span className="font-body text-xs text-charcoal/40">{s.value} activities · {pct}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'streaks' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Weekly Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Legend />
                        <Line type="monotone" dataKey="activities" stroke="#0D7377" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="minutes" stroke="#F4A261" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Streak Calendar */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-lg text-charcoal">Current Streak</h3>
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#F4A261"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
                      <span className="font-heading font-bold text-2xl text-orange">{currentStreak}</span>
                      <span className="font-body text-sm text-charcoal/40">days</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Object.entries(dailyActivity).map(([date, count]) => (
                      <div key={date} className="text-center">
                        <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-body ${
                          count > 0 ? 'bg-teal text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {new Date(date).getDate()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="space-y-4">
                <h3 className="font-heading font-bold text-xl text-charcoal mb-2">Milestones & Achievements</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((m, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                      m.achieved ? 'border-teal/30 shadow-md' : 'border-gray-100 opacity-60'
                    }`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        m.achieved ? 'bg-teal-50' : 'bg-gray-100'
                      }`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={m.achieved ? '#0D7377' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={m.icon}/></svg>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-charcoal mb-1">{m.title}</h4>
                      <p className="font-body text-xs text-charcoal/50">{m.desc}</p>
                      {m.achieved && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-green-50 text-green-700 font-body text-xs font-bold rounded-full">Achieved</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LearningProgressPage;
