/**
 * Real-Time Adaptation Engine
 * 
 * Tracks student behavior during a session and computes adaptation signals
 * that modify the AI's instructional approach in real-time.
 * 
 * Tracks: response speed, retries, hint usage, skip patterns,
 * frustration/boredom indicators, engagement trends.
 * 
 * Outputs: AdaptationSignals sent with each message to the AI.
 */

import type { SessionState } from './studentContext';

// ─── ADAPTATION SIGNALS (sent to AI with each message) ───

export interface AdaptationSignals {
  // Real-time adjustments the AI should make THIS turn
  difficulty_adjustment: 'increase' | 'decrease' | 'maintain';
  pacing_adjustment: 'speed_up' | 'slow_down' | 'maintain';
  explanation_adjustment: 'simplify' | 'deepen' | 'maintain';
  engagement_intervention: EngagementIntervention | null;
  encouragement_needed: boolean;
  scaffold_needed: boolean;
  challenge_needed: boolean;
  switch_format: boolean;
  suggest_break: boolean;
  // Context for why
  signals_detected: string[];
  confidence: number; // 0-1, how confident we are in these signals
}

export type EngagementIntervention = 
  | 'humor_break'
  | 'surprise_fact'
  | 'challenge_increase'
  | 'topic_switch'
  | 'movement_break'
  | 'story_hook'
  | 'creative_prompt'
  | 'real_world_connection'
  | 'early_win';

// ─── RESPONSE ANALYSIS ───

export interface ResponseAnalysis {
  responseTimeMs: number;
  messageLength: number;
  containsQuestion: boolean;
  containsConfusion: boolean;
  containsFrustration: boolean;
  containsExcitement: boolean;
  containsBoredom: boolean;
  isRetry: boolean;
  isSkip: boolean;
  isHintRequest: boolean;
  isTopicChange: boolean;
  isDeepDive: boolean;
}

// Patterns for detecting engagement signals in student messages
const CONFUSION_PATTERNS = [
  /i\s+don'?t\s+(understand|get\s+it|know)/i,
  /what\s+do\s+you\s+mean/i,
  /i'?m\s+(confused|lost|stuck)/i,
  /can\s+you\s+(explain|say\s+that)\s+(again|differently)/i,
  /huh\??/i,
  /what\??$/i,
  /i\s+don'?t\s+see\s+how/i,
  /that\s+doesn'?t\s+make\s+sense/i,
];

const FRUSTRATION_PATTERNS = [
  /this\s+is\s+(hard|difficult|impossible|stupid|dumb|boring)/i,
  /i\s+(can'?t|hate|give\s+up|quit)/i,
  /ugh+/i,
  /i'?m\s+(done|over\s+it|tired\s+of)/i,
  /this\s+sucks/i,
  /why\s+(is\s+this|do\s+i\s+have\s+to)/i,
  /forget\s+it/i,
  /whatever/i,
];

const EXCITEMENT_PATTERNS = [
  /that'?s?\s+(cool|awesome|amazing|wow|whoa|incredible|neat|sick)/i,
  /no\s+way!?/i,
  /really\?!?/i,
  /tell\s+me\s+more/i,
  /what\s+else/i,
  /i\s+(love|like)\s+(this|that|it)/i,
  /oh\s+wow/i,
  /that\s+makes\s+sense/i,
  /i\s+get\s+it/i,
  /ohhh/i,
];

const BOREDOM_PATTERNS = [
  /ok\.?$/i,
  /sure\.?$/i,
  /fine\.?$/i,
  /whatever\.?$/i,
  /^\.+$/,
  /idk/i,
  /i\s+guess/i,
  /can\s+we\s+do\s+something\s+else/i,
  /this\s+is\s+boring/i,
  /^(k|kk|ya|yea|yeah|yep|mhm)\.?$/i,
];

const HINT_PATTERNS = [
  /hint/i,
  /help\s+me/i,
  /give\s+me\s+a\s+clue/i,
  /i\s+need\s+help/i,
  /can\s+you\s+help/i,
  /i'?m\s+not\s+sure/i,
];

const SKIP_PATTERNS = [
  /skip/i,
  /next/i,
  /move\s+on/i,
  /something\s+else/i,
  /different\s+topic/i,
  /change\s+(the\s+)?subject/i,
];

const DEEP_DIVE_PATTERNS = [
  /why\s+(does|is|do|did|would|could)/i,
  /how\s+(does|is|do|did|would|could)\s+that\s+work/i,
  /tell\s+me\s+more\s+about/i,
  /what\s+happens\s+if/i,
  /go\s+deeper/i,
  /explain\s+more/i,
  /what\s+about/i,
  /but\s+what\s+if/i,
  /can\s+you\s+elaborate/i,
];

// ─── ANALYZE STUDENT RESPONSE ───

export function analyzeResponse(
  message: string,
  responseTimeMs: number,
  previousMessage?: string,
): ResponseAnalysis {
  const text = message.trim();
  
  return {
    responseTimeMs,
    messageLength: text.length,
    containsQuestion: /\?/.test(text),
    containsConfusion: CONFUSION_PATTERNS.some(p => p.test(text)),
    containsFrustration: FRUSTRATION_PATTERNS.some(p => p.test(text)),
    containsExcitement: EXCITEMENT_PATTERNS.some(p => p.test(text)),
    containsBoredom: BOREDOM_PATTERNS.some(p => p.test(text)),
    isRetry: previousMessage ? text.toLowerCase().includes(previousMessage.toLowerCase().substring(0, 20)) : false,
    isSkip: SKIP_PATTERNS.some(p => p.test(text)),
    isHintRequest: HINT_PATTERNS.some(p => p.test(text)),
    isTopicChange: SKIP_PATTERNS.some(p => p.test(text)) || /let'?s?\s+(talk|learn)\s+about/i.test(text),
    isDeepDive: DEEP_DIVE_PATTERNS.some(p => p.test(text)),
  };
}

// ─── UPDATE SESSION STATE ───

export function updateSessionState(
  state: SessionState,
  analysis: ResponseAnalysis,
  aiPlan?: any,
): SessionState {
  const newState = { ...state };
  
  newState.turnNumber += 1;
  newState.messagesSinceBreak += 1;
  
  // Update response time tracking
  newState.lastResponseTimeMs = analysis.responseTimeMs;
  if (newState.avgResponseTimeMs === 0) {
    newState.avgResponseTimeMs = analysis.responseTimeMs;
  } else {
    // Rolling average over last ~10 responses
    newState.avgResponseTimeMs = newState.avgResponseTimeMs * 0.9 + analysis.responseTimeMs * 0.1;
  }

  // Track retries and hints
  if (analysis.isRetry) {
    newState.retriesThisTurn += 1;
    newState.totalRetries += 1;
  } else {
    newState.retriesThisTurn = 0;
  }
  if (analysis.isHintRequest) newState.hintsUsed += 1;
  if (analysis.isSkip) newState.skippedContent += 1;

  // Track engagement signals
  if (analysis.containsFrustration) {
    newState.frustrationSignals += 1;
    newState.consecutiveStruggle += 1;
    newState.consecutiveCorrect = 0;
  } else if (analysis.containsBoredom) {
    newState.boredomSignals += 1;
  } else if (analysis.containsExcitement || analysis.isDeepDive) {
    newState.curiositySignals += 1;
    newState.consecutiveCorrect += 1;
    newState.consecutiveStruggle = 0;
  } else if (analysis.containsConfusion) {
    newState.consecutiveStruggle += 1;
    newState.consecutiveCorrect = 0;
  } else {
    // Neutral response
    if (analysis.messageLength > 30) {
      // Longer responses suggest engagement
      newState.consecutiveCorrect += 1;
      newState.consecutiveStruggle = Math.max(0, newState.consecutiveStruggle - 1);
    }
  }

  // Update engagement score (rolling)
  let engagementDelta = 0;
  if (analysis.containsExcitement || analysis.isDeepDive) engagementDelta += 0.1;
  if (analysis.containsQuestion && analysis.messageLength > 20) engagementDelta += 0.05;
  if (analysis.containsFrustration) engagementDelta -= 0.15;
  if (analysis.containsBoredom) engagementDelta -= 0.2;
  if (analysis.containsConfusion) engagementDelta -= 0.05;
  if (analysis.isSkip) engagementDelta -= 0.1;
  if (analysis.messageLength < 5 && !analysis.containsExcitement) engagementDelta -= 0.05;
  if (analysis.messageLength > 50) engagementDelta += 0.03;
  
  // Response time signals
  if (analysis.responseTimeMs < 2000 && analysis.messageLength < 10) {
    // Very fast, very short — might be disengaged
    engagementDelta -= 0.05;
  }
  if (analysis.responseTimeMs > 60000) {
    // Very slow — might be distracted or struggling
    engagementDelta -= 0.03;
  }
  
  newState.engagementScore = Math.min(1.0, Math.max(0.0, newState.engagementScore + engagementDelta));

  // Track topics
  if (aiPlan?.topic_detected && !newState.topicsExplored.includes(aiPlan.topic_detected)) {
    newState.topicsExplored.push(aiPlan.topic_detected);
  }

  // Track teaching format success
  if (aiPlan?.teaching_strategy) {
    const format = aiPlan.teaching_strategy;
    if (!newState.teachingFormatsUsed.includes(format)) {
      newState.teachingFormatsUsed.push(format);
    }
    const currentSuccess = newState.teachingFormatSuccess[format] || 0.5;
    const wasSuccessful = analysis.containsExcitement || analysis.isDeepDive || (analysis.messageLength > 30 && !analysis.containsFrustration);
    newState.teachingFormatSuccess[format] = currentSuccess * 0.7 + (wasSuccessful ? 1.0 : 0.0) * 0.3;
  }

  // Update strategy
  newState.lastStrategy = aiPlan?.teaching_strategy || newState.lastStrategy;

  return newState;
}

// ─── COMPUTE ADAPTATION SIGNALS ───

export function computeAdaptationSignals(
  sessionState: SessionState,
  boredomThresholdMinutes: number = 20,
  frustrationTolerance: number = 0.5,
  attentionSpan: string = 'moderate',
): AdaptationSignals {
  const signals_detected: string[] = [];
  let difficulty_adjustment: AdaptationSignals['difficulty_adjustment'] = 'maintain';
  let pacing_adjustment: AdaptationSignals['pacing_adjustment'] = 'maintain';
  let explanation_adjustment: AdaptationSignals['explanation_adjustment'] = 'maintain';
  let engagement_intervention: EngagementIntervention | null = null;
  let encouragement_needed = false;
  let scaffold_needed = false;
  let challenge_needed = false;
  let switch_format = false;
  let suggest_break = false;

  // ─── FRUSTRATION DETECTION ───
  if (sessionState.consecutiveStruggle >= 3) {
    signals_detected.push('consecutive_struggle');
    difficulty_adjustment = 'decrease';
    explanation_adjustment = 'simplify';
    scaffold_needed = true;
    encouragement_needed = true;
    engagement_intervention = 'early_win';
  } else if (sessionState.consecutiveStruggle >= 2) {
    signals_detected.push('mild_struggle');
    scaffold_needed = true;
    encouragement_needed = true;
  }

  if (sessionState.frustrationSignals >= 2) {
    signals_detected.push('frustration_detected');
    difficulty_adjustment = 'decrease';
    pacing_adjustment = 'slow_down';
    encouragement_needed = true;
    if (sessionState.frustrationSignals >= 3) {
      engagement_intervention = 'humor_break';
    }
  }

  // ─── BOREDOM DETECTION ───
  if (sessionState.boredomSignals >= 2) {
    signals_detected.push('boredom_detected');
    difficulty_adjustment = 'increase';
    pacing_adjustment = 'speed_up';
    challenge_needed = true;
    engagement_intervention = 'challenge_increase';
  }

  if (sessionState.engagementScore < 0.3) {
    signals_detected.push('low_engagement');
    switch_format = true;
    if (!engagement_intervention) engagement_intervention = 'surprise_fact';
  }

  // ─── SUCCESS DETECTION ───
  if (sessionState.consecutiveCorrect >= 4) {
    signals_detected.push('mastery_streak');
    difficulty_adjustment = 'increase';
    pacing_adjustment = 'speed_up';
    challenge_needed = true;
  } else if (sessionState.consecutiveCorrect >= 2 && sessionState.engagementScore > 0.7) {
    signals_detected.push('good_momentum');
    // Maintain current approach — it's working
  }

  // ─── CURIOSITY DETECTION ───
  if (sessionState.curiositySignals >= 3) {
    signals_detected.push('high_curiosity');
    explanation_adjustment = 'deepen';
    pacing_adjustment = 'maintain'; // Let them explore
  }

  // ─── HINT USAGE ───
  if (sessionState.hintsUsed >= 3) {
    signals_detected.push('frequent_hints');
    scaffold_needed = true;
    explanation_adjustment = 'simplify';
  }

  // ─── SKIP PATTERNS ───
  if (sessionState.skippedContent >= 2) {
    signals_detected.push('content_skipping');
    switch_format = true;
    if (!engagement_intervention) engagement_intervention = 'topic_switch';
  }

  // ─── RESPONSE TIME PATTERNS ───
  if (sessionState.lastResponseTimeMs > 0) {
    const avgTime = sessionState.avgResponseTimeMs;
    if (sessionState.lastResponseTimeMs > avgTime * 2.5 && sessionState.lastResponseTimeMs > 30000) {
      signals_detected.push('slow_response');
      pacing_adjustment = 'slow_down';
      scaffold_needed = true;
    }
    if (sessionState.lastResponseTimeMs < avgTime * 0.3 && sessionState.lastResponseTimeMs < 3000) {
      signals_detected.push('very_fast_response');
      // Could be disengaged or could be confident
      if (sessionState.engagementScore < 0.5) {
        pacing_adjustment = 'speed_up';
        challenge_needed = true;
      }
    }
  }

  // ─── BREAK DETECTION ───
  const attentionMinutes = attentionSpan === 'short' ? 15 : attentionSpan === 'long' ? 35 : 25;
  if (sessionState.messagesSinceBreak > 20 || sessionState.sessionMinutes > attentionMinutes) {
    signals_detected.push('break_recommended');
    suggest_break = true;
  }
  if (sessionState.sessionMinutes > 42) {
    signals_detected.push('session_long');
    suggest_break = true;
  }

  // ─── FORMAT SWITCHING ───
  // If the same teaching format has been used 3+ times and engagement is dropping
  if (sessionState.lastStrategy) {
    const formatSuccess = sessionState.teachingFormatSuccess[sessionState.lastStrategy] || 0.5;
    if (formatSuccess < 0.3) {
      signals_detected.push('format_ineffective');
      switch_format = true;
    }
  }

  // Calculate confidence in these signals
  const confidence = Math.min(1.0, 
    0.3 + // Base confidence
    (sessionState.turnNumber > 3 ? 0.2 : 0) + // More turns = more data
    (sessionState.turnNumber > 8 ? 0.2 : 0) +
    (signals_detected.length > 0 ? 0.15 : 0) + // Clear signals
    (sessionState.engagementScore < 0.3 || sessionState.engagementScore > 0.8 ? 0.15 : 0) // Strong engagement signal
  );

  return {
    difficulty_adjustment,
    pacing_adjustment,
    explanation_adjustment,
    engagement_intervention,
    encouragement_needed,
    scaffold_needed,
    challenge_needed,
    switch_format,
    suggest_break,
    signals_detected,
    confidence,
  };
}

// ─── SUGGEST BEST TEACHING FORMAT ───

export function suggestTeachingFormat(
  sessionState: SessionState,
  preferredFormats: string[] = [],
): string {
  const allFormats = [
    'ask_to_discover', 'reveal_surprise', 'challenge', 'story',
    'compare', 'build', 'debate', 'connect', 'what_if', 'real_world',
  ];

  // Filter out recently used formats
  const recentlyUsed = sessionState.teachingFormatsUsed.slice(-3);
  const available = allFormats.filter(f => !recentlyUsed.includes(f));

  // Prefer formats with high success rates
  const ranked = available.sort((a, b) => {
    const aSuccess = sessionState.teachingFormatSuccess[a] || 0.5;
    const bSuccess = sessionState.teachingFormatSuccess[b] || 0.5;
    const aPreferred = preferredFormats.includes(a) ? 0.2 : 0;
    const bPreferred = preferredFormats.includes(b) ? 0.2 : 0;
    return (bSuccess + bPreferred) - (aSuccess + aPreferred);
  });

  return ranked[0] || 'ask_to_discover';
}

// ─── BUILD ADAPTATION CONTEXT FOR AI ───

export function buildAdaptationBlock(
  sessionState: SessionState,
  signals: AdaptationSignals,
): string {
  if (signals.signals_detected.length === 0 && signals.confidence < 0.4) {
    return ''; // Not enough data to adapt yet
  }

  let block = '\n═══ REAL-TIME ADAPTATION (adjust your response accordingly) ═══\n';
  
  block += `Session: Turn ${sessionState.turnNumber} | ${sessionState.sessionMinutes} min | Engagement: ${(sessionState.engagementScore * 10).toFixed(0)}/10\n`;
  
  if (signals.signals_detected.length > 0) {
    block += `Signals: ${signals.signals_detected.join(', ')}\n`;
  }

  // Difficulty
  if (signals.difficulty_adjustment !== 'maintain') {
    block += `DIFFICULTY: ${signals.difficulty_adjustment === 'increase' ? 'INCREASE challenge — student is ready for more' : 'DECREASE difficulty — student is struggling'}\n`;
  }

  // Pacing
  if (signals.pacing_adjustment !== 'maintain') {
    block += `PACING: ${signals.pacing_adjustment === 'speed_up' ? 'SPEED UP — student may be bored or ready to move faster' : 'SLOW DOWN — give more time, break into smaller pieces'}\n`;
  }

  // Explanation
  if (signals.explanation_adjustment !== 'maintain') {
    block += `EXPLANATION: ${signals.explanation_adjustment === 'simplify' ? 'SIMPLIFY — use simpler words, shorter sentences, concrete examples' : 'DEEPEN — student wants more depth, add nuance and complexity'}\n`;
  }

  // Engagement intervention
  if (signals.engagement_intervention) {
    const interventionMap: Record<string, string> = {
      'humor_break': 'Use a funny analogy or light joke to reset the mood',
      'surprise_fact': 'Share a surprising or mind-blowing fact to recapture attention',
      'challenge_increase': 'Pose a harder, more interesting challenge',
      'topic_switch': 'Pivot to a related but different angle on the topic',
      'movement_break': 'Suggest a quick physical activity or break',
      'story_hook': 'Start a compelling story or narrative',
      'creative_prompt': 'Ask them to imagine or create something',
      'real_world_connection': 'Connect to something in their daily life',
      'early_win': 'Give them something easy to succeed at first, then build up',
    };
    block += `ENGAGEMENT: ${interventionMap[signals.engagement_intervention] || signals.engagement_intervention}\n`;
  }

  // Specific needs
  if (signals.encouragement_needed) {
    block += `ENCOURAGE: Student needs positive reinforcement right now. Acknowledge effort, not just results.\n`;
  }
  if (signals.scaffold_needed) {
    block += `SCAFFOLD: Break the next concept into smaller, manageable steps. Don't assume prior understanding.\n`;
  }
  if (signals.challenge_needed) {
    block += `CHALLENGE: Student is ready for more. Push them with a harder question or deeper concept.\n`;
  }
  if (signals.switch_format) {
    const suggested = suggestTeachingFormat(sessionState);
    block += `FORMAT: Switch teaching approach. Try: ${suggested}\n`;
  }
  if (signals.suggest_break) {
    block += `BREAK: Student has been working for a while. Warmly suggest a break.\n`;
  }

  // Teaching format success data
  const formatEntries = Object.entries(sessionState.teachingFormatSuccess);
  if (formatEntries.length > 0) {
    const best = formatEntries.sort((a, b) => b[1] - a[1]).slice(0, 3);
    block += `Best formats this session: ${best.map(([f, s]) => `${f} (${(s * 100).toFixed(0)}%)`).join(', ')}\n`;
  }

  return block;
}
