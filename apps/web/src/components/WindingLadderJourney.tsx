'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ArrowUp,
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

interface WindingLadderJourneyProps {
  locale: Locale;
  onOpenIntake: () => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
  onOpenAtHomeKit: () => void;
  onSelectGoldenCase: (caseId: string) => void;
}

export default function WindingLadderJourney({
  locale,
  onOpenIntake,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
  onOpenAtHomeKit,
  onSelectGoldenCase,
}: WindingLadderJourneyProps) {
  const isAr = locale === 'ar';

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0.08);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Red-flag selector state (Section 02)
  const [selectedFlagIndex, setSelectedFlagIndex] = useState<number>(0);

  // WHO Simulator state (Section 04)
  const [volume, setVolume] = useState<number>(2.5);
  const [concentration, setConcentration] = useState<number>(25);
  const [progressiveMotility, setProgressiveMotility] = useState<number>(38);
  const [totalMotility, setTotalMotility] = useState<number>(55);
  const [normalForms, setNormalForms] = useState<number>(6);
  const [vitality, setVitality] = useState<number>(68);

  // Consent Ledger state (Section 03)
  const [consentGranted, setConsentGranted] = useState(true);
  const [consentItems, setConsentItems] = useState({
    triage: true,
    referral: true,
    logistics: true,
    research: false,
  });

  // Track page scroll to drive the progressive ladder drawing
  useEffect(() => {
    let rafId: number;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        // Total scrollable range of the ladder section
        const totalHeight = rect.height;
        // Current scroll offset relative to ladder top
        const currentY = -rect.top + windowHeight * 0.45;
        const progress = Math.max(0.06, Math.min(1, currentY / (totalHeight - windowHeight * 0.2)));
        setScrollProgress(progress);
        setShowScrollTop(window.scrollY > 400);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // MATHEMATICAL PROCEDURAL LADDER GENERATOR (Reference Video: Smooth Winding 3D Ladder)
  // =========================================================================
  const { leftRailPath, rightRailPath, rungs, totalHeight, revealedY, guideSketchPaths } = useMemo(() => {
    const H = 5100;
    const N = 400;
    const W = 82; // Ladder width between rails

    // Centerline mathematical trajectory:
    // Straight descending top -> Bends Right (y=700) -> Bends Left (y=1450) -> Bends Right (y=2200) -> Bends Left (y=2950) -> Bends Right (y=3700) -> Bends Left (y=4450) -> Straight Center (y=5000)
    function getCenter(y: number) {
      const damp = Math.min(1, Math.max(0, (y - 250) / 350));
      const endDamp = Math.min(1, Math.max(0, (5100 - y) / 300));
      const phase = (y - 325) * (2 * Math.PI / 1500);
      const x = 500 + damp * endDamp * 140 * Math.sin(phase);
      return { x, y };
    }

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      points.push(getCenter((i / N) * H));
    }

    let leftPath = '';
    let rightPath = '';
    const computedRungs: { x1: number; y1: number; x2: number; y2: number }[] = [];

    let accDist = 0;
    const rungSpacing = 38;

    for (let i = 0; i <= N; i++) {
      const prev = points[Math.max(0, i - 1)];
      const curr = points[i];
      const next = points[Math.min(N, i + 1)];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      const nx = -ty;
      const ny = tx;

      const lx = curr.x - nx * (W / 2);
      const ly = curr.y - ny * (W / 2);
      const rx = curr.x + nx * (W / 2);
      const ry = curr.y + ny * (W / 2);

      if (i === 0) {
        leftPath = `M ${lx.toFixed(1)} ${ly.toFixed(1)}`;
        rightPath = `M ${rx.toFixed(1)} ${ry.toFixed(1)}`;
      } else {
        leftPath += ` L ${lx.toFixed(1)} ${ly.toFixed(1)}`;
        rightPath += ` L ${rx.toFixed(1)} ${ry.toFixed(1)}`;
      }

      if (i > 0) {
        accDist += Math.hypot(curr.x - prev.x, curr.y - prev.y);
        if (accDist >= rungSpacing) {
          accDist = 0;
          computedRungs.push({
            x1: Math.round(lx * 10) / 10,
            y1: Math.round(ly * 10) / 10,
            x2: Math.round(rx * 10) / 10,
            y2: Math.round(ry * 10) / 10,
          });
        }
      }
    }

    // Current revealed Y depth based on scroll progress
    const revY = Math.min(H, Math.max(380, scrollProgress * H));

    // Trailing sketch lines that extend slightly below the solid ladder (from video reference)
    const sketchY = Math.min(H, revY + 80);
    const p1 = getCenter(revY);
    const p2 = getCenter(sketchY);
    const guidePaths = [
      `M ${(p1.x - 30).toFixed(1)} ${revY.toFixed(1)} Q ${(p1.x - 20).toFixed(1)} ${(revY + 40).toFixed(1)} ${(p2.x - 25).toFixed(1)} ${sketchY.toFixed(1)}`,
      `M ${(p1.x + 30).toFixed(1)} ${revY.toFixed(1)} Q ${(p1.x + 40).toFixed(1)} ${(revY + 40).toFixed(1)} ${(p2.x + 25).toFixed(1)} ${sketchY.toFixed(1)}`,
    ];

    return {
      leftRailPath: leftPath,
      rightRailPath: rightPath,
      rungs: computedRungs,
      totalHeight: H,
      revealedY: revY,
      guideSketchPaths: guidePaths,
    };
  }, [scrollProgress]);

  // Derived WHO calculations
  const totalSperm = Math.round(volume * concentration * 10) / 10;
  const isVolumeSafe = volume >= WHO_2021_REFERENCE_LIMITS.volumeMl;
  const isConcSafe = concentration >= WHO_2021_REFERENCE_LIMITS.concentrationMillionPerMl;
  const isTotalSpermSafe = totalSperm >= WHO_2021_REFERENCE_LIMITS.totalSpermMillion;
  const isProgMotileSafe = progressiveMotility >= WHO_2021_REFERENCE_LIMITS.progressiveMotilityPct;
  const isTotalMotileSafe = totalMotility >= WHO_2021_REFERENCE_LIMITS.totalMotilityPct;
  const isMorphSafe = normalForms >= WHO_2021_REFERENCE_LIMITS.normalFormsPct;
  const isVitalSafe = vitality >= WHO_2021_REFERENCE_LIMITS.vitalityPct;

  const redFlagsList = [
    {
      id: 'GC01',
      titleEn: 'Acute Scrotal Pain (< 6h)',
      titleAr: 'ألم حاد في الصفن (< ٦ ساعات)',
      organ: 'Testicular Torsion',
      urgency: 'IMMEDIATE ED',
      sla: '< 6 Hours',
      color: 'rose',
      action: 'Emergency bilateral scrotal exploration to preserve testicular viability.',
    },
    {
      id: 'GC02',
      titleEn: 'Painless Testicular Mass',
      titleAr: 'كتلة صلبة غير مؤلمة بالخصية',
      organ: 'Testicular Malignancy',
      urgency: 'URGENT UROLOGY',
      sla: '< 48 Hours',
      color: 'amber',
      action: 'Urgent scrotal ultrasound & serum tumor markers (AFP, beta-hCG, LDH).',
    },
    {
      id: 'GC03',
      titleEn: 'Prolonged Erection (> 4h)',
      titleAr: 'انتصاب مستمر مؤلم (> ٤ ساعات)',
      organ: 'Ischaemic Priapism',
      urgency: 'EMERGENCY',
      sla: '< 4 Hours',
      color: 'rose',
      action: 'Cavernosal aspiration and phenylephrine irrigation to prevent fibrosis.',
    },
    {
      id: 'GC04',
      titleEn: 'Acute Urinary Retention',
      titleAr: 'احتباس بولي حاد',
      organ: 'Lower Urinary Tract',
      urgency: 'IMMEDIATE',
      sla: '< 2 Hours',
      color: 'rose',
      action: 'Urgent bladder decompression via urethral catheterisation.',
    },
    {
      id: 'GC05',
      titleEn: 'Fever with Urethral Discharge',
      titleAr: 'حمى مع إفرازات إحليلية',
      organ: 'Systemic Sepsis / Epididymitis',
      urgency: 'SAME DAY',
      sla: '< 12 Hours',
      color: 'amber',
      action: 'Ceftriaxone + Doxycycline antimicrobial therapy with close hemodynamic monitoring.',
    },
    {
      id: 'GC06',
      titleEn: 'Visual Field Loss & Gynaecomastia',
      titleAr: 'اضطراب المجال البصري مع تثد',
      organ: 'Pituitary Macroadenoma',
      urgency: 'URGENT ENDO',
      sla: '< 72 Hours',
      color: 'amber',
      action: 'Sella MRI and pituitary hormone panel (Prolactin, LH, FSH, Testosterone).',
    },
    {
      id: 'GC07',
      titleEn: 'Bilateral Undescended Testes',
      titleAr: 'خصية هاجرة ثنائية غير معالجة',
      organ: 'Cryptorchidism',
      urgency: 'SUBACUTE',
      sla: '< 2 Weeks',
      color: 'blue',
      action: 'Specialist orchidopexy evaluation and germ-cell tumor surveillance.',
    },
    {
      id: 'GC08',
      titleEn: 'Congenital Absent Vas Deferens',
      titleAr: 'غياب خلقي للأسهرين (CBAVD)',
      organ: 'CFTR Genetic Infertility',
      urgency: 'GENETIC & ANDRO',
      sla: '< 2 Weeks',
      color: 'blue',
      action: 'CFTR mutation sequencing, renal ultrasonography, surgical sperm retrieval (PESA).',
    },
    {
      id: 'GC09',
      titleEn: 'Metabolic Syndrome & Infertility',
      titleAr: 'متلازمة الأيض وتأخر الإنجاب',
      organ: 'Cardiometabolic Risk',
      urgency: 'SPECIALIST',
      sla: '< 2 Weeks',
      color: 'blue',
      action: 'Dual andrology-endocrinology metabolic restoration and lifestyle optimization.',
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden text-[#22201D] dark:text-[#F2EEE6] font-editorial-sans transition-colors duration-300"
    >
      {/* =========================================================================
          CONTINUOUS 3D WINDING LADDER CANVAS (SVG)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none flex justify-center z-10">
        <svg
          viewBox="0 0 1000 5100"
          className="w-full max-w-6xl h-full"
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            {/* 3D Drop Shadow for the Ladder (Reference Video Shading) */}
            <filter id="ladder-3d-shadow" x="-30%" y="-10%" width="160%" height="120%">
              <feDropShadow dx="-10" dy="16" stdDeviation="14" floodColor="#2A241C" floodOpacity="0.13" />
            </filter>

            {/* Scroll-driven progressive reveal mask */}
            <mask id="ladder-scroll-mask">
              <rect x="-600" y="0" width="2200" height={revealedY} fill="white" />
            </mask>
          </defs>

          {/* Masked Solid Ladder Structure */}
          <g mask="url(#ladder-scroll-mask)" filter="url(#ladder-3d-shadow)">
            {/* -------------------------------------------------------------
                1. 3D BASE / BEVEL EXTRUSION RAILS (Taupe/Bronze Shadow Depth)
                ------------------------------------------------------------- */}
            <path
              d={leftRailPath}
              fill="none"
              stroke="#8C8375"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-[#4A4338]"
            />
            <path
              d={rightRailPath}
              fill="none"
              stroke="#8C8375"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-[#4A4338]"
            />

            {/* -------------------------------------------------------------
                2. 3D CYLINDRICAL RUNGS (Shadow Under-layer + Highlight Top)
                ------------------------------------------------------------- */}
            {rungs.map((rung, idx) => (
              <g key={`rung-${idx}`}>
                {/* Rung Base / Shadow Line */}
                <line
                  x1={rung.x1}
                  y1={rung.y1}
                  x2={rung.x2}
                  y2={rung.y2}
                  stroke="#7A7163"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="dark:stroke-[#3E382F]"
                />
                {/* Rung Top Highlight Line */}
                <line
                  x1={rung.x1 - 1}
                  y1={rung.y1 - 1}
                  x2={rung.x2 - 1}
                  y2={rung.y2 - 1}
                  stroke="#F7F4EB"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  className="dark:stroke-[#C2BBB0]"
                />
              </g>
            ))}

            {/* -------------------------------------------------------------
                3. 3D HIGHLIGHT RAILS (Warm Sand / Champagne Top Face)
                ------------------------------------------------------------- */}
            <g transform="translate(-1.5, -1.5)">
              <path
                d={leftRailPath}
                fill="none"
                stroke="#EFEAE0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:stroke-[#B8B1A5]"
              />
              <path
                d={rightRailPath}
                fill="none"
                stroke="#EFEAE0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="dark:stroke-[#B8B1A5]"
              />
            </g>

            {/* Top Rounded End Caps of the Ladder */}
            <ellipse cx="459" cy="0" rx="3.5" ry="3.5" fill="#EFEAE0" stroke="#8C8375" strokeWidth="1" />
            <ellipse cx="541" cy="0" rx="3.5" ry="3.5" fill="#EFEAE0" stroke="#8C8375" strokeWidth="1" />

            {/* -------------------------------------------------------------
                4. SECTION CONNECTOR PINS & NODES (Direct from Reference Video)
                ------------------------------------------------------------- */}
            {/* Section 01 Connector (Left, y=700) */}
            <g opacity={revealedY >= 680 ? 1 : 0.2} className="transition-opacity duration-300">
              <line x1="390" y1="700" x2="599" y2="700" stroke="#8A8172" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="599" cy="700" r="4.5" fill="#FAF8F5" stroke="#665F52" strokeWidth="1.8" />
            </g>

            {/* Section 02 Connector (Right, y=1450) */}
            <g opacity={revealedY >= 1420 ? 1 : 0.2} className="transition-opacity duration-300">
              <line x1="401" y1="1450" x2="610" y2="1450" stroke="#8A8172" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="401" cy="1450" r="4.5" fill="#FAF8F5" stroke="#665F52" strokeWidth="1.8" />
            </g>

            {/* Section 03 Connector (Left, y=2200) */}
            <g opacity={revealedY >= 2180 ? 1 : 0.2} className="transition-opacity duration-300">
              <line x1="390" y1="2200" x2="599" y2="2200" stroke="#8A8172" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="599" cy="2200" r="4.5" fill="#FAF8F5" stroke="#665F52" strokeWidth="1.8" />
            </g>

            {/* Section 04 Connector (Right, y=2950) */}
            <g opacity={revealedY >= 2920 ? 1 : 0.2} className="transition-opacity duration-300">
              <line x1="401" y1="2950" x2="610" y2="2950" stroke="#8A8172" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="401" cy="2950" r="4.5" fill="#FAF8F5" stroke="#665F52" strokeWidth="1.8" />
            </g>

            {/* Section 05 Connector (Left, y=3700) */}
            <g opacity={revealedY >= 3680 ? 1 : 0.2} className="transition-opacity duration-300">
              <line x1="390" y1="3700" x2="599" y2="3700" stroke="#8A8172" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="599" cy="3700" r="4.5" fill="#FAF8F5" stroke="#665F52" strokeWidth="1.8" />
            </g>

            {/* Section 06 Connector (Right, y=4450) */}
            <g opacity={revealedY >= 4420 ? 1 : 0.2} className="transition-opacity duration-300">
              <line x1="401" y1="4450" x2="610" y2="4450" stroke="#8A8172" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="401" cy="4450" r="4.5" fill="#FAF8F5" stroke="#665F52" strokeWidth="1.8" />
            </g>

            {/* Base Milestone Hub (y=5000) */}
            <g opacity={revealedY >= 4950 ? 1 : 0.2} className="transition-opacity duration-300">
              <circle cx="500" cy="5000" r="14" fill="#FAF8F5" stroke="#7A7163" strokeWidth="2.5" />
              <circle cx="500" cy="5000" r="5" fill="#2E281F" />
            </g>
          </g>

          {/* Trailing Pencil / Draft Sketch Lines Below Current Revealed Tip (Video Feature) */}
          {guideSketchPaths.map((d, i) => (
            <path
              key={`sketch-${i}`}
              d={d}
              fill="none"
              stroke="#A8A092"
              strokeWidth="1.2"
              strokeDasharray="2 3"
              opacity="0.4"
            />
          ))}
        </svg>
      </div>

      {/* =========================================================================
          EDITORIAL CONTENT SECTIONS ALONG THE LADDER (Alternating Left & Right)
          ========================================================================= */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-20">
        
        {/* =====================================================================
            SECTION 01 (LEFT): Anonymous-First Male Reproductive Intake
            Curve Peak 1: Ladder bends Right (y=700) -> Content on the LEFT
            ===================================================================== */}
        <section
          id="section-intake"
          className="relative min-h-[750px] flex items-center mb-32 pt-8"
        >
          <div className="w-full lg:w-1/2 lg:pr-14">
            <div className="relative">
              {/* Giant Pale Serif Watermark Number (Reference Video) */}
              <div className="absolute -top-16 -left-6 font-editorial-serif text-[180px] lg:text-[240px] italic font-light text-[#7C7365]/[0.06] dark:text-[#E8E4DA]/[0.05] select-none pointer-events-none leading-none">
                01
              </div>

              {/* Editorial Category Label */}
              <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
                <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">01</span>
                <span>/</span>
                <span>{isAr ? 'بروتوكول الاستقبال الرقمي' : 'Intake Protocol'}</span>
              </div>

              {/* Editorial Serif Heading */}
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.15] mb-5">
                {isAr ? (
                  <>استقبال سريري <span className="italic font-light">مجهول الهوية بالكامل</span> بدون إنشاء حساب</>
                ) : (
                  <>Anonymous-First <span className="italic font-light">Clinical Intake</span> With Zero Sign-In</>
                )}
              </h2>

              {/* Editorial Description */}
              <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg">
                {isAr
                  ? 'نموذج استقبال طبي آمن ومحمي خوارزمياً. لا نطلب أسماء أو هواتف أو بريد إلكتروني. يتم إنشاء رمز تعريفي سريري مشفر (Pseudonym ID) داخل المتصفح، محمي بسلسلة كتل غير قابلة للتتبع.'
                  : 'A clinically governed, high-precision male reproductive screening pathway. No sign-ups, no phone numbers, and no third-party email collection. Your session generates an ephemeral cryptographic pseudonym entirely in browser memory.'}
              </p>

              {/* Interactive In-Session Pseudonym Pill */}
              <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-lg bg-[#EFECE3]/70 dark:bg-[#1E1C18] border border-[#DDD7C8] dark:border-stone-800 text-xs mb-7 shadow-xs">
                <KeyRound className="w-4 h-4 text-[#7A7163] dark:text-[#A89F90]" />
                <span className="font-mono font-medium text-[#403B33] dark:text-[#DDD6C8]">
                  psn_984f82a17b0c
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#DDD7C8]/70 dark:bg-stone-800 text-[#544E43] dark:text-[#A89F90]">
                  {isAr ? 'مشفر محلياً' : 'In-Memory Only'}
                </span>
              </div>

              {/* Editorial Action & Image Grid */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenIntake}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-sm bg-[#2E2922] dark:bg-[#EFEAE0] text-[#F7F4EB] dark:text-[#22201D] text-xs font-semibold tracking-[0.18em] uppercase hover:bg-[#453E34] dark:hover:bg-white transition-all shadow-sm"
                >
                  <span>{isAr ? 'ابدأ الفحص المجهول الآن' : 'Start Anonymous Intake'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectGoldenCase('GC01')}
                  className="text-xs font-medium text-[#6B6355] dark:text-[#A8A092] hover:text-[#22201D] dark:hover:text-white underline underline-offset-4 tracking-wide transition-colors"
                >
                  {isAr ? 'تجربة حالة طوارئ سريرية (GC01)' : 'Simulate Torsion Case (GC01)'}
                </button>
              </div>

              {/* Small Editorial Image Frame (From Video Reference) */}
              <div className="mt-8 relative max-w-sm rounded-lg overflow-hidden border border-[#DDD7C8] dark:border-stone-800 shadow-md">
                <img
                  src="/images/clinical-consult.jpg"
                  alt="Clinical Consultation"
                  className="w-full h-36 object-cover filter contrast-[1.05] brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#22201D]/70 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[10px] uppercase tracking-widest text-[#F7F4EB] font-medium">
                    {isAr ? 'استشارة سريرية متخصصة ومحمية' : 'Confidential Andrology Evaluation'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 02 (RIGHT): Deterministic Safety Floor & 9 Red-Flag Gates
            Curve Trough 1: Ladder bends Left (y=1450) -> Content on the RIGHT
            ===================================================================== */}
        <section
          id="section-safety"
          className="relative min-h-[850px] flex items-center justify-end mb-32 pt-8"
        >
          <div className="w-full lg:w-1/2 lg:pl-14">
            <div className="relative">
              {/* Giant Pale Serif Watermark Number */}
              <div className="absolute -top-16 -left-6 font-editorial-serif text-[180px] lg:text-[240px] italic font-light text-[#7C7365]/[0.06] dark:text-[#E8E4DA]/[0.05] select-none pointer-events-none leading-none">
                02
              </div>

              {/* Editorial Category Label */}
              <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
                <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">02</span>
                <span>/</span>
                <span>{isAr ? 'الحوكمة السريرية الصارمة' : 'Deterministic Safety'}</span>
              </div>

              {/* Editorial Serif Heading */}
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.15] mb-5">
                {isAr ? (
                  <>قواعد السلامة الحتمية <span className="italic font-light">ومبدأ التصعيد الإجباري</span></>
                ) : (
                  <>Deterministic Safety Floor <span className="italic font-light">& Escalate-Only Invariant</span></>
                )}
              </h2>

              <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg">
                {isAr
                  ? 'لا يسمح الذكاء الاصطناعي بتخفيض حدة الأعراض الخطرة إطلاقاً. تسعة بوابات طبية حتمية تكتشف علامات الخطر (التواء الخصية، الكتلة غير المؤلمة، القساح، الاحتباس البولي) وتقفل المسار نحو الطوارئ فوراً.'
                  : 'AI inference can never downgrade severe or borderline presentations. Nine deterministic safety gates enforce zero false reassurance: testicular torsion, painless scrotal lumps, priapism, and sepsis lock the platform into immediate escalation.'}
              </p>

              {/* Interactive 9 Red-Flag Symptoms Navigator */}
              <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800 mb-6 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-[#544E43] dark:text-[#B8B1A3]">
                  <span>{isAr ? 'اختر بوابة سريرية للاختبار:' : 'Inspect Clinical Red Flag Gate:'}</span>
                  <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase">
                    Escalate-Only Active
                  </span>
                </div>

                {/* Flag Selector Chips */}
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {redFlagsList.slice(0, 6).map((flag, idx) => (
                    <button
                      key={flag.id}
                      onClick={() => setSelectedFlagIndex(idx)}
                      className={`px-2 py-1.5 rounded text-[11px] font-medium text-left truncate transition-all ${
                        selectedFlagIndex === idx
                          ? 'bg-[#2E2922] text-[#F7F4EB] dark:bg-[#EFEAE0] dark:text-[#22201D]'
                          : 'bg-[#EFECE3]/70 dark:bg-stone-800 text-[#544E43] dark:text-[#C5BEB2] hover:bg-[#E3DEC3]'
                      }`}
                    >
                      {flag.id}: {flag.organ}
                    </button>
                  ))}
                </div>

                {/* Selected Flag Diagnostic Card */}
                <div className="p-3.5 rounded-lg bg-white/80 dark:bg-[#22201D]/80 border border-[#DDD7C8]/70 dark:border-stone-800">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-serif font-bold text-sm text-[#22201D] dark:text-[#F2EEE6]">
                      {isAr ? redFlagsList[selectedFlagIndex].titleAr : redFlagsList[selectedFlagIndex].titleEn}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                      SLA: {redFlagsList[selectedFlagIndex].sla}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A544A] dark:text-[#B8B1A3] leading-relaxed">
                    {redFlagsList[selectedFlagIndex].action}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onSelectGoldenCase('GC16')}
                  className="px-4 py-2 rounded-sm bg-[#EFECE3] dark:bg-stone-800 text-[#2E2922] dark:text-[#F7F4EB] text-xs font-semibold tracking-wider uppercase hover:bg-[#DDD7C8] transition-colors"
                >
                  {isAr ? 'اختبار حالة سالبة (GC16 Near-Miss)' : 'Test Near-Miss (GC16 Safe Ache)'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 03 (LEFT): Cryptographic Consent Ledger & Revocation
            Curve Peak 2: Ladder bends Right (y=2200) -> Content on the LEFT
            ===================================================================== */}
        <section
          id="section-consent"
          className="relative min-h-[750px] flex items-center mb-32 pt-8"
        >
          <div className="w-full lg:w-1/2 lg:pr-14">
            <div className="relative">
              {/* Giant Pale Serif Watermark Number */}
              <div className="absolute -top-16 -left-6 font-editorial-serif text-[180px] lg:text-[240px] italic font-light text-[#7C7365]/[0.06] dark:text-[#E8E4DA]/[0.05] select-none pointer-events-none leading-none">
                03
              </div>

              {/* Editorial Category Label */}
              <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
                <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">03</span>
                <span>/</span>
                <span>{isAr ? 'سجل الموافقة التشفيري' : 'Consent Ledger'}</span>
              </div>

              {/* Editorial Serif Heading */}
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.15] mb-5">
                {isAr ? (
                  <>سجل الموافقة السيادي <span className="italic font-light">وزر الإلغاء الفوري</span></>
                ) : (
                  <>Cryptographic Consent Ledger <span className="italic font-light">& Instant Revocation</span></>
                )}
              </h2>

              <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg">
                {isAr
                  ? 'المريض يمتلك سيادة بياناته الطبية بشكل تام. كل تفويض سريري يتم توثيقه بتجزئة SHA-256 فريدة. نقرة واحدة على زر الإلغاء تبطل الرمز فورياً عبر سير عمل التراجع w07 وتلغي أي إحالة قائمة.'
                  : 'Every permission is explicitly ledger-backed with immutable SHA-256 hashes. Patients retain sovereign ownership over their data. A single click cascades through workflow w07 to immediately nullify active tokens and abort downstream referrals.'}
              </p>

              {/* Interactive Granular Consent Toggles */}
              <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800 mb-6 shadow-xs max-w-lg">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DDD7C8]/70 dark:border-stone-800">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#4A443A] dark:text-[#DDD6C8]">
                    {isAr ? 'حالة السجل الحي:' : 'Live Ledger Status:'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {consentGranted ? 'Active / Granted' : 'Revoked'}
                  </span>
                </div>

                <div className="space-y-2.5 mb-4 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#544E43] dark:text-[#B8B1A3]">
                      {isAr ? 'معالجة الفحص والفرز السريري' : 'Triage & Assessment Processing'}
                    </span>
                    <input
                      type="checkbox"
                      checked={consentItems.triage}
                      onChange={(e) => setConsentItems({ ...consentItems, triage: e.target.checked })}
                      className="rounded accent-[#2E2922]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#544E43] dark:text-[#B8B1A3]">
                      {isAr ? 'إرسال الإحالة الطبية إلى المستشفى' : 'Hospital Referral Dispatch'}
                    </span>
                    <input
                      type="checkbox"
                      checked={consentItems.referral}
                      onChange={(e) => setConsentItems({ ...consentItems, referral: e.target.checked })}
                      className="rounded accent-[#2E2922]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#544E43] dark:text-[#B8B1A3]">
                      {isAr ? 'توصيل عينة الفحص المنزلي المبرد' : 'Cold-Chain At-Home Kit Delivery'}
                    </span>
                    <input
                      type="checkbox"
                      checked={consentItems.logistics}
                      onChange={(e) => setConsentItems({ ...consentItems, logistics: e.target.checked })}
                      className="rounded accent-[#2E2922]"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#DDD7C8]/70 dark:border-stone-800 font-mono text-[10px] text-[#7A7163] dark:text-[#9E9587]">
                  <span className="truncate">hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                  <button
                    type="button"
                    onClick={() => setConsentGranted(!consentGranted)}
                    className="shrink-0 font-sans font-bold text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400 hover:underline"
                  >
                    {consentGranted ? '1-Click Revoke' : 'Reinstate'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={onOpenConsent}
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-sm bg-[#2E2922] dark:bg-[#EFEAE0] text-[#F7F4EB] dark:text-[#22201D] text-xs font-semibold tracking-[0.18em] uppercase hover:bg-[#453E34] dark:hover:bg-white transition-all shadow-sm"
              >
                <span>{isAr ? 'فتح مركز إدارة الموافقة' : 'Manage Consent Ledger'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 04 (RIGHT): WHO 2021 Semen Analysis Interactive Simulator
            Curve Trough 2: Ladder bends Left (y=2950) -> Content on the RIGHT
            ===================================================================== */}
        <section
          id="section-who"
          className="relative min-h-[920px] flex items-center justify-end mb-32 pt-8"
        >
          <div className="w-full lg:w-1/2 lg:pl-14">
            <div className="relative">
              {/* Giant Pale Serif Watermark Number */}
              <div className="absolute -top-16 -left-6 font-editorial-serif text-[180px] lg:text-[240px] italic font-light text-[#7C7365]/[0.06] dark:text-[#E8E4DA]/[0.05] select-none pointer-events-none leading-none">
                04
              </div>

              {/* Editorial Category Label */}
              <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
                <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">04</span>
                <span>/</span>
                <span>{isAr ? 'معايير منظمة الصحة العالمية' : 'WHO 2021 Reference'}</span>
              </div>

              {/* Editorial Serif Heading */}
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.15] mb-5">
                {isAr ? (
                  <>محاكي تحليل السائل المنوي <span className="italic font-light">حسب معايير WHO 2021</span></>
                ) : (
                  <>WHO 2021 6th Edition <span className="italic font-light">Semen Analysis Simulator</span></>
                )}
              </h2>

              <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg">
                {isAr
                  ? 'محرك تحليلي ديناميكي يعتمد على الحد الأدنى المرجعي المئوي الخامس (5th Centile) من الدليل المخبري لمنظمة الصحة العالمية. اختبر تأثير الحجم، التركيز، وحركة الحيوانات المنوية بشكل تفاعلي فوري.'
                  : 'An interactive clinical calculator benchmarked against the 5th centile lower reference limits of the WHO 6th Edition Manual. Dynamically adjust volume, sperm concentration, motility, and vitality to preview diagnostic categorization.'}
              </p>

              {/* Interactive WHO 2021 Diagnostic Simulator Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800 mb-6 shadow-xs">
                {/* Preset Fast-Toggles */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#DDD7C8]/70 dark:border-stone-800">
                  <span className="text-[11px] font-bold text-[#544E43] dark:text-[#B8B1A3] mr-1">Presets:</span>
                  <button
                    onClick={() => { setVolume(3.0); setConcentration(28); setProgressiveMotility(42); setTotalMotility(60); setNormalForms(8); setVitality(72); }}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100"
                  >
                    Normozoospermia (LC04)
                  </button>
                  <button
                    onClick={() => { setVolume(1.8); setConcentration(11); setProgressiveMotility(26); setTotalMotility(38); setNormalForms(3); setVitality(50); }}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100"
                  >
                    Oligozoospermia (LC03)
                  </button>
                  <button
                    onClick={() => { setVolume(1.2); setConcentration(0); setProgressiveMotility(0); setTotalMotility(0); setNormalForms(0); setVitality(0); }}
                    className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100"
                  >
                    Azoospermia (LC01)
                  </button>
                </div>

                {/* 6 Diagnostic Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4 text-xs">
                  {/* Slider 1: Volume */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#544E43] dark:text-[#B8B1A3]">Volume (mL):</span>
                      <span className={`font-mono font-bold ${isVolumeSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {volume.toFixed(1)} mL (min 1.4)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="6.0"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full accent-[#2E2922]"
                    />
                  </div>

                  {/* Slider 2: Concentration */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#544E43] dark:text-[#B8B1A3]">Concentration (M/mL):</span>
                      <span className={`font-mono font-bold ${isConcSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {concentration} M/mL (min 16)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="120"
                      step="1"
                      value={concentration}
                      onChange={(e) => setConcentration(parseInt(e.target.value, 10))}
                      className="w-full accent-[#2E2922]"
                    />
                  </div>

                  {/* Slider 3: Progressive Motility */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#544E43] dark:text-[#B8B1A3]">Prog. Motility (%):</span>
                      <span className={`font-mono font-bold ${isProgMotileSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {progressiveMotility}% (min 30%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="1"
                      value={progressiveMotility}
                      onChange={(e) => setProgressiveMotility(parseInt(e.target.value, 10))}
                      className="w-full accent-[#2E2922]"
                    />
                  </div>

                  {/* Slider 4: Normal Morphology */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#544E43] dark:text-[#B8B1A3]">Normal Forms (%):</span>
                      <span className={`font-mono font-bold ${isMorphSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {normalForms}% (min 4%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="1"
                      value={normalForms}
                      onChange={(e) => setNormalForms(parseInt(e.target.value, 10))}
                      className="w-full accent-[#2E2922]"
                    />
                  </div>
                </div>

                {/* Computed Total Sperm Result Bar */}
                <div className="p-3 rounded-lg bg-white/90 dark:bg-[#22201D]/90 border border-[#DDD7C8]/70 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-[#7A7163]" />
                    <span className="text-xs font-semibold text-[#403B33] dark:text-[#DDD6C8]">
                      Total Sperm Count (Vol × Conc):
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-sm ${isTotalSpermSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {totalSperm} Million
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${isTotalSpermSafe ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                      {isTotalSpermSafe ? 'WHO ≥ 39M' : 'Below Ref'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Small Microscopy Image Frame */}
              <div className="relative max-w-sm rounded-lg overflow-hidden border border-[#DDD7C8] dark:border-stone-800 shadow-md">
                <img
                  src="/images/semen-microscopy.jpg"
                  alt="WHO Semen Microscopy"
                  className="w-full h-32 object-cover filter contrast-[1.1] brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#22201D]/75 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] uppercase tracking-widest text-[#F7F4EB] font-medium">
                    {isAr ? 'فحص مجهري عالي الدقة للحيوانات المنوية' : 'Phase-Contrast Spermatozoa Motility Analysis'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 05 (LEFT): Accredited Abu Dhabi Care Network & Cold-Chain
            Curve Peak 3: Ladder bends Right (y=3700) -> Content on the LEFT
            ===================================================================== */}
        <section
          id="section-care"
          className="relative min-h-[780px] flex items-center mb-32 pt-8"
        >
          <div className="w-full lg:w-1/2 lg:pr-14">
            <div className="relative">
              {/* Giant Pale Serif Watermark Number */}
              <div className="absolute -top-16 -left-6 font-editorial-serif text-[180px] lg:text-[240px] italic font-light text-[#7C7365]/[0.06] dark:text-[#E8E4DA]/[0.05] select-none pointer-events-none leading-none">
                05
              </div>

              {/* Editorial Category Label */}
              <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
                <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">05</span>
                <span>/</span>
                <span>{isAr ? 'شبكة الرعاية المعتمدة' : 'Care Network'}</span>
              </div>

              {/* Editorial Serif Heading */}
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.15] mb-5">
                {isAr ? (
                  <>شبكة الرعاية المعتمدة بأبوظبي <span className="italic font-light">والفحص المنزلي المبرد</span></>
                ) : (
                  <>Accredited Abu Dhabi Delivery <span className="italic font-light">& Cold-Chain Diagnostics</span></>
                )}
              </h2>

              <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg">
                {isAr
                  ? 'ربط مباشر وسلس مع أرقى المستشفيات والمراكز المتخصصة في إمارة أبوظبي (كليفلاند كلينك، مدينة شخبوط الطبية، برجيل، هيلث بلس)، مع خيار إرسال طرد فحص منزلي مبرد بدرجة حرارة مراقبة.'
                  : 'Direct routing to accredited Abu Dhabi tertiary centers (Cleveland Clinic Abu Dhabi, Sheikh Shakhbout Medical City, Burjeel Medical City, HealthPlus Fertility) paired with temperature-controlled at-home specimen collection.'}
              </p>

              {/* Accredited Medical Facilities Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-6 max-w-lg">
                <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800">
                  <div className="font-serif font-bold text-xs text-[#22201D] dark:text-[#F2EEE6] mb-0.5">
                    Cleveland Clinic Abu Dhabi
                  </div>
                  <div className="text-[10px] text-[#7A7163] dark:text-[#9E9587]">Al Maryah Island · Andrology & Urology</div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800">
                  <div className="font-serif font-bold text-xs text-[#22201D] dark:text-[#F2EEE6] mb-0.5">
                    Sheikh Shakhbout Medical City
                  </div>
                  <div className="text-[10px] text-[#7A7163] dark:text-[#9E9587]">Al Mafraq · Tertiary Male Fertility</div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800">
                  <div className="font-serif font-bold text-xs text-[#22201D] dark:text-[#F2EEE6] mb-0.5">
                    HealthPlus Fertility Center
                  </div>
                  <div className="text-[10px] text-[#7A7163] dark:text-[#9E9587]">Al Bateen · Advanced Andrology Lab</div>
                </div>
                <div className="p-3 rounded-lg bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800">
                  <div className="font-serif font-bold text-xs text-[#22201D] dark:text-[#F2EEE6] mb-0.5">
                    Burjeel Medical City
                  </div>
                  <div className="text-[10px] text-[#7A7163] dark:text-[#9E9587]">Mohamed Bin Zayed City · Endocrine Care</div>
                </div>
              </div>

              {/* At-Home Kit Modal Trigger */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenAtHomeKit}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-sm bg-[#2E2922] dark:bg-[#EFEAE0] text-[#F7F4EB] dark:text-[#22201D] text-xs font-semibold tracking-[0.18em] uppercase hover:bg-[#453E34] dark:hover:bg-white transition-all shadow-sm"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طلب طرد الفحص المنزلي' : 'Order Cold-Chain At-Home Kit'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Kit Photo Frame */}
              <div className="mt-7 relative max-w-sm rounded-lg overflow-hidden border border-[#DDD7C8] dark:border-stone-800 shadow-md">
                <img
                  src="/images/athome-kit.jpg"
                  alt="At Home Diagnostic Kit"
                  className="w-full h-32 object-cover filter contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#22201D]/75 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] uppercase tracking-widest text-[#F7F4EB] font-medium">
                    {isAr ? 'طرد معقم ومراقب حرارياً ISO 15189' : 'ISO-Compliant Cold-Chain Specimen Kit'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 06 (RIGHT): Autonomous Event Runtime & Clinician Console
            Curve Trough 3: Ladder bends Left (y=4450) -> Content on the RIGHT
            ===================================================================== */}
        <section
          id="section-telemetry"
          className="relative min-h-[820px] flex items-center justify-end mb-32 pt-8"
        >
          <div className="w-full lg:w-1/2 lg:pl-14">
            <div className="relative">
              {/* Giant Pale Serif Watermark Number */}
              <div className="absolute -top-16 -left-6 font-editorial-serif text-[180px] lg:text-[240px] italic font-light text-[#7C7365]/[0.06] dark:text-[#E8E4DA]/[0.05] select-none pointer-events-none leading-none">
                06
              </div>

              {/* Editorial Category Label */}
              <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
                <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">06</span>
                <span>/</span>
                <span>{isAr ? 'الأتمتة والرقابة الطبية' : 'Autonomous Telemetry'}</span>
              </div>

              {/* Editorial Serif Heading */}
              <h2 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.15] mb-5">
                {isAr ? (
                  <>أتمتة سير العمل السريري <span className="italic font-light">وبوابة مراجعة الطبيب الاستشاري</span></>
                ) : (
                  <>Autonomous Event Runtime <span className="italic font-light">& Clinician Review Console</span></>
                )}
              </h2>

              <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-[15px] leading-relaxed mb-6 max-w-lg">
                {isAr
                  ? 'عشرة تدفقات عمل نشطة على منصة n8n تعالج الأحداث غير المتزامنة وتراقب اتفاقيات مستوى الخدمة (SLA). الحالات المعقدة أو الحدودية تتطلب توقيعاً إلزامياً من استشاري مسالك وأندورلوجيا مرخص.'
                  : 'Ten production event workflows coordinate async intake processing, escalation sweeps, and consent cascades. Complex or borderline assessments require mandatory human-in-the-loop review by licensed andrologists before clinical dispatch.'}
              </p>

              {/* Live Workflows Badge Grid */}
              <div className="p-4 rounded-xl bg-[#FAF8F3] dark:bg-[#1A1916] border border-[#DDD7C8] dark:border-stone-800 mb-6 shadow-xs max-w-lg">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DDD7C8]/70 dark:border-stone-800 text-xs font-bold text-[#4A443A] dark:text-[#DDD6C8]">
                  <span>10 Active n8n Workflows:</span>
                  <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                    All Systems Operational
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="flex items-center gap-1.5 text-[#544E43] dark:text-[#B8B1A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>w01 Intake Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#544E43] dark:text-[#B8B1A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>w02 Red-Flag SLA</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#544E43] dark:text-[#B8B1A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>w03 Referral Dispatch</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#544E43] dark:text-[#B8B1A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>w04 Kit Logistics</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#544E43] dark:text-[#B8B1A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>w07 Consent Revocation</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#544E43] dark:text-[#B8B1A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>w09 Clinician Review</span>
                  </div>
                </div>
              </div>

              {/* Action Trigger for Clinician Review Modal */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenClinician}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-sm bg-[#2E2922] dark:bg-[#EFEAE0] text-[#F7F4EB] dark:text-[#22201D] text-xs font-semibold tracking-[0.18em] uppercase hover:bg-[#453E34] dark:hover:bg-white transition-all shadow-sm"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح بوابة مراجعة الأطباء' : 'Launch Clinician Review Portal'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Andrology Lab Photo Frame */}
              <div className="mt-7 relative max-w-sm rounded-lg overflow-hidden border border-[#DDD7C8] dark:border-stone-800 shadow-md">
                <img
                  src="/images/andrology-lab.jpg"
                  alt="Andrology Lab"
                  className="w-full h-32 object-cover filter contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#22201D]/75 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[10px] uppercase tracking-widest text-[#F7F4EB] font-medium">
                    {isAr ? 'مختبر أندورلوجيا معتمد تحت إشراف سريري' : 'Licensed Andrology & Endocrine Laboratory'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 07 (CENTER DESTINATION): Protocol Specification & Grand Launch
            Ladder finishes centered at y=5000 -> Grand Editorial Anchor Hub
            ===================================================================== */}
        <section
          id="section-architecture"
          className="relative pt-16 pb-28 text-center flex flex-col items-center justify-center"
        >
          {/* Subtle Circular Radial Glow behind Beacon */}
          <div className="w-20 h-20 rounded-full bg-[#EFEAE0] dark:bg-stone-800 border-2 border-[#8C8375] shadow-lg flex items-center justify-center mb-6">
            <Shield className="w-9 h-9 text-[#2E2922] dark:text-[#F7F4EB]" />
          </div>

          <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold tracking-[0.24em] uppercase text-[#736B5E] dark:text-[#B0A99C]">
            <span className="font-editorial-serif italic text-sm text-[#4A443A] dark:text-[#E0DACF]">07</span>
            <span>/</span>
            <span>{isAr ? 'المواصفة السريرية والتشغيلية' : 'Protocol Specification'}</span>
          </div>

          <h2 className="font-editorial-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#22201D] dark:text-[#F2EEE6] leading-[1.12] mb-5 max-w-2xl">
            {isAr ? (
              <>ابدأ تقييمك السريري <span className="italic font-light">بسرية وأمان تام</span></>
            ) : (
              <>Begin Your Confidential <span className="italic font-light">Male Health Evaluation</span></>
            )}
          </h2>

          <p className="text-[#5A544A] dark:text-[#B8B1A3] text-sm lg:text-base leading-relaxed mb-8 max-w-xl">
            {isAr
              ? 'بوابة سريرية رائدة تجمع بين الخصوصية الرقمية التامة والحوكمة الطبية الصارمة وفق معايير منظمة الصحة العالمية وهيئة الصحة بأبوظبي.'
              : 'A clinical gateway bridging digital anonymity with deterministic medical safety, governed under WHO 2021 protocols and Abu Dhabi healthcare standards.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenIntake}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-sm bg-[#2E2922] dark:bg-[#EFEAE0] text-[#F7F4EB] dark:text-[#22201D] text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#453E34] dark:hover:bg-white transition-all shadow-md"
            >
              <span>{isAr ? 'ابدأ الفحص المجهول الفوري' : 'Start Anonymous Assessment'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onOpenArchitecture}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-sm bg-[#EFECE3] dark:bg-stone-800 text-[#2E2922] dark:text-[#F7F4EB] text-xs font-bold tracking-[0.18em] uppercase hover:bg-[#DDD7C8] transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'مخطط البنية التحتية والبيانات' : 'Inspect Architecture'}</span>
            </button>
          </div>

          {/* Emergency 999 Advisory */}
          <div className="mt-12 text-[11px] text-[#7A7163] dark:text-[#9E9587] max-w-md border-t border-[#DDD7C8]/70 dark:border-stone-800 pt-4">
            {isAr
              ? 'تنبيه طبي: في حال الشعور بألم حاد ومفاجئ في الخصية، يرجى التوجه فوراً لأقرب قسم طوارئ أو الاتصال بالرقم 999.'
              : 'Emergency Notice: Sudden severe testicular pain is a medical emergency. Seek immediate emergency care or dial 999.'}
          </div>
        </section>
      </div>

      {/* =========================================================================
          FLOATING MINIMAL SCROLL-TO-TOP BUTTON (Identical to Reference Video)
          ========================================================================= */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-8 right-8 z-40 w-11 h-11 rounded-full bg-[#3E382F]/85 dark:bg-[#EFEAE0]/85 text-[#F7F4EB] dark:text-[#22201D] shadow-lg backdrop-blur-md flex items-center justify-center hover:bg-[#22201D] dark:hover:bg-white hover:scale-105 transition-all"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
