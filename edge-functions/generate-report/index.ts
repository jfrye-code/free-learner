// ═══════════════════════════════════════════════════════════════
//  generate-report — Parent Portal Report Engine
//  Handles 11 action types: list-reports, generate-weekly,
//  get-report, compare-weeks, list-goals, upsert-goal,
//  delete-goal, suggest-goals, goal-history, family-overview
//  DEPLOY: Copy to supabase/functions/generate-report/index.ts
// ═══════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/db.ts';
import { callOpenAI, parseJSON } from '../_shared/openai.ts';

function getCurrentWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const day = now.getDay();
  const ws = new Date(now);
  ws.setDate(ws.getDate() - day);
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  return {
    weekStart: ws.toISOString().split('T')[0],
    weekEnd: we.toISOString().split('T')[0],
  };
}

function getDayName(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

// ─── LOAD WEEK DATA ───
async function loadWeekData(db: any, childId: string, weekStart: string, weekEnd: string) {
  const wsISO = `${weekStart}T00:00:00.000Z`;
  const weISO = `${weekEnd}T23:59:59.999Z`;

  const [
    { data: activity },
    { data: progress },
    { data: sessions },
    { data: paths },
    { data: currency },
    { data: quizzes },
    { data: mastery },
    { data: goals },
  ] = await Promise.all([
    db.from('activity_log').select('*').eq('user_id', childId).gte('created_at', wsISO).lte('created_at', weISO).order('created_at'),
    db.from('learning_progress').select('*').eq('user_id', childId).gte('created_at', wsISO).lte('created_at', weISO),
    db.from('learning_sessions').select('*').eq('user_id', childId).gte('created_at', wsISO).lte('created_at', weISO),
    db.from('learning_paths').select('*').eq('user_id', childId).gte('created_at', wsISO).lte('created_at', weISO),
    db.from('student_currency').select('*').eq('user_id', childId).maybeSingle(),
    db.from('quiz_results').select('*').eq('user_id', childId).gte('created_at', wsISO).lte('created_at', weISO).catch(() => ({ data: [] })),
    db.from('student_mastery_records').select('*').eq('student_id', childId),
    db.from('weekly_goals').select('*').eq('child_id', childId).eq('week_start', weekStart),
  ]);

  return { activity: activity || [], progress: progress || [], sessions: sessions || [], paths: paths || [], currency, quizzes: quizzes || [], mastery: mastery || [], goals: goals || [] };
}

// ─── COMPUTE REPORT DATA ───
function computeReportData(data: any, weekStart: string, weekEnd: string) {
  const { activity, progress, sessions, paths, currency, quizzes, mastery, goals } = data;

  // Daily time
  const dailyMinutes: Record<string, number> = {};
  const ws = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    dailyMinutes[d.toISOString().split('T')[0]] = 0;
  }
  for (const s of sessions) {
    const day = s.created_at?.split('T')[0];
    if (day && dailyMinutes[day] !== undefined) {
      dailyMinutes[day] += s.elapsed_minutes || 0;
    }
  }
  for (const a of activity) {
    const day = a.created_at?.split('T')[0];
    if (day && dailyMinutes[day] !== undefined) {
      dailyMinutes[day] += Math.round((a.duration_seconds || 0) / 60);
    }
  }

  const dailyTime = Object.entries(dailyMinutes).map(([date, minutes]) => ({
    day: getDayName(date),
    date,
    minutes: Math.round(minutes),
  }));

  const totalMinutes = Object.values(dailyMinutes).reduce((s, v) => s + v, 0);
  const daysActive = Object.values(dailyMinutes).filter(v => v > 0).length;
  const modulesCompleted = progress.filter((p: any) => p.status === 'completed').length;

  // Subject breakdown
  const subjectCounts: Record<string, { activities: number; minutes: number }> = {};
  for (const a of activity) {
    for (const tag of (a.subject_tags || [])) {
      if (!subjectCounts[tag]) subjectCounts[tag] = { activities: 0, minutes: 0 };
      subjectCounts[tag].activities++;
      subjectCounts[tag].minutes += Math.round((a.duration_seconds || 0) / 60);
    }
  }
  const totalActivities = Math.max(1, Object.values(subjectCounts).reduce((s, v) => s + v.activities, 0));
  const subjectBreakdown = Object.entries(subjectCounts)
    .map(([subject, data]) => ({
      subject,
      activities: data.activities,
      minutes: data.minutes,
      percentage: Math.round((data.activities / totalActivities) * 100),
    }))
    .sort((a, b) => b.activities - a.activities);

  // Topics explored
  const topicsExplored = [...new Set(paths.map((p: any) => p.topic).filter(Boolean))];

  // Quiz scores
  const quizScores = quizzes.map((q: any) => ({
    topic: q.topic || 'General',
    score: q.score || 0,
    total: q.total || 10,
    date: q.created_at,
  }));
  const avgQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((s: number, q: any) => s + (q.score / q.total) * 100, 0) / quizScores.length)
    : null;

  // Streak
  const currentStreak = currency?.current_streak || 0;

  // Streak calendar (last 28 days)
  const streakCalendar: any[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isActive = dailyMinutes[dateStr] > 0 || activity.some((a: any) => a.created_at?.startsWith(dateStr));
    streakCalendar.push({ date: dateStr, active: isActive });
  }

  // Goal progress
  const goalProgress = goals.map((g: any) => {
    let actualValue = 0;
    switch (g.goal_type) {
      case 'time_minutes': actualValue = totalMinutes; break;
      case 'modules_completed': actualValue = modulesCompleted; break;
      case 'subjects_covered': actualValue = Object.keys(subjectCounts).length; break;
      case 'streak_days': actualValue = Math.min(daysActive, currentStreak); break;
      case 'quiz_score_avg': actualValue = avgQuizScore || 0; break;
    }
    const completionPct = g.target_value > 0 ? Math.min(100, Math.round((actualValue / g.target_value) * 100)) : 0;
    return {
      id: g.id,
      goal_type: g.goal_type,
      target_value: g.target_value,
      actual_value: actualValue,
      completion_pct: completionPct,
      met: actualValue >= g.target_value,
    };
  });

  // Engagement score (0-100)
  const engagementScore = Math.min(100, Math.round(
    (daysActive / 7) * 30 +
    Math.min(30, (totalMinutes / 120) * 30) +
    Math.min(20, modulesCompleted * 5) +
    Math.min(20, currentStreak * 3)
  ));

  // Overall grade
  let overallGrade = 'D';
  if (engagementScore >= 85) overallGrade = 'A';
  else if (engagementScore >= 70) overallGrade = 'B';
  else if (engagementScore >= 55) overallGrade = 'C';

  return {
    summary: {
      total_hours: Math.round(totalMinutes / 60 * 10) / 10,
      total_minutes: totalMinutes,
      days_active: daysActive,
      current_streak: currentStreak,
      modules_completed: modulesCompleted,
      avg_quiz_score: avgQuizScore,
    },
    daily_time: dailyTime,
    subject_breakdown: subjectBreakdown,
    topics_explored: topicsExplored,
    quiz_scores: quizScores,
    streak_calendar: streakCalendar,
    goal_progress: goalProgress,
    engagement_score: engagementScore,
    overall_grade: overallGrade,
    mastery,
  };
}

// ─── AI NARRATIVE GENERATION ───
async function generateNarrative(reportData: any, childName: string, childAge?: number, gradeLevel?: string, interests?: string[]) {
  const prompt = `You are a warm, encouraging educational report writer for parents. Write a weekly progress report narrative for a child's learning.

CHILD: ${childName}${childAge ? `, age ${childAge}` : ''}${gradeLevel ? `, grade ${gradeLevel}` : ''}
${interests?.length ? `Interests: ${interests.join(', ')}` : ''}

THIS WEEK'S DATA:
- Learning time: ${reportData.summary.total_hours}h (${reportData.summary.total_minutes} minutes)
- Days active: ${reportData.summary.days_active}/7
- Modules completed: ${reportData.summary.modules_completed}
- Current streak: ${reportData.summary.current_streak} days
- Engagement score: ${reportData.engagement_score}/100
- Subjects: ${reportData.subject_breakdown.map((s: any) => `${s.subject} (${s.activities} activities)`).join(', ') || 'none'}
- Topics: ${reportData.topics_explored.join(', ') || 'none'}
${reportData.summary.avg_quiz_score !== null ? `- Avg quiz score: ${reportData.summary.avg_quiz_score}%` : ''}
- Goals: ${reportData.goal_progress.length > 0 ? reportData.goal_progress.map((g: any) => `${g.goal_type}: ${g.actual_value}/${g.target_value} (${g.met ? 'MET' : g.completion_pct + '%'})`).join(', ') : 'none set'}

Return JSON:
{
  "narrative": "3-5 paragraph warm narrative about the week (use child's name naturally)",
  "highlights": ["string", "string", "string"],
  "areas_for_growth": ["string", "string"],
  "celebration_moment": "string (one specific thing to celebrate this week)",
  "recommended_topics": ["string", "string", "string"],
  "recommended_focus_areas": [
    {"subject": "string", "reason": "string", "suggested_activities": ["string"]}
  ],
  "parent_tips": ["string", "string"],
  "goal_recommendations": ["string"],
  "standards_coverage": [
    {
      "area": "string (e.g., Math, ELA, Science)",
      "activitiesCount": number,
      "standards": [
        {"standard": "string (e.g., CCSS.MATH.4.OA.1)", "status": "met|partial|started|not_started"}
      ]
    }
  ]
}`;

  try {
    const raw = await callOpenAI(
      [{ role: 'system', content: prompt }],
      { model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 2000, response_format: { type: 'json_object' } },
    );
    return parseJSON(raw);
  } catch (err) {
    console.error('Narrative generation failed:', err);
    return {
      narrative: `${childName} had ${reportData.summary.days_active > 0 ? 'an active' : 'a quiet'} week with ${reportData.summary.total_hours} hours of learning across ${reportData.summary.modules_completed} modules.`,
      highlights: reportData.summary.days_active > 3 ? ['Great consistency this week!'] : ['Keep building that learning habit!'],
      areas_for_growth: ['Try to learn a little bit every day'],
      celebration_moment: reportData.summary.modules_completed > 0 ? `Completed ${reportData.summary.modules_completed} modules!` : 'Every learning journey starts with a single step.',
      recommended_topics: [],
      recommended_focus_areas: [],
      parent_tips: ['Encourage daily learning, even just 15 minutes.'],
      goal_recommendations: [],
      standards_coverage: [],
    };
  }
}

// ─── COMPARE WEEKS ───
async function compareWeeks(db: any, currentReportId: string, childId: string, currentWeekStart: string) {
  // Find previous week's report
  const prevWeekStart = new Date(currentWeekStart + 'T00:00:00');
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWS = prevWeekStart.toISOString().split('T')[0];

  const { data: prevReport } = await db.from('weekly_reports')
    .select('*')
    .eq('child_id', childId)
    .eq('week_start', prevWS)
    .maybeSingle();

  if (!prevReport) {
    return { error: 'no_previous_report', message: 'No report found for the previous week. Generate one first to compare.' };
  }

  const { data: currentReport } = await db.from('weekly_reports')
    .select('*')
    .eq('id', currentReportId)
    .maybeSingle();

  if (!currentReport) {
    return { error: 'current_report_not_found' };
  }

  const curr = currentReport.summary || {};
  const prev = prevReport.summary || {};

  // Compute deltas
  function computeDelta(key: string) {
    const c = curr[key] || 0;
    const p = prev[key] || 0;
    const diff = c - p;
    const pctChange = p > 0 ? Math.round((diff / p) * 100) : (c > 0 ? 100 : 0);
    return {
      current: c, previous: p, diff,
      pctChange: Math.abs(pctChange),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
    };
  }

  const deltas: Record<string, any> = {
    total_minutes: computeDelta('total_minutes'),
    total_hours: computeDelta('total_hours'),
    days_active: computeDelta('days_active'),
    current_streak: computeDelta('current_streak'),
    modules_completed: computeDelta('modules_completed'),
    engagement_score: { ...computeDelta('engagement_score'), current: currentReport.engagement_score, previous: prevReport.engagement_score },
  };
  if (curr.avg_quiz_score != null || prev.avg_quiz_score != null) {
    deltas.avg_quiz_score = computeDelta('avg_quiz_score');
  }

  // Daily comparison chart
  const currDaily = currentReport.daily_time || [];
  const prevDaily = prevReport.daily_time || [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const comparisonChart = days.map(day => ({
    day,
    currentWeek: currDaily.find((d: any) => d.day === day)?.minutes || 0,
    previousWeek: prevDaily.find((d: any) => d.day === day)?.minutes || 0,
  }));

  // Subject shifts
  const currSubjects = currentReport.subject_breakdown || [];
  const prevSubjects = prevReport.subject_breakdown || [];
  const allSubjects = [...new Set([...currSubjects.map((s: any) => s.subject), ...prevSubjects.map((s: any) => s.subject)])];
  const subjectShifts = allSubjects.map(subject => {
    const c = currSubjects.find((s: any) => s.subject === subject) || { activities: 0, minutes: 0, percentage: 0 };
    const p = prevSubjects.find((s: any) => s.subject === subject) || { activities: 0, minutes: 0, percentage: 0 };
    return {
      subject,
      current: c,
      previous: p,
      activityDelta: c.activities - p.activities,
    };
  });

  // Standards progression
  const currStandards = currentReport.standards_coverage || [];
  const prevStandards = prevReport.standards_coverage || [];
  const standardsProgression = currStandards.map((area: any) => {
    const prevArea = prevStandards.find((a: any) => a.area === area.area);
    const changes = (area.standards || []).map((std: any) => {
      const prevStd = prevArea?.standards?.find((s: any) => s.standard === std.standard);
      const statusOrder = ['not_started', 'started', 'partial', 'met'];
      const currIdx = statusOrder.indexOf(std.status);
      const prevIdx = prevStd ? statusOrder.indexOf(prevStd.status) : 0;
      return {
        standard: std.standard,
        currentStatus: std.status,
        previousStatus: prevStd?.status || 'not_started',
        improved: currIdx > prevIdx,
        regressed: currIdx < prevIdx,
      };
    });
    return { area: area.area, changes };
  });

  // Goal progress for comparison week
  const goalProgress = currentReport.goal_progress || [];

  // AI comparison narrative
  let comparisonNarrative = '';
  try {
    const raw = await callOpenAI([{
      role: 'system',
      content: `You are an educational analyst. Compare two weeks of learning data and write a 2-3 paragraph analysis for a parent.

PREVIOUS WEEK: ${JSON.stringify(prev)}
CURRENT WEEK: ${JSON.stringify(curr)}
DELTAS: ${JSON.stringify(deltas)}

Write a warm, encouraging comparison. Highlight improvements. Be constructive about declines. Use the child's data, not generic advice. Return plain text (not JSON).`,
    }], { model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 600 });
    comparisonNarrative = raw;
  } catch { comparisonNarrative = ''; }

  return {
    currentReport: { week_start: currentReport.week_start, week_end: currentReport.week_end },
    previousReport: { week_start: prevReport.week_start, week_end: prevReport.week_end },
    deltas,
    comparisonChart,
    subjectShifts,
    standardsProgression,
    goalProgress,
    comparisonNarrative,
  };
}

// ─── MAIN HANDLER ───
serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body = await req.json();
    const { action } = body;
    const db = getSupabaseAdmin();

    // ═══ LIST REPORTS ═══
    if (action === 'list-reports') {
      const { childId, limit = 12 } = body;
      const { data: reports } = await db.from('weekly_reports')
        .select('id, child_id, child_name, week_start, week_end, created_at, summary, engagement_score, overall_grade')
        .eq('child_id', childId)
        .order('week_start', { ascending: false })
        .limit(limit);
      return new Response(JSON.stringify({ reports: reports || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ GET REPORT ═══
    if (action === 'get-report') {
      const { reportId } = body;
      const { data: report } = await db.from('weekly_reports').select('*').eq('id', reportId).maybeSingle();
      if (!report) {
        return new Response(JSON.stringify({ error: 'Report not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(report), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ GENERATE WEEKLY REPORT ═══
    if (action === 'generate-weekly') {
      const { childId, childName, childAge, gradeLevel, interests, weekStart: ws, weekEnd: we } = body;
      const { weekStart, weekEnd } = ws ? { weekStart: ws, weekEnd: we || ws } : getCurrentWeekRange();

      const weekData = await loadWeekData(db, childId, weekStart, weekEnd);
      const reportData = computeReportData(weekData, weekStart, weekEnd);
      const narrative = await generateNarrative(reportData, childName, childAge, gradeLevel, interests);

      const fullReport = {
        child_id: childId,
        child_name: childName,
        child_age: childAge,
        grade_level: gradeLevel,
        week_start: weekStart,
        week_end: weekEnd,
        generated_at: new Date().toISOString(),
        ...reportData,
        ...narrative,
      };

      // Save to DB
      const { data: saved } = await db.from('weekly_reports').insert({
        child_id: childId,
        child_name: childName,
        week_start: weekStart,
        week_end: weekEnd,
        summary: reportData.summary,
        engagement_score: reportData.engagement_score,
        overall_grade: reportData.overall_grade,
        daily_time: reportData.daily_time,
        subject_breakdown: reportData.subject_breakdown,
        topics_explored: reportData.topics_explored,
        quiz_scores: reportData.quiz_scores,
        streak_calendar: reportData.streak_calendar,
        goal_progress: reportData.goal_progress,
        narrative: narrative.narrative,
        highlights: narrative.highlights,
        areas_for_growth: narrative.areas_for_growth,
        celebration_moment: narrative.celebration_moment,
        recommended_topics: narrative.recommended_topics,
        recommended_focus_areas: narrative.recommended_focus_areas,
        parent_tips: narrative.parent_tips,
        goal_recommendations: narrative.goal_recommendations,
        standards_coverage: narrative.standards_coverage,
      }).select().maybeSingle();

      if (saved) fullReport.report_id = saved.id;

      return new Response(JSON.stringify(fullReport), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ COMPARE WEEKS ═══
    if (action === 'compare-weeks') {
      const { currentReportId, childId, currentWeekStart } = body;
      const result = await compareWeeks(db, currentReportId, childId, currentWeekStart);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ LIST GOALS ═══
    if (action === 'list-goals') {
      const { childId, weekStart } = body;
      const ws = weekStart || getCurrentWeekRange().weekStart;
      const { data: goals } = await db.from('weekly_goals')
        .select('*')
        .eq('child_id', childId)
        .eq('week_start', ws)
        .order('created_at');
      return new Response(JSON.stringify({ goals: goals || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ UPSERT GOAL ═══
    if (action === 'upsert-goal') {
      const { goalId, childId, goalType, targetValue, weekStart } = body;
      const ws = weekStart || getCurrentWeekRange().weekStart;

      if (goalId) {
        await db.from('weekly_goals').update({
          goal_type: goalType,
          target_value: targetValue,
          updated_at: new Date().toISOString(),
        }).eq('id', goalId);
      } else {
        await db.from('weekly_goals').insert({
          child_id: childId,
          goal_type: goalType,
          target_value: targetValue,
          current_value: 0,
          week_start: ws,
          status: 'active',
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ DELETE GOAL ═══
    if (action === 'delete-goal') {
      const { goalId } = body;
      await db.from('weekly_goals').delete().eq('id', goalId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ SUGGEST GOALS ═══
    if (action === 'suggest-goals') {
      const { childId, childName, childAge, gradeLevel, interests, weekStart } = body;
      const ws = weekStart || getCurrentWeekRange().weekStart;

      // Load recent activity for context
      const since = new Date(Date.now() - 14 * 86400000).toISOString();
      const [{ data: recentActivity }, { data: recentGoals }, { data: engagement }] = await Promise.all([
        db.from('activity_log').select('*').eq('user_id', childId).gte('created_at', since).order('created_at', { ascending: false }).limit(50),
        db.from('weekly_goals').select('*').eq('child_id', childId).order('created_at', { ascending: false }).limit(20),
        db.from('student_engagement_profiles').select('*').eq('student_id', childId).maybeSingle(),
      ]);

      const recentActivityCount = (recentActivity || []).length;
      const pastGoals = (recentGoals || []).map((g: any) => ({
        type: g.goal_type, target: g.target_value, current: g.current_value,
        met: g.current_value >= g.target_value, week: g.week_start,
      }));

      try {
        const raw = await callOpenAI([{
          role: 'system',
          content: `You are an educational goal advisor. Suggest weekly learning goals for a child.

CHILD: ${childName}${childAge ? `, age ${childAge}` : ''}${gradeLevel ? `, grade ${gradeLevel}` : ''}
${interests?.length ? `Interests: ${interests.join(', ')}` : ''}
Recent activity count (14 days): ${recentActivityCount}
${engagement ? `Engagement: streak ${engagement.streak_current || 0}, completion rate ${engagement.completion_rate || 0.5}` : ''}
Past goals: ${JSON.stringify(pastGoals.slice(0, 10))}

Available goal types: time_minutes, modules_completed, subjects_covered, streak_days, quiz_score_avg

Return JSON:
{
  "suggestions": [
    {
      "goal_type": "string",
      "target_value": number,
      "reason": "string (why this target)",
      "priority": "high|medium|low",
      "confidence": number (0-100),
      "tip": "string (parent tip for supporting this goal)"
    }
  ]
}

Rules:
- Suggest 3-5 goals
- Base targets on past performance (stretch but achievable)
- If no past data, use age-appropriate defaults
- time_minutes: 60-300 range
- modules_completed: 3-15 range
- subjects_covered: 2-6 range
- streak_days: 3-7 range
- quiz_score_avg: 60-95 range`,
        }], {
          model: 'gpt-4o-mini',
          temperature: 0.5,
          max_tokens: 800,
          response_format: { type: 'json_object' },
        });
        const parsed = parseJSON(raw);
        return new Response(JSON.stringify({
          suggestions: parsed.suggestions || [],
          context: { recentActivityCount, pastGoalCount: pastGoals.length },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error('Goal suggestion failed:', err);
        return new Response(JSON.stringify({
          suggestions: [
            { goal_type: 'time_minutes', target_value: 120, reason: 'Build a consistent learning habit', priority: 'high', confidence: 70, tip: 'Try 20 minutes after school each day' },
            { goal_type: 'modules_completed', target_value: 5, reason: 'Complete at least one module per weekday', priority: 'medium', confidence: 60, tip: 'Celebrate each completed module' },
            { goal_type: 'streak_days', target_value: 5, reason: 'Consistency matters more than duration', priority: 'high', confidence: 75, tip: 'Even 10 minutes counts toward the streak' },
          ],
          context: { recentActivityCount, pastGoalCount: pastGoals.length },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ═══ GOAL HISTORY ═══
    if (action === 'goal-history') {
      const { childId, weeksBack = 8 } = body;
      const since = new Date();
      since.setDate(since.getDate() - weeksBack * 7);
      const { data: goals } = await db.from('weekly_goals')
        .select('*')
        .eq('child_id', childId)
        .gte('week_start', since.toISOString().split('T')[0])
        .order('week_start', { ascending: false });
      return new Response(JSON.stringify({ goals: goals || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ FAMILY OVERVIEW ═══
    if (action === 'family-overview') {
      const { children = [] } = body;
      const overviews = [];

      for (const child of children) {
        const { weekStart, weekEnd } = getCurrentWeekRange();
        const weekData = await loadWeekData(db, child.id, weekStart, weekEnd);
        const reportData = computeReportData(weekData, weekStart, weekEnd);

        overviews.push({
          childId: child.id,
          childName: child.name,
          summary: reportData.summary,
          engagementScore: reportData.engagement_score,
          overallGrade: reportData.overall_grade,
          topSubjects: reportData.subject_breakdown.slice(0, 3).map((s: any) => s.subject),
          goalsMet: reportData.goal_progress.filter((g: any) => g.met).length,
          goalsTotal: reportData.goal_progress.length,
        });
      }

      return new Response(JSON.stringify({ overviews }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══ LEGACY: PARENT PORTAL REPORT (from ParentPortal.tsx) ═══
    if (!action || action === 'generate') {
      const { childName, childAge, gradeLevel, interests } = body;
      const { weekStart, weekEnd } = getCurrentWeekRange();
      // Try to find the child by name
      const { data: student } = await db.from('student_identity_profiles')
        .select('student_id')
        .eq('preferred_name', childName)
        .maybeSingle();

      if (!student) {
        return new Response(JSON.stringify({
          narrative: `We don't have enough data for ${childName} yet. Start some learning activities to generate a report!`,
          highlights: [],
          areas_for_growth: [],
          recommended_topics: interests || [],
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const weekData = await loadWeekData(db, student.student_id, weekStart, weekEnd);
      const reportData = computeReportData(weekData, weekStart, weekEnd);
      const narrative = await generateNarrative(reportData, childName, childAge, gradeLevel, interests);

      return new Response(JSON.stringify({
        ...reportData,
        ...narrative,
        child_name: childName,
        week_start: weekStart,
        week_end: weekEnd,
        generated_at: new Date().toISOString(),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('generate-report error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
