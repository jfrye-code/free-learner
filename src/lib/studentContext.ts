/**
 * Student Context Object Compiler (v3)
 *
 * Transforms the 10-domain Student Avatar into a compact,
 * high-signal Student Context JSON that the AI receives for every lesson.
 *
 * This is NOT a raw data dump — it produces distilled, AI-ready summaries
 * with explicit instructional strategies derived from personality-to-behavior
 * mapping rules.
 *
 * Primary input: NormalizedAvatar (10 domain tables including identity_profile)
 * Fallback: legacy StudentAvatar monolithic JSONB
 *
 * Architecture:
 *   Raw assessment results → Normalized Avatar domains (source of truth)
 *   → Derived metrics (support_flags, instructional_strategy)
 *   → AI-ready Student Context (this output)
 *
 * The avatar is NEVER static — rolling updates + confidence-weighted changes
 * happen after every meaningful interaction via update-student-avatar.
 */

import type {
  NormalizedAvatar,
  NormalizedIdentity,
  NormalizedPersonality,
  NormalizedLearningPrefs,
  NormalizedInterests,
  NormalizedAptitude,
  NormalizedEngagement,
  NormalizedMasteryRecord,
  NormalizedMotivation,
  NormalizedSupport,
  NormalizedAIInstruction,
  StudentAvatar,
} from '@/hooks/useStudentAvatar';


// ═══════════════════════════════════════════════════════════════
//  STUDENT CONTEXT — the exact shape sent to the AI
// ═══════════════════════════════════════════════════════════════

export interface StudentContext {
  student_context: {
    identity: {
      student_id: string;
      preferred_name: string;
      grade_band: string;
      timezone: string;
    };
    current_state: {
      subject: string;
      lesson: string;
      mastery_level: 'emerging' | 'developing' | 'proficient' | 'advanced';
      recent_performance: {
        accuracy: number;
        hint_usage_rate: number;
        retry_rate: number;
        completion_rate: number;
      };
      struggle_points: string[];
      confidence_estimate: number;
      boredom_risk: number;
      frustration_risk: number;
    };
    personality_summary: string;
    learning_preferences_summary: string;
    interest_summary: string;
    aptitude_summary: string;
    engagement_summary: string;
    motivational_summary: string;
    support_flags: {
      needs_shorter_lessons: boolean;
      needs_confidence_support: boolean;
      needs_more_variety: boolean;
      needs_advanced_challenge: boolean;
    };
    instructional_strategy: {
      tone: string;
      pacing: string;
      explanation_style: string;
      example_types: string[];
      engagement_hooks: string[];
      challenge_strategy: string;
      encouragement_style: string;
      attention_recovery_strategy: string;
      mistake_handling_strategy: string;
    };
  };
}

// ═══════════════════════════════════════════════════════════════
//  SESSION STATE — tracked client-side, sent with each message
// ═══════════════════════════════════════════════════════════════

export interface SessionState {
  turnNumber: number;
  sessionMinutes: number;
  avgResponseTimeMs: number;
  lastResponseTimeMs: number;
  consecutiveCorrect: number;
  consecutiveStruggle: number;
  hintsUsed: number;
  retriesThisTurn: number;
  totalRetries: number;
  skippedContent: number;
  engagementScore: number;
  frustrationSignals: number;
  boredomSignals: number;
  curiositySignals: number;
  topicsExplored: string[];
  currentChunkIndex: number;
  totalChunks: number;
  lastStrategy: string | null;
  breaksTaken: number;
  messagesSinceBreak: number;
  teachingFormatsUsed: string[];
  teachingFormatSuccess: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════
//  INPUT TYPES
// ═══════════════════════════════════════════════════════════════

export interface StudentIdentityInput {
  student_id: string;
  preferred_name: string;
  grade_band: string;
  timezone: string;
}

export interface CurrentLessonInput {
  subject?: string;
  lesson?: string;
}

export interface SessionMetricsInput {
  accuracy?: number;
  hint_usage_rate?: number;
  retry_rate?: number;
  completion_rate?: number;
}

// ═══════════════════════════════════════════════════════════════
//  COMPILE STUDENT CONTEXT (main entry point)
// ═══════════════════════════════════════════════════════════════

export function compileStudentContext(
  normalized: NormalizedAvatar,
  legacyAvatar: StudentAvatar | null,
  identity: StudentIdentityInput,
  lesson: CurrentLessonInput = {},
  sessionMetrics: SessionMetricsInput = {},
): StudentContext {
  // Prefer normalized data, fall back to legacy
  const ni = normalized.identity;
  const pp = normalized.personality;
  const lp = normalized.learningPrefs;
  const ip = normalized.interests;
  const ap = normalized.aptitude;
  const ep = normalized.engagement;
  const mr = normalized.masteryRecords || [];
  const mp = normalized.motivation;
  const sf = normalized.support;
  const ai = normalized.aiInstruction;

  const hasNormalized = !!(pp || lp || ip || ap || ep || mp);

  // If no normalized data, try to build from legacy
  if (!hasNormalized && legacyAvatar) {
    return buildFromLegacy(legacyAvatar, identity, lesson, sessionMetrics);
  }

  // If no data at all, return minimal context
  if (!hasNormalized && !legacyAvatar) {
    return buildMinimal(identity, lesson, sessionMetrics);
  }

  // Resolve identity: prefer normalized identity_profile, fall back to explicit param
  const resolvedIdentity: StudentIdentityInput = {
    student_id: identity.student_id,
    preferred_name: ni?.preferred_name || identity.preferred_name,
    grade_band: ni?.grade_band || identity.grade_band,
    timezone: ni?.timezone || identity.timezone,
  };

  return {
    student_context: {
      identity: {
        student_id: resolvedIdentity.student_id,
        preferred_name: resolvedIdentity.preferred_name,
        grade_band: resolvedIdentity.grade_band,
        timezone: resolvedIdentity.timezone,
      },
      current_state: buildCurrentState(mr, ap, ep, lesson, sessionMetrics),
      personality_summary: buildPersonalitySummary(pp),
      learning_preferences_summary: buildLearningPrefsSummary(lp),
      interest_summary: buildInterestSummary(ip),
      aptitude_summary: buildAptitudeSummary(ap),
      engagement_summary: buildEngagementSummary(ep),
      motivational_summary: buildMotivationalSummary(mp),
      support_flags: buildSupportFlags(sf, pp, ep, ap, mr),
      instructional_strategy: buildInstructionalStrategy(ai, pp, lp, ep, mp, sf, ip),
    },
  };
}


// ═══════════════════════════════════════════════════════════════
//  CURRENT STATE
// ═══════════════════════════════════════════════════════════════

function buildCurrentState(
  mr: NormalizedMasteryRecord[],
  ap: NormalizedAptitude | null,
  ep: NormalizedEngagement | null,
  lesson: CurrentLessonInput,
  metrics: SessionMetricsInput,
): StudentContext['student_context']['current_state'] {
  // Determine mastery level from records
  const domainRecords = mr.filter(r => !r.subskill || r.subskill === '');
  const avgMastery = domainRecords.length > 0
    ? domainRecords.reduce((sum, r) => sum + (r.mastery_estimate || 0), 0) / domainRecords.length
    : 0;

  let mastery_level: 'emerging' | 'developing' | 'proficient' | 'advanced' = 'emerging';
  if (avgMastery > 0.8) mastery_level = 'advanced';
  else if (avgMastery > 0.6) mastery_level = 'proficient';
  else if (avgMastery > 0.3) mastery_level = 'developing';

  // Struggle points from mastery records + aptitude
  const struggle_points: string[] = [];
  for (const r of mr) {
    if (r.gap_flag && r.concepts_struggling?.length > 0) {
      struggle_points.push(...r.concepts_struggling.slice(0, 2));
    }
  }
  if (ap?.frustration_points) {
    struggle_points.push(...ap.frustration_points.filter(p => !struggle_points.includes(p)));
  }

  // Confidence estimate from aptitude
  const confidence_estimate = ap
    ? clamp(
        ((ap.verbal_reasoning_estimate || 0.5) +
         (ap.quantitative_reasoning_estimate || 0.5) +
         (ap.problem_solving_persistence || 0.5) +
         (ap.challenge_tolerance || 0.5)) / 4,
        0, 1
      )
    : 0.5;

  // Risk scores from engagement
  const boredom_risk = ep?.boredom_indicator ?? 0.3;
  const frustration_risk = ep?.frustration_indicator ?? 0.3;

  return {
    subject: lesson.subject || 'integrated',
    lesson: lesson.lesson || '',
    mastery_level,
    recent_performance: {
      accuracy: metrics.accuracy ?? 0.7,
      hint_usage_rate: metrics.hint_usage_rate ?? (ep?.hint_usage_rate ?? 0.2),
      retry_rate: metrics.retry_rate ?? 0.15,
      completion_rate: metrics.completion_rate ?? (ep?.completion_rate ?? 0.8),
    },
    struggle_points: struggle_points.slice(0, 5),
    confidence_estimate: round2(confidence_estimate),
    boredom_risk: round2(boredom_risk),
    frustration_risk: round2(frustration_risk),
  };
}

// ═══════════════════════════════════════════════════════════════
//  PERSONALITY SUMMARY
// ═══════════════════════════════════════════════════════════════

function buildPersonalitySummary(pp: NormalizedPersonality | null): string {
  if (!pp) return 'Not yet assessed.';
  if (pp.narrative_summary) return pp.narrative_summary;

  const traits: string[] = [];

  if (pp.curiosity_exploration_score > 0.7) traits.push('highly curious');
  else if (pp.curiosity_exploration_score > 0.5) traits.push('moderately curious');

  if (pp.openness_score > 0.7) traits.push('open to new ideas');
  if (pp.conscientiousness_score > 0.7) traits.push('organized and detail-oriented');
  else if (pp.conscientiousness_score < 0.35) traits.push('spontaneous, may need structure');

  if (pp.extraversion_score > 0.7) traits.push('socially energized');
  else if (pp.extraversion_score < 0.35) traits.push('reflective and independent');
  else traits.push('moderately independent');

  if (pp.emotional_sensitivity_score > 0.7) traits.push('emotionally sensitive');
  if (pp.persistence_score > 0.7) traits.push('persistent through challenges');
  else if (pp.persistence_score < 0.35) traits.push('may disengage when frustrated');

  if (pp.creativity_orientation_score > 0.7) traits.push('creative thinker');

  // Derive encouragement style
  if (pp.emotional_sensitivity_score > 0.6) {
    traits.push('benefits from calm confidence-building encouragement');
  } else if (pp.confidence_volatility_score > 0.6) {
    traits.push('benefits from steady encouragement');
  }

  return traits.length > 0
    ? capitalizeFirst(traits.join(', ')) + '.'
    : 'Personality still being assessed.';
}

// ═══════════════════════════════════════════════════════════════
//  LEARNING PREFERENCES SUMMARY
// ═══════════════════════════════════════════════════════════════

function buildLearningPrefsSummary(lp: NormalizedLearningPrefs | null): string {
  if (!lp) return 'Not yet assessed.';
  if (lp.narrative_summary) return lp.narrative_summary;

  const modalities = [
    { name: 'visual', w: lp.visual_weight },
    { name: 'interactive', w: lp.interactive_weight },
    { name: 'auditory', w: lp.auditory_weight },
    { name: 'reading', w: lp.reading_weight },
  ].sort((a, b) => b.w - a.w);

  const parts: string[] = [];

  // Primary modality
  const top = modalities.filter(m => m.w > 0.6);
  if (top.length > 0) {
    parts.push(`Prefers ${top.map(m => m.name).join(', ')}`);
  }

  // Pacing
  const pacing = lp.short_burst_weight > lp.deep_focus_weight
    ? 'shorter segments'
    : lp.deep_focus_weight > lp.short_burst_weight
      ? 'deep focus sessions'
      : 'moderate-length segments';
  parts.push(pacing);

  // Autonomy
  if (lp.independent_weight > 0.65) parts.push('with some autonomy');
  else if (lp.guided_weight > 0.65) parts.push('with guided structure');

  return parts.length > 0
    ? capitalizeFirst(parts.join(', ')) + '.'
    : 'Learning preferences still being assessed.';
}

// ═══════════════════════════════════════════════════════════════
//  INTEREST SUMMARY
// ═══════════════════════════════════════════════════════════════

function buildInterestSummary(ip: NormalizedInterests | null): string {
  if (!ip) return 'Still discovering interests.';
  if (ip.narrative_summary) return ip.narrative_summary;

  const domains = [
    { name: 'music', w: ip.art_music_design_weight },
    { name: 'building', w: ip.building_engineering_weight },
    { name: 'technology', w: ip.technology_gaming_weight },
    { name: 'science', w: ip.science_investigation_weight },
    { name: 'stories and creativity', w: ip.stories_creativity_weight },
    { name: 'nature', w: ip.nature_environment_weight },
    { name: 'history and culture', w: ip.history_culture_weight },
    { name: 'social and people', w: ip.people_social_weight },
    { name: 'leadership', w: ip.leadership_business_weight },
    { name: 'systems and order', w: ip.order_systems_weight },
    { name: 'sports and movement', w: ip.movement_sports_weight },
    { name: 'practical life skills', w: ip.practical_life_skills_weight },
  ].filter(d => (d.w || 0) > 0.55).sort((a, b) => (b.w || 0) - (a.w || 0));

  const parts: string[] = [];

  if (domains.length > 0) {
    parts.push(`Strong interest in ${domains.slice(0, 4).map(d => d.name).join(', ')}`);
  }

  if (ip.curiosity_triggers?.length > 0) {
    parts.push(`and real-world problem solving`);
  }

  if (ip.goals_and_dreams?.length > 0) {
    parts.push(`Dreams: ${ip.goals_and_dreams.slice(0, 2).join(', ')}`);
  }

  return parts.length > 0
    ? capitalizeFirst(parts.join('. ')) + '.'
    : 'Still discovering interests.';
}

// ═══════════════════════════════════════════════════════════════
//  APTITUDE SUMMARY
// ═══════════════════════════════════════════════════════════════

function buildAptitudeSummary(ap: NormalizedAptitude | null): string {
  if (!ap) return 'Not yet assessed.';
  if (ap.baseline_readiness_summary) return ap.baseline_readiness_summary;

  const parts: string[] = [];

  // Reasoning strengths
  const strong: string[] = [];
  const moderate: string[] = [];
  const developing: string[] = [];

  if (ap.pattern_recognition_estimate > 0.7) strong.push('pattern recognition');
  else if (ap.pattern_recognition_estimate > 0.45) moderate.push('pattern recognition');
  else developing.push('pattern recognition');

  if (ap.quantitative_reasoning_estimate > 0.7) strong.push('quantitative reasoning');
  else if (ap.quantitative_reasoning_estimate > 0.45) moderate.push('quantitative reasoning');

  if (ap.verbal_reasoning_estimate > 0.7) strong.push('verbal reasoning');
  else if (ap.verbal_reasoning_estimate < 0.4) developing.push('verbal expression');

  // Grade-level estimates
  const levels: string[] = [];
  if (ap.logic_level_estimate) levels.push(`logic ${ap.logic_level_estimate}`);
  if (ap.math_level_estimate) levels.push(`math ${ap.math_level_estimate}`);
  if (ap.reading_level_estimate) levels.push(`reading ${ap.reading_level_estimate}`);

  if (strong.length > 0) parts.push(`Strong ${strong.join(' and ')}`);
  if (moderate.length > 0) parts.push(`decent ${moderate.join(', ')} readiness`);
  if (developing.length > 0) parts.push(`weaker ${developing.join(', ')} confidence`);

  if (ap.confidence_pattern) parts.push(ap.confidence_pattern);

  return parts.length > 0
    ? capitalizeFirst(parts.join(', ')) + '.'
    : 'Aptitude still being assessed.';
}

// ═══════════════════════════════════════════════════════════════
//  ENGAGEMENT SUMMARY
// ═══════════════════════════════════════════════════════════════

function buildEngagementSummary(ep: NormalizedEngagement | null): string {
  if (!ep) return 'New student, no engagement data yet.';

  const parts: string[] = [];

  // Session patterns
  if (ep.total_sessions > 0) {
    parts.push(`${ep.total_sessions} sessions, avg ${Math.round(ep.average_session_duration_minutes || 0)} min`);
  }

  // What works
  const engagers: string[] = [];
  if (ep.engagement_boosters?.length > 0) {
    engagers.push(...ep.engagement_boosters.slice(0, 3));
  }
  // Infer from data
  if ((ep.boredom_threshold_minutes || 20) < 15) engagers.push('fast momentum');
  if (ep.preferred_content_type === 'interactive_micro_chunks') engagers.push('low-friction interaction');

  if (engagers.length > 0) {
    parts.push(`Engages best with ${engagers.join(', ')}`);
  }

  // What doesn't work
  if (ep.drop_off_patterns?.length > 0) {
    parts.push(`drops off with ${ep.drop_off_patterns.slice(0, 2).join(', ')}`);
  }

  // Concrete examples
  if (ep.completion_rate > 0.85) parts.push('high completion rate');
  else if (ep.completion_rate < 0.6) parts.push('lower completion rate');

  return parts.length > 0
    ? capitalizeFirst(parts.join('. ')) + '.'
    : 'Engagement patterns still forming.';
}

// ═══════════════════════════════════════════════════════════════
//  MOTIVATIONAL SUMMARY
// ═══════════════════════════════════════════════════════════════

function buildMotivationalSummary(mp: NormalizedMotivation | null): string {
  if (!mp) return 'Primary driver: curiosity (default).';
  if (mp.narrative_summary) return mp.narrative_summary;

  const parts: string[] = [];

  // What they respond to
  const responds: string[] = [];
  if ((mp.responds_to_autonomy || 0) > 0.65) responds.push('autonomy');
  if ((mp.responds_to_encouragement || 0) > 0.65) responds.push('encouragement');
  if ((mp.responds_to_challenge || 0) > 0.65) responds.push('challenge');
  if ((mp.responds_to_gamification || 0) > 0.65) responds.push('gamification');
  if ((mp.responds_to_humor || 0) > 0.65) responds.push('humor');
  if ((mp.responds_to_real_world || 0) > 0.65) responds.push('real-world connections');
  if ((mp.responds_to_story_context || 0) > 0.65) responds.push('stories');

  if (responds.length > 0) {
    parts.push(`Responds especially well to ${responds.join(', ')}`);
  }

  // Early wins pattern
  if ((mp.responds_to_encouragement || 0) > 0.6 && (mp.responds_to_challenge || 0) > 0.5) {
    parts.push('and early wins before challenge ramps');
  }

  // Driver
  if (mp.primary_motivation_driver) {
    parts.push(`Primary driver: ${mp.primary_motivation_driver}`);
  }

  return parts.length > 0
    ? capitalizeFirst(parts.join('. ')) + '.'
    : 'Motivational profile still forming.';
}

// ═══════════════════════════════════════════════════════════════
//  SUPPORT FLAGS (derived, not just raw booleans)
// ═══════════════════════════════════════════════════════════════

function buildSupportFlags(
  sf: NormalizedSupport | null,
  pp: NormalizedPersonality | null,
  ep: NormalizedEngagement | null,
  ap: NormalizedAptitude | null,
  mr: NormalizedMasteryRecord[],
): StudentContext['student_context']['support_flags'] {
  let needs_shorter_lessons = false;
  let needs_confidence_support = false;
  let needs_more_variety = false;
  let needs_advanced_challenge = false;

  // From explicit support flags
  if (sf) {
    needs_shorter_lessons = sf.needs_frequent_breaks || sf.needs_slower_pace || false;
    needs_confidence_support = sf.needs_encouragement || sf.possible_anxiety || sf.gets_frustrated_easily || false;
    needs_advanced_challenge = sf.gifted_indicators || false;
  }

  // Infer from personality
  if (pp) {
    if (pp.conscientiousness_score < 0.35) needs_shorter_lessons = true;
    if (pp.emotional_sensitivity_score > 0.65 || pp.confidence_volatility_score > 0.6) needs_confidence_support = true;
    if (pp.openness_score > 0.7 || pp.curiosity_exploration_score > 0.75) needs_more_variety = true;
  }

  // Infer from engagement
  if (ep) {
    if ((ep.boredom_threshold_minutes || 20) < 15) needs_shorter_lessons = true;
    if (ep.boredom_indicator > 0.55) needs_more_variety = true;
    if (ep.attention_span_estimate === 'short') needs_shorter_lessons = true;
  }

  // Infer from aptitude
  if (ap) {
    if (ap.challenge_tolerance < 0.4) needs_confidence_support = true;
  }

  // Infer from mastery
  const avgMastery = mr.length > 0
    ? mr.filter(r => !r.subskill).reduce((s, r) => s + r.mastery_estimate, 0) / mr.filter(r => !r.subskill).length
    : 0;
  if (avgMastery > 0.8) needs_advanced_challenge = true;

  return {
    needs_shorter_lessons,
    needs_confidence_support,
    needs_more_variety,
    needs_advanced_challenge,
  };
}

// ═══════════════════════════════════════════════════════════════
//  INSTRUCTIONAL STRATEGY (personality-to-behavior mapping)
// ═══════════════════════════════════════════════════════════════

function buildInstructionalStrategy(
  ai: NormalizedAIInstruction | null,
  pp: NormalizedPersonality | null,
  lp: NormalizedLearningPrefs | null,
  ep: NormalizedEngagement | null,
  mp: NormalizedMotivation | null,
  sf: NormalizedSupport | null,
  ip: NormalizedInterests | null,
): StudentContext['student_context']['instructional_strategy'] {
  // ─── TONE ───
  let tone = ai?.preferred_tone || 'warm, encouraging';
  if (pp) {
    if (pp.emotional_sensitivity_score > 0.65) {
      tone = 'warm, intelligent, encouraging, not childish';
    } else if (pp.extraversion_score > 0.7) {
      tone = 'energetic, enthusiastic, encouraging';
    } else if (pp.openness_score > 0.7) {
      tone = 'curious, exploratory, warm';
    }
  }
  if (sf?.gets_frustrated_easily) tone = 'calm, patient, encouraging';
  if (sf?.gifted_indicators) tone = 'intellectually stimulating, warm, peer-like';

  // ─── PACING ───
  let pacing = ai?.pacing || 'moderate';
  if (pp && pp.conscientiousness_score < 0.35) pacing = 'short chunks with quick wins';
  if (ep && (ep.boredom_threshold_minutes || 20) < 15) pacing = 'short chunks with quick wins';
  if (ep && ep.attention_span_estimate === 'short') pacing = 'short chunks with quick wins';
  if (sf?.needs_frequent_breaks) pacing = 'very short chunks with frequent checkpoints';
  if (sf?.gifted_indicators && pp && pp.persistence_score > 0.7) pacing = 'fast, deep exploration';

  // ─── EXPLANATION STYLE ───
  let explanation_style = 'concrete first, then deeper insight';
  if (lp) {
    if (lp.interactive_weight > 0.7) explanation_style = 'interactive discovery, then synthesis';
    else if (lp.visual_weight > 0.7) explanation_style = 'visual metaphors and diagrams first, then explanation';
    else if (lp.reading_weight > 0.7) explanation_style = 'structured text with clear progression';
    else if (lp.prefers_examples_first) explanation_style = 'concrete examples first, then abstract principle';
    else if (lp.prefers_theory_first) explanation_style = 'principle first, then concrete examples';
  }

  // ─── EXAMPLE TYPES (from interests) ───
  const example_types: string[] = [];
  if (ip) {
    const interestMap: [string, number][] = [
      ['music', ip.art_music_design_weight || 0],
      ['making', ip.building_engineering_weight || 0],
      ['real-world systems', ip.order_systems_weight || 0],
      ['technology and gaming', ip.technology_gaming_weight || 0],
      ['science experiments', ip.science_investigation_weight || 0],
      ['stories and narrative', ip.stories_creativity_weight || 0],
      ['nature and environment', ip.nature_environment_weight || 0],
      ['sports and movement', ip.movement_sports_weight || 0],
      ['history and culture', ip.history_culture_weight || 0],
    ];
    interestMap
      .filter(([, w]) => w > 0.6)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .forEach(([name]) => example_types.push(name));
  }
  if (example_types.length === 0) example_types.push('real-world systems', 'everyday life');

  // ─── ENGAGEMENT HOOKS ───
  const engagement_hooks: string[] = [];
  if (mp) {
    if ((mp.responds_to_humor || 0) > 0.6) engagement_hooks.push('humor');
    if ((mp.responds_to_challenge || 0) > 0.6) engagement_hooks.push('what would happen if');
    if ((mp.responds_to_real_world || 0) > 0.6) engagement_hooks.push('real-world connections');
    if ((mp.responds_to_story_context || 0) > 0.6) engagement_hooks.push('compelling stories');
  }
  if (pp) {
    if (pp.curiosity_exploration_score > 0.7) engagement_hooks.push('surprising facts');
    if (pp.openness_score > 0.7 && !engagement_hooks.includes('what would happen if')) {
      engagement_hooks.push('how it works');
    }
  }
  if (engagement_hooks.length === 0) engagement_hooks.push('surprising facts', 'how it works', 'what would happen if');

  // ─── CHALLENGE STRATEGY ───
  let challenge_strategy = ai?.challenge_level || 'start accessible, then increase complexity';
  if (sf?.gifted_indicators) challenge_strategy = 'start at grade level, rapidly increase to advanced';
  if (pp && pp.persistence_score < 0.35) challenge_strategy = 'start very accessible, increase slowly';
  if (pp && pp.openness_score > 0.7) challenge_strategy = 'start accessible, then offer optional deeper dives';

  // ─── ENCOURAGEMENT STYLE ───
  let encouragement_style = ai?.encouragement_style || 'specific praise for reasoning and persistence';
  if (pp) {
    if (pp.emotional_sensitivity_score > 0.65) {
      encouragement_style = 'gentle, specific praise for effort and reasoning';
    } else if (pp.persistence_score > 0.7) {
      encouragement_style = 'acknowledge persistence, celebrate breakthroughs';
    }
  }
  if (sf?.needs_encouragement) encouragement_style = 'frequent, warm, specific praise for every step forward';

  // ─── ATTENTION RECOVERY ───
  let attention_recovery_strategy = ai?.attention_recovery_strategy || 'switch to a fresh question or concrete example';
  if (mp && (mp.responds_to_humor || 0) > 0.65) {
    attention_recovery_strategy = 'use humor or a surprising fact to reset';
  } else if (pp && pp.openness_score > 0.7) {
    attention_recovery_strategy = 'introduce a surprising angle or "what if" scenario';
  } else if (mp && (mp.responds_to_challenge || 0) > 0.65) {
    attention_recovery_strategy = 'pose a quick challenge or puzzle';
  }

  // ─── MISTAKE HANDLING ───
  let mistake_handling_strategy = ai?.error_response || 'normalize, shrink the step, try again';
  if (sf?.gets_frustrated_easily) {
    mistake_handling_strategy = 'normalize completely, break into tiny steps, celebrate each micro-win';
  } else if (pp && pp.persistence_score > 0.7) {
    mistake_handling_strategy = 'ask a Socratic question to guide self-correction';
  } else if (pp && pp.openness_score > 0.7) {
    mistake_handling_strategy = 'reframe as discovery — "interesting, let\'s explore why"';
  }

  return {
    tone,
    pacing,
    explanation_style,
    example_types: example_types.slice(0, 4),
    engagement_hooks: engagement_hooks.slice(0, 4),
    challenge_strategy,
    encouragement_style,
    attention_recovery_strategy,
    mistake_handling_strategy,
  };
}

// ═══════════════════════════════════════════════════════════════
//  LEGACY FALLBACK
// ═══════════════════════════════════════════════════════════════

function buildFromLegacy(
  avatar: StudentAvatar,
  identity: StudentIdentityInput,
  lesson: CurrentLessonInput,
  metrics: SessionMetricsInput,
): StudentContext {
  const pp = avatar.personality_profile || {};
  const lp = avatar.learning_preference_profile || {};
  const ip = avatar.interest_profile || {};
  const ap = avatar.aptitude_profile || {};
  const ep = avatar.engagement_profile || {};
  const mp = avatar.mastery_profile || {};
  const mvp = avatar.motivational_profile || {};
  const sf = avatar.support_flags || {};
  const aip = avatar.ai_instruction_profile || {};

  // Personality summary
  const pTraits: string[] = [];
  if ((pp.openness || 0) > 0.7) pTraits.push('curious and exploratory');
  if ((pp.conscientiousness || 0) < 0.35) pTraits.push('spontaneous');
  if ((pp.persistence_trait || 0) > 0.7) pTraits.push('persistent');
  if ((pp.neuroticism || 0) > 0.6) pTraits.push('benefits from calm encouragement');
  const personality_summary = pTraits.length > 0 ? capitalizeFirst(pTraits.join(', ')) + '.' : 'Not yet assessed.';

  // Learning prefs
  const modalities = [
    { name: 'visual', s: lp.visual || 0 },
    { name: 'interactive', s: lp.kinesthetic || 0 },
    { name: 'auditory', s: lp.auditory || 0 },
    { name: 'reading', s: lp.reading_writing || 0 },
  ].sort((a, b) => b.s - a.s);
  const learning_preferences_summary = `Prefers ${modalities[0].name} learning, ${lp.preferred_pace || 'moderate'} pace.`;

  // Interest summary
  const topTopics = (ip.topics || []).sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 4).map((t: any) => t.name);
  const interest_summary = topTopics.length > 0 ? `Strong interest in ${topTopics.join(', ')}.` : 'Still discovering interests.';

  // Aptitude
  const strongApt: string[] = [];
  const weakApt: string[] = [];
  for (const [key, val] of Object.entries(ap)) {
    if (typeof val === 'object' && val?.level > 0.65) strongApt.push(key.replace(/_/g, ' '));
    if (typeof val === 'object' && val?.level < 0.4 && val?.confidence > 0) weakApt.push(key.replace(/_/g, ' '));
  }
  const aptitude_summary = [
    strongApt.length > 0 ? `Strong ${strongApt.join(', ')}` : '',
    weakApt.length > 0 ? `weaker ${weakApt.join(', ')} confidence` : '',
  ].filter(Boolean).join(', ') || 'Not yet assessed.';

  // Engagement
  const engagement_summary = ep.session_count > 0
    ? `${ep.session_count} sessions, avg ${Math.round(ep.avg_session_minutes || 0)} min. Attention: ${ep.attention_span_estimate || 'moderate'}.`
    : 'New student.';

  // Motivation
  const motivational_summary = `Primary driver: ${mvp.primary_driver || 'curiosity'}.`;

  // Mastery level
  const domains = mp.domains || {};
  const domainLevels = Object.values(domains).map((d: any) => d.progress || 0);
  const avgProgress = domainLevels.length > 0 ? domainLevels.reduce((a: number, b: number) => a + b, 0) / domainLevels.length : 0;
  let mastery_level: 'emerging' | 'developing' | 'proficient' | 'advanced' = 'emerging';
  if (avgProgress > 0.8) mastery_level = 'advanced';
  else if (avgProgress > 0.6) mastery_level = 'proficient';
  else if (avgProgress > 0.3) mastery_level = 'developing';

  return {
    student_context: {
      identity: {
        student_id: identity.student_id,
        preferred_name: identity.preferred_name,
        grade_band: identity.grade_band,
        timezone: identity.timezone,
      },
      current_state: {
        subject: lesson.subject || 'integrated',
        lesson: lesson.lesson || '',
        mastery_level,
        recent_performance: {
          accuracy: metrics.accuracy ?? 0.7,
          hint_usage_rate: metrics.hint_usage_rate ?? 0.2,
          retry_rate: metrics.retry_rate ?? 0.15,
          completion_rate: metrics.completion_rate ?? 0.8,
        },
        struggle_points: (mp.concepts_struggling || []).slice(0, 5),
        confidence_estimate: round2((ap.overall_confidence || 0.5)),
        boredom_risk: round2(ep.boredom_indicator || 0.3),
        frustration_risk: round2(ep.frustration_indicator || 0.3),
      },
      personality_summary,
      learning_preferences_summary,
      interest_summary,
      aptitude_summary,
      engagement_summary,
      motivational_summary,
      support_flags: {
        needs_shorter_lessons: sf.needs_frequent_breaks || (pp.conscientiousness || 0.5) < 0.35,
        needs_confidence_support: sf.needs_encouragement || sf.gets_frustrated_easily || false,
        needs_more_variety: (pp.openness || 0.5) > 0.7 || (ep.boredom_indicator || 0) > 0.55,
        needs_advanced_challenge: sf.gifted_indicators || avgProgress > 0.8,
      },
      instructional_strategy: {
        tone: aip.preferred_tone || 'warm, encouraging',
        pacing: aip.pacing || 'moderate',
        explanation_style: aip.lesson_framing || 'concrete first, then deeper insight',
        example_types: aip.example_types || ['real-world systems'],
        engagement_hooks: ['surprising facts', 'how it works'],
        challenge_strategy: aip.challenge_level || 'start accessible, then increase complexity',
        encouragement_style: aip.encouragement_style || 'specific praise for reasoning and persistence',
        attention_recovery_strategy: aip.attention_recovery_strategy || 'switch to a fresh question or concrete example',
        mistake_handling_strategy: aip.error_response || 'normalize, shrink the step, try again',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  MINIMAL CONTEXT (no avatar data at all)
// ═══════════════════════════════════════════════════════════════

function buildMinimal(
  identity: StudentIdentityInput,
  lesson: CurrentLessonInput,
  metrics: SessionMetricsInput,
): StudentContext {
  return {
    student_context: {
      identity: {
        student_id: identity.student_id,
        preferred_name: identity.preferred_name,
        grade_band: identity.grade_band,
        timezone: identity.timezone,
      },
      current_state: {
        subject: lesson.subject || 'integrated',
        lesson: lesson.lesson || '',
        mastery_level: 'emerging',
        recent_performance: {
          accuracy: metrics.accuracy ?? 0.7,
          hint_usage_rate: metrics.hint_usage_rate ?? 0.2,
          retry_rate: metrics.retry_rate ?? 0.15,
          completion_rate: metrics.completion_rate ?? 0.8,
        },
        struggle_points: [],
        confidence_estimate: 0.5,
        boredom_risk: 0.3,
        frustration_risk: 0.3,
      },
      personality_summary: 'Not yet assessed.',
      learning_preferences_summary: 'Not yet assessed.',
      interest_summary: 'Still discovering interests.',
      aptitude_summary: 'Not yet assessed.',
      engagement_summary: 'New student, no engagement data yet.',
      motivational_summary: 'Primary driver: curiosity (default).',
      support_flags: {
        needs_shorter_lessons: false,
        needs_confidence_support: false,
        needs_more_variety: false,
        needs_advanced_challenge: false,
      },
      instructional_strategy: {
        tone: 'warm, intelligent, encouraging, not childish',
        pacing: 'moderate',
        explanation_style: 'concrete first, then deeper insight',
        example_types: ['real-world systems', 'everyday life'],
        engagement_hooks: ['surprising facts', 'how it works', 'what would happen if'],
        challenge_strategy: 'start accessible, then increase complexity',
        encouragement_style: 'specific praise for reasoning and persistence',
        attention_recovery_strategy: 'switch to a fresh question or concrete example',
        mistake_handling_strategy: 'normalize, shrink the step, try again',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  CREATE INITIAL SESSION STATE
// ═══════════════════════════════════════════════════════════════

export function createSessionState(): SessionState {
  return {
    turnNumber: 0,
    sessionMinutes: 0,
    avgResponseTimeMs: 0,
    lastResponseTimeMs: 0,
    consecutiveCorrect: 0,
    consecutiveStruggle: 0,
    hintsUsed: 0,
    retriesThisTurn: 0,
    totalRetries: 0,
    skippedContent: 0,
    engagementScore: 0.7,
    frustrationSignals: 0,
    boredomSignals: 0,
    curiositySignals: 0,
    topicsExplored: [],
    currentChunkIndex: 0,
    totalChunks: 0,
    lastStrategy: null,
    breaksTaken: 0,
    messagesSinceBreak: 0,
    teachingFormatsUsed: [],
    teachingFormatSuccess: {},
  };
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
