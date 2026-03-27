import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useGamification } from '@/hooks/useGamification';
import StreakCelebration from '@/components/StreakCelebration';
import BadgeCelebration from '@/components/BadgeCelebration';
import LessonViewer from '@/components/LessonViewer';

const OWL_IMG = 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774292415727_993d7b38.jpg';

interface LearningModule {
  id: number;
  title: string;
  subject_display: string;
  subject_color: string;
  subject_tags: string[];
  time_estimate_minutes: number;
  description: string;
  activity_type: string;
  completed: boolean;
  locked: boolean;
}

interface LearningPath {
  id?: string;
  topic: string;
  modules: LearningModule[];
  tomorrow_teaser: string;
  path_summary: string;
  created_at?: string;
}

const recentTopics = [
  { label: 'Dinosaurs', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945' },
  { label: 'Space Travel', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { label: 'Minecraft Physics', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Ocean Life', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2' },
  { label: 'Cooking Chemistry', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
];

const activityTypeIcon = (type: string) => {
  switch (type) {
    case 'explore': return 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 8v4l3 3';
    case 'experiment': return 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z';
    case 'create': return 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z';
    case 'challenge': return 'M13 10V3L4 14h7v7l9-11h-7z';
    default: return 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13';
  }
};

const CoinIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <text x="12" y="16" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold" stroke="none">C</text>
  </svg>
);

const badgeIcons: Record<string, string> = {
  'Explorer': 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 8v4l3 3',
  'History Buff': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  'Science Star': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  'Math Ninja': 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
  'Streak Master': 'M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z',
  'Unstoppable': 'M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z',
  'Polymath': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  'Legend': 'M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 100 14 7 7 0 000-14z',
};

const rarityColors: Record<string, string> = {
  common: 'bg-teal-50 border-teal-200 text-teal-700',
  rare: 'bg-blue-50 border-blue-200 text-blue-700',
  epic: 'bg-purple-50 border-purple-200 text-purple-700',
  legendary: 'bg-amber-50 border-amber-200 text-amber-700',
};

const StudentDashboard: React.FC = () => {
  const { studentProfile, setCurrentPage } = useAppContext();
  const { user, profile } = useAuth();
  const {
    currency, earnCoins, earnedBadges, catalog, COIN_REWARDS, STREAK_MILESTONES,
    onModuleCompleted, getNextMilestone,
    pendingStreakMilestone, pendingBadgeEarned,
    clearStreakMilestone, clearBadgeEarned,
  } = useGamification();

  const [interest, setInterest] = useState('');
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'journey' | 'library' | 'achievements'>('journey');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pastPaths, setPastPaths] = useState<LearningPath[]>([]);
  const [moduleStartTime, setModuleStartTime] = useState<number | null>(null);
  const [coinAnimation, setCoinAnimation] = useState<{ amount: number; reason: string } | null>(null);
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; amount: number; x: number; y: number }[]>([]);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);


  useEffect(() => { loadPaths(); }, [user?.id]);

  const loadPaths = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const activePath = data.find((p: any) => p.is_active && !p.completed_at);
        if (activePath) {
          setCurrentPath({
            id: activePath.id,
            topic: activePath.topic,
            modules: activePath.modules as LearningModule[],
            tomorrow_teaser: activePath.tomorrow_teaser || '',
            path_summary: '',
            created_at: activePath.created_at,
          });
        }
        setPastPaths(data.filter((p: any) => p.completed_at || !p.is_active).map((p: any) => ({
          id: p.id,
          topic: p.topic,
          modules: p.modules as LearningModule[],
          tomorrow_teaser: p.tomorrow_teaser || '',
          path_summary: '',
          created_at: p.created_at,
        })));
      }
    } catch (err) {
      console.warn('Failed to load paths:', err);
    }
  };

  const showCoinReward = (amount: number, reason: string) => {
    setCoinAnimation({ amount, reason });
    setTimeout(() => setCoinAnimation(null), 2500);
  };

  const addFloatingCoin = (amount: number) => {
    const id = Date.now();
    const x = 50 + (Math.random() - 0.5) * 30;
    const y = 40 + (Math.random() - 0.5) * 20;
    setFloatingCoins(prev => [...prev, { id, amount, x, y }]);
    setTimeout(() => setFloatingCoins(prev => prev.filter(c => c.id !== id)), 1500);
  };

  const handleExplore = async (topic?: string) => {
    const t = topic || interest;
    if (!t.trim()) return;
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: {
          topic: t,
          studentName: studentProfile.name,
          age: studentProfile.age,
          gradeLevel: studentProfile.gradeLevel || String(Math.max(1, studentProfile.age - 5)),
          interests: studentProfile.interests,
          learningStyle: studentProfile.learningStyle,
          strengths: studentProfile.strengths,
          entrepreneurialInterest: studentProfile.entrepreneurialInterest,
          handsOnPreference: studentProfile.handsOnPreference,
        },
      });

      if (error) throw error;


      const modules = (data.modules || []).map((m: any, i: number) => ({
        ...m,
        id: i + 1,
        completed: false,
        locked: i > 1,
      }));

      const newPath: LearningPath = {
        topic: t,
        modules,
        tomorrow_teaser: data.tomorrow_teaser || `Tomorrow we'll dive deeper into ${t}...`,
        path_summary: data.path_summary || '',
      };

      if (user?.id) {
        await supabase.from('learning_paths').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);

        const { data: savedPath } = await supabase.from('learning_paths').insert({
          user_id: user.id,
          topic: t,
          modules,
          total_modules: modules.length,
          completed_modules: 0,
          tomorrow_teaser: newPath.tomorrow_teaser,
          is_active: true,
        }).select().single();

        if (savedPath) newPath.id = savedPath.id;

        await supabase.from('activity_log').insert({
          user_id: user.id,
          action_type: 'path_generated',
          metadata: { topic: t, module_count: modules.length },
          subject_tags: modules.flatMap((m: any) => m.subject_tags || []).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i),
        });

        const displayName = profile?.full_name || studentProfile.name;
        await earnCoins(COIN_REWARDS.first_path, 'Started a new learning path', 'earned', { topic: t, display_name: displayName });
        showCoinReward(COIN_REWARDS.first_path, 'New learning path!');
      }

      setCurrentPath(newPath);
      setInterest('');
    } catch (err) {
      console.error('Failed to generate path:', err);
      const fallbackModules: LearningModule[] = [
        { id: 1, title: `Discovering ${t}`, subject_display: 'Exploration', subject_color: 'bg-teal-100 text-teal-700', subject_tags: ['Science'], time_estimate_minutes: 15, description: `Let's dive into the fascinating world of ${t}!`, activity_type: 'explore', completed: false, locked: false },
        { id: 2, title: `The Science of ${t}`, subject_display: 'Science', subject_color: 'bg-blue-100 text-blue-700', subject_tags: ['Science', 'Math'], time_estimate_minutes: 20, description: `Discover the amazing science behind ${t}.`, activity_type: 'experiment', completed: false, locked: false },
        { id: 3, title: `${t} Through History`, subject_display: 'History', subject_color: 'bg-amber-100 text-amber-700', subject_tags: ['History'], time_estimate_minutes: 15, description: `Travel back in time to see how ${t} shaped our world.`, activity_type: 'explore', completed: false, locked: true },
        { id: 4, title: `Create Your ${t} Project`, subject_display: 'Creative Design', subject_color: 'bg-pink-100 text-pink-700', subject_tags: ['Arts', 'Math'], time_estimate_minutes: 20, description: `Put it all together and create something amazing!`, activity_type: 'create', completed: false, locked: true },
      ];
      setCurrentPath({ topic: t, modules: fallbackModules, tomorrow_teaser: `Tomorrow we'll uncover hidden patterns in ${t}...`, path_summary: `Exploring ${t} today!` });
      setInterest('');
    } finally {
      setIsGenerating(false);
    }
  };

  const startModule = (id: number) => {
    if (!currentPath) return;
    const mod = currentPath.modules.find(m => m.id === id);
    if (!mod || mod.locked || mod.completed) return;
    setModuleStartTime(Date.now());
    setActiveModule(mod);
    // Also unlock the module
    setCurrentPath(prev => {
      if (!prev) return prev;
      return { ...prev, modules: prev.modules.map(m => m.id === id ? { ...m, locked: false } : m) };
    });
  };

  const handleLessonComplete = async () => {
    if (!activeModule) return;
    const moduleId = activeModule.id;
    setActiveModule(null);
    await completeModule(moduleId);
  };

  const handleLessonClose = () => {
    // Close the lesson viewer without completing
    setActiveModule(null);
    // Keep moduleStartTime so they can resume
  };


  const completeModule = async (id: number) => {
    if (!currentPath) return;
    const timeSpent = moduleStartTime ? Math.floor((Date.now() - moduleStartTime) / 1000) : 60;
    setModuleStartTime(null);

    const updated = currentPath.modules.map(m => m.id === id ? { ...m, completed: true } : m);
    const nextLocked = updated.findIndex(m => m.locked);
    if (nextLocked !== -1) updated[nextLocked].locked = false;

    const completedCount = updated.filter(m => m.completed).length;
    const allDone = completedCount === updated.length;

    setCurrentPath({ ...currentPath, modules: updated });

    if (user?.id && currentPath.id) {
      const completedModule = currentPath.modules.find(m => m.id === id);

      await supabase.from('learning_progress').insert({
        user_id: user.id,
        path_id: currentPath.id,
        module_index: id - 1,
        status: 'completed',
        started_at: new Date(Date.now() - timeSpent * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
      });

      await supabase.from('learning_paths').update({
        completed_modules: completedCount,
        modules: updated,
        ...(allDone ? { completed_at: new Date().toISOString() } : {}),
      }).eq('id', currentPath.id);

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action_type: 'module_completed',
        metadata: { topic: currentPath.topic, module_title: completedModule?.title, module_index: id - 1 },
        subject_tags: completedModule?.subject_tags || [],
        duration_seconds: timeSpent,
      });

      // Earn coins for completing module
      const displayName = profile?.full_name || studentProfile.name;
      await earnCoins(COIN_REWARDS.module_completed, `Completed: ${completedModule?.title}`, 'earned', { display_name: displayName });
      showCoinReward(COIN_REWARDS.module_completed, 'Module completed!');
      addFloatingCoin(COIN_REWARDS.module_completed);

      // ─── STREAK + BADGE CHECK ───
      // This is the key integration: after each module, check streak and badges
      await onModuleCompleted();

      // Bonus for completing entire path
      if (allDone) {
        setTimeout(async () => {
          await earnCoins(COIN_REWARDS.path_completed, `Completed path: ${currentPath.topic}`, 'earned', { display_name: displayName });
          showCoinReward(COIN_REWARDS.path_completed, 'Path completed! Bonus!');
          addFloatingCoin(COIN_REWARDS.path_completed);

          // Check badges again after path completion (for complete_first_path)
          await onModuleCompleted();
        }, 1500);
      }
    }
  };

  const completedCount = currentPath?.modules.filter(m => m.completed).length || 0;
  const totalModules = currentPath?.modules.length || 1;
  const progressPercent = Math.round((completedCount / totalModules) * 100);
  const nextMilestone = getNextMilestone();

  const sidebarItems = [
    { id: 'journey' as const, label: "Today's Journey", iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10' },
    { id: 'library' as const, label: 'My Library', iconPath: 'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z' },
    { id: 'achievements' as const, label: 'Achievements', iconPath: 'M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 100 14 7 7 0 000-14z' },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* ─── LESSON VIEWER OVERLAY ─── */}
      {activeModule && currentPath && (
        <LessonViewer
          module={activeModule}
          topic={currentPath.topic}
          onComplete={handleLessonComplete}
          onClose={handleLessonClose}
        />
      )}

      {/* ─── CELEBRATION OVERLAYS ─── */}
      {pendingStreakMilestone && (
        <StreakCelebration milestone={pendingStreakMilestone} onClose={clearStreakMilestone} />
      )}
      {pendingBadgeEarned && !pendingStreakMilestone && (
        <BadgeCelebration event={pendingBadgeEarned} onClose={clearBadgeEarned} />
      )}


      {/* Coin animation overlay */}
      {coinAnimation && (
        <div className="fixed top-24 right-8 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
            <CoinIcon size={24} />
            <div>
              <p className="font-heading font-bold text-lg">+{coinAnimation.amount}</p>
              <p className="font-body text-xs text-amber-800">{coinAnimation.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating coin particles */}
      {floatingCoins.map(fc => (
        <div
          key={fc.id}
          className="fixed z-50 pointer-events-none animate-float-up"
          style={{ left: `${fc.x}%`, top: `${fc.y}%` }}
        >
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-400/90 rounded-full shadow-lg">
            <CoinIcon size={14} />
            <span className="font-heading font-bold text-xs text-amber-900">+{fc.amount}</span>
          </div>
        </div>
      ))}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <img src={OWL_IMG} alt="Mentor" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-heading font-bold text-sm text-charcoal">FreeLearner</p>
              <p className="font-body text-xs text-charcoal/40">Your buddy</p>

            </div>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold transition-all ${
                  activeTab === item.id ? 'bg-teal text-white' : 'text-charcoal/60 hover:bg-teal-50 hover:text-teal'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.iconPath}/></svg>
                {item.label}
              </button>
            ))}
            <hr className="my-3 border-gray-100" />
            <button onClick={() => { setCurrentPage('portfolio'); window.scrollTo({ top: 0 }); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold text-charcoal/60 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              My Portfolio
            </button>
            <button onClick={() => { setCurrentPage('shop'); window.scrollTo({ top: 0 }); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold text-charcoal/60 hover:bg-purple-50 hover:text-purple-600 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
              Reward Shop
            </button>
            <button onClick={() => { setCurrentPage('leaderboard'); window.scrollTo({ top: 0 }); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold text-charcoal/60 hover:bg-amber-50 hover:text-amber-600 transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z"/><circle cx="12" cy="8" r="6"/></svg>
              Leaderboard
            </button>
            <button onClick={() => { setCurrentPage('chat'); window.scrollTo({ top: 0 }); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-body font-semibold text-charcoal/60 hover:bg-teal-50 hover:text-teal transition-all">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Chat with Mentor
            </button>
          </nav>
        </div>


        {/* Coins + Streak in sidebar */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => { setCurrentPage('shop'); window.scrollTo({ top: 0 }); }}
            className="w-full p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <CoinIcon size={20} />
              <span className="font-heading font-bold text-amber-800 text-lg">{currency.coins}</span>
              <span className="font-body text-xs text-amber-600/60 ml-auto">coins</span>
            </div>
            <p className="font-body text-xs text-amber-600/50">Tap to visit shop</p>
          </button>

          {/* Streak with milestone progress */}
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#F4A261"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
              <span className="font-heading font-bold text-orange-700 text-sm">{currency.current_streak}-day streak!</span>
            </div>
            {nextMilestone && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-[10px] text-orange-600/70">Next: {nextMilestone.label}</span>
                  <span className="font-body text-[10px] text-orange-600/70">{currency.current_streak}/{nextMilestone.days}</span>
                </div>
                <div className="w-full h-1.5 bg-orange-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((currency.current_streak / nextMilestone.days) * 100, 100)}%` }}
                  />
                </div>
                <p className="font-body text-[10px] text-orange-500/60 mt-1">+{nextMilestone.bonus} bonus coins at {nextMilestone.days} days</p>
              </div>
            )}
            {!nextMilestone && currency.current_streak >= 30 && (
              <p className="font-body text-[10px] text-orange-600/70 mt-1">All milestones reached! Keep going!</p>
            )}
            {currency.longest_streak > currency.current_streak && (
              <p className="font-body text-[10px] text-orange-500/50 mt-1">Best: {currency.longest_streak} days</p>
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="sticky top-0 z-20 bg-cream/95 backdrop-blur-md border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <h1 className="font-heading font-bold text-lg text-charcoal">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {studentProfile.name}!
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCurrentPage('shop'); window.scrollTo({ top: 0 }); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full transition-all"
              >
                <CoinIcon size={16} />
                <span className="font-heading font-bold text-sm text-amber-800">{currency.coins}</span>
              </button>
              {/* Streak badge in header */}
              {currency.current_streak > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 border border-orange-200 rounded-full">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#F97316"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
                  <span className="font-heading font-bold text-xs text-orange-700">{currency.current_streak}</span>
                </div>
              )}
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#0D7377" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${progressPercent * 0.94} 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-body text-xs font-bold text-teal">{progressPercent}%</span>
              </div>
              <button onClick={() => { setCurrentPage('home'); window.scrollTo({ top: 0 }); }} className="text-charcoal/40 hover:text-charcoal transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8 py-6 max-w-4xl">
          {activeTab === 'journey' && (
            <>
              {/* Interest Input */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 mb-6">
                <h2 className="font-heading font-bold text-xl text-charcoal mb-1">Ready to explore something amazing today?</h2>
                <p className="font-body text-sm text-charcoal/50 mb-5">Tell me what's on your mind — I'll build an awesome adventure around it!</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
                    placeholder="I'm curious about... dinosaurs, music, space, cooking, anything!"
                    className="flex-1 px-5 py-4 rounded-xl bg-cream border border-gray-200 font-body text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all placeholder:text-charcoal/30"
                  />

                  <button
                    onClick={() => handleExplore()}
                    disabled={isGenerating || !interest.trim()}
                    className="px-6 py-4 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
                    ) : 'Explore!'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {recentTopics.map(t => (
                    <button
                      key={t.label}
                      onClick={() => handleExplore(t.label)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-cream hover:bg-teal-50 border border-gray-200 rounded-full font-body text-xs font-semibold text-charcoal/60 hover:text-teal transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={t.icon}/></svg>
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                  <CoinIcon size={14} />
                  <span className="font-body text-xs text-amber-700">Earn <strong>+{COIN_REWARDS.module_completed} coins</strong> per module and <strong>+{COIN_REWARDS.path_completed} bonus</strong> for completing a path!</span>
                </div>
              </div>

              {/* Generating Animation */}
              {isGenerating && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 mb-6 text-center animate-fade-in">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-teal/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-teal border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="font-heading font-bold text-lg text-charcoal mb-1">Building your personalized learning path...</p>
                  <p className="font-body text-sm text-charcoal/50">Our AI is crafting something amazing just for you</p>
                  <div className="mt-4 flex justify-center gap-1">
                    {['Mapping standards', 'Creating modules', 'Adding fun activities', 'Almost ready'].map((step, i) => (
                      <span key={step} className="px-2 py-1 bg-teal-50 text-teal font-body text-xs rounded-full animate-pulse" style={{ animationDelay: `${i * 500}ms` }}>
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Path */}
              {currentPath && !isGenerating && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-bold text-lg text-charcoal">Today's Adventure</h3>

                      <p className="font-body text-xs text-charcoal/40">Topic: {currentPath.topic}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
                        <CoinIcon size={12} />
                        <span className="font-body text-xs text-amber-700 font-bold">
                          +{completedCount * COIN_REWARDS.module_completed}{completedCount === totalModules ? ` +${COIN_REWARDS.path_completed}` : ''}
                        </span>
                      </div>
                      <span className="font-body text-xs text-charcoal/40">{completedCount}/{totalModules} completed</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full mb-6 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }} />
                  </div>

                  <div className="space-y-4">
                    {currentPath.modules.map((m, i) => (
                      <div
                        key={m.id}
                        className={`bg-white rounded-2xl p-5 border transition-all duration-300 ${
                          m.completed ? 'border-green-200 bg-green-50/30' : m.locked ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:shadow-md hover:border-teal/20'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            m.completed ? 'bg-green-100' : m.locked ? 'bg-gray-100' : 'bg-teal-50'
                          }`}>
                            {m.completed ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : m.locked ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2" strokeLinecap="round"><path d={activityTypeIcon(m.activity_type)}/></svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-body font-semibold ${m.subject_color || 'bg-gray-100 text-gray-700'}`}>
                                {m.subject_display}
                              </span>
                              <span className="font-body text-xs text-charcoal/40">{m.time_estimate_minutes} min</span>
                              {!m.completed && !m.locked && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 rounded-full">
                                  <CoinIcon size={10} />
                                  <span className="font-body text-[10px] font-bold text-amber-700">+{COIN_REWARDS.module_completed}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-heading font-bold text-charcoal mb-1">{m.title}</h4>
                            <p className="font-body text-sm text-charcoal/50">{m.description}</p>
                            {m.subject_tags && m.subject_tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {m.subject_tags.map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-gray-50 text-charcoal/30 font-body text-[10px] rounded">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {!m.completed && !m.locked && (
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <button
                                onClick={() => startModule(m.id)}
                                className="px-4 py-2.5 bg-teal hover:bg-teal-dark text-white font-body font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                Start Lesson
                              </button>
                            </div>
                          )}

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!currentPath && !isGenerating && (
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 mb-6 text-center">
                  <img src={OWL_IMG} alt="Mentor" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-teal/20" />
                  <h3 className="font-heading font-bold text-xl text-charcoal mb-2">What fascinates you today?</h3>
                  <p className="font-body text-sm text-charcoal/50 max-w-md mx-auto">Type any topic above and I'll create a personalized adventure just for you. Every path secretly covers real school subjects through topics you love!</p>
                </div>
              )}


              {/* Tomorrow teaser */}
              {currentPath && !isGenerating && (
                <div className="bg-gradient-to-r from-teal to-teal-dark rounded-2xl p-6 text-white">
                  <p className="font-body text-sm text-white/60 mb-1">Coming up tomorrow...</p>
                  <p className="font-heading font-bold text-lg">{currentPath.tomorrow_teaser}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'library' && (
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-xl text-charcoal mb-4">My Library</h3>
              {pastPaths.length === 0 && !currentPath ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                  <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  <p className="font-heading font-bold text-charcoal mb-2">Your library is empty</p>
                  <p className="font-body text-sm text-charcoal/40">Complete learning paths to build your library!</p>
                </div>
              ) : (
                <>
                  {currentPath && (
                    <div className="bg-white rounded-2xl p-5 border-2 border-teal/20 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-teal-50 text-teal font-body text-xs font-bold rounded-full">Active</span>
                          </div>
                          <h4 className="font-heading font-bold text-charcoal">{currentPath.topic}</h4>
                          <p className="font-body text-xs text-charcoal/40 mt-1">{completedCount}/{totalModules} modules · {currentPath.created_at ? new Date(currentPath.created_at).toLocaleDateString() : 'Today'}</p>
                        </div>
                        <button onClick={() => setActiveTab('journey')} className="px-3 py-1.5 bg-teal text-white font-body font-semibold text-xs rounded-lg hover:bg-teal-dark transition-all">Continue</button>
                      </div>
                    </div>
                  )}
                  {pastPaths.map((path, i) => (
                    <div key={path.id || i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-heading font-bold text-charcoal">{path.topic}</h4>
                          <p className="font-body text-xs text-charcoal/40 mt-1">
                            {path.modules.filter(m => m.completed).length}/{path.modules.length} modules · {path.created_at ? new Date(path.created_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-50 text-green-700 font-body text-xs font-bold rounded-full">Completed</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-xl text-charcoal">Your Achievements</h3>
                <button
                  onClick={() => { setCurrentPage('shop'); window.scrollTo({ top: 0 }); }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-body text-sm font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
                  Visit Shop
                </button>
              </div>

              {/* Coin stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 text-center">
                  <CoinIcon size={24} />
                  <p className="font-heading font-bold text-2xl text-amber-800 mt-1">{currency.coins}</p>
                  <p className="font-body text-xs text-amber-600/60">Available</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                  <svg className="mx-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  <p className="font-heading font-bold text-2xl text-charcoal mt-1">{currency.total_earned}</p>
                  <p className="font-body text-xs text-charcoal/40">Total Earned</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200 text-center">
                  <svg className="mx-auto" width="24" height="24" viewBox="0 0 24 24" fill="#F97316"><path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/></svg>
                  <p className="font-heading font-bold text-2xl text-orange-700 mt-1">{currency.current_streak}</p>
                  <p className="font-body text-xs text-orange-600/60">Current Streak</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                  <svg className="mx-auto" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 100 14 7 7 0 000-14z"/></svg>
                  <p className="font-heading font-bold text-2xl text-charcoal mt-1">{currency.longest_streak}</p>
                  <p className="font-body text-xs text-charcoal/40">Best Streak</p>
                </div>
              </div>

              {/* Streak Milestones */}
              <h4 className="font-heading font-bold text-lg text-charcoal mb-4">Streak Milestones</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {STREAK_MILESTONES.map(ms => {
                  const reached = currency.current_streak >= ms.days || currency.longest_streak >= ms.days;
                  return (
                    <div key={ms.days} className={`relative p-4 rounded-2xl border text-center transition-all ${
                      reached ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}>
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        reached ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gray-200'
                      }`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={reached ? 'white' : '#9CA3AF'}>
                          <path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/>
                        </svg>
                      </div>
                      <p className="font-heading font-bold text-xs text-charcoal">{ms.label}</p>
                      <p className="font-body text-[10px] text-charcoal/40 mt-0.5">{ms.days} days</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <CoinIcon size={10} />
                        <span className="font-body text-[10px] font-bold text-amber-700">+{ms.bonus}</span>
                      </div>
                      {reached && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Earnable Badges */}
              <h4 className="font-heading font-bold text-lg text-charcoal mb-4">Badges</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {catalog.filter(b => b.is_earnable).map(badge => {
                  const owned = earnedBadges.some(eb => eb.item_id === badge.id);
                  const iconPath = badgeIcons[badge.name] || badge.icon_path || 'M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z';
                  const colorClass = rarityColors[badge.rarity] || rarityColors.common;

                  return (
                    <div key={badge.id} className={`${colorClass} border rounded-2xl p-4 text-center hover:shadow-md transition-all ${!owned ? 'opacity-40 grayscale' : ''}`}>
                      <div className="w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={iconPath}/></svg>
                      </div>
                      <p className="font-heading font-bold text-xs">{badge.name}</p>
                      <p className="font-body text-[10px] capitalize text-current/60 mt-0.5">{badge.rarity}</p>
                      {owned && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          <span className="font-body text-[10px] text-green-600 font-bold">Earned!</span>
                        </div>
                      )}
                      {!owned && badge.earn_condition && (
                        <p className="font-body text-[9px] text-current/40 mt-1">
                          {badge.earn_condition.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Weekly Streak Calendar */}
              <h4 className="font-heading font-bold text-lg text-charcoal mb-4">This Week</h4>
              <div className="flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const today = new Date().getDay();
                  const dayIndex = today === 0 ? 6 : today - 1;
                  const isToday = i === dayIndex;
                  const isPast = i < dayIndex;
                  const hasActivity = isPast && i >= Math.max(0, dayIndex - currency.current_streak + 1);

                  return (
                    <div key={day} className="flex-1 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1 transition-all ${
                        hasActivity ? 'bg-teal text-white' :
                        isToday ? 'bg-teal-50 text-teal border-2 border-dashed border-teal' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {hasActivity && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        {isToday && <span className="font-body text-xs font-bold">!</span>}
                      </div>
                      <span className={`font-body text-xs ${isToday ? 'text-teal font-bold' : 'text-charcoal/40'}`}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
