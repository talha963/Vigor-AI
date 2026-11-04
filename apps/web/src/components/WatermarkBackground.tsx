'use client';

import React from 'react';

export default function WatermarkBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none bg-[#F7F6F2] dark:bg-[#0A0F1D] transition-colors duration-300"
    >
      {/* Subtle organic off-white radial illumination for visual depth */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e2d9_1px,transparent_1px)] [background-size:24px_24px] opacity-35 dark:opacity-10" />
      <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-blue-100/30 dark:bg-blue-900/10 blur-3xl" />
      <div className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full bg-sky-100/30 dark:bg-sky-900/10 blur-3xl" />
      <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] rounded-full bg-amber-100/20 dark:bg-amber-900/10 blur-3xl" />

      {/* =========================================================================
          ARTISTIC MEDICAL WATERMARKS (Oversized, extremely subtle, low opacity)
          ========================================================================= */}

      {/* 1. Top Right: Oversized DNA Double-Helix Vector Watermark */}
      <div className="absolute -top-12 -right-16 w-96 h-[550px] opacity-[0.035] dark:opacity-[0.06] text-blue-950 dark:text-sky-300">
        <svg viewBox="0 0 200 400" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
          <path d="M 40,20 Q 160,70 160,120 Q 160,170 40,220 Q 40,270 160,320 Q 160,370 40,420" />
          <path d="M 160,20 Q 40,70 40,120 Q 40,170 160,220 Q 160,270 40,320 Q 40,370 160,420" />
          <line x1="55" y1="45" x2="145" y2="45" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="40" y1="120" x2="160" y2="120" strokeWidth="2" />
          <line x1="55" y1="195" x2="145" y2="195" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="40" y1="220" x2="160" y2="220" strokeWidth="2" />
          <line x1="55" y1="295" x2="145" y2="295" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="40" y1="320" x2="160" y2="320" strokeWidth="2" />
          <line x1="55" y1="395" x2="145" y2="395" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* 2. Upper Left: Oversized Laboratory Microscope Schematic Watermark */}
      <div className="absolute top-72 -left-20 w-[420px] h-[420px] opacity-[0.03] dark:opacity-[0.05] text-slate-900 dark:text-sky-400">
        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <circle cx="100" cy="100" r="85" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="100" cy="100" r="50" strokeWidth="1" />
          <line x1="100" y1="10" x2="100" y2="190" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="10" y1="100" x2="190" y2="100" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="10" fill="currentColor" fillOpacity="0.1" />
          <circle cx="100" cy="100" r="3" fill="currentColor" />
          {/* Microscope optic rings */}
          <path d="M 60 70 A 45 45 0 0 1 140 70" strokeWidth="2" />
          <path d="M 70 130 A 45 45 0 0 0 130 130" strokeWidth="2" />
        </svg>
      </div>

      {/* 3. Mid-Right: Cropped Clinical Andrology Lab Backdrop Watermark */}
      <div className="absolute top-[35%] -right-24 w-[520px] h-[480px] opacity-[0.03] dark:opacity-[0.04] mix-blend-multiply filter grayscale contrast-150">
        <img
          src="/images/andrology-lab.jpg"
          alt=""
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>

      {/* 4. Center-Left: Cellular Spermatozoa Motility Path Watermark (WHO Protocol) */}
      <div className="absolute top-[55%] -left-16 w-[460px] h-[460px] opacity-[0.035] dark:opacity-[0.05] text-blue-900 dark:text-cyan-400">
        <svg viewBox="0 0 300 300" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-full h-full">
          {/* Head & Tail vector path 1 */}
          <path d="M 50 150 Q 90 120 130 150 T 210 150 T 280 140" strokeWidth="2" />
          <ellipse cx="45" cy="150" rx="14" ry="9" fill="currentColor" fillOpacity="0.1" strokeWidth="2" />
          {/* Head & Tail vector path 2 */}
          <path d="M 80 80 Q 120 110 160 80 T 240 80 T 290 90" strokeWidth="1.5" strokeDasharray="3 3" />
          <ellipse cx="75" cy="80" rx="12" ry="8" fill="currentColor" fillOpacity="0.08" strokeWidth="1.5" />
          {/* Head & Tail vector path 3 */}
          <path d="M 90 220 Q 130 200 170 220 T 250 220 T 295 210" strokeWidth="1.5" strokeDasharray="3 3" />
          <ellipse cx="85" cy="220" rx="12" ry="8" fill="currentColor" fillOpacity="0.08" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 5. Lower-Right: Clinical Telemetry & Vital Rhythm Wave Watermark */}
      <div className="absolute top-[75%] -right-12 w-[550px] h-[300px] opacity-[0.035] dark:opacity-[0.05] text-slate-900 dark:text-sky-300">
        <svg viewBox="0 0 500 200" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
          <path d="M 0 100 L 90 100 L 105 70 L 120 130 L 135 40 L 155 160 L 170 85 L 185 100 L 280 100 L 295 70 L 310 130 L 325 40 L 345 160 L 360 85 L 375 100 L 500 100" />
        </svg>
      </div>

      {/* 6. Bottom-Left: Cryptographic Shield & Key Geometric Watermark */}
      <div className="absolute -bottom-16 -left-12 w-[380px] h-[380px] opacity-[0.03] dark:opacity-[0.05] text-slate-800 dark:text-indigo-400">
        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
          <path d="M 100 20 L 160 50 L 160 110 C 160 155 100 185 100 185 C 100 185 40 155 40 110 L 40 50 Z" strokeWidth="2.5" />
          <circle cx="100" cy="85" r="20" strokeWidth="2" />
          <path d="M 100 105 L 100 145 M 90 125 L 100 125 M 90 140 L 100 140" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
