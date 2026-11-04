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
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* Top Hairline Accent Line */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-[#BDB5A7] via-[#7A7163] to-[#BDB5A7] opacity-80" />

      {/* Main Bar Container - Minimal Editorial Glassmorphism (Reference Video Style) */}
      <div
        className={`w-full transition-all duration-200 ${
          scrolled
            ? 'bg-[#F5F3EA]/96 dark:bg-[#141311]/96 backdrop-blur-md shadow-xs border-b border-[#DDD7C8]/80 dark:border-stone-850'
            : 'bg-[#F5F3EA]/90 dark:bg-[#141311]/90 backdrop-blur-xs border-b border-[#E3DEC3]/60 dark:border-stone-850/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-4">
            
            {/* ========================================================
               1. LEFT: Brand Typographic Identity (Like INNOVATION in video)
               ======================================================== */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#"
                className="flex items-center gap-2 group focus:outline-none"
                aria-label="Vigor AI Home"
              >
                <div className="w-7 h-7 rounded-sm bg-[#2E2922] dark:bg-[#EFEAE0] flex items-center justify-center text-[#F7F4EB] dark:text-[#22201D] transition-transform group-hover:scale-105">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-editorial-serif text-lg tracking-[0.22em] font-medium text-[#22201D] dark:text-[#F2EEE6] uppercase">
                    Vigor
                  </span>
                  <span className="text-[10px] tracking-[0.2em] font-bold text-[#7A7163] dark:text-[#A8A092] uppercase">
                    AI
                  </span>
                </div>
              </a>
            </div>

            {/* ========================================================
               2. CENTER: Clean Understated Editorial Navigation Links
               ======================================================== */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 font-editorial-sans text-[11px] font-medium tracking-[0.22em] uppercase text-[#6B6355] dark:text-[#A8A092]">
              <a
                href="#"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'الرئيسية' : 'Home'}
              </a>
              <a
                href="#section-intake"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'الاستقبال' : 'Intake'}
              </a>
              <a
                href="#section-safety"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'السلامة' : 'Safety'}
              </a>
              <a
                href="#section-consent"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'الموافقة' : 'Consent'}
              </a>
              <a
                href="#section-who"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'معايير WHO' : 'WHO 2021'}
              </a>
              <a
                href="#section-care"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'شبكة الرعاية' : 'Care Network'}
              </a>
              <a
                href="#section-telemetry"
                className="hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'الأطباء' : 'Clinician'}
              </a>
              <button
                type="button"
                onClick={onOpenArchitecture}
                className="uppercase tracking-[0.22em] hover:text-[#22201D] dark:hover:text-white transition-colors"
              >
                {isAr ? 'البنية' : 'Architecture'}
              </button>
            </nav>

            {/* ========================================================
               3. RIGHT: Actions & Minimal Outline Button (Video Reference)
               ======================================================== */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="px-2 py-1 text-[11px] font-semibold tracking-wider text-[#6B6355] dark:text-[#A8A092] hover:text-[#22201D] dark:hover:text-white transition-colors uppercase"
                title="Toggle Language"
              >
                {locale === 'en' ? 'عربي' : 'EN'}
              </button>

              {/* Theme Switcher */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="p-1.5 text-[#6B6355] dark:text-[#A8A092] hover:text-[#22201D] dark:hover:text-white transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Outline Action Button (SIGN UP style in reference video) */}
              <button
                type="button"
                onClick={onOpenIntake}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-sm border border-[#7A7163] text-[#22201D] dark:text-[#F2EEE6] text-[10px] font-semibold tracking-[0.2em] uppercase hover:bg-[#2E2922] hover:text-[#F7F4EB] dark:hover:bg-[#EFEAE0] dark:hover:text-[#22201D] transition-all"
              >
                <span>{isAr ? 'فحص سري' : 'Start Intake'}</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#6B6355] dark:text-[#A8A092]"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Progress Bar along bottom edge */}
        <div className="w-full h-[2px] bg-transparent">
          <div
            className="h-full bg-[#7A7163] dark:bg-[#C2BBB0] transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#F5F3EA] dark:bg-[#141311] border-b border-[#DDD7C8] dark:border-stone-850 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3 font-editorial-sans text-xs uppercase tracking-[0.2em] text-[#6B6355] dark:text-[#A8A092]">
            <a
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </a>
            <a
              href="#section-intake"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'الاستقبال المجهول' : 'Intake Protocol'}
            </a>
            <a
              href="#section-safety"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'قواعد السلامة' : 'Safety Gates'}
            </a>
            <a
              href="#section-consent"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'سجل الموافقة' : 'Consent Ledger'}
            </a>
            <a
              href="#section-who"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'معايير WHO 2021' : 'WHO 2021 Reference'}
            </a>
            <a
              href="#section-care"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'شبكة الرعاية بأبوظبي' : 'Care Delivery'}
            </a>
            <a
              href="#section-telemetry"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#22201D] dark:hover:text-white"
            >
              {isAr ? 'بوابة الأطباء' : 'Clinician Review'}
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenArchitecture();
              }}
              className="text-left rtl:text-right py-1 hover:text-[#22201D] dark:hover:text-white uppercase tracking-[0.2em]"
            >
              {isAr ? 'مخطط البنية' : 'Architecture'}
            </button>
          </div>

          <div className="pt-4 border-t border-[#DDD7C8]/70 dark:border-stone-850 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntake();
              }}
              className="w-full py-2.5 rounded-sm bg-[#2E2922] text-[#F7F4EB] text-xs font-semibold tracking-[0.2em] uppercase text-center"
            >
              {isAr ? 'بدء الفحص السري' : 'Start Intake'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
