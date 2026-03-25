import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface LiveDashboardProps {
  childId: string;
  childName: string;
  parentId: string;
  parentEmail?: string;
  parentName?: string;
}

interface HeatMapCell {
  day: number;
  hour: number;
  minutes: number;
}

interface NotifPrefs {
  id?: string;
  distress_alerts: boolean;
  weekly_reports: boolean;
  milestone_celebrations: boolean;
  time_limit_alerts: boolean;
  last_weekly_report_sent: string | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm

const LiveDashboard: React.FC<LiveDashboardProps> = ({ childId, childName, parentId, parentEmail, parentName }) => {
  const [heatMapData, setHeatMapData] = useState<HeatMapCell[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState<Date | null>(null);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [todayModules, setTodayModules] = useState(0);
  const [todayTopics, setTodayTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [loading, setLoading] = useState(true);

  // Notification preferences
  const [prefs, setPrefs] = useState<NotifPrefs>({
    distress_alerts: true,
    weekly_reports: true,
    milestone_celebrations: true,
    time_limit_alerts: true,
    last_weekly_report_sent: null,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  // Load all data
  useEffect(() => {
    if (childId) {
      loadHeatMap();
      loadLiveStatus();
      loadNotifPrefs();
    }
  }, [childId]);

  // Session timer
  useEffect(() => {
    if (!sessionStart) return;
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStart.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  // Auto-refresh live status every 30s
  useEffect(() => {
    if (!childId) return;
    const interval = setInterval(loadLiveStatus, 30000);
    return () => clearInterval(interval);
  }, [childId]);

  const loadHeatMap = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('activity_log')
        .select('created_at, duration_seconds, action_type, metadata, subject_tags')
        .eq('user_id', childId)
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        // Build heat map
        const cellMap: Record<string, number> = {};
        data.forEach(entry => {
          const d = new Date(entry.created_at);
          const dayOfWeek = (d.getDay() + 6) % 7; // Mon=0
          const hour = d.getHours();
          const key = `${dayOfWeek}-${hour}`;
          cellMap[key] = (cellMap[key] || 0) + Math.max(entry.duration_seconds || 60, 60) / 60;
        });

        const cells: HeatMapCell[] = [];
        for (let day = 0; day < 7; day++) {
          for (const hour of HOURS) {
            cells.push({ day, hour, minutes: cellMap[`${day}-${hour}`] || 0 });
          }
        }
        setHeatMapData(cells);

        // Today's stats
        const todayStr = new Date().toDateString();
        const todayActivities = data.filter(a => new Date(a.created_at).toDateString() === todayStr);
        setTodayModules(todayActivities.filter(a => a.action_type === 'module_completed').length);
        const topics = new Set<string>();
        todayActivities.forEach(a => {
          if (a.metadata?.topic) topics.add(a.metadata.topic);
          if (a.metadata?.module_title) topics.add(a.metadata.module_title);
          (a.subject_tags || []).forEach((t: string) => topics.add(t));
        });
        setTodayTopics(Array.from(topics));

        // Current topic
        if (data.length > 0) {
          setCurrentTopic(data[0].metadata?.topic || data[0].metadata?.module_title || '');
        }
      }
    } catch (err) {
      console.warn('Heat map load error:', err);
    }
    setLoading(false);
  };

  const loadLiveStatus = async () => {
    if (!childId) return;
    try {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('activity_log')
        .select('created_at, metadata')
        .eq('user_id', childId)
        .gte('created_at', fifteenMinsAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setIsActive(true);
        setLastActiveTime(new Date(data[0].created_at));
        if (!sessionStart) {
          // Estimate session start from recent activity
          const { data: sessionData } = await supabase
            .from('activity_log')
            .select('created_at')
            .eq('user_id', childId)
            .gte('created_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: true })
            .limit(1);
          if (sessionData && sessionData.length > 0) {
            setSessionStart(new Date(sessionData[0].created_at));
          }
        }
        if (data[0].metadata?.topic) setCurrentTopic(data[0].metadata.topic);
      } else {
        setIsActive(false);
        setSessionStart(null);
        setSessionDuration(0);
      }
    } catch (err) {
      console.warn('Live status error:', err);
    }
  };

  const loadNotifPrefs = async () => {
    if (!parentId) return;
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', parentId)
        .eq('child_id', childId)
        .single();
      if (data) {
        setPrefs({
          id: data.id,
          distress_alerts: data.distress_alerts ?? true,
          weekly_reports: data.weekly_reports ?? true,
          milestone_celebrations: data.milestone_celebrations ?? true,
          time_limit_alerts: data.time_limit_alerts ?? true,
          last_weekly_report_sent: data.last_weekly_report_sent,
        });
      }
    } catch {
      // No prefs yet
    }
  };

  const saveNotifPrefs = async () => {
    setSavingPrefs(true);
    setPrefsSaved(false);
    try {
      const payload = {
        user_id: parentId,
        child_id: childId,
        distress_alerts: prefs.distress_alerts,
        weekly_reports: prefs.weekly_reports,
        milestone_celebrations: prefs.milestone_celebrations,
        time_limit_alerts: prefs.time_limit_alerts,
        email_address: parentEmail || null,
        updated_at: new Date().toISOString(),
      };
      if (prefs.id) {
        await supabase.from('notification_preferences').update(payload).eq('id', prefs.id);
      } else {
        const { data } = await supabase.from('notification_preferences').insert(payload).select().single();
        if (data) setPrefs(p => ({ ...p, id: data.id }));
      }
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (err) {
      console.error('Save prefs error:', err);
    }
    setSavingPrefs(false);
  };

  const sendWeeklyReport = async () => {
    if (!parentEmail) return;
    setSendingReport(true);
    setReportSent(false);
    try {
      // Aggregate past 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activities } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', childId)
        .gte('created_at', weekAgo);

      const modulesCompleted = (activities || []).filter(a => a.action_type === 'module_completed').length;
      const totalSeconds = (activities || []).reduce((s, a) => s + (a.duration_seconds || 0), 0);
      const subjects = new Set<string>();
      const topics = new Set<string>();
      (activities || []).forEach(a => {
        (a.subject_tags || []).forEach((t: string) => subjects.add(t));
        if (a.metadata?.topic) topics.add(a.metadata.topic);
      });

      await supabase.functions.invoke('send-parent-alert', {
        body: {
          alertType: 'weekly_report',
          parentEmail,
          parentName: parentName || '',
          childName,
          data: {
            stats: {
              modules_completed: modulesCompleted,
              streak_days: 0,
              time_spent_minutes: Math.round(totalSeconds / 60),
              subjects_covered: Array.from(subjects),
              topics_explored: Array.from(topics),
            },
          },
        },
      });

      // Update last sent timestamp
      if (prefs.id) {
        await supabase.from('notification_preferences')
          .update({ last_weekly_report_sent: new Date().toISOString() })
          .eq('id', prefs.id);
      }
      setPrefs(p => ({ ...p, last_weekly_report_sent: new Date().toISOString() }));
      setReportSent(true);
      setTimeout(() => setReportSent(false), 5000);
    } catch (err) {
      console.error('Send report error:', err);
    }
    setSendingReport(false);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getHeatColor = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100';
    if (minutes < 5) return 'bg-green-100';
    if (minutes < 15) return 'bg-green-200';
    if (minutes < 30) return 'bg-green-400';
    if (minutes < 45) return 'bg-green-500';
    return 'bg-green-600';
  };

  const maxMinutes = Math.max(...heatMapData.map(c => c.minutes), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Live Status Banner */}
        <div className={`rounded-2xl p-6 border-2 transition-all ${isActive ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Heartbeat indicator */}
              <div className="relative">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#22C55E' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white">
                      <div className="w-full h-full rounded-full bg-green-400 animate-pulse" />
                    </div>
                  </>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-lg text-charcoal">
                    {isActive ? 'Currently Learning' : 'Not Active'}
                  </h3>
                  {isActive && (
                    <span className="px-2 py-0.5 bg-green-200 text-green-800 font-body text-xs font-bold rounded-full animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="font-body text-sm text-charcoal/50">
                  {isActive
                    ? `${childName} is actively learning right now`
                    : `${childName} was last active ${lastActiveTime ? new Date(lastActiveTime).toLocaleString() : 'recently'}`
                  }
                </p>
                {isActive && currentTopic && (
                  <p className="font-body text-xs text-green-700 mt-1">
                    Currently exploring: <span className="font-semibold">{currentTopic}</span>
                  </p>
                )}
              </div>
            </div>
            {isActive && sessionDuration > 0 && (
              <div className="text-right">
                <p className="font-body text-xs text-charcoal/40">Session Duration</p>
                <p className="font-heading font-bold text-2xl text-teal tabular-nums">{formatDuration(sessionDuration)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-heading font-bold text-2xl text-charcoal">{todayModules}</p>
            <p className="font-body text-xs text-charcoal/40">Modules Today</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <p className="font-heading font-bold text-2xl text-charcoal">{todayTopics.length}</p>
            <p className="font-body text-xs text-charcoal/40">Topics Today</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p className="font-heading font-bold text-2xl text-charcoal">
              {isActive && sessionDuration > 0 ? formatDuration(sessionDuration) : '--'}
            </p>
            <p className="font-body text-xs text-charcoal/40">Current Session</p>
          </div>
        </div>

        {/* Weekly Heat Map */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-charcoal">Weekly Activity Heat Map</h3>
              <p className="font-body text-xs text-charcoal/40">Learning intensity by day and hour this week</p>
            </div>
            <button onClick={loadHeatMap} className="font-body text-xs text-teal font-semibold hover:underline">Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex items-center mb-1">
                <div className="w-10 flex-shrink-0" />
                {HOURS.map(h => (
                  <div key={h} className="flex-1 text-center">
                    <span className="font-body text-[10px] text-charcoal/30">{h > 12 ? `${h-12}p` : h === 12 ? '12p' : `${h}a`}</span>
                  </div>
                ))}
              </div>

              {/* Grid */}
              {DAYS.map((day, dayIdx) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-10 flex-shrink-0">
                    <span className="font-body text-xs text-charcoal/50 font-semibold">{day}</span>
                  </div>
                  {HOURS.map(hour => {
                    const cell = heatMapData.find(c => c.day === dayIdx && c.hour === hour);
                    const mins = cell?.minutes || 0;
                    return (
                      <div key={hour} className="flex-1 px-0.5">
                        <div
                          className={`h-7 rounded-sm transition-all cursor-default ${getHeatColor(mins)}`}
                          title={`${day} ${hour}:00 - ${mins.toFixed(0)} min`}
                          style={mins > 0 ? { opacity: Math.max(0.3, Math.min(1, mins / maxMinutes)) } : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <span className="font-body text-[10px] text-charcoal/30">Less</span>
                {['bg-gray-100', 'bg-green-100', 'bg-green-200', 'bg-green-400', 'bg-green-500', 'bg-green-600'].map((c, i) => (
                  <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                ))}
                <span className="font-body text-[10px] text-charcoal/30">More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Topics */}
        {todayTopics.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-3">Today's Topics</h3>
            <div className="flex flex-wrap gap-2">
              {todayTopics.map((topic, i) => (
                <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal font-body text-sm font-semibold rounded-full">{topic}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Weekly Report */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-2">Weekly Progress Report</h3>
          <p className="font-body text-xs text-charcoal/40 mb-4">
            Send a summary of {childName}'s learning this week to your email.
          </p>
          {prefs.last_weekly_report_sent && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className="font-body text-xs text-charcoal/40">
                Last sent: {new Date(prefs.last_weekly_report_sent).toLocaleDateString()} at {new Date(prefs.last_weekly_report_sent).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <button
            onClick={sendWeeklyReport}
            disabled={sendingReport || !parentEmail}
            className="w-full py-3 bg-gradient-to-r from-teal to-teal-dark text-white font-body font-bold text-sm rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sendingReport ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                Sending...
              </>
            ) : reportSent ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Report Sent!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Send Weekly Report
              </>
            )}
          </button>
          {!parentEmail && (
            <p className="font-body text-xs text-amber-600 mt-2 text-center">Add your email in Account Settings to receive reports.</p>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-1">Email Notifications</h3>
          <p className="font-body text-xs text-charcoal/40 mb-4">Choose which alerts you receive for {childName}.</p>

          <div className="space-y-3">
            {[
              { key: 'distress_alerts' as const, label: 'Safety / Distress Alerts', desc: 'Get notified if the AI detects concerning language', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', color: '#EF4444', critical: true },
              { key: 'weekly_reports' as const, label: 'Weekly Progress Reports', desc: 'Automated weekly learning summaries', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#0D7377' },
              { key: 'milestone_celebrations' as const, label: 'Milestone Celebrations', desc: 'When your child earns badges or streaks', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', color: '#F59E0B' },
              { key: 'time_limit_alerts' as const, label: 'Time Limit Alerts', desc: 'When daily time limit is approaching', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: '#8B5CF6' },
            ].map(item => (
              <div key={item.key} className={`flex items-center justify-between p-3 rounded-xl ${item.critical && prefs[item.key] ? 'bg-red-50' : 'bg-cream'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                  </div>
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">{item.label}</p>
                    <p className="font-body text-[11px] text-charcoal/40">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key] }))}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${prefs[item.key] ? 'bg-teal' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${prefs[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={saveNotifPrefs}
            disabled={savingPrefs}
            className="w-full mt-4 py-2.5 bg-charcoal/5 hover:bg-charcoal/10 text-charcoal font-body text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            {savingPrefs ? 'Saving...' : prefsSaved ? 'Preferences Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
