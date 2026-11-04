'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  FileBadge,
  Activity,
  Award,
  Zap,
} from 'lucide-react';
import AnimatedHealthcareHero from './AnimatedHealthcareHero';
import { Locale } from '@/types/vigor';

interface HeroSectionProps {
  locale: Locale;
  onOpenIntake: () => void;
  onOpenClinician: () => void;
  onSelectGoldenCase: (caseId: string) => void;
}

export default function HeroSection({
  locale,
  onOpenIntake,
  onOpenClinician,
  onSelectGoldenCase,
}: HeroSectionProps) {
  const isAr = locale === 'ar';

  return (
    <section className="relative overflow-hidden bg-[#FAF9F6] dark:bg-[#090E1A] pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* Background Animated Ambient Light Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-ambient-glow pointer-events-none -z-10" />
      <div className="absolute top-28 right-1/4 w-80 h-80 bg-sky-300/10 dark:bg-sky-500/10 rounded-full blur-3xl animate-ambient-glow pointer-events-none -z-10 [animation-delay:3s]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/70 via-sky-50/20 to-transparent dark:from-blue-950/20 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Action */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left rtl:text-right">
            {/* Top Challenge Badge with Animated Radar Ping */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-800 dark:text-sky-300 text-xs font-bold tracking-wide uppercase mb-6 w-fit shadow-xs group">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600 dark:bg-sky-400" />
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>
                {isAr
                  ? 'بوابة سرية لصحة الرجل التناسلية · تحدي أبوظبي الصحي'
                  : 'Abu Dhabi Male Reproductive Health Challenge'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-blue-950 dark:text-white leading-[1.15] mb-6">
              {isAr ? (
                <>
                  الكشف المبكر والموثوق عن{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 dark:from-blue-400 dark:via-sky-400 dark:to-cyan-300">
                    مخاطر صحة الرجل
                  </span>{' '}
                  بسرية تامة.
                </>
              ) : (
                <>
                  Early, Explainable Risk Identification for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 dark:from-blue-400 dark:via-sky-400 dark:to-cyan-300">
                    Male Reproductive Health.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-8 max-w-2xl text-left rtl:text-right">
              {isAr
                ? 'لسنوات طويلة، عُوملت صحة الرجل التناسلية كرد فعل متأخر لمشاكل الإنجاب فقط. تمنحك فيجور بوابة استباقية سرية ومجهولة الهوية بنسبة 100٪ بدون إنشاء حساب، مدعومة بمحرك فرز سريري حتمي ودفتر موافقة قابل للإلغاء الفوري.'
                : 'Male reproductive health is too often treated only as a late-stage infertility reaction rather than routine preventive care. Vigor provides a culturally trusted, anonymous-first front door—delivering clear risk evaluation in under 10 minutes with zero account requirement, deterministic safety gates, and cryptographically revocable consent.'}
            </p>

            {/* Core Value Props List with Hover Physics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-xl">
              <div className="hover-lift flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-950 dark:text-sky-200 bg-blue-50/70 dark:bg-slate-900/70 p-3 rounded-xl border border-blue-100/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition-all">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'بدون حساب أو بيانات هوية' : 'Zero Account / Anonymous-First'}</span>
              </div>
              <div className="hover-lift flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-950 dark:text-sky-200 bg-blue-50/70 dark:bg-slate-900/70 p-3 rounded-xl border border-blue-100/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition-all">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'صمام أمان حتمي لـ 9 علامات خطر' : 'Deterministic 9 Red-Flag Safety Floor'}</span>
              </div>
              <div className="hover-lift flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-950 dark:text-sky-200 bg-blue-50/70 dark:bg-slate-900/70 p-3 rounded-xl border border-blue-100/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition-all">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'معايير منظمة الصحة العالمية 2021' : 'WHO 2021 6th Edition Standard'}</span>
              </div>
              <div className="hover-lift flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-blue-950 dark:text-sky-200 bg-blue-50/70 dark:bg-slate-900/70 p-3 rounded-xl border border-blue-100/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-slate-700 transition-all">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />
                <span>{isAr ? 'إلغاء فوري بضغطة زر مع إيصال مشفر' : '1-Click Consent Revocation Receipt'}</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                onClick={onOpenIntake}
                className="relative overflow-hidden group inline-flex items-center gap-3 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-sm sm:text-base px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                {/* Moving light shimmer sweep */}
                <span className="absolute inset-0 w-full h-full animate-shimmer pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" />
                <Sparkles className="w-5 h-5 text-sky-200" />
                <span>{isAr ? 'ابدأ الفحص السري الآن (مجاناً)' : 'Start Confidential Intake (10 min)'}</span>
                <ArrowRight className="w-5 h-5 text-blue-200 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onOpenClinician}
                className="hover-lift inline-flex items-center gap-2.5 bg-white dark:bg-slate-900 hover:bg-blue-50/80 dark:hover:bg-slate-800 text-blue-950 dark:text-slate-100 font-bold text-sm sm:text-base px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl border-2 border-blue-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-600 transition-all shadow-xs active:scale-95"
              >
                <Stethoscope className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                <span>{isAr ? 'منصة المراجعة السريرية' : 'Clinician Review Console'}</span>
              </button>
            </div>

            {/* Quick Golden Case Test Selector for Hackathon / Clinician Judges */}
            <div className="pt-4 border-t border-blue-100 dark:border-slate-800 max-w-xl">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-bold text-blue-950 dark:text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 animate-pulse" />
                  {isAr ? 'اختبار الحالات الذهبية (Golden Cases):' : 'Preload Verified Clinical Golden Cases:'}
                </span>
                <span className="text-[11px] font-semibold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                  16/16 Verified
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onSelectGoldenCase('GC01')}
                  className="hover-lift px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 transition-colors shadow-2xs"
                  title="Acute scrotal pain (torsion window <=6h) -> clamps to URGENT"
                >
                  GC01: Acute Scrotal Pain (Urgent)
                </button>
                <button
                  onClick={() => onSelectGoldenCase('GC02')}
                  className="hover-lift px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 transition-colors shadow-2xs"
                  title="Testicular lump -> clamps to URGENT"
                >
                  GC02: Testicular Mass (Urgent)
                </button>
                <button
                  onClick={() => onSelectGoldenCase('GC09')}
                  className="hover-lift px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-900 transition-colors shadow-2xs"
                  title="Subfertility + Metabolic risk -> ANDROLOGY_UROLOGY"
                >
                  GC09: Metabolic + Infertility
                </button>
                <button
                  onClick={() => onSelectGoldenCase('GC16')}
                  className="hover-lift px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 transition-colors shadow-2xs"
                  title="Gradual scrotal ache -> must NOT falsely escalate"
                >
                  GC16: Gradual Ache (Near-Miss Safe)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Healthcare Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <AnimatedHealthcareHero />
          </div>
        </div>

        {/* Scroll Down Pathway Entry Indicator */}
        <div className="mt-14 pt-8 border-t border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center text-center">
          <a
            href="#journey-intake"
            className="group inline-flex flex-col items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
          >
            <span className="tracking-widest uppercase text-[11px] font-black text-slate-400 dark:text-slate-500 group-hover:text-blue-600 transition-colors">
              {isAr ? 'اكتشف المسار السريري التفاعلي' : 'Discover the Progressive Clinical Journey'}
            </span>
            <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center group-hover:border-blue-400 group-hover:scale-110 transition-all">
              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-sky-400 animate-bounce" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
