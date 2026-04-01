// ═══════════════════════════════════════════════════════════════
//  analyze-records — Student Learning Record Analysis
//  Analyzes learning activity, mastery, engagement patterns
//  DEPLOY: Copy to supabase/functions/analyze-records/index.ts
// ═══════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/db.ts';
import { callOpenAI, parseJSON } from '../_shared/openai.ts';

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body = await req.json();
    const {
      studentId,
      childId,
      analysisType = 'comprehensive',
      dateRange = 30, // days
    } = body;

    const sid = studentId || childId;
    if (!sid) {
      return new Response(JSON.stringify({ error: 'studentId or childId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = getSupabaseAdmin();
    const since = new Date(Date.now() - dateRange * 86400000).toISOString();

    // ─── LOAD DATA ───
    const [
      { data: sessions },
      { data: progress },
      { data: mastery },
      { data: engagement },
      { data: activity },
      { data: paths },
      { data: identity },
    ] = await Promise.all([
      db.from('learning_sessions').select('*').eq('student_id', sid).gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      db.from('learning_progress').select('*').eq('user_id', sid).gte('created_at', since).order('created_at', { ascending: false }).limit(100),
      db.from('student_mastery_records').select('*').eq('student_id', sid),
      db.from('student_engagement_profiles').select('*').eq('student_id', sid).maybeSingle(),
      db.from('activity_log').select('*').eq('user_id', sid).gte('created_at', since).order('created_at', { ascending: false }).limit(100),
      db.from('learning_paths').select('*').eq('user_id', sid).gte('created_at', since).order('created_at', { ascending: false }).limit(20),
      db.from('student_identity_profiles').select('preferred_name, age, grade_band').eq('student_id', sid).maybeSingle(),
    ]);

    // ─── COMPUTE METRICS ───
    const totalSessions = (sessions || []).length;
    const totalMinutes = (sessions || []).reduce((s: number, sess: any) => s + (sess.elapsed_minutes || 0), 0);
    const totalModules = (progress || []).filter((p: any) => p.status === 'completed').length;
    const activeDays = new Set((activity || []).map((a: any) => a.created_at?.split('T')[0])).size;

    const subjectCoverage: Record<string, number> = {};
    for (const p of (progress || [])) {
      const tags = p.subject_tags || [];
      for (const tag of tags) {
        subjectCoverage[tag] = (subjectCoverage[tag] || 0) + 1;
      }
    }
    // Also count from activity log
    for (const a of (activity || [])) {
      const tags = a.subject_tags || [];
      for (const tag of tags) {
        subjectCoverage[tag] = (subjectCoverage[tag] || 0) + 1;
      }
    }

    const masteryByDomain: Record<string, any> = {};
    for (const m of (mastery || [])) {
      if (!m.subskill || m.subskill === '') {
        masteryByDomain[m.domain] = {
          estimate: m.mastery_estimate,
          xp: m.total_xp,
          level: m.level,
          strength: m.strength_flag,
          gap: m.gap_flag,
        };
      }
    }

    const topicsExplored = [...new Set((paths || []).map((p: any) => p.topic).filter(Boolean))];

    // ─── AI ANALYSIS ───
    const dataBlock = `
Student: ${identity?.preferred_name || 'Unknown'} (age ${identity?.age || '?'}, ${identity?.grade_band || '?'})
Period: Last ${dateRange} days

METRICS:
- Total sessions: ${totalSessions}
- Total learning time: ${totalMinutes} minutes (${Math.round(totalMinutes / 60)}h)
- Active days: ${activeDays}
- Modules completed: ${totalModules}
- Topics explored: ${topicsExplored.join(', ') || 'none'}

SUBJECT COVERAGE:
${Object.entries(subjectCoverage).sort((a, b) => b[1] - a[1]).map(([s, c]) => `- ${s}: ${c} activities`).join('\n') || '- No data'}

MASTERY BY DOMAIN:
${Object.entries(masteryByDomain).map(([d, m]) => `- ${d}: ${(m.estimate * 100).toFixed(0)}% (Level ${m.level}, ${m.xp} XP)${m.strength ? ' [STRENGTH]' : ''}${m.gap ? ' [GAP]' : ''}`).join('\n') || '- No mastery data'}

ENGAGEMENT:
- Frustration indicator: ${engagement?.frustration_indicator?.toFixed(2) || 'N/A'}
- Boredom indicator: ${engagement?.boredom_indicator?.toFixed(2) || 'N/A'}
- Completion rate: ${engagement?.completion_rate?.toFixed(2) || 'N/A'}
- Attention span: ${engagement?.attention_span_estimate || 'N/A'}
- Streak: ${engagement?.streak_current || 0} days (best: ${engagement?.streak_best || 0})
`;

    let analysis: any;
    try {
      const raw = await callOpenAI([
        {
          role: 'system',
          content: `You are an educational data analyst. Analyze this student's learning records and produce a structured analysis.

${dataBlock}

Return JSON:
{
  "summary": "2-3 sentence overview of the student's learning trajectory",
  "strengths": ["string", "string"],
  "areas_for_improvement": ["string", "string"],
  "engagement_assessment": "string (1-2 sentences)",
  "subject_balance": "string (1-2 sentences about subject coverage balance)",
  "recommendations": [
    {"area": "string", "suggestion": "string", "priority": "high|medium|low"}
  ],
  "risk_flags": ["string"] or [],
  "overall_health": "excellent|good|fair|needs_attention"
}`,
        },
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });
      analysis = parseJSON(raw);
    } catch (err) {
      console.error('AI analysis failed:', err);
      analysis = {
        summary: `Over the last ${dateRange} days, the student completed ${totalModules} modules across ${totalSessions} sessions (${Math.round(totalMinutes / 60)}h total).`,
        strengths: Object.entries(masteryByDomain).filter(([, m]) => m.strength).map(([d]) => `Strong in ${d}`),
        areas_for_improvement: Object.entries(masteryByDomain).filter(([, m]) => m.gap).map(([d]) => `Needs work in ${d}`),
        engagement_assessment: 'Analysis unavailable.',
        subject_balance: 'Analysis unavailable.',
        recommendations: [],
        risk_flags: [],
        overall_health: totalMinutes > 60 ? 'good' : 'needs_attention',
      };
    }

    return new Response(JSON.stringify({
      ...analysis,
      metrics: {
        totalSessions,
        totalMinutes,
        totalModules,
        activeDays,
        dateRange,
      },
      subjectCoverage,
      masteryByDomain,
      topicsExplored,
      engagement: engagement ? {
        frustration: engagement.frustration_indicator,
        boredom: engagement.boredom_indicator,
        completionRate: engagement.completion_rate,
        attentionSpan: engagement.attention_span_estimate,
        streak: engagement.streak_current,
      } : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('analyze-records error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
