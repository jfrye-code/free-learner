import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { compileStudentContext } from '@/lib/studentContext';
import type { StudentContext, StudentIdentityInput, CurrentLessonInput, SessionMetricsInput } from '@/lib/studentContext';

// ─── LEGACY MONOLITHIC AVATAR (backward compat) ───
export interface StudentAvatar {
  id: string;
  student_id: string;
  user_id: string;
  personality_profile: Record<string, any>;
  learning_preference_profile: Record<string, any>;
  interest_profile: Record<string, any>;
  aptitude_profile: Record<string, any>;
  engagement_profile: Record<string, any>;
  mastery_profile: Record<string, any>;
  motivational_profile: Record<string, any>;
  support_flags: Record<string, any>;
  ai_instruction_profile: Record<string, any>;
  avatar_version: number;
  total_updates: number;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  last_avatar_update_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── NORMALIZED DOMAIN PROFILES ───
export interface NormalizedIdentity {
  preferred_name: string | null;
  full_name: string | null;
  age: number | null;
  grade_level: string | null;
  grade_band: string | null;
  timezone: string;
  language: string;
  country: string | null;
  communication_pref: string;
  avatar_emoji: string | null;
  bio: string | null;
  enrollment_date: string | null;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  profile_version: number;
}


export interface NormalizedPersonality {
  openness_score: number;
  conscientiousness_score: number;
  extraversion_score: number;
  agreeableness_score: number;
  emotional_sensitivity_score: number;
  curiosity_exploration_score: number;
  structure_self_discipline_score: number;
  sociability_collaboration_score: number;
  cooperativeness_score: number;
  confidence_volatility_score: number;
  risk_tolerance_score: number;
  creativity_orientation_score: number;
  persistence_score: number;
  narrative_summary: string | null;
  model_confidence: number;
}

export interface NormalizedLearningPrefs {
  visual_weight: number;
  reading_weight: number;
  auditory_weight: number;
  interactive_weight: number;
  guided_weight: number;
  independent_weight: number;
  reflective_weight: number;
  action_weight: number;
  short_burst_weight: number;
  deep_focus_weight: number;
  preferred_content_type: string;
  prefers_examples_first: boolean;
  prefers_theory_first: boolean;
  prefers_stories: boolean;
  prefers_challenges: boolean;
  prefers_visuals: boolean;
  prefers_hands_on: boolean;
  preferred_pace: string;
  narrative_summary: string | null;
  model_confidence: number;
}

export interface NormalizedInterests {
  science_investigation_weight: number;
  building_engineering_weight: number;
  stories_creativity_weight: number;
  people_social_weight: number;
  leadership_business_weight: number;
  order_systems_weight: number;
  nature_environment_weight: number;
  technology_gaming_weight: number;
  history_culture_weight: number;
  art_music_design_weight: number;
  movement_sports_weight: number;
  practical_life_skills_weight: number;
  favorite_subjects: string[];
  least_favorite_subjects: string[];
  curiosity_triggers: string[];
  demotivating_triggers: string[];
  aspirational_interests: string[];
  things_they_do_for_fun: string[];
  goals_and_dreams: string[];
  narrative_summary: string | null;
}

export interface NormalizedAptitude {
  reading_level_estimate: string;
  writing_level_estimate: string;
  math_level_estimate: string;
  logic_level_estimate: string;
  verbal_reasoning_estimate: number;
  quantitative_reasoning_estimate: number;
  pattern_recognition_estimate: number;
  memory_recall_estimate: number;
  problem_solving_persistence: number;
  response_speed_estimate: number;
  confidence_pattern: string | null;
  frustration_points: string[];
  challenge_tolerance: number;
  baseline_readiness_summary: string | null;
}

export interface NormalizedEngagement {
  average_session_duration_minutes: number;
  total_sessions: number;
  total_minutes: number;
  drop_off_patterns: string[];
  completion_rate: number;
  reengagement_rate: number;
  hint_usage_rate: number;
  preferred_content_type: string;
  streak_current: number;
  streak_best: number;
  streak_pattern: string | null;
  procrastination_indicator: number;
  frustration_indicator: number;
  boredom_indicator: number;
  disengagement_risk: number;
  attention_span_estimate: string;
  frustration_tolerance: number;
  boredom_threshold_minutes: number;
  engagement_boosters: string[];
  engagement_killers: string[];
  peak_engagement_time: string | null;
  last_session_at: string | null;
}

export interface NormalizedMasteryRecord {
  record_id: string;
  domain: string;
  subskill: string;
  mastery_estimate: number;
  pace_of_improvement: number;
  retention_quality: number;
  review_frequency_need: string;
  strength_flag: boolean;
  gap_flag: boolean;
  total_xp: number;
  level: number;
  concepts_mastered: string[];
  concepts_in_progress: string[];
  concepts_struggling: string[];
}

export interface NormalizedMotivation {
  responds_to_encouragement: number;
  responds_to_challenge: number;
  responds_to_gamification: number;
  responds_to_story_context: number;
  responds_to_social_accountability: number;
  responds_to_autonomy: number;
  responds_to_humor: number;
  responds_to_real_world: number;
  primary_motivation_driver: string;
  secondary_motivation_driver: string | null;
  reward_sensitivity: number;
  intrinsic_vs_extrinsic: number;
  competition_response: string;
  goal_orientation: string;
  praise_effectiveness: number;
  autonomy_need: number;
  social_motivation: number;
  narrative_summary: string | null;
  model_confidence: number;
}

export interface NormalizedSupport {
  needs_extra_scaffolding: boolean;
  gets_frustrated_easily: boolean;
  needs_frequent_breaks: boolean;
  needs_encouragement: boolean;
  needs_slower_pace: boolean;
  needs_visual_aids: boolean;
  needs_repetition: boolean;
  needs_simpler_language: boolean;
  possible_learning_difference: boolean;
  possible_attention_difficulty: boolean;
  possible_anxiety: boolean;
  gifted_indicators: boolean;
  twice_exceptional_indicators: boolean;
  ell_support_needed: boolean;
  notes: any[];
}

export interface NormalizedAIInstruction {
  preferred_tone: string;
  pacing: string;
  example_types: string[];
  lesson_framing: string;
  chunk_size: string;
  encouragement_style: string;
  challenge_level: string;
  scaffolding_level: string;
  review_timing: string;
  attention_recovery_strategy: string;
  vocabulary_level: string;
  humor_level: string;
  formality_level: string;
  question_frequency: string;
  wait_time: string;
  error_response: string;
  success_response: string;
  struggle_response: string;
  boredom_response: string;
  model_confidence: number;
  last_calibrated_at: string;
}

export interface NormalizedAvatar {
  identity: NormalizedIdentity | null;
  personality: NormalizedPersonality | null;
  learningPrefs: NormalizedLearningPrefs | null;
  interests: NormalizedInterests | null;
  aptitude: NormalizedAptitude | null;
  engagement: NormalizedEngagement | null;
  masteryRecords: NormalizedMasteryRecord[];
  motivation: NormalizedMotivation | null;
  support: NormalizedSupport | null;
  aiInstruction: NormalizedAIInstruction | null;
}


// ─── HOOK INTERFACE ───
interface UseStudentAvatarReturn {
  avatar: StudentAvatar | null;
  normalized: NormalizedAvatar;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  refreshAvatar: () => Promise<void>;
  buildAvatar: (data: BuildAvatarData) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (data: UpdateAvatarData) => Promise<{ success: boolean; error?: string }>;
  getAIInstructionContext: () => AIInstructionContext | null;
  getStudentContext: (identity: StudentIdentityInput, lesson?: CurrentLessonInput, metrics?: SessionMetricsInput) => StudentContext;
}


export interface BuildAvatarData {
  studentId: string;
  basicInfo: {
    name: string; age: number; gradeLevel: string; gradeBand: string;
    language: string; country: string; communicationPref: string;
  };
  personalityAnswers: Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>;
  learningPrefAnswers: Array<{ questionId: string; selectedOption: number; traits: Record<string, number> }>;
  interests: string[];
  strengths: string[];
  aptitudeResults: Record<string, number>;
  emergencyContact?: { name: string; relation: string; phone: string; email: string };
}

export interface UpdateAvatarData {
  studentId: string;
  source: 'lesson_performance' | 'quiz_performance' | 'session_behavior' | 'mentor_observation' | 'self_report' | 'parent_input';
  observations: Record<string, any>;
}

export interface AIInstructionContext {
  tone: string; pacing: string; exampleTypes: string[]; lessonFraming: string;
  chunkSize: string; encouragementStyle: string; challengeLevel: string;
  scaffoldingLevel: string; reviewTiming: string; attentionRecovery: string;
  errorResponse: string; successResponse: string; struggleResponse: string;
  boredomResponse: string; humorLevel: string; formalityLevel: string;
  questionFrequency: string;
  personalitySummary: string; learningStyle: string;
  topInterests: string[]; topStrengths: string[];
  supportFlags: string[]; motivationDriver: string;
  attentionSpan: string; frustrationTolerance: number;
  domains: Record<string, { level: string; progress: number }>;
  vocabularyLevel: string;
}

interface StudentProfileInput {
  name: string; age: number; gradeLevel: string; gradeBand: string;
  interests: string[]; strengths: string[];
}

const emptyNormalized: NormalizedAvatar = {
  identity: null, personality: null, learningPrefs: null, interests: null,
  aptitude: null, engagement: null, masteryRecords: [],
  motivation: null, support: null, aiInstruction: null,
};


export function useStudentAvatar(): UseStudentAvatarReturn {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<StudentAvatar | null>(null);
  const [normalized, setNormalized] = useState<NormalizedAvatar>(emptyNormalized);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from both legacy and normalized tables
  const loadAvatar = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }

    try {
      setLoading(true);

      // First get student_id from students table
      const { data: studentRow } = await supabase
        .from('students')
        .select('student_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const studentId = studentRow?.student_id;

      // Load legacy avatar
      const { data: legacyData, error: legacyErr } = await supabase
        .from('student_avatar')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (legacyErr && legacyErr.code !== 'PGRST116') {
        setError(legacyErr.message);
      } else if (legacyData) {
        setAvatar(legacyData as StudentAvatar);
      }

      // Load normalized tables if we have a student_id
      if (studentId) {
        const [
          { data: identityData },
          { data: personality },
          { data: learningPrefs },
          { data: interests },
          { data: aptitude },
          { data: engagement },
          { data: masteryRecords },
          { data: motivation },
          { data: support },
          { data: aiInstruction },
        ] = await Promise.all([
          supabase.from('student_identity_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_personality_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_learning_preference_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_interest_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_aptitude_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_engagement_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_mastery_records').select('*').eq('student_id', studentId),
          supabase.from('student_motivational_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_support_profiles').select('*').eq('student_id', studentId).single(),
          supabase.from('student_ai_instruction_profiles').select('*').eq('student_id', studentId).single(),
        ]);

        setNormalized({
          identity: identityData as NormalizedIdentity | null,
          personality: personality as NormalizedPersonality | null,
          learningPrefs: learningPrefs as NormalizedLearningPrefs | null,
          interests: interests as NormalizedInterests | null,
          aptitude: aptitude as NormalizedAptitude | null,
          engagement: engagement as NormalizedEngagement | null,
          masteryRecords: (masteryRecords || []) as NormalizedMasteryRecord[],
          motivation: motivation as NormalizedMotivation | null,
          support: support as NormalizedSupport | null,
          aiInstruction: aiInstruction as NormalizedAIInstruction | null,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  }, [user?.id]);

  useEffect(() => { loadAvatar(); }, [loadAvatar]);

  const refreshAvatar = useCallback(async () => { await loadAvatar(); }, [loadAvatar]);

  const hasProfile = !!(avatar?.onboarding_completed || normalized.personality);

  const buildAvatar = useCallback(async (data: BuildAvatarData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke('build-student-avatar', { body: data });
      if (fnErr) return { success: false, error: fnErr.message };
      if (result?.error) return { success: false, error: result.error };
      await loadAvatar();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [loadAvatar]);

  const updateAvatar = useCallback(async (data: UpdateAvatarData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: result, error: fnErr } = await supabase.functions.invoke('update-student-avatar', { body: data });
      if (fnErr) return { success: false, error: fnErr.message };
      if (result?.error) return { success: false, error: result.error };
      await loadAvatar();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [loadAvatar]);

  // Build AI instruction context from normalized data (preferred) or legacy
  const getAIInstructionContext = useCallback((): AIInstructionContext | null => {
    const ai = normalized.aiInstruction;
    const pp = normalized.personality;
    const lp = normalized.learningPrefs;
    const ip = normalized.interests;
    const ep = normalized.engagement;
    const mr = normalized.masteryRecords;
    const mp = normalized.motivation;
    const sf = normalized.support;

    // If we have normalized data, use it
    if (ai) {
      const primaryModality = lp
        ? [
            { name: 'visual', score: lp.visual_weight },
            { name: 'auditory', score: lp.auditory_weight },
            { name: 'interactive', score: lp.interactive_weight },
            { name: 'reading_writing', score: lp.reading_weight },
          ].sort((a, b) => b.score - a.score)[0].name
        : 'balanced';

      const topInterests = ip?.favorite_subjects?.slice(0, 5) || [];

      const activeFlags: string[] = [];
      if (sf) {
        if (sf.needs_extra_scaffolding) activeFlags.push('needs extra scaffolding');
        if (sf.gets_frustrated_easily) activeFlags.push('gets frustrated easily');
        if (sf.needs_frequent_breaks) activeFlags.push('needs frequent breaks');
        if (sf.needs_encouragement) activeFlags.push('needs encouragement');
        if (sf.needs_visual_aids) activeFlags.push('needs visual aids');
        if (sf.needs_simpler_language) activeFlags.push('needs simpler language');
        if (sf.gifted_indicators) activeFlags.push('gifted indicators');
        if (sf.possible_anxiety) activeFlags.push('possible anxiety');
      }

      const domains: Record<string, { level: string; progress: number }> = {};
      for (const record of mr.filter(r => !r.subskill || r.subskill === '')) {
        const level = record.mastery_estimate > 0.8 ? 'advanced' :
          record.mastery_estimate > 0.6 ? 'proficient' :
          record.mastery_estimate > 0.3 ? 'developing' : 'emerging';
        domains[record.domain] = { level, progress: record.mastery_estimate };
      }

      return {
        tone: ai.preferred_tone,
        pacing: ai.pacing,
        exampleTypes: ai.example_types,
        lessonFraming: ai.lesson_framing,
        chunkSize: ai.chunk_size,
        encouragementStyle: ai.encouragement_style,
        challengeLevel: ai.challenge_level,
        scaffoldingLevel: ai.scaffolding_level,
        reviewTiming: ai.review_timing,
        attentionRecovery: ai.attention_recovery_strategy,
        errorResponse: ai.error_response,
        successResponse: ai.success_response,
        struggleResponse: ai.struggle_response,
        boredomResponse: ai.boredom_response,
        humorLevel: ai.humor_level,
        formalityLevel: ai.formality_level,
        questionFrequency: ai.question_frequency,
        personalitySummary: pp?.narrative_summary || `O:${((pp?.openness_score || 0) * 10).toFixed(0)} C:${((pp?.conscientiousness_score || 0) * 10).toFixed(0)} E:${((pp?.extraversion_score || 0) * 10).toFixed(0)} A:${((pp?.agreeableness_score || 0) * 10).toFixed(0)} P:${((pp?.persistence_score || 0) * 10).toFixed(0)}`,
        learningStyle: primaryModality,
        topInterests,
        topStrengths: [],
        supportFlags: activeFlags,
        motivationDriver: mp?.primary_motivation_driver || 'curiosity',
        attentionSpan: ep?.attention_span_estimate || 'moderate',
        frustrationTolerance: ep?.frustration_tolerance || 0.5,
        domains,
        vocabularyLevel: ai.vocabulary_level,
      };
    }

    // Fall back to legacy avatar
    if (!avatar) return null;
    const aip = avatar.ai_instruction_profile || {};
    const legacyPp = avatar.personality_profile || {};
    const legacyLp = avatar.learning_preference_profile || {};
    const legacyIp = avatar.interest_profile || {};
    const legacyEp = avatar.engagement_profile || {};
    const legacyMp = avatar.mastery_profile || {};
    const legacyMvp = avatar.motivational_profile || {};
    const legacySf = avatar.support_flags || {};

    const modalities = { visual: legacyLp.visual || 0, auditory: legacyLp.auditory || 0, kinesthetic: legacyLp.kinesthetic || 0, reading_writing: legacyLp.reading_writing || 0 };
    const primaryModality = Object.entries(modalities).sort((a, b) => b[1] - a[1])[0][0];
    const topInterests = (legacyIp.topics || []).sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 5).map((t: any) => t.name || t);
    const activeFlags = Object.entries(legacySf).filter(([key, val]) => val === true && key !== 'notes').map(([key]) => key.replace(/_/g, ' '));
    const domains: Record<string, { level: string; progress: number }> = {};
    if (legacyMp.domains) {
      for (const [domain, data] of Object.entries(legacyMp.domains as Record<string, any>)) {
        domains[domain] = { level: data.level || 'emerging', progress: data.progress || 0 };
      }
    }

    return {
      tone: aip.preferred_tone || 'warm_encouraging', pacing: aip.pacing || 'moderate',
      exampleTypes: aip.example_types || ['real_world'], lessonFraming: aip.lesson_framing || 'discovery',
      chunkSize: aip.chunk_size || 'medium', encouragementStyle: aip.encouragement_style || 'specific_praise',
      challengeLevel: aip.challenge_level || 'grade_appropriate', scaffoldingLevel: aip.scaffolding_level || 'moderate',
      reviewTiming: aip.review_timing || 'spaced', attentionRecovery: aip.attention_recovery_strategy || 'topic_switch',
      errorResponse: aip.error_response || 'gentle_redirect', successResponse: aip.success_response || 'celebrate_then_extend',
      struggleResponse: aip.struggle_response || 'scaffold_down', boredomResponse: aip.boredom_response || 'increase_novelty',
      humorLevel: aip.humor_level || 'moderate', formalityLevel: aip.formality_level || 'casual',
      questionFrequency: aip.question_frequency || 'frequent',
      personalitySummary: `O:${((legacyPp.openness || 0) * 10).toFixed(0)} C:${((legacyPp.conscientiousness || 0) * 10).toFixed(0)} E:${((legacyPp.extraversion || 0) * 10).toFixed(0)} A:${((legacyPp.agreeableness || 0) * 10).toFixed(0)} P:${((legacyPp.persistence_trait || 0) * 10).toFixed(0)}`,
      learningStyle: primaryModality, topInterests, topStrengths: [],
      supportFlags: activeFlags, motivationDriver: legacyMvp.primary_driver || 'curiosity',
      attentionSpan: legacyEp.attention_span_estimate || 'moderate',
      frustrationTolerance: legacyEp.frustration_tolerance || 0.5,
      domains, vocabularyLevel: aip.vocabulary_level || 'grade_appropriate',
    };
  }, [avatar, normalized]);

  const getStudentContext = useCallback((
    identity: StudentIdentityInput,
    lesson?: CurrentLessonInput,
    metrics?: SessionMetricsInput,
  ): StudentContext => {
    return compileStudentContext(normalized, avatar, identity, lesson, metrics);
  }, [avatar, normalized]);


  return {
    avatar, normalized, loading, error, hasProfile,
    refreshAvatar, buildAvatar, updateAvatar,
    getAIInstructionContext, getStudentContext,
  };
}
