import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import GoalHistory from '@/components/GoalHistory';

interface Goal {
  id: string;
  parent_id: string;
  child_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  week_start: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface GoalSuggestion {
  goal_type: string;
  target_value: number;
  reason: string;
  priority: string;
  confidence: number;
  tip: string;
  // Local state for modification
  modified_target?: number;
  accepted?: boolean;
  rejected?: boolean;
}

interface GoalsManagerProps {
  childId: string;
  childName: string;
  parentId: string;
  childAge?: number;
  gradeLevel?: string;
  interests?: string[];
  compact?: boolean;
}

const GOAL_TYPES = [
  {
    type: 'time_minutes',
    label: 'Learning Time',
    unit: 'minutes',
    icon: 'M12 6v6l4 2',
    iconCircle: 'M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z',
    color: '#0D7377',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal',
    min: 15,
    max: 600,
    step: 15,
    default: 120,
    formatValue: (v: number) => v >= 60 ? `${Math.floor(v / 60)}h ${v % 60 > 0 ? `${v % 60}m` : ''}` : `${v}m`,
  },
  {
    type: 'modules_completed',
    label: 'Modules Completed',
    unit: 'modules',
    icon: 'M9 12l2 2 4-4',
    iconCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14',
    color: '#22C55E',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    min: 1,
    max: 30,
    step: 1,
    default: 5,
    formatValue: (v: number) => `${v}`,
  },
  {
    type: 'subjects_covered',
    label: 'Subjects Covered',
    unit: 'subjects',
    icon: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
    iconCircle: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    min: 1,
    max: 8,
    step: 1,
    default: 3,
    formatValue: (v: number) => `${v}`,
  },
  {
    type: 'streak_days',
    label: 'Streak Days',
    unit: 'days',
    icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    iconCircle: '',
    color: '#F59E0B',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    min: 1,
    max: 7,
    step: 1,
    default: 5,
    formatValue: (v: number) => `${v}d`,
  },
  {
    type: 'quiz_score_avg',
    label: 'Avg Quiz Score',
    unit: '%',
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
    iconCircle: 'M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    min: 50,
    max: 100,
    step: 5,
    default: 75,
    formatValue: (v: number) => `${v}%`,
  },
];

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const ws = new Date(now.setDate(diff));
  return ws.toISOString().split('T')[0];
}

function getWeekOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const ws = new Date(now);
    ws.setDate(ws.getDate() - ws.getDay() + i * 7);
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    options.push({
      value: ws.toISOString().split('T')[0],
      label: i === 0 ? `This Week (${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` :
        i === 1 ? `Next Week (${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` :
          `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    });
  }
  return options;
}

const GoalsManager: React.FC<GoalsManagerProps> = ({ childId, childName, parentId, childAge, gradeLevel, interests, compact = false }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekStart());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'goals' | 'history'>('goals');

  // New goal form state
  const [newGoalType, setNewGoalType] = useState('time_minutes');
  const [newGoalTarget, setNewGoalTarget] = useState(120);

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionContext, setSuggestionContext] = useState<any>(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: { action: 'list-goals', childId, weekStart: selectedWeek },
      });
      if (error) throw error;
      setGoals(data?.goals || []);
    } catch (err) {
      console.warn('Failed to load goals:', err);
      setGoals([]);
    }
    setLoading(false);
  }, [childId, selectedWeek]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const saveGoal = async (goalId?: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('generate-report', {
        body: {
          action: 'upsert-goal',
          goalId,
          childId,
          goalType: newGoalType,
          targetValue: newGoalTarget,
          weekStart: selectedWeek,
        },
      });
      if (error) throw error;
      setShowAddForm(false);
      setEditingGoal(null);
      loadGoals();
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
    setSaving(false);
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await supabase.functions.invoke('generate-report', {
        body: { action: 'delete-goal', goalId },
      });
      loadGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const startEdit = (goal: Goal) => {
    setNewGoalType(goal.goal_type);
    setNewGoalTarget(goal.target_value);
    setEditingGoal(goal.id);
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingGoal(null);
    setNewGoalType('time_minutes');
    setNewGoalTarget(120);
  };

  const getGoalConfig = (type: string) => GOAL_TYPES.find(g => g.type === type) || GOAL_TYPES[0];

  const existingGoalTypes = goals.map(g => g.goal_type);
  const availableTypes = GOAL_TYPES.filter(gt => !existingGoalTypes.includes(gt.type) || editingGoal);

  const handleTypeChange = (type: string) => {
    setNewGoalType(type);
    const config = getGoalConfig(type);
    setNewGoalTarget(config.default);
  };

  // ─── AI GOAL SUGGESTIONS ───
  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          action: 'suggest-goals',
          childId,
          childName,
          childAge,
          gradeLevel,
          interests,
          weekStart: selectedWeek,
        },
      });
      if (error) throw error;
      setSuggestions((data?.suggestions || []).map((s: any) => ({
        ...s,
        modified_target: s.target_value,
        accepted: false,
        rejected: false,
      })));
      setSuggestionContext(data?.context || null);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
      setSuggestions([]);
    }
    setLoadingSuggestions(false);
  };

  const acceptSuggestion = async (suggestion: GoalSuggestion) => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('generate-report', {
        body: {
          action: 'upsert-goal',
          childId,
          goalType: suggestion.goal_type,
          targetValue: suggestion.modified_target || suggestion.target_value,
          weekStart: selectedWeek,
        },
      });
      if (error) throw error;
      setSuggestions(prev => prev.map(s =>
        s.goal_type === suggestion.goal_type ? { ...s, accepted: true } : s
      ));
      loadGoals();
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    }
    setSaving(false);
  };

  const rejectSuggestion = (goalType: string) => {
    setSuggestions(prev => prev.map(s =>
      s.goal_type === goalType ? { ...s, rejected: true } : s
    ));
  };

  const modifySuggestionTarget = (goalType: string, newTarget: number) => {
    setSuggestions(prev => prev.map(s =>
      s.goal_type === goalType ? { ...s, modified_target: newTarget } : s
    ));
  };

  const handleApplyHistoryTarget = (goalType: string, target: number) => {
    setNewGoalType(goalType);
    setNewGoalTarget(target);
    setShowAddForm(true);
    setActiveSection('goals');
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-bold text-sm text-charcoal">Weekly Goals</h4>
          <button onClick={() => { setShowAddForm(true); setEditingGoal(null); }} className="font-body text-xs text-teal font-semibold hover:underline">+ Add Goal</button>
        </div>
        {loading ? (
          <div className="text-center py-4">
            <svg className="animate-spin mx-auto" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D7377" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>
          </div>
        ) : goals.length === 0 && !showAddForm ? (
          <div className="text-center py-4">
            <p className="font-body text-xs text-charcoal/40">No goals set for this week</p>
            <button onClick={() => setShowAddForm(true)} className="mt-2 px-4 py-1.5 bg-teal/10 text-teal font-body text-xs font-semibold rounded-lg hover:bg-teal/20 transition-all">Set First Goal</button>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map(goal => {
              const config = getGoalConfig(goal.goal_type);
              const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
              const met = goal.current_value >= goal.target_value;
              return (
                <div key={goal.id} className={`p-3 rounded-xl border ${met ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${config.bgColor}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={config.icon} />{config.iconCircle && <path d={config.iconCircle} />}</svg>
                      </div>
                      <span className="font-body text-xs font-semibold text-charcoal">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`font-heading font-bold text-xs ${met ? 'text-green-600' : config.textColor}`}>{config.formatValue(goal.current_value)} / {config.formatValue(goal.target_value)}</span>
                      {met && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${met ? 'bg-green-500' : ''}`} style={{ width: `${pct}%`, backgroundColor: met ? undefined : config.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {showAddForm && (
          <div className="p-3 bg-cream rounded-xl border border-gray-200 space-y-3">
            <select value={newGoalType} onChange={(e) => handleTypeChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 font-body text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal/30">
              {(editingGoal ? GOAL_TYPES : availableTypes).map(gt => (<option key={gt.type} value={gt.type}>{gt.label}</option>))}
            </select>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-xs text-charcoal/60">Target</span>
                <span className="font-heading font-bold text-sm text-charcoal">{getGoalConfig(newGoalType).formatValue(newGoalTarget)}</span>
              </div>
              <input type="range" min={getGoalConfig(newGoalType).min} max={getGoalConfig(newGoalType).max} step={getGoalConfig(newGoalType).step} value={newGoalTarget} onChange={(e) => setNewGoalTarget(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-teal" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => saveGoal(editingGoal || undefined)} disabled={saving} className="flex-1 py-1.5 bg-teal text-white font-body text-xs font-semibold rounded-lg hover:bg-teal-dark transition-all disabled:opacity-50">{saving ? 'Saving...' : editingGoal ? 'Update' : 'Add Goal'}</button>
              <button onClick={cancelForm} className="px-3 py-1.5 bg-gray-100 text-charcoal/60 font-body text-xs rounded-lg hover:bg-gray-200 transition-all">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── FULL VIEW ───
  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('goals')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
            activeSection === 'goals' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-charcoal/60 hover:border-indigo-200'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Current Goals
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
            activeSection === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-charcoal/60 hover:border-indigo-200'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          History & Trends
        </button>
      </div>

      {/* HISTORY TAB */}
      {activeSection === 'history' && (
        <GoalHistory
          childId={childId}
          childName={childName}
          parentId={parentId}
          onApplyTarget={handleApplyHistoryTarget}
        />
      )}

      {/* GOALS TAB */}
      {activeSection === 'goals' && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 lg:p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="font-heading font-bold text-xl lg:text-2xl mb-1">Weekly Learning Goals</h2>
                <p className="font-body text-sm text-white/70">Set targets for {childName}'s learning journey and track progress</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className="px-4 py-2.5 rounded-xl bg-white/15 text-white font-body text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 appearance-none cursor-pointer">
                  {getWeekOptions().map(opt => (<option key={opt.value} value={opt.value} className="text-charcoal">{opt.label}</option>))}
                </select>
                {/* AI Suggest Button */}
                <button
                  onClick={loadSuggestions}
                  disabled={loadingSuggestions}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-heading font-bold text-sm rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg disabled:opacity-60"
                >
                  {loadingSuggestions ? (
                    <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>Analyzing...</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>Suggest Goals</>
                  )}
                </button>
                {!showAddForm && availableTypes.length > 0 && (
                  <button onClick={() => { setShowAddForm(true); setEditingGoal(null); handleTypeChange(availableTypes[0].type); }} className="px-5 py-2.5 bg-white text-indigo-600 font-heading font-bold text-sm rounded-xl hover:bg-white/90 transition-all flex items-center gap-2 whitespace-nowrap">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Goal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* AI SUGGESTIONS PANEL */}
          {showSuggestions && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-charcoal">AI-Suggested Goals</h3>
                    <p className="font-body text-xs text-charcoal/40">
                      Based on {childName}'s recent activity and past performance
                      {suggestionContext && ` (${suggestionContext.recentActivityCount} activities analyzed)`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowSuggestions(false)} className="p-2 rounded-lg hover:bg-amber-100 text-charcoal/40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {loadingSuggestions ? (
                <div className="text-center py-8">
                  <svg className="animate-spin mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                  <p className="font-body text-sm text-charcoal/40">Analyzing learning patterns and generating suggestions...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-body text-sm text-charcoal/40">No suggestions available. Try generating more activity data first.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.filter(s => !s.rejected).map((suggestion) => {
                    const config = getGoalConfig(suggestion.goal_type);
                    const isAccepted = suggestion.accepted;
                    const isExisting = existingGoalTypes.includes(suggestion.goal_type);

                    return (
                      <div
                        key={suggestion.goal_type}
                        className={`bg-white rounded-xl p-5 border-2 transition-all ${
                          isAccepted ? 'border-green-300 bg-green-50/30 opacity-75' :
                          'border-amber-200 hover:border-amber-300 hover:shadow-md'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={config.icon}/>{config.iconCircle && <path d={config.iconCircle}/>}</svg>
                            </div>
                            <div>
                              <p className="font-heading font-bold text-sm text-charcoal">{config.label}</p>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  suggestion.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{suggestion.priority}</span>
                                <span className="font-body text-[10px] text-charcoal/30">{suggestion.confidence}% confidence</span>
                              </div>
                            </div>
                          </div>
                          {isAccepted && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>

                        {/* Target with modifier */}
                        <div className="mb-3">
                          <div className="flex items-end justify-between mb-1">
                            <span className="font-heading font-bold text-2xl" style={{ color: config.color }}>
                              {config.formatValue(suggestion.modified_target || suggestion.target_value)}
                            </span>
                          </div>
                          {!isAccepted && (
                            <input
                              type="range"
                              min={config.min}
                              max={config.max}
                              step={config.step}
                              value={suggestion.modified_target || suggestion.target_value}
                              onChange={(e) => modifySuggestionTarget(suggestion.goal_type, Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor: config.color }}
                            />
                          )}
                        </div>

                        {/* Reason */}
                        <p className="font-body text-xs text-charcoal/60 mb-2">{suggestion.reason}</p>

                        {/* Tip */}
                        {suggestion.tip && (
                          <div className="p-2.5 bg-amber-50 rounded-lg mb-3">
                            <p className="font-body text-[10px] text-amber-700 flex items-start gap-1.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                              {suggestion.tip}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {!isAccepted && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptSuggestion(suggestion)}
                              disabled={saving || isExisting}
                              className={`flex-1 py-2 font-body text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                isExisting
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              {isExisting ? 'Already Set' : saving ? 'Saving...' : 'Accept'}
                            </button>
                            <button
                              onClick={() => rejectSuggestion(suggestion.goal_type)}
                              className="px-3 py-2 bg-gray-100 text-charcoal/50 font-body text-xs rounded-lg hover:bg-gray-200 transition-all"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Accept All / Dismiss */}
              {suggestions.filter(s => !s.rejected && !s.accepted).length > 1 && !loadingSuggestions && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-amber-200">
                  <button
                    onClick={async () => {
                      for (const s of suggestions.filter(s => !s.rejected && !s.accepted && !existingGoalTypes.includes(s.goal_type))) {
                        await acceptSuggestion(s);
                      }
                    }}
                    disabled={saving}
                    className="px-6 py-2.5 bg-green-600 text-white font-heading font-bold text-sm rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Accept All New
                  </button>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="px-6 py-2.5 bg-white text-charcoal/60 font-body text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all border border-gray-200"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-heading font-bold text-2xl text-charcoal">{goals.length}</p>
              <p className="font-body text-xs text-charcoal/40">Goals Set</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-heading font-bold text-2xl text-green-600">{goals.filter(g => g.status === 'met' || g.current_value >= g.target_value).length}</p>
              <p className="font-body text-xs text-charcoal/40">Goals Met</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-heading font-bold text-2xl text-amber-600">{goals.filter(g => g.status === 'active' && g.current_value < g.target_value && g.current_value > 0).length}</p>
              <p className="font-body text-xs text-charcoal/40">In Progress</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="font-heading font-bold text-2xl text-charcoal">
                {goals.length > 0 ? Math.round(goals.reduce((s, g) => s + Math.min(100, (g.current_value / g.target_value) * 100), 0) / goals.length) : 0}%
              </p>
              <p className="font-body text-xs text-charcoal/40">Avg Completion</p>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4">{editingGoal ? 'Edit Goal' : 'Set New Goal'}</h3>
              <div className="mb-6">
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Goal Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {(editingGoal ? GOAL_TYPES : availableTypes).map(gt => (
                    <button key={gt.type} onClick={() => handleTypeChange(gt.type)} className={`p-4 rounded-xl border-2 text-center transition-all ${newGoalType === gt.type ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-indigo-200 bg-white'}`}>
                      <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${gt.bgColor}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gt.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={gt.icon}/>{gt.iconCircle && <path d={gt.iconCircle}/>}</svg>
                      </div>
                      <p className="font-body text-xs font-semibold text-charcoal">{gt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="font-body text-sm font-semibold text-charcoal/70 mb-3 block">Target Value</label>
                <div className="bg-cream rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-body text-sm text-charcoal/60">{getGoalConfig(newGoalType).label}</span>
                    <span className="font-heading font-bold text-2xl" style={{ color: getGoalConfig(newGoalType).color }}>{getGoalConfig(newGoalType).formatValue(newGoalTarget)}</span>
                  </div>
                  <input type="range" min={getGoalConfig(newGoalType).min} max={getGoalConfig(newGoalType).max} step={getGoalConfig(newGoalType).step} value={newGoalTarget} onChange={(e) => setNewGoalTarget(Number(e.target.value))} className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500" />
                  <div className="flex justify-between mt-1">
                    <span className="font-body text-xs text-charcoal/30">{getGoalConfig(newGoalType).formatValue(getGoalConfig(newGoalType).min)}</span>
                    <span className="font-body text-xs text-charcoal/30">{getGoalConfig(newGoalType).formatValue(getGoalConfig(newGoalType).max)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => saveGoal(editingGoal || undefined)} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white font-heading font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? (<><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>Saving...</>) : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
                <button onClick={cancelForm} className="px-6 py-2.5 bg-gray-100 text-charcoal/60 font-body text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
              </div>
            </div>
          )}

          {/* Goals List */}
          {loading ? (
            <div className="text-center py-16">
              <svg className="animate-spin mx-auto mb-4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p className="font-body text-sm text-charcoal/40">Loading goals...</p>
            </div>
          ) : goals.length === 0 && !showAddForm ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              </div>
              <h3 className="font-heading font-bold text-lg text-charcoal mb-2">No Goals Set Yet</h3>
              <p className="font-body text-sm text-charcoal/40 mb-6 max-w-md mx-auto">Set weekly learning targets for {childName} to track progress and keep them motivated. Goals are tracked in weekly reports!</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { setShowAddForm(true); handleTypeChange(GOAL_TYPES[0].type); }} className="px-8 py-3 bg-indigo-600 text-white font-heading font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all">Set First Goal</button>
                <button onClick={loadSuggestions} disabled={loadingSuggestions} className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-heading font-bold text-sm rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                  AI Suggest Goals
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map(goal => {
                const config = getGoalConfig(goal.goal_type);
                const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
                const met = goal.current_value >= goal.target_value;
                return (
                  <div key={goal.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${met ? 'border-green-200' : 'border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={config.icon}/>{config.iconCircle && <path d={config.iconCircle}/>}</svg>
                        </div>
                        <div>
                          <p className="font-heading font-bold text-sm text-charcoal">{config.label}</p>
                          <p className="font-body text-[10px] text-charcoal/30">{met ? 'Goal Met!' : `${pct}% complete`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(goal)} className="p-1.5 rounded-lg hover:bg-gray-100 text-charcoal/30 hover:text-charcoal/60 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => { if (confirm('Delete this goal?')) deleteGoal(goal.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-charcoal/30 hover:text-red-500 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-end justify-between mb-2">
                        <span className="font-heading font-bold text-3xl" style={{ color: met ? '#22C55E' : config.color }}>{config.formatValue(goal.current_value)}</span>
                        <span className="font-body text-xs text-charcoal/40">of {config.formatValue(goal.target_value)}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${met ? 'bg-green-500' : ''}`} style={{ width: `${pct}%`, backgroundColor: met ? undefined : config.color }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-lg font-body text-[10px] font-bold ${met ? 'bg-green-50 text-green-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : pct > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'}`}>
                        {met ? 'Completed' : pct >= 50 ? 'On Track' : pct > 0 ? 'In Progress' : 'Not Started'}
                      </span>
                      {met && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoalsManager;
