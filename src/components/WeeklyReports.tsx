import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const SUBJECT_COLORS: Record<string, string> = {
  'Math': '#8B5CF6', 'Science': '#3B82F6', 'History': '#F59E0B',
  'Social Studies': '#F59E0B', 'ELA': '#10B981', 'Language Arts': '#10B981',
  'Arts': '#EC4899', 'Technology': '#6366F1', 'Reading': '#14B8A6',
  'Writing': '#F97316', 'Music': '#D946EF', 'default': '#6B7280',
};
const PIE_COLORS = ['#0D7377', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981', '#6366F1', '#EF4444'];

const GOAL_TYPE_LABELS: Record<string, { label: string; unit: string; color: string; bg: string }> = {
  time_minutes: { label: 'Learning Time', unit: 'min', color: '#0D7377', bg: 'bg-teal-50' },
  modules_completed: { label: 'Modules Completed', unit: '', color: '#22C55E', bg: 'bg-green-50' },
  subjects_covered: { label: 'Subjects Covered', unit: '', color: '#3B82F6', bg: 'bg-blue-50' },
  streak_days: { label: 'Streak Days', unit: 'd', color: '#F59E0B', bg: 'bg-amber-50' },
  quiz_score_avg: { label: 'Avg Quiz Score', unit: '%', color: '#8B5CF6', bg: 'bg-purple-50' },
};

interface ReportSummary {
  id: string; child_id: string; child_name: string;
  week_start: string; week_end: string; created_at: string;
  summary: any; engagement_score: number; overall_grade: string;
}

interface WeeklyReportsProps {
  childId: string; childName: string; childAge?: number;
  gradeLevel?: string; interests?: string[]; parentId: string;
}

const WeeklyReports: React.FC<WeeklyReportsProps> = ({
  childId, childName, childAge, gradeLevel, interests, parentId,
}) => {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [error, setError] = useState<string | null>(null);

  // Comparison state
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('generate-report', {
        body: { action: 'list-reports', childId, limit: 12 },
      });
      if (err) throw err;
      setReports(data?.reports || []);
    } catch (err: any) {
      console.warn('Failed to load reports:', err);
      setReports([]);
    }
    setLoading(false);
  }, [childId]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const weekStart = selectedWeek === 'current' ? undefined : selectedWeek;
      let weekEnd: string | undefined;
      if (weekStart) {
        const ws = new Date(weekStart);
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        weekEnd = we.toISOString().split('T')[0];
      }
      const { data, error: err } = await supabase.functions.invoke('generate-report', {
        body: { action: 'generate-weekly', childId, childName, childAge, gradeLevel, interests, weekStart, weekEnd },
      });
      if (err) throw err;
      setSelectedReport(data);
      setView('detail');
      setShowComparison(false);
      setComparisonData(null);
      loadReports();
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report. Please try again.');
    }
    setGenerating(false);
  };

  const viewReport = async (reportId: string) => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.functions.invoke('generate-report', {
        body: { action: 'get-report', reportId },
      });
      if (err) throw err;
      setSelectedReport(data);
      setView('detail');
      setShowComparison(false);
      setComparisonData(null);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError('Failed to load report.');
    }
    setLoading(false);
  };

  // ─── LOAD COMPARISON DATA ───
  const loadComparison = async () => {
    if (!selectedReport) return;
    setLoadingComparison(true);
    setComparisonError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('generate-report', {
        body: {
          action: 'compare-weeks',
          currentReportId: selectedReport.report_id,
          childId,
          currentWeekStart: selectedReport.week_start,
        },
      });
      if (err) throw err;
      if (data?.error === 'no_previous_report') {
        setComparisonError(data.message || 'No previous week report found.');
        setComparisonData(null);
      } else {
        setComparisonData(data);
        setComparisonError(null);
      }
    } catch (err: any) {
      console.error('Failed to load comparison:', err);
      setComparisonError('Failed to load comparison data.');
    }
    setLoadingComparison(false);
  };

  const toggleComparison = () => {
    if (!showComparison && !comparisonData) {
      loadComparison();
    }
    setShowComparison(!showComparison);
  };

  const printReport = () => {
    if (!selectedReport) return;
    const r = selectedReport;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const subjectBars = (r.subject_breakdown || []).map((s: any) =>
      `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-weight:600;font-size:14px">${s.subject}</span><span style="color:#666;font-size:12px">${s.activities} activities · ${s.minutes}min · ${s.percentage}%</span></div><div style="height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden"><div style="height:100%;width:${s.percentage}%;background:${SUBJECT_COLORS[s.subject] || SUBJECT_COLORS.default};border-radius:5px"></div></div></div>`
    ).join('');

    // ─── GOAL ACHIEVEMENT SECTION ───
    const goalProgressList = r.goal_progress || [];
    const goalsMet = goalProgressList.filter((g: any) => g.met).length;
    const goalsTotal = goalProgressList.length;
    const goalAchievementHtml = goalsTotal > 0 ? `
      <h2>Goal Achievement</h2>
      <div style="background:#f0f9ff;padding:16px;border-radius:12px;margin-bottom:16px;text-align:center">
        <span style="font-size:28px;font-weight:800;color:${goalsMet === goalsTotal ? '#22C55E' : goalsMet > 0 ? '#F59E0B' : '#EF4444'}">${goalsMet}/${goalsTotal}</span>
        <span style="font-size:14px;color:#666;margin-left:8px">Goals Met This Week</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb">
            <th style="text-align:left;padding:10px 12px;color:#666;font-weight:600">Goal Type</th>
            <th style="text-align:center;padding:10px 12px;color:#666;font-weight:600">Target</th>
            <th style="text-align:center;padding:10px 12px;color:#666;font-weight:600">Actual</th>
            <th style="text-align:center;padding:10px 12px;color:#666;font-weight:600">Completion</th>
            <th style="text-align:center;padding:10px 12px;color:#666;font-weight:600">Status</th>
          </tr>
        </thead>
        <tbody>
          ${goalProgressList.map((g: any) => {
            const cfg = GOAL_TYPE_LABELS[g.goal_type] || { label: g.goal_type, unit: '', color: '#666' };
            const statusColor = g.met ? '#22C55E' : g.completion_pct >= 50 ? '#F59E0B' : '#EF4444';
            const statusLabel = g.met ? 'Met' : g.completion_pct >= 50 ? 'In Progress' : 'Missed';
            return `<tr style="border-bottom:1px solid #f3f4f6">
              <td style="padding:10px 12px;font-weight:600">${cfg.label}</td>
              <td style="text-align:center;padding:10px 12px">${g.target_value}${cfg.unit}</td>
              <td style="text-align:center;padding:10px 12px;font-weight:700;color:${statusColor}">${g.actual_value}${cfg.unit}</td>
              <td style="text-align:center;padding:10px 12px">
                <div style="display:inline-flex;align-items:center;gap:8px">
                  <div style="width:60px;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
                    <div style="height:100%;width:${g.completion_pct}%;background:${statusColor};border-radius:4px"></div>
                  </div>
                  <span>${g.completion_pct}%</span>
                </div>
              </td>
              <td style="text-align:center;padding:10px 12px">
                <span style="display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;background:${g.met ? '#f0fdf4' : '#fefce8'};color:${statusColor}">${statusLabel}</span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${(r.goal_recommendations || []).length > 0 ? `
        <div style="margin-top:16px;padding:14px;background:#eef2ff;border-radius:10px;border-left:4px solid #6366F1">
          <p style="font-weight:700;font-size:12px;color:#6366F1;margin-bottom:8px">AI Goal Recommendations</p>
          <ul style="margin:0;padding-left:20px;font-size:13px;color:#555;line-height:1.8">
            ${(r.goal_recommendations || []).map((rec: string) => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    ` : '';

    // ─── COMPARISON SECTION (when active) ───
    let comparisonHtml = '';
    if (showComparison && comparisonData && !comparisonError) {
      const cd = comparisonData;

      // Delta metrics table
      const deltaMetrics = [
        { key: 'total_minutes', label: 'Learning Time', fmt: (v: number) => `${v}m` },
        { key: 'days_active', label: 'Days Active', fmt: (v: number) => `${v}/7` },
        { key: 'current_streak', label: 'Streak', fmt: (v: number) => `${v}d` },
        { key: 'modules_completed', label: 'Modules', fmt: (v: number) => `${v}` },
        { key: 'avg_quiz_score', label: 'Quiz Avg', fmt: (v: number) => `${v}%` },
      ];

      const deltaRows = deltaMetrics.map(m => {
        const d = cd.deltas?.[m.key];
        if (!d) return '';
        const arrow = d.direction === 'up' ? '&#9650;' : d.direction === 'down' ? '&#9660;' : '&#8212;';
        const color = d.direction === 'up' ? '#22C55E' : d.direction === 'down' ? '#EF4444' : '#9CA3AF';
        return `<tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:8px 12px;font-weight:600;font-size:13px">${m.label}</td>
          <td style="text-align:center;padding:8px 12px;color:#999;font-size:13px">${m.fmt(d.previous)}</td>
          <td style="text-align:center;padding:8px 12px;font-weight:700;font-size:13px">${m.fmt(d.current)}</td>
          <td style="text-align:center;padding:8px 12px">
            <span style="color:${color};font-weight:700;font-size:13px">${arrow} ${d.pctChange !== 0 ? Math.abs(d.pctChange) + '%' : 'Same'}</span>
          </td>
        </tr>`;
      }).join('');

      // Comparison chart as simple table
      const chartRows = (cd.comparisonChart || []).map((d: any) =>
        `<tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:6px 12px;font-size:13px">${d.day}</td>
          <td style="text-align:center;padding:6px 12px;color:#999;font-size:13px">${d.previousWeek}m</td>
          <td style="text-align:center;padding:6px 12px;font-weight:600;font-size:13px">${d.currentWeek}m</td>
          <td style="padding:6px 12px">
            <div style="display:flex;gap:4px;align-items:center">
              <div style="flex:1;height:6px;background:#C7D2FE;border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.min(100, d.previousWeek)}%;background:#A5B4FC;border-radius:3px"></div></div>
              <div style="flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.min(100, d.currentWeek)}%;background:#6366F1;border-radius:3px"></div></div>
            </div>
          </td>
        </tr>`
      ).join('');

      comparisonHtml = `
        <div style="page-break-before:always"></div>
        <h2 style="color:#6366F1;border-bottom-color:#6366F1">Week-over-Week Comparison</h2>
        <p style="font-size:12px;color:#888;margin-bottom:16px">
          ${formatDateRange(cd.previousReport?.week_start, cd.previousReport?.week_end)} vs ${formatDateRange(cd.currentReport?.week_start, cd.currentReport?.week_end)}
        </p>

        <h3 style="font-size:15px;color:#444;margin-top:24px">Metric Changes</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead><tr style="border-bottom:2px solid #e5e7eb">
            <th style="text-align:left;padding:8px 12px;color:#666;font-size:12px">Metric</th>
            <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px">Previous</th>
            <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px">Current</th>
            <th style="text-align:center;padding:8px 12px;color:#666;font-size:12px">Change</th>
          </tr></thead>
          <tbody>${deltaRows}</tbody>
        </table>

        <h3 style="font-size:15px;color:#444;margin-top:24px">Daily Time Comparison</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead><tr style="border-bottom:2px solid #e5e7eb">
            <th style="text-align:left;padding:6px 12px;color:#666;font-size:12px">Day</th>
            <th style="text-align:center;padding:6px 12px;color:#666;font-size:12px">Prev Week</th>
            <th style="text-align:center;padding:6px 12px;color:#666;font-size:12px">This Week</th>
            <th style="padding:6px 12px;color:#666;font-size:12px">Visual</th>
          </tr></thead>
          <tbody>${chartRows}</tbody>
        </table>

        ${(cd.subjectShifts || []).filter((s: any) => s.activityDelta !== 0).length > 0 ? `
          <h3 style="font-size:15px;color:#444;margin-top:24px">Subject Coverage Shifts</h3>
          ${cd.subjectShifts.filter((s: any) => s.activityDelta !== 0).map((s: any) => {
            const changeColor = s.activityDelta > 0 ? '#22C55E' : '#EF4444';
            return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
              <span style="width:100px;font-size:13px;font-weight:600">${s.subject}</span>
              <div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${s.current.percentage || 0}%;background:${SUBJECT_COLORS[s.subject] || '#6B7280'};border-radius:4px"></div>
              </div>
              <span style="color:${changeColor};font-weight:700;font-size:12px;min-width:40px;text-align:right">${s.activityDelta > 0 ? '+' : ''}${s.activityDelta}</span>
            </div>`;
          }).join('')}
        ` : ''}

        ${cd.comparisonNarrative ? `
          <h3 style="font-size:15px;color:#6366F1;margin-top:24px">AI Comparison Analysis</h3>
          <div style="padding:16px;background:#eef2ff;border-radius:10px;border-left:4px solid #6366F1;font-size:13px;color:#444;line-height:1.7;white-space:pre-line">${cd.comparisonNarrative}</div>
        ` : ''}

        ${(cd.goalProgress || []).length > 0 ? `
          <h3 style="font-size:15px;color:#444;margin-top:24px">Goal Achievement (Comparison Week)</h3>
          ${cd.goalProgress.map((g: any) => {
            const cfg = GOAL_TYPE_LABELS[g.goal_type] || { label: g.goal_type, unit: '', color: '#666' };
            return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:10px 14px;background:${g.met ? '#f0fdf4' : '#fefce8'};border-radius:8px;border-left:4px solid ${g.met ? '#22C55E' : '#F59E0B'}">
              <strong style="font-size:13px">${cfg.label}:</strong>
              <span style="font-size:13px">${g.actual_value}${cfg.unit} / ${g.target_value}${cfg.unit}</span>
              <span style="font-size:12px;color:#888">(${g.completion_pct}%)</span>
              <span style="margin-left:auto;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:${g.met ? '#dcfce7' : '#fef9c3'};color:${g.met ? '#166534' : '#92400E'}">${g.met ? 'Met' : 'Missed'}</span>
            </div>`;
          }).join('')}
        ` : ''}
      `;
    }

    // ─── QUIZ SCORES TABLE ───
    const quizHtml = (r.quiz_scores || []).length > 0 ? `
      <h2>Quiz Scores${r.summary?.avg_quiz_score != null ? ` <span style="font-size:14px;color:#666;font-weight:normal">(Avg: ${r.summary.avg_quiz_score}%)</span>` : ''}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead><tr style="border-bottom:2px solid #e5e7eb">
          <th style="text-align:left;padding:8px 12px;color:#666">Topic</th>
          <th style="text-align:center;padding:8px 12px;color:#666">Score</th>
          <th style="text-align:center;padding:8px 12px;color:#666">Percentage</th>
        </tr></thead>
        <tbody>${(r.quiz_scores || []).map((q: any) => {
          const pct = Math.round((q.score / q.total) * 100);
          const pctColor = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';
          return `<tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:8px 12px">${q.topic}</td>
            <td style="text-align:center;padding:8px 12px;font-weight:700">${q.score}/${q.total}</td>
            <td style="text-align:center;padding:8px 12px"><span style="color:${pctColor};font-weight:700">${pct}%</span></td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    ` : '';

    // ─── FOCUS AREAS ───
    const focusHtml = (r.recommended_focus_areas || []).length > 0 ? `
      <h2>AI-Recommended Focus Areas</h2>
      ${(r.recommended_focus_areas || []).map((f: any, i: number) => `
        <div style="padding:14px;background:#eef2ff;border-radius:10px;margin-bottom:10px;border-left:4px solid #6366F1">
          <strong style="font-size:14px;color:#4F46E5">${i + 1}. ${f.subject}</strong>
          <p style="font-size:13px;color:#555;margin:6px 0">${f.reason}</p>
          ${(f.suggested_activities || []).length > 0 ? `<ul style="margin:4px 0 0;padding-left:20px;font-size:12px;color:#666">${f.suggested_activities.map((a: string) => `<li>${a}</li>`).join('')}</ul>` : ''}
        </div>
      `).join('')}
    ` : '';

    printWindow.document.write(`<html><head><title>FreeLearner Weekly Report - ${r.child_name}</title>
      <style>
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#333;line-height:1.6}
        h1{color:#0D7377;margin-bottom:4px}
        h2{color:#444;border-bottom:2px solid #0D7377;padding-bottom:8px;margin-top:32px}
        h3{margin-bottom:12px}
        .stats{display:flex;gap:12px;flex-wrap:wrap;margin:16px 0}
        .stat{flex:1;min-width:120px;padding:16px;background:#f0fdf4;border-radius:12px;text-align:center}
        .stat-value{font-size:24px;font-weight:800;color:#0D7377}
        .stat-label{font-size:11px;color:#666;margin-top:4px}
        .highlight{background:#f0fdfa;padding:12px 16px;border-radius:8px;margin:6px 0;border-left:3px solid #0D7377;font-size:14px}
        .growth{background:#fffbeb;padding:12px 16px;border-radius:8px;margin:6px 0;border-left:3px solid #F59E0B;font-size:14px}
        table{margin-bottom:16px}
        @media print{body{padding:20px}.no-print{display:none}}
      </style></head><body>
      <h1>FreeLearner Weekly Progress Report</h1>
      <p style="color:#666;margin-bottom:24px"><strong>${r.child_name}</strong> · Week of ${formatDateRange(r.week_start, r.week_end)} · Generated ${new Date(r.generated_at).toLocaleDateString()}${showComparison && comparisonData ? ' · <span style="color:#6366F1;font-weight:600">Includes Week-over-Week Comparison</span>' : ''}</p>
      <div class="stats"><div class="stat"><div class="stat-value">${r.summary?.total_hours || 0}h</div><div class="stat-label">Learning Time</div></div><div class="stat"><div class="stat-value">${r.summary?.days_active || 0}/7</div><div class="stat-label">Days Active</div></div><div class="stat"><div class="stat-value">${r.summary?.current_streak || 0}</div><div class="stat-label">Day Streak</div></div><div class="stat"><div class="stat-value">${r.summary?.modules_completed || 0}</div><div class="stat-label">Modules Done</div></div><div class="stat"><div class="stat-value">${r.engagement_score || 0}</div><div class="stat-label">Engagement</div></div><div class="stat"><div class="stat-value">${r.overall_grade || '-'}</div><div class="stat-label">Grade</div></div></div>
      ${r.celebration_moment ? `<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:16px;border-radius:12px;text-align:center;margin:20px 0"><strong style="color:#92400E">This Week's Celebration:</strong> ${r.celebration_moment}</div>` : ''}
      <h2>Learning Narrative</h2><div style="font-size:14px;color:#444">${(r.narrative || '').replace(/\n/g, '<br/><br/>')}</div>
      <h2>Highlights</h2>${(r.highlights || []).map((h: string) => `<div class="highlight">${h}</div>`).join('')}
      <h2>Areas for Growth</h2>${(r.areas_for_growth || []).map((a: string) => `<div class="growth">${a}</div>`).join('')}
      <h2>Subject Coverage</h2>${subjectBars}
      ${goalAchievementHtml}
      ${quizHtml}
      ${focusHtml}
      ${(r.recommended_topics || []).length > 0 ? `<h2>Recommended Topics</h2><div style="display:flex;flex-wrap:wrap;gap:8px">${(r.recommended_topics || []).map((t: string) => `<span style="display:inline-block;padding:6px 16px;background:#f0fdfa;color:#0D7377;border-radius:20px;font-size:13px;font-weight:600">${t}</span>`).join('')}</div>` : ''}
      ${(r.parent_tips || []).length > 0 ? `<h2>Tips for Parents</h2><ol style="font-size:13px;color:#555;line-height:2">${r.parent_tips.map((t: string) => `<li>${t}</li>`).join('')}</ol>` : ''}
      ${comparisonHtml}
      <hr style="margin-top:40px;border:none;border-top:1px solid #e5e7eb"/><p style="color:#999;font-size:11px;text-align:center;margin-top:16px">Generated by FreeLearner AI Learning Platform · ${new Date().toLocaleDateString()}</p>
      </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };


  const getWeekOptions = () => {
    const options = [{ value: 'current', label: 'This Week' }];
    const now = new Date();
    for (let i = 1; i <= 8; i++) {
      const ws = new Date(now);
      ws.setDate(ws.getDate() - (ws.getDay() + i * 7));
      const we = new Date(ws);
      we.setDate(we.getDate() + 6);
      options.push({
        value: ws.toISOString().split('T')[0],
        label: `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      });
    }
    return options;
  };

  // ─── DELTA INDICATOR COMPONENT ───
  const DeltaIndicator = ({ delta, suffix = '', invert = false }: { delta: any; suffix?: string; invert?: boolean }) => {
    if (!delta) return null;
    const isPositive = invert ? delta.direction === 'down' : delta.direction === 'up';
    const isNegative = invert ? delta.direction === 'up' : delta.direction === 'down';
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
        isPositive ? 'bg-green-50 text-green-700' :
        isNegative ? 'bg-red-50 text-red-600' :
        'bg-gray-50 text-gray-500'
      }`}>
        {delta.direction === 'up' ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
        ) : delta.direction === 'down' ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        )}
        {delta.pctChange !== 0 ? `${Math.abs(delta.pctChange)}%${suffix}` : 'Same'}
      </div>
    );
  };

  // ─── LIST VIEW ───
  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-teal to-teal-dark rounded-2xl p-6 lg:p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-xl lg:text-2xl mb-1">Weekly Progress Reports</h2>
              <p className="font-body text-sm text-white/70">AI-powered reports tracking {childName}'s standards, time, topics, scores, streaks, and focus areas</p>
            </div>
            <div className="flex items-center gap-3">
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/15 text-white font-body text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer">
                {getWeekOptions().map(opt => (<option key={opt.value} value={opt.value} className="text-charcoal">{opt.label}</option>))}
              </select>
              <button onClick={generateReport} disabled={generating} className="px-6 py-2.5 bg-white text-teal font-heading font-bold text-sm rounded-xl hover:bg-white/90 transition-all disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
                {generating ? (
                  <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>Generating...</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>Generate Report</>
                )}
              </button>
            </div>
          </div>
          {error && <div className="mt-3 px-4 py-2 bg-red-500/20 border border-red-300/30 rounded-xl"><p className="font-body text-sm text-white">{error}</p></div>}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Reports Generated', value: reports.length, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-teal-50 text-teal' },
            { label: 'Latest Grade', value: reports[0]?.overall_grade || '-', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138', color: 'bg-green-50 text-green-600' },
            { label: 'Avg Engagement', value: reports.length > 0 ? Math.round(reports.reduce((s, r) => s + (r.engagement_score || 0), 0) / reports.length) : '-', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'bg-purple-50 text-purple-600' },
            { label: 'Weeks Tracked', value: reports.length > 0 ? `${reports.length} weeks` : 'Start tracking', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-orange-50 text-orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={stat.icon}/></svg>
              </div>
              <p className="font-heading font-bold text-2xl text-charcoal">{stat.value}</p>
              <p className="font-body text-xs text-charcoal/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-charcoal">Past Reports</h3>
            <button onClick={loadReports} className="font-body text-xs text-teal font-semibold hover:underline">Refresh</button>
          </div>
          {loading ? (
            <div className="text-center py-16">
              <svg className="animate-spin mx-auto mb-4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p className="font-body text-sm text-charcoal/40">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <h4 className="font-heading font-bold text-charcoal mb-1">No Reports Yet</h4>
              <p className="font-body text-sm text-charcoal/40 mb-4">Generate your first weekly progress report for {childName}</p>
              <button onClick={generateReport} disabled={generating} className="px-6 py-2.5 bg-teal text-white font-heading font-bold text-sm rounded-xl hover:bg-teal-dark transition-all disabled:opacity-60">
                {generating ? 'Generating...' : 'Generate First Report'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reports.map((report) => (
                <button key={report.id} onClick={() => viewReport(report.id)} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-cream/50 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm text-charcoal">Week of {formatDateRange(report.week_start, report.week_end)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {report.summary && (
                        <>
                          <span className="font-body text-xs text-charcoal/40">{report.summary.total_hours || 0}h learning</span>
                          <span className="font-body text-xs text-charcoal/40">{report.summary.modules_completed || 0} modules</span>
                          <span className="font-body text-xs text-charcoal/40">{report.summary.days_active || 0}/7 days</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {report.engagement_score && (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${report.engagement_score >= 80 ? 'bg-green-100 text-green-700' : report.engagement_score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{report.engagement_score}</div>
                    )}
                    {report.overall_grade && (
                      <span className={`px-3 py-1 rounded-lg font-heading font-bold text-sm ${report.overall_grade.startsWith('A') ? 'bg-green-50 text-green-700' : report.overall_grade.startsWith('B') ? 'bg-blue-50 text-blue-700' : report.overall_grade.startsWith('C') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{report.overall_grade}</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW ───
  const r = selectedReport;
  if (!r) return <div className="text-center py-16"><p className="font-body text-sm text-charcoal/40">Loading report...</p></div>;

  return (
    <div className="space-y-6">
      {/* Back + Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => { setView('list'); setSelectedReport(null); setShowComparison(false); setComparisonData(null); }} className="flex items-center gap-2 font-body text-sm text-charcoal/60 hover:text-charcoal transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Reports
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {/* COMPARE TOGGLE */}
          <button
            onClick={toggleComparison}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all ${
              showComparison
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            {showComparison ? 'Hide Comparison' : 'Compare with Previous Week'}
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-body text-sm font-semibold text-charcoal hover:bg-gray-50 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print / Save PDF
          </button>
          <button onClick={generateReport} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-xl font-body text-sm font-semibold hover:bg-teal-dark transition-all disabled:opacity-60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {generating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-gradient-to-br from-teal to-teal-dark rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="font-body text-xs text-white/50 uppercase tracking-wider mb-1">Weekly Progress Report</p>
            <h2 className="font-heading font-bold text-2xl lg:text-3xl">{r.child_name}</h2>
            <p className="font-body text-sm text-white/60 mt-1">
              Week of {formatDateRange(r.week_start, r.week_end)}
              {r.child_age && ` · Age ${r.child_age}`}
              {r.grade_level && ` · Grade ${r.grade_level}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-[10px] text-white/40">Generated</p>
            <p className="font-body text-xs text-white/60">{new Date(r.generated_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Learning Time', value: `${r.summary?.total_hours || 0}h`, key: 'total_hours' },
            { label: 'Days Active', value: `${r.summary?.days_active || 0}/7`, key: 'days_active' },
            { label: 'Streak', value: `${r.summary?.current_streak || 0}d`, key: 'current_streak' },
            { label: 'Modules', value: r.summary?.modules_completed || 0, key: 'modules_completed' },
            { label: 'Engagement', value: r.engagement_score || 0, key: 'engagement_score' },
            { label: 'Grade', value: r.overall_grade || '-', key: null },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 bg-white/10 rounded-xl">
              <p className="font-heading font-bold text-xl lg:text-2xl">{stat.value}</p>
              <p className="font-body text-[10px] text-white/50">{stat.label}</p>
              {showComparison && comparisonData?.deltas && stat.key && comparisonData.deltas[stat.key] && (
                <div className="mt-1">
                  <DeltaIndicator delta={comparisonData.deltas[stat.key]} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* WEEK-OVER-WEEK COMPARISON PANEL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showComparison && (
        <div className="space-y-6">
          {loadingComparison ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-indigo-100 text-center">
              <svg className="animate-spin mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p className="font-body text-sm text-charcoal/40">Loading comparison data and generating AI analysis...</p>
            </div>
          ) : comparisonError ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-amber-200 text-center">
              <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <h4 className="font-heading font-bold text-charcoal mb-1">No Previous Week Data</h4>
              <p className="font-body text-sm text-charcoal/40">{comparisonError}</p>
              <p className="font-body text-xs text-charcoal/30 mt-2">Generate a report for the previous week first, then compare.</p>
            </div>
          ) : comparisonData ? (
            <>
              {/* Comparison Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-charcoal">Week-over-Week Comparison</h3>
                    <p className="font-body text-xs text-charcoal/40">
                      {formatDateRange(comparisonData.previousReport?.week_start, comparisonData.previousReport?.week_end)} vs {formatDateRange(comparisonData.currentReport?.week_start, comparisonData.currentReport?.week_end)}
                    </p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-600 font-body text-[10px] font-bold rounded">AI Analyzed</span>
                </div>
              </div>

              {/* Delta Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { key: 'total_minutes', label: 'Learning Time', fmt: (v: number) => `${v}m` },
                  { key: 'days_active', label: 'Days Active', fmt: (v: number) => `${v}/7` },
                  { key: 'current_streak', label: 'Streak', fmt: (v: number) => `${v}d` },
                  { key: 'modules_completed', label: 'Modules', fmt: (v: number) => `${v}` },
                  { key: 'avg_quiz_score', label: 'Quiz Avg', fmt: (v: number) => `${v}%` },
                ].map(metric => {
                  const delta = comparisonData.deltas?.[metric.key];
                  if (!delta) return null;
                  return (
                    <div key={metric.key} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-wider mb-2">{metric.label}</p>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="font-body text-xs text-charcoal/30">Prev: {metric.fmt(delta.previous)}</p>
                          <p className="font-heading font-bold text-lg text-charcoal">Now: {metric.fmt(delta.current)}</p>
                        </div>
                        <DeltaIndicator delta={delta} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Chart Overlay */}
              {(comparisonData.comparisonChart || []).length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                    Daily Time Comparison
                  </h3>
                  <p className="font-body text-xs text-charcoal/40 mb-4">Side-by-side daily learning minutes for both weeks</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData.comparisonChart} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9CA3AF' } }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="previousWeek" name="Previous Week" fill="#C7D2FE" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="currentWeek" name="This Week" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Subject Coverage Shifts */}
              {(comparisonData.subjectShifts || []).length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    Subject Coverage Shifts
                  </h3>
                  <div className="space-y-3">
                    {comparisonData.subjectShifts.map((shift: any) => (
                      <div key={shift.subject} className="flex items-center gap-3">
                        <span className="font-body text-sm text-charcoal/70 w-28 flex-shrink-0">{shift.subject}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                            <div className="absolute inset-y-0 left-0 bg-indigo-200 rounded-full" style={{ width: `${shift.previous.percentage || 0}%` }} />
                            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${shift.current.percentage || 0}%`, backgroundColor: SUBJECT_COLORS[shift.subject] || SUBJECT_COLORS.default }} />
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold min-w-[60px] justify-center ${
                          shift.activityDelta > 0 ? 'bg-green-50 text-green-700' :
                          shift.activityDelta < 0 ? 'bg-red-50 text-red-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {shift.activityDelta > 0 ? '+' : ''}{shift.activityDelta}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standards Progression */}
              {(comparisonData.standardsProgression || []).some((a: any) => a.changes.some((c: any) => c.improved || c.regressed)) && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Standards Progression
                  </h3>
                  <div className="space-y-4">
                    {comparisonData.standardsProgression.filter((area: any) => area.changes.some((c: any) => c.improved || c.regressed)).map((area: any) => (
                      <div key={area.area}>
                        <p className="font-heading font-bold text-sm text-charcoal mb-2">{area.area}</p>
                        <div className="space-y-1.5">
                          {area.changes.filter((c: any) => c.improved || c.regressed).map((change: any) => (
                            <div key={change.standard} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${change.improved ? 'bg-green-50' : 'bg-red-50'}`}>
                              {change.improved ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                              )}
                              <span className="font-body text-xs text-charcoal/70 flex-1">{change.standard}</span>
                              <span className="font-body text-[10px] text-charcoal/40">
                                {change.previousStatus.replace('_', ' ')} → {change.currentStatus.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Comparison Narrative */}
              {comparisonData.comparisonNarrative && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    </div>
                    <h3 className="font-heading font-bold text-lg text-charcoal">AI Comparison Analysis</h3>
                    <span className="ml-auto px-2 py-0.5 bg-indigo-50 text-indigo-600 font-body text-[10px] font-bold rounded">AI Generated</span>
                  </div>
                  <div className="font-body text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{comparisonData.comparisonNarrative}</div>
                </div>
              )}

              {/* Goal Progress in Comparison */}
              {(comparisonData.goalProgress || []).length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    Goal Achievement (Comparison Week)
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {comparisonData.goalProgress.map((goal: any) => {
                      const cfg = GOAL_TYPE_LABELS[goal.goal_type] || { label: goal.goal_type, unit: '', color: '#666', bg: 'bg-gray-50' };
                      return (
                        <div key={goal.id} className={`p-4 rounded-xl border ${goal.met ? 'border-green-200 bg-green-50/50' : 'border-gray-100'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-body text-sm font-semibold text-charcoal">{cfg.label}</span>
                            {goal.met ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 font-body text-[10px] font-bold rounded">Met</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-body text-[10px] font-bold rounded">Missed</span>
                            )}
                          </div>
                          <div className="flex items-end justify-between mb-1.5">
                            <span className="font-heading font-bold text-lg" style={{ color: goal.met ? '#22C55E' : cfg.color }}>
                              {goal.actual_value}{cfg.unit}
                            </span>
                            <span className="font-body text-xs text-charcoal/40">of {goal.target_value}{cfg.unit}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${goal.met ? 'bg-green-500' : ''}`} style={{ width: `${goal.completion_pct}%`, backgroundColor: goal.met ? undefined : cfg.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GOAL PROGRESS SECTION (from report data) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {(r.goal_progress || []).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
            </div>
            <h3 className="font-heading font-bold text-lg text-charcoal">Weekly Goal Progress</h3>
            <span className="ml-auto flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg font-body text-xs font-bold ${
                r.goal_progress.every((g: any) => g.met) ? 'bg-green-50 text-green-700' :
                r.goal_progress.some((g: any) => g.met) ? 'bg-amber-50 text-amber-700' :
                'bg-gray-50 text-gray-500'
              }`}>
                {r.goal_progress.filter((g: any) => g.met).length}/{r.goal_progress.length} Goals Met
              </span>
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {r.goal_progress.map((goal: any, i: number) => {
              const cfg = GOAL_TYPE_LABELS[goal.goal_type] || { label: goal.goal_type, unit: '', color: '#666', bg: 'bg-gray-50' };
              return (
                <div key={i} className={`p-4 rounded-xl border-2 ${goal.met ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm text-charcoal">{cfg.label}</p>
                      <p className="font-body text-[10px] text-charcoal/30">{goal.met ? 'Goal achieved!' : `${goal.completion_pct}% complete`}</p>
                    </div>
                    {goal.met && (
                      <svg className="ml-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="font-heading font-bold text-2xl" style={{ color: goal.met ? '#22C55E' : cfg.color }}>
                      {goal.actual_value}{cfg.unit}
                    </span>
                    <span className="font-body text-xs text-charcoal/40">target: {goal.target_value}{cfg.unit}</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${goal.met ? 'bg-green-500' : ''}`} style={{ width: `${goal.completion_pct}%`, backgroundColor: goal.met ? undefined : cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Goal Recommendations */}
          {(r.goal_recommendations || []).length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <p className="font-body text-xs font-semibold text-indigo-600 mb-2">AI Goal Recommendations</p>
              <div className="space-y-1">
                {r.goal_recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><polyline points="9 18 15 12 9 6"/></svg>
                    <span className="font-body text-xs text-charcoal/60">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Celebration Moment */}
      {r.celebration_moment && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
          </div>
          <div>
            <p className="font-heading font-bold text-sm text-amber-900">This Week's Celebration</p>
            <p className="font-body text-sm text-amber-700">{r.celebration_moment}</p>
          </div>
        </div>
      )}

      {/* AI Narrative */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          </div>
          <h3 className="font-heading font-bold text-lg text-charcoal">Learning Narrative</h3>
          <span className="ml-auto px-2 py-0.5 bg-purple-50 text-purple-600 font-body text-[10px] font-bold rounded">AI Generated</span>
        </div>
        <div className="font-body text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">{r.narrative}</div>
      </div>

      {/* Highlights & Growth */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Highlights
          </h3>
          <div className="space-y-2">
            {(r.highlights || []).map((h: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-green-50/50 rounded-xl">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="font-body text-sm text-charcoal/70">{h}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            Areas for Growth
          </h3>
          <div className="space-y-2">
            {(r.areas_for_growth || []).map((a: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-amber-50/50 rounded-xl">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span className="font-body text-sm text-charcoal/70">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Spent Learning */}
      {(r.daily_time || []).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Time Spent Learning
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.daily_time}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9CA3AF' } }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: number) => [`${value} min`, 'Time']} />
                <Bar dataKey="minutes" fill="#0D7377" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Subject Coverage & Topics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            Subject Coverage
          </h3>
          {(r.subject_breakdown || []).length > 0 ? (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={r.subject_breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="activities" nameKey="subject">
                      {(r.subject_breakdown || []).map((_: any, i: number) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {(r.subject_breakdown || []).map((s: any, i: number) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="font-body text-sm text-charcoal/70">{s.subject}</span>
                      </div>
                      <span className="font-body text-xs text-charcoal/40">{s.activities} activities · {s.minutes}min</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.percentage}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="font-body text-sm text-charcoal/40 text-center py-8">No subject data this week</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            Topics Explored
            <span className="ml-auto font-body text-xs text-charcoal/40 font-normal">{(r.topics_explored || []).length} topics</span>
          </h3>
          {(r.topics_explored || []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(r.topics_explored || []).map((topic: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 font-body text-xs font-semibold rounded-full">{topic}</span>
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-charcoal/40 text-center py-8">No topics recorded this week</p>
          )}
        </div>
      </div>

      {/* Quiz Scores */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/><path d="M9 14l2 2 4-4"/></svg>
          Quiz Scores
          {r.summary?.avg_quiz_score != null && (
            <span className={`ml-auto px-3 py-1 rounded-lg font-body text-xs font-bold ${r.summary.avg_quiz_score >= 80 ? 'bg-green-50 text-green-700' : r.summary.avg_quiz_score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>Avg: {r.summary.avg_quiz_score}%</span>
          )}
        </h3>
        {(r.quiz_scores || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className="text-left py-3 px-4 font-body text-xs font-semibold text-charcoal/40 uppercase">Topic</th><th className="text-center py-3 px-4 font-body text-xs font-semibold text-charcoal/40 uppercase">Score</th><th className="text-center py-3 px-4 font-body text-xs font-semibold text-charcoal/40 uppercase">Percentage</th><th className="text-right py-3 px-4 font-body text-xs font-semibold text-charcoal/40 uppercase">Date</th></tr></thead>
              <tbody>
                {(r.quiz_scores || []).map((q: any, i: number) => {
                  const pct = Math.round((q.score / q.total) * 100);
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-cream/30 transition-colors">
                      <td className="py-3 px-4 font-body text-sm text-charcoal/80">{q.topic}</td>
                      <td className="py-3 px-4 text-center font-heading font-bold text-sm text-charcoal">{q.score}/{q.total}</td>
                      <td className="py-3 px-4"><div className="flex items-center justify-center gap-2"><div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div><span className="font-body text-xs text-charcoal/40">{pct}%</span></div></td>
                      <td className="py-3 px-4 text-right font-body text-xs text-charcoal/40">{new Date(q.date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto mb-3" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <p className="font-body text-sm text-charcoal/40">No quiz scores recorded this week</p>
          </div>
        )}
      </div>

      {/* Standards Coverage */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Standards Covered Per Subject
        </h3>
        <p className="font-body text-xs text-charcoal/40 mb-5">Based on learning activities and topics explored this week</p>
        <div className="grid md:grid-cols-2 gap-6">
          {(r.standards_coverage || []).map((area: any) => (
            <div key={area.area} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-bold text-sm text-charcoal">{area.area}</h4>
                <span className="font-body text-xs text-charcoal/40">{area.activitiesCount} activities</span>
              </div>
              <div className="space-y-2">
                {(area.standards || []).map((std: any) => (
                  <div key={std.standard} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${std.status === 'met' ? 'bg-green-100' : std.status === 'partial' ? 'bg-amber-100' : std.status === 'started' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {std.status === 'met' ? (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>) : std.status === 'partial' ? (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>) : std.status === 'started' ? (<div className="w-2 h-2 bg-blue-400 rounded-full" />) : (<div className="w-2 h-2 bg-gray-300 rounded-full" />)}
                    </div>
                    <span className="font-body text-xs text-charcoal/70 flex-1">{std.standard}</span>
                    <span className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded ${std.status === 'met' ? 'bg-green-50 text-green-600' : std.status === 'partial' ? 'bg-amber-50 text-amber-600' : std.status === 'started' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                      {std.status === 'met' ? 'Met' : std.status === 'partial' ? 'In Progress' : std.status === 'started' ? 'Started' : 'Not Started'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
          {[{ label: 'Met', color: 'bg-green-400' }, { label: 'In Progress', color: 'bg-amber-400' }, { label: 'Started', color: 'bg-blue-400' }, { label: 'Not Started', color: 'bg-gray-300' }].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
              <span className="font-body text-xs text-charcoal/40">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#F4A261"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
          Streak History
          <span className="ml-auto flex items-center gap-1">
            <span className="font-heading font-bold text-xl text-orange">{r.summary?.current_streak || 0}</span>
            <span className="font-body text-xs text-charcoal/40">day streak</span>
          </span>
        </h3>
        <p className="font-body text-xs text-charcoal/40 mb-4">Last 28 days of learning activity</p>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-body text-[10px] text-charcoal/30 font-semibold pb-1">{day}</div>
          ))}
          {(r.streak_calendar || []).length > 0 && (() => {
            const firstDay = new Date(r.streak_calendar[0].date).getDay();
            const emptyCells = [];
            for (let i = 0; i < firstDay; i++) emptyCells.push(<div key={`empty-${i}`} />);
            return emptyCells;
          })()}
          {(r.streak_calendar || []).map((d: any) => (
            <div key={d.date} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-body transition-all ${d.active ? 'bg-gradient-to-br from-teal to-teal-dark text-white font-bold shadow-sm' : 'bg-gray-50 text-gray-400'}`} title={`${new Date(d.date).toLocaleDateString()} - ${d.active ? 'Active' : 'Inactive'}`}>
              {new Date(d.date).getDate()}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-gradient-to-br from-teal to-teal-dark" /><span className="font-body text-xs text-charcoal/40">Active day</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" /><span className="font-body text-xs text-charcoal/40">Inactive day</span></div>
          <span className="ml-auto font-body text-xs text-charcoal/30">{(r.streak_calendar || []).filter((d: any) => d.active).length}/28 days active</span>
        </div>
      </div>

      {/* AI Recommended Focus Areas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-heading font-bold text-lg text-charcoal mb-1 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          AI-Recommended Focus Areas
          <span className="ml-auto px-2 py-0.5 bg-indigo-50 text-indigo-600 font-body text-[10px] font-bold rounded">AI Powered</span>
        </h3>
        <p className="font-body text-xs text-charcoal/40 mb-5">Personalized recommendations based on this week's learning data</p>
        {(r.recommended_focus_areas || []).length > 0 ? (
          <div className="space-y-4">
            {(r.recommended_focus_areas || []).map((focus: any, i: number) => (
              <div key={i} className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><span className="font-heading font-bold text-sm text-indigo-600">{i + 1}</span></div>
                  <h4 className="font-heading font-bold text-sm text-charcoal">{focus.subject}</h4>
                </div>
                <p className="font-body text-sm text-charcoal/60 mb-3">{focus.reason}</p>
                {(focus.suggested_activities || []).length > 0 && (
                  <div>
                    <p className="font-body text-xs font-semibold text-indigo-600 mb-2">Suggested Activities:</p>
                    <div className="space-y-1">
                      {focus.suggested_activities.map((activity: string, j: number) => (
                        <div key={j} className="flex items-center gap-2">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                          <span className="font-body text-xs text-charcoal/60">{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-body text-sm text-charcoal/40 text-center py-6">No specific focus areas identified this week</p>
        )}
      </div>

      {/* Recommended Topics + Parent Tips */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            Recommended Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {(r.recommended_topics || []).map((topic: string, i: number) => (
              <span key={i} className="px-4 py-2 bg-teal-50 text-teal font-body text-sm font-semibold rounded-full">{topic}</span>
            ))}
          </div>
        </div>
        {(r.parent_tips || []).length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-heading font-bold text-lg text-charcoal mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Tips for Parents
            </h3>
            <div className="space-y-3">
              {r.parent_tips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="font-heading font-bold text-xs text-amber-700">{i + 1}</span></div>
                  <span className="font-body text-sm text-charcoal/70">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button onClick={() => { setView('list'); setSelectedReport(null); setShowComparison(false); setComparisonData(null); }} className="font-body text-sm text-charcoal/40 hover:text-charcoal transition-colors">Back to all reports</button>
        <div className="flex items-center gap-3">
          <button onClick={printReport} className="px-5 py-2.5 bg-charcoal/5 hover:bg-charcoal/10 text-charcoal font-body text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return 'Unknown';
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  if (sMonth === eMonth) return `${sMonth} ${s.getDate()} - ${e.getDate()}, ${s.getFullYear()}`;
  return `${sMonth} ${s.getDate()} - ${eMonth} ${e.getDate()}, ${s.getFullYear()}`;
}

export default WeeklyReports;
