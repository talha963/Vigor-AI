'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
  Stethoscope,
  ChevronDown,
  CheckCircle,
  Activity,
  Award,
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
    <section className="relative overflow-hidden bg-transparent pt-10 pb-14 lg:pt-16 lg:pb-20 border-b border-[#DDD7C8]/70 dark:border-[#2E2A24] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Action (Editorial Architectural Style) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left rtl:text-right">
            
            {/* Top Category Tracker */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-sm bg-[#EFECE3]/70 dark:bg-[#221F1C] border border-[#DDD7C8] dark:border-[#3E382F] text-[#5A544A] dark:text-[#DDD7C8] text-[11px] font-semibold tracking-[0.22em] uppercase mb-6 w-fit shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7A7163] dark:bg-[#C2BBB0] animate-pulse" />
              <span>
                {isAr
                  ? 'بوابة سرية لصحة الرجل التناسلية · أبوظبي'
                  : 'Abu Dhabi Health Challenge · Male Reproductive Health'}
              </span>
            </div>

            {/* Editorial Serif Main Headline */}
            <h1 className="font-editorial-serif text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.12] mb-6">
              {isAr ? (
                <>
                  الكشف المبكر والموثوق عن{' '}
                  <span className="italic font-light">
                    مخاطر صحة الرجل
                  </span>{' '}
                  بسرية تامة.
                </>
              ) : (
                <>
                  Early, Explainable Risk Identification for{' '}
                  <span className="italic font-light">
                    Male Reproductive Health.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-[#5A544A] dark:text-[#B8B1A3] text-base lg:text-[17px] font-normal leading-relaxed mb-7 max-w-2xl">
              {isAr
                ? 'لسنوات طويلة، عُوملت صحة الرجل التناسلية كرد فعل متأخر لمشاكل الإنجاب فقط. تمنحك فيجور بوابة استباقية سرية ومجهولة الهوية بنسبة 100٪ بدون إنشاء حساب، مدعومة بمحرك فرز سريري حتمي ودفتر موافقة قابل للإلغاء الفوري.'
                : 'Male reproductive health is too often treated only as a late-stage infertility reaction rather than routine preventive care. Vigor provides a culturally trusted, anonymous-first front door—delivering clear risk evaluation in under 10 minutes with zero account requirement, deterministic safety gates, and cryptographically revocable consent.'}
            </p>

            {/* Core Value Props List (Editorial Minimalism) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-xl">
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#403B33] dark:text-[#DDD6C8] bg-white/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-[#DDD7C8]/80 dark:border-stone-800 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-[#7A7163] dark:text-[#C2BBB0] shrink-0" />
                <span>{isAr ? 'بدون حساب أو بيانات هوية' : 'Zero Account / Anonymous-First'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#403B33] dark:text-[#DDD6C8] bg-white/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-[#DDD7C8]/80 dark:border-stone-800 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-[#7A7163] dark:text-[#C2BBB0] shrink-0" />
                <span>{isAr ? 'صمام أمان حتمي لـ 9 علامات خطر' : 'Deterministic 9 Red-Flag Safety Floor'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#403B33] dark:text-[#DDD6C8] bg-white/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-[#DDD7C8]/80 dark:border-stone-800 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-[#7A7163] dark:text-[#C2BBB0] shrink-0" />
                <span>{isAr ? 'معايير منظمة الصحة العالمية 2021' : 'WHO 2021 Semen Analysis Standards'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-medium text-[#403B33] dark:text-[#DDD6C8] bg-white/70 dark:bg-stone-900/60 p-3 rounded-2xl border border-[#DDD7C8]/80 dark:border-stone-800 shadow-2xs">
                <CheckCircle className="w-3.5 h-3.5 text-[#7A7163] dark:text-[#C2BBB0] shrink-0" />
                <span>{isAr ? 'سجل موافقة مشفر وإلغاء فوري' : 'Cryptographically Revocable Consent'}</span>
              </div>
            </div>

            {/* CTA Buttons - Premium Pill Shaped Design */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <button
                type="button"
                onClick={onOpenIntake}
                className="group inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-[#1A1816] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#181614] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#332F2A] dark:hover:bg-white transition-all shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAr ? 'ابدأ الفحص المجهول (10 دقائق)' : 'Start Anonymous Intake (10 min)'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onOpenClinician}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#EFECE3] dark:bg-stone-800/80 text-[#1A1816] dark:text-[#FAF7F2] text-xs font-bold tracking-[0.18em] uppercase border border-[#DDD7C8] dark:border-stone-700 hover:bg-[#E5E0D5] dark:hover:bg-stone-700 transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#7A7163] dark:text-emerald-400" />
                <span>{isAr ? 'منصة الطبيب' : 'Clinician Console'}</span>
              </button>
            </div>

            {/* Quick Golden Case Fast-Track Selector */}
            <div className="pt-4 border-t border-[#DDD7C8]/70 dark:border-stone-800">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#7A7163] dark:text-stone-300 block mb-2.5">
                {isAr ? 'جرّب إحدى الحالات الذهبية السريرية المعتمدة:' : 'Simulate Verified Golden Cases:'}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onSelectGoldenCase('GC01')}
                  className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/80 dark:bg-stone-900 text-[#403B33] dark:text-stone-200 border border-[#DDD7C8] dark:border-stone-800 hover:border-[#1A1816] dark:hover:border-stone-500 transition-all shadow-2xs hover:scale-105"
                  title="Acute scrotal pain (< 6h) -> EMERGENCY_ED"
                >
                  GC01: Acute Torsion (&lt; 6h)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectGoldenCase('GC02')}
                  className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/80 dark:bg-stone-900 text-[#403B33] dark:text-stone-200 border border-[#DDD7C8] dark:border-stone-800 hover:border-[#1A1816] dark:hover:border-stone-500 transition-all shadow-2xs hover:scale-105"
                  title="Painless firm lump -> URGENT_UROLOGY"
                >
                  GC02: Testicular Mass
                </button>
                <button
                  type="button"
                  onClick={() => onSelectGoldenCase('GC09')}
                  className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/80 dark:bg-stone-900 text-[#403B33] dark:text-stone-200 border border-[#DDD7C8] dark:border-stone-800 hover:border-[#1A1816] dark:hover:border-stone-500 transition-all shadow-2xs hover:scale-105"
                  title="Subfertility + Metabolic risk -> ANDROLOGY_UROLOGY"
                >
                  GC09: Metabolic Infertility
                </button>
                <button
                  type="button"
                  onClick={() => onSelectGoldenCase('GC16')}
                  className="px-3 py-1.5 text-xs font-bold rounded-full bg-white/80 dark:bg-stone-900 text-[#403B33] dark:text-stone-200 border border-[#DDD7C8] dark:border-stone-800 hover:border-[#1A1816] dark:hover:border-stone-500 transition-all shadow-2xs hover:scale-105"
                  title="Gradual scrotal ache -> Near-Miss Safe"
                >
                  GC16: Gradual Ache (Near-Miss)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Healthcare Illustration */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <AnimatedHealthcareHero />
          </div>
        </div>

        {/* Scroll Down Pathway Entry Indicator (Video Reference) */}
        <div className="mt-12 pt-6 border-t border-[#DDD7C8]/70 dark:border-stone-800 flex flex-col items-center justify-center text-center">
          <a
            href="#section-intake"
            className="group inline-flex flex-col items-center gap-2 text-xs font-medium text-[#7A7163] hover:text-[#22201D] dark:hover:text-white transition-colors"
          >
            <span className="tracking-[0.24em] uppercase text-[10px] font-semibold text-[#8C8375] dark:text-[#A8A092]">
              {isAr ? 'استكشف مسار السلم السريري التفاعلي' : 'Explore The Scroll-Driven Winding Ladder'}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EFECE3] dark:bg-stone-800 border border-[#DDD7C8] dark:border-stone-700 flex items-center justify-center group-hover:scale-105 transition-all">
              <ChevronDown className="w-3.5 h-3.5 text-[#2E2922] dark:text-[#EFEAE0] animate-bounce" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
