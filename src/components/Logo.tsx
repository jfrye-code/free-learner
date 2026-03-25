import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = { sm: 28, md: 36, lg: 48 };
  const s = sizes[size];
  const textSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div className="flex items-center gap-2">
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Brain shape */}
        <path d="M24 6C16 6 10 12 10 20C10 26 13 30 16 33C18 35 19 38 19 40H29C29 38 30 35 32 33C35 30 38 26 38 20C38 12 32 6 24 6Z" fill="#0D7377" />
        {/* Brain detail lines */}
        <path d="M24 10V30" stroke="#FFF8F0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M17 16C20 16 22 18 24 18C26 18 28 16 31 16" stroke="#FFF8F0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 23C19 23 21 25 24 25C27 25 29 23 32 23" stroke="#FFF8F0" strokeWidth="1.5" strokeLinecap="round" />
        {/* Shooting star / spark */}
        <path d="M34 8L38 4" stroke="#F4A261" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M37 10L40 8" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" />
        <path d="M36 6L39 5" stroke="#F4A261" strokeWidth="2" strokeLinecap="round" />
        {/* Lightbulb base */}
        <rect x="20" y="40" width="8" height="3" rx="1" fill="#F4A261" />
        <rect x="21" y="43" width="6" height="1.5" rx="0.75" fill="#F4A261" />
      </svg>
      {showText && (
        <span className={`font-heading font-bold ${textSizes[size]} text-charcoal`}>
          Free<span className="text-teal">Learner</span>
        </span>

      )}
    </div>
  );
};

export default Logo;
