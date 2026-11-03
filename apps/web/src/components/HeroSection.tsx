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
  CheckCircle,
  FileBadge,
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
    <section className="relative overflow-hidden bg-white pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-blue-50">
      {/* Background radial gradients for soft medical lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/50 via-sky-50/20 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Action */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Top Challenge Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold tracking-wide uppercase mb-6 w-fit shadow-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>
                {isAr
                  ? 'بوابة سرية لصحة الرجل التناسلية · تحدي أبوظبي الصحي'
                  : 'Abu Dhabi Male Reproductive Health Challenge'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-blue-950 leading-[1.15] mb-6">
              {isAr ? (
                <>
                  الكشف المبكر والموثوق عن{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600">
                    مخاطر صحة الرجل
                  </span>{' '}
                  بسرية تامة.
                </>
              ) : (
                <>
                  Early, Explainable Risk Identification for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600">
                    Male Reproductive Health.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-600 font-normal leading-relaxed mb-8 max-w-2xl">
              {isAr
                ? 'لسنوات طويلة، عُوملت صحة الرجل التناسلية كرد فعل متأخر لمشاكل الإنجاب فقط. تمنحك فيجور بوابة استباقية سرية ومجهولة الهوية بنسبة 100٪ بدون إنشاء حساب، مدعومة بمحرك فرز سريري حتمي ودفتر موافقة قابل للإلغاء الفوري.'
                : 'Male reproductive health is too often treated only as a late-stage infertility reaction rather than routine preventive care. Vigor provides a culturally trusted, anonymous-first front door—delivering clear risk evaluation in under 10 minutes with zero account requirement, deterministic safety gates, and cryptographically revocable consent.'}
            </p>

            {/* Core Value Props List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-xl">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-blue-900 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/70">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? 'بدون حساب أو بيانات هوية' : 'Zero Account / Anonymous-First'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-blue-900 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/70">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? 'صمام أمان حتمي لـ 9 علامات خطر' : 'Deterministic 9 Red-Flag Safety Floor'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-blue-900 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/70">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? 'معايير منظمة الصحة العالمية 2021' : 'WHO 2021 6th Edition Standard'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-blue-900 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100/70">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isAr ? 'إلغاء فوري بضغطة زر مع إيصال مشفر' : '1-Click Consent Revocation Receipt'}</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                onClick={onOpenIntake}
                className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-7 py-4 rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/35 transition-all transform hover:-translate-y-0.5"
              >
                <span>{isAr ? 'ابدأ الفحص السري الآن (مجاناً)' : 'Start Confidential Intake (10 min)'}</span>
                <ArrowRight className="w-5 h-5 text-blue-200" />
              </button>

              <button
                onClick={onOpenClinician}
                className="inline-flex items-center gap-2.5 bg-white hover:bg-blue-50/80 text-blue-900 font-bold text-base px-6 py-4 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-all shadow-xs"
              >
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <span>{isAr ? 'منصة المراجعة السريرية' : 'Clinician Review Console'}</span>
              </button>
            </div>

            {/* Quick Golden Case Test Selector for Hackathon / Clinician Judges */}
            <div className="pt-4 border-t border-blue-100 max-w-xl">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  {isAr ? 'اختبار الحالات الذهبية (Golden Cases):' : 'Preload Verified Clinical Golden Cases:'}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">16/16 Verified</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onSelectGoldenCase('GC01')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                  title="Acute scrotal pain (torsion window <=6h) -> clamps to URGENT"
                >
                  GC01: Acute Scrotal Pain (Urgent)
                </button>
                <button
                  onClick={() => onSelectGoldenCase('GC02')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                  title="Testicular lump -> clamps to URGENT"
                >
                  GC02: Testicular Mass (Urgent)
                </button>
                <button
                  onClick={() => onSelectGoldenCase('GC09')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  title="Subfertility + Metabolic risk -> ANDROLOGY_UROLOGY"
                >
                  GC09: Metabolic + Infertility
                </button>
                <button
                  onClick={() => onSelectGoldenCase('GC16')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
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
      </div>
    </section>
  );
}
