import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProgression, XP_REWARDS, SKILL_COLORS, SKILL_LABELS, type SkillDomains } from '@/hooks/useProgression';


interface LessonModule {
  id: number;
  title: string;
  subject_display: string;
  subject_color: string;
  subject_tags: string[];
  time_estimate_minutes: number;
  description: string;
  activity_type: string;
}

interface LessonSection {
  type: 'hook' | 'exploration' | 'deepdive' | 'facts' | 'challenge' | 'branches' | 'reflection' | 'openloop';
  title: string;
  content: string;
  items?: string[];
  branchOptions?: BranchOption[];
}

interface BranchOption {
  name: string;
  description: string;
}

interface LessonSegment {
  sections: LessonSection[];
  branchLabel?: string;
}

interface LessonPlanMeta {
  canonical_topic?: string;
  structure_style?: string;
  intent?: string;
  focus_angle?: string;
}

interface LessonViewerProps {
  module: LessonModule;
  topic: string;
  onComplete: (branchesExplored: number) => void;
  onClose: () => void;
}


const OWL_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292415727_993d7b38.jpg';

// ─── STRUCTURE STYLE LABELS ───
const structureLabels: Record<string, { label: string; icon: string }> = {
  mystery: { label: 'Investigation', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  origin_story: { label: 'Origin Story', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  versus: { label: 'Face-Off', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  countdown: { label: 'Countdown', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' },
  day_in_the_life: { label: 'Day in the Life', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  what_if: { label: 'What If?', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  behind_the_scenes: { label: 'Behind the Scenes', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  timeline_journey: { label: 'Time Travel', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  myth_busting: { label: 'Myth Busted', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
  maker_lab: { label: 'Maker Lab', icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z' },
};

// ─── ENHANCED MARKDOWN PARSER ───
// Handles varied lesson structures from the two-phase generation system

function parseMarkdownToSections(rawText: string): LessonSection[] {
  const sections: LessonSection[] = [];
  
  // Split by ## headers
  const headerRegex = /^##\s+(.+)$/gm;
  const parts: { title: string; body: string }[] = [];
  const matches: { title: string; index: number }[] = [];
  
  let match;
  while ((match = headerRegex.exec(rawText)) !== null) {
    matches.push({ title: match[1].replace(/\*\*/g, '').trim(), index: match.index });
  }
  
  // If no headers found, treat as flowing text
  if (matches.length === 0) {
    const paragraphs = rawText.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length >= 3) {
      sections.push({ type: 'hook', title: '', content: paragraphs[0] });
      sections.push({ type: 'exploration', title: '', content: paragraphs.slice(1, -1).join('\n\n') });
      sections.push({ type: 'reflection', title: '', content: paragraphs[paragraphs.length - 1] });
    } else {
      sections.push({ type: 'hook', title: '', content: rawText });
    }
    return sections;
  }
  
  // Extract preamble (text before first header)
  if (matches[0].index > 0) {
    const preamble = rawText.substring(0, matches[0].index).trim();
    if (preamble) {
      parts.push({ title: '', body: preamble });
    }
  }
  
  // Extract each section
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + rawText.substring(matches[i].index).indexOf('\n') + 1;
    const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const body = rawText.substring(start, end).trim();
    parts.push({ title: matches[i].title, body });
  }
  
  // Classify each section with enhanced detection
  const totalParts = parts.length;
  for (let i = 0; i < totalParts; i++) {
    const { title, body } = parts[i];
    const lower = title.toLowerCase();
    
    // Parse items (bullet points and numbered lists)
    const lines = body.split('\n');
    const contentLines: string[] = [];
    const items: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\.\s/)) {
        const item = trimmed.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
        if (item.trim()) items.push(item);
      } else if (trimmed) {
        contentLines.push(trimmed);
      }
    }
    
    const content = contentLines.join('\n');
    
    // ─── BRANCH DETECTION (enhanced for varied formats) ───
    if (lower.includes('direction') || lower.includes('path') || lower.includes('calls to you') || 
        lower.includes('choose') || lower.includes('next step') || lower.includes('where to next') ||
        lower.includes('where do') || lower.includes('branch') || lower.includes('fork in the road') ||
        lower.includes('your call') || lower.includes('pick your') || lower.includes('which way')) {
      const branchOptions = extractBranches(items);
      if (branchOptions.length > 0) {
        sections.push({ type: 'branches', title, content, items, branchOptions });
        continue;
      }
    }
    
    // ─── ENHANCED SECTION CLASSIFICATION ───
    let type: LessonSection['type'] = 'exploration';
    
    // First section is always the hook
    if (i === 0 || (i === 1 && !parts[0].title)) {
      type = 'hook';
    }
    // Last section (before branches) is often the open loop or reflection
    else if (i === totalParts - 1 && !lower.includes('direction') && !lower.includes('next')) {
      // Check if it's more of a reflection or open loop
      if (lower.includes('but') || lower.includes('wait') || lower.includes('one more') || 
          lower.includes('haven\'t') || lower.includes('secret') || lower.includes('nobody') ||
          lower.includes('what if') || lower.includes('imagine') || lower.includes('cliffhanger')) {
        type = 'openloop';
      } else {
        type = 'reflection';
      }
    }
    // Second-to-last is often reflection if last is open loop
    else if (i === totalParts - 2) {
      if (lower.includes('thinking like') || lower.includes('already') || lower.includes('becoming') ||
          lower.includes('you just') || lower.includes('who you') || lower.includes('reflect') ||
          lower.includes('engineer') || lower.includes('scientist') || lower.includes('creator') ||
          lower.includes('innovator') || lower.includes('thinker') || lower.includes('your superpower') ||
          lower.includes('you\'re not just') || lower.includes('that makes you')) {
        type = 'reflection';
      }
    }
    // Facts / mind-blowing sections
    else if (lower.includes('mind') || lower.includes('blow') || lower.includes('fact') || 
             lower.includes('rewire') || lower.includes('believe') || lower.includes('wild') ||
             lower.includes('bet you') || lower.includes('change how') || lower.includes('did you know') ||
             lower.includes('truth') || lower.includes('surprise') || lower.includes('shocking') ||
             lower.includes('myth') || lower.includes('wrong about') || lower.includes('actually') ||
             lower.includes('think again') || lower.includes('plot twist')) {
      type = 'facts';
    }
    // Challenge / hands-on sections
    else if (lower.includes('try') || lower.includes('build') || lower.includes('your turn') || 
             lower.includes('challenge') || lower.includes('hands') || lower.includes('create') ||
             lower.includes('design') || lower.includes('experiment') || lower.includes('activity') ||
             lower.includes('right now') || lower.includes('make your') || lower.includes('grab') ||
             lower.includes('step 1') || lower.includes('materials') || lower.includes('diy') ||
             lower.includes('project') || lower.includes('workshop') || lower.includes('lab time') ||
             lower.includes('mission') || lower.includes('your move')) {
      type = 'challenge';
    }
    // Reflection / identity sections
    else if (lower.includes('thinking like') || lower.includes('already') || lower.includes('becoming') ||
             lower.includes('you just') || lower.includes('who you') || lower.includes('reflect') ||
             lower.includes('you\'re not') || lower.includes('that\'s what') || lower.includes('real talk')) {
      type = 'reflection';
    }
    // Open loop / teaser sections
    else if (lower.includes('nobody') || lower.includes('tomorrow') || 
             lower.includes('coming up') || lower.includes('wait until') || lower.includes('rabbit hole') ||
             lower.includes('what\'s ahead') || lower.includes('haven\'t') || lower.includes('almost no') ||
             lower.includes('one more thing') || lower.includes('but here\'s') || lower.includes('clue') ||
             lower.includes('unfinished') || lower.includes('to be continued') || lower.includes('teaser')) {
      type = 'openloop';
    }
    // Deep dive sections
    else if (lower.includes('hidden') || lower.includes('deeper') || lower.includes('beneath') ||
             lower.includes('secret') || lower.includes('invisible') || lower.includes('counter') ||
             lower.includes('never noticed') || lower.includes('under the') || lower.includes('inside') ||
             lower.includes('really') || lower.includes('actually work') || lower.includes('how it') ||
             lower.includes('mechanism') || lower.includes('why does') || lower.includes('the science') ||
             lower.includes('numbers') || lower.includes('calculate') || lower.includes('measure')) {
      type = 'deepdive';
    }
    // Default: first few sections are exploration, later ones get classified by content
    else if (i <= 2) {
      type = 'exploration';
    } else {
      // Content-based heuristic for unclassified sections
      const bodyLower = body.toLowerCase();
      if (items.length >= 3 && contentLines.length <= 2) {
        type = 'facts'; // Mostly bullet points = facts section
      } else if (/\d+\.\s/.test(body) && (bodyLower.includes('step') || bodyLower.includes('grab') || bodyLower.includes('try'))) {
        type = 'challenge'; // Numbered steps with action words = challenge
      } else if (bodyLower.includes('year') || bodyLower.includes('century') || bodyLower.includes('ancient') || bodyLower.includes('history')) {
        type = 'exploration'; // Historical content
      } else {
        type = 'deepdive'; // Default for middle sections
      }
    }
    
    if (content || items.length > 0) {
      sections.push({ type, title, content, items: items.length > 0 ? items : undefined });
    }
  }
  
  return sections;
}

function extractBranches(items: string[]): BranchOption[] {
  const branches: BranchOption[] = [];
  for (const item of items) {
    const boldMatch = item.match(/^\*\*(.+?)\*\*[:\s–—-]+(.+)/);
    if (boldMatch) {
      branches.push({ name: boldMatch[1].trim(), description: boldMatch[2].trim() });
      continue;
    }
    const colonMatch = item.match(/^([^:]{3,50}):\s+(.+)/);
    if (colonMatch) {
      branches.push({ name: colonMatch[1].trim(), description: colonMatch[2].trim() });
      continue;
    }
    if (item.length > 15) {
      branches.push({ name: item.substring(0, 45).trim(), description: item });
    }
  }
  return branches.slice(0, 3);
}

// ─── TEXT FORMATTING ───

const formatText = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold text-charcoal">{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      continue;
    }
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

// ─── SECTION STYLING ───

const sectionStyle = (type: LessonSection['type']) => {
  switch (type) {
    case 'hook': return { accent: 'border-l-orange-400', bg: 'bg-orange-50/50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' };
    case 'exploration': return { accent: 'border-l-blue-400', bg: 'bg-blue-50/30', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 8v4l3 3' };
    case 'deepdive': return { accent: 'border-l-teal-400', bg: 'bg-teal-50/30', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' };
    case 'facts': return { accent: 'border-l-amber-400', bg: 'bg-amber-50/30', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' };
    case 'challenge': return { accent: 'border-l-purple-400', bg: 'bg-purple-50/30', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' };
    case 'branches': return { accent: 'border-l-indigo-400', bg: 'bg-indigo-50/30', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    case 'reflection': return { accent: 'border-l-green-400', bg: 'bg-green-50/30', iconBg: 'bg-green-100', iconColor: 'text-green-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' };
    case 'openloop': return { accent: 'border-l-rose-400', bg: 'bg-rose-50/30', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', icon: 'M14 5l7 7m0 0l-7 7m7-7H3' };
    default: return { accent: 'border-l-gray-300', bg: '', iconBg: 'bg-gray-100', iconColor: 'text-gray-600', icon: 'M13 10V3L4 14h7v7l9-11h-7z' };
  }
};

const branchColors = [
  { bg: 'bg-purple-50 hover:bg-purple-100', border: 'border-purple-200 hover:border-purple-400', text: 'text-purple-800', icon: 'text-purple-500', iconPath: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7' },
  { bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-200 hover:border-amber-400', text: 'text-amber-800', icon: 'text-amber-500', iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { bg: 'bg-teal-50 hover:bg-teal-100', border: 'border-teal-200 hover:border-teal-400', text: 'text-teal-800', icon: 'text-teal-500', iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
];

// ─── FALLBACK CONTENT ───

function generateFallbackContent(firstName: string, topic: string): LessonSection[] {
  // Even the fallback avoids template language — uses specific, varied phrasing
  const topicCap = topic.charAt(0).toUpperCase() + topic.slice(1);
  return [
    {
      type: 'hook',
      title: '',
      content: `${firstName}, here's something that might change how you think about ${topic} forever. Most people walk right past the most interesting parts without even noticing.\n\nBut once someone points them out? You can never unsee them.`,
    },
    {
      type: 'exploration',
      title: `The Real Story Behind ${topicCap}`,
      content: `Every single thing about ${topic} connects to something bigger — real people who made decisions, real forces at work, real patterns that repeat across history and science.\n\nThe people who truly understand ${topic} don't just know facts about it. They see the invisible web of connections that ties it to everything else. And that's exactly what we're about to do.`,
    },
    {
      type: 'deepdive',
      title: `What Nobody Tells You`,
      content: `Beneath the surface of ${topic}, there are forces and patterns that most people never notice. Not because they're hidden — they're right there in plain sight.\n\nThe difference between someone who casually knows about ${topic} and someone who truly gets it? They've learned to see what's always been there.`,
    },
    {
      type: 'facts',
      title: `Wait, Seriously?`,
      content: '',
      items: [
        `The origins of ${topic} trace back much further than most people realize — and the starting point is genuinely surprising`,
        `Real engineers, scientists, and designers use principles from ${topic} in their work every single day`,
        `The math hiding inside ${topic} connects to patterns found everywhere from galaxies to seashells`,
        `Right now, as you read this, your brain is forming new neural connections around ${topic} — connections that didn't exist five minutes ago`,
      ],
    },
    {
      type: 'challenge',
      title: `Your Move`,
      content: `Here's something you can do right now that most people never think to try:`,
      items: [
        `Find a piece of paper and something to write with`,
        `Sketch out the single most interesting connection you've noticed between ${topic} and something else in your life`,
        `Write one question about ${topic} that you genuinely don't know the answer to`,
        `Try explaining what you've discovered to someone nearby — if you can make them say "wait, really?" you've nailed it`,
      ],
    },
    {
      type: 'branches',
      title: 'Where to next?',
      content: '',
      items: [
        `**The Maker's Path**: Take what you know and build something real with it — design, prototype, iterate`,
        `**The Untold Story**: There's a chapter of ${topic}'s history that reads like a thriller. Want to hear it?`,
        `**The Hidden Science**: The invisible forces at work here will genuinely blow your mind`,
      ],
      branchOptions: [
        { name: "The Maker's Path", description: `Build something real — design, prototype, iterate` },
        { name: 'The Untold Story', description: `A chapter of ${topic}'s history that reads like a thriller` },
        { name: 'The Hidden Science', description: `Invisible forces at work that will blow your mind` },
      ],
    },
    {
      type: 'reflection',
      title: '',
      content: `${firstName}, what you just did isn't "studying." You connected dots that most people never even see. That's how engineers, scientists, and entrepreneurs think — they look at the same world everyone else sees, but they notice the patterns underneath.`,
    },
    {
      type: 'openloop',
      title: `One More Thing...`,
      content: `There's an aspect of ${topic} we haven't even touched yet — one that connects to something you'd never expect. The kind of connection that, once you see it, makes you wonder how you ever missed it.\n\nReady to find out what it is?`,
    },
  ];
}

// ─── MAIN COMPONENT ───

const LessonViewer: React.FC<LessonViewerProps> = ({ module, topic, onComplete, onClose }) => {
  const { studentProfile } = useAppContext();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<LessonSegment[]>([]);
  const [readProgress, setReadProgress] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [loadingBranch, setLoadingBranch] = useState<string | null>(null);
  const [exploredBranches, setExploredBranches] = useState<Set<string>>(new Set());
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<'analyzing' | 'writing'>('analyzing');
  const [lessonMeta, setLessonMeta] = useState<LessonPlanMeta | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const firstName = studentProfile.name.split(' ')[0];
  const rawTopic = topic.trim();

  const loadingStepsAnalyzing = [
    `Understanding what "${rawTopic}" really means to you...`,
    'Mapping connections across science, history, and math...',
    'Checking what you already know...',
    'Finding the perfect angle for this lesson...',
  ];

  const loadingStepsWriting = [
    'Crafting something unique just for you...',
    'Weaving in some mind-blowing connections...',
    'Building your branching adventure...',
    'Adding the finishing touches...',
    'Almost ready — this is going to be good...',
  ];

  const currentLoadingSteps = loadingPhase === 'analyzing' ? loadingStepsAnalyzing : loadingStepsWriting;

  useEffect(() => {
    if (loading || loadingBranch) {
      const interval = setInterval(() => {
        setLoadingStep(prev => {
          const next = (prev + 1) % currentLoadingSteps.length;
          // Switch to writing phase after cycling through analysis steps
          if (loadingPhase === 'analyzing' && next === 0 && prev > 0) {
            setLoadingPhase('writing');
          }
          return next;
        });
      }, 2400);
      return () => clearInterval(interval);
    }
  }, [loading, loadingBranch, loadingPhase, currentLoadingSteps.length]);

  useEffect(() => {
    generateContent();
  }, [module.id]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const el = contentRef.current;
        const scrollTop = el.scrollTop;
        const scrollHeight = el.scrollHeight - el.clientHeight;
        const progress = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
        setReadProgress(progress);
        if (progress > 70) setShowComplete(true);
      }
    };
    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [segments]);

  const generateContent = async () => {
    setLoading(true);
    setLoadingPhase('analyzing');
    setLoadingStep(0);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: [],
          studentProfile: {
            name: firstName,
            age: studentProfile.age,
            gradeLevel: studentProfile.gradeLevel || String(Math.max(1, studentProfile.age - 5)),
            interests: studentProfile.interests,
            learningStyle: studentProfile.learningStyle,
            strengths: studentProfile.strengths,
            entrepreneurialInterest: studentProfile.entrepreneurialInterest,
            handsOnPreference: studentProfile.handsOnPreference,
            socialPreference: studentProfile.socialPreference,
            creativeVsAnalytical: studentProfile.creativeVsAnalytical,
          },
          userId: user?.id,
          isLessonGeneration: true,
          lessonContext: {
            topic: rawTopic,
            moduleTitle: module.title,
            moduleDescription: module.description,
            subjectDisplay: module.subject_display,
          },
        },
      });

      if (fnError) throw new Error(fnError.message);
      const responseText = data?.message || '';
      if (!responseText.trim()) throw new Error('Empty response');

      // Store lesson plan metadata
      if (data?.lessonPlan) {
        setLessonMeta(data.lessonPlan);
      }

      const parsed = parseMarkdownToSections(responseText);
      setSegments([{ sections: parsed }]);
    } catch (err: any) {
      console.error('Lesson generation error:', err);
      const fallback = generateFallbackContent(firstName, rawTopic);
      setSegments([{ sections: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const exploreBranch = useCallback(async (branch: BranchOption) => {
    if (exploredBranches.has(branch.name)) return;
    setLoadingBranch(branch.name);
    setExploredBranches(prev => new Set([...prev, branch.name]));

    try {
      const { data, error: fnError } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: [],
          studentProfile: {
            name: firstName,
            age: studentProfile.age,
            gradeLevel: studentProfile.gradeLevel || String(Math.max(1, studentProfile.age - 5)),
            interests: studentProfile.interests,
            learningStyle: studentProfile.learningStyle,
            strengths: studentProfile.strengths,
          },
          userId: user?.id,
          isLessonGeneration: true,
          lessonContext: {
            topic: rawTopic,
            moduleTitle: module.title,
            moduleDescription: module.description,
            subjectDisplay: module.subject_display,
          },
          branchChoice: `${branch.name}: ${branch.description}`,
        },
      });

      if (fnError) throw new Error(fnError.message);
      const responseText = data?.message || '';
      if (!responseText.trim()) throw new Error('Empty response');

      const parsed = parseMarkdownToSections(responseText);
      const segIndex = segments.length;
      setSegments(prev => [...prev, { sections: parsed, branchLabel: branch.name }]);

      setTimeout(() => {
        const el = document.getElementById(`segment-${segIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err: any) {
      console.error('Branch generation error:', err);
      setExploredBranches(prev => {
        const next = new Set(prev);
        next.delete(branch.name);
        return next;
      });
    } finally {
      setLoadingBranch(null);
    }
  }, [segments, exploredBranches, firstName, studentProfile, user, rawTopic, module]);

  // ─── RENDER ───

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/60 transition-colors flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <img src={OWL_IMG} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-teal/20 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="font-heading font-bold text-charcoal text-sm truncate">{module.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${module.subject_color || 'bg-gray-100 text-gray-700'}`}>
                    {module.subject_display}
                  </span>
                  {lessonMeta?.structure_style && structureLabels[lessonMeta.structure_style] && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-semibold bg-indigo-50 text-indigo-600">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={structureLabels[lessonMeta.structure_style].icon} />
                      </svg>
                      {structureLabels[lessonMeta.structure_style].label}
                    </span>
                  )}
                  <span className="font-body text-xs text-charcoal/40">{module.time_estimate_minutes} min</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-300" style={{ width: `${readProgress}%` }} />
                </div>
                <span className="font-body text-xs text-charcoal/40">{readProgress}%</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 px-4">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-teal/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-teal border-t-transparent rounded-full animate-spin" />
                  <img src={OWL_IMG} alt="" className="absolute inset-2 rounded-full object-cover" />
                </div>
                {/* Two-phase loading indicator */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold transition-all ${
                    loadingPhase === 'analyzing' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {loadingPhase === 'analyzing' ? (
                      <>
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                        Analyzing topic
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Topic analyzed
                      </>
                    )}
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold transition-all ${
                    loadingPhase === 'writing' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-charcoal/30'
                  }`}>
                    {loadingPhase === 'writing' ? (
                      <>
                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                        Writing lesson
                      </>
                    ) : (
                      'Writing lesson'
                    )}
                  </div>
                </div>
                <p className="font-body text-sm text-charcoal/50 mb-4">{currentLoadingSteps[loadingStep % currentLoadingSteps.length]}</p>
                <div className="flex justify-center gap-1.5">
                  {currentLoadingSteps.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === loadingStep % currentLoadingSteps.length ? 'bg-teal scale-125' : i < loadingStep % currentLoadingSteps.length ? 'bg-teal/40' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-8 py-6">
              {/* Mentor's perspective on this lesson - subtle, not school-like */}
              {lessonMeta?.focus_angle && (
                <div className="mb-6 flex items-start gap-3 p-4 bg-gradient-to-r from-white to-teal-50/30 rounded-xl border border-gray-100">
                  <img src={OWL_IMG} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5 border border-teal/20" />
                  <p className="font-body text-xs text-charcoal/60 leading-relaxed italic">
                    "{lessonMeta.focus_angle}"
                  </p>
                </div>
              )}

              {/* All segments */}
              {segments.map((segment, segIdx) => (
                <div key={segIdx} id={`segment-${segIdx}`}>
                  {/* Branch divider */}
                  {segment.branchLabel && (
                    <div className="flex items-center gap-3 my-8">
                      <div className="flex-1 h-px bg-indigo-200" />
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round">
                          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
                        </svg>
                        <span className="font-heading font-bold text-sm text-indigo-700">{segment.branchLabel}</span>
                      </div>
                      <div className="flex-1 h-px bg-indigo-200" />
                    </div>
                  )}

                  {/* Sections flow naturally */}
                  <div className="space-y-6">
                    {segment.sections.map((section, secIdx) => {
                      const style = sectionStyle(section.type);

                      // ─── BRANCHES SECTION ───
                      if (section.type === 'branches' && section.branchOptions && section.branchOptions.length > 0) {
                        return (
                          <div key={`${segIdx}-${secIdx}`} className="my-8">
                            {section.title && (
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${style.iconBg}`}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={style.iconColor}>
                                    <path d={style.icon} />
                                  </svg>
                                </div>
                                <h3 className="font-heading font-bold text-lg text-charcoal">{section.title}</h3>
                              </div>
                            )}
                            {section.content && (
                              <p className="font-body text-sm text-charcoal/70 mb-4 leading-relaxed">{formatText(section.content)}</p>
                            )}
                            <div className="space-y-3">
                              {section.branchOptions.map((branch, bi) => {
                                const bc = branchColors[bi % branchColors.length];
                                const isExplored = exploredBranches.has(branch.name);
                                const isLoading = loadingBranch === branch.name;

                                return (
                                  <button
                                    key={bi}
                                    onClick={() => !isExplored && !loadingBranch && exploreBranch(branch)}
                                    disabled={isExplored || !!loadingBranch}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                      isExplored ? 'bg-green-50 border-green-200 opacity-75' :
                                      isLoading ? 'bg-indigo-50 border-indigo-300 animate-pulse' :
                                      `${bc.bg} ${bc.border} hover:shadow-md cursor-pointer`
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                        isExplored ? 'bg-green-100' : isLoading ? 'bg-indigo-100' : bc.bg.split(' ')[0]
                                      }`}>
                                        {isExplored ? (
                                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        ) : isLoading ? (
                                          <svg className="animate-spin w-5 h-5 text-indigo-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
                                        ) : (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={bc.icon}>
                                            <path d={bc.iconPath} />
                                          </svg>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className={`font-heading font-bold text-sm ${isExplored ? 'text-green-700' : isLoading ? 'text-indigo-700' : bc.text}`}>
                                          {branch.name}
                                          {isExplored && <span className="font-body text-xs font-normal ml-2 text-green-500">Explored</span>}
                                        </h4>
                                        <p className="font-body text-xs text-charcoal/60 mt-0.5">{branch.description}</p>
                                      </div>
                                      {!isExplored && !isLoading && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-charcoal/25 flex-shrink-0 mt-1">
                                          <polyline points="9 18 15 12 9 6"/>
                                        </svg>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}

                              {loadingBranch && (
                                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                  <div className="w-6 h-6 relative flex-shrink-0">
                                    <div className="absolute inset-0 border-2 border-indigo-200 rounded-full" />
                                    <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                  <div>
                                    <p className="font-heading font-bold text-xs text-indigo-700">Exploring "{loadingBranch}"...</p>
                                    <p className="font-body text-[11px] text-indigo-400">Crafting a fresh perspective...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // ─── REGULAR SECTION ───
                      return (
                        <div key={`${segIdx}-${secIdx}`} className={`border-l-4 ${style.accent} pl-5 py-1`}>
                          {section.title && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${style.iconBg}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={style.iconColor}>
                                  <path d={style.icon} />
                                </svg>
                              </div>
                              <h3 className="font-heading font-bold text-base sm:text-lg text-charcoal">{section.title}</h3>
                            </div>
                          )}

                          {section.content && (
                            <div className="font-body text-sm text-charcoal/80 leading-relaxed space-y-3">
                              {section.content.split('\n').map((paragraph, pi) => (
                                paragraph.trim() ? <p key={pi}>{formatText(paragraph)}</p> : null
                              ))}
                            </div>
                          )}

                          {section.items && section.items.length > 0 && (
                            <ul className={`mt-3 space-y-2`}>
                              {section.items.map((item, ii) => (
                                <li key={ii} className="flex items-start gap-2.5">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${style.iconBg}`}>
                                    {section.type === 'challenge' ? (
                                      <span className={`font-heading font-bold text-[10px] ${style.iconColor}`}>{ii + 1}</span>
                                    ) : (
                                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className={style.iconColor}>
                                        <circle cx="12" cy="12" r="5"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="font-body text-sm text-charcoal/80 leading-relaxed">{formatText(item)}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Extra callouts for specific section types */}
                          {section.type === 'challenge' && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                              <span className="font-body text-xs text-purple-700">Grab a parent or guardian if you need help with materials!</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Completion area */}
              <div className="mt-10 mb-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border border-gray-100 text-center">
                <img src={OWL_IMG} alt="" className="w-14 h-14 rounded-full object-cover mx-auto mb-4 border-4 border-teal/20" />
                {showComplete || readProgress > 70 ? (
                  <>
                    <h3 className="font-heading font-bold text-xl text-charcoal mb-2">
                      Nice work, {firstName}!
                    </h3>
                    <p className="font-body text-sm text-charcoal/50 mb-1 max-w-md mx-auto">
                      You just explored {rawTopic} like a pro.
                      {exploredBranches.size > 0 && ` You went down ${exploredBranches.size} branch${exploredBranches.size > 1 ? 'es' : ''} — that's real curiosity in action.`}
                    </p>

                    {/* XP Preview */}
                    <div className="flex items-center justify-center gap-3 my-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#6366F1"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <span className="font-heading font-bold text-sm text-indigo-700">+{XP_REWARDS.lesson_completed + (exploredBranches.size * XP_REWARDS.branch_explored)} XP</span>
                      </div>
                      {exploredBranches.size > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 border border-purple-200 rounded-full">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M16 3h5v5M4 20L21 3"/></svg>
                          <span className="font-body text-xs font-bold text-purple-700">{exploredBranches.size} branch{exploredBranches.size > 1 ? 'es' : ''}</span>
                        </div>
                      )}
                    </div>

                    <p className="font-body text-sm text-charcoal/50 mb-6 max-w-md mx-auto">
                      Ready to lock in your progress?
                    </p>
                    <button
                      onClick={() => onComplete(exploredBranches.size)}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-heading font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <span className="flex items-center gap-3">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Complete This Adventure!
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-heading font-bold text-lg text-charcoal mb-2">Keep scrolling!</h3>
                    <p className="font-body text-sm text-charcoal/50 max-w-md mx-auto">
                      Read through the content above{segments[0]?.sections.some(s => s.type === 'branches') ? ' and try a branch' : ''} to complete this adventure.
                    </p>
                    <div className="w-40 h-2 bg-gray-200 rounded-full mx-auto mt-3 overflow-hidden">
                      <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${readProgress}%` }} />
                    </div>
                    <p className="font-body text-[10px] text-indigo-500 mt-2">+{XP_REWARDS.lesson_completed} XP waiting for you</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;
