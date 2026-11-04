'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Activity,
  HeartPulse,
  Lock,
  Microscope,
  Stethoscope,
  Package,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Clock,
  EyeOff,
  Sliders,
  ExternalLink,
  FileText,
  Check,
  Zap,
  Database,
  Server,
  Layers,
  ArrowUpRight,
  Info,
  Calendar,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { Locale } from '@/types/vigor';
import { WHO_2021_REFERENCE_LIMITS } from '@/lib/clinical-engine';
import { GOLDEN_CASES } from '@/lib/golden-cases';

interface ClinicalJourneyProps {
  locale: Locale;
  onOpenIntake: () => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
  onOpenAtHomeKit: () => void;
  onSelectGoldenCase: (caseId: string) => void;
}

export default function ClinicalJourney({
  locale,
  onOpenIntake,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
  onOpenAtHomeKit,
  onSelectGoldenCase,
}: ClinicalJourneyProps) {
  const isAr = locale === 'ar';

  // State for progressive scroll reveal
  const [revealedStages, setRevealedStages] = useState<Set<number>>(new Set([1]));
  const [activeStage, setActiveStage] = useState<number>(1);
  const [spineHeight, setSpineHeight] = useState<number>(15);

  const containerRef = useRef<HTMLDivElement>(null);

  // Red-flag selector state for Stage 2
  const [selectedFlagIndex, setSelectedFlagIndex] = useState<number>(0);

  // WHO Simulator state for Stage 4
  const [volume, setVolume] = useState<number>(2.5);
  const [concentration, setConcentration] = useState<number>(25);
  const [progressiveMotility, setProgressiveMotility] = useState<number>(38);
  const [totalMotility, setTotalMotility] = useState<number>(55);
  const [normalForms, setNormalForms] = useState<number>(6);
  const [vitality, setVitality] = useState<number>(68);

  const totalSperm = Math.round(volume * concentration * 10) / 10;
  const isVolumeOk = volume >= WHO_2021_REFERENCE_LIMITS.volumeMl;
  const isConcOk = concentration >= WHO_2021_REFERENCE_LIMITS.concentrationMillionPerMl;
  const isTotalOk = totalSperm >= WHO_2021_REFERENCE_LIMITS.totalSpermMillion;
  const isProgMotOk = progressiveMotility >= WHO_2021_REFERENCE_LIMITS.progressiveMotilityPct;
  const isTotalMotOk = totalMotility >= WHO_2021_REFERENCE_LIMITS.totalMotilityPct;
  const isFormsOk = normalForms >= WHO_2021_REFERENCE_LIMITS.normalFormsPct;
  const isVitalityOk = vitality >= WHO_2021_REFERENCE_LIMITS.vitalityPct;

  const isAzoospermia = concentration === 0;
  const isSevereOligo = concentration > 0 && concentration < 5;
  const isAllNormal =
    isVolumeOk && isConcOk && isTotalOk && isTotalMotOk && isProgMotOk && isFormsOk && isVitalityOk;

  const applyLabCase = (caseType: 'normal' | 'azoospermia' | 'severeOligo' | 'suboptimal') => {
    if (caseType === 'normal') {
      setVolume(3.2);
      setConcentration(45);
      setTotalMotility(62);
      setProgressiveMotility(48);
      setNormalForms(7);
      setVitality(75);
    } else if (caseType === 'azoospermia') {
      setVolume(1.8);
      setConcentration(0);
      setTotalMotility(0);
      setProgressiveMotility(0);
      setNormalForms(0);
      setVitality(0);
    } else if (caseType === 'severeOligo') {
      setVolume(1.5);
      setConcentration(2.1);
      setTotalMotility(20);
      setProgressiveMotility(12);
      setNormalForms(2);
      setVitality(35);
    } else {
      setVolume(1.2);
      setConcentration(14);
      setTotalMotility(38);
      setProgressiveMotility(25);
      setNormalForms(3);
      setVitality(50);
    }
  };

  // Facility tab state for Stage 5
  const [activeFacilityIndex, setActiveFacilityIndex] = useState<number>(0);

  // Red-Flags Data
  const RED_FLAGS = [
    {
      code: 'RF_ACUTE_SCROTAL_PAIN',
      titleEn: 'Acute Scrotal Pain / Sudden Swelling',
      titleAr: 'ألم حاد في كيس الصفن أو انتفاخ مفاجئ',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC01',
      descEn:
        'Sudden severe testicular pain (<6h). High suspicion of testicular torsion. Immediate surgical exploration required to prevent organ loss.',
      descAr:
        'ألم شديد ومفاجئ في الخصية (<6 ساعات). اشتباه التواء الخصية يتطلب استكشافاً جراحياً طارئاً لتفادي موت النسيج.',
    },
    {
      code: 'RF_TESTICULAR_MASS',
      titleEn: 'Painless Testicular Lump or Mass',
      titleAr: 'كتلة صلبة غير مؤلمة في الخصية',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC02',
      descEn:
        'Discrete parenchymal lump. Peak incidence aged 20–35. Highly curable if identified before regional spread.',
      descAr:
        'وجود كتلة صلبة داخل نسيج الخصية. يكثر في فئة الشباب (20-35 سنة). أورام الخصية تستجيب للعلاج بشكل كامل عند اكتشافها المبكر.',
    },
    {
      code: 'RF_PRIAPISM',
      titleEn: 'Prolonged Painful Erection (>4 Hours)',
      titleAr: 'انتصاب مستمر ومؤلم لأكثر من 4 ساعات',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC03',
      descEn:
        'Ischaemic priapism requires urgent emergency aspiration and decompression to avoid permanent cavernosal fibrosis.',
      descAr:
        'انتصاب مستمر يدوم لأكثر من 4 ساعات. حالة طارئة تستدعي تدخلاً لتفريغ الدم الراكد وتفادي تلف نسيج الانتصاب الدائم.',
    },
    {
      code: 'RF_ACUTE_URINARY_RETENTION',
      titleEn: 'Inability to Pass Urine (Retention)',
      titleAr: 'احتباس البول الحاد والعجز عن التبول',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC04',
      descEn:
        'Sudden painful voiding failure. Demands emergency catheter decompression to prevent bladder rupture and hydronephrosis.',
      descAr:
        'عجز مفاجئ ومؤلم عن تفريغ المثانة بالرغم من امتلائها. يستلزم تركيب قسطرة بولية عاجلة لمنع ارتجاع البول وتلف الكلى.',
    },
    {
      code: 'RF_FEBRILE_GU_INFECTION',
      titleEn: 'High Fever with Urethral Discharge or Dysuria',
      titleAr: 'حمى عالية مع إفرازات أو حرقة بولية حادة',
      severity: 'SAME_DAY',
      slaMinutes: 480,
      goldenCase: 'GC05',
      descEn:
        'Systemic infection with acute urethritis or epididymo-orchitis. Requires same-day cultures and targeted empiric therapy.',
      descAr:
        'عدوى تناسلية حادة مصحوبة بحرارة عالية. يتطلب تقييماً في نفس اليوم وبدء مضادات حيوية مستهدفة.',
    },
    {
      code: 'RF_PITUITARY_SUSPICION',
      titleEn: 'Visual Field Loss with Gynaecomastia',
      titleAr: 'تغيرات في مجال الرؤية مع أعراض هرمونية',
      severity: 'SAME_DAY',
      slaMinutes: 480,
      goldenCase: 'GC06',
      descEn:
        'Bitemporal hemianopia with hypogonadism suggests a pituitary macroprolactinoma compressing the optic chiasm.',
      descAr:
        'فقدان جزئي لمجال الرؤية مع أعراض هرمونية تشير إلى ورم محتمل في الغدة النخامية يضغط على العصب البصري.',
    },
  ];

  // Clinical Facilities Data
  const FACILITIES = [
    {
      id: 'andrology-lab',
      image: '/images/andrology-lab.jpg',
      badgeEn: 'Phase-Contrast & CASA Laboratory',
      badgeAr: 'مختبر الفحص المجهري المتقدم',
      titleEn: 'Automated Diagnostic Andrology Workstations',
      titleAr: 'محطات الفحص المجهري المؤتمتة لكشف الخصوبة',
      descEn:
        'Equipped with precision phase-contrast optical benches and computer-assisted semen analysis (CASA) aligned with WHO 2021 protocols.',
      descAr:
        'أحدث المجاهر الضوئية المتقدمة وتحليل الحركة الرقمي المعتمد وفق بروتوكولات منظمة الصحة العالمية 2021.',
      icon: FlaskConical,
    },
    {
      id: 'clinical-consult',
      image: '/images/clinical-consult.jpg',
      badgeEn: 'Private Clinical Consultation',
      badgeAr: 'استشارة سريرية خاصة ومغلقة',
      titleEn: 'Accredited Specialist Urologist Consultations',
      titleAr: 'استشارات خاصة مع كبار أطباء الذكورة بأبوظبي',
      descEn:
        'Confidential 1-on-1 clinical review environments with licensed andrologists and urologists across Abu Dhabi and Al Ain healthcare facilities.',
      descAr:
        'جلسات مراجعة خاصة وسرية مع استشاريي طب الذكورة والمسالك البولية المرخصين في مستشفيات ومراكز أبوظبي.',
      icon: Stethoscope,
    },
    {
      id: 'athome-kit',
      image: '/images/athome-kit.jpg',
      badgeEn: 'Discreet At-Home Testing Logistics',
      badgeAr: 'طرد الفحص المنزلي السري والمعزول',
      titleEn: 'Temperature-Controlled Sample Collection',
      titleAr: 'جمع عينات منزلي مع حفظ حراري وخزائن ذكية',
      descEn:
        'Sterile thermal-sleeved collection vials with tamper-evident barcoded seals for anonymous smart-locker dropoff across Abu Dhabi.',
      descAr:
        'طقم جمع عينات معقم مزود بحفظ حراري مبرد، ورمز باركود مشفر يضمن عدم كشف الهوية عند التسليم في الخزائن الذكية.',
      icon: Package,
    },
    {
      id: 'semen-microscopy',
      image: '/images/semen-microscopy.jpg',
      badgeEn: 'WHO 2021 High-Power Microscopy',
      badgeAr: 'المجهر المرجعي لمنظمة الصحة العالمية',
      titleEn: 'Algorithmic Motility & Morphological Tracking',
      titleAr: 'تتبع حركي متقدم وحساب نسبة الأشكال الطبيعية',
      descEn:
        'Real-time automated evaluation verifying progressive motility (30%), total motility (42%), and strict normal forms (4%).',
      descAr:
        'تقييم حركي حاسوبي فوري يؤكد معايير الحركة التقدمية (30٪) والأشكال الطبيعية الصارمة (4٪) طبياً.',
      icon: Microscope,
    },
  ];

  // Scroll tracking & Intersection Observer for Progressive Reveal
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const totalDist = rect.height - windowHeight * 0.5;
      const currentPos = -rect.top + windowHeight * 0.3;
      const pct = Math.min(100, Math.max(8, (currentPos / totalDist) * 100));
      setSpineHeight(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const elements = document.querySelectorAll('[data-ladder-stage]');

    elements.forEach((el) => {
      const stage = parseInt(el.getAttribute('data-ladder-stage') || '1', 10);
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealedStages((prev) => new Set([...prev, stage]));
            setActiveStage(stage);
          }
        },
        { threshold: 0.18, rootMargin: '0px 0px -10% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative bg-[#FAF9F6] dark:bg-[#090E1A] text-slate-800 dark:text-slate-200 transition-colors duration-300 py-16 md:py-24 overflow-hidden"
    >
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl pointer-events-none -z-10 animate-ambient-glow" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-sky-100/40 dark:bg-sky-900/10 rounded-full blur-3xl pointer-events-none -z-10 animate-ambient-glow [animation-delay:3s]" />
      <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-10 animate-ambient-glow [animation-delay:6s]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Journey Section Intro */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-blue-800 dark:text-sky-300 text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-sky-400" />
            <span>{isAr ? 'المسار السريري التفاعلي · 6 محطات' : 'Interactive Clinical Pathway · 6 Milestones'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {isAr ? (
              <>
                رحلة تشخيصية متصلة من{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-cyan-300">
                  الفرز إلى الرعاية
                </span>
              </>
            ) : (
              <>
                An Interconnected Visual Journey From{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-cyan-300">
                  Intake to Care
                </span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {isAr
              ? 'اتبع الخط المحوري المتدرج لاكتشاف طبقات فيجور السريرية تباعاً: فرز مشفر بدون هوية، صمام أمان لا يقبل التراجع، محاكي منظمة الصحة، وتنسيق سريري متكامل في أبوظبي.'
              : 'Follow the progressive central spine to discover Vigor’s clinical architecture step by step: zero-account pseudonymity, deterministic safety floor, WHO 2021 lab simulator, and Abu Dhabi clinical dispatch.'}
          </p>
        </div>

        {/* =========================================================================
            THE CENTRAL ZIGZAG LADDER TIMELINE
            ========================================================================= */}
        <div className="relative">

          {/* 1. Central Vertical Spine Track */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-16 w-[3px] -translate-x-1/2 bg-slate-200/90 dark:bg-slate-800 rounded-full" />

          {/* 2. Dynamic Filled Glowing Progress Spine */}
          <div
            className="absolute left-6 md:left-1/2 top-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-blue-600 via-sky-500 to-indigo-600 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all duration-150"
            style={{ height: `${spineHeight}%` }}
          />

          {/* -----------------------------------------------------------------------
              STAGE 01 (LEFT): Anonymous Bilingual Intake & Pseudonymous Identity
              ----------------------------------------------------------------------- */}
          <div
            id="journey-intake"
            data-ladder-stage="1"
            className="relative mb-24 md:mb-32 pl-14 md:pl-0"
          >
            {/* Center Waypoint Node */}
            <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-md ${
                  revealedStages.has(1)
                    ? 'bg-blue-600 text-white scale-110 shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-950/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                01
              </div>
            </div>

            {/* Alternating Zigzag Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Content Panel (Left on Desktop) */}
              <div
                className={`transition-all duration-700 ${
                  revealedStages.has(1)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:-translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] hover-lift text-left rtl:text-right relative overflow-hidden`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 text-[11px] font-black uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-900">
                  <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>{isAr ? 'المحطة 01 · الفرز السري والمجهول' : 'Milestone 01 · Privacy-First Intake'}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {isAr ? 'فرز رقمي مجهول 100٪ بدون حساب' : '100% Anonymous Bilingual Intake'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? 'لا يتطلب النظام أي بريد إلكتروني، أو رقم هاتف، أو اسم. كل مريض يحصل على رمز هوية مقنع (psn_ ID). كل سؤال اختياري وقابل للتخطي، وتسجل التخطيات بشفافية لحساب نسبة الدقة السريرية.'
                    : 'Zero accounts, no direct identifiers, completed in under 10 minutes. Every intake assigns a cryptographically isolated pseudonymous psn_ token. Questions are skippable, and skips transparently modulate clinical confidence.'}
                </p>

                {/* Golden Cases Quick Launch */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                    <span>{isAr ? 'حالات سريرية جاهزة للاختبار السريع:' : 'Pre-Engineered Benchmark Cases:'}</span>
                    <span className="text-[10px] text-blue-600 dark:text-sky-400 font-mono">16 Verified</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'GC01', label: 'GC01 Torsion (<6h)' },
                      { id: 'GC02', label: 'GC02 Mass' },
                      { id: 'GC03', label: 'GC03 Priapism' },
                      { id: 'GC09', label: 'GC09 Subfertility' },
                      { id: 'GC15', label: 'GC15 Baseline' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectGoldenCase(c.id)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-[11px] font-bold text-blue-900 dark:text-sky-200 border border-slate-200 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition-all shadow-xs"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={onOpenIntake}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:scale-102 active:scale-98 transition-all"
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>{isAr ? 'بدء الفحص السريري الآن (مجاني)' : 'Start Anonymous Assessment'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              {/* Contextual Visual Companion (Right on Desktop) */}
              <div
                className={`transition-all duration-700 delay-150 ${
                  revealedStages.has(1)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:translate-x-8'
                } bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-sky-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                      Zero-Knowledge Enclave
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Token
                  </span>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="bg-black/30 p-3.5 rounded-xl border border-white/10">
                    <span className="text-slate-400 text-[10px] block mb-1">PSEUDONYMOUS SESSION ID:</span>
                    <span className="text-sky-300 font-bold select-all">psn_8f29c4e07a1b41d</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">DIRECT IDENTIFIERS</span>
                      <span className="text-emerald-400 font-bold mt-1 block">0 (Zero Stored)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-slate-400 block text-[10px]">TIME TO TRIAGE</span>
                      <span className="text-sky-300 font-bold mt-1 block">&lt; 10 Minutes</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="font-bold">Algorithmic Confidence Clamping</span>
                    </div>
                    <p className="text-[11px] text-blue-200/80 leading-relaxed font-sans">
                      Skipping critical reproductive metrics automatically caps confidence output rather than assuming false negatives.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------------
              STAGE 02 (RIGHT): Deterministic Safety Floor & 9 Red-Flag Gates
              ----------------------------------------------------------------------- */}
          <div
            id="journey-safety"
            data-ladder-stage="2"
            className="relative mb-24 md:mb-32 pl-14 md:pl-0"
          >
            {/* Center Waypoint Node */}
            <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-md ${
                  revealedStages.has(2)
                    ? 'bg-rose-600 text-white scale-110 shadow-rose-500/40 ring-4 ring-rose-100 dark:ring-rose-950/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                02
              </div>
            </div>

            {/* Alternating Zigzag Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Left Companion on Desktop (Invariant Diagram) */}
              <div
                className={`order-2 md:order-1 transition-all duration-700 delay-150 ${
                  revealedStages.has(2)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:-translate-x-8'
                } bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-rose-900/60 shadow-xl relative overflow-hidden`}
              >
                <div className="flex items-center gap-2 mb-4 text-rose-300 text-xs font-black uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>The Escalate-Only Invariant</span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  AI Can Elevate Care, Never Lower It
                </h4>
                <p className="text-xs text-rose-200/80 leading-relaxed mb-6">
                  9 pure mathematical functions execute over a strictly closed symptom vocabulary before any generative AI prompt runs. If an acute sign is present, triage clamps to URGENT.
                </p>

                {/* Circuit flow diagram */}
                <div className="space-y-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">1. Intake Symptoms</span>
                    <span className="text-sky-400 font-bold">Closed Vocab</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-between text-rose-200">
                    <span className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      2. Deterministic Gate
                    </span>
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px]">
                      URGENT CLAMP
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-slate-400">3. Generative Model</span>
                    <span className="text-rose-400 font-bold">De-escalate REFUSED</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-rose-900/40 flex items-center justify-between text-[11px] text-rose-300/80">
                  <span>Emergency SLA: &le; 60 Minutes</span>
                  <span className="font-bold">Zero Safety Drift</span>
                </div>
              </div>

              {/* Main Content Panel (Right on Desktop) */}
              <div
                className={`order-1 md:order-2 transition-all duration-700 ${
                  revealedStages.has(2)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] hover-lift text-left rtl:text-right relative overflow-hidden`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[11px] font-black uppercase tracking-wider mb-4 border border-rose-100 dark:border-rose-900">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                  </span>
                  <span>{isAr ? 'المحطة 02 · صمام الأمان السريري' : 'Milestone 02 · Deterministic Safety Floor'}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {isAr ? 'علامات الخطر السريرية التسع (9 Red Flags)' : 'The 9 Clinical Red-Flag Gates'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? 'صممت هذه القواعد التسع لحماية سلامة المريض فوق كل اعتبار. تعمل دوال نقية على مفردات مغلقة من الأعراض، وتفرض تصعيد الحالة الطارئة بصورة إلزامية لا يمكن للذكاء الاصطناعي خفضها.'
                    : 'These 9 deterministic gates establish the non-negotiable safety floor. AI models can elevate a tier, but can never lower it. Acute presentations bypass routine scheduling with a strict 60-minute SLA.'}
                </p>

                {/* Interactive Red Flag Selector Tabs */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {RED_FLAGS.map((rf, idx) => (
                    <button
                      key={rf.code}
                      onClick={() => setSelectedFlagIndex(idx)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedFlagIndex === idx
                          ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {rf.goldenCase}
                    </button>
                  ))}
                </div>

                {/* Selected Flag Active Preview */}
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 mb-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                      {RED_FLAGS[selectedFlagIndex].severity} · {RED_FLAGS[selectedFlagIndex].slaMinutes}m SLA
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      {RED_FLAGS[selectedFlagIndex].code}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                    {isAr ? RED_FLAGS[selectedFlagIndex].titleAr : RED_FLAGS[selectedFlagIndex].titleEn}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {isAr ? RED_FLAGS[selectedFlagIndex].descAr : RED_FLAGS[selectedFlagIndex].descEn}
                  </p>
                  <button
                    onClick={() => onSelectGoldenCase(RED_FLAGS[selectedFlagIndex].goldenCase)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 group/btn"
                  >
                    <span>{isAr ? `اختبار الحالة في المحرك السريري` : `Test ${RED_FLAGS[selectedFlagIndex].goldenCase} in Clinical Engine`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-90 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{isAr ? 'استجابة طارئة خلال 60 دقيقة في مستشفيات أبوظبي' : '60-Minute Emergency Response SLA across Abu Dhabi'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------------
              STAGE 03 (LEFT): Cryptographic Consent Ledger & Revocation Cascade
              ----------------------------------------------------------------------- */}
          <div
            id="journey-consent"
            data-ladder-stage="3"
            className="relative mb-24 md:mb-32 pl-14 md:pl-0"
          >
            {/* Center Waypoint Node */}
            <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-md ${
                  revealedStages.has(3)
                    ? 'bg-emerald-600 text-white scale-110 shadow-emerald-500/40 ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                03
              </div>
            </div>

            {/* Alternating Zigzag Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Content Panel (Left on Desktop) */}
              <div
                className={`transition-all duration-700 ${
                  revealedStages.has(3)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:-translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] hover-lift text-left rtl:text-right relative overflow-hidden`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-4 border border-emerald-100 dark:border-emerald-900">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'المحطة 03 · حوكمة البيانات والموافقة' : 'Milestone 03 · Consent Governance'}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {isAr ? 'دفتر الموافقة المشفر والإلغاء الفوري' : 'Cryptographic Consent Ledger'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? 'سجل موافقة تسلسلي صارم غير قابل للتلاعب. لا تتم أي مشاركة أو إجراء إلا بإذن صريح. زر واحد يطلق تسلسل الإلغاء الفوري ويبطل جميع الرموز مع إيصال مشفر.'
                    : 'An append-only cryptographic ledger. No consent, zero action. The user inspects shared scopes and can trigger an instant revocation cascade with a tamper-evident receipt.'}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Granular Scopes:</strong> Clinical triage, test kit dispatch, specialist review.</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>1-Click Revocation Cascade:</strong> Invalidate webhook queues & active tokens.</span>
                  </div>
                </div>

                <button
                  onClick={onOpenConsent}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:scale-102 active:scale-98 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isAr ? 'فتح لوحة التحكم بالموافقة' : 'Open Consent Control Center'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              {/* Contextual Visual Companion (Right on Desktop) */}
              <div
                className={`transition-all duration-700 delay-150 ${
                  revealedStages.has(3)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:translate-x-8'
                } bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-900/40 shadow-xl relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Immutable Hash Ledger</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Block #1,492
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="text-slate-400 text-[10px] block mb-1">RECORD TYPE:</span>
                    <span className="text-emerald-300 font-bold">consent.granted [SCOPE: TRIAGE_REVIEW]</span>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/10">
                    <span className="text-slate-400 text-[10px] block mb-1">SHA-256 PROOF:</span>
                    <span className="text-slate-300 text-[11px] truncate block select-all">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-900/30 rounded-xl border border-emerald-500/30 text-emerald-200 text-xs font-sans leading-relaxed">
                    <strong>Zero-Retention Guarantee:</strong> Triggering revocation purges sensitive answers from memory, leaving only a cryptographic receipt for verification.
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------------
              STAGE 04 (RIGHT): WHO 2021 Semen Analysis Interactive Simulator
              ----------------------------------------------------------------------- */}
          <div
            id="journey-who"
            data-ladder-stage="4"
            className="relative mb-24 md:mb-32 pl-14 md:pl-0"
          >
            {/* Center Waypoint Node */}
            <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-md ${
                  revealedStages.has(4)
                    ? 'bg-sky-600 text-white scale-110 shadow-sky-500/40 ring-4 ring-sky-100 dark:ring-sky-950/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                04
              </div>
            </div>

            {/* Alternating Zigzag Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Left Companion on Desktop (CASA Microscopy Monitor) */}
              <div
                className={`order-2 md:order-1 transition-all duration-700 delay-150 ${
                  revealedStages.has(4)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:-translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Microscope className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        CASA Motility Monitor
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-sky-300 font-bold">
                      WHO 2021 6th Ed.
                    </span>
                  </div>

                  {/* Microscopy Preview Image with Laser Scanline */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 mb-5 shadow-xs group">
                    <img
                      src="/images/semen-microscopy.jpg"
                      alt="CASA Microscopy"
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-3.5">
                      <div className="text-white text-xs font-semibold flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                          <span>Phase-Contrast Digital Optics</span>
                        </div>
                        <span className="text-[10px] font-mono bg-blue-600/90 px-2 py-0.5 rounded">
                          74-Day Cycle
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Total Sperm Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-4">
                    <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                      <span>{isAr ? 'إجمالي الحيوانات المنوية المحسوب' : 'Calculated Total Sperm Count'}</span>
                      <span className="font-mono text-[11px] text-blue-600 dark:text-sky-400">Vol &times; Conc</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{totalSperm}</span>
                      <span className="text-xs font-semibold text-slate-500">Million / ejaculate</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3 relative">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-500 dark:bg-slate-300 z-10"
                        style={{ left: `${(WHO_2021_REFERENCE_LIMITS.totalSpermMillion / 120) * 100}%` }}
                        title="WHO Floor: 39M"
                      />
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isTotalOk
                            ? 'bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-500'
                            : 'bg-gradient-to-r from-amber-400 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, (totalSperm / 120) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      WHO reference floor: <strong>39 Million</strong>. Status:{' '}
                      <span className={isTotalOk ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                        {isTotalOk ? 'Above Reference' : 'Below Reference'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status Decision Banner */}
                {isAzoospermia ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                    <strong className="block mb-0.5">LC01 Azoospermia Guardrail Active:</strong>
                    Detail is withheld from automated delivery to protect patient well-being. Immediate specialist review triggered.
                  </div>
                ) : isSevereOligo ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
                    <strong className="block mb-0.5">LC02 Severe Oligozoospermia:</strong>
                    Clamped to Andrology Specialist pathway with Karyotype + AZF microdeletion testing recommended.
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200">
                    <strong className="block mb-0.5">WHO 2021 Compliant:</strong>
                    Sample metrics meet or exceed the 5th percentile distribution of fertile men.
                  </div>
                )}
              </div>

              {/* Main Content Panel (Right on Desktop - Interactive Sliders) */}
              <div
                className={`order-1 md:order-2 transition-all duration-700 ${
                  revealedStages.has(4)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] hover-lift text-left rtl:text-right relative overflow-hidden`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[11px] font-black uppercase tracking-wider mb-4 border border-sky-100 dark:border-sky-900">
                  <Sliders className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>{isAr ? 'المحطة 04 · محاكي منظمة الصحة العالمية' : 'Milestone 04 · WHO 2021 Simulator'}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {isAr ? 'محاكي تحليل السائل المنوي التفاعلي' : 'Interactive Semen Analysis Simulator'}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => applyLabCase('normal')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:scale-105 transition-all"
                    >
                      LC04 Normal
                    </button>
                    <button
                      onClick={() => applyLabCase('severeOligo')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:scale-105 transition-all"
                    >
                      LC02 Severe
                    </button>
                    <button
                      onClick={() => applyLabCase('azoospermia')}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:scale-105 transition-all"
                    >
                      LC01 Azoo
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? 'اضبط المعايير الستة المعتمدة لفحص تطابقها الحيوي مع الحدود الدنيا للخصوبة حسب معايير WHO 2021.'
                    : 'Adjust the 6 WHO parameters to test live compliance logic and the deterministic safeguard threshold.'}
                </p>

                {/* 6 Sliders */}
                <div className="space-y-4 text-xs font-bold">
                  {/* Volume */}
                  <div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1">
                      <span>Volume: {volume} mL</span>
                      <span className={isVolumeOk ? 'text-emerald-600' : 'text-amber-600'}>Ref &ge; 1.4 mL</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="6.0"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Concentration */}
                  <div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1">
                      <span>Concentration: {concentration} M/mL</span>
                      <span className={isConcOk ? 'text-emerald-600' : 'text-rose-600'}>Ref &ge; 16 M/mL</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={concentration}
                      onChange={(e) => setConcentration(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* PR Motility */}
                  <div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1">
                      <span>Progressive Motility: {progressiveMotility}%</span>
                      <span className={isProgMotOk ? 'text-emerald-600' : 'text-amber-600'}>Ref &ge; 30%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="1"
                      value={progressiveMotility}
                      onChange={(e) => setProgressiveMotility(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Total Motility */}
                  <div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1">
                      <span>Total Motility: {totalMotility}%</span>
                      <span className={isTotalMotOk ? 'text-emerald-600' : 'text-amber-600'}>Ref &ge; 42%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="1"
                      value={totalMotility}
                      onChange={(e) => setTotalMotility(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Normal Forms */}
                  <div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1">
                      <span>Normal Morphology: {normalForms}%</span>
                      <span className={isFormsOk ? 'text-emerald-600' : 'text-amber-600'}>Ref &ge; 4%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={normalForms}
                      onChange={(e) => setNormalForms(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Vitality */}
                  <div>
                    <div className="flex justify-between text-slate-800 dark:text-slate-200 mb-1">
                      <span>Vitality: {vitality}%</span>
                      <span className={isVitalityOk ? 'text-emerald-600' : 'text-amber-600'}>Ref &ge; 54%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="95"
                      step="1"
                      value={vitality}
                      onChange={(e) => setVitality(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------------
              STAGE 05 (LEFT): Accredited Abu Dhabi Care Delivery Network
              ----------------------------------------------------------------------- */}
          <div
            id="journey-facilities"
            data-ladder-stage="5"
            className="relative mb-24 md:mb-32 pl-14 md:pl-0"
          >
            {/* Center Waypoint Node */}
            <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-md ${
                  revealedStages.has(5)
                    ? 'bg-indigo-600 text-white scale-110 shadow-indigo-500/40 ring-4 ring-indigo-100 dark:ring-indigo-950/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                05
              </div>
            </div>

            {/* Alternating Zigzag Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Content Panel (Left on Desktop) */}
              <div
                className={`transition-all duration-700 ${
                  revealedStages.has(5)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:-translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] hover-lift text-left rtl:text-right relative overflow-hidden`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-wider mb-4 border border-indigo-100 dark:border-indigo-900">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{isAr ? 'المحطة 05 · البنية التحتية الطبية' : 'Milestone 05 · Clinical Delivery Network'}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {isAr ? 'البيئة السريرية المعتمدة في أبوظبي' : 'Accredited Care Delivery in Abu Dhabi'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? 'توجيه آمن ومحكم: عينات فحص منزلي معزولة حرارياً، خزائن استلام ذكية سرية، واستشارات خاصة مع استشاريي طب الذكورة المرخصين من دائرة الصحة بأبوظبي.'
                    : 'Closing the loop between anonymous digital triage and accredited physical care: discreet thermal-insulated test kits, smart-locker dropoff, and licensed urologists.'}
                </p>

                {/* Facility Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {FACILITIES.map((fac, idx) => {
                    const IconComp = fac.icon;
                    return (
                      <button
                        key={fac.id}
                        onClick={() => setActiveFacilityIndex(idx)}
                        className={`p-3 rounded-2xl text-left rtl:text-right transition-all flex items-start gap-2.5 ${
                          activeFacilityIndex === idx
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-2 border-indigo-600 text-indigo-950 dark:text-indigo-200 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 mt-0.5 shrink-0 ${activeFacilityIndex === idx ? 'text-indigo-600' : 'text-slate-500'}`} />
                        <div>
                          <span className="text-xs font-bold block">{isAr ? fac.badgeAr : fac.badgeEn}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={onOpenAtHomeKit}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 hover:scale-102 active:scale-98 transition-all"
                >
                  <Package className="w-4 h-4" />
                  <span>{isAr ? 'تفاصيل طرد الفحص المنزلي السري' : 'Explore At-Home Kit Protocol'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              {/* Contextual Visual Companion (Right on Desktop - Image view with Scanline) */}
              <div
                className={`transition-all duration-700 delay-150 ${
                  revealedStages.has(5)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden`}
              >
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-64 sm:h-72 mb-4 group">
                  <img
                    src={FACILITIES[activeFacilityIndex].image}
                    alt={FACILITIES[activeFacilityIndex].titleEn}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                      Abu Dhabi Licensed Healthcare Facility
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1 text-left rtl:text-right">
                  {isAr ? FACILITIES[activeFacilityIndex].titleAr : FACILITIES[activeFacilityIndex].titleEn}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-left rtl:text-right">
                  {isAr ? FACILITIES[activeFacilityIndex].descAr : FACILITIES[activeFacilityIndex].descEn}
                </p>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------------
              STAGE 06 (RIGHT): Autonomous Orchestration & Clinician Review Queue
              ----------------------------------------------------------------------- */}
          <div
            id="journey-clinician"
            data-ladder-stage="6"
            className="relative mb-24 md:mb-32 pl-14 md:pl-0"
          >
            {/* Center Waypoint Node */}
            <div className="absolute left-6 md:left-1/2 top-6 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-md ${
                  revealedStages.has(6)
                    ? 'bg-blue-600 text-white scale-110 shadow-blue-500/40 ring-4 ring-blue-100 dark:ring-blue-950/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                06
              </div>
            </div>

            {/* Alternating Zigzag Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              
              {/* Left Companion on Desktop (Telemetry & Infrastructure) */}
              <div
                className={`order-2 md:order-1 transition-all duration-700 delay-150 ${
                  revealedStages.has(6)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:-translate-x-8'
                } bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                      Live Stack Telemetry
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    All Systems Operational
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">n8n Orchestration Core:</span>
                    <span className="text-emerald-400 font-bold">10 Active Workflows</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">Database Engine:</span>
                    <span className="text-sky-300 font-bold">MongoDB Atlas</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center justify-between">
                    <span className="text-slate-300">SLA Sweep Watchdog:</span>
                    <span className="text-emerald-400 font-bold">&le; 60m SLA Enforced</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={onOpenArchitecture}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>View Architecture Blueprint</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main Content Panel (Right on Desktop) */}
              <div
                className={`order-1 md:order-2 transition-all duration-700 ${
                  revealedStages.has(6)
                    ? 'opacity-100 translate-y-0 translate-x-0'
                    : 'opacity-0 translate-y-10 md:translate-x-8'
                } bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_-4px_rgba(15,23,42,0.06)] hover-lift text-left rtl:text-right relative overflow-hidden`}
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-sky-300 text-[11px] font-black uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-900">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  <span>{isAr ? 'المحطة 06 · الأتمتة والمراجعة الطبية' : 'Milestone 06 · Human-In-The-Loop'}</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {isAr ? 'محرك الأتمتة ومنصة مراجعة الأطباء' : 'Autonomous Engine & Clinician Portal'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? '10 تدفقات عمل آلية تعمل على مدار الساعة لإدارة مستويات الخطورة، وسحب العينات، ومراقبة مواعيد الطوارئ. تتيح منصة الأطباء للأخصائيين مراجعة الحالات المرفوعة وتأكيد التوجيه السريري.'
                    : '10 event-driven workflows monitor queue SLAs, dispatch test kits, and escalate red flags. The Clinician Review console provides licensed specialists with direct override authority and audit visibility.'}
                </p>

                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 mb-6">
                  <h4 className="text-xs font-bold text-blue-950 dark:text-sky-300 uppercase mb-2">
                    Specialist Review Authority:
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Override automated risk category with mandatory audit note</li>
                    <li>Order immediate confirmatory centrifuged semen pellet exam</li>
                    <li>Direct confidential booking at Abu Dhabi accredited andrology clinics</li>
                  </ul>
                </div>

                <button
                  onClick={onOpenClinician}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:scale-102 active:scale-98 transition-all"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>{isAr ? 'فتح منصة مراجعة الأطباء' : 'Launch Clinician Console'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

            </div>
          </div>

          {/* -----------------------------------------------------------------------
              TERMINAL MILESTONE (CENTER): The Grand Destination & Assessment Terminal
              ----------------------------------------------------------------------- */}
          <div
            id="journey-destination"
            className="relative pt-12 text-center max-w-3xl mx-auto"
          >
            {/* Terminal Waypoint Icon */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30 ring-8 ring-blue-100 dark:ring-blue-950/60 animate-cardiac">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span>{isAr ? 'المحطة الختامية · سلامتك أولاً' : 'Final Milestone · Care at Your Terms'}</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              {isAr ? 'جاهز لحماية صحتك التناسلية باطمئنان؟' : 'Ready to Take Charge of Your Reproductive Health?'}
            </h3>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto">
              {isAr
                ? 'فحص سري تماماً ومجهول الهوية لا يستغرق أكثر من 10 دقائق. معتمد طبياً ومحمي بصمامات أمان حتمية.'
                : '100% confidential, free, and completed in under 10 minutes. Zero accounts. Deterministic clinical protection.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={onOpenIntake}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white font-extrabold text-base shadow-xl shadow-blue-600/30 hover:scale-103 active:scale-98 transition-all"
              >
                <HeartPulse className="w-5 h-5" />
                <span>{isAr ? 'ابدأ الفحص المجهول الآن' : 'Begin Confidential Assessment'}</span>
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </button>
            </div>

            {/* 24/7 Hotline Badge */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-left rtl:text-right max-w-xl mx-auto">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {isAr
                    ? 'طوارئ أبوظبي (998): في حال الألم الحاد أو التورم المفاجئ (<6 ساعات).'
                    : 'Abu Dhabi Emergency (998): In case of acute scrotal pain or sudden swelling (<6h).'}
                </span>
              </div>
              <span className="font-mono font-bold text-xs bg-rose-200 dark:bg-rose-900 px-2.5 py-1 rounded-lg shrink-0">
                Dial 998 / 999
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
