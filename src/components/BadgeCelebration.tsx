import React, { useEffect, useState } from 'react';
import { BadgeEarnedEvent } from '@/hooks/useGamification';

interface BadgeCelebrationProps {
  event: BadgeEarnedEvent;
  onClose: () => void;
}

const rarityConfig: Record<string, { gradient: string; ring: string; label: string; glow: string }> = {
  common: { gradient: 'from-teal-400 to-emerald-500', ring: 'ring-teal-300', label: 'Common', glow: 'shadow-teal-400/30' },
  rare: { gradient: 'from-blue-400 to-indigo-500', ring: 'ring-blue-300', label: 'Rare', glow: 'shadow-blue-400/30' },
  epic: { gradient: 'from-purple-400 to-pink-500', ring: 'ring-purple-300', label: 'Epic', glow: 'shadow-purple-400/30' },
  legendary: { gradient: 'from-amber-400 to-orange-500', ring: 'ring-amber-300', label: 'Legendary', glow: 'shadow-amber-400/30' },
};

const BadgeCelebration: React.FC<BadgeCelebrationProps> = ({ event, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number; size: number }[]>([]);
  const config = rarityConfig[event.badge.rarity] || rarityConfig.common;

  useEffect(() => {
    const newSparkles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 30 + (Math.random() - 0.5) * 40,
      delay: Math.random() * 1,
      size: 2 + Math.random() * 6,
    }));
    setSparkles(newSparkles);
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sparkle particles */}
      {sparkles.map(s => (
        <div
          key={s.id}
          className="absolute pointer-events-none rounded-full bg-white animate-sparkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
          }}
        />
      ))}

      <div className={`relative bg-white rounded-3xl p-8 lg:p-10 max-w-md w-full mx-4 shadow-2xl text-center transform transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}>
        {/* Badge icon with animated ring */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} opacity-20 animate-ping`} />
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 animate-pulse`} style={{ transform: 'scale(1.3)' }} />
          <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${config.gradient} ring-4 ${config.ring} flex items-center justify-center shadow-xl ${config.glow} animate-badge-reveal`}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={event.badge.icon_path || 'M12 15l-2 5-3-1 1 3h8l1-3-3 1-2-5z M8.21 13.89L7 23l5-3 5 3-1.21-9.12 M12 2a7 7 0 100 14 7 7 0 000-14z'} />
            </svg>
          </div>
        </div>

        {/* Rarity label */}
        <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${config.gradient} text-white font-body text-xs font-bold uppercase tracking-wider mb-3`}>
          {config.label}
        </div>

        <h2 className="font-heading font-bold text-2xl text-charcoal mb-1">
          Badge Unlocked!
        </h2>
        <h3 className={`font-heading font-bold text-xl bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent mb-3`}>
          {event.badge.name}
        </h3>
        <p className="font-body text-sm text-charcoal/60 mb-6">
          {event.badge.description}
        </p>

        {/* Bonus coins */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <text x="12" y="16" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold" stroke="none">C</text>
          </svg>
          <div className="text-left">
            <p className="font-heading font-bold text-lg text-amber-800">+{event.bonusCoins}</p>
            <p className="font-body text-[10px] text-amber-600">Bonus coins</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`w-full py-3 bg-gradient-to-r ${config.gradient} text-white font-heading font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:brightness-110`}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default BadgeCelebration;
