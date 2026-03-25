import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LiveDashboard from '@/components/LiveDashboard';

interface ActivityEntry {
  action_type: string;
  metadata: any;
  subject_tags: string[];
  duration_seconds: number;
  created_at: string;
}

interface ParentControl {
  id?: string;
  child_id: string;
  daily_time_limit_minutes: number;
  content_filters: { block_violence: boolean; block_adult: boolean; safe_search: boolean };
  blocked_topics: string[];
  leaderboard_enabled: boolean;
  leaderboard_display_name: string;
  competition_weekly: boolean;
  competition_monthly: boolean;
}

const subjectData = [
  { name: 'Math', pct: 22, color: '#8B5CF6' },
  { name: 'Science', pct: 18, color: '#3B82F6' },
  { name: 'History', pct: 20, color: '#F59E0B' },
  { name: 'Language Arts', pct: 15, color: '#10B981' },
  { name: 'Arts', pct: 14, color: '#EC4899' },
  { name: 'Technology', pct: 11, color: '#6366F1' },
];

const standardsData = [
  { standard: 'Number & Operations', status: 'met', area: 'Math' },
  { standard: 'Geometry & Spatial', status: 'met', area: 'Math' },
  { standard: 'Measurement & Data', status: 'partial', area: 'Math' },
  { standard: 'Reading Comprehension', status: 'met', area: 'ELA' },
  { standard: 'Writing & Composition', status: 'partial', area: 'ELA' },
  { standard: 'Physical Science', status: 'met', area: 'Science' },
  { standard: 'Earth & Space Science', status: 'met', area: 'Science' },
  { standard: 'Life Science', status: 'not_started', area: 'Science' },
  { standard: 'World History', status: 'met', area: 'Social Studies' },
  { standard: 'Geography', status: 'partial', area: 'Social Studies' },
];

const ParentPortal: React.FC = () => {
  const { studentProfile, setCurrentPage } = useAppContext();
  const { user, profile, children: childAccounts } = useAuth();
  const [activeChild, setActiveChild] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'live' | 'activity' | 'controls' | 'report'>('overview');


  // Activity feed state
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Report state
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [controls, setControls] = useState<ParentControl>({
    child_id: '',
    daily_time_limit_minutes: 120,
    content_filters: { block_violence: true, block_adult: true, safe_search: true },
    blocked_topics: [],
    leaderboard_enabled: false,
    leaderboard_display_name: '',
    competition_weekly: false,
    competition_monthly: false,
  });
  const [savingControls, setSavingControls] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [newBlockedTopic, setNewBlockedTopic] = useState('');

  const children = childAccounts.length > 0
    ? childAccounts.map(c => ({
        name: c.child_name,
        age: c.age || 10,
        streak: 0,
        todayProgress: 0,
        id: c.child_user_id || c.id,
      }))
    : [
        { name: studentProfile.name, age: studentProfile.age, streak: studentProfile.streak, todayProgress: 60, id: user?.id || '' },
        { name: 'Emma', age: 8, streak: 5, todayProgress: 30, id: '' },
      ];

  const child = children[activeChild];

  // Load activity feed
  useEffect(() => {
    if (child?.id) {
      loadActivity(child.id);
      loadControls(childAccounts[activeChild]?.id || child.id);
    }
  }, [activeChild, child?.id]);

  const loadActivity = async (userId: string) => {
    if (!userId) return;
    setLoadingActivity(true);
    try {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setActivities(data);
    } catch (err) {
      console.warn('Failed to load activity:', err);
    }
    setLoadingActivity(false);
  };

  const loadControls = async (childId: string) => {
    if (!childId || !user?.id) return;
    try {
      const { data } = await supabase
        .from('parent_controls')
        .select('*')
        .eq('parent_id', user.id)
        .eq('child_id', childId)
        .single();
      if (data) {
        setControls({
          id: data.id,
          child_id: data.child_id,
          daily_time_limit_minutes: data.daily_time_limit_minutes || 120,
          content_filters: data.content_filters || { block_violence: true, block_adult: true, safe_search: true },
          blocked_topics: data.blocked_topics || [],
          leaderboard_enabled: data.leaderboard_enabled || false,
          leaderboard_display_name: data.leaderboard_display_name || '',
          competition_weekly: data.competition_weekly || false,
          competition_monthly: data.competition_monthly || false,
        });
      }
    } catch {
      // No controls set yet, use defaults
    }
  };

  const saveControls = async () => {
    if (!user?.id) return;
    const childId = childAccounts[activeChild]?.id || child.id;
    if (!childId) return;

    setSavingControls(true);
    setSavedMessage('');
    try {
      const payload = {
        parent_id: user.id,
        child_id: childId,
        daily_time_limit_minutes: controls.daily_time_limit_minutes,
        content_filters: controls.content_filters,
        blocked_topics: controls.blocked_topics,
        leaderboard_enabled: controls.leaderboard_enabled,
        leaderboard_display_name: controls.leaderboard_display_name,
        competition_weekly: controls.competition_weekly,
        competition_monthly: controls.competition_monthly,
        updated_at: new Date().toISOString(),
      };

      if (controls.id) {
        await supabase.from('parent_controls').update(payload).eq('id', controls.id);
      } else {
        const { data } = await supabase.from('parent_controls').insert(payload).select().single();
        if (data) setControls(prev => ({ ...prev, id: data.id }));
      }

      // ─── LEADERBOARD OPT-IN/OUT ───
      // When leaderboard is enabled, upsert the child's leaderboard_entries row
      const childUserId = child.id;
      if (childUserId) {
        if (controls.leaderboard_enabled) {
          const displayName = controls.leaderboard_display_name.trim() || child.name;
          const ageGroup = child.age <= 8 ? '6-8' : child.age <= 11 ? '9-11' : child.age <= 14 ? '12-14' : '15+';

          // Check if entry exists
          const { data: existingEntry } = await supabase
            .from('leaderboard_entries')
            .select('id')
            .eq('user_id', childUserId)
            .single();

          if (existingEntry) {
            await supabase.from('leaderboard_entries')
              .update({
                opted_in: true,
                display_name: displayName,
                age_group: ageGroup,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', childUserId);
          } else {
            await supabase.from('leaderboard_entries')
              .insert({
                user_id: childUserId,
                display_name: displayName,
                age_group: ageGroup,
                opted_in: true,
                weekly_coins: 0,
                monthly_coins: 0,
                total_coins: 0,
                modules_completed: 0,
                current_streak: 0,
              });
          }
        } else {
          // Disable leaderboard
          await supabase.from('leaderboard_entries')
            .update({ opted_in: false, updated_at: new Date().toISOString() })
            .eq('user_id', childUserId);
        }
      }

      setSavedMessage('Settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save controls:', err);
      setSavedMessage('Failed to save. Please try again.');
    }
    setSavingControls(false);
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          childName: child.name,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          activityData: activities.slice(0, 10).map(a => ({ topic: a.metadata?.topic || a.action_type, ...a.metadata })),
          subjectData: Object.fromEntries(subjectData.map(s => [s.name, s.pct])),
          standardsData,
          streakDays: child.streak || 12,
        },
      });
      if (error) throw error;
      setReportData(data);
      setActiveTab('report');
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
    setGeneratingReport(false);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !reportData) return;
    printWindow.document.write(`
       <html><head><title>FreeLearner Monthly Report - ${child.name}</title>

      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        h1 { color: #0D7377; } h2 { color: #555; border-bottom: 2px solid #0D7377; padding-bottom: 8px; }
        .stat { display: inline-block; padding: 12px 20px; margin: 4px; background: #f0fdf4; border-radius: 8px; }
        .highlight { background: #f0fdfa; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #0D7377; }
        .bar { height: 12px; background: #e5e7eb; border-radius: 6px; margin: 4px 0; }
        .bar-fill { height: 100%; border-radius: 6px; }
        ul { line-height: 1.8; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>FreeLearner Monthly Progress Report</h1>

      <p><strong>Student:</strong> ${child.name} | <strong>Month:</strong> ${reportData.month} ${reportData.year} | <strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
      <hr/>
      <div>
        <div class="stat"><strong>${reportData.engagement_score || 85}</strong><br/>Engagement Score</div>
        <div class="stat"><strong>${reportData.overall_grade || 'A-'}</strong><br/>Overall Grade</div>
        <div class="stat"><strong>${reportData.streak_days || 12}</strong><br/>Day Streak</div>
        <div class="stat"><strong>${reportData.modules_completed || 25}</strong><br/>Modules Done</div>
      </div>
      <h2>Learning Narrative</h2>
      <p>${(reportData.narrative || '').replace(/\n/g, '</p><p>')}</p>
      <h2>Highlights</h2>
      <ul>${(reportData.highlights || []).map((h: string) => `<li>${h}</li>`).join('')}</ul>
      <h2>Areas for Growth</h2>
      <ul>${(reportData.areas_for_growth || []).map((a: string) => `<li>${a}</li>`).join('')}</ul>
      <h2>Subject Coverage</h2>
      ${subjectData.map(s => `<p>${s.name}: ${s.pct}%<div class="bar"><div class="bar-fill" style="width:${s.pct * 4}%;background:${s.color}"></div></div></p>`).join('')}
      <h2>Standards Compliance</h2>
      <ul>${standardsData.map(s => `<li>${s.standard} (${s.area}): <strong>${s.status === 'met' ? 'Met' : s.status === 'partial' ? 'In Progress' : 'Not Started'}</strong></li>`).join('')}</ul>
      <h2>Recommended Topics for Next Month</h2>
      <ul>${(reportData.recommended_topics || []).map((t: string) => `<li>${t}</li>`).join('')}</ul>
      <hr/><p style="color:#999;font-size:12px">Generated by FreeLearner AI Learning Platform</p>

      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'path_generated': return { path: 'M13 10V3L4 14h7v7l9-11h-7z', color: '#0D7377' };
      case 'module_completed': return { path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: '#22C55E' };
      case 'chat_message': return { path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', color: '#3B82F6' };
      case 'badge_earned': return { path: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', color: '#F59E0B' };
      default: return { path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13', color: '#6B7280' };
    }
  };

  const getActivityLabel = (a: ActivityEntry) => {
    switch (a.action_type) {
      case 'path_generated': return `Started learning about "${a.metadata?.topic || 'a new topic'}"`;
      case 'module_completed': return `Completed "${a.metadata?.module_title || 'a module'}"`;
      case 'chat_message': return 'Had an AI mentor conversation';
      case 'badge_earned': return `Earned the "${a.metadata?.badge || 'new'}" badge`;
      default: return a.action_type.replace(/_/g, ' ');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-xl text-charcoal">Parent Portal</h1>
              <p className="font-body text-xs text-charcoal/40">Monitor your children's learning journey</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={activeChild}
                onChange={(e) => setActiveChild(Number(e.target.value))}
                className="px-4 py-2 rounded-xl border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal/30"
              >
                {children.map((c, i) => (
                  <option key={i} value={i}>{c.name}</option>
                ))}
              </select>
              <button onClick={() => { setCurrentPage('compliance'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors" title="State Compliance">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </button>
              <button onClick={() => { setCurrentPage('progress'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors" title="Learning Progress">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </button>
              <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {[
              { id: 'overview' as const, label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'live' as const, label: 'Live Dashboard', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
              { id: 'activity' as const, label: 'Activity Feed', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
              { id: 'controls' as const, label: 'Parental Controls', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              { id: 'report' as const, label: 'Monthly Report', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-body text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id ? 'text-teal border-teal' : 'text-charcoal/40 border-transparent hover:text-charcoal/60'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={tab.icon}/></svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Child Overview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {children.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveChild(i)}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                activeChild === i ? 'border-teal bg-white shadow-md' : 'border-gray-200 bg-white hover:border-teal/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="font-heading font-bold text-charcoal">{c.name}</p>
                  <p className="font-body text-xs text-charcoal/40">Age {c.age}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F4A261"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
                  <span className="font-body text-xs font-bold text-orange">{c.streak || 0}-day streak</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal rounded-full" style={{ width: `${c.todayProgress}%` }} />
                  </div>
                  <span className="font-body text-xs text-charcoal/40">{c.todayProgress}%</span>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => { setCurrentPage('settings'); window.scrollTo({ top: 0 }); }}
            className="p-5 rounded-2xl border-2 border-dashed border-gray-300 text-center hover:border-teal/30 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="font-body text-xs text-charcoal/40 mt-2">Add Student</span>
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-bold text-lg text-charcoal">Standards Compliance</h3>
                  <span className="px-3 py-1 bg-green-50 text-green-700 font-body text-xs font-bold rounded-full">
                    {standardsData.filter(s => s.status === 'met').length}/{standardsData.length} met
                  </span>
                </div>
                <div className="space-y-3">
                  {standardsData.map((s) => (
                    <div key={s.standard} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        s.status === 'met' ? 'bg-green-100' : s.status === 'partial' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {s.status === 'met' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : s.status === 'partial' ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-body text-sm text-charcoal/80">{s.standard}</span>
                          <span className="font-body text-xs text-charcoal/40">{s.area}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-6">Subject Coverage This Month</h3>
                <div className="space-y-4">
                  {subjectData.map((s) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="font-body text-sm text-charcoal/70 w-28 flex-shrink-0">{s.name}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="font-body text-xs text-charcoal/40 w-10 text-right">{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Alert Center</h3>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <p className="font-heading font-bold text-sm text-green-800">All Clear</p>
                  <p className="font-body text-xs text-green-600 mt-1">No safety alerts. Everything looks great!</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Conversation Starters</h3>
                <div className="space-y-2">
                  {[
                    `Ask ${child.name} about what they learned about today!`,
                    `"What was the coolest fact you discovered?"`,
                    `"Can you teach me something new?"`,
                    `"What do you want to explore tomorrow?"`,
                  ].map((q, i) => (
                    <div key={i} className="p-3 bg-teal-50/50 rounded-xl">
                      <p className="font-body text-sm text-charcoal/70">{q}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={generateReport}
                disabled={generatingReport}
                className="w-full bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-5 text-left hover:shadow-lg transition-all disabled:opacity-70"
              >
                <div className="flex items-center gap-3">
                  {generatingReport ? (
                    <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  )}
                  <div>
                    <p className="font-heading font-bold text-sm text-white">{generatingReport ? 'Generating Report...' : 'Generate Monthly Report'}</p>
                    <p className="font-body text-xs text-white/60">{new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()} · AI-powered PDF</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* LIVE DASHBOARD TAB */}
        {activeTab === 'live' && (
          <LiveDashboard
            childId={child.id}
            childName={child.name}
            parentId={user?.id || ''}
            parentEmail={profile?.email || user?.email || ''}
            parentName={profile?.full_name || ''}
          />
        )}


        {/* ACTIVITY FEED TAB */}
        {activeTab === 'activity' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-bold text-lg text-charcoal">Real-Time Activity Feed</h3>
                  <button onClick={() => child?.id && loadActivity(child.id)} className="font-body text-xs text-teal font-semibold hover:underline">Refresh</button>
                </div>
                {loadingActivity ? (
                  <div className="text-center py-12">
                    <svg className="animate-spin mx-auto mb-4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                    <p className="font-body text-sm text-charcoal/40">Loading activity...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    <p className="font-heading font-bold text-charcoal mb-1">No activity yet</p>
                    <p className="font-body text-sm text-charcoal/40">Activity will appear here as {child.name} uses FreeLearner</p>

                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((a, i) => {
                      const icon = getActivityIcon(a.action_type);
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${icon.color}15` }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={icon.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon.path}/></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-sm text-charcoal/80">{getActivityLabel(a)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {(a.subject_tags || []).map((tag: string) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-charcoal/40 font-body text-[10px] rounded">{tag}</span>
                              ))}
                              <span className="font-body text-xs text-charcoal/30">{timeAgo(a.created_at)}</span>
                            </div>
                          </div>
                          {a.duration_seconds > 0 && (
                            <span className="font-body text-xs text-charcoal/30">{Math.round(a.duration_seconds / 60)}m</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Today's Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-charcoal/60">Time spent</span>
                    <span className="font-heading font-bold text-charcoal">
                      {Math.round(activities.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).reduce((s, a) => s + (a.duration_seconds || 0), 0) / 60) || 0} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-charcoal/60">Activities</span>
                    <span className="font-heading font-bold text-charcoal">
                      {activities.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-charcoal/60">Subjects covered</span>
                    <span className="font-heading font-bold text-charcoal">
                      {new Set(activities.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).flatMap(a => a.subject_tags || [])).size}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button onClick={() => { setCurrentPage('progress'); window.scrollTo({ top: 0 }); }} className="w-full p-3 bg-teal-50 rounded-xl text-left hover:bg-teal-100 transition-all">
                    <p className="font-body text-sm font-semibold text-teal">View Detailed Analytics</p>
                  </button>
                  <button onClick={() => setActiveTab('controls')} className="w-full p-3 bg-orange/5 rounded-xl text-left hover:bg-orange/10 transition-all">
                    <p className="font-body text-sm font-semibold text-orange">Manage Controls</p>
                  </button>
                  <button onClick={generateReport} className="w-full p-3 bg-purple-50 rounded-xl text-left hover:bg-purple-100 transition-all">
                    <p className="font-body text-sm font-semibold text-purple-600">Generate Report</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARENTAL CONTROLS TAB */}
        {activeTab === 'controls' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Time & Content Controls */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h3 className="font-heading font-bold text-xl text-charcoal mb-1">Parental Controls</h3>
              <p className="font-body text-sm text-charcoal/40 mb-6">Set limits and filters for {child.name}'s learning experience</p>

              {/* Daily Time Limit */}
              <div className="mb-8">
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Daily Time Limit</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="15"
                    max="480"
                    step="15"
                    value={controls.daily_time_limit_minutes}
                    onChange={(e) => setControls(prev => ({ ...prev, daily_time_limit_minutes: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal"
                  />
                  <span className="font-heading font-bold text-lg text-charcoal w-24 text-right">
                    {controls.daily_time_limit_minutes >= 60
                      ? `${Math.floor(controls.daily_time_limit_minutes / 60)}h ${controls.daily_time_limit_minutes % 60 > 0 ? `${controls.daily_time_limit_minutes % 60}m` : ''}`
                      : `${controls.daily_time_limit_minutes}m`}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-body text-xs text-charcoal/30">15 min</span>
                  <span className="font-body text-xs text-charcoal/30">8 hours</span>
                </div>
              </div>

              {/* Content Filters */}
              <div className="mb-8">
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Content Filters</label>
                <div className="space-y-3">
                  {[
                    { key: 'block_violence', label: 'Block violent content', desc: 'Filter out references to violence or weapons' },
                    { key: 'block_adult', label: 'Block adult content', desc: 'Filter inappropriate content for children' },
                    { key: 'safe_search', label: 'Safe search mode', desc: 'Extra filtering on all AI responses' },
                  ].map(filter => (
                    <div key={filter.key} className="flex items-center justify-between p-4 bg-cream rounded-xl">
                      <div>
                        <p className="font-body text-sm font-semibold text-charcoal">{filter.label}</p>
                        <p className="font-body text-xs text-charcoal/40">{filter.desc}</p>
                      </div>
                      <button
                        onClick={() => setControls(prev => ({
                          ...prev,
                          content_filters: { ...prev.content_filters, [filter.key]: !prev.content_filters[filter.key as keyof typeof prev.content_filters] }
                        }))}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          controls.content_filters[filter.key as keyof typeof controls.content_filters] ? 'bg-teal' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                          controls.content_filters[filter.key as keyof typeof controls.content_filters] ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blocked Topics */}
              <div>
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Blocked Topics</label>
                <p className="font-body text-xs text-charcoal/40 mb-3">Add specific topics you don't want the AI to discuss</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newBlockedTopic}
                    onChange={(e) => setNewBlockedTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newBlockedTopic.trim()) {
                        setControls(prev => ({ ...prev, blocked_topics: [...prev.blocked_topics, newBlockedTopic.trim()] }));
                        setNewBlockedTopic('');
                      }
                    }}
                    placeholder="Type a topic to block..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 font-body text-sm bg-cream focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button
                    onClick={() => {
                      if (newBlockedTopic.trim()) {
                        setControls(prev => ({ ...prev, blocked_topics: [...prev.blocked_topics, newBlockedTopic.trim()] }));
                        setNewBlockedTopic('');
                      }
                    }}
                    className="px-4 py-2 bg-teal text-white font-body text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {controls.blocked_topics.map((topic, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 font-body text-xs rounded-full">
                      {topic}
                      <button onClick={() => setControls(prev => ({ ...prev, blocked_topics: prev.blocked_topics.filter((_, idx) => idx !== i) }))} className="hover:text-red-900">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── LEADERBOARD & COMPETITIONS ─── */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z"/>
                  <circle cx="12" cy="8" r="6"/>
                </svg>
                <h3 className="font-heading font-bold text-xl text-charcoal">Leaderboard & Competitions</h3>
              </div>
              <p className="font-body text-sm text-charcoal/40 mb-6">Control {child.name}'s participation in the privacy-safe leaderboard</p>

              {/* Privacy notice */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div>
                  <p className="font-body text-sm font-semibold text-blue-800">Privacy-Safe</p>
                  <p className="font-body text-xs text-blue-600">Only the display name you choose is visible. Real names and personal info are never shared. You can disable this at any time.</p>
                </div>
              </div>

              {/* Enable Leaderboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                  <div>
                    <p className="font-body text-sm font-semibold text-charcoal">Enable Leaderboard</p>
                    <p className="font-body text-xs text-charcoal/40">Allow {child.name} to appear on the leaderboard</p>
                  </div>
                  <button
                    onClick={() => setControls(prev => ({ ...prev, leaderboard_enabled: !prev.leaderboard_enabled }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      controls.leaderboard_enabled ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      controls.leaderboard_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                {/* Display Name (only shown when enabled) */}
                {controls.leaderboard_enabled && (
                  <>
                    <div className="p-4 bg-cream rounded-xl">
                      <label className="font-body text-sm font-semibold text-charcoal mb-2 block">Display Name</label>
                      <p className="font-body text-xs text-charcoal/40 mb-3">Choose a privacy-safe alias for the leaderboard. This is what other users will see.</p>
                      <input
                        type="text"
                        value={controls.leaderboard_display_name}
                        onChange={(e) => setControls(prev => ({ ...prev, leaderboard_display_name: e.target.value }))}
                        placeholder={`e.g., ${child.name.charAt(0)}Star, SuperLearner, CoolKid123`}
                        maxLength={20}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                      />
                      <p className="font-body text-[10px] text-charcoal/30 mt-1">
                        {controls.leaderboard_display_name.length}/20 characters
                        {!controls.leaderboard_display_name.trim() && ` · Will default to "${child.name}"`}
                      </p>
                    </div>

                    {/* Competition Toggles */}
                    <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                      <div>
                        <p className="font-body text-sm font-semibold text-charcoal">Weekly Competition</p>
                        <p className="font-body text-xs text-charcoal/40">Participate in weekly leaderboard rankings</p>
                      </div>
                      <button
                        onClick={() => setControls(prev => ({ ...prev, competition_weekly: !prev.competition_weekly }))}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          controls.competition_weekly ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                          controls.competition_weekly ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                      <div>
                        <p className="font-body text-sm font-semibold text-charcoal">Monthly Competition</p>
                        <p className="font-body text-xs text-charcoal/40">Participate in monthly leaderboard rankings</p>
                      </div>
                      <button
                        onClick={() => setControls(prev => ({ ...prev, competition_monthly: !prev.competition_monthly }))}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          controls.competition_monthly ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                          controls.competition_monthly ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <p className="font-body text-xs font-semibold text-amber-800 mb-2">Leaderboard Preview</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-heading font-bold">
                          {(controls.leaderboard_display_name.trim() || child.name).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-body text-sm font-bold text-charcoal">
                            {controls.leaderboard_display_name.trim() || child.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-charcoal/40">
                            <span>Age {child.age <= 8 ? '6-8' : child.age <= 11 ? '9-11' : child.age <= 14 ? '12-14' : '15+'}</span>
                            {controls.competition_weekly && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Weekly</span>}
                            {controls.competition_monthly && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">Monthly</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="space-y-2">
              <button
                onClick={saveControls}
                disabled={savingControls}
                className="w-full py-3 bg-teal hover:bg-teal-dark text-white font-heading font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {savingControls ? 'Saving...' : 'Save All Settings'}
              </button>
              {savedMessage && (
                <p className={`text-center font-body text-sm ${savedMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {savedMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="max-w-3xl mx-auto">
            {!reportData ? (
              <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h3 className="font-heading font-bold text-lg text-charcoal mb-2">No Report Generated Yet</h3>
                <p className="font-body text-sm text-charcoal/40 mb-6">Generate an AI-powered monthly progress report for {child.name}</p>
                <button
                  onClick={generateReport}
                  disabled={generatingReport}
                  className="px-8 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {generatingReport ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-6 lg:p-8 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-heading font-bold text-2xl">Monthly Progress Report</h2>
                      <p className="font-body text-white/60">{child.name} · {reportData.month} {reportData.year}</p>
                    </div>
                    <button onClick={printReport} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-body text-sm font-semibold transition-all flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print / Save PDF
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Engagement', value: reportData.engagement_score || 85 },
                      { label: 'Grade', value: reportData.overall_grade || 'A-' },
                      { label: 'Streak', value: `${reportData.streak_days || 12}d` },
                      { label: 'Modules', value: reportData.modules_completed || 25 },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 bg-white/10 rounded-xl">
                        <p className="font-heading font-bold text-2xl">{s.value}</p>
                        <p className="font-body text-xs text-white/60">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">AI Learning Narrative</h3>
                  <div className="font-body text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{reportData.narrative}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Highlights</h3>
                    <ul className="space-y-2">
                      {(reportData.highlights || []).map((h: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="font-body text-sm text-charcoal/70">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Areas for Growth</h3>
                    <ul className="space-y-2">
                      {(reportData.areas_for_growth || []).map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                          <span className="font-body text-sm text-charcoal/70">{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Recommended Topics for Next Month</h3>
                  <div className="flex flex-wrap gap-2">
                    {(reportData.recommended_topics || []).map((t: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-teal-50 text-teal font-body text-sm font-semibold rounded-full">{t}</span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateReport}
                  disabled={generatingReport}
                  className="w-full py-3 bg-charcoal/5 hover:bg-charcoal/10 text-charcoal font-body font-semibold rounded-xl transition-all"
                >
                  {generatingReport ? 'Regenerating...' : 'Regenerate Report'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;
