'use client';

import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Award,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  Activity,
  Microscope,
  Pill,
  Video,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import VigorLogo from '@/components/VigorLogo';
import {
  DoctorAccount,
  loginDoctorWithFirebase,
  registerDoctorWithFirebase,
} from '@/lib/firebase';

interface DoctorLoginPageProps {
  locale?: 'en' | 'ar';
  setLocale?: (l: 'en' | 'ar') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLoginSuccess: (doctor: DoctorAccount) => void;
}

export default function DoctorLoginPage({
  locale = 'en',
  setLocale,
  theme = 'light',
  onToggleTheme,
  onLoginSuccess,
}: DoctorLoginPageProps) {
  const isAr = locale === 'ar';
  const isDark = theme === 'dark';

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('DOH-AUH-2024-9102');
  const [specialtyInput, setSpecialtyInput] = useState('Consultant Andrologist & Male Infertility Microsurgeon');
  const [facilityInput, setFacilityInput] = useState('Cleveland Clinic Abu Dhabi · Andrology Hub');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال عنوان البريد الإلكتروني' : 'Please provide your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const res = await loginDoctorWithFirebase(emailInput.trim(), passwordInput || 'demo123456');
    setLoading(false);
    if (res.ok && res.doctor) {
      onLoginSuccess(res.doctor);
    } else {
      setErrorMsg(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials. Please verify your details.'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !fullNameInput.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال الاسم والبريد الإلكتروني' : 'Please provide doctor name and email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const formattedName = fullNameInput.trim().startsWith('Dr.') ? fullNameInput.trim() : `Dr. ${fullNameInput.trim()}`;

    const res = await registerDoctorWithFirebase({
      email: emailInput.trim(),
      password: passwordInput || 'demo123456',
      fullName: formattedName,
      licenseNumber: licenseInput.trim() || 'DOH-AUH-2024-9182',
      specialty: specialtyInput.trim() || 'Consultant Physician',
      facility: facilityInput.trim() || 'Cleveland Clinic Abu Dhabi',
    });

    setLoading(false);
    if (res.ok && res.doctor) {
      onLoginSuccess(res.doctor);
    } else {
      setErrorMsg(res.error || (isAr ? 'فشل إنشاء حساب الطبيب' : 'Failed to register doctor profile.'));
    }
  };

  // =========================================================================
  // AUTOMATIC 3D WINDING LADDER GEOMETRY & CLINICAL THEORY MILESTONES
  // (Slow, continuous, automatic infinite scrolling animation on the right side)
  // =========================================================================
  const H_TOTAL = 3600;
  const CYCLE_H = 1800;
  const N_POINTS = 360;

  const { leftRailPath, rightRailPath, rungs, milestones } = useMemo(() => {
    function getCenter(y: number) {
      const phase = y * ((2 * Math.PI) / 600);
      return { x: 350 + 26 * Math.sin(phase), y };
    }

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= N_POINTS; i++) {
      points.push(getCenter((i / N_POINTS) * H_TOTAL));
    }

    let leftPath = '';
    let rightPath = '';
    const computedRungs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    let accDist = 0;
    const rungSpacing = 32;

    for (let i = 0; i <= N_POINTS; i++) {
      const prev = points[Math.max(0, i - 1)];
      const curr = points[i];
      const next = points[Math.min(N_POINTS, i + 1)];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      const nx = -ty;
      const ny = tx;

      const lx = curr.x - nx * 24;
      const ly = curr.y - ny * 24;
      const rx = curr.x + nx * 24;
      const ry = curr.y + ny * 24;

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

    const baseMilestoneYs = [150, 450, 750, 1050, 1350, 1650];
    const allMilestoneYs = [...baseMilestoneYs, ...baseMilestoneYs.map((y) => y + CYCLE_H)];

    const computedMilestones = allMilestoneYs.map((my, idx) => {
      const isLeft = idx % 2 === 0;
      const centerPt = getCenter(my);
      const ladderRailX = isLeft ? centerPt.x - 24 : centerPt.x + 24;
      const cardEdgeX = isLeft ? 285 : 415;
      return {
        y: my,
        centerPt,
        isLeft,
        ladderRailX,
        cardEdgeX,
        theoryIndex: idx % 6,
      };
    });

    return {
      leftRailPath: leftPath,
      rightRailPath: rightPath,
      rungs: computedRungs,
      milestones: computedMilestones,
    };
  }, []);

  const CLINICAL_THEORY_CARDS = [
    {
      step: 1,
      tag: 'WHO 2021 LRL',
      badgeColor: 'emerald',
      title: isAr ? 'معايير السائل المنوي (منظمة الصحة 2021)' : 'Deterministic Semen Analysis Floor',
      summary: isAr
        ? 'تقييم خوارزمي فوري مقابل الحدود المرجعية الدنيا لمنظمة الصحة العالمية (الحجم: 1.4 مل، الحركة التقدمية: 30%، الحيوية: 54%). يلغي التباين الفردي.'
        : 'Automated 6th Edition lower reference limits: Volume ≥1.4ml, Progressive Motility ≥30%, Vitality ≥54%. Eliminates subjective inter-operator variance.',
      metric: 'Vol ≥1.4ml · Prog ≥30% · Vitality ≥54%',
      facility: 'Fertility Diagnostics Laboratory',
    },
    {
      step: 2,
      tag: 'TRIAGE PROTOCOL',
      badgeColor: 'blue',
      title: isAr ? 'بوابة الفرز السريري الخوارزمي' : 'Autonomous Clinical Triage Gateway',
      summary: isAr
        ? 'خوارزميات الفرز الحتمي تصنف خطورة الحالة إلى جراحة المسالك، أو مراكز الإخصاب، أو الرعاية الأولية خلال أقل من 180 مللي ثانية.'
        : 'Deterministic multi-tier triage categorizes patient acuity into Andrology/Urology, Reproductive Medicine, or Urgent surgical pathways in under 180ms.',
      metric: 'Decision SLA: <180ms · 5 Active Tiers',
      facility: 'Cleveland Clinic Abu Dhabi',
    },
    {
      step: 3,
      tag: 'ADHICS & MALAFFI',
      badgeColor: 'amber',
      title: isAr ? 'الهوية المشفرة وحماية البيانات' : 'Cryptographic Sovereign EHR',
      summary: isAr
        ? 'إخفاء هوية المريض عبر خوارزمية HMAC-SHA256 ومعرفات مشفرة (psn_...) متوافقة تماماً مع القانون الاتحادي الإماراتي رقم 2 لسنة 2019.'
        : 'Sovereign pseudonymity (psn_...) derived via HMAC-SHA256 from ephemeral 32-byte seeds. Aligned with UAE Federal Health Data Law No. 2 of 2019.',
      metric: 'Zero Plaintext PII · ADHICS v2.0',
      facility: 'Malaffi HIE Interoperability',
    },
    {
      step: 4,
      tag: 'LIVE WEBRTC',
      badgeColor: 'purple',
      title: isAr ? 'استشارات مرئية مشفرة من المتصفح' : 'Encrypted P2P Telehealth Rooms',
      summary: isAr
        ? 'غرف اتصال مرئي WebRTC مباشرة بين الطبيب والمريض بمجرد اعتماد الموعد، محملة ببيانات المريض والمؤشرات الحيوية السريرية.'
        : 'Direct browser-to-browser WebRTC video consultation rooms loaded instantly upon clinician review with pre-loaded triage telemetry.',
      metric: 'P2P 1080p WebRTC · Zero-Download',
      facility: 'DoH Telehealth Governed',
    },
    {
      step: 5,
      tag: 'RED-FLAG ESCAPEMENTS',
      badgeColor: 'rose',
      title: isAr ? 'كشف العلامات الحمراء والحالات الطارئة' : 'Autonomous Red-Flag Escalation',
      summary: isAr
        ? 'محددات الأمان الحتمية تلتقط آلام الصفن الحادة (قاعدة التواء الخصية 4 ساعات SLA)، والكتل غير المؤلمة، وعيوب المجال البصري.'
        : 'Deterministic safety floor catches acute scrotal pain (4h SLA torsion rule), painless testicular masses, and visual field deficits with immediate overrides.',
      metric: '107/107 Golden Cases Verified',
      facility: 'DoH Emergency Clinical SLA',
    },
    {
      step: 6,
      tag: 'DIGITAL RX',
      badgeColor: 'emerald',
      title: isAr ? 'الوصفة الطبية وخطة العلاج الرقمية' : 'Unified Care Plan & Digital Prescriptions',
      summary: isAr
        ? 'لوحة وصفات طبية إلكترونية معتمدة مدعمة ببروتوكولات مضادات الأكسدة (L-Carnitine)، وطلبات الموجات فوق الصوتية، وإعادة فحص CASA.'
        : 'FHIR-aligned e-prescriptions with micronutrient protocols (L-Carnitine, CoQ10), repeat CASA testing, and scrotal Doppler ultrasound orders.',
      metric: 'Instant Patient Email & Malaffi Rx',
      facility: 'Cleveland Clinic Outpatient Pharmacy',
    },
  ];

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#FAF8F5] dark:bg-[#12110F] text-[#1A1816] dark:text-[#FAF7F2] font-editorial-sans antialiased selection:bg-[#1A1816] selection:text-white dark:selection:bg-white dark:selection:text-[#141311] flex flex-col justify-between transition-colors duration-300"
    >
      {/* 1. TOP HEADER */}
      <header className="w-full bg-[#FAF8F5]/90 dark:bg-[#12110F]/90 backdrop-blur-md border-b border-[#E8E2D5] dark:border-stone-800 z-40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none" aria-label="Vigor AI Home">
            <div className="w-8 h-8 rounded-xl bg-[#1A1816] dark:bg-white flex items-center justify-center text-white dark:text-[#181614] shadow-xs">
              <VigorLogo className="w-4 h-4 text-current" size={18} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="font-editorial-serif text-base tracking-[0.2em] font-medium text-[#1A1816] dark:text-[#FAF7F2] uppercase">
                  Vigor
                </span>
                <span className="text-[9px] tracking-[0.24em] font-black text-[#8A8172] dark:text-[#C5BEB2] uppercase">
                  AI
                </span>
              </div>
            </div>
          </Link>

          {/* DoH Abu Dhabi Clinical Gateway Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'بوابة الكادر الطبي المعتمد · دائرة الصحة أبوظبي' : 'Authorized Clinician Portal · DoH Abu Dhabi'}</span>
          </div>

          {/* Switchers */}
          <div className="flex items-center gap-2">
            {setLocale && (
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-all"
              >
                <Globe className="w-3 h-3 text-stone-500" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-all"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN SPLIT STAGE: LOGIN FORM & AUTOMATIC LIVE SCROLLING LADDER SHOWCASE */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ========================================================
              LEFT COLUMN (5 cols): CLINICIAN IDENTITY & LOGIN FORM
              ======================================================== */}
          <div className="lg:col-span-5 flex justify-center order-1">
            <div className="w-full max-w-md bg-white/95 dark:bg-[#181614]/95 border border-[#DDD7C8] dark:border-stone-800 rounded-3xl shadow-xl backdrop-blur-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Header Icon & Title */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold font-editorial-serif text-[#1A1816] dark:text-[#FAF7F2]">
                  {isAr ? 'تسجيل دخول الكادر الطبي' : 'Clinician Identity Gateway'}
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {isAr
                    ? 'يرجى تسجيل الدخول إلى ملفك الطبي للوصول إلى قائمة المواعيد المباشرة، وسجلات المرضى، والاستشارات السريرية.'
                    : 'Sign in to access your assigned consultation queue, natural-language patient history ladder, and electronic prescribing.'}
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex p-1 rounded-2xl bg-[#EFECE3]/80 dark:bg-stone-900 border border-[#DDD7C8] dark:border-stone-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-center transition-all ${
                    authMode === 'login'
                      ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'تسجيل الدخول' : 'Clinician Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-center transition-all ${
                    authMode === 'register'
                      ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'تسجيل طبيب جديد' : 'New Practitioner Registration'}
                </button>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* FORM: Sign In or Register */}
              <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4 text-xs">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        {isAr ? 'اسم الطبيب الكامل *' : 'Doctor Full Name *'}
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                        <input
                          type="text"
                          required
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="e.g. Dr. Talha Habib"
                          className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                          {isAr ? 'رقم ترخيص دائرة الصحة *' : 'DoH License Number *'}
                        </label>
                        <div className="relative">
                          <Award className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                          <input
                            type="text"
                            required
                            value={licenseInput}
                            onChange={(e) => setLicenseInput(e.target.value)}
                            placeholder="DOH-AUH-2024-9102"
                            className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                          {isAr ? 'التخصص الطبي *' : 'Medical Specialty *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={specialtyInput}
                          onChange={(e) => setSpecialtyInput(e.target.value)}
                          placeholder="Consultant Andrologist & Urologist"
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                        {isAr ? 'المنشأة الصحية / المستشفى *' : 'Healthcare Facility / Hospital *'}
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                        <input
                          type="text"
                          required
                          value={facilityInput}
                          onChange={(e) => setFacilityInput(e.target.value)}
                          placeholder="Cleveland Clinic Abu Dhabi · Andrology Hub"
                          className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isAr ? 'البريد الإلكتروني المهني *' : 'Professional Email Address *'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="doctor@hospital.ae"
                      className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isAr ? 'كلمة المرور *' : 'Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-[#1A1816] hover:bg-[#312C26] dark:bg-white dark:hover:bg-stone-100 text-white dark:text-[#181614] font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>{isAr ? 'جاري التحقق...' : 'Authenticating Clinician...'}</span>
                  ) : (
                    <>
                      <span>{authMode === 'login' ? (isAr ? 'دخول المنصة' : 'Sign In to Doctor Portal') : (isAr ? 'تسجيل والدخول' : 'Register & Access Portal')}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN (7 cols): LIVE SLOWLY LADDER SCROLLING
              ANIMATION WITH CLINICAL THEORY SHOWCASE
              ======================================================== */}
          <div className="lg:col-span-7 order-2 flex flex-col">
            <div className="h-[680px] rounded-3xl bg-[#0F0E0C] border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col">
              
              {/* Showcase Top Telemetry Header */}
              <div className="px-5 py-3.5 border-b border-stone-800 bg-[#161512]/95 backdrop-blur-md flex items-center justify-between z-30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-200 font-editorial-sans">
                    {isAr ? 'مسار الرعاية السريرية المستمر · سلم حي ومتحرك' : 'Live Autonomous Clinical Continuum'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    60.0 FPS · Live Cycle
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">
                    Hover to pause
                  </span>
                </div>
              </div>

              {/* Viewport with Top & Bottom Gradients and Live Infinite Slow Scroll Ladder */}
              <div className="relative flex-1 overflow-hidden select-none">
                {/* Top Soft Vignette */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#0F0E0C] to-transparent z-20 pointer-events-none" />
                {/* Bottom Soft Vignette */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0F0E0C] to-transparent z-20 pointer-events-none" />

                {/* Infinite Slow Scrolling Track */}
                <div className="absolute inset-x-0 top-0 w-full animate-ladder-slow">
                  <div className="relative w-full h-[3600px]">
                    
                    {/* SVG 3D Winding Ladder Canvas */}
                    <svg
                      viewBox="0 0 700 3600"
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <filter id="login-ladder-shadow" x="-30%" y="-10%" width="160%" height="120%">
                          <feDropShadow dx="-3" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
                        </filter>
                      </defs>

                      {/* Double Rails with Depth */}
                      <g filter="url(#login-ladder-shadow)">
                        <path
                          d={leftRailPath}
                          fill="none"
                          stroke="#5A5245"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        <path
                          d={rightRailPath}
                          fill="none"
                          stroke="#5A5245"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />

                        {/* Cylindrical Rungs */}
                        {rungs.map((rung, idx) => (
                          <g key={`rung-${idx}`}>
                            <line
                              x1={rung.x1}
                              y1={rung.y1}
                              x2={rung.x2}
                              y2={rung.y2}
                              stroke="#443D33"
                              strokeWidth="4"
                              strokeLinecap="round"
                            />
                            <line
                              x1={rung.x1 - 1}
                              y1={rung.y1 - 1}
                              x2={rung.x2 - 1}
                              y2={rung.y2 - 1}
                              stroke="#8C8375"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </g>
                        ))}

                        {/* Milestones Connectors & Glowing Anchors */}
                        {milestones.map((ms, idx) => (
                          <g key={`ms-${idx}`}>
                            <line
                              x1={ms.isLeft ? ms.cardEdgeX : ms.ladderRailX}
                              y1={ms.y}
                              x2={ms.isLeft ? ms.ladderRailX : ms.cardEdgeX}
                              y2={ms.y}
                              stroke="#10B981"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              opacity="0.85"
                            />
                            {/* Pin on ladder */}
                            <circle
                              cx={ms.centerPt.x}
                              cy={ms.y}
                              r={8}
                              fill="#10B981"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                            />
                            <circle
                              cx={ms.centerPt.x}
                              cy={ms.y}
                              r={14}
                              fill="none"
                              stroke="#10B981"
                              strokeWidth="1.5"
                              opacity="0.5"
                              className="animate-ping"
                            />
                            {/* Terminal anchor dot at card border */}
                            <circle
                              cx={ms.cardEdgeX}
                              cy={ms.y}
                              r={4}
                              fill="#10B981"
                            />
                          </g>
                        ))}
                      </g>
                    </svg>

                    {/* Overlay HTML Clinical Theory Cards Positioned along the Winding Ladder */}
                    {milestones.map((ms, idx) => {
                      const card = CLINICAL_THEORY_CARDS[ms.theoryIndex];
                      return (
                        <div
                          key={`card-${idx}`}
                          style={{
                            top: `${ms.y - 75}px`,
                            left: ms.isLeft ? '16px' : 'auto',
                            right: ms.isLeft ? 'auto' : '16px',
                          }}
                          className="absolute z-20 w-[250px] sm:w-[275px] bg-[#181614]/95 border border-stone-800 hover:border-emerald-500/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-md transition-all group"
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                card.badgeColor === 'emerald'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : card.badgeColor === 'blue'
                                  ? 'bg-blue-950 text-sky-300 border border-blue-800'
                                  : card.badgeColor === 'amber'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : card.badgeColor === 'purple'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {card.tag}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              Step 0{card.step}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-white leading-tight font-editorial-serif mb-1 group-hover:text-emerald-400 transition-colors">
                            {card.title}
                          </h4>

                          <p className="text-[11px] text-stone-300 leading-snug mb-2 bg-[#0F0E0C]/70 p-2 rounded-xl border border-stone-800/80">
                            {card.summary}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/70">
                            <span className="font-mono text-emerald-400 truncate max-w-[170px]">
                              {card.metric}
                            </span>
                            <span className="truncate max-w-[80px]">
                              {card.facility.split('·')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Showcase Bottom Footer Bar */}
              <div className="px-5 py-3 border-t border-stone-800 bg-[#161512]/95 backdrop-blur-md flex items-center justify-between text-[11px] text-stone-400 z-30 shrink-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isAr ? '107 حالات سريرية قياسية مؤكدة' : '107 Deterministic Golden Cases Verified'}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500">
                  <span>ADHICS v2.0</span>
                  <span>·</span>
                  <span>Malaffi HIE Aligned</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full py-4 px-6 border-t border-[#E8E2D5] dark:border-stone-800 text-center text-xs text-stone-400">
        <p className="text-[11px]">
          {isAr
            ? 'نظام معلومات الرعاية الصحية المعتمد من دائرة الصحة أبوظبي · متوافق مع معايير ADHICS v2.0 ومنصة ملفي'
            : 'Department of Health (DoH) Abu Dhabi Governed · ADHICS v2.0 Cyber Security & Malaffi HIE Aligned'}
        </p>
      </footer>

      {/* Continuous Automatic Smooth Ladder Scroll Keyframe Animation */}
      <style>{`
        @keyframes doctorLadderScroll {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-${CYCLE_H}px);
          }
        }
        .animate-ladder-slow {
          animation: doctorLadderScroll 36s linear infinite;
          will-change: transform;
        }
        .animate-ladder-slow:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
