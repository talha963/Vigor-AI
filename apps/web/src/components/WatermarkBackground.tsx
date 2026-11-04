'use client';

import React from 'react';

export default function WatermarkBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none bg-[#F5F3EA] dark:bg-[#141311] transition-colors duration-300"
    >
      {/* Subtle warm paper / linen texture grain effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#d8d2c4_1px,transparent_1px)] [background-size:28px_28px] opacity-40 dark:opacity-10" />

      {/* Gentle organic warm illumination pools */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#E8E2D2]/50 dark:bg-amber-950/10 blur-3xl" />
      <div className="absolute top-1/4 -right-32 w-[650px] h-[650px] rounded-full bg-[#DFD9C9]/40 dark:bg-stone-900/20 blur-3xl" />
      <div className="absolute top-2/3 -left-32 w-[700px] h-[700px] rounded-full bg-[#E5DFCF]/40 dark:bg-neutral-900/20 blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 w-[600px] h-[600px] rounded-full bg-[#DDD6C5]/50 dark:bg-stone-950/20 blur-3xl" />

      {/* =========================================================================
          OVERSIZED EDITORIAL WATERMARK TYPOGRAPHY (Video Reference: Faint Serif Numbers & Letters)
          ========================================================================= */}

      {/* 1. Top-Left: Giant Serif Letter "V" (Vigor) */}
      <div className="absolute -top-16 -left-12 font-editorial-serif text-[380px] lg:text-[480px] italic font-light text-[#8A8172] dark:text-[#E8E4DA] opacity-[0.032] dark:opacity-[0.045] leading-none select-none">
        V
      </div>

      {/* 2. Top-Right: Giant Serif Numerals "01" */}
      <div className="absolute top-36 -right-10 font-editorial-serif text-[280px] lg:text-[360px] italic font-light text-[#7C7365] dark:text-[#E8E4DA] opacity-[0.028] dark:opacity-[0.04] leading-none select-none">
        01
      </div>

      {/* 3. Upper-Left: Giant Serif Letter "A" (Andrology) */}
      <div className="absolute top-[28%] -left-16 font-editorial-serif text-[340px] lg:text-[440px] italic font-light text-[#827A6C] dark:text-[#E8E4DA] opacity-[0.03] dark:opacity-[0.04] leading-none select-none">
        A
      </div>

      {/* 4. Mid-Right: Giant Serif Numerals "02" & "03" */}
      <div className="absolute top-[45%] -right-12 font-editorial-serif text-[300px] lg:text-[380px] font-light text-[#7F7769] dark:text-[#E8E4DA] opacity-[0.026] dark:opacity-[0.04] leading-none select-none">
        03
      </div>

      {/* 5. Lower-Left: Giant Serif Letter "G" (Governance / Golden Cases) */}
      <div className="absolute top-[65%] -left-12 font-editorial-serif text-[360px] lg:text-[460px] italic font-light text-[#867E70] dark:text-[#E8E4DA] opacity-[0.028] dark:opacity-[0.04] leading-none select-none">
        G
      </div>

      {/* 6. Bottom-Right: Giant Serif Letter "Q" (Quality & WHO Protocols) */}
      <div className="absolute -bottom-24 -right-10 font-editorial-serif text-[380px] lg:text-[500px] italic font-light text-[#7A7264] dark:text-[#E8E4DA] opacity-[0.035] dark:opacity-[0.05] leading-none select-none">
        Q
      </div>

      {/* =========================================================================
          DELICATE MEDICAL & ANDROLOGY SCHEMATICS (Ultra-low opacity, non-distracting)
          ========================================================================= */}

      {/* DNA Double-Helix Line Schematic */}
      <div className="absolute top-16 right-1/4 w-72 h-[420px] opacity-[0.025] dark:opacity-[0.04] text-[#6E6659]">
        <svg viewBox="0 0 200 400" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M 40,20 Q 160,70 160,120 Q 160,170 40,220 Q 40,270 160,320 Q 160,370 40,420" />
          <path d="M 160,20 Q 40,70 40,120 Q 40,170 160,220 Q 160,270 40,320 Q 40,370 160,420" />
          <line x1="55" y1="45" x2="145" y2="45" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="40" y1="120" x2="160" y2="120" strokeWidth="1.5" />
          <line x1="55" y1="195" x2="145" y2="195" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="40" y1="220" x2="160" y2="220" strokeWidth="1.5" />
          <line x1="55" y1="295" x2="145" y2="295" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="40" y1="320" x2="160" y2="320" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Laboratory Microscope Optics Schematic */}
      <div className="absolute top-[40%] left-10 w-80 h-80 opacity-[0.022] dark:opacity-[0.035] text-[#6A6255]">
        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
          <circle cx="100" cy="100" r="85" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="100" cy="100" r="50" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="10" y1="100" x2="190" y2="100" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="8" fill="currentColor" fillOpacity="0.08" />
        </svg>
      </div>
    </div>
  );
}
