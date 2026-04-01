// ═══════════════════════════════════════════════════════════════
//  mentor-chat — FreeLearner.ai Adaptive Tutoring Pipeline
//  Architecture: Hidden Planner (gpt-4o-mini) → Visible Mentor (gpt-4o)
//  DEPLOY: Copy to supabase/functions/mentor-chat/index.ts
// ═══════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/db.ts';
import { callOpenAI, parseJSON } from '../_shared/openai.ts';
import type { ChatMessage } from '../_shared/openai.ts';

// ─── CONTENT SAFETY ───
const BLOCKED_PATTERNS = [
  /how\s+to\s+(make|build|create)\s+(a\s+)?(bomb|weapon|gun|explosive)/i,
  /how\s+to\s+(buy|get|use)\s+(drugs|cocaine|heroin|meth)/i,
  /(porn|sex|nude|naked|xxx)/i,
  /(kill|murder|shoot|stab)\s+(someone|people|them|him|her)/i,
  /(hate|kill)\s+(all\s+)?(jews|muslims|blacks|whites|gays|immigrants)/i,
];
const PERSONAL_INFO_PATTERNS = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,                    // phone
  /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|court|ct)\b/i, // address
  /\b(?:my\s+)?password\s+is\b/i,
  /\b\d{3}-?\d{2}-?\d{4}\b/,                            // SSN
];
const DISTRESS_PATTERNS = [
  /i\s+want\s+to\s+(die|kill\s+myself|end\s+it)/i,
  /i('m|\s+am)\s+(going\s+to\s+)?(hurt|harm)\s+myself/i,
  /nobody\s+(cares|loves\s+me|would\s+miss\s+me)/i,
  /i\s+can'?t\s+(go\s+on|take\s+it\s+anymore)/i,
  /suicid/i,
  /self[- ]?harm/i,
];

function checkSafety(text: string): { safe: boolean; type?: string; response?: string } {
  for (const p of DISTRESS_PATTERNS) {
    if (p.test(text)) return {
      safe: false, type: 'distress',
      response: "I hear you, and I want you to know that what you're feeling matters. I'm an AI learning buddy, so I can't help with this the way a real person can. Please talk to a trusted adult — a parent, teacher, or school counselor. You can also reach the 988 Suicide & Crisis Lifeline by calling or texting 988. You're not alone.",
    };
  }
  for (const p of BLOCKED_PATTERNS) {
    if (p.test(text)) return {
      safe: false, type: 'blocked',
      response: "That's not something I can help with. I'm here for learning adventures! What topic sounds interesting to you today?",
    };
  }
  for (const p of PERSONAL_INFO_PATTERNS) {
    if (p.test(text)) return {
      safe: false, type: 'personal_info',
      response: "Whoa — it looks like you might be sharing personal information. For your safety, I can't store things like phone numbers, addresses, or passwords. Let's get back to learning! What are you curious about?",
    };
  }
  return { safe: true };
}

// ─── VOICE CALIBRATION ───
function getVoiceCalibration(gradeBand: string): string {
  switch (gradeBand) {
    case 'K-2': return 'Use very simple words (1st-2nd grade reading level). Short sentences. Lots of encouragement. Use their name often. Make everything feel like play.';
    case '3-5': return 'Use clear, conversational language (3rd-5th grade level). Mix fun with learning. Use analogies from their world (games, shows, sports). Celebrate curiosity.';
    case '6-8': return 'Speak like a cool, smart older friend. Use age-appropriate vocabulary. Be real, not condescending. Respect their intelligence. Use humor naturally.';
    case '9-12': return 'Speak peer-to-peer. Use sophisticated vocabulary when appropriate. Be intellectually stimulating. Challenge them. Respect their autonomy and opinions.';
    default: return 'Use clear, warm, age-appropriate language. Be encouraging and curious.';
  }
}

// ─── LOAD DATABASE CONTEXT ───
async function loadDBContext(db: any, studentId: string | null, sessionId: string | null) {
  if (!studentId) return { lessonMemory: null, recentMessages: [], recentPlans: [], lessonHistory: [], skillTracking: null, sessionMeta: null };

  const queries = [
    db.from('lesson_memory').select('*').eq('student_id', studentId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('chat_messages').select('role, content, created_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(30),
    db.from('mentor_plans').select('plan_json, created_at').eq('student_id', studentId).order('created_at', { ascending: false }).limit(20),
    db.from('lesson_history').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(15),
    sessionId ? db.from('session_skill_tracking').select('*').eq('session_id', sessionId).maybeSingle() : Promise.resolve({ data: null }),
    sessionId ? db.from('learning_sessions').select('*').eq('id', sessionId).maybeSingle() : Promise.resolve({ data: null }),
  ];

  const [lessonMemRes, msgRes, planRes, histRes, skillRes, sessRes] = await Promise.allSettled(queries);

  return {
    lessonMemory: lessonMemRes.status === 'fulfilled' ? lessonMemRes.value?.data : null,
    recentMessages: (msgRes.status === 'fulfilled' ? msgRes.value?.data : null) || [],
    recentPlans: (planRes.status === 'fulfilled' ? planRes.value?.data : null) || [],
    lessonHistory: (histRes.status === 'fulfilled' ? histRes.value?.data : null) || [],
    skillTracking: skillRes.status === 'fulfilled' ? skillRes.value?.data : null,
    sessionMeta: sessRes.status === 'fulfilled' ? sessRes.value?.data : null,
  };
}

// ─── BUILD PLANNING PROMPT ───
function buildPlanningPrompt(
  studentMessage: string,
  studentContext: any,
  sessionState: any,
  adaptationSignals: any,
  dbContext: any,
  conversationHistory: any[],
): ChatMessage[] {
  const ctx = studentContext?.student_context || {};
  const identity = ctx.identity || {};
  const strategy = ctx.instructional_strategy || {};
  const support = ctx.support_flags || {};
  const state = ctx.current_state || {};

  const recentPlans = (dbContext.recentPlans || []).slice(0, 5).map((p: any) => {
    try { return typeof p.plan_json === 'string' ? JSON.parse(p.plan_json) : p.plan_json; } catch { return null; }
  }).filter(Boolean);

  const recentConvo = conversationHistory.slice(-6).map((m: any) => `${m.sender === 'student' ? 'Student' : 'Mentor'}: ${m.text.substring(0, 200)}`).join('\n');

  const lessonMem = dbContext.lessonMemory;
  const memoryBlock = lessonMem ? `
LESSON MEMORY:
- Covered concepts: ${(lessonMem.covered_concepts || []).slice(-20).join(', ') || 'none yet'}
- Vocabulary introduced: ${(lessonMem.vocabulary || []).slice(-15).join(', ') || 'none yet'}
- Open loops: ${(lessonMem.open_loops || []).slice(-5).join(', ') || 'none'}
` : '';

  // Adaptation block
  let adaptBlock = '';
  if (adaptationSignals && adaptationSignals.signals_detected?.length > 0) {
    adaptBlock = `
REAL-TIME ADAPTATION SIGNALS (confidence: ${adaptationSignals.confidence}):
- Signals: ${adaptationSignals.signals_detected.join(', ')}
- Difficulty: ${adaptationSignals.difficulty_adjustment}
- Pacing: ${adaptationSignals.pacing_adjustment}
- Explanation: ${adaptationSignals.explanation_adjustment}
${adaptationSignals.engagement_intervention ? `- Engagement intervention: ${adaptationSignals.engagement_intervention}` : ''}
${adaptationSignals.encouragement_needed ? '- ENCOURAGEMENT NEEDED' : ''}
${adaptationSignals.scaffold_needed ? '- SCAFFOLDING NEEDED' : ''}
${adaptationSignals.suggest_break ? '- SUGGEST A BREAK' : ''}
`;
  }

  const system = `You are the hidden lesson planner for FreeLearner.ai. You analyze the student's message and plan the mentor's next response. Your output is NEVER shown to the student.

═══ STUDENT CONTEXT ═══
Name: ${identity.preferred_name || 'Student'}
Grade band: ${identity.grade_band || 'unknown'}
Subject: ${state.subject || 'integrated'}
Mastery level: ${state.mastery_level || 'emerging'}
Confidence: ${state.confidence_estimate || 0.5}
Boredom risk: ${state.boredom_risk || 0.3}
Frustration risk: ${state.frustration_risk || 0.3}
Struggle points: ${(state.struggle_points || []).join(', ') || 'none identified'}

Personality: ${ctx.personality_summary || 'Not assessed'}
Learning prefs: ${ctx.learning_preferences_summary || 'Not assessed'}
Interests: ${ctx.interest_summary || 'Still discovering'}
Aptitude: ${ctx.aptitude_summary || 'Not assessed'}
Engagement: ${ctx.engagement_summary || 'New student'}
Motivation: ${ctx.motivational_summary || 'Curiosity-driven'}

Support flags:
- Shorter lessons: ${support.needs_shorter_lessons || false}
- Confidence support: ${support.needs_confidence_support || false}
- More variety: ${support.needs_more_variety || false}
- Advanced challenge: ${support.needs_advanced_challenge || false}

Instructional strategy:
- Tone: ${strategy.tone || 'warm, encouraging'}
- Pacing: ${strategy.pacing || 'moderate'}
- Explanation: ${strategy.explanation_style || 'concrete first'}
- Examples: ${(strategy.example_types || []).join(', ') || 'real-world'}
- Hooks: ${(strategy.engagement_hooks || []).join(', ') || 'surprising facts'}
- Challenge: ${strategy.challenge_strategy || 'start accessible'}
- Encouragement: ${strategy.encouragement_style || 'specific praise'}
- Attention recovery: ${strategy.attention_recovery_strategy || 'switch topic'}
- Mistake handling: ${strategy.mistake_handling_strategy || 'normalize and retry'}
${memoryBlock}
${adaptBlock}

═══ SESSION STATE ═══
Turn: ${sessionState?.turnNumber || 0}
Minutes: ${sessionState?.sessionMinutes || 0}
Engagement score: ${sessionState?.engagementScore || 0.7}

═══ RECENT CONVERSATION ═══
${recentConvo || '(first message)'}

═══ RECENT PLANS ═══
${recentPlans.slice(0, 3).map((p: any) => `Topic: ${p.topic_detected || '?'}, Strategy: ${p.teaching_strategy || '?'}, Intent: ${p.mentor_intent || '?'}`).join('\n') || '(none)'}

═══ PRIOR LESSONS ═══
${(dbContext.lessonHistory || []).slice(0, 5).map((l: any) => `${l.topic || '?'} (${l.xp_earned || 0} XP)`).join(', ') || '(none)'}

═══ 12-STEP PLANNING PROCESS ═══
1. What is the student actually asking or expressing?
2. What is their emotional state right now? (engaged, confused, frustrated, bored, curious, excited)
3. What domain(s) does this touch? (language_arts, math, science, social_studies, critical_thinking, executive_function)
4. What concept should I teach or reinforce?
5. What's the best teaching strategy? (ask_to_discover, reveal_surprise, challenge, story, compare, build, debate, connect, what_if, real_world)
6. How should I personalize based on their profile?
7. What engagement hook should I use?
8. Should I adjust difficulty, pacing, or explanation style?
9. What should the mentor's response accomplish?
10. What follow-up choices should I offer?
11. Are there any avatar observations to record?
12. What's the engagement assessment?

═══ REQUIRED JSON OUTPUT ═══
{
  "topic_detected": "string",
  "domains_touched": ["string"],
  "concept_to_teach": "string",
  "teaching_strategy": "string",
  "mentor_intent": "string (1-2 sentences describing what the response should accomplish)",
  "personalization_notes": "string (how to personalize for this specific student)",
  "engagement_hook": "string",
  "difficulty_level": "accessible|moderate|challenging|advanced",
  "response_length": "short|medium|long",
  "next_choices": [
    {"label": "string", "description": "string"},
    {"label": "string", "description": "string"},
    {"label": "string", "description": "string"}
  ],
  "avatar_update_observations": {
    "engagement_signals": ["string"],
    "interest_signals": ["string"],
    "mastery_signals": ["string"],
    "motivation_signals": ["string"]
  },
  "engagement_assessment": {
    "student_seems": "engaged|curious|confused|frustrated|bored|neutral",
    "confidence_level": "high|medium|low"
  },
  "suggest_break": false,
  "xp_award": 5
}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: `Student says: "${studentMessage}"` },
  ];
}

// ─── BUILD MENTOR PROMPT ───
function buildMentorPrompt(
  plan: any,
  studentContext: any,
  conversationHistory: any[],
  studentProfile: any,
): ChatMessage[] {
  const ctx = studentContext?.student_context || {};
  const identity = ctx.identity || {};
  const strategy = ctx.instructional_strategy || {};
  const support = ctx.support_flags || {};
  const gradeBand = identity.grade_band || studentProfile?.gradeBand || '6-8';
  const name = identity.preferred_name || studentProfile?.name || 'friend';

  const voiceCal = getVoiceCalibration(gradeBand);

  // Support flag instructions (highest priority)
  let supportBlock = '';
  if (support.needs_confidence_support) supportBlock += '\nCRITICAL: This student needs confidence support. Be extra encouraging. Celebrate every small win. Never make them feel dumb.\n';
  if (support.needs_shorter_lessons) supportBlock += '\nCRITICAL: Keep responses SHORT. This student has a shorter attention span. Break everything into tiny pieces.\n';
  if (support.needs_more_variety) supportBlock += '\nIMPORTANT: This student craves variety. Switch up your approach frequently. Use surprising angles.\n';
  if (support.needs_advanced_challenge) supportBlock += '\nIMPORTANT: This student is advanced. Push them intellectually. Don\'t oversimplify. Offer depth.\n';

  const recentConvo = conversationHistory.slice(-10).map((m: any) => ({
    role: m.sender === 'student' ? 'user' as const : 'assistant' as const,
    content: m.text,
  }));

  const system = `You are FreeLearner, the AI mentor for ${name}. You're warm, brilliant, and genuinely fascinated by learning. You teach through curiosity, not lectures.

═══ VOICE CALIBRATION ═══
${voiceCal}
${supportBlock}

═══ PERSONALIZATION ═══
Tone: ${strategy.tone || 'warm, encouraging'}
Pacing: ${strategy.pacing || 'moderate'}
Explanation style: ${strategy.explanation_style || 'concrete first'}
Example types: ${(strategy.example_types || []).join(', ') || 'real-world'}
Engagement hooks: ${(strategy.engagement_hooks || []).join(', ') || 'surprising facts'}
Challenge strategy: ${strategy.challenge_strategy || 'start accessible'}
Encouragement style: ${strategy.encouragement_style || 'specific praise'}
Attention recovery: ${strategy.attention_recovery_strategy || 'switch to fresh question'}
Mistake handling: ${strategy.mistake_handling_strategy || 'normalize, shrink step, retry'}

═══ STUDENT PROFILE ═══
Personality: ${ctx.personality_summary || 'Not yet assessed'}
Learning style: ${ctx.learning_preferences_summary || 'Not yet assessed'}
Interests: ${ctx.interest_summary || 'Still discovering'}
Motivation: ${ctx.motivational_summary || 'Curiosity-driven'}

═══ HIDDEN TEACHING PLAN (do NOT reveal this to the student) ═══
Topic: ${plan.topic_detected || 'general'}
Concept: ${plan.concept_to_teach || 'exploration'}
Strategy: ${plan.teaching_strategy || 'ask_to_discover'}
Intent: ${plan.mentor_intent || 'engage and teach'}
Personalization: ${plan.personalization_notes || 'standard'}
Hook: ${plan.engagement_hook || 'surprising fact'}
Difficulty: ${plan.difficulty_level || 'moderate'}
Length: ${plan.response_length || 'medium'}
${plan.suggest_break ? '\nIMPORTANT: Warmly suggest a break. The student has been working hard.\n' : ''}

═══ OUTPUT RULES ═══
1. NEVER output JSON, labels, or metadata. Write natural language only.
2. Use ${name}'s name naturally (not every sentence).
3. Use markdown for structure: **bold** for key terms, bullet lists, numbered steps.
4. End with a question or prompt that invites the student to think/respond.
5. Keep the hidden plan invisible — teach through conversation, not lectures.
6. Match the response length to the plan (short = 2-4 sentences, medium = 1-2 paragraphs, long = 2-3 paragraphs).
7. Use the engagement hook naturally.
8. If the student seems frustrated, lead with encouragement before teaching.
9. If the student seems bored, increase energy and surprise.
10. Never say "Great question!" as the first words. Vary your openings.
11. Weave in real-world connections from their interests when possible.
12. If suggesting a break, do it warmly and naturally, not abruptly.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    ...recentConvo,
  ];

  return messages;
}

// ─── ROLLING UPDATE HELPER ───
function rollingUpdate(current: number, observed: number, weight: number): number {
  return current * (1 - weight) + observed * weight;
}

// ─── UPDATE AVATAR FROM TURN ───
async function updateAvatarFromTurn(db: any, studentId: string, plan: any) {
  if (!studentId || !plan) return;

  const obs = plan.avatar_update_observations || {};
  const ea = plan.engagement_assessment || {};

  try {
    // 1. Engagement profile updates
    if (ea.student_seems) {
      const engagementMap: Record<string, Partial<{ frustration_indicator: number; boredom_indicator: number }>> = {
        frustrated: { frustration_indicator: 0.8 },
        confused: { frustration_indicator: 0.5 },
        bored: { boredom_indicator: 0.8 },
        neutral: {},
        engaged: { frustration_indicator: 0.1, boredom_indicator: 0.1 },
        curious: { frustration_indicator: 0.05, boredom_indicator: 0.05 },
      };
      const signals = engagementMap[ea.student_seems] || {};
      if (Object.keys(signals).length > 0) {
        const { data: current } = await db.from('student_engagement_profiles').select('frustration_indicator, boredom_indicator, total_minutes').eq('student_id', studentId).maybeSingle();
        if (current) {
          const updates: Record<string, number> = {};
          if (signals.frustration_indicator !== undefined) updates.frustration_indicator = rollingUpdate(current.frustration_indicator || 0.3, signals.frustration_indicator, 0.05);
          if (signals.boredom_indicator !== undefined) updates.boredom_indicator = rollingUpdate(current.boredom_indicator || 0.3, signals.boredom_indicator, 0.05);
          updates.total_minutes = (current.total_minutes || 0) + 1;
          await db.from('student_engagement_profiles').update(updates).eq('student_id', studentId);
        }
      }
    }

    // 2. Mastery record updates
    const domains = plan.domains_touched || [];
    for (const domain of domains) {
      const confidenceBoost = ea.confidence_level === 'high' ? 0.008 : ea.confidence_level === 'medium' ? 0.004 : 0.002;
      const { data: existing } = await db.from('student_mastery_records').select('mastery_estimate, model_confidence').eq('student_id', studentId).eq('domain', domain).eq('subskill', '').maybeSingle();
      if (existing) {
        await db.from('student_mastery_records').update({
          mastery_estimate: Math.min(1, existing.mastery_estimate + confidenceBoost),
          model_confidence: Math.min(1, (existing.model_confidence || 0.5) + 0.005),
          updated_at: new Date().toISOString(),
        }).eq('student_id', studentId).eq('domain', domain).eq('subskill', '');
      }
    }

    // 3. Motivational profile updates
    if (obs.motivation_signals?.length > 0) {
      const { data: motiv } = await db.from('student_motivational_profiles').select('*').eq('student_id', studentId).maybeSingle();
      if (motiv) {
        const updates: Record<string, number> = {};
        for (const sig of obs.motivation_signals) {
          if (sig.includes('humor')) updates.responds_to_humor = rollingUpdate(motiv.responds_to_humor || 0.5, 0.8, 0.08);
          if (sig.includes('challenge')) updates.responds_to_challenge = rollingUpdate(motiv.responds_to_challenge || 0.5, 0.8, 0.08);
          if (sig.includes('curiosity') || sig.includes('deep_dive')) updates.responds_to_autonomy = rollingUpdate(motiv.responds_to_autonomy || 0.5, 0.8, 0.08);
          if (sig.includes('story')) updates.responds_to_story_context = rollingUpdate(motiv.responds_to_story_context || 0.5, 0.8, 0.08);
          if (sig.includes('real_world')) updates.responds_to_real_world = rollingUpdate(motiv.responds_to_real_world || 0.5, 0.8, 0.08);
        }
        if (Object.keys(updates).length > 0) {
          await db.from('student_motivational_profiles').update(updates).eq('student_id', studentId);
        }
      }
    }

    // 4. Interest profile updates
    if (obs.interest_signals?.length > 0) {
      for (const topic of obs.interest_signals) {
        await db.from('student_interests').upsert({
          student_id: studentId,
          topic,
          weight: 0.6,
          source: 'mentor_observation',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'student_id,topic' });
      }
    }

    // 5. Strengths
    if (obs.mastery_signals?.length > 0) {
      for (const skill of obs.mastery_signals) {
        await db.from('student_strengths').upsert({
          student_id: studentId,
          skill,
          evidence_count: 1,
          source: 'mentor_observation',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'student_id,skill' }).catch(() => {});
      }
    }

    // 6. Growth evidence
    if (domains.length > 0) {
      for (const domain of domains) {
        await db.from('student_growth').insert({
          student_id: studentId,
          domain,
          evidence: plan.concept_to_teach || plan.topic_detected || 'exploration',
          source: 'mentor_chat',
          created_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

  } catch (err) {
    console.error('Avatar update error (non-fatal):', err);
  }
}

// ─── STORE EVERYTHING (Phase 3) ───
async function storeEverything(
  db: any,
  studentId: string | null,
  userId: string | null,
  sessionId: string,
  studentMessage: string,
  mentorResponse: string,
  plan: any,
  studentContext: any,
  sessionState: any,
  adaptationSignals: any,
  turnNumber: number,
) {
  if (!studentId) return;

  const now = new Date().toISOString();
  const writes: Promise<any>[] = [];

  // 1. Chat messages (student + mentor)
  writes.push(
    db.from('chat_messages').insert([
      { student_id: studentId, session_id: sessionId, role: 'user', content: studentMessage, created_at: now },
      { student_id: studentId, session_id: sessionId, role: 'assistant', content: mentorResponse, created_at: now },
    ])
  );

  // 2. Mentor plan
  writes.push(
    db.from('mentor_plans').insert({
      student_id: studentId,
      session_id: sessionId,
      plan_json: plan,
      turn_number: turnNumber,
      created_at: now,
    })
  );

  // 3. Session context snapshot
  writes.push(
    db.from('session_context_snapshots').insert({
      student_id: studentId,
      session_id: sessionId,
      turn_number: turnNumber,
      student_context_json: studentContext,
      planning_output_json: plan,
      adaptation_signals_json: adaptationSignals,
      session_state_json: sessionState,
      created_at: now,
    })
  );

  // 4. Behavior event
  writes.push(
    db.from('student_behavior_events').insert({
      student_id: studentId,
      session_id: sessionId,
      event_type: 'chat_turn',
      event_data: {
        topic: plan.topic_detected,
        strategy: plan.teaching_strategy,
        engagement: plan.engagement_assessment?.student_seems,
        domains: plan.domains_touched,
      },
      turn_number: turnNumber,
      session_minutes: sessionState?.sessionMinutes || 0,
      created_at: now,
    })
  );

  // 5. Lesson memory update
  writes.push(updateLessonMemory(db, studentId, plan));

  // 6. Learning session update
  if (sessionId) {
    writes.push(
      db.from('learning_sessions').upsert({
        id: sessionId,
        student_id: studentId,
        user_id: userId,
        topics_covered: [plan.topic_detected].filter(Boolean),
        elapsed_minutes: sessionState?.sessionMinutes || 0,
        normalized_topic: plan.topic_detected || 'general',
        turn_count: turnNumber,
        updated_at: now,
      }, { onConflict: 'id' })
    );
  }

  // 7. Session skill tracking
  if (sessionId && plan.domains_touched?.length > 0) {
    writes.push(
      db.from('session_skill_tracking').upsert({
        session_id: sessionId,
        student_id: studentId,
        domains_touched: plan.domains_touched,
        topic_progression: [plan.topic_detected].filter(Boolean),
        conversation_turns: turnNumber,
        updated_at: now,
      }, { onConflict: 'session_id' })
    );
  }

  // 8. Lesson history
  writes.push(
    db.from('lesson_history').insert({
      student_id: studentId,
      session_id: sessionId,
      topic: plan.topic_detected || 'general',
      domains: plan.domains_touched || [],
      strategy: plan.teaching_strategy || 'ask_to_discover',
      xp_earned: plan.xp_award || 5,
      created_at: now,
    }).catch(() => {})
  );

  // 9. Avatar updates (rolling)
  writes.push(updateAvatarFromTurn(db, studentId, plan));

  // 10. Legacy student_avatar sync
  writes.push(
    db.from('student_avatar').update({
      last_avatar_update_at: now,
      total_updates: undefined, // Will be incremented via RPC or trigger
    }).eq('student_id', studentId).catch(() => {})
  );

  // 11. Avatar update log
  writes.push(
    db.from('avatar_update_log').insert({
      student_id: studentId,
      source: 'mentor_chat',
      changes: {
        turn: turnNumber,
        topic: plan.topic_detected,
        domains: plan.domains_touched,
        observations: plan.avatar_update_observations,
        engagement: plan.engagement_assessment,
      },
      created_at: now,
    }).catch(() => {})
  );

  // Execute all writes in parallel (non-blocking)
  await Promise.allSettled(writes);
}

async function updateLessonMemory(db: any, studentId: string, plan: any) {
  const { data: existing } = await db.from('lesson_memory').select('*').eq('student_id', studentId).maybeSingle();

  const concepts = existing?.covered_concepts || [];
  const vocab = existing?.vocabulary || [];
  const loops = existing?.open_loops || [];

  if (plan.concept_to_teach && !concepts.includes(plan.concept_to_teach)) {
    concepts.push(plan.concept_to_teach);
  }
  if (plan.topic_detected && !concepts.includes(plan.topic_detected)) {
    concepts.push(plan.topic_detected);
  }

  // Cap arrays
  const cappedConcepts = concepts.slice(-100);
  const cappedVocab = vocab.slice(-100);
  const cappedLoops = loops.slice(-20);

  if (existing) {
    await db.from('lesson_memory').update({
      covered_concepts: cappedConcepts,
      vocabulary: cappedVocab,
      open_loops: cappedLoops,
      updated_at: new Date().toISOString(),
    }).eq('student_id', studentId);
  } else {
    await db.from('lesson_memory').insert({
      student_id: studentId,
      covered_concepts: cappedConcepts,
      vocabulary: cappedVocab,
      open_loops: cappedLoops,
    });
  }
}

// ─── MAIN HANDLER ───
serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body = await req.json();
    const {
      messages: conversationHistory = [],
      studentProfile = {},
      studentId = null,
      sessionId: incomingSessionId = null,
      userId = null,
      sessionMinutes = 0,
      studentContext = null,
      sessionState = null,
      adaptationSignals = null,
    } = body;

    const db = getSupabaseAdmin();

    // Get the student's latest message
    const lastMsg = conversationHistory[conversationHistory.length - 1];
    const studentMessage = lastMsg?.text || lastMsg?.content || '';

    // ─── SAFETY CHECK ───
    const safety = checkSafety(studentMessage);
    if (!safety.safe) {
      return new Response(JSON.stringify({
        message: safety.response,
        plan: { topic: 'safety', domains: [], strategy: 'safety_response' },
        nextChoices: [
          { label: "Let's learn something cool", description: "Pick a topic to explore" },
          { label: "Tell me a fun fact", description: "Something surprising" },
        ],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── SESSION MANAGEMENT ───
    let sessionId = incomingSessionId;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      if (studentId) {
        await db.from('learning_sessions').insert({
          id: sessionId,
          student_id: studentId,
          user_id: userId,
          started_at: new Date().toISOString(),
          topics_covered: [],
          elapsed_minutes: 0,
        }).catch(() => {});
      }
    }

    // ─── LOAD DB CONTEXT ───
    const dbContext = await loadDBContext(db, studentId, sessionId);

    // ─── PHASE 1: HIDDEN PLANNING (gpt-4o-mini) ───
    const planningMessages = buildPlanningPrompt(
      studentMessage, studentContext, sessionState, adaptationSignals, dbContext, conversationHistory,
    );

    let plan: any;
    try {
      const planRaw = await callOpenAI(planningMessages, {
        model: 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });
      plan = parseJSON(planRaw);
    } catch (err) {
      console.error('Planning call failed, using fallback plan:', err);
      plan = {
        topic_detected: 'general',
        domains_touched: ['critical_thinking'],
        concept_to_teach: 'exploration',
        teaching_strategy: 'ask_to_discover',
        mentor_intent: 'Engage the student in a curious conversation about their topic.',
        personalization_notes: 'Use a warm, encouraging tone.',
        engagement_hook: 'surprising_fact',
        difficulty_level: 'moderate',
        response_length: 'medium',
        next_choices: [
          { label: 'Tell me more', description: 'Go deeper' },
          { label: 'Try something different', description: 'Switch topics' },
          { label: 'Give me a challenge', description: 'Test what I know' },
        ],
        avatar_update_observations: { engagement_signals: [], interest_signals: [], mastery_signals: [], motivation_signals: [] },
        engagement_assessment: { student_seems: 'neutral', confidence_level: 'medium' },
        suggest_break: false,
        xp_award: 5,
      };
    }

    // ─── PHASE 2: VISIBLE MENTOR RESPONSE (gpt-4o) ───
    const mentorMessages = buildMentorPrompt(plan, studentContext, conversationHistory, studentProfile);
    let mentorResponse: string;
    try {
      mentorResponse = await callOpenAI(mentorMessages, {
        model: 'gpt-4o',
        temperature: 0.85,
        max_tokens: 1200,
      });
    } catch (err) {
      console.error('Mentor call failed:', err);
      mentorResponse = "Hmm, I got a little lost in thought there! Could you say that again? I want to make sure I give you a great answer.";
    }

    // ─── PHASE 3: BACKGROUND STORAGE (non-blocking) ───
    const turnNumber = (sessionState?.turnNumber || 0) + 1;

    // Fire and forget — don't block the response
    storeEverything(
      db, studentId, userId, sessionId, studentMessage, mentorResponse,
      plan, studentContext, sessionState, adaptationSignals, turnNumber,
    ).catch(err => console.error('Background storage error:', err));

    // Build skills tracked map for frontend
    const skillsTracked: Record<string, number> = {};
    for (const d of (plan.domains_touched || [])) {
      skillsTracked[d] = (skillsTracked[d] || 0) + 1;
    }

    return new Response(JSON.stringify({
      message: mentorResponse,
      plan: {
        topic: plan.topic_detected,
        intent: plan.mentor_intent,
        strategy: plan.teaching_strategy,
        concept: plan.concept_to_teach,
        domains: plan.domains_touched || [],
        personalization: plan.personalization_notes ? { notes: plan.personalization_notes } : null,
        engagementAssessment: plan.engagement_assessment || null,
      },
      nextChoices: plan.next_choices || [],
      sessionId,
      turnNumber,
      skillsTracked,
      xpEarned: plan.xp_award || 5,
      breakSuggested: plan.suggest_break || false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('mentor-chat error:', err);
    return new Response(JSON.stringify({
      error: err.message || 'Internal error',
      message: "Oops! I had a little brain freeze. Could you try that again?",
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
