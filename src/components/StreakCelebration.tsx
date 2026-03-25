import React, { useEffect, useState } from 'react';
import { StreakMilestone } from '@/hooks/useGamification';

interface StreakCelebrationProps {
  milestone: StreakMilestone;
  onClose: () => void;
}

const StreakCelebration: React.FC<StreakCelebrationProps> = ({ milestone, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; color: string; size: number }[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
    }));
    setParticles(newParticles);

    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Confetti particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute pointer-events-none animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `-${10 + p.y * 0.3}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}

      <div className={`relative bg-white rounded-3xl p-8 lg:p-10 max-w-md w-full mx-4 shadow-2xl text-center transform transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}>
        {/* Fire icon with glow */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-orange-400/20 rounded-full animate-ping" />
          <div className="absolute inset-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-full animate-pulse flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 23c-3.5 0-8-2.5-8-9 0-4 2-7 4-9.5.5-.5 1.5-.3 1.5.5 0 1 .5 2 1.5 2 .5 0 1-.5 1-1 0-2 1-4 2-5.5.5-.5 1.5-.3 1.5.5 0 3 3 5 3 8 0 1-.5 2-1 2.5 1-1 2-2.5 2-4 .3-.5 1-.5 1.3 0C22 10 22 13 22 14c0 6.5-4.5 9-10 9z"/>
            </svg>
          </div>
        </div>

        <h2 className="font-heading font-bold text-3xl text-charcoal mb-2">
          {milestone.label}
        </h2>
        <p className="font-body text-charcoal/60 mb-6">
          You've been exploring for <span className="font-bold text-orange-600">{milestone.days} days</span> in a row! Keep up the amazing adventure!
        </p>


        {/* Bonus coins */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <text x="12" y="16" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold" stroke="none">C</text>
          </svg>
          <div className="text-left">
            <p className="font-heading font-bold text-2xl text-amber-800">+{milestone.bonus}</p>
            <p className="font-body text-xs text-amber-600">Bonus coins earned!</p>
          </div>
        </div>

        {/* Streak visualization */}
        <div className="flex justify-center gap-1 mb-6">
          {Array.from({ length: Math.min(milestone.days, 14) }, (_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500 animate-scale-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
          {milestone.days > 14 && (
            <span className="font-body text-xs text-orange-600 font-bold self-center ml-1">+{milestone.days - 14}</span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-heading font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          Keep the Streak Going!
        </button>
      </div>
    </div>
  );
};

export default StreakCelebration;
