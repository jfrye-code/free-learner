import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = { sm: 26, md: 32, lg: 44 };
  const s = sizes[size];
  const textSizes = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' };

  return (
    <div className="flex items-center gap-2.5">
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shield / book shape */}
        <rect x="4" y="4" width="32" height="32" rx="8" fill="#2B7A78" />
        {/* Abstract open book / learning path */}
        <path d="M12 14C14 12 17 11 20 13C23 11 26 12 28 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 13V27" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        <path d="M12 20C14 18 17 17 20 19C23 17 26 18 28 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
        {/* Spark accent */}
        <circle cx="30" cy="10" r="3" fill="#E07A3A" />
        <path d="M30 7V13M27 10H33" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {showText && (
        <div className="flex items-baseline gap-1.5">
          <span className={`font-heading font-bold ${textSizes[size]} text-charcoal tracking-tight`}>
            Free<span className="text-teal">Learner</span>
          </span>
          <span className="px-1.5 py-0.5 bg-teal/10 text-teal text-[9px] font-semibold font-body uppercase tracking-wider rounded leading-none">
            Beta
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
