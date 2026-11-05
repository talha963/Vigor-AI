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
  Layers,
  ArrowRight,
  Video,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import VigorLogo from './VigorLogo';
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
  onOpenBooking?: () => void;
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
  onOpenBooking,
}: HeaderProps) {
  const isAr = locale === 'ar';
  const isDark = theme === 'dark';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track page scroll for elevation & real-time progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 pt-2 sm:pt-3 px-3 sm:px-6">
      {/* Floating Architectural Island Pill */}
      <div
        className={`max-w-7xl mx-auto rounded-2xl sm:rounded-full transition-all duration-300 relative overflow-hidden ${
          scrolled
            ? 'bg-[#FAF8F5]/92 dark:bg-[#161513]/92 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)] border border-[#DDD7C8] dark:border-stone-800'
            : 'bg-[#FAF8F5]/85 dark:bg-[#161513]/85 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] border border-[#E5E0D5]/80 dark:border-stone-800/80'
        }`}
      >
        <div className="px-4 sm:px-6">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
            
            {/* ========================================================
               1. LEFT: Brand Identity & Certified Abu Dhabi Beacon
               ======================================================== */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#"
                className="flex items-center gap-2.5 group focus:outline-none"
                aria-label="Vigor AI Home"
              >
                {/* Brand Emblem Icon with Subtle Depth Ring */}
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-[#2E2922] via-[#24201A] to-[#181614] dark:from-[#FAF8F5] dark:to-[#E5E0D5] flex items-center justify-center text-[#FAF8F5] dark:text-[#181614] shadow-xs transition-transform duration-300 group-hover:scale-105 border border-[#524A3D]/40 dark:border-stone-300">
                  <VigorLogo className="w-4 sm:w-5 h-4 sm:h-5 text-current" size={20} />
                </div>

                {/* Typographic Title */}
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-editorial-serif text-lg tracking-[0.24em] font-medium text-[#22201D] dark:text-[#FAF7F2] uppercase">
                      Vigor
                    </span>
                    <span className="text-[10px] tracking-[0.24em] font-black text-[#8A8172] dark:text-[#C5BEB2] uppercase">
                      AI
                    </span>
                  </div>
                </div>
              </a>

              {/* Department of Health Abu Dhabi Verified Badge */}
              <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/80 text-[9px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'معتمد · أبوظبي' : 'DoH Governed'}</span>
              </div>
            </div>

            {/* ========================================================
               2. CENTER: Clean Understated Editorial Navigation Links
               ======================================================== */}
            <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-1.5 font-editorial-sans text-[11px] font-semibold tracking-[0.18em] uppercase text-[#6B6355] dark:text-[#A8A092]">
              <a
                href="#"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'الرئيسية' : 'Home'}
              </a>
              <a
                href="#section-intake"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'الاستقبال' : 'Intake'}
              </a>
              <a
                href="#section-safety"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'السلامة' : 'Safety'}
              </a>
              <a
                href="#section-consent"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'الموافقة' : 'Consent'}
              </a>
              <a
                href="#section-who"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'معايير WHO' : 'WHO 2021'}
              </a>
              <a
                href="#section-care"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'شبكة الرعاية' : 'Care Network'}
              </a>
              <a
                href="#section-telemetry"
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all"
              >
                {isAr ? 'الأطباء' : 'Clinician'}
              </a>
              <button
                type="button"
                onClick={onOpenArchitecture}
                className="px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1E1C1A] dark:hover:text-white transition-all uppercase tracking-[0.18em]"
              >
                {isAr ? 'البنية' : 'Architecture'}
              </button>
            </nav>

            {/* ========================================================
               3. RIGHT: Actions, Telehealth Pill, Switchers & CTA
               ======================================================== */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Telehealth 1-Click Consultation Shortcut */}
              {onOpenBooking && (
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-900 dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all text-[10px] font-bold uppercase tracking-wider shadow-2xs group"
                >
                  <Video className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                  <span>{isAr ? 'حجز طبيب' : 'Telehealth'}</span>
                </button>
              )}

              {/* Language Switcher Segmented Pill */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-[10px] font-bold uppercase tracking-wider text-[#5A544A] dark:text-[#DDD7C8] hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800 transition-all shadow-2xs"
                title="Toggle Language"
              >
                <Globe className="w-3 h-3 text-[#7A7163] dark:text-stone-400" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {/* Theme Switcher Button */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-1.5 sm:p-2 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-[#5A544A] dark:text-[#DDD7C8] hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800 transition-all shadow-2xs"
                  aria-label="Toggle Dark Mode"
                >
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-stone-600" />
                  )}
                </button>
              )}

              {/* High-End Primary CTA: Start Anonymous Intake */}
              <button
                type="button"
                onClick={onOpenIntake}
                className="group inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#22201D] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#181614] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#3D3830] dark:hover:bg-white transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAr ? 'ابدأ الفحص' : 'Start Intake'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-[#6B6355] dark:text-[#A8A092] hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Reading / Scroll Progress Bar along bottom edge */}
        <div className="w-full h-[2px] bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-[#A89F8F] via-[#7A7163] to-[#A89F8F] dark:from-[#8A8172] dark:via-[#FAF7F2] dark:to-[#8A8172] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* Mobile Menu Dropdown Card */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-3xl bg-[#FAF8F5]/98 dark:bg-[#181715]/98 backdrop-blur-2xl border border-[#DDD7C8] dark:border-stone-800 p-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2 font-editorial-sans text-xs uppercase tracking-[0.2em] text-[#6B6355] dark:text-[#A8A092]">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </a>
            <a
              href="#section-intake"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'الاستقبال المجهول' : 'Intake Protocol'}
            </a>
            <a
              href="#section-safety"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'قواعد السلامة' : 'Safety Gates'}
            </a>
            <a
              href="#section-consent"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'سجل الموافقة' : 'Consent Ledger'}
            </a>
            <a
              href="#section-who"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'معايير WHO 2021' : 'WHO 2021 Reference'}
            </a>
            <a
              href="#section-care"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'شبكة الرعاية بأبوظبي' : 'Care Delivery'}
            </a>
            <a
              href="#section-telemetry"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white transition-colors"
            >
              {isAr ? 'بوابة الأطباء' : 'Clinician Review'}
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenArchitecture();
              }}
              className="text-left rtl:text-right py-2 px-3 rounded-xl hover:bg-stone-200/50 dark:hover:bg-stone-800 hover:text-[#22201D] dark:hover:text-white uppercase tracking-[0.2em] transition-colors"
            >
              {isAr ? 'مخطط البنية' : 'Architecture'}
            </button>
          </div>

          <div className="pt-4 border-t border-[#DDD7C8]/70 dark:border-stone-800 flex flex-col gap-2.5">
            {onOpenBooking && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-sky-300 text-xs font-bold uppercase tracking-[0.16em] flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>{isAr ? 'حجز استشارة سريرية عن بُعد' : 'Book Telehealth Consultation'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntake();
              }}
              className="w-full py-3 rounded-2xl bg-[#22201D] text-[#F7F4EB] text-xs font-bold tracking-[0.2em] uppercase text-center shadow-md flex items-center justify-center gap-2"
            >
              <span>{isAr ? 'بدء الفحص السري المجهول' : 'Start Anonymous Intake'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
