// ═══════════════════════════════════════════════════════════════
//  build-student-avatar — Onboarding Avatar Creation
//  Writes to ALL 10 normalized domain tables + legacy sync
//  AI synthesis via OpenAI gpt-4o-mini
//  DEPLOY: Copy to supabase/functions/build-student-avatar/index.ts
// ═══════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/db.ts';
import { callOpenAI, parseJSON } from '../_shared/openai.ts';

// ─── INTEREST → DOMAIN WEIGHT MAPPING ───
const INTEREST_DOMAIN_MAP: Record<string, Record<string, number>> = {
  'Science': { science_investigation_weight: 0.8, building_engineering_weight: 0.3 },
  'Technology': { technology_gaming_weight: 0.8, building_engineering_weight: 0.4 },
  'Engineering': { building_engineering_weight: 0.8, order_systems_weight: 0.4 },
  'Math': { order_systems_weight: 0.6, science_investigation_weight: 0.3 },
  'Art': { art_music_design_weight: 0.8, stories_creativity_weight: 0.4 },
  'Music': { art_music_design_weight: 0.8 },
  'Reading': { stories_creativity_weight: 0.7, history_culture_weight: 0.3 },
  'Writing': { stories_creativity_weight: 0.7 },
  'History': { history_culture_weight: 0.8, people_social_weight: 0.3 },
  'Nature': { nature_environment_weight: 0.8, science_investigation_weight: 0.4 },
  'Sports': { movement_sports_weight: 0.8 },
  'Gaming': { technology_gaming_weight: 0.8, building_engineering_weight: 0.3 },
  'Cooking': { practical_life_skills_weight: 0.7, science_investigation_weight: 0.3 },
  'Animals': { nature_environment_weight: 0.8, science_investigation_weight: 0.4 },
  'Space': { science_investigation_weight: 0.8, technology_gaming_weight: 0.3 },
  'Dinosaurs': { science_investigation_weight: 0.7, history_culture_weight: 0.4 },
  'Robots': { technology_gaming_weight: 0.8, building_engineering_weight: 0.6 },
  'Business': { leadership_business_weight: 0.8, people_social_weight: 0.4 },
  'Leadership': { leadership_business_weight: 0.7, people_social_weight: 0.5 },
  'Social': { people_social_weight: 0.8 },
};

function mapInterestsToDomainWeights(interests: string[]): Record<string, number> {
  const weights: Record<string, number> = {
    science_investigation_weight: 0.3, building_engineering_weight: 0.3,
    stories_creativity_weight: 0.3, people_social_weight: 0.3,
    leadership_business_weight: 0.3, order_systems_weight: 0.3,
    nature_environment_weight: 0.3, technology_gaming_weight: 0.3,
    history_culture_weight: 0.3, art_music_design_weight: 0.3,
    movement_sports_weight: 0.3, practical_life_skills_weight: 0.3,
  };
  for (const interest of interests) {
    const mapping = INTEREST_DOMAIN_MAP[interest];
    if (mapping) {
      for (const [key, val] of Object.entries(mapping)) {
        weights[key] = Math.min(1, Math.max(weights[key] || 0, val));
      }
    }
  }
  return weights;
}

// ─── SCORE PERSONALITY ANSWERS ───
function scorePersonality(answers: any[]): Record<string, number> {
  const traits: Record<string, number[]> = {};
  for (const a of answers) {
    if (a.traits) {
      for (const [trait, score] of Object.entries(a.traits)) {
        if (!traits[trait]) traits[trait] = [];
        traits[trait].push(score as number);
      }
    }
  }
  const scores: Record<string, number> = {};
  for (const [trait, values] of Object.entries(traits)) {
    scores[trait] = values.reduce((s, v) => s + v, 0) / values.length;
  }
  return scores;
}

// ─── SCORE LEARNING PREF ANSWERS ───
function scoreLearningPrefs(answers: any[]): Record<string, number> {
  const traits: Record<string, number[]> = {};
  for (const a of answers) {
    if (a.traits) {
      for (const [trait, score] of Object.entries(a.traits)) {
        if (!traits[trait]) traits[trait] = [];
        traits[trait].push(score as number);
      }
    }
  }
  const scores: Record<string, number> = {};
  for (const [trait, values] of Object.entries(traits)) {
    scores[trait] = values.reduce((s, v) => s + v, 0) / values.length;
  }
  return scores;
}

// ─── AI SYNTHESIS ───
async function synthesizeAvatar(
  basicInfo: any, personalityScores: Record<string, number>,
  learningScores: Record<string, number>, interests: string[],
  strengths: string[], aptitudeResults: Record<string, number>,
): Promise<any> {
  const prompt = `You are an educational psychologist AI. Given a student's onboarding assessment data, produce a holistic synthesis.

STUDENT DATA:
- Name: ${basicInfo.name}, Age: ${basicInfo.age}, Grade: ${basicInfo.gradeLevel}
- Personality scores: ${JSON.stringify(personalityScores)}
- Learning preference scores: ${JSON.stringify(learningScores)}
- Interests: ${interests.join(', ')}
- Self-reported strengths: ${strengths.join(', ')}
- Aptitude results: ${JSON.stringify(aptitudeResults)}

Produce a JSON object with these fields:
{
  "personality_narrative": "2-3 sentence natural language summary of personality",
  "learning_narrative": "2-3 sentence summary of learning preferences",
  "interest_narrative": "2-3 sentence summary of interests and curiosity patterns",
  "aptitude_narrative": "2-3 sentence summary of academic readiness",
  "motivation_narrative": "2-3 sentence summary of what motivates this student",
  "support_flags": {
    "needs_extra_scaffolding": boolean,
    "gets_frustrated_easily": boolean,
    "needs_frequent_breaks": boolean,
    "needs_encouragement": boolean,
    "needs_slower_pace": boolean,
    "needs_visual_aids": boolean,
    "needs_repetition": boolean,
    "needs_simpler_language": boolean,
    "possible_learning_difference": boolean,
    "possible_attention_difficulty": boolean,
    "possible_anxiety": boolean,
    "gifted_indicators": boolean,
    "twice_exceptional_indicators": boolean,
    "ell_support_needed": boolean
  },
  "instruction_profile": {
    "preferred_tone": "string",
    "pacing": "string",
    "example_types": ["string"],
    "lesson_framing": "string",
    "chunk_size": "string",
    "encouragement_style": "string",
    "challenge_level": "string",
    "scaffolding_level": "string",
    "review_timing": "string",
    "attention_recovery_strategy": "string",
    "vocabulary_level": "string",
    "humor_level": "string",
    "formality_level": "string",
    "question_frequency": "string",
    "wait_time": "string",
    "error_response": "string",
    "success_response": "string",
    "struggle_response": "string",
    "boredom_response": "string"
  },
  "primary_motivation_driver": "string",
  "secondary_motivation_driver": "string",
  "responds_to_encouragement": 0.0-1.0,
  "responds_to_challenge": 0.0-1.0,
  "responds_to_gamification": 0.0-1.0,
  "responds_to_story_context": 0.0-1.0,
  "responds_to_autonomy": 0.0-1.0,
  "responds_to_humor": 0.0-1.0,
  "responds_to_real_world": 0.0-1.0,
  "responds_to_social_accountability": 0.0-1.0
}`;

  try {
    const raw = await callOpenAI(
      [{ role: 'system', content: prompt }],
      { model: 'gpt-4o-mini', temperature: 0.4, max_tokens: 1500, response_format: { type: 'json_object' } },
    );
    return parseJSON(raw);
  } catch (err) {
    console.error('AI synthesis failed, using defaults:', err);
    return null;
  }
}

// ─── MAIN HANDLER ───
serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  try {
    const body = await req.json();
    const {
      studentId,
      basicInfo = {},
      personalityAnswers = [],
      learningPrefAnswers = [],
      interests = [],
      strengths = [],
      aptitudeResults = {},
      emergencyContact = null,
    } = body;

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'studentId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const db = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Score assessments
    const personalityScores = scorePersonality(personalityAnswers);
    const learningScores = scoreLearningPrefs(learningPrefAnswers);
    const domainWeights = mapInterestsToDomainWeights(interests);

    // AI synthesis
    const synthesis = await synthesizeAvatar(basicInfo, personalityScores, learningScores, interests, strengths, aptitudeResults);

    // Determine grade band
    const age = basicInfo.age || 10;
    const gradeBand = age <= 7 ? 'K-2' : age <= 10 ? '3-5' : age <= 13 ? '6-8' : '9-12';

    // ─── WRITE TO ALL 10 NORMALIZED TABLES ───

    // 1. Identity
    await db.from('student_identity_profiles').upsert({
      student_id: studentId,
      preferred_name: basicInfo.name,
      full_name: basicInfo.name,
      age: basicInfo.age,
      grade_level: basicInfo.gradeLevel,
      grade_band: gradeBand,
      timezone: 'America/Denver',
      language: basicInfo.language || 'en',
      country: basicInfo.country || null,
      communication_pref: basicInfo.communicationPref || 'text',
      onboarding_completed: true,
      onboarding_completed_at: now,
      profile_version: 1,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 2. Personality
    await db.from('student_personality_profiles').upsert({
      student_id: studentId,
      openness_score: personalityScores.openness || 0.5,
      conscientiousness_score: personalityScores.conscientiousness || 0.5,
      extraversion_score: personalityScores.extraversion || 0.5,
      agreeableness_score: personalityScores.agreeableness || 0.5,
      emotional_sensitivity_score: personalityScores.neuroticism || personalityScores.emotional_sensitivity || 0.5,
      curiosity_exploration_score: personalityScores.curiosity_drive || personalityScores.curiosity || 0.5,
      structure_self_discipline_score: personalityScores.conscientiousness || 0.5,
      sociability_collaboration_score: personalityScores.social_orientation || personalityScores.extraversion || 0.5,
      cooperativeness_score: personalityScores.agreeableness || 0.5,
      confidence_volatility_score: personalityScores.neuroticism || 0.4,
      risk_tolerance_score: personalityScores.risk_tolerance || 0.5,
      creativity_orientation_score: personalityScores.creativity_orientation || personalityScores.openness || 0.5,
      persistence_score: personalityScores.persistence_trait || personalityScores.persistence || 0.5,
      narrative_summary: synthesis?.personality_narrative || null,
      model_confidence: 0.6,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 3. Learning preferences
    await db.from('student_learning_preference_profiles').upsert({
      student_id: studentId,
      visual_weight: learningScores.visual || 0.5,
      reading_weight: learningScores.reading_writing || learningScores.reading || 0.5,
      auditory_weight: learningScores.auditory || 0.4,
      interactive_weight: learningScores.kinesthetic || learningScores.interactive || 0.5,
      guided_weight: learningScores.guided || 0.5,
      independent_weight: learningScores.independent || 0.5,
      reflective_weight: learningScores.reflective || 0.5,
      action_weight: learningScores.action || 0.5,
      short_burst_weight: learningScores.short_burst || 0.5,
      deep_focus_weight: learningScores.deep_focus || 0.5,
      preferred_content_type: 'interactive_micro_chunks',
      prefers_examples_first: (learningScores.examples_first || 0) > 0.5,
      prefers_theory_first: (learningScores.theory_first || 0) > 0.5,
      prefers_stories: (learningScores.stories || 0) > 0.5,
      prefers_challenges: (learningScores.challenges || 0) > 0.5,
      prefers_visuals: (learningScores.visual || 0) > 0.6,
      prefers_hands_on: (learningScores.kinesthetic || learningScores.interactive || 0) > 0.6,
      preferred_pace: 'moderate',
      narrative_summary: synthesis?.learning_narrative || null,
      model_confidence: 0.6,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 4. Interest profiles
    await db.from('student_interest_profiles').upsert({
      student_id: studentId,
      ...domainWeights,
      favorite_subjects: interests.slice(0, 5),
      least_favorite_subjects: [],
      curiosity_triggers: interests.slice(0, 3),
      demotivating_triggers: [],
      aspirational_interests: [],
      things_they_do_for_fun: interests,
      goals_and_dreams: [],
      narrative_summary: synthesis?.interest_narrative || null,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 5. Aptitude profiles
    const apt = aptitudeResults || {};
    await db.from('student_aptitude_profiles').upsert({
      student_id: studentId,
      reading_level_estimate: basicInfo.gradeLevel || 'grade_appropriate',
      writing_level_estimate: basicInfo.gradeLevel || 'grade_appropriate',
      math_level_estimate: basicInfo.gradeLevel || 'grade_appropriate',
      logic_level_estimate: basicInfo.gradeLevel || 'grade_appropriate',
      verbal_reasoning_estimate: apt.reading || apt.verbal || 0.5,
      quantitative_reasoning_estimate: apt.math || apt.quantitative || 0.5,
      pattern_recognition_estimate: apt.logic || apt.pattern || 0.5,
      memory_recall_estimate: apt.memory || 0.5,
      problem_solving_persistence: apt.persistence || personalityScores.persistence_trait || 0.5,
      response_speed_estimate: 0.5,
      confidence_pattern: null,
      frustration_points: [],
      challenge_tolerance: personalityScores.persistence_trait || 0.5,
      baseline_readiness_summary: synthesis?.aptitude_narrative || null,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 6. Engagement profiles (initialized)
    await db.from('student_engagement_profiles').upsert({
      student_id: studentId,
      average_session_duration_minutes: 0,
      total_sessions: 0,
      total_minutes: 0,
      drop_off_patterns: [],
      completion_rate: 0.8,
      reengagement_rate: 0.5,
      hint_usage_rate: 0.2,
      preferred_content_type: 'interactive_micro_chunks',
      streak_current: 0,
      streak_best: 0,
      streak_pattern: null,
      procrastination_indicator: 0.3,
      frustration_indicator: personalityScores.neuroticism ? personalityScores.neuroticism * 0.5 : 0.3,
      boredom_indicator: 0.3,
      disengagement_risk: 0.3,
      attention_span_estimate: personalityScores.conscientiousness > 0.6 ? 'long' : personalityScores.conscientiousness < 0.35 ? 'short' : 'moderate',
      frustration_tolerance: personalityScores.persistence_trait || 0.5,
      boredom_threshold_minutes: personalityScores.conscientiousness > 0.6 ? 25 : 15,
      engagement_boosters: [],
      engagement_killers: [],
      peak_engagement_time: null,
      last_session_at: null,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 7. Mastery records (8 domains initialized)
    const domains = ['math', 'science', 'reading', 'writing', 'reasoning', 'civics', 'arts', 'technology'];
    for (const domain of domains) {
      await db.from('student_mastery_records').upsert({
        student_id: studentId,
        domain,
        subskill: '',
        mastery_estimate: 0.2,
        pace_of_improvement: 0,
        retention_quality: 0.5,
        review_frequency_need: 'normal',
        strength_flag: false,
        gap_flag: false,
        total_xp: 0,
        level: 1,
        concepts_mastered: [],
        concepts_in_progress: [],
        concepts_struggling: [],
        updated_at: now,
      }, { onConflict: 'student_id,domain,subskill' });
    }

    // 8. Motivational profiles
    const motiv = synthesis || {};
    await db.from('student_motivational_profiles').upsert({
      student_id: studentId,
      responds_to_encouragement: motiv.responds_to_encouragement ?? 0.6,
      responds_to_challenge: motiv.responds_to_challenge ?? 0.5,
      responds_to_gamification: motiv.responds_to_gamification ?? 0.6,
      responds_to_story_context: motiv.responds_to_story_context ?? 0.5,
      responds_to_social_accountability: motiv.responds_to_social_accountability ?? 0.4,
      responds_to_autonomy: motiv.responds_to_autonomy ?? 0.5,
      responds_to_humor: motiv.responds_to_humor ?? 0.5,
      responds_to_real_world: motiv.responds_to_real_world ?? 0.5,
      primary_motivation_driver: motiv.primary_motivation_driver || 'curiosity',
      secondary_motivation_driver: motiv.secondary_motivation_driver || null,
      reward_sensitivity: 0.6,
      intrinsic_vs_extrinsic: 0.6,
      competition_response: 'moderate',
      goal_orientation: 'mastery',
      praise_effectiveness: 0.7,
      autonomy_need: personalityScores.openness > 0.6 ? 0.7 : 0.5,
      social_motivation: personalityScores.extraversion || 0.5,
      narrative_summary: synthesis?.motivation_narrative || null,
      model_confidence: 0.5,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 9. Support profiles
    const sf = synthesis?.support_flags || {};
    await db.from('student_support_profiles').upsert({
      student_id: studentId,
      needs_extra_scaffolding: sf.needs_extra_scaffolding || false,
      gets_frustrated_easily: sf.gets_frustrated_easily || false,
      needs_frequent_breaks: sf.needs_frequent_breaks || false,
      needs_encouragement: sf.needs_encouragement || false,
      needs_slower_pace: sf.needs_slower_pace || false,
      needs_visual_aids: sf.needs_visual_aids || false,
      needs_repetition: sf.needs_repetition || false,
      needs_simpler_language: sf.needs_simpler_language || false,
      possible_learning_difference: sf.possible_learning_difference || false,
      possible_attention_difficulty: sf.possible_attention_difficulty || false,
      possible_anxiety: sf.possible_anxiety || false,
      gifted_indicators: sf.gifted_indicators || false,
      twice_exceptional_indicators: sf.twice_exceptional_indicators || false,
      ell_support_needed: sf.ell_support_needed || false,
      notes: [],
      updated_at: now,
    }, { onConflict: 'student_id' });

    // 10. AI instruction profiles
    const ip = synthesis?.instruction_profile || {};
    await db.from('student_ai_instruction_profiles').upsert({
      student_id: studentId,
      preferred_tone: ip.preferred_tone || 'warm, encouraging',
      pacing: ip.pacing || 'moderate',
      example_types: ip.example_types || ['real-world'],
      lesson_framing: ip.lesson_framing || 'discovery',
      chunk_size: ip.chunk_size || 'medium',
      encouragement_style: ip.encouragement_style || 'specific_praise',
      challenge_level: ip.challenge_level || 'grade_appropriate',
      scaffolding_level: ip.scaffolding_level || 'moderate',
      review_timing: ip.review_timing || 'spaced',
      attention_recovery_strategy: ip.attention_recovery_strategy || 'topic_switch',
      vocabulary_level: ip.vocabulary_level || 'grade_appropriate',
      humor_level: ip.humor_level || 'moderate',
      formality_level: ip.formality_level || 'casual',
      question_frequency: ip.question_frequency || 'frequent',
      wait_time: ip.wait_time || 'moderate',
      error_response: ip.error_response || 'gentle_redirect',
      success_response: ip.success_response || 'celebrate_then_extend',
      struggle_response: ip.struggle_response || 'scaffold_down',
      boredom_response: ip.boredom_response || 'increase_novelty',
      model_confidence: 0.5,
      last_calibrated_at: now,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // ─── LEGACY SYNC ───
    await db.from('student_avatar').upsert({
      student_id: studentId,
      personality_profile: personalityScores,
      learning_preference_profile: learningScores,
      interest_profile: { topics: interests.map(i => ({ name: i, score: 0.7 })) },
      aptitude_profile: aptitudeResults,
      engagement_profile: { session_count: 0, avg_session_minutes: 0, attention_span_estimate: 'moderate', frustration_tolerance: 0.5 },
      mastery_profile: { domains: {} },
      motivational_profile: { primary_driver: motiv.primary_motivation_driver || 'curiosity' },
      support_flags: sf,
      ai_instruction_profile: ip,
      avatar_version: 1,
      total_updates: 0,
      onboarding_completed: true,
      onboarding_completed_at: now,
      updated_at: now,
    }, { onConflict: 'student_id' });

    // ─── ASSESSMENT RESULTS ───
    const assessmentTypes = [
      { type: 'personality', data: personalityAnswers, scores: personalityScores },
      { type: 'learning_preferences', data: learningPrefAnswers, scores: learningScores },
      { type: 'interests', data: interests, scores: domainWeights },
      { type: 'aptitude', data: aptitudeResults, scores: aptitudeResults },
    ];
    for (const at of assessmentTypes) {
      await db.from('student_assessment_results').insert({
        student_id: studentId,
        assessment_type: at.type,
        raw_data: at.data,
        scored_data: at.scores,
        created_at: now,
      }).catch(() => {});
    }

    // ─── AUDIT LOG ───
    await db.from('avatar_update_log').insert({
      student_id: studentId,
      source: 'onboarding',
      changes: { event: 'avatar_created', tables_written: 10, ai_synthesis: !!synthesis },
      created_at: now,
    }).catch(() => {});

    // ─── BEHAVIOR EVENT ───
    await db.from('student_behavior_events').insert({
      student_id: studentId,
      event_type: 'onboarding_completed',
      event_data: { interests_count: interests.length, strengths_count: strengths.length },
      created_at: now,
    }).catch(() => {});

    // ─── PROFILE VERSION UPDATE ───
    await db.from('student_profiles').update({ avatar_version: 1, updated_at: now }).eq('student_id', studentId).catch(() => {});

    return new Response(JSON.stringify({
      success: true,
      studentId,
      tablesWritten: 10,
      aiSynthesis: !!synthesis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('build-student-avatar error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
