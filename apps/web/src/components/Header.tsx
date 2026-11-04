'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  FileText,
  Globe,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  Database,
  Lock,
  Menu,
  X,
  Package,
  Sparkles,
  Sun,
  Moon,
  Microscope,
  CheckCircle2,
  HeartPulse,
  ArrowRight,
  ShieldAlert,
  Sliders,
  EyeOff,
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
  const [activeDropdown, setActiveDropdown] = useState<'care' | 'governance' | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Track page scroll for elevation & blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = (menu: 'care' | 'governance') => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <>
      {/* Top Precision Medical Ambient Line */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-blue-700 via-sky-400 to-indigo-600 dark:from-blue-500 dark:via-sky-400 dark:to-cyan-400 z-50 relative" />

      <header
        ref={headerRef}
        className={`sticky top-0 z-50 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 dark:bg-[#070d1a]/95 backdrop-blur-xl shadow-md shadow-blue-950/5 dark:shadow-black/40 border-b border-slate-200/80 dark:border-slate-800'
            : 'bg-white/90 dark:bg-[#070d1a]/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* 1. Left: Professional Medical Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <a href="#" className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:shadow-blue-600/35 group-hover:scale-105 transition-all duration-300">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#070d1a]" />
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                      VIGOR
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                      AI
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold">{isAr ? 'معتمد في أبوظبي' : 'Abu Dhabi DoH'}</span>
                  </div>
                </div>
              </a>
            </div>

            {/* 2. Center: Clean, Categorized Professional Navigation */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              {/* Dropdown 1: Clinical Solutions & Pathways */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('care')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'care' ? null : 'care')}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                    activeDropdown === 'care'
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-700 dark:hover:text-blue-300'
                  }`}
                >
                  <HeartPulse className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>{isAr ? 'مسارات الرعاية' : 'Care Pathways'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'care' ? 'rotate-180 text-blue-600' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Flyout Card: Care Pathways */}
                {activeDropdown === 'care' && (
                  <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-2 w-[440px] bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl shadow-blue-950/15 dark:shadow-black/60 border border-slate-200/80 dark:border-slate-800 animate-fade-in z-50">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      {isAr ? 'حلول الفحص السري والتشخيص' : 'Screening & Diagnostic Solutions'}
                    </div>

                    <div className="grid gap-1 pt-2">
                      {/* Item 1: Anonymous Intake */}
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenIntake();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors text-left rtl:text-right group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                              {isAr ? 'الفرز السريري المجهول' : 'Anonymous Intake Screening'}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300">
                              {isAr ? '10 دقائق' : '10 min'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                            {isAr
                              ? 'فحص استرشادي فوري بدون إنشاء حساب أو تسجيل بيانات الهوية.'
                              : 'Instant clinical risk identification with zero direct patient identifiers.'}
                          </p>
                        </div>
                      </button>

                      {/* Item 2: At-Home Test Kit */}
                      {onOpenAtHomeKit && (
                        <button
                          onClick={() => {
                            setActiveDropdown(null);
                            onOpenAtHomeKit();
                          }}
                          className="w-full p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors text-left rtl:text-right group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                                {isAr ? 'طرد الفحص المنزلي السري' : 'At-Home Diagnostic Kit'}
                              </span>
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                {isAr ? 'خزائن ذكية' : 'Smart Locker'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                              {isAr
                                ? 'عينات معزولة حرارياً تُستلم عبر خزائن ذكية مجهولة في أبوظبي.'
                                : 'Thermal-preserved cold chain collection with discreet locker delivery.'}
                            </p>
                          </div>
                        </button>
                      )}

                      {/* Item 3: 4-Step Pathway */}
                      <a
                        href="#how-it-works"
                        onClick={() => setActiveDropdown(null)}
                        className="p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors text-left rtl:text-right group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                            {isAr ? 'مسار الرعاية المعتمد (4 خطوات)' : '4-Step Care Architecture'}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                            {isAr
                              ? 'من الفرز الذاتي وصمام الأمان حتى استشارة الاستشاري المرخص.'
                              : 'From deterministic safety gates to accredited specialist follow-up.'}
                          </p>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Link: 9 Red Flags */}
              <a
                href="#red-flags"
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>{isAr ? 'علامات الخطر' : '9 Red Flags'}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                  SLA
                </span>
              </a>

              {/* Direct Link: WHO Standards */}
              <a
                href="#who-standards"
                className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5"
              >
                <Microscope className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span>{isAr ? 'معايير WHO' : 'WHO 2021'}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300">
                  6th Ed
                </span>
              </a>

              {/* Dropdown 2: Clinical Governance & Privacy */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('governance')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'governance' ? null : 'governance')}
                  className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors ${
                    activeDropdown === 'governance'
                      ? 'bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-blue-700 dark:hover:text-blue-300'
                  }`}
                >
                  <Lock className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>{isAr ? 'الحوكمة والخصوصية' : 'Governance & Privacy'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'governance' ? 'rotate-180 text-blue-600' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Flyout Card: Governance */}
                {activeDropdown === 'governance' && (
                  <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-[420px] bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl shadow-blue-950/15 dark:shadow-black/60 border border-slate-200/80 dark:border-slate-800 animate-fade-in z-50">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                      {isAr ? 'سجلات الأمان والرقابة السريرية' : 'Clinical & Cryptographic Governance'}
                    </div>

                    <div className="grid gap-1 pt-2">
                      {/* Consent Ledger */}
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenConsent();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors text-left rtl:text-right group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-sky-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                              {isAr ? 'سجل الموافقة المشفر' : 'Live Consent Ledger'}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              SHA-256
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                            {isAr
                              ? 'سجل غير قابل للتعديل مع إمكانية الإلغاء الفوري بضغطة زر واحدة.'
                              : 'Append-only ledger with 1-click cryptographic revocation receipts.'}
                          </p>
                        </div>
                      </button>

                      {/* Clinician Review Console */}
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenClinician();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors text-left rtl:text-right group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                              {isAr ? 'منصة المراجعة الطبية (HITL)' : 'Clinician Review Console'}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300">
                              SLA Portal
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                            {isAr
                              ? 'بوابة الأطباء المعتمدة مع منع خفض تصنيف الحالات الطارئة جبرياً.'
                              : 'Human-in-the-loop review queue with strict de-escalation guardrails.'}
                          </p>
                        </div>
                      </button>

                      {/* n8n Engine Architecture */}
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenArchitecture();
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50/80 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors text-left rtl:text-right group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Database className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-sky-300 transition-colors">
                            {isAr ? 'معمارية محرك n8n والسيادة' : 'n8n Workflow Core & Telemetry'}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug mt-0.5">
                            {isAr
                              ? '9 مسارات عمل مؤتمتة، 257 عقدة سريرية، و107 اختبار أمان غير متصل.'
                              : '9 orchestration workflows, 257 nodes, and 107 safety assertions.'}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* 3. Right: Clinician Link, Theme Switch, Language & Primary CTA */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Doctor Quick Portal Link (Desktop) */}
              <button
                onClick={onOpenClinician}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
                title="Clinician Console"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{isAr ? 'دخول الطبيب' : 'Doctor Portal'}</span>
              </button>

              {/* Theme Toggle Button */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  aria-label="Toggle Theme"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
                  title={isDark ? 'Switch to Light' : 'Switch to Dark'}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-blue-700" />}
                </button>
              )}

              {/* Segmented Language Switcher */}
              <button
                onClick={() => setLocale(isAr ? 'en' : 'ar')}
                className="h-9 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{isAr ? 'EN' : 'عربي'}</span>
              </button>

              {/* Primary Assessment CTA */}
              <button
                onClick={onOpenIntake}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <span>{isAr ? 'ابدأ الفحص' : 'Start Intake'}</span>
                <ChevronRight className="w-4 h-4 text-blue-200 rtl:rotate-180" />
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 4. Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-[#070d1a]/98 backdrop-blur-xl px-4 pt-4 pb-6 space-y-4 shadow-2xl animate-fade-in text-left rtl:text-right">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isAr ? 'التنقل السريري' : 'Clinical Navigation'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? 'بروتوكول DoH نشط' : 'DoH Protocol Live'}
              </span>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenIntake();
                }}
                className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 flex items-center gap-2 border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-sky-200 text-left rtl:text-right"
              >
                <EyeOff className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'الفرز السري' : 'Confidential Intake'}</span>
              </button>

              <a
                href="#red-flags"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 flex items-center gap-2 border border-rose-100 dark:border-rose-900 text-rose-900 dark:text-rose-200"
              >
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{isAr ? 'علامات الخطر 9' : '9 Red Flags'}</span>
              </a>

              <a
                href="#who-standards"
                onClick={() => setMobileMenuOpen(false)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 flex items-center gap-2 border border-slate-200/80 dark:border-slate-800"
              >
                <Microscope className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'معايير WHO' : 'WHO 2021'}</span>
              </a>

              {onOpenAtHomeKit && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAtHomeKit();
                  }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 flex items-center gap-2 border border-slate-200/80 dark:border-slate-800 text-left rtl:text-right"
                >
                  <Package className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>{isAr ? 'فحص منزلي' : 'At-Home Kit'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsent();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 flex items-center gap-2 border border-slate-200/80 dark:border-slate-800 text-left rtl:text-right"
              >
                <Lock className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'سجل الخصوصية' : 'Consent Ledger'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenClinician();
                }}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 flex items-center gap-2 border border-slate-200/80 dark:border-slate-800 text-left rtl:text-right"
              >
                <Stethoscope className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'مكتب الأطباء' : 'Clinician Review'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenArchitecture();
                }}
                className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 flex items-center justify-between border border-slate-200/80 dark:border-slate-800 text-left rtl:text-right"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                  <span>{isAr ? 'معمارية محرك n8n والسيادة' : 'n8n Core Architecture'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
              </button>
            </div>

            {/* Mobile Primary CTA */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenIntake();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-600/25 active:scale-98 transition-all"
              >
                <Shield className="w-4 h-4" />
                <span>{isAr ? 'ابدأ الفحص السري الآن' : 'Begin Confidential Assessment Now'}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
