import React, { useId } from 'react';

interface DarsLogoProps {
  className?: string;
}

/**
 * Official Dars with Osama brand emblem sourced directly from https://darswithosama.netlify.app/
 */
export const DarsLogo: React.FC<DarsLogoProps> = ({ className = 'w-16 h-16' }) => {
  const uid = useId().replace(/:/g, '');
  const greenGradId = `darsGreenGrad-${uid}`;
  const goldGradId = `darsGoldGrad-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Logo Dars with Osama"
    >
      <defs>
        <linearGradient id={greenGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A5345" />
          <stop offset="100%" stopColor="#123D32" />
        </linearGradient>
        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E5C26B" />
          <stop offset="50%" stopColor="#D6AD52" />
          <stop offset="100%" stopColor="#B38936" />
        </linearGradient>
      </defs>
      <rect
        x="8"
        y="8"
        width="104"
        height="104"
        rx="18"
        fill={`url(#${greenGradId})`}
        stroke="#D6AD52"
        strokeWidth="4"
      />
      <rect
        x="15"
        y="15"
        width="90"
        height="90"
        rx="12"
        stroke="#D6AD52"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.75"
      />
      <g transform="translate(60, 28)">
        <rect x="-6" y="-6" width="12" height="12" fill={`url(#${goldGradId})`} />
        <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill={`url(#${goldGradId})`} />
        <circle cx="0" cy="0" r="2.5" fill="#123D32" />
      </g>
      <path
        d="M36 44C36 60 46.7452 72 60 72C73.2548 72 84 60 84 44C81 53 71.5 60 60 60C48.5 60 39 53 36 44Z"
        fill={`url(#${goldGradId})`}
      />
      <path
        d="M60 54C50 54 39 50 30 45V80C39 85 50 89 60 89C70 89 81 85 90 80V45C81 50 70 54 60 54Z"
        fill="#FAF7F0"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <line x1="60" y1="54" x2="60" y2="89" stroke="#123D32" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M37 57C43 60 50 62 55 62M37 66C43 69 50 71 55 71M37 75C43 78 50 80 55 80"
        stroke="#123D32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M83 57C77 60 70 62 65 62M83 66C77 69 70 71 65 71M83 75C77 78 70 80 65 80"
        stroke="#123D32"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M26 86L60 96L94 86"
        stroke={`url(#${goldGradId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
