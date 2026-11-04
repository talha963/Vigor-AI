'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  HeartPulse,
  Microscope,
  Lock,
  Stethoscope,
  Package,
  Globe,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Radio,
  Sliders,
  Layers,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface HeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenIntake: () => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
  onOpenAtHomeKit?: () => void;
}

export default function Header({
  locale,
  setLocale,
  theme = 'light',
  onToggleTheme,
  onOpenIntake,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
  onOpenAtHomeKit,
}: HeaderProps) {
  const isAr = locale === 'ar';
  const isDark = theme === 'dark';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('check');

  // Track page scroll for elevation & real-time progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* Top Precision Medical Cyan-to-Blue Ambient Laser Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-blue-700 via-sky-400 to-indigo-600 opacity-90 shadow-sm" />

      {/* Main Bar Container - Off-white Glassmorphism */}
      <div
        className={`w-full transition-all duration-200 ${
          scrolled
            ? 'bg-[#FAF9F6]/95 dark:bg-[#090E1A]/95 backdrop-blur-xl shadow-sm border-b border-slate-200/80 dark:border-slate-800'
            : 'bg-[#FAF9F6]/90 dark:bg-[#090E1A]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
            
            {/* ========================================================
               1. LEFT: Creative Medical Brand Emblem
               ======================================================== */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#"
                className="flex items-center gap-2.5 group focus:outline-none"
                aria-label="Vigor AI Home"
              >
                {/* Glowing Geometric Medical Emblem */}
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 p-0.5 shadow-md shadow-blue-600/25 group-hover:scale-105 group-hover:shadow-blue-600/40 transition-all duration-300 flex items-center justify-center">
                    <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-blue-700 to-blue-600 flex items-center justify-center text-white">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Real-time radar ping beacon */}
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#070d1a]" />
                  </span>
                </div>

                {/* Brand Typographic Identity */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                      VIGOR
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-xs">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{isAr ? 'أبوظبي · حوكمة سريرية' : 'Abu Dhabi · Health Gateway'}</span>
                  </div>
                </div>
              </a>
            </div>

            {/* ========================================================
               2. CENTER: Creative Segmented Medical Dock (Non-texty)
               ======================================================== */}
            <nav className="hidden lg:flex items-center justify-center flex-1 max-w-2xl px-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-inner backdrop-blur-md">
                
                {/* Tab 1: Intake Check */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('check');
                    onOpenIntake();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === 'check'
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isAr ? 'فحص سريري فوري' : 'Clinical Intake Check'}
                >
                  <HeartPulse className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>{isAr ? 'الفحص' : 'Check'}</span>
                </button>

                {/* Tab 2: 9 Red Flags (Safety Floor) */}
                <a
                  href="#red-flags"
                  onClick={() => setActiveTab('safety')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === 'safety'
                      ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isAr ? 'علامات الخطر التسع' : '9 Red Flags'}
                >
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  <span>{isAr ? 'علامات الخطر' : 'Safety'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                </a>

                {/* Tab 3: WHO 2021 Reference */}
                <a
                  href="#who-standards"
                  onClick={() => setActiveTab('who')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === 'who'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isAr ? 'معايير منظمة الصحة العالمية 2021' : 'WHO 2021 Reference Limits'}
                >
                  <Microscope className="w-3.5 h-3.5 text-sky-500" />
                  <span>{isAr ? 'معايير WHO' : 'WHO 2021'}</span>
                </a>

                {/* Tab 4: Consent & Privacy Ledger */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('consent');
                    onOpenConsent();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === 'consent'
                      ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isAr ? 'دفتر الموافقة والخصوصية المشفر' : 'Cryptographic Consent Ledger'}
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'الخصوصية' : 'Ledger'}</span>
                </button>

                {/* Tab 5: Clinician Review Queue */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('clinician');
                    onOpenClinician();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                    activeTab === 'clinician'
                      ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isAr ? 'منصة المراجعة السريرية' : 'Clinician Review Console'}
                >
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isAr ? 'الأطباء' : 'Clinician'}</span>
                </button>

                {/* Tab 6: At-Home Kit Logistics */}
                {onOpenAtHomeKit && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('kit');
                      onOpenAtHomeKit();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      activeTab === 'kit'
                        ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                    }`}
                    title={isAr ? 'طلب طرد الفحص المنزلي السري' : 'At-Home Testing Kit'}
                  >
                    <Package className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{isAr ? 'فحص منزلي' : 'Kit'}</span>
                  </button>
                )}

                {/* Tab 7: Architecture telemetry */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('arch');
                    onOpenArchitecture();
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 ${
                    activeTab === 'arch'
                      ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 shadow-sm border border-slate-200/50 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isAr ? 'معمارية محرك n8n' : 'n8n Workflow Core'}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </nav>

            {/* ========================================================
               3. RIGHT: Actions & Biometric System Status
               ======================================================== */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Creative Biometric Real-time ECG Pulse Indicator */}
              <div
                className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60"
                title="Atlas Cluster & n8n Engine Connected (0ms latency)"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <svg className="w-5 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 12" fill="none">
                    <path
                      d="M1 6H6L8 1L12 11L14 4L16 8L18 6H23"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>LIVE</span>
                </div>
              </div>

              {/* Theme Toggle (Sun/Moon) */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  aria-label="Toggle Theme"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-amber-400 bg-slate-100/70 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700 transition-all duration-200"
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-700 -rotate-12 transition-transform" />
                  )}
                </button>
              )}

              {/* Creative Segmented Language Toggle [EN | عربي] */}
              <button
                type="button"
                onClick={() => setLocale(isAr ? 'en' : 'ar')}
                className="h-9 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Switch Language / تغيير اللغة"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{isAr ? 'EN' : 'عربي'}</span>
              </button>

              {/* Glowing High-Impact Assessment Button */}
              <button
                type="button"
                onClick={onOpenIntake}
                className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-xl shadow-md shadow-blue-600/25 hover:shadow-lg hover:shadow-blue-600/35 transition-all transform hover:-translate-y-0.5 active:scale-95 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-200 animate-spin-slow" />
                <span>{isAr ? 'ابدأ الفحص' : 'Start Check'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-200 rtl:rotate-180" />
              </button>

              {/* Mobile Hamburger Drawer Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
                aria-label="Toggle Mobile Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Scroll Progress Bar */}
        <div className="h-[2.5px] w-full bg-slate-200/50 dark:bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 transition-all duration-150 shadow-xs"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* ========================================================
         4. CREATIVE MOBILE DRAWER: Visual Medical Control Center
         ======================================================== */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-blue-100 dark:border-slate-800 bg-white/98 dark:bg-[#070d1a]/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-fade-in">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isAr ? 'لوحة التحكم السريرية' : 'Clinical Control Hub'}
            </span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Core Live</span>
            </div>
          </div>

          {/* 6 Visual Medical Tiles */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {/* Tile 1: Intake Check */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntake();
              }}
              className="p-3 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 hover:bg-blue-100/70 border border-blue-100 dark:border-slate-700/60 flex items-center gap-2.5 text-left rtl:text-right transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">{isAr ? 'الفحص السري' : 'Intake Check'}</p>
                <p className="text-[10px] text-blue-600 dark:text-sky-400 font-medium">10 min · psn_</p>
              </div>
            </button>

            {/* Tile 2: 9 Red Flags */}
            <a
              href="#red-flags"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-rose-50/70 dark:bg-slate-800/60 hover:bg-rose-100/70 border border-rose-100 dark:border-slate-700/60 flex items-center gap-2.5 text-left rtl:text-right transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">{isAr ? 'علامات الخطر' : '9 Red Flags'}</p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">SLA Gates</p>
              </div>
            </a>

            {/* Tile 3: WHO 2021 */}
            <a
              href="#who-standards"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 hover:bg-sky-100/70 border border-sky-100 dark:border-slate-700/60 flex items-center gap-2.5 text-left rtl:text-right transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Microscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">{isAr ? 'معايير WHO' : 'WHO 2021'}</p>
                <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">6th Edition</p>
              </div>
            </a>

            {/* Tile 4: Consent Ledger */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsent();
              }}
              className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/60 hover:bg-emerald-100/70 border border-emerald-100 dark:border-slate-700/60 flex items-center gap-2.5 text-left rtl:text-right transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">{isAr ? 'سجل الخصوصية' : 'Consent Ledger'}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">SHA-256 Proof</p>
              </div>
            </button>

            {/* Tile 5: Clinician Gate */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenClinician();
              }}
              className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-slate-800/60 hover:bg-indigo-100/70 border border-indigo-100 dark:border-slate-700/60 flex items-center gap-2.5 text-left rtl:text-right transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold">{isAr ? 'بوابة الأطباء' : 'Doctor Portal'}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">HITL Console</p>
              </div>
            </button>

            {/* Tile 6: At-Home Kit */}
            {onOpenAtHomeKit && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAtHomeKit();
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5 text-left rtl:text-right transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold">{isAr ? 'فحص منزلي' : 'At-Home Kit'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Smart Lockers</p>
                </div>
              </button>
            )}
          </div>

          {/* Quick CTA inside Mobile Drawer */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntake();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 text-white font-bold text-sm py-3 rounded-xl shadow-md"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>{isAr ? 'ابدأ الفحص السري الآن' : 'Begin Confidential Assessment'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
