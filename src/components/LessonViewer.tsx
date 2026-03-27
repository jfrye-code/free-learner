import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

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
  type: 'intro' | 'concept' | 'funfact' | 'activity' | 'think' | 'summary' | 'quiz';
  title: string;
  content: string;
  items?: string[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LessonViewerProps {
  module: LessonModule;
  topic: string;
  onComplete: () => void;
  onClose: () => void;
}

const OWL_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292415727_993d7b38.jpg';

const parseLesson = (rawText: string): { sections: LessonSection[]; quiz: QuizQuestion[] } => {
  const sections: LessonSection[] = [];
  const quiz: QuizQuestion[] = [];

  // Split by markdown-style headers or double newlines
  const lines = rawText.split('\n');
  let currentSection: LessonSection | null = null;
  let currentItems: string[] = [];

  const flushSection = () => {
    if (currentSection) {
      if (currentItems.length > 0) {
        currentSection.items = [...currentItems];
        currentItems = [];
      }
      sections.push(currentSection);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect headers
    if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      flushSection();
      const title = trimmed.replace(/^#+\s*/, '');
      const lowerTitle = title.toLowerCase();

      let type: LessonSection['type'] = 'concept';
      if (lowerTitle.includes('introduction') || lowerTitle.includes('welcome') || lowerTitle.includes('let\'s start') || lowerTitle.includes('overview')) {
        type = 'intro';
      } else if (lowerTitle.includes('fun fact') || lowerTitle.includes('did you know') || lowerTitle.includes('cool fact') || lowerTitle.includes('amazing')) {
        type = 'funfact';
      } else if (lowerTitle.includes('activity') || lowerTitle.includes('try this') || lowerTitle.includes('experiment') || lowerTitle.includes('hands-on') || lowerTitle.includes('project') || lowerTitle.includes('create') || lowerTitle.includes('build') || lowerTitle.includes('make')) {
        type = 'activity';
      } else if (lowerTitle.includes('think') || lowerTitle.includes('reflect') || lowerTitle.includes('question') || lowerTitle.includes('wonder')) {
        type = 'think';
      } else if (lowerTitle.includes('summary') || lowerTitle.includes('wrap up') || lowerTitle.includes('review') || lowerTitle.includes('what we learned') || lowerTitle.includes('conclusion')) {
        type = 'summary';
      } else if (lowerTitle.includes('quiz') || lowerTitle.includes('test') || lowerTitle.includes('check your')) {
        type = 'quiz';
      }

      currentSection = { type, title, content: '' };
      continue;
    }

    // Detect bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\.\s/)) {
      const item = trimmed.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
      currentItems.push(item);
      continue;
    }

    // Regular content
    if (trimmed && currentSection) {
      currentSection.content += (currentSection.content ? '\n' : '') + trimmed;
    } else if (trimmed && !currentSection) {
      // Content before any header - treat as intro
      currentSection = { type: 'intro', title: 'Introduction', content: trimmed };
    }
  }

  flushSection();

  // If no sections were parsed (plain text response), create structured sections from the text
  if (sections.length === 0 && rawText.trim()) {
    const paragraphs = rawText.split(/\n\n+/).filter(p => p.trim());
    if (paragraphs.length >= 3) {
      sections.push({ type: 'intro', title: 'Introduction', content: paragraphs[0] });
      for (let i = 1; i < paragraphs.length - 1; i++) {
        sections.push({ type: 'concept', title: `Key Concept ${i}`, content: paragraphs[i] });
      }
      sections.push({ type: 'summary', title: 'Summary', content: paragraphs[paragraphs.length - 1] });
    } else {
      sections.push({ type: 'intro', title: 'Lesson Content', content: rawText });
    }
  }

  return { sections, quiz };
};

const sectionIcon = (type: LessonSection['type']) => {
  switch (type) {
    case 'intro':
      return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253';
    case 'concept':
      return 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z';
    case 'funfact':
      return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
    case 'activity':
      return 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z';
    case 'think':
      return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'summary':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'quiz':
      return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
    default:
      return 'M13 10V3L4 14h7v7l9-11h-7z';
  }
};

const sectionColors = (type: LessonSection['type']) => {
  switch (type) {
    case 'intro': return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', accent: 'bg-blue-100' };
    case 'concept': return { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal', accent: 'bg-teal-100' };
    case 'funfact': return { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', accent: 'bg-amber-100' };
    case 'activity': return { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', accent: 'bg-purple-100' };
    case 'think': return { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', accent: 'bg-indigo-100' };
    case 'summary': return { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', accent: 'bg-green-100' };
    case 'quiz': return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', accent: 'bg-rose-100' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600', accent: 'bg-gray-100' };
  }
};

const LessonViewer: React.FC<LessonViewerProps> = ({ module, topic, onComplete, onClose }) => {
  const { studentProfile } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<LessonSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [showComplete, setShowComplete] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Researching the topic...',
    'Crafting your personalized lesson...',
    'Adding fun facts and activities...',
    'Making it awesome for you...',
    'Almost ready...',
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    generateLessonContent();
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
        if (progress > 85) {
          setShowComplete(true);
        }
      }
    };
    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [sections]);

  const generateLessonContent = async () => {
    setLoading(true);
    setError(null);

    try {
      const prompt = `You are creating an educational lesson for a ${studentProfile.age}-year-old student named ${studentProfile.name} in grade ${studentProfile.gradeLevel || Math.max(1, studentProfile.age - 5)}.

Generate a COMPLETE, DETAILED, ENGAGING lesson about: "${module.title}"
Context: This is part of a learning path about "${topic}".
Module description: ${module.description}
Subject area: ${module.subject_display}
Activity type: ${module.activity_type}
Estimated time: ${module.time_estimate_minutes} minutes
Student interests: ${studentProfile.interests?.join(', ') || 'general'}
Learning style: ${studentProfile.learningStyle || 'visual'}

IMPORTANT: Write a SUBSTANTIAL lesson with REAL educational content. This should be a full lesson that actually teaches something, not just an overview. Include specific facts, examples, and explanations appropriate for the student's age.

Format the lesson with these markdown headers (use ## for each section):

## Welcome to ${module.title}
Write an engaging 2-3 paragraph introduction that hooks the student and explains what they'll learn. Connect it to something they might already know or care about.

## Key Concept 1: [Specific Concept Name]
Explain the first major concept in 2-3 detailed paragraphs with specific facts, numbers, and examples. Use analogies a ${studentProfile.age}-year-old would understand.

## Key Concept 2: [Specific Concept Name]  
Explain the second major concept in 2-3 detailed paragraphs with specific facts and examples.

## Key Concept 3: [Specific Concept Name]
Explain the third major concept in 2-3 detailed paragraphs.

## Did You Know? Amazing Facts
Share 4-5 mind-blowing facts related to the topic. Use bullet points starting with "- ".

## Try This! Hands-On Activity
Describe a specific, step-by-step activity or experiment the student can try at home. Include:
- Materials needed
- Step-by-step instructions (numbered)
- What to observe or expect

## Think About It
Ask 3-4 thought-provoking questions that encourage deeper thinking about the topic. Use bullet points.

## What We Learned - Summary
Summarize the key takeaways in 2-3 paragraphs. Reinforce the main concepts and connect them back to the bigger picture.

Remember: Write for a ${studentProfile.age}-year-old. Be enthusiastic, use vivid language, and make complex ideas accessible. Include SPECIFIC facts and real examples, not vague generalities.`;

      const { data, error: fnError } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: [
            { sender: 'student', text: prompt },
          ],
          studentProfile: {
            name: studentProfile.name,
            age: studentProfile.age,
            gradeLevel: studentProfile.gradeLevel || String(Math.max(1, studentProfile.age - 5)),
            interests: studentProfile.interests,
            learningStyle: studentProfile.learningStyle,
            strengths: studentProfile.strengths,
          },
          userId: undefined,
          isLessonGeneration: true,
        },
      });

      if (fnError) throw new Error(fnError.message);

      const responseText = data?.message || '';
      if (!responseText.trim()) throw new Error('Empty response');

      const parsed = parseLesson(responseText);
      setSections(parsed.sections);

      // Auto-expand first 2 sections
      setExpandedSections(new Set([0, 1]));
    } catch (err: any) {
      console.error('Lesson generation error:', err);
      // Generate fallback content
      const fallbackSections: LessonSection[] = [
        {
          type: 'intro',
          title: `Welcome to ${module.title}`,
          content: `Hey ${studentProfile.name}! Today we're going to explore something really cool: ${module.title}. This is part of our adventure learning about ${topic}, and by the end of this lesson, you'll know some amazing things that most people don't!\n\n${module.description}\n\nThis lesson will take about ${module.time_estimate_minutes} minutes, and I promise it's going to be worth it. Let's dive in!`,
        },
        {
          type: 'concept',
          title: 'The Big Picture',
          content: `${module.title} is a fascinating topic that connects to so many things in our world. When we study ${module.subject_display}, we're really learning about how the world works.\n\nThink about it this way: everything you see around you - from the screen you're reading this on, to the food you ate today, to the stars in the sky - it all connects to what we're learning about today.\n\nThe key thing to understand is that ${topic} isn't just something you read about in textbooks. It's happening all around us, every single day. Scientists, engineers, artists, and everyday people all use this knowledge in their work and lives.`,
        },
        {
          type: 'concept',
          title: 'How It Works',
          content: `Now let's get into the details of how ${module.title.toLowerCase()} actually works. This is where it gets really interesting!\n\nWhen experts study this topic, they look at patterns and connections that might not be obvious at first. But once you learn to see them, you'll start noticing them everywhere.\n\nOne of the most important things to understand is that learning is like building with blocks - each new piece of knowledge connects to what you already know, making the whole structure stronger and more interesting.`,
        },
        {
          type: 'funfact',
          title: 'Did You Know? Amazing Facts',
          content: 'Here are some incredible facts that will blow your mind:',
          items: [
            `The topic of ${topic} has been studied by scientists for hundreds of years, and we're still making new discoveries!`,
            `${module.subject_display} is one of the most popular subjects for young learners around the world.`,
            'Your brain creates new connections every time you learn something new - you\'re literally getting smarter right now!',
            'Many of the greatest discoveries in history were made by people who were curious about everyday things, just like you.',
          ],
        },
        {
          type: 'activity',
          title: 'Try This! Hands-On Activity',
          content: `Here's a fun activity you can try right now to explore ${module.title} in a hands-on way:`,
          items: [
            'Grab a notebook or piece of paper and something to write with.',
            `Write down 3 things you already knew about ${topic} before this lesson.`,
            'Now write down 3 NEW things you learned today.',
            `Draw a picture or diagram that shows how the concepts in ${module.title} connect to each other.`,
            'Share what you learned with someone in your family - teaching others is one of the best ways to remember!',
            `Bonus: Look around your house or neighborhood for real-world examples of ${topic}. You might be surprised how many you find!`,
          ],
        },
        {
          type: 'think',
          title: 'Think About It',
          content: 'Take a moment to think about these questions. There are no wrong answers - just use your imagination and what you\'ve learned!',
          items: [
            `If you could ask any expert in the world one question about ${topic}, what would you ask?`,
            `How do you think ${module.title.toLowerCase()} might change or improve in the next 50 years?`,
            `Can you think of a way that ${topic} connects to one of your hobbies or interests?`,
            'What was the most surprising thing you learned in this lesson?',
          ],
        },
        {
          type: 'summary',
          title: 'What We Learned - Summary',
          content: `Great job, ${studentProfile.name}! You've just completed an awesome lesson on ${module.title}. Let's review what we covered:\n\nWe started by exploring the big picture of ${topic} and why it matters. Then we dove into the details of how things work, and discovered some amazing facts along the way.\n\nRemember, every lesson you complete makes you a little bit smarter and a little more prepared to understand the incredible world around you. The best part? This is just the beginning - there's so much more to discover!\n\nKeep being curious, keep asking questions, and keep exploring. That's what real learning is all about!`,
        },
      ];
      setSections(fallbackSections);
      setExpandedSections(new Set([0, 1]));
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
        // Mark as completed when opened
        setCompletedSections(prev2 => new Set([...prev2, index]));
      }
      return next;
    });
  };

  const allSectionsRead = completedSections.size >= Math.max(1, sections.length - 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-cream rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/60 transition-colors flex-shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <img src={OWL_IMG} alt="Mentor" className="w-9 h-9 rounded-full object-cover border-2 border-teal/20 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="font-heading font-bold text-charcoal text-sm truncate">{module.title}</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-body font-semibold ${module.subject_color || 'bg-gray-100 text-gray-700'}`}>
                    {module.subject_display}
                  </span>
                  <span className="font-body text-xs text-charcoal/40">{module.time_estimate_minutes} min</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Reading progress */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-300"
                    style={{ width: `${readProgress}%` }}
                  />
                </div>
                <span className="font-body text-xs text-charcoal/40">{readProgress}%</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-charcoal/40 transition-colors"
              >
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
                  <img src={OWL_IMG} alt="Mentor" className="absolute inset-2 rounded-full object-cover" />
                </div>
                <h3 className="font-heading font-bold text-xl text-charcoal mb-2">Building Your Lesson</h3>
                <p className="font-body text-sm text-charcoal/50 mb-4">{loadingSteps[loadingStep]}</p>
                <div className="flex justify-center gap-1.5">
                  {loadingSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === loadingStep ? 'bg-teal scale-125' : i < loadingStep ? 'bg-teal/40' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20 px-4">
              <div className="text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <h3 className="font-heading font-bold text-charcoal mb-2">Oops! Something went wrong</h3>
                <p className="font-body text-sm text-charcoal/50 mb-4">{error}</p>
                <button
                  onClick={generateLessonContent}
                  className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 sm:px-6 py-6 space-y-4">
              {/* Lesson hero */}
              <div className={`bg-gradient-to-br ${
                module.activity_type === 'explore' ? 'from-blue-500 to-indigo-600' :
                module.activity_type === 'experiment' ? 'from-purple-500 to-pink-600' :
                module.activity_type === 'create' ? 'from-amber-500 to-orange-600' :
                module.activity_type === 'challenge' ? 'from-red-500 to-rose-600' :
                'from-teal to-teal-dark'
              } rounded-2xl p-6 sm:p-8 text-white mb-6`}>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={sectionIcon(module.activity_type === 'experiment' ? 'activity' : 'intro')} />
                  </svg>
                  <span className="font-body text-sm font-semibold text-white/80 uppercase tracking-wider">
                    {module.activity_type === 'explore' ? 'Exploration' :
                     module.activity_type === 'experiment' ? 'Experiment' :
                     module.activity_type === 'create' ? 'Creative Project' :
                     module.activity_type === 'challenge' ? 'Challenge' : 'Lesson'}
                  </span>
                </div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-2">{module.title}</h1>
                <p className="font-body text-white/80 text-sm sm:text-base">{module.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {module.subject_tags?.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-white/20 rounded-full font-body text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Table of contents */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-2">
                <h3 className="font-heading font-bold text-sm text-charcoal mb-3 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  In This Lesson
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {sections.map((section, i) => {
                    const colors = sectionColors(section.type);
                    const isRead = completedSections.has(i);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          toggleSection(i);
                          // Scroll to section
                          const el = document.getElementById(`lesson-section-${i}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all hover:shadow-sm ${
                          isRead ? 'bg-green-50 border border-green-200' : `${colors.bg} border ${colors.border}`
                        }`}
                      >
                        {isRead ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={colors.icon}><path d={sectionIcon(section.type)}/></svg>
                        )}
                        <span className="font-body text-xs font-semibold text-charcoal/80 truncate">{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lesson sections */}
              {sections.map((section, i) => {
                const colors = sectionColors(section.type);
                const isExpanded = expandedSections.has(i);

                return (
                  <div
                    key={i}
                    id={`lesson-section-${i}`}
                    className={`rounded-2xl border overflow-hidden transition-all duration-300 ${colors.border} ${
                      isExpanded ? 'shadow-md' : 'shadow-sm'
                    }`}
                  >
                    {/* Section header */}
                    <button
                      onClick={() => toggleSection(i)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${colors.bg} hover:brightness-95`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.accent}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={colors.icon}>
                          <path d={sectionIcon(section.type)} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-charcoal text-sm sm:text-base truncate">{section.title}</h3>
                        {!isExpanded && section.content && (
                          <p className="font-body text-xs text-charcoal/40 truncate mt-0.5">
                            {section.content.substring(0, 80)}...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {completedSections.has(i) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                          className={`text-charcoal/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </button>

                    {/* Section content */}
                    {isExpanded && (
                      <div className="bg-white px-5 py-5 animate-fade-in">
                        {/* Main content */}
                        {section.content && (
                          <div className="font-body text-sm text-charcoal/80 leading-relaxed space-y-3">
                            {section.content.split('\n').map((paragraph, pi) => (
                              paragraph.trim() ? (
                                <p key={pi}>{formatText(paragraph)}</p>
                              ) : null
                            ))}
                          </div>
                        )}

                        {/* Bullet items */}
                        {section.items && section.items.length > 0 && (
                          <ul className="mt-4 space-y-2.5">
                            {section.items.map((item, ii) => (
                              <li key={ii} className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colors.accent}`}>
                                  {section.type === 'activity' ? (
                                    <span className={`font-heading font-bold text-xs ${colors.icon}`}>{ii + 1}</span>
                                  ) : (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={colors.icon}>
                                      <circle cx="12" cy="12" r="4"/>
                                    </svg>
                                  )}
                                </div>
                                <span className="font-body text-sm text-charcoal/80 leading-relaxed">{formatText(item)}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Section-specific extras */}
                        {section.type === 'think' && (
                          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                              <img src={OWL_IMG} alt="Mentor" className="w-6 h-6 rounded-full object-cover" />
                              <span className="font-body text-xs font-semibold text-indigo-700">Mentor says:</span>
                            </div>
                            <p className="font-body text-xs text-indigo-600/80 italic">
                              There are no wrong answers here! The best thinkers are the ones who aren't afraid to wonder "what if?" Take your time with these questions.
                            </p>
                          </div>
                        )}

                        {section.type === 'activity' && (
                          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                              <span className="font-body text-xs font-semibold text-purple-700">Pro Tip: Ask a parent or guardian to help you with this activity!</span>
                            </div>
                          </div>
                        )}

                        {section.type === 'summary' && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                              <span className="font-body text-xs font-semibold text-green-700">You're doing amazing! Keep up the great work, {studentProfile.name}!</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Completion area */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm text-center mt-6">
                <img src={OWL_IMG} alt="Mentor" className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-4 border-teal/20" />
                {allSectionsRead || showComplete ? (
                  <>
                    <h3 className="font-heading font-bold text-xl text-charcoal mb-2">
                      Awesome job, {studentProfile.name}!
                    </h3>
                    <p className="font-body text-sm text-charcoal/50 mb-6 max-w-md mx-auto">
                      You've explored all the sections of this lesson. Ready to mark it complete and earn your coins?
                    </p>
                    <button
                      onClick={onComplete}
                      className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-heading font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <span className="flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Complete This Lesson!
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-heading font-bold text-lg text-charcoal mb-2">
                      Keep reading!
                    </h3>
                    <p className="font-body text-sm text-charcoal/50 mb-4 max-w-md mx-auto">
                      Open and read through the sections above to complete this lesson. You've read {completedSections.size} of {sections.length} sections so far.
                    </p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-500"
                        style={{ width: `${sections.length > 0 ? (completedSections.size / sections.length) * 100 : 0}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Spacer for scroll */}
              <div className="h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to format bold/italic text
const formatText = (text: string): React.ReactNode => {
  // Simple bold/italic parsing
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Check for bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold text-charcoal">{boldMatch[1]}</strong>);
      remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Check for italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // No more formatting
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

export default LessonViewer;
