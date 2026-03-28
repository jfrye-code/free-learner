import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ─── TYPES ───

export interface SkillDomains {
  explorer: number;
  builder: number;
  analyst: number;
  communicator: number;
  founder: number;
  systems_thinker: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'curiosity' | 'persistence' | 'depth' | 'creativity' | 'problem_solving';
  earned_at: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'explore' | 'build' | 'master' | 'streak' | 'depth';
  target: number;
  progress: number;
  reward_xp: number;
  reward_skill?: keyof SkillDomains;
  icon: string;
}

export interface XPEvent {
  xp_amount: number;
  skill_domain?: keyof SkillDomains;
  skill_amount?: number;
  event_type: string;
  description: string;
  identity_message: string;
  quest_progress?: { quest_id: string; new_progress: number; completed: boolean }[];
  new_achievements?: Achievement[];
  level_up?: { old_level: number; new_level: number };
}

export interface Progression {
  total_xp: number;
  current_level: number;
  skills: SkillDomains;
  achievements: Achievement[];
  active_quests: Quest[];
  completed_quests: Quest[];
  total_branches_explored: number;
  total_challenges_completed: number;
  total_artifacts_created: number;
  total_lessons_completed: number;
  total_topics_explored: number;
  topics_explored: string[];
}

// ─── CONSTANTS ───

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000, 27000, 36000, 48000, 65000
];

export const LEVEL_TITLES = [
  'Newcomer', 'Curious Mind', 'Knowledge Seeker', 'Pattern Spotter', 'Deep Thinker',
  'Insight Hunter', 'Connection Maker', 'Systems Seer', 'Paradigm Shifter', 'Thought Leader',
  'Visionary', 'Polymath', 'Renaissance Mind', 'Master Learner', 'Legendary Thinker', 'Transcendent'
];

export const XP_REWARDS = {
  lesson_completed: 50,
  branch_explored: 20,
  challenge_completed: 30,
  artifact_created: 40,
  explanation_given: 25,
  question_answered: 15,
  work_revised: 20,
  project_returned: 10,
  path_completed: 75,
  new_topic_explored: 15,
};

export const SKILL_ICONS: Record<keyof SkillDomains, string> = {
  explorer: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 8v4l3 3',
  builder: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  analyst: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  communicator: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  founder: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  systems_thinker: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
};

export const SKILL_LABELS: Record<keyof SkillDomains, string> = {
  explorer: 'Explorer',
  builder: 'Builder',
  analyst: 'Analyst',
  communicator: 'Communicator',
  founder: 'Founder',
  systems_thinker: 'Systems Thinker',
};

export const SKILL_COLORS: Record<keyof SkillDomains, { bg: string; text: string; fill: string; border: string }> = {
  explorer: { bg: 'bg-blue-100', text: 'text-blue-700', fill: '#3B82F6', border: 'border-blue-300' },
  builder: { bg: 'bg-orange-100', text: 'text-orange-700', fill: '#F97316', border: 'border-orange-300' },
  analyst: { bg: 'bg-emerald-100', text: 'text-emerald-700', fill: '#10B981', border: 'border-emerald-300' },
  communicator: { bg: 'bg-purple-100', text: 'text-purple-700', fill: '#8B5CF6', border: 'border-purple-300' },
  founder: { bg: 'bg-amber-100', text: 'text-amber-700', fill: '#F59E0B', border: 'border-amber-300' },
  systems_thinker: { bg: 'bg-teal-100', text: 'text-teal-700', fill: '#14B8A6', border: 'border-teal-300' },
};

// ─── ACHIEVEMENTS CATALOG ───

const ACHIEVEMENTS_CATALOG: Omit<Achievement, 'earned_at'>[] = [
  // Curiosity
  { id: 'first_spark', name: 'First Spark', description: 'Completed your first lesson', icon: 'M13 10V3L4 14h7v7l9-11h-7z', category: 'curiosity' },
  { id: 'five_topics', name: 'Curiosity Unleashed', description: 'Explored 5 different topics', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z', category: 'curiosity' },
  { id: 'ten_topics', name: 'Renaissance Mind', description: 'Explored 10 different topics', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', category: 'curiosity' },
  { id: 'branch_explorer', name: 'Path Finder', description: 'Explored 10 different branches', icon: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5', category: 'curiosity' },
  // Persistence
  { id: 'five_lessons', name: 'Getting Warmed Up', description: 'Completed 5 lessons', icon: 'M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z', category: 'persistence' },
  { id: 'twenty_lessons', name: 'Unstoppable', description: 'Completed 20 lessons', icon: 'M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z', category: 'persistence' },
  { id: 'fifty_lessons', name: 'Knowledge Machine', description: 'Completed 50 lessons', icon: 'M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 100 14 7 7 0 000-14z', category: 'persistence' },
  // Depth
  { id: 'deep_diver', name: 'Deep Diver', description: 'Explored all branches in a single lesson', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', category: 'depth' },
  { id: 'skill_30', name: 'Specialist', description: 'Reached level 30 in any skill', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', category: 'depth' },
  // Creativity
  { id: 'first_artifact', name: 'Creator', description: 'Completed your first hands-on challenge', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', category: 'creativity' },
  { id: 'ten_challenges', name: 'Master Builder', description: 'Completed 10 hands-on challenges', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', category: 'creativity' },
  // Problem Solving
  { id: 'level_5', name: 'Rising Star', description: 'Reached Level 5', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', category: 'problem_solving' },
  { id: 'level_10', name: 'Thought Leader', description: 'Reached Level 10', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', category: 'problem_solving' },
  { id: 'balanced', name: 'Well-Rounded', description: 'All skills at 15+', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', category: 'problem_solving' },
];

// ─── QUEST TEMPLATES ───

function generateQuests(progression: Progression): Quest[] {
  const quests: Quest[] = [];
  
  // Exploration quest
  if (progression.total_topics_explored < 5) {
    quests.push({
      id: 'explore_5_topics',
      name: 'World Explorer',
      description: 'Explore 5 different topics',
      type: 'explore',
      target: 5,
      progress: progression.total_topics_explored,
      reward_xp: 100,
      reward_skill: 'explorer',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945',
    });
  } else if (progression.total_topics_explored < 15) {
    quests.push({
      id: 'explore_15_topics',
      name: 'Curiosity Knows No Bounds',
      description: 'Explore 15 different topics',
      type: 'explore',
      target: 15,
      progress: progression.total_topics_explored,
      reward_xp: 250,
      reward_skill: 'explorer',
      icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945',
    });
  }

  // Build quest
  if (progression.total_challenges_completed < 5) {
    quests.push({
      id: 'complete_5_challenges',
      name: 'Prototype Challenge',
      description: 'Complete 5 hands-on challenges',
      type: 'build',
      target: 5,
      progress: progression.total_challenges_completed,
      reward_xp: 150,
      reward_skill: 'builder',
      icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
    });
  }

  // Branch mastery quest
  if (progression.total_branches_explored < 10) {
    quests.push({
      id: 'explore_10_branches',
      name: 'Path Finder',
      description: 'Explore 10 different learning branches',
      type: 'depth',
      target: 10,
      progress: progression.total_branches_explored,
      reward_xp: 200,
      reward_skill: 'systems_thinker',
      icon: 'M16 3h5v5M4 20L21 3',
    });
  }

  // Lesson mastery
  if (progression.total_lessons_completed < 10) {
    quests.push({
      id: 'complete_10_lessons',
      name: 'Knowledge Seeker',
      description: 'Complete 10 lessons',
      type: 'master',
      target: 10,
      progress: progression.total_lessons_completed,
      reward_xp: 200,
      reward_skill: 'analyst',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13',
    });
  } else if (progression.total_lessons_completed < 30) {
    quests.push({
      id: 'complete_30_lessons',
      name: 'Relentless Learner',
      description: 'Complete 30 lessons',
      type: 'master',
      target: 30,
      progress: progression.total_lessons_completed,
      reward_xp: 500,
      reward_skill: 'analyst',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13',
    });
  }

  return quests.slice(0, 4); // Max 4 active quests
}

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getXPForNextLevel(currentLevel: number): { current: number; next: number } {
  const idx = Math.min(currentLevel - 1, LEVEL_THRESHOLDS.length - 2);
  return {
    current: LEVEL_THRESHOLDS[idx] || 0,
    next: LEVEL_THRESHOLDS[idx + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1],
  };
}

// ─── IDENTITY MESSAGES ───

const IDENTITY_MESSAGES: Record<string, string[]> = {
  explorer: [
    "You're becoming the kind of person who sees connections others miss.",
    "That's the curiosity of a true explorer — keep following it.",
    "You just expanded your world a little more. That's what explorers do.",
  ],
  builder: [
    "You just leveled up your Builder skills.",
    "You're thinking like someone who turns ideas into real things.",
    "That's how engineers and designers think — and you're doing it naturally.",
  ],
  analyst: [
    "You're developing the eye of an analyst — seeing patterns everywhere.",
    "That's the kind of thinking that solves real problems.",
    "You just saw something most people would miss. That's powerful.",
  ],
  communicator: [
    "You're becoming someone who can explain complex ideas clearly.",
    "Great communicators change the world — and you're building that skill.",
    "The way you explained that? That's a real gift.",
  ],
  founder: [
    "You're thinking like an entrepreneur now.",
    "That's exactly how founders spot opportunities.",
    "You're becoming the kind of person who can turn ideas into real plans.",
  ],
  systems_thinker: [
    "You're starting to see how everything connects — that's systems thinking.",
    "Most people see parts. You're seeing the whole system. That's rare.",
    "You just leveled up your Systems Thinker skills.",
  ],
  general: [
    "Every time you explore something new, your brain literally rewires itself.",
    "You're not just learning — you're becoming someone who thinks differently.",
    "The fact that you're curious enough to keep going? That's your superpower.",
  ],
};

function getIdentityMessage(skill?: keyof SkillDomains): string {
  const pool = skill ? IDENTITY_MESSAGES[skill] : IDENTITY_MESSAGES.general;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── HOOK ───

export function useProgression() {
  const { user } = useAuth();
  const [progression, setProgression] = useState<Progression>({
    total_xp: 0,
    current_level: 1,
    skills: { explorer: 0, builder: 0, analyst: 0, communicator: 0, founder: 0, systems_thinker: 0 },
    achievements: [],
    active_quests: [],
    completed_quests: [],
    total_branches_explored: 0,
    total_challenges_completed: 0,
    total_artifacts_created: 0,
    total_lessons_completed: 0,
    total_topics_explored: 0,
    topics_explored: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastXPEvent, setLastXPEvent] = useState<XPEvent | null>(null);
  const progressionRef = useRef(progression);
  progressionRef.current = progression;

  const fetchProgression = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      let { data } = await supabase
        .from('student_progression')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!data) {
        const { data: newData } = await supabase
          .from('student_progression')
          .insert({ user_id: user.id })
          .select()
          .single();
        data = newData;
      }

      if (data) {
        const prog: Progression = {
          total_xp: data.total_xp || 0,
          current_level: data.current_level || 1,
          skills: {
            explorer: data.skill_explorer || 0,
            builder: data.skill_builder || 0,
            analyst: data.skill_analyst || 0,
            communicator: data.skill_communicator || 0,
            founder: data.skill_founder || 0,
            systems_thinker: data.skill_systems_thinker || 0,
          },
          achievements: data.achievements || [],
          active_quests: [],
          completed_quests: data.completed_quests || [],
          total_branches_explored: data.total_branches_explored || 0,
          total_challenges_completed: data.total_challenges_completed || 0,
          total_artifacts_created: data.total_artifacts_created || 0,
          total_lessons_completed: data.total_lessons_completed || 0,
          total_topics_explored: data.total_topics_explored || 0,
          topics_explored: data.topics_explored || [],
        };
        prog.active_quests = generateQuests(prog);
        setProgression(prog);
      }
    } catch (err) {
      console.warn('Progression fetch error:', err);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchProgression(); }, [fetchProgression]);

  // ─── AWARD XP ───
  const awardXP = useCallback(async (
    eventType: string,
    xpAmount: number,
    options?: {
      skill?: keyof SkillDomains;
      skillAmount?: number;
      topic?: string;
      description?: string;
    }
  ): Promise<XPEvent | null> => {
    if (!user?.id) return null;

    const prog = progressionRef.current;
    const skill = options?.skill;
    const skillAmount = options?.skillAmount || (skill ? Math.ceil(xpAmount / 5) : 0);
    const description = options?.description || eventType.replace(/_/g, ' ');

    // Calculate new values
    const newXP = prog.total_xp + xpAmount;
    const newLevel = getLevelFromXP(newXP);
    const levelUp = newLevel > prog.current_level ? { old_level: prog.current_level, new_level: newLevel } : undefined;

    // Update skills
    const newSkills = { ...prog.skills };
    if (skill && skillAmount > 0) {
      newSkills[skill] = Math.min(100, (newSkills[skill] || 0) + skillAmount);
    }

    // Update topic tracking
    let newTopics = [...prog.topics_explored];
    let newTopicCount = prog.total_topics_explored;
    if (options?.topic) {
      const topicLower = options.topic.toLowerCase().trim();
      if (!newTopics.includes(topicLower)) {
        newTopics.push(topicLower);
        newTopicCount = newTopics.length;
      }
    }

    // Update engagement stats
    let newBranches = prog.total_branches_explored;
    let newChallenges = prog.total_challenges_completed;
    let newArtifacts = prog.total_artifacts_created;
    let newLessons = prog.total_lessons_completed;

    if (eventType === 'branch_explored') newBranches++;
    if (eventType === 'challenge_completed') newChallenges++;
    if (eventType === 'artifact_created') newArtifacts++;
    if (eventType === 'lesson_completed') newLessons++;

    // Check achievements
    const newAchievements: Achievement[] = [];
    const existingIds = new Set(prog.achievements.map(a => a.id));

    for (const ach of ACHIEVEMENTS_CATALOG) {
      if (existingIds.has(ach.id)) continue;
      let earned = false;

      switch (ach.id) {
        case 'first_spark': earned = newLessons >= 1; break;
        case 'five_topics': earned = newTopicCount >= 5; break;
        case 'ten_topics': earned = newTopicCount >= 10; break;
        case 'branch_explorer': earned = newBranches >= 10; break;
        case 'five_lessons': earned = newLessons >= 5; break;
        case 'twenty_lessons': earned = newLessons >= 20; break;
        case 'fifty_lessons': earned = newLessons >= 50; break;
        case 'first_artifact': earned = newChallenges >= 1; break;
        case 'ten_challenges': earned = newChallenges >= 10; break;
        case 'level_5': earned = newLevel >= 5; break;
        case 'level_10': earned = newLevel >= 10; break;
        case 'balanced': earned = Object.values(newSkills).every(v => v >= 15); break;
        case 'skill_30': earned = Object.values(newSkills).some(v => v >= 30); break;
        case 'deep_diver': earned = false; // Checked separately
          break;
      }

      if (earned) {
        newAchievements.push({ ...ach, earned_at: new Date().toISOString() });
      }
    }

    // Check quest progress
    const updatedProg: Progression = {
      ...prog,
      total_xp: newXP,
      current_level: newLevel,
      skills: newSkills,
      total_branches_explored: newBranches,
      total_challenges_completed: newChallenges,
      total_artifacts_created: newArtifacts,
      total_lessons_completed: newLessons,
      total_topics_explored: newTopicCount,
      topics_explored: newTopics,
      achievements: [...prog.achievements, ...newAchievements],
    };
    
    const newQuests = generateQuests(updatedProg);
    const questProgress: XPEvent['quest_progress'] = [];
    
    for (const quest of newQuests) {
      const oldQuest = prog.active_quests.find(q => q.id === quest.id);
      if (oldQuest && quest.progress > oldQuest.progress) {
        questProgress.push({
          quest_id: quest.id,
          new_progress: quest.progress,
          completed: quest.progress >= quest.target,
        });
      }
    }

    // Handle completed quests
    const completedQuestIds = questProgress.filter(q => q.completed).map(q => q.quest_id);
    const newCompletedQuests = [...(prog.completed_quests || [])];
    for (const qid of completedQuestIds) {
      const quest = newQuests.find(q => q.id === qid);
      if (quest) {
        newCompletedQuests.push(quest);
        // Award quest reward XP (will be added on next call)
      }
    }

    updatedProg.active_quests = newQuests;
    updatedProg.completed_quests = newCompletedQuests;

    // Build XP event
    const identityMessage = getIdentityMessage(skill);
    const xpEvent: XPEvent = {
      xp_amount: xpAmount,
      skill_domain: skill,
      skill_amount: skillAmount,
      event_type: eventType,
      description,
      identity_message: identityMessage,
      quest_progress: questProgress.length > 0 ? questProgress : undefined,
      new_achievements: newAchievements.length > 0 ? newAchievements : undefined,
      level_up: levelUp,
    };

    // Persist to DB
    try {
      await supabase.from('student_progression').update({
        total_xp: newXP,
        current_level: newLevel,
        skill_explorer: newSkills.explorer,
        skill_builder: newSkills.builder,
        skill_analyst: newSkills.analyst,
        skill_communicator: newSkills.communicator,
        skill_founder: newSkills.founder,
        skill_systems_thinker: newSkills.systems_thinker,
        achievements: updatedProg.achievements,
        completed_quests: newCompletedQuests,
        total_branches_explored: newBranches,
        total_challenges_completed: newChallenges,
        total_artifacts_created: newArtifacts,
        total_lessons_completed: newLessons,
        total_topics_explored: newTopicCount,
        topics_explored: newTopics,
        best_daily_xp: Math.max(prog.total_xp || 0, xpAmount),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      await supabase.from('xp_events').insert({
        user_id: user.id,
        xp_amount: xpAmount,
        skill_domain: skill || null,
        skill_amount: skillAmount,
        event_type: eventType,
        description,
        identity_message: identityMessage,
        metadata: { topic: options?.topic, quest_progress: questProgress, achievements: newAchievements.map(a => a.id) },
      });
    } catch (err) {
      console.warn('Failed to persist progression:', err);
    }

    setProgression(updatedProg);
    setLastXPEvent(xpEvent);
    return xpEvent;
  }, [user?.id]);

  // ─── CONVENIENCE METHODS ───

  const onLessonCompleted = useCallback(async (topic: string, branchesExplored: number) => {
    // Determine primary skill based on topic/branch count
    const skills: (keyof SkillDomains)[] = ['explorer', 'analyst', 'systems_thinker', 'builder', 'communicator', 'founder'];
    const primarySkill = skills[Math.floor(Math.random() * 3)]; // Weighted toward explorer/analyst/systems
    
    const event = await awardXP('lesson_completed', XP_REWARDS.lesson_completed, {
      skill: primarySkill,
      topic,
      description: `Completed lesson on ${topic}`,
    });

    // Award bonus for branches
    if (branchesExplored > 0) {
      for (let i = 0; i < branchesExplored; i++) {
        const branchSkills: (keyof SkillDomains)[] = ['explorer', 'systems_thinker', 'builder', 'founder', 'analyst'];
        await awardXP('branch_explored', XP_REWARDS.branch_explored, {
          skill: branchSkills[i % branchSkills.length],
          description: `Explored a learning branch`,
        });
      }
    }

    return event;
  }, [awardXP]);

  const onBranchExplored = useCallback(async (branchName: string, topic: string) => {
    // Map branch name to skill domain
    const bl = branchName.toLowerCase();
    let skill: keyof SkillDomains = 'explorer';
    if (bl.includes('build') || bl.includes('design') || bl.includes('create')) skill = 'builder';
    else if (bl.includes('business') || bl.includes('enterprise') || bl.includes('career') || bl.includes('brand')) skill = 'founder';
    else if (bl.includes('science') || bl.includes('system') || bl.includes('deeper') || bl.includes('hidden')) skill = 'systems_thinker';
    else if (bl.includes('story') || bl.includes('history') || bl.includes('culture')) skill = 'communicator';
    else if (bl.includes('master') || bl.includes('advanced') || bl.includes('challenge')) skill = 'analyst';

    return awardXP('branch_explored', XP_REWARDS.branch_explored, {
      skill,
      topic,
      description: `Explored: ${branchName}`,
    });
  }, [awardXP]);

  const onChallengeCompleted = useCallback(async (topic: string) => {
    return awardXP('challenge_completed', XP_REWARDS.challenge_completed, {
      skill: 'builder',
      skillAmount: 8,
      topic,
      description: `Completed a hands-on challenge`,
    });
  }, [awardXP]);

  const clearLastXPEvent = useCallback(() => setLastXPEvent(null), []);

  return {
    progression,
    loading,
    lastXPEvent,
    clearLastXPEvent,
    awardXP,
    onLessonCompleted,
    onBranchExplored,
    onChallengeCompleted,
    refresh: fetchProgression,
    // Constants
    LEVEL_THRESHOLDS,
    LEVEL_TITLES,
    XP_REWARDS,
    SKILL_ICONS,
    SKILL_LABELS,
    SKILL_COLORS,
    getLevelFromXP,
    getXPForNextLevel,
  };
}
