import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const heights = { sm: 28, md: 36, lg: 52 };
  const h = heights[size];

  return (
    <div className="flex items-center">
      <img
        src="https://d64gsuwffb70l.cloudfront.net/69c18955686636225623477e_1774668237877_bebe02a0.png"
        alt="FreeLearner"
        style={{ height: h }}
        className="object-contain"
      />
    </div>
  );
};

export default Logo;
