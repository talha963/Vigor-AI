'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  Dna,
  Stethoscope,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function AnimatedHealthcareHero() {
  const [bpm, setBpm] = useState(72);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBpm((prev) => (prev === 72 ? 74 : prev === 74 ? 71 : 72));
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 600);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto flex items-center justify-center p-4 select-none">
      {/* Background Soft Glow Circles (Seamlessly blending into white) */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-80 h-80 rounded-full bg-blue-100/60 blur-3xl animate-pulse-glow" />
        <div className="w-64 h-64 rounded-full bg-sky-100/70 blur-2xl -top-4 -right-4" />
      </div>

      {/* Main Healthcare Interactive Illustrated Canvas */}
      <div className="relative w-full aspect-square max-w-[460px] bg-white rounded-3xl border border-blue-100 shadow-[0_12px_40px_-10px_rgba(30,58,138,0.12)] p-6 flex flex-col justify-between overflow-hidden">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1e40af 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
        />

        {/* Top Header Telemetry Bar */}
        <div className="flex items-center justify-between z-10 border-b border-blue-50 pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-blue-900 uppercase">
              Vigor Clinical Telemetry
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            <Lock className="w-3 h-3 text-blue-600" />
            <span>Zero-Knowledge Mode</span>
          </div>
        </div>

        {/* Center Animated Medical Visual with Interactive Orbit */}
        <div className="relative flex-1 flex items-center justify-center my-4">
          {/* Concentric Rotating Medical Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-blue-100 border-dashed animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-52 h-52 rounded-full border border-sky-200/70 animate-[spin_40s_linear_infinite_reverse]" />

          {/* Central Medical Shield & Heart Core */}
          <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 shadow-xl shadow-blue-500/25 flex items-center justify-center group hover:scale-105 transition-transform duration-300">
            {/* Animated Pulse Waves Radiating Out */}
            <div
              className={`absolute inset-0 rounded-full border-2 border-blue-400 transition-all duration-700 ${
                pulseActive ? 'scale-150 opacity-0' : 'scale-100 opacity-80'
              }`}
            />
            <div className="flex flex-col items-center justify-center text-white">
              <HeartPulse className="w-10 h-10 animate-heartbeat text-white drop-shadow" />
              <span className="text-[11px] font-bold mt-1 tracking-wider uppercase">
                {bpm} BPM
              </span>
            </div>
          </div>

          {/* Orbiting Satellite Node 1: DNA & Genetics */}
          <div className="absolute top-2 left-6 z-20 animate-float-card bg-white px-3 py-2 rounded-2xl border border-blue-100 shadow-md flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">
                WHO 2021
              </p>
              <p className="text-xs font-bold text-blue-950">6th Edition Standard</p>
            </div>
          </div>

          {/* Orbiting Satellite Node 2: Safety Floor */}
          <div className="absolute bottom-4 right-4 z-20 animate-float-card-delayed bg-white px-3 py-2 rounded-2xl border border-blue-100 shadow-md flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">
                Red-Flag Gate
              </p>
              <p className="text-xs font-bold text-blue-950">9 Invariants Active</p>
            </div>
          </div>

          {/* Orbiting Satellite Node 3: Specialist Routing */}
          <div className="absolute top-8 right-2 z-20 animate-float-card bg-white px-3 py-2 rounded-2xl border border-blue-100 shadow-md flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-sky-600 font-medium uppercase tracking-wider">
                Andrology
              </p>
              <p className="text-xs font-bold text-blue-950">Specialist Triage</p>
            </div>
          </div>
        </div>

        {/* Live Animated ECG / Waveform Canvas at the Bottom */}
        <div className="relative z-10 bg-blue-50/60 rounded-2xl p-3 border border-blue-100/80">
          <div className="flex items-center justify-between text-xs mb-1">
            <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
              <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>Real-time Clinical Safety Monitor</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Deterministic Safety Floor
            </span>
          </div>

          {/* Animated SVG ECG Waveform */}
          <div className="h-10 w-full overflow-hidden flex items-center">
            <svg
              className="w-full h-8 stroke-blue-600 fill-none"
              viewBox="0 0 500 50"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,25 L 80,25 L 90,10 L 100,40 L 110,5 L 120,45 L 130,25 L 230,25 L 240,10 L 250,40 L 260,5 L 270,45 L 280,25 L 380,25 L 390,10 L 400,40 L 410,5 L 420,45 L 430,25 L 500,25"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ecg-line"
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-100/70 text-center">
            <div>
              <p className="text-[10px] text-blue-500 uppercase tracking-wider font-medium">Privacy</p>
              <p className="text-xs font-bold text-blue-900">Zero Direct Identifiers</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-500 uppercase tracking-wider font-medium">Red-Flag SLA</p>
              <p className="text-xs font-bold text-blue-900">&le; 60 Minutes</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-500 uppercase tracking-wider font-medium">Audit Ledger</p>
              <p className="text-xs font-bold text-blue-900">Cryptographic HMAC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
