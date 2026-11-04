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
  ArrowLeft,
  Sparkles,
  Clock,
  EyeOff,
  Sliders,
  ExternalLink,
  FileText,
  Layers,
  ArrowUpRight,
  KeyRound,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { Locale } from '@/types/vigor';
import { WHO_2021_REFERENCE_LIMITS } from '@/lib/clinical-engine';

interface ZigzagArrowJourneyProps {
  locale: Locale;
  onOpenIntake: () => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
  onOpenAtHomeKit: () => void;
  onSelectGoldenCase: (caseId: string) => void;
}

export default function ZigzagArrowJourney({
  locale,
  onOpenIntake,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
  onOpenAtHomeKit,
  onSelectGoldenCase,
}: ZigzagArrowJourneyProps) {
  const isAr = locale === 'ar';

  // Progressive Scroll-Reveal State
  const [revealedStages, setRevealedStages] = useState<Set<number>>(new Set([1]));
  const [activeStage, setActiveStage] = useState<number>(1);
  const [scrollProgress, setScrollProgress] = useState<number>(10);

  const containerRef = useRef<HTMLDivElement>(null);

  // Red-flag selector state (Stage 2)
  const [selectedFlagIndex, setSelectedFlagIndex] = useState<number>(0);

  // WHO Simulator state (Stage 4)
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

  const applyLabCase = (caseType: 'normal' | 'azoospermia' | 'severeOligo') => {
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
    }
  };

  // Facility tab state (Stage 5)
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
      badgeEn: 'CASA & Phase-Contrast Laboratory',
      badgeAr: 'مختبر الفحص المجهري المتقدم',
      titleEn: 'Automated Diagnostic Andrology Workstations',
      titleAr: 'محطات الفحص المجهري المؤتمتة لكشف الخصوبة',
      descEn:
        'Precision phase-contrast optical benches and computer-assisted semen analysis (CASA) fully aligned with WHO 2021 standards.',
      descAr:
        'أحدث المجاهر الضوئية المتقدمة وتحليل الحركة الرقمي المعتمد وفق بروتوكولات منظمة الصحة العالمية 2021.',
      icon: FlaskConical,
    },
    {
      id: 'clinical-consult',
      image: '/images/clinical-consult.jpg',
      badgeEn: 'Private Clinical Consultation',
      badgeAr: 'استشارة سريرية خاصة ومغلقة',
      titleEn: 'Licensed Specialist Andrology Consultations',
      titleAr: 'استشارات خاصة مع كبار أطباء الذكورة بأبوظبي',
      descEn:
        'Private 1-on-1 consultation environments with licensed andrologists and urologists across Abu Dhabi and Al Ain.',
      descAr:
        'جلسات مراجعة خاصة وسرية مع استشاريي طب الذكورة والمسالك البولية المرخصين في مستشفيات ومراكز أبوظبي.',
      icon: Stethoscope,
    },
    {
      id: 'athome-kit',
      image: '/images/athome-kit.jpg',
      badgeEn: 'Discreet At-Home Testing Logistics',
      badgeAr: 'طرد الفحص المنزلي السري والمعزول',
      titleEn: 'Thermal-Preserved Sample Collection & Smart Lockers',
      titleAr: 'جمع عينات منزلي مع حفظ حراري وخزائن ذكية',
      descEn:
        'Sterile thermal-sleeved collection vials with barcoded anonymous seals for contact-free smart-locker dropoff.',
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

  // Scroll tracking & Intersection Observer
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalDist = rect.height - windowHeight * 0.4;
      const currentPos = -rect.top + windowHeight * 0.25;
      const pct = Math.min(100, Math.max(5, (currentPos / totalDist) * 100));
      setScrollProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const elements = document.querySelectorAll('[data-arrow-stage]');

    elements.forEach((el) => {
      const stage = parseInt(el.getAttribute('data-arrow-stage') || '1', 10);
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealedStages((prev) => new Set([...prev, stage]));
            setActiveStage(stage);
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative pt-12 pb-24 md:py-28 text-slate-800 dark:text-slate-100 overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Journey Section Intro */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFECE4] dark:bg-slate-800/80 border border-[#DDD9CE] dark:border-slate-700 text-blue-900 dark:text-sky-300 text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 animate-spin [animation-duration:20s]" />
            <span>{isAr ? 'المسار السريري التفاعلي · 6 محطات سهمية' : 'Interactive Arrow Journey · 6 Milestones'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            {isAr ? (
              <>
                مسار سهمي متصل عبر{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-cyan-300">
                  سلم التشخيص والرعاية
                </span>
              </>
            ) : (
              <>
                Winding Zigzag Ladder &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-600 dark:from-blue-400 dark:via-sky-300 dark:to-cyan-300">
                  Directional Arrow Reveal
                </span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-medium">
            {isAr
              ? 'تدرج نزولاً مع رسم المسار السهمي لاكتشاف طبقات فيجور السريرية تباعاً: فرز سريري مجهول، صمام أمان حتمي، محاكي منظمة الصحة، وتنسيق سريري متكامل.'
              : 'Scroll to progressively draw the winding ladder line. Each alternating turn unfolds a directional arrow revealing clinical privacy, safety gates, and accredited diagnostics.'}
          </p>
        </div>

        {/* =========================================================================
            THE WINDING ZIGZAG LADDER & ARROW-SHAPED REVEAL SYSTEM
            ========================================================================= */}
        <div className="relative">

          {/* Continuous Thin Zigzag Ladder Line (SVG Vector Canvas) */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none hidden md:block">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 3600">
              <defs>
                <linearGradient id="ladderGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="35%" stopColor="#0284C7" />
                  <stop offset="70%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Inactive Background Track (Thin 1.5px) */}
              <path
                d="M 500,20 
                   L 250,20 Q 220,20 220,50 
                   L 220,550 Q 220,580 250,580 
                   L 750,580 Q 780,580 780,610 
                   L 780,1150 Q 780,1180 750,1180 
                   L 250,1180 Q 220,1180 220,1210 
                   L 220,1750 Q 220,1780 250,1780 
                   L 750,1780 Q 780,1780 780,1810 
                   L 780,2350 Q 780,2380 750,2380 
                   L 250,2380 Q 220,2380 220,2410 
                   L 220,2950 Q 220,2980 250,2980 
                   L 500,2980 L 500,3450"
                fill="none"
                stroke="#DDD9CE"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                className="opacity-70 dark:opacity-20"
              />

              {/* Active Dynamically Drawn Path (Progressive Scroll Draw) */}
              <path
                d="M 500,20 
                   L 250,20 Q 220,20 220,50 
                   L 220,550 Q 220,580 250,580 
                   L 750,580 Q 780,580 780,610 
                   L 780,1150 Q 780,1180 750,1180 
                   L 250,1180 Q 220,1180 220,1210 
                   L 220,1750 Q 220,1780 250,1780 
                   L 750,1780 Q 780,1780 780,1810 
                   L 780,2350 Q 780,2380 750,2380 
                   L 250,2380 Q 220,2380 220,2410 
                   L 220,2950 Q 220,2980 250,2980 
                   L 500,2980 L 500,3450"
                fill="none"
                stroke="url(#ladderGlowGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 9000,
                  strokeDashoffset: Math.max(0, 9000 - (scrollProgress / 100) * 9000),
                  transition: 'stroke-dashoffset 0.15s ease-out',
                }}
              />
            </svg>
          </div>

          {/* Mobile Linear Continuous Line */}
          <div
            aria-hidden="true"
            className="md:hidden absolute left-4 top-0 bottom-12 w-[2px] bg-[#DDD9CE] dark:bg-slate-800"
          >
            <div
              className="w-full bg-gradient-to-b from-blue-600 via-sky-500 to-indigo-600 transition-all duration-150"
              style={{ height: `${scrollProgress}%` }}
            />
          </div>

          {/* =========================================================================
              ARROW STAGE 01: Anonymous Intake & Privacy Enclave (Arrow Points RIGHT)
              ========================================================================= */}
          <div
            id="journey-intake"
            data-arrow-stage="1"
            className="relative mb-28 md:mb-40 pl-8 md:pl-0"
          >
            {/* Ladder Connector Node */}
            <div className="hidden md:flex absolute left-[213px] top-6 z-20 items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ring-4 ${
                  revealedStages.has(1)
                    ? 'bg-blue-600 ring-blue-200 dark:ring-blue-900 shadow-md shadow-blue-500/50 scale-125'
                    : 'bg-white ring-[#DDD9CE] dark:bg-slate-800 dark:ring-slate-700'
                }`}
              />
            </div>

            {/* Directional Arrow Container (Points RIGHT on Desktop) */}
            <div
              className={`transition-all duration-700 ${
                revealedStages.has(1)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 -translate-x-12 translate-y-6'
              } max-w-4xl mx-auto`}
            >
              <div className="relative bg-white dark:bg-[#0E1526] rounded-3xl md:rounded-r-[48px] p-6 sm:p-10 border border-[#E4E0D5] dark:border-slate-800 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.05)] overflow-hidden group">
                
                {/* Arrowhead Directional Apex Ribbon on the Right */}
                <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-blue-50/60 dark:from-blue-950/30 to-transparent items-center justify-end pr-4 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/60 border border-blue-200/80 dark:border-blue-700/80 flex items-center justify-center text-blue-600 dark:text-sky-300 shadow-xs group-hover:translate-x-1.5 transition-transform duration-300">
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Arrow Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0ECE1] dark:border-slate-800/80">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-blue-900">
                    <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>{isAr ? 'المرحلة 01 · سهم التوجيه الأيمن' : 'Stage 01 · Arrow to Care'}</span>
                    <span className="text-blue-400 dark:text-sky-500 font-bold ml-1">──▶</span>
                  </div>

                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold bg-[#F7F6F2] dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-[#E8E4DA] dark:border-slate-700">
                    psn_token · Zero Account
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center md:pr-12">
                  <div className="lg:col-span-7 text-left rtl:text-right">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                      {isAr ? 'فرز رقمي مجهول الهوية 100٪ بدون تسجيل' : 'Anonymous Bilingual Intake'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                      {isAr
                        ? 'فحص سري تماماً لا يتطلب بريداً إلكترونياً أو اسماً. كل سؤال اختياري وقابل للتخطي، وتسجل التخطيات بشفافية لحساب نسبة الدقة السريرية.'
                        : 'Zero accounts, no direct identifiers. Complete in under 10 minutes. Every question is skippable, and skips are transparently factored into clinical confidence scoring.'}
                    </p>

                    {/* Pre-Engineered Benchmark Chips */}
                    <div className="mb-6 p-4 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                        <span>{isAr ? 'اختبار الحالات المعيارية الجاهزة:' : 'Fast-Track Benchmark Scenarios:'}</span>
                        <span className="text-[10px] text-blue-600 dark:text-sky-400 font-mono">16 Scenarios</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'GC01', label: 'GC01 Torsion (<6h)' },
                          { id: 'GC02', label: 'GC02 Lump' },
                          { id: 'GC03', label: 'GC03 Priapism' },
                          { id: 'GC09', label: 'GC09 Infertility' },
                          { id: 'GC15', label: 'GC15 Baseline' },
                        ].map((c) => (
                          <button
                            key={c.id}
                            onClick={() => onSelectGoldenCase(c.id)}
                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 text-[11px] font-bold text-blue-900 dark:text-sky-200 border border-[#DDD9CE] dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 hover:scale-105 active:scale-95 transition-all shadow-2xs"
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={onOpenIntake}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 hover:scale-102 active:scale-98 transition-all"
                    >
                      <HeartPulse className="w-4 h-4" />
                      <span>{isAr ? 'بدء الفحص السريري الآن (مجاني)' : 'Start Anonymous Assessment'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Right Enclave Panel */}
                  <div className="lg:col-span-5 bg-[#FAF9F5] dark:bg-slate-800/60 p-5 rounded-2xl border border-[#E7E3D8] dark:border-slate-700 font-mono text-xs text-left rtl:text-right space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E7E3D8] dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Client Token Isolation</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                        AES-256
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#E7E3D8] dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 block mb-0.5">SESSION ID:</span>
                      <span className="text-blue-700 dark:text-sky-300 font-bold truncate block select-all">psn_8f29c4e07a1b</span>
                    </div>
                    <div className="text-[11px] font-sans text-slate-600 dark:text-slate-300 leading-relaxed">
                      Zero persistent tracking cookies. Data is processed in an ephemeral memory envelope and locked against de-identification.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ARROW STAGE 02: Deterministic Safety Floor (Arrow Points LEFT)
              ========================================================================= */}
          <div
            id="journey-safety"
            data-arrow-stage="2"
            className="relative mb-28 md:mb-40 pl-8 md:pl-0"
          >
            {/* Ladder Connector Node on the Right Channel */}
            <div className="hidden md:flex absolute right-[213px] top-6 z-20 items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ring-4 ${
                  revealedStages.has(2)
                    ? 'bg-rose-600 ring-rose-200 dark:ring-rose-900 shadow-md shadow-rose-500/50 scale-125'
                    : 'bg-white ring-[#DDD9CE] dark:bg-slate-800 dark:ring-slate-700'
                }`}
              />
            </div>

            {/* Directional Arrow Container (Points LEFT on Desktop) */}
            <div
              className={`transition-all duration-700 ${
                revealedStages.has(2)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-x-12 translate-y-6'
              } max-w-4xl mx-auto`}
            >
              <div className="relative bg-white dark:bg-[#0E1526] rounded-3xl md:rounded-l-[48px] p-6 sm:p-10 border border-[#E4E0D5] dark:border-slate-800 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.05)] overflow-hidden group">
                
                {/* Arrowhead Directional Apex Ribbon on the Left */}
                <div className="hidden md:flex absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-rose-50/60 dark:from-rose-950/30 to-transparent items-center justify-start pl-4 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/60 border border-rose-200/80 dark:border-rose-700/80 flex items-center justify-center text-rose-600 dark:text-rose-300 shadow-xs group-hover:-translate-x-1.5 transition-transform duration-300">
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Arrow Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0ECE1] dark:border-slate-800/80 md:pl-12">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-100 dark:border-rose-900">
                    <span className="text-rose-400 dark:text-rose-500 font-bold mr-1">◀──</span>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{isAr ? 'المرحلة 02 · صمام الأمان السريري' : 'Stage 02 · Safety Floor Gate'}</span>
                  </div>

                  <span className="text-xs font-mono text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                    Escalate-Only Invariant
                  </span>
                </div>

                <div className="md:pl-12 text-left rtl:text-right">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                    {isAr ? 'علامات الخطر السريرية التسع (9 Red Flags)' : 'The 9 Deterministic Red-Flag Gates'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {isAr
                      ? '9 دوال برمجية نقية تفحص علامات الخطر الحرجة (مثل التواء الخصية أو الكتل) قبل أي نموذج ذكاء اصطناعي. يمكن للنظام رفع مستوى الخطورة فقط، ويمنع خفضها.'
                      : '9 pure mathematical functions run over a closed symptom vocabulary before any AI model. AI models can elevate clinical care, but can NEVER lower it. Acute presentations bypass routine scheduling with a strict 60-minute SLA.'}
                  </p>

                  {/* Interactive Red Flag Selector Tabs */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {RED_FLAGS.map((rf, idx) => (
                      <button
                        key={rf.code}
                        onClick={() => setSelectedFlagIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          selectedFlagIndex === idx
                            ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 scale-102'
                            : 'bg-[#FAF9F5] dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#E6E2D7] dark:border-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {rf.goldenCase}
                      </button>
                    ))}
                  </div>

                  {/* Active Flag Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 mb-6">
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
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {isAr ? RED_FLAGS[selectedFlagIndex].descAr : RED_FLAGS[selectedFlagIndex].descEn}
                    </p>

                    <button
                      onClick={() => onSelectGoldenCase(RED_FLAGS[selectedFlagIndex].goldenCase)}
                      className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-900 flex items-center gap-1 group/btn"
                    >
                      <span>{isAr ? `اختبار الحالة في المحرك السريري` : `Test Case ${RED_FLAGS[selectedFlagIndex].goldenCase} in Clinical Engine`}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-90 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Clock className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>60-Minute Emergency SLA to Accredited Abu Dhabi Urology Facilities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ARROW STAGE 03: Consent Ledger & Revocation (Arrow Points RIGHT)
              ========================================================================= */}
          <div
            id="journey-consent"
            data-arrow-stage="3"
            className="relative mb-28 md:mb-40 pl-8 md:pl-0"
          >
            {/* Ladder Connector Node on Left Channel */}
            <div className="hidden md:flex absolute left-[213px] top-6 z-20 items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ring-4 ${
                  revealedStages.has(3)
                    ? 'bg-emerald-600 ring-emerald-200 dark:ring-emerald-900 shadow-md shadow-emerald-500/50 scale-125'
                    : 'bg-white ring-[#DDD9CE] dark:bg-slate-800 dark:ring-slate-700'
                }`}
              />
            </div>

            {/* Directional Arrow Container (Points RIGHT on Desktop) */}
            <div
              className={`transition-all duration-700 ${
                revealedStages.has(3)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 -translate-x-12 translate-y-6'
              } max-w-4xl mx-auto`}
            >
              <div className="relative bg-white dark:bg-[#0E1526] rounded-3xl md:rounded-r-[48px] p-6 sm:p-10 border border-[#E4E0D5] dark:border-slate-800 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.05)] overflow-hidden group">
                
                {/* Arrowhead Directional Apex Ribbon on the Right */}
                <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-emerald-50/60 dark:from-emerald-950/30 to-transparent items-center justify-end pr-4 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-700/80 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-xs group-hover:translate-x-1.5 transition-transform duration-300">
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Arrow Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0ECE1] dark:border-slate-800/80">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isAr ? 'المرحلة 03 · حوكمة الموافقة والبيانات' : 'Stage 03 · Consent Ledger Arrow'}</span>
                    <span className="text-emerald-500 font-bold ml-1">──▶</span>
                  </div>

                  <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    Append-Only Ledger
                  </span>
                </div>

                <div className="md:pr-12 text-left rtl:text-right">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                    {isAr ? 'دفتر الموافقة المشفر والإلغاء الفوري بضغطة زر' : 'Cryptographic Consent & Instant Revocation'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {isAr
                      ? 'سجل موافقة تسلسلي صارم غير قابل للتلاعب. لا تتم أي مشاركة أو إجراء إلا بإذن صريح. زر واحد يطلق تسلسل الإلغاء الفوري ويبطل جميع الرموز مع إيصال مشفر.'
                      : 'An immutable append-only ledger. No consent, zero downstream workflow action. Scoped permissions ensure you control triage access, test kit dispatch, and clinician reviews.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs font-medium">
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">Granular Scopes</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Authorize triage scoring without granting physical kit logistics or clinical record sharing.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white block mb-1">1-Click Cascade</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Instantly triggers webhook revocation across all 10 n8n workflows with a verifiable cryptographic receipt.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onOpenConsent}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:scale-102 active:scale-98 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isAr ? 'فتح لوحة التحكم بالموافقة' : 'Open Consent Control Terminal'}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ARROW STAGE 04: WHO 2021 Semen Analysis Simulator (Arrow Points LEFT)
              ========================================================================= */}
          <div
            id="journey-who"
            data-arrow-stage="4"
            className="relative mb-28 md:mb-40 pl-8 md:pl-0"
          >
            {/* Ladder Connector Node on Right Channel */}
            <div className="hidden md:flex absolute right-[213px] top-6 z-20 items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ring-4 ${
                  revealedStages.has(4)
                    ? 'bg-sky-600 ring-sky-200 dark:ring-sky-900 shadow-md shadow-sky-500/50 scale-125'
                    : 'bg-white ring-[#DDD9CE] dark:bg-slate-800 dark:ring-slate-700'
                }`}
              />
            </div>

            {/* Directional Arrow Container (Points LEFT on Desktop) */}
            <div
              className={`transition-all duration-700 ${
                revealedStages.has(4)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-x-12 translate-y-6'
              } max-w-4xl mx-auto`}
            >
              <div className="relative bg-white dark:bg-[#0E1526] rounded-3xl md:rounded-l-[48px] p-6 sm:p-10 border border-[#E4E0D5] dark:border-slate-800 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.05)] overflow-hidden group">
                
                {/* Arrowhead Directional Apex Ribbon on the Left */}
                <div className="hidden md:flex absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-sky-50/60 dark:from-sky-950/30 to-transparent items-center justify-start pl-4 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-900/60 border border-sky-200/80 dark:border-sky-700/80 flex items-center justify-center text-sky-600 dark:text-sky-300 shadow-xs group-hover:-translate-x-1.5 transition-transform duration-300">
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Arrow Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0ECE1] dark:border-slate-800/80 md:pl-12">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-black uppercase tracking-wider border border-sky-100 dark:border-sky-900">
                    <span className="text-sky-400 font-bold mr-1">◀──</span>
                    <Sliders className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>{isAr ? 'المرحلة 04 · محاكي منظمة الصحة' : 'Stage 04 · WHO 2021 Lab Simulator'}</span>
                  </div>

                  {/* Preset Buttons */}
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

                <div className="md:pl-12 text-left rtl:text-right">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {isAr ? 'محاكي تحليل السائل المنوي (الإصدار السادس 2021)' : 'Interactive Semen Analysis Simulator'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {isAr
                      ? 'تعتمد فيجور الحدود المرجعية الدنيا لمنظمة الصحة العالمية لعام 2021. اضبط المعايير الستة لفحص القرار السريري المؤتمت.'
                      : 'Benchmarked against the 5th centile reference distribution of fertile men established by WHO 2021. Adjust sliders to test automated compliance and safeguarding gates.'}
                  </p>

                  {/* 6 Reactive Sliders Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs font-bold">
                    {/* Volume */}
                    <div className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <div className="flex justify-between mb-1">
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
                    <div className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <div className="flex justify-between mb-1">
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
                    <div className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <div className="flex justify-between mb-1">
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
                    <div className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <div className="flex justify-between mb-1">
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
                    <div className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <div className="flex justify-between mb-1">
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
                    <div className="p-3 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/50 border border-[#E9E5DB] dark:border-slate-700">
                      <div className="flex justify-between mb-1">
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

                  {/* Calculated Sperm Count & Decision Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-[#E7E3D8] dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Calculated Total Sperm</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{totalSperm}</span>
                        <span className="text-xs text-slate-500 font-medium">Million (Ref &ge; 39M)</span>
                      </div>
                    </div>

                    {/* Live Decision */}
                    <div className="text-xs">
                      {isAzoospermia ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">LC01 Azoospermia Guardrail Active</span>
                      ) : isSevereOligo ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">LC02 Severe Oligozoospermia Triage</span>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Meets WHO 2021 Reference Floor</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ARROW STAGE 05: Abu Dhabi Care Delivery (Arrow Points RIGHT)
              ========================================================================= */}
          <div
            id="journey-facilities"
            data-arrow-stage="5"
            className="relative mb-28 md:mb-40 pl-8 md:pl-0"
          >
            {/* Ladder Connector Node on Left Channel */}
            <div className="hidden md:flex absolute left-[213px] top-6 z-20 items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ring-4 ${
                  revealedStages.has(5)
                    ? 'bg-indigo-600 ring-indigo-200 dark:ring-indigo-900 shadow-md shadow-indigo-500/50 scale-125'
                    : 'bg-white ring-[#DDD9CE] dark:bg-slate-800 dark:ring-slate-700'
                }`}
              />
            </div>

            {/* Directional Arrow Container (Points RIGHT on Desktop) */}
            <div
              className={`transition-all duration-700 ${
                revealedStages.has(5)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 -translate-x-12 translate-y-6'
              } max-w-4xl mx-auto`}
            >
              <div className="relative bg-white dark:bg-[#0E1526] rounded-3xl md:rounded-r-[48px] p-6 sm:p-10 border border-[#E4E0D5] dark:border-slate-800 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.05)] overflow-hidden group">
                
                {/* Arrowhead Directional Apex Ribbon on the Right */}
                <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-indigo-50/60 dark:from-indigo-950/30 to-transparent items-center justify-end pr-4 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-700/80 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-xs group-hover:translate-x-1.5 transition-transform duration-300">
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Arrow Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0ECE1] dark:border-slate-800/80">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-900">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{isAr ? 'المرحلة 05 · شبكة الرعاية المعتمدة' : 'Stage 05 · Care Delivery Arrow'}</span>
                    <span className="text-indigo-500 font-bold ml-1">──▶</span>
                  </div>

                  <span className="text-xs font-mono text-indigo-800 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    Abu Dhabi Healthcare
                  </span>
                </div>

                <div className="md:pr-12 text-left rtl:text-right">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                    {isAr ? 'البيئة السريرية والمخبرية المعتمدة في أبوظبي' : 'Accredited Abu Dhabi Care Delivery'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {isAr
                      ? 'توجيه آمن: عينات فحص منزلي معزولة حرارياً، خزائن استلام سرية، واستشارات متخصصة في مراكز طب الذكورة المعتمدة بأبوظبي.'
                      : 'Closing the loop between confidential intake and physical care: discreet thermal test kits, smart-locker dropoff, and licensed urologists.'}
                  </p>

                  {/* 4 Interactive Facility Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {FACILITIES.map((fac, idx) => (
                      <button
                        key={fac.id}
                        onClick={() => setActiveFacilityIndex(idx)}
                        className={`p-3 rounded-2xl text-left rtl:text-right transition-all ${
                          activeFacilityIndex === idx
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 border-2 border-indigo-600 text-indigo-950 dark:text-indigo-200 shadow-sm'
                            : 'bg-[#FAF9F5] dark:bg-slate-800/60 border border-[#E9E5DB] dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-bold block">{fac.badgeEn}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Facility Image with Diagnostic Scanline Beam */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-56 mb-4 group/img">
                    <img
                      src={FACILITIES[activeFacilityIndex].image}
                      alt={FACILITIES[activeFacilityIndex].titleEn}
                      className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-700"
                    />
                    <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                      <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                        {FACILITIES[activeFacilityIndex].titleEn}
                      </span>
                    </div>
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
              </div>
            </div>
          </div>

          {/* =========================================================================
              ARROW STAGE 06: Autonomous Telemetry & Clinician Console (Arrow Points LEFT)
              ========================================================================= */}
          <div
            id="journey-clinician"
            data-arrow-stage="6"
            className="relative mb-28 md:mb-40 pl-8 md:pl-0"
          >
            {/* Ladder Connector Node on Right Channel */}
            <div className="hidden md:flex absolute right-[213px] top-6 z-20 items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ring-4 ${
                  revealedStages.has(6)
                    ? 'bg-blue-600 ring-blue-200 dark:ring-blue-900 shadow-md shadow-blue-500/50 scale-125'
                    : 'bg-white ring-[#DDD9CE] dark:bg-slate-800 dark:ring-slate-700'
                }`}
              />
            </div>

            {/* Directional Arrow Container (Points LEFT on Desktop) */}
            <div
              className={`transition-all duration-700 ${
                revealedStages.has(6)
                  ? 'opacity-100 translate-x-0 translate-y-0'
                  : 'opacity-0 translate-x-12 translate-y-6'
              } max-w-4xl mx-auto`}
            >
              <div className="relative bg-white dark:bg-[#0E1526] rounded-3xl md:rounded-l-[48px] p-6 sm:p-10 border border-[#E4E0D5] dark:border-slate-800 shadow-[0_10px_35px_-8px_rgba(15,23,42,0.05)] overflow-hidden group">
                
                {/* Arrowhead Directional Apex Ribbon on the Left */}
                <div className="hidden md:flex absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-blue-50/60 dark:from-blue-950/30 to-transparent items-center justify-start pl-4 pointer-events-none">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/60 border border-blue-200/80 dark:border-blue-700/80 flex items-center justify-center text-blue-600 dark:text-sky-300 shadow-xs group-hover:-translate-x-1.5 transition-transform duration-300">
                    <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
                  </div>
                </div>

                {/* Arrow Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#F0ECE1] dark:border-slate-800/80 md:pl-12">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-blue-900">
                    <span className="text-blue-400 font-bold mr-1">◀──</span>
                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                    <span>{isAr ? 'المرحلة 06 · الأتمتة ومنصة الأطباء' : 'Stage 06 · Autonomous Telemetry Arrow'}</span>
                  </div>

                  <span className="text-xs font-mono text-blue-800 dark:text-sky-300 font-bold bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                    10 n8n Workflows
                  </span>
                </div>

                <div className="md:pl-12 text-left rtl:text-right">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-3">
                    {isAr ? 'محرك الأتمتة ومنصة مراجعة الأطباء' : 'Autonomous Telemetry & Specialist Review'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-normal">
                    {isAr
                      ? '10 تدفقات عمل آلية تعمل على مدار الساعة لإدارة مستويات الخطورة ومراقبة مواعيد الطوارئ، مع منصة سريرية متكاملة تتيح للأطباء مراجعة الحالات.'
                      : '10 event-driven workflows monitor queue SLAs, dispatch test kits, and escalate red flags. The Clinician Review console provides licensed specialists with direct override authority and audit visibility.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={onOpenClinician}
                      className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/60 border border-[#E9E5DB] dark:border-slate-700 text-left rtl:text-right hover:border-blue-400 transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">Clinician Review Console</span>
                        <span className="text-[11px] text-slate-500">Human-In-The-Loop Decision Override</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </button>

                    <button
                      onClick={onOpenArchitecture}
                      className="p-4 rounded-2xl bg-[#FAF9F5] dark:bg-slate-800/60 border border-[#E9E5DB] dark:border-slate-700 text-left rtl:text-right hover:border-blue-400 transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs block">Architecture Blueprint</span>
                        <span className="text-[11px] text-slate-500">MongoDB Atlas & Event Bus</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              DESTINATION TERMINAL: Downward Arrow Beacon & Grand CTA Hub
              ========================================================================= */}
          <div
            id="journey-destination"
            className="relative pt-8 text-center max-w-3xl mx-auto"
          >
            {/* Terminal Shield Waypoint Icon */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30 ring-8 ring-blue-100 dark:ring-blue-950/60 animate-cardiac">
              <Shield className="w-8 h-8 text-white" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-4">
              <span>{isAr ? 'المحطة الختامية · رحلتك تبدأ الآن' : 'Final Milestone · Care on Your Terms'}</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              {isAr ? 'جاهز لحماية صحتك التناسلية باطمئنان؟' : 'Ready to Take Charge of Your Reproductive Health?'}
            </h3>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto font-medium">
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
    </section>
  );
}
