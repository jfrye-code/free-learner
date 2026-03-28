import React, { useState, useEffect } from 'react';
import { XPEvent, SKILL_LABELS, SKILL_COLORS, LEVEL_TITLES, type SkillDomains } from '@/hooks/useProgression';

interface ProgressionFeedbackProps {
  event: XPEvent;
  currentLevel: number;
  onDismiss: () => void;
}

const ProgressionFeedback: React.FC<ProgressionFeedbackProps> = ({ event, currentLevel, onDismiss }) => {
  const [phase, setPhase] = useState<'xp' | 'skill' | 'quest' | 'achievement' | 'levelup' | 'identity'>('xp');
  const [visible, setVisible] = useState(false);
  const [xpCount, setXpCount] = useState(0);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 50);

    // Animate XP counter
    const target = event.xp_amount;
    const duration = 800;
    const steps = 20;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setXpCount(target);
        clearInterval(interval);
      } else {
        setXpCount(Math.floor(current));
      }
    }, duration / steps);

    // Phase progression
    const phases: typeof phase[] = ['xp'];
    if (event.skill_domain && event.skill_amount) phases.push('skill');
    if (event.quest_progress?.length) phases.push('quest');
    if (event.new_achievements?.length) phases.push('achievement');
    if (event.level_up) phases.push('levelup');
    phases.push('identity');

    let phaseIdx = 0;
    const phaseInterval = setInterval(() => {
      phaseIdx++;
      if (phaseIdx < phases.length) {
        setPhase(phases[phaseIdx]);
      } else {
        clearInterval(phaseInterval);
      }
    }, 1800);

    // Auto dismiss after all phases
    const totalTime = phases.length * 1800 + 2000;
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, totalTime);

    return () => {
      clearInterval(interval);
      clearInterval(phaseInterval);
      clearTimeout(dismissTimer);
    };
  }, []);

  const skillColor = event.skill_domain ? SKILL_COLORS[event.skill_domain] : null;
  const skillLabel = event.skill_domain ? SKILL_LABELS[event.skill_domain] : null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      onClick={onDismiss}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-80 cursor-pointer hover:shadow-3xl transition-shadow">
        {/* XP Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p className="font-heading font-bold text-2xl text-white">+{xpCount} XP</p>
                <p className="font-body text-xs text-white/70">{event.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body text-[10px] text-white/50 uppercase tracking-wider">Level {currentLevel}</p>
              <p className="font-heading font-bold text-xs text-white/80">{LEVEL_TITLES[Math.min(currentLevel - 1, LEVEL_TITLES.length - 1)]}</p>
            </div>
          </div>
        </div>

        {/* Dynamic content area */}
        <div className="px-5 py-4 space-y-3">
          {/* Skill Growth */}
          {(phase === 'skill' || phase === 'quest' || phase === 'achievement' || phase === 'levelup' || phase === 'identity') && event.skill_domain && skillColor && (
            <div className={`flex items-center gap-3 p-3 rounded-xl ${skillColor.bg} animate-fade-in`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/60`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={skillColor.fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className={`font-heading font-bold text-sm ${skillColor.text}`}>
                  {skillLabel} +{event.skill_amount}
                </p>
                <p className="font-body text-[10px] text-charcoal/40">Skill growth</p>
              </div>
            </div>
          )}

          {/* Quest Progress */}
          {(phase === 'quest' || phase === 'achievement' || phase === 'levelup' || phase === 'identity') && event.quest_progress?.map(qp => (
            <div key={qp.quest_id} className={`flex items-center gap-3 p-3 rounded-xl animate-fade-in ${
              qp.completed ? 'bg-green-50' : 'bg-amber-50'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                qp.completed ? 'bg-green-100' : 'bg-amber-100'
              }`}>
                {qp.completed ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-heading font-bold text-xs ${qp.completed ? 'text-green-700' : 'text-amber-700'}`}>
                  {qp.completed ? 'Quest Complete!' : 'Quest Progress'}
                </p>
                <p className="font-body text-[10px] text-charcoal/40">
                  {qp.quest_id.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          ))}

          {/* Achievement */}
          {(phase === 'achievement' || phase === 'levelup' || phase === 'identity') && event.new_achievements?.map(ach => (
            <div key={ach.id} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ach.icon}/>
                </svg>
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-purple-700">Achievement Unlocked!</p>
                <p className="font-body text-xs text-purple-600">{ach.name}</p>
              </div>
            </div>
          ))}

          {/* Level Up */}
          {(phase === 'levelup' || phase === 'identity') && event.level_up && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-center animate-fade-in">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <span className="font-heading font-bold text-lg text-white">{event.level_up.new_level}</span>
              </div>
              <p className="font-heading font-bold text-amber-800">Level Up!</p>
              <p className="font-body text-xs text-amber-600">
                {LEVEL_TITLES[Math.min(event.level_up.new_level - 1, LEVEL_TITLES.length - 1)]}
              </p>
            </div>
          )}

          {/* Identity Reinforcement - always shows */}
          {phase === 'identity' && (
            <div className="pt-2 border-t border-gray-100 animate-fade-in">
              <p className="font-body text-sm text-charcoal/70 italic leading-relaxed">
                "{event.identity_message}"
              </p>
            </div>
          )}
        </div>

        {/* Tap to dismiss hint */}
        <div className="px-5 pb-3">
          <p className="font-body text-[10px] text-charcoal/30 text-center">tap to dismiss</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressionFeedback;
