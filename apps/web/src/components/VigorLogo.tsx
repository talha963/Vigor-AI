'use client';

import React from 'react';

interface VigorLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  isDark?: boolean;
}

/**
 * VigorLogo - The official clinical brand mark of Vigor AI.
 * Represents:
 * 1. The ascendant "V" monogram (Vitality & Vigor).
 * 2. The protective architectural shield (Zero-Knowledge & Deterministic Safety).
 * 3. The optical nucleus (Andrology Cellular Motility & WHO 2021 Precision).
 */
export default function VigorLogo({
  className = 'w-7 h-7',
  size = 28,
  withText = false,
  isDark = false,
}: VigorLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${withText ? '' : 'justify-center'}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Vigor AI Emblem"
      >
        <defs>
          <linearGradient id="vigor-logo-grad" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* 1. Precision Protective Shield Contours */}
        <path
          d="M 18 3.5 L 6.5 8.5 V 17 C 6.5 24.2 11.4 30.8 18 32.5 C 24.6 30.8 29.5 24.2 29.5 17 V 8.5 L 18 3.5 Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Bold Ascendant "V" Monogram of Male Vitality */}
        <path
          d="M 11 12.5 L 18 24.5 L 25 12.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 3. Central Andrology Motility / Precision Diagnostic Nucleus */}
        <circle
          cx="18"
          cy="12"
          r="2.2"
          fill="currentColor"
        />

        {/* 4. Fine Architectural Caliper Alignment Guides */}
        <line
          x1="18"
          y1="5.5"
          x2="18"
          y2="7.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      {withText && (
        <div className="flex items-baseline gap-1.5 select-none">
          <span className="font-editorial-serif text-lg tracking-[0.22em] font-medium uppercase text-current">
            Vigor
          </span>
          <span className="text-[10px] tracking-[0.22em] font-bold uppercase opacity-80">
            AI
          </span>
        </div>
      )}
    </div>
  );
}
