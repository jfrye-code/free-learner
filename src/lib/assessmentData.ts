// ============================================================
// ASSESSMENT DATA: All onboarding assessment questions
// ============================================================

// ─── BIG FIVE PERSONALITY ASSESSMENT (Kid-Friendly) ───
// Each question maps to Big Five traits + extended traits
// Scores are 0-1 per trait per answer
export interface PersonalityQuestion {
  id: string;
  scenario: string;
  subtext?: string;
  options: {
    text: string;
    traits: Record<string, number>;
  }[];
}

export const personalityQuestions: PersonalityQuestion[] = [
  {
    id: 'p1_new_things',
    scenario: "When someone suggests trying something you've never done before, you usually...",
    options: [
      { text: "Get excited and want to try it right away", traits: { openness: 0.9, risk_tolerance: 0.8, curiosity_drive: 0.8 } },
      { text: "Think about it, then give it a shot", traits: { openness: 0.6, conscientiousness: 0.5, risk_tolerance: 0.5 } },
      { text: "Prefer to watch someone else try it first", traits: { openness: 0.3, neuroticism: 0.3, risk_tolerance: 0.2 } },
      { text: "Stick with what you already know and like", traits: { openness: 0.1, conscientiousness: 0.6, risk_tolerance: 0.1 } },
    ],
  },
  {
    id: 'p2_messy_room',
    scenario: "Your workspace or room is usually...",
    options: [
      { text: "Organized with everything in its place", traits: { conscientiousness: 0.9, openness: 0.2 } },
      { text: "Mostly tidy with a few messy spots", traits: { conscientiousness: 0.6 } },
      { text: "Creative chaos — I know where everything is!", traits: { openness: 0.7, conscientiousness: 0.2, creativity_orientation: 0.7 } },
      { text: "I don't really think about it much", traits: { conscientiousness: 0.1, openness: 0.4 } },
    ],
  },
  {
    id: 'p3_party',
    scenario: "At a party or big gathering, you usually...",
    options: [
      { text: "Talk to everyone and make new friends", traits: { extraversion: 0.9, social_orientation: 0.9, agreeableness: 0.6 } },
      { text: "Hang out with a few close friends", traits: { extraversion: 0.4, agreeableness: 0.6, social_orientation: 0.5 } },
      { text: "Find a quiet corner and observe", traits: { extraversion: 0.1, openness: 0.5, social_orientation: 0.2 } },
      { text: "Enjoy it for a while, then need alone time", traits: { extraversion: 0.3, neuroticism: 0.2, social_orientation: 0.3 } },
    ],
  },
  {
    id: 'p4_friend_sad',
    scenario: "When a friend is feeling sad, you...",
    options: [
      { text: "Drop everything to help them feel better", traits: { agreeableness: 0.9, social_orientation: 0.7, extraversion: 0.5 } },
      { text: "Listen carefully and try to understand", traits: { agreeableness: 0.7, openness: 0.5 } },
      { text: "Give them advice on how to fix the problem", traits: { agreeableness: 0.4, conscientiousness: 0.5 } },
      { text: "Give them space — they'll figure it out", traits: { agreeableness: 0.2, openness: 0.3 } },
    ],
  },
  {
    id: 'p5_hard_problem',
    scenario: "When you're stuck on a really hard problem, you...",
    options: [
      { text: "Keep trying different approaches until it clicks", traits: { persistence_trait: 0.9, conscientiousness: 0.7, openness: 0.5 } },
      { text: "Take a break and come back with fresh eyes", traits: { persistence_trait: 0.5, neuroticism: 0.2, openness: 0.4 } },
      { text: "Ask someone for a hint or help", traits: { social_orientation: 0.6, agreeableness: 0.5, persistence_trait: 0.3 } },
      { text: "Move on to something else — life's too short", traits: { persistence_trait: 0.1, openness: 0.6, neuroticism: 0.3 } },
    ],
  },
  {
    id: 'p6_surprise_change',
    scenario: "Your plans suddenly change at the last minute. You feel...",
    options: [
      { text: "Excited — surprises are the best!", traits: { openness: 0.8, risk_tolerance: 0.7, neuroticism: 0.1 } },
      { text: "Fine — I can roll with it", traits: { openness: 0.5, neuroticism: 0.2, risk_tolerance: 0.5 } },
      { text: "A little stressed but I'll manage", traits: { neuroticism: 0.5, conscientiousness: 0.5, risk_tolerance: 0.3 } },
      { text: "Really frustrated — I had a plan!", traits: { neuroticism: 0.8, conscientiousness: 0.7, risk_tolerance: 0.1 } },
    ],
  },
  {
    id: 'p7_creative_vs_follow',
    scenario: "When given a project, you prefer to...",
    options: [
      { text: "Make up your own way to do it", traits: { creativity_orientation: 0.9, openness: 0.8, conscientiousness: 0.2 } },
      { text: "Follow the instructions but add your own twist", traits: { creativity_orientation: 0.6, conscientiousness: 0.5, openness: 0.5 } },
      { text: "Follow the instructions carefully step by step", traits: { conscientiousness: 0.8, creativity_orientation: 0.2 } },
      { text: "Work with others to figure out the best approach", traits: { social_orientation: 0.7, agreeableness: 0.6, extraversion: 0.5 } },
    ],
  },
  {
    id: 'p8_mistakes',
    scenario: "When you make a mistake, you usually...",
    options: [
      { text: "Laugh it off and try again", traits: { neuroticism: 0.1, persistence_trait: 0.6, openness: 0.5, risk_tolerance: 0.6 } },
      { text: "Think about what went wrong so you can improve", traits: { conscientiousness: 0.7, persistence_trait: 0.5, neuroticism: 0.3 } },
      { text: "Feel embarrassed but keep going", traits: { neuroticism: 0.5, persistence_trait: 0.4, agreeableness: 0.4 } },
      { text: "Get really upset with yourself", traits: { neuroticism: 0.8, persistence_trait: 0.3, conscientiousness: 0.5 } },
    ],
  },
  {
    id: 'p9_daydream',
    scenario: "How often do you daydream or imagine things?",
    options: [
      { text: "All the time — my imagination never stops!", traits: { openness: 0.9, creativity_orientation: 0.8, curiosity_drive: 0.7 } },
      { text: "Pretty often, especially when I'm bored", traits: { openness: 0.6, creativity_orientation: 0.5 } },
      { text: "Sometimes, but I prefer to focus on real things", traits: { openness: 0.3, conscientiousness: 0.6 } },
      { text: "Not really — I'm more of a practical thinker", traits: { openness: 0.1, conscientiousness: 0.7, creativity_orientation: 0.1 } },
    ],
  },
  {
    id: 'p10_competition',
    scenario: "When playing a game or competing, you...",
    options: [
      { text: "Really want to win and try your hardest", traits: { extraversion: 0.6, persistence_trait: 0.7, conscientiousness: 0.5 } },
      { text: "Try your best but don't mind losing", traits: { agreeableness: 0.6, persistence_trait: 0.4, neuroticism: 0.1 } },
      { text: "Care more about having fun than winning", traits: { agreeableness: 0.7, openness: 0.5, social_orientation: 0.5 } },
      { text: "Prefer games where everyone works together", traits: { agreeableness: 0.8, social_orientation: 0.7, extraversion: 0.3 } },
    ],
  },
];

// ─── LEARNING PREFERENCES ASSESSMENT ───
export interface LearningPrefQuestion {
  id: string;
  question: string;
  options: {
    text: string;
    traits: Record<string, number>;
  }[];
}

export const learningPrefQuestions: LearningPrefQuestion[] = [
  {
    id: 'lp1_remember',
    question: "You remember things best when you...",
    options: [
      { text: "See pictures, diagrams, or videos", traits: { visual: 0.9, prefers_visuals: 1 } },
      { text: "Hear someone explain it out loud", traits: { auditory: 0.9 } },
      { text: "Write it down or read about it", traits: { reading_writing: 0.9 } },
      { text: "Do it yourself or act it out", traits: { kinesthetic: 0.9, prefers_hands_on: 1 } },
    ],
  },
  {
    id: 'lp2_study',
    question: "When studying for something important, you prefer to...",
    options: [
      { text: "Study alone in a quiet place", traits: { solo_learning: 0.9 } },
      { text: "Study with a friend or group", traits: { social_learning: 0.9 } },
      { text: "Have someone quiz you", traits: { auditory: 0.5, social_learning: 0.6 } },
      { text: "Make flashcards or practice problems", traits: { reading_writing: 0.6, kinesthetic: 0.4 } },
    ],
  },
  {
    id: 'lp3_new_topic',
    question: "When learning something brand new, you'd rather...",
    options: [
      { text: "See an example first, then learn the rules", traits: { prefers_examples_first: 1, visual: 0.4 } },
      { text: "Learn the rules first, then see examples", traits: { prefers_theory_first: 1, reading_writing: 0.4 } },
      { text: "Hear a story about why it matters", traits: { prefers_stories: 1, auditory: 0.4 } },
      { text: "Jump in and figure it out by doing", traits: { kinesthetic: 0.7, prefers_hands_on: 1 } },
    ],
  },
  {
    id: 'lp4_pace',
    question: "When learning, you prefer to go...",
    options: [
      { text: "Fast — I get bored if things are too slow", traits: { visual: 0.3, reading_writing: 0.3 } },
      { text: "At a steady, comfortable speed", traits: { auditory: 0.3 } },
      { text: "Slow and thorough — I want to really understand", traits: { reading_writing: 0.4 } },
      { text: "It depends on the subject", traits: {} },
    ],
  },
  {
    id: 'lp5_explanation',
    question: "The best way to explain something to you is...",
    options: [
      { text: "Draw a picture or show a diagram", traits: { visual: 0.8, prefers_visuals: 1 } },
      { text: "Tell a real-world story about it", traits: { prefers_stories: 1, auditory: 0.4 } },
      { text: "Give a step-by-step walkthrough", traits: { reading_writing: 0.5, prefers_theory_first: 0.5 } },
      { text: "Let me try it and make mistakes", traits: { kinesthetic: 0.8, prefers_hands_on: 1, prefers_challenges: 1 } },
    ],
  },
  {
    id: 'lp6_challenge',
    question: "When something is challenging, you prefer...",
    options: [
      { text: "A harder problem that really makes me think", traits: { prefers_challenges: 1 } },
      { text: "Hints that point me in the right direction", traits: { prefers_examples_first: 0.5 } },
      { text: "Breaking it into smaller, easier steps", traits: { prefers_theory_first: 0.3 } },
      { text: "Working through it with someone else", traits: { social_learning: 0.7 } },
    ],
  },
  {
    id: 'lp7_reward',
    question: "What makes you feel most proud after learning?",
    options: [
      { text: "Solving something nobody else could", traits: { prefers_challenges: 1, solo_learning: 0.4 } },
      { text: "Understanding something deeply", traits: { reading_writing: 0.3, prefers_theory_first: 0.5 } },
      { text: "Creating something cool with what I learned", traits: { kinesthetic: 0.5, prefers_hands_on: 1 } },
      { text: "Helping someone else understand it too", traits: { social_learning: 0.8 } },
    ],
  },
  {
    id: 'lp8_bored',
    question: "When you start feeling bored during a lesson, you wish...",
    options: [
      { text: "The topic would switch to something more interesting", traits: { visual: 0.3, prefers_stories: 0.5 } },
      { text: "There was a hands-on activity or game", traits: { kinesthetic: 0.7, prefers_hands_on: 1 } },
      { text: "The challenge level would increase", traits: { prefers_challenges: 1 } },
      { text: "I could discuss it with someone", traits: { social_learning: 0.7, auditory: 0.4 } },
    ],
  },
];

// ─── INTEREST OPTIONS (Enhanced) ───
export const interestOptions = [
  { label: 'Gaming', icon: '🎮', category: 'technology' },
  { label: 'Music', icon: '🎵', category: 'arts' },
  { label: 'Animals', icon: '🐾', category: 'science' },
  { label: 'Space', icon: '🌌', category: 'science' },
  { label: 'Art', icon: '🎨', category: 'arts' },
  { label: 'Cooking', icon: '🍳', category: 'life_skills' },
  { label: 'Sports', icon: '⚽', category: 'physical' },
  { label: 'Nature', icon: '🌿', category: 'science' },
  { label: 'Technology', icon: '💡', category: 'technology' },
  { label: 'History', icon: '📜', category: 'humanities' },
  { label: 'Stories', icon: '📖', category: 'language_arts' },
  { label: 'Building', icon: '🔧', category: 'engineering' },
  { label: 'Fashion', icon: '👗', category: 'arts' },
  { label: 'Science', icon: '🔬', category: 'science' },
  { label: 'Travel', icon: '✈️', category: 'humanities' },
  { label: 'Movies', icon: '🎬', category: 'arts' },
  { label: 'Photography', icon: '📷', category: 'arts' },
  { label: 'Robots', icon: '🤖', category: 'technology' },
  { label: 'Dance', icon: '💃', category: 'arts' },
  { label: 'Dinosaurs', icon: '🦕', category: 'science' },
  { label: 'Ocean', icon: '🌊', category: 'science' },
  { label: 'Cars', icon: '🏎️', category: 'engineering' },
  { label: 'Magic', icon: '✨', category: 'arts' },
  { label: 'Comics', icon: '💬', category: 'language_arts' },
  { label: 'Puzzles', icon: '🧩', category: 'math_logic' },
  { label: 'Gardening', icon: '🌻', category: 'science' },
  { label: 'Weather', icon: '⛈️', category: 'science' },
  { label: 'Crafts', icon: '✂️', category: 'arts' },
  { label: 'Languages', icon: '🗣️', category: 'language_arts' },
  { label: 'Astronomy', icon: '🔭', category: 'science' },
  { label: 'Skateboarding', icon: '🛹', category: 'physical' },
  { label: 'Business', icon: '💼', category: 'life_skills' },
  { label: 'Fishing', icon: '🎣', category: 'nature' },
  { label: 'Hiking', icon: '🥾', category: 'nature' },
  { label: 'Painting', icon: '🖌️', category: 'arts' },
  { label: 'Yoga', icon: '🧘', category: 'physical' },
];

// ─── STRENGTH OPTIONS ───
export const strengthOptions = [
  'Good with numbers', 'Creative thinker', 'Strong reader', 'Good listener',
  'Natural leader', 'Detail-oriented', 'Fast learner', 'Good at explaining things',
  'Artistic', 'Athletic', 'Musical', 'Good with technology',
  'Patient', 'Curious about everything', 'Good memory', 'Problem solver',
];

// ─── APTITUDE MINI-ASSESSMENTS ───
// Each returns a score 0-1

export interface AptitudeQuestion {
  id: string;
  type: 'multiple_choice' | 'sequence' | 'memory' | 'persistence';
  domain: 'reading' | 'writing' | 'math' | 'logic' | 'memory' | 'persistence';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  subtext?: string;
  options?: { text: string; correct: boolean }[];
  // For sequence questions
  sequence?: (string | number)[];
  answer?: string | number;
  // For memory questions
  items?: string[];
  // For persistence - tracked by behavior
}

export const aptitudeQuestions: Record<string, AptitudeQuestion[]> = {
  reading: [
    {
      id: 'r1', type: 'multiple_choice', domain: 'reading', difficulty: 'easy',
      question: "Read this passage:\n\n\"The old lighthouse stood alone on the cliff, its light sweeping across the dark water. For over a hundred years, it had guided ships safely past the rocky shore.\"\n\nWhat is the main purpose of the lighthouse?",
      options: [
        { text: "To look pretty on the cliff", correct: false },
        { text: "To guide ships safely", correct: true },
        { text: "To scare away fish", correct: false },
        { text: "To light up the town", correct: false },
      ],
    },
    {
      id: 'r2', type: 'multiple_choice', domain: 'reading', difficulty: 'medium',
      question: "\"Maya stared at the blank canvas, her brush trembling slightly. The art show was tomorrow, and she hadn't even started. But as she mixed the first colors, something shifted — her hand moved with a confidence she didn't know she had.\"\n\nWhat can you infer about Maya?",
      options: [
        { text: "She is an experienced artist who paints every day", correct: false },
        { text: "She was nervous but found her confidence once she started", correct: true },
        { text: "She doesn't like painting", correct: false },
        { text: "She decided not to enter the art show", correct: false },
      ],
    },
    {
      id: 'r3', type: 'multiple_choice', domain: 'reading', difficulty: 'hard',
      question: "\"The scientist frowned at the data. The results contradicted her hypothesis entirely. Rather than feeling defeated, she felt a spark of excitement — this unexpected finding could lead somewhere far more interesting.\"\n\nWhat does this passage suggest about the scientific process?",
      options: [
        { text: "Scientists always get the results they expect", correct: false },
        { text: "Unexpected results are always bad", correct: false },
        { text: "Surprising findings can open new paths of discovery", correct: true },
        { text: "Scientists should ignore data that doesn't match", correct: false },
      ],
    },
  ],
  math: [
    {
      id: 'm1', type: 'multiple_choice', domain: 'math', difficulty: 'easy',
      question: "A store has 24 apples. If they put them equally into 6 bags, how many apples are in each bag?",
      options: [
        { text: "3", correct: false },
        { text: "4", correct: true },
        { text: "6", correct: false },
        { text: "8", correct: false },
      ],
    },
    {
      id: 'm2', type: 'multiple_choice', domain: 'math', difficulty: 'medium',
      question: "If a rectangle has a length of 8 cm and a width of 5 cm, what is its area?",
      options: [
        { text: "13 cm²", correct: false },
        { text: "26 cm²", correct: false },
        { text: "40 cm²", correct: true },
        { text: "45 cm²", correct: false },
      ],
    },
    {
      id: 'm3', type: 'multiple_choice', domain: 'math', difficulty: 'hard',
      question: "A train travels at 60 miles per hour. How far will it travel in 2 hours and 30 minutes?",
      options: [
        { text: "120 miles", correct: false },
        { text: "130 miles", correct: false },
        { text: "150 miles", correct: true },
        { text: "180 miles", correct: false },
      ],
    },
  ],
  logic: [
    {
      id: 'l1', type: 'multiple_choice', domain: 'logic', difficulty: 'easy',
      question: "What comes next in this pattern?\n\n2, 4, 6, 8, __",
      options: [
        { text: "9", correct: false },
        { text: "10", correct: true },
        { text: "12", correct: false },
        { text: "16", correct: false },
      ],
    },
    {
      id: 'l2', type: 'multiple_choice', domain: 'logic', difficulty: 'medium',
      question: "If all Bloops are Razzles, and all Razzles are Lazzles, then which statement MUST be true?",
      options: [
        { text: "All Lazzles are Bloops", correct: false },
        { text: "All Bloops are Lazzles", correct: true },
        { text: "All Razzles are Bloops", correct: false },
        { text: "No Bloops are Lazzles", correct: false },
      ],
    },
    {
      id: 'l3', type: 'multiple_choice', domain: 'logic', difficulty: 'hard',
      question: "What comes next in this pattern?\n\n1, 1, 2, 3, 5, 8, __",
      options: [
        { text: "10", correct: false },
        { text: "11", correct: false },
        { text: "13", correct: true },
        { text: "16", correct: false },
      ],
    },
  ],
  memory: [
    {
      id: 'mem1', type: 'memory', domain: 'memory', difficulty: 'easy',
      question: "Look at these items for 10 seconds, then we'll ask you what you remember:",
      items: ['Blue Star', 'Red Circle', 'Green Triangle', 'Yellow Square', 'Purple Diamond'],
    },
    {
      id: 'mem2', type: 'memory', domain: 'memory', difficulty: 'medium',
      question: "Remember this sequence of words:",
      items: ['Mountain', 'River', 'Eagle', 'Thunder', 'Crystal', 'Shadow', 'Flame'],
    },
  ],
  persistence: [
    {
      id: 'per1', type: 'persistence', domain: 'persistence', difficulty: 'medium',
      question: "This is a tricky puzzle! Try to solve it — it's okay if you can't, we just want to see how you approach it.\n\nRearrange these letters to make a word: T-A-R-E-C",
      subtext: "Take your time. You can skip this if you want.",
      options: [
        { text: "CRATE", correct: true },
        { text: "TRACE", correct: true },
        { text: "REACT", correct: true },
        { text: "I want to skip this", correct: false },
      ],
    },
  ],
};

// ─── SCORING HELPERS ───
export function scoreAptitudeResults(
  answers: Record<string, { questionId: string; selectedIndex: number; timeSpent?: number; skipped?: boolean }[]>
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const [domain, domainAnswers] of Object.entries(answers)) {
    const questions = aptitudeQuestions[domain];
    if (!questions || domainAnswers.length === 0) {
      scores[domain] = 0.5; // default
      continue;
    }

    let correct = 0;
    let total = 0;
    let skipped = 0;

    for (const answer of domainAnswers) {
      const q = questions.find(q => q.id === answer.questionId);
      if (!q) continue;

      if (answer.skipped) {
        skipped++;
        continue;
      }

      total++;
      if (q.options && q.options[answer.selectedIndex]?.correct) {
        // Weight by difficulty
        const diffWeight = q.difficulty === 'easy' ? 0.7 : q.difficulty === 'medium' ? 1.0 : 1.3;
        correct += diffWeight;
      }
    }

    if (total === 0) {
      scores[domain] = 0.5;
    } else {
      const maxPossible = questions.reduce((sum, q) => {
        const w = q.difficulty === 'easy' ? 0.7 : q.difficulty === 'medium' ? 1.0 : 1.3;
        return sum + w;
      }, 0);
      scores[domain] = Math.min(1.0, correct / maxPossible);
    }

    // Penalize slightly for skips (indicates lower persistence/confidence)
    if (skipped > 0) {
      scores[domain] = Math.max(0.1, scores[domain] - skipped * 0.05);
    }
  }

  return scores;
}
