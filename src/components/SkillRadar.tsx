import React from 'react';
import { type SkillDomains, SKILL_LABELS, SKILL_COLORS, SKILL_ICONS } from '@/hooks/useProgression';

interface SkillRadarProps {
  skills: SkillDomains;
  size?: number;
  showLabels?: boolean;
  showBars?: boolean;
}

const SkillRadar: React.FC<SkillRadarProps> = ({ skills, size = 240, showLabels = true, showBars = true }) => {
  const center = size / 2;
  const radius = size / 2 - 40;
  const domains = Object.keys(skills) as (keyof SkillDomains)[];
  const angleStep = (2 * Math.PI) / domains.length;

  // Generate polygon points for a given scale (0-1)
  const getPolygonPoints = (scale: number) => {
    return domains.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * scale * Math.cos(angle);
      const y = center + radius * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Get point for a specific domain at its value
  const getSkillPoints = () => {
    return domains.map((domain, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const value = Math.min(skills[domain] / 100, 1);
      const x = center + radius * value * Math.cos(angle);
      const y = center + radius * value * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  // Label positions
  const getLabelPos = (i: number) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = radius + 28;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle),
    };
  };

  return (
    <div>
      {/* Radar Chart */}
      <div className="flex justify-center mb-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background rings */}
          {[0.25, 0.5, 0.75, 1].map(scale => (
            <polygon
              key={scale}
              points={getPolygonPoints(scale)}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
              opacity={0.6}
            />
          ))}

          {/* Axis lines */}
          {domains.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                opacity={0.4}
              />
            );
          })}

          {/* Skill polygon fill */}
          <polygon
            points={getSkillPoints()}
            fill="url(#skillGradient)"
            stroke="url(#skillStroke)"
            strokeWidth="2"
            opacity={0.8}
            className="transition-all duration-1000"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="skillStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          {/* Skill dots */}
          {domains.map((domain, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const value = Math.min(skills[domain] / 100, 1);
            const x = center + radius * value * Math.cos(angle);
            const y = center + radius * value * Math.sin(angle);
            const color = SKILL_COLORS[domain];
            return (
              <g key={domain}>
                <circle cx={x} cy={y} r="5" fill={color.fill} stroke="white" strokeWidth="2" className="transition-all duration-1000" />
                <circle cx={x} cy={y} r="8" fill={color.fill} opacity="0.2" className="transition-all duration-1000" />
              </g>
            );
          })}

          {/* Labels */}
          {showLabels && domains.map((domain, i) => {
            const pos = getLabelPos(i);
            const color = SKILL_COLORS[domain];
            return (
              <text
                key={domain}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-heading font-bold"
                fontSize="9"
                fill={color.fill}
              >
                {SKILL_LABELS[domain]}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Skill Bars */}
      {showBars && (
        <div className="space-y-2.5">
          {domains.map(domain => {
            const color = SKILL_COLORS[domain];
            const value = skills[domain];
            return (
              <div key={domain} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color.bg}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={SKILL_ICONS[domain]} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`font-heading font-bold text-xs ${color.text}`}>{SKILL_LABELS[domain]}</span>
                    <span className="font-body text-[10px] text-charcoal/40">{value}/100</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color.fill }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SkillRadar;
