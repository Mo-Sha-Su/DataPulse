import React from 'react';

interface Props {
  className?: string;
  /** 'hero' displays fuller sky/navy ambient waves and grid drift; 'subtle' softens motion for workspace & auth screens. */
  variant?: 'hero' | 'subtle';
}

/** Calm, ambient animated backdrop in Data Pulse Navy & Sky tones. */
export const AnimatedBackground: React.FC<Props> = ({ className = '', variant = 'hero' }) => {
  const isHero = variant === 'hero';

  return (
    <div
      className={`pointer-events-none fixed inset-0 overflow-hidden z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Layer 1: Seamless drifting architectural coordinate grid */}
      <div
        className={`absolute -inset-[40px] bg-grid-pattern animate-grid-drift ${
          isHero ? 'opacity-90' : 'opacity-60'
        }`}
        style={{
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 32%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 32%, black 20%, transparent 100%)',
        }}
      />

      {/* Layer 2: Drifting Navy & Sky atmospheric gradient orbs */}
      <div className="absolute -top-44 start-1/2 -translate-x-1/2">
        <div
          className={`w-[74rem] h-[36rem] rounded-full blur-3xl animate-float-1 ${
            isHero ? 'opacity-80' : 'opacity-55'
          }`}
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.24) 0%, rgba(56, 189, 248, 0.10) 48%, transparent 74%)',
          }}
        />
      </div>

      <div
        className={`absolute top-[28%] -end-36 w-[38rem] h-[38rem] rounded-full blur-3xl animate-float-2 ${
          isHero ? 'opacity-75' : 'opacity-50'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(2, 132, 199, 0.2) 0%, rgba(14, 165, 233, 0.08) 52%, transparent 72%)',
        }}
      />

      <div
        className={`absolute -bottom-44 -start-28 w-[34rem] h-[34rem] rounded-full blur-3xl animate-float-3 ${
          isHero ? 'opacity-70' : 'opacity-45'
        }`}
        style={{
          background:
            'radial-gradient(circle, rgba(11, 23, 57, 0.12) 0%, rgba(56, 189, 248, 0.10) 48%, transparent 72%)',
        }}
      />

      {/* Layer 3: Flowing Data Pulse telemetry spline curves */}
      <svg
        className={`absolute inset-0 w-full h-full ${isHero ? 'opacity-90' : 'opacity-55'}`}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="dp-pulse-sky" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0" />
            <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dp-pulse-navy" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0b1739" stopOpacity="0" />
            <stop offset="50%" stopColor="#0b1739" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dp-band-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
        </defs>

        {isHero && (
          <path
            d="M -60 660 C 260 620, 460 470, 760 490 C 1020 508, 1210 310, 1500 240 L 1500 900 L -60 900 Z"
            fill="url(#dp-band-fill)"
            className="animate-band-breathe"
          />
        )}

        {/* Base guide curves */}
        <path
          d="M -60 660 C 260 620, 460 470, 760 490 C 1020 508, 1210 310, 1500 240"
          stroke="rgba(2, 132, 199, 0.1)"
          strokeWidth="1.5"
        />
        <path
          d="M -60 760 C 310 730, 560 590, 880 615 C 1130 634, 1290 480, 1500 410"
          stroke="rgba(11, 23, 57, 0.06)"
          strokeWidth="1.25"
        />

        {/* Animated traveling Data Pulse signal streaks */}
        <path
          d="M -60 660 C 260 620, 460 470, 760 490 C 1020 508, 1210 310, 1500 240"
          stroke="url(#dp-pulse-sky)"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeDasharray="240 1360"
          className="animate-pulse-line"
        />
        <path
          d="M -60 760 C 310 730, 560 590, 880 615 C 1130 634, 1290 480, 1500 410"
          stroke="url(#dp-pulse-navy)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="190 1410"
          className="animate-pulse-line-slow"
        />
      </svg>

      {/* Layer 4: Subtle diagonal sky sheen */}
      {isHero && (
        <div
          className="absolute -inset-y-40 w-[34rem] animate-beam-sweep"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.08) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
};
