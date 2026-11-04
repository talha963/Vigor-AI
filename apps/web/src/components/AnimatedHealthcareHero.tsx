'use client';

import React, { useState, useEffect } from 'react';
import {
  Microscope,
  FlaskConical,
  Lock,
  Activity,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';

export default function AnimatedHealthcareHero() {
  const [activeMetric, setActiveMetric] = useState<'motility' | 'concentration' | 'vitality'>('motility');
  const [pulseTick, setPulseTick] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick(true);
      setTimeout(() => setPulseTick(false), 800);
      setActiveMetric((prev) =>
        prev === 'motility' ? 'concentration' : prev === 'concentration' ? 'vitality' : 'motility'
      );
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto flex items-center justify-center p-3 select-none">
      {/* Background Subtle Warm Radial Glows */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-[#E8E2D5]/50 dark:bg-[#2A261F]/40 blur-3xl" />
        <div className="w-64 h-64 rounded-full bg-[#DDD6C5]/40 dark:bg-[#221F19]/30 blur-2xl -top-4 -right-4" />
      </div>

      {/* Main Luxury Architectural Healthcare Card */}
      <div className="relative w-full aspect-square max-w-[470px] bg-[#FAF8F5] dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-[0_16px_40px_-12px_rgba(42,36,28,0.08)] dark:shadow-2xl dark:shadow-black/60 p-6 flex flex-col justify-between overflow-hidden transition-colors duration-300">
        
        {/* Fine Architectural Precision Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#7A7163 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top Header Telemetry Bar */}
        <div className="flex items-center justify-between z-10 border-b border-[#E8E3D7] dark:border-[#2E2A24] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C8375] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4A4337] dark:bg-[#D1C9BC]" />
            </span>
            <span className="text-[11px] font-bold tracking-[0.22em] text-[#3D372E] dark:text-[#FAF7F2] uppercase">
              Andrology Telemetry
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#544E43] dark:text-[#E8E4DB] bg-[#EFECE3]/80 dark:bg-[#28241F] px-3 py-1 rounded-full border border-[#DDD7C8] dark:border-[#3E382F]">
            <Lock className="w-3 h-3 text-[#7A7163] dark:text-[#C5BEB2]" />
            <span>Zero-Knowledge Mode</span>
          </div>
        </div>

        {/* Center Animated Andrology Micro-Motility Radar */}
        <div className="relative flex-1 flex items-center justify-center my-3">
          
          {/* Outer Concentric Optical Calibration Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-[#DDD7C8]/80 dark:border-stone-800 border-dashed animate-[spin_50s_linear_infinite]" />
          <div className="absolute w-52 h-52 rounded-full border border-[#C9C2B4]/60 dark:border-stone-700/60 animate-[spin_35s_linear_infinite_reverse]" />
          <div className="absolute w-40 h-40 rounded-full border border-[#8C8375]/20 dark:border-stone-600/20" />

          {/* Central Spermatozoa Viability & WHO Benchmarking Core */}
          <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-[#2E2922] via-[#433D33] to-[#5C5346] dark:from-[#24211B] dark:via-[#332E26] dark:to-[#4A4337] shadow-xl shadow-[#2E2922]/20 dark:shadow-black/50 flex items-center justify-center group hover:scale-105 transition-transform duration-300 border border-[#8C8375]/30">
            
            {/* Animated Pulse Waves Radiating Out */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-[#C9C2B4] transition-all duration-700 ${
                pulseTick ? 'scale-140 opacity-0' : 'scale-100 opacity-60'
              }`}
            />

            {/* Spermatozoa Kinetic Motility SVG Animation */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
            >
              {/* Orbital swimming spermatozoon 1 */}
              <g className="animate-[spin_8s_linear_infinite] origin-center">
                <circle cx="50" cy="18" r="2.2" fill="#FAF8F5" />
                <path
                  d="M 50,20 Q 52,24 50,28 T 50,34"
                  fill="none"
                  stroke="#FAF8F5"
                  strokeWidth="0.8"
                  opacity="0.8"
                />
              </g>

              {/* Orbital swimming spermatozoon 2 */}
              <g className="animate-[spin_12s_linear_infinite_reverse] origin-center">
                <circle cx="50" cy="82" r="2" fill="#E8E2D5" opacity="0.9" />
                <path
                  d="M 50,80 Q 48,76 50,72 T 50,66"
                  fill="none"
                  stroke="#E8E2D5"
                  strokeWidth="0.8"
                  opacity="0.75"
                />
              </g>

              {/* Orbital swimming spermatozoon 3 */}
              <g className="animate-[spin_10s_linear_infinite] origin-center" style={{ animationDelay: '-3s' }}>
                <circle cx="18" cy="50" r="1.8" fill="#DDD7C8" opacity="0.85" />
                <path
                  d="M 20,50 Q 24,52 28,50 T 34,50"
                  fill="none"
                  stroke="#DDD7C8"
                  strokeWidth="0.7"
                  opacity="0.7"
                />
              </g>
            </svg>

            {/* Central Diagnostic Readout */}
            <div className="flex flex-col items-center justify-center text-[#F7F4EB] text-center z-10">
              <Microscope className="w-7 h-7 text-[#DDD7C8] mb-0.5" />
              <span className="text-[12px] font-bold tracking-tight font-editorial-serif">
                WHO 2021
              </span>
              <span className="text-[9px] text-[#C5BEB2] uppercase tracking-wider font-semibold">
                6th Edition
              </span>
            </div>
          </div>

          {/* Floating Telemetry Node 1: WHO 2021 Standards (Top-Left) */}
          <div className="absolute top-1 left-2 z-20 animate-float-card bg-[#FAF8F5] dark:bg-[#221F1C] px-3.5 py-2.5 rounded-2xl border border-[#DDD7C8] dark:border-[#3E382F] shadow-md dark:shadow-black/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#EFECE3] dark:bg-[#322D26] flex items-center justify-center text-[#4A4337] dark:text-[#EFEAE0]">
              <FlaskConical className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] text-[#7A7163] dark:text-[#B5ADA0] font-semibold uppercase tracking-wider">
                WHO Benchmark
              </p>
              <p className="text-[11px] font-bold text-[#2E2922] dark:text-[#FAF7F2]">
                5th Centile Ref
              </p>
            </div>
          </div>

          {/* Floating Telemetry Node 2: Red-Flag Floor (Bottom-Right) */}
          <div className="absolute bottom-2 right-2 z-20 animate-float-card-delayed bg-[#FAF8F5] dark:bg-[#221F1C] px-3.5 py-2.5 rounded-2xl border border-[#DDD7C8] dark:border-[#3E382F] shadow-md dark:shadow-black/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#EFECE3] dark:bg-[#322D26] flex items-center justify-center text-[#4A4337] dark:text-[#EFEAE0]">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] text-[#7A7163] dark:text-[#B5ADA0] font-semibold uppercase tracking-wider">
                Safety Floor
              </p>
              <p className="text-[11px] font-bold text-[#2E2922] dark:text-[#FAF7F2]">
                9 Invariants Active
              </p>
            </div>
          </div>

          {/* Floating Telemetry Node 3: Specialist Routing (Top-Right) */}
          <div className="absolute top-4 right-1 z-20 animate-float-card bg-[#FAF8F5] dark:bg-[#221F1C] px-3.5 py-2.5 rounded-2xl border border-[#DDD7C8] dark:border-[#3E382F] shadow-md dark:shadow-black/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#EFECE3] dark:bg-[#322D26] flex items-center justify-center text-[#4A4337] dark:text-[#EFEAE0]">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[9px] text-[#7A7163] dark:text-[#B5ADA0] font-semibold uppercase tracking-wider">
                Abu Dhabi Care
              </p>
              <p className="text-[11px] font-bold text-[#2E2922] dark:text-[#FAF7F2]">
                Specialist Triage
              </p>
            </div>
          </div>
        </div>

        {/* Live CASA Motility & Spermatozoa Velocity Waveform */}
        <div className="relative z-10 bg-[#FAF8F5] dark:bg-[#221F1C] rounded-2xl p-3.5 border border-[#DDD7C8] dark:border-[#3E382F] shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-1.5 text-[#3D372E] dark:text-[#FAF7F2] font-semibold">
              <Activity className="w-3.5 h-3.5 text-[#7A7163] dark:text-[#DDD7C8] animate-pulse" />
              <span className="text-[11px] font-medium tracking-wide">CASA Motility Radar</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300/40 dark:border-emerald-700/50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Safety Floor Governed
            </span>
          </div>

          {/* Animated CASA Velocity Harmonic Waveform */}
          <div className="h-9 w-full overflow-hidden flex items-center">
            <svg
              className="w-full h-8 stroke-[#6E6556] dark:stroke-[#DDD7C8] fill-none"
              viewBox="0 0 500 50"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,25 Q 30,5 60,25 T 120,25 Q 145,42 165,10 T 210,25 Q 240,8 270,25 T 330,25 Q 355,42 375,10 T 420,25 Q 460,8 500,25"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ecg-line"
              />
            </svg>
          </div>

          {/* 3 Real-time WHO 2021 Reference Metrics */}
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#E8E3D7] dark:border-[#3E382F] text-center">
            <div className={`p-1 rounded-lg transition-colors duration-500 ${activeMetric === 'concentration' ? 'bg-[#E8E2D5]/60 dark:bg-[#322D26] ring-1 ring-[#8C8375]/40 dark:ring-[#DDD7C8]/40' : ''}`}>
              <p className="text-[9px] text-[#7A7163] dark:text-[#B5ADA0] uppercase tracking-wider font-semibold">
                Sperm Conc.
              </p>
              <p className="text-[11px] font-bold text-[#2E2922] dark:text-[#FAF7F2] font-mono">
                25M / mL
              </p>
            </div>
            <div className={`p-1 rounded-lg transition-colors duration-500 ${activeMetric === 'motility' ? 'bg-[#E8E2D5]/60 dark:bg-[#322D26] ring-1 ring-[#8C8375]/40 dark:ring-[#DDD7C8]/40' : ''}`}>
              <p className="text-[9px] text-[#7A7163] dark:text-[#B5ADA0] uppercase tracking-wider font-semibold">
                Prog. Motility
              </p>
              <p className="text-[11px] font-bold text-[#2E2922] dark:text-[#FAF7F2] font-mono">
                42% PR
              </p>
            </div>
            <div className={`p-1 rounded-lg transition-colors duration-500 ${activeMetric === 'vitality' ? 'bg-[#E8E2D5]/60 dark:bg-[#322D26] ring-1 ring-[#8C8375]/40 dark:ring-[#DDD7C8]/40' : ''}`}>
              <p className="text-[9px] text-[#7A7163] dark:text-[#B5ADA0] uppercase tracking-wider font-semibold">
                Vitality Ref
              </p>
              <p className="text-[11px] font-bold text-[#2E2922] dark:text-[#FAF7F2] font-mono">
                58% Living
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
