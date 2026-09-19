import React from 'react';

interface JubaNewsLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  width?: number | string;
  height?: number | string;
  className?: string;
  showText?: boolean;
  subtext?: string;
}

const sizeMap = {
  xs: { emblem: 28, textClass: 'text-sm' },
  sm: { emblem: 38, textClass: 'text-base' },
  md: { emblem: 52, textClass: 'text-xl sm:text-2xl' },
  lg: { emblem: 68, textClass: 'text-2xl sm:text-3xl' },
  xl: { emblem: 90, textClass: 'text-3xl sm:text-4xl' },
  '2xl': { emblem: 120, textClass: 'text-4xl sm:text-5xl' },
  custom: { emblem: 52, textClass: 'text-2xl' },
};

/**
 * Official Juba News Logo Emblem Component
 * Faithfully matches the brand identity with:
 * - Royal Blue gradient rounded container
 * - Transverse vibrant Red banner with bold white "JUBA"
 * - Clean white tracked "NEWS" typography on blue base
 */
export const JubaNewsEmblem: React.FC<{
  size?: number | string;
  className?: string;
  idSuffix?: string;
}> = ({ size = 52, className = '', idSuffix = 'main' }) => {
  const blueGradId = `juba-blue-grad-${idSuffix}`;
  const redGradId = `juba-red-grad-${idSuffix}`;
  const shadowId = `juba-shadow-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 360 360"
      width={size}
      height={size}
      className={`inline-block select-none overflow-visible flex-shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Juba News Logo"
    >
      <defs>
        {/* Deep Royal Blue Gradient */}
        <linearGradient id={blueGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1d5bdc" />
          <stop offset="55%" stopColor="#1743b8" />
          <stop offset="100%" stopColor="#0f3090" />
        </linearGradient>

        {/* Vibrant Crimson Red Gradient */}
        <linearGradient id={redGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ee1d2d" />
          <stop offset="100%" stopColor="#cc101e" />
        </linearGradient>

        {/* Soft Depth Filter */}
        <filter id={shadowId} x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* 1. Main Royal Blue Rounded Square Box */}
      <rect
        x="42"
        y="26"
        width="276"
        height="308"
        rx="58"
        ry="58"
        fill={`url(#${blueGradId})`}
      />

      {/* 2. Overhanging Vibrant Red Banner */}
      <rect
        x="12"
        y="60"
        width="336"
        height="146"
        rx="32"
        ry="32"
        fill={`url(#${redGradId})`}
        filter={`url(#${shadowId})`}
      />

      {/* 3. "JUBA" Bold White Lettering in Red Banner */}
      <text
        x="180"
        y="166"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, 'Helvetica Neue', 'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="86"
        letterSpacing="4"
        style={{ userSelect: 'none' }}
      >
        JUBA
      </text>

      {/* 4. "NEWS" Bold White Lettering in Blue Area */}
      <text
        x="180"
        y="272"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="system-ui, -apple-system, 'Helvetica Neue', 'Arial Black', sans-serif"
        fontWeight="900"
        fontSize="60"
        letterSpacing="8"
        style={{ userSelect: 'none' }}
      >
        NEWS
      </text>
    </svg>
  );
};

export const JubaNewsLogo: React.FC<JubaNewsLogoProps> = ({
  size = 'md',
  width,
  height,
  className = '',
  showText = true,
  subtext,
}) => {
  const currentSize = sizeMap[size] || sizeMap.md;
  const emblemSize = width || currentSize.emblem;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Official Emblem */}
      <div className="relative flex-shrink-0 transition-transform duration-200 hover:scale-105">
        <JubaNewsEmblem size={emblemSize} idSuffix={String(emblemSize)} />
      </div>

      {/* Optional Typographic Lockup */}
      {showText && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-black tracking-tight font-editorial ${currentSize.textClass} text-stone-950 dark:text-stone-50 uppercase flex items-center gap-1`}>
              <span className="text-red-600 dark:text-red-500">JUBA</span>
              <span className="text-blue-700 dark:text-blue-400">NEWS</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 font-semibold tracking-wider uppercase mt-0.5">
            <span>جوبا نيوز</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="truncate">
              {subtext || 'South Sudan & Pan-African Independent Press'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
