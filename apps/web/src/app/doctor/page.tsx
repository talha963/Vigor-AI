'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  Video,
  UserCheck,
  Calendar,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Activity,
  FileText,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  LogOut,
  Building2,
  Award,
  Phone,
  Mail,
  RefreshCw,
  ExternalLink,
  Send,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Pill,
  Microscope,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Volume2,
  Printer,
  Download,
  Eye,
  Zap,
  User,
  Sliders,
  X,
  FileCheck,
  AlertTriangle,
  Flame,
  Radio,
  TrendingUp,
  BarChart3,
  Bell,
  Globe,
  SlidersHorizontal,
  Workflow,
  Compass,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import VigorLogo from '@/components/VigorLogo';
import {
  DoctorAccount,
  getCurrentDoctor,
  loginDoctorWithFirebase,
  registerDoctorWithFirebase,
  logoutDoctor,
  updateDoctorStatus,
  isLiveFirebaseConfigured,
} from '@/lib/firebase';

interface PatientBooking {
  bookingId: string;
  pseudonymId: string;
  assessmentId?: string;
  facility: {
    facilityId: string;
    name: string;
    department?: string;
    doctor?: string;
    location?: string;
  };
  consultType: 'TELEHEALTH_VIDEO' | 'IN_PERSON';
  slotTime: string;
  status: 'CONFIRMED' | 'IN_WAITING_ROOM' | 'IN_CALL' | 'COMPLETED';
  triageTier: 'URGENT' | 'ANDROLOGY_UROLOGY' | 'FERTILITY_SERVICES' | 'PRIMARY_CARE' | 'SELF_CARE';
  telehealthRoomUrl?: string;
  contact?: { email?: string; phone?: string };
  whoParameters?: {
    concentration?: string;
    progressiveMotility?: string;
    normalForms?: string;
    volume?: string;
    vitality?: string;
  };
  redFlags?: { code: string; severity: string; slaMinutes?: number }[];
  chiefComplaint?: string;
  clinicalNotes?: string;
  prescription?: string;
  labOrders?: string[];
  diagnosticPlan?: string;
  createdAt: string;
  sparkline?: number[];
}

export default function DoctorPortalPage() {
  const [currentDoctor, setCurrentDoctor] = useState<DoctorAccount | null>(null);
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const isAr = locale === 'ar';

  // Theme synchronization (Master Theme Architecture)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('vigor-theme');
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (storedTheme === 'dark' || (!storedTheme && isSystemDark)) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      // fallback
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vigor-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vigor-theme', 'light');
    }
  };

  // Navigation / Sidebar View State
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'workflows' | 'runtime' | 'consent' | 'escapements'
  >('runtime');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<'1b' | '6M' | '1M' | 'All'>('6M');

  // Auth State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('DOH-AUH-2018-0924');
  const [specialtyInput, setSpecialtyInput] = useState('Consultant Andrologist & Male Infertility');
  const [facilityInput, setFacilityInput] = useState('HealthPlus Fertility & Andrology Center · Al Bateen');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Bookings / Patients Queue
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);

  // Clinician Review & Triage Modal State
  const [selectedReviewPatient, setSelectedReviewPatient] = useState<PatientBooking | null>(null);
  const [overrideTier, setOverrideTier] = useState<string>('ANDROLOGY_UROLOGY');
  const [justificationNotes, setJustificationNotes] = useState('');
  const [prescriptionText, setPrescriptionText] = useState(
    '1. Bilateral Scrotal Doppler Ultrasound (Varicocele screening at Cleveland Clinic Abu Dhabi).\n2. Endocrine Serum Profile: Total Testosterone, FSH, LH, and Prolactin.\n3. Repeat CASA Semen Analysis in 4 weeks.\n4. Antioxidant protocol: L-Carnitine 2000mg + CoQ10 200mg daily.'
  );
  const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([
    'Bilateral Scrotal Doppler Ultrasound',
    'Serum Endocrine Profile (FSH/LH/Testosterone)',
    'Repeat CASA Semen Analysis',
  ]);
  const [savingDecision, setSavingDecision] = useState(false);
  const [decisionSuccess, setDecisionSuccess] = useState(false);

  // Load existing session or auto-login Dr. Tariq for seamless demo
  useEffect(() => {
    const doc = getCurrentDoctor();
    if (doc) {
      setCurrentDoctor(doc);
    } else {
      handleDemoLogin();
    }
  }, []);

  // Fetch live bookings
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/booking');
      const data = await res.json();
      if (res.ok && data.bookings) {
        const augmented = data.bookings.map((b: any, i: number) => ({
          ...b,
          sparkline: b.sparkline || [12, 14, 18, 16, 22, 26, 24, 28, 32],
        }));
        setBookings(augmented);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (currentDoctor) {
      fetchBookings();
    }
  }, [currentDoctor]);

  const handleDemoLogin = async () => {
    setAuthLoading(true);
    const res = await loginDoctorWithFirebase('tariq.hashimi@healthplus.ae', 'demo123456');
    setAuthLoading(false);
    if (res.ok && res.doctor) {
      setCurrentDoctor(res.doctor);
    }
  };

  const handleLogout = async () => {
    await logoutDoctor();
    setCurrentDoctor(null);
    setAuthModalOpen(true);
  };

  // Launch Clinician Review Portal Modal
  const openReviewModal = (patient: PatientBooking) => {
    setSelectedReviewPatient(patient);
    setOverrideTier(patient.triageTier);
    setJustificationNotes(patient.clinicalNotes || '');
    setPrescriptionText(
      patient.prescription ||
        '1. Bilateral Scrotal Doppler Ultrasound (Varicocele screening at Cleveland Clinic Abu Dhabi).\n2. Endocrine Serum Profile: Total Testosterone, FSH, LH, and Prolactin.\n3. Repeat CASA Semen Analysis in 4 weeks.\n4. Antioxidant protocol: L-Carnitine 2000mg + CoQ10 200mg daily.'
    );
    setSelectedLabOrders(
      patient.labOrders || [
        'Bilateral Scrotal Doppler Ultrasound',
        'Serum Endocrine Profile (FSH/LH/Testosterone)',
        'Repeat CASA Semen Analysis',
      ]
    );
    setDecisionSuccess(false);
  };

  // Save Clinician Human-In-The-Loop Decision
  const handleSaveDecision = async () => {
    if (!selectedReviewPatient) return;
    setSavingDecision(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedReviewPatient.bookingId,
          status: 'COMPLETED',
          clinicalNotes: justificationNotes,
          prescription: prescriptionText,
          labOrders: selectedLabOrders,
        }),
      });

      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === selectedReviewPatient.bookingId
              ? {
                  ...b,
                  status: 'COMPLETED',
                  triageTier: overrideTier as any,
                  clinicalNotes: justificationNotes,
                  prescription: prescriptionText,
                  labOrders: selectedLabOrders,
                }
              : b
          )
        );
        setDecisionSuccess(true);
        setTimeout(() => {
          setSelectedReviewPatient(null);
          setDecisionSuccess(false);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDecision(false);
    }
  };

  const copyPatientLink = (bId: string) => {
    const url = `${window.location.origin}/telehealth/${bId}`;
    navigator.clipboard.writeText(url);
    setCopiedBookingId(bId);
    setTimeout(() => setCopiedBookingId(null), 2500);
  };

  // Filter Bookings for the central console
  const displayedPatients = bookings.filter((b) => {
    if (activeSidebarTab === 'escapements') {
      return b.triageTier === 'URGENT' || (b.redFlags && b.redFlags.length > 0);
    }
    const matchesSearch =
      searchQuery.trim() === '' ||
      b.pseudonymId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.chiefComplaint && b.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = filterTier === 'ALL' || b.triageTier === filterTier;
    return matchesSearch && matchesTier;
  });

  const urgentPatients = bookings.filter(
    (b) => b.triageTier === 'URGENT' || (b.redFlags && b.redFlags.length > 0)
  );

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F9F8F6] dark:bg-[#141311] text-[#1A1816] dark:text-[#FAF7F2] font-editorial-sans antialiased selection:bg-[#1A1816] selection:text-white dark:selection:bg-white dark:selection:text-[#141311] transition-colors duration-300 relative overflow-x-hidden"
    >
      {/* Decorative Warm Arcs & Ambient Radial Gradients (Harmonized Master Theme) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
        <svg
          className="absolute -top-40 -right-40 w-[1000px] h-[1000px] opacity-[0.04] dark:opacity-[0.06] text-[#22201D] dark:text-[#FAF7F2]"
          viewBox="0 0 1000 1000"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="500" cy="500" r="450" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="500" cy="500" r="320" strokeWidth="1.5" />
          <circle cx="500" cy="500" r="180" strokeWidth="1" />
        </svg>
        <div className="absolute top-1/4 -left-48 w-[700px] h-[700px] rounded-full bg-[#EFE8DC]/50 dark:bg-amber-950/10 blur-3xl" />
        <div className="absolute top-2/3 -right-48 w-[600px] h-[600px] rounded-full bg-[#E5DFCF]/40 dark:bg-stone-900/20 blur-3xl" />
      </div>

      {/* ========================================================
          1. TOP NAVIGATION BAR (Signature Floating Architectural Island Pill)
          ======================================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 pt-2 sm:pt-3 px-3 sm:px-6">
        <div className="max-w-[1520px] mx-auto rounded-2xl sm:rounded-full bg-[#FAF8F5]/92 dark:bg-[#161513]/94 backdrop-blur-xl border border-[#DDD7C8] dark:border-stone-800 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)] px-4 sm:px-6 transition-all duration-300">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-3 flex-nowrap">
            {/* Left: VIGOR AI Brand Emblem & Doctor Portal Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group focus:outline-none" aria-label="Vigor AI Home">
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-gradient-to-br from-[#2E2922] via-[#24201A] to-[#181614] dark:from-[#FAF8F5] dark:to-[#E5E0D5] flex items-center justify-center text-[#FAF8F5] dark:text-[#181614] shadow-xs transition-transform duration-300 group-hover:scale-105 border border-[#524A3D]/40 dark:border-stone-300">
                  <VigorLogo className="w-4 sm:w-5 h-4 sm:h-5 text-current" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-editorial-serif text-lg tracking-[0.2em] font-medium text-[#1A1816] dark:text-[#FAF7F2] uppercase">
                      Vigor
                    </span>
                    <span className="text-[10px] tracking-[0.24em] font-black text-[#8A8172] dark:text-[#C5BEB2] uppercase">
                      AI
                    </span>
                  </div>
                </div>
              </Link>

              {/* Doctor Portal Pill Indicator */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-800/80 text-[10px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase shadow-2xs">
                <Stethoscope className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'بوابة الأطباء' : 'Doctor Portal'}</span>
              </div>
            </div>

            {/* Center: Editorial Navigation Links */}
            <nav className="hidden lg:flex shrink-0 items-center justify-center gap-1 xl:gap-2 font-editorial-sans text-[11px] font-semibold tracking-[0.16em] uppercase text-[#6B6355] dark:text-[#A8A092] whitespace-nowrap">
              <Link
                href="/"
                className="shrink-0 px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1A1816] dark:hover:text-white transition-all"
              >
                {isAr ? 'الرئيسية' : 'Home'}
              </Link>
              <Link
                href="/#section-intake"
                className="shrink-0 px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1A1816] dark:hover:text-white transition-all"
              >
                {isAr ? 'الاستقبال' : 'Intake'}
              </Link>
              <Link
                href="/#section-safety"
                className="shrink-0 px-3 py-1.5 rounded-full hover:bg-[#EFECE3]/80 dark:hover:bg-stone-800/70 hover:text-[#1A1816] dark:hover:text-white transition-all"
              >
                {isAr ? 'المعايير السريرية' : 'Clinical Standards'}
              </Link>
              <Link
                href="/doctor"
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#1A1816] dark:bg-[#FAF7F2] text-white dark:text-[#181614] font-bold tracking-wider text-[10px] shadow-2xs"
              >
                {isAr ? 'منصة الطبيب' : 'Doctor Portal'}
              </Link>
            </nav>

            {/* Right: Search, TELEHEALTH LIVE Pill, Switches & Doctor Profile */}
            <div className="shrink-0 flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
              {/* Compact Search input */}
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-stone-900/70 border border-[#DDD7C8] dark:border-stone-700 text-xs text-[#6B6355] dark:text-stone-300 shadow-2xs w-44">
                <Search className="w-3.5 h-3.5 text-[#9E9587]" />
                <input
                  type="text"
                  placeholder={isAr ? 'بحث...' : 'Search queue...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-xs text-[#1A1816] dark:text-white placeholder-[#9E9587]"
                />
              </div>

              {/* TELEHEALTH LIVE Pill Button (Requested Design Specification) */}
              <Link
                href={`/telehealth/bk_auh_7821?role=doctor`}
                target="_blank"
                className="shrink-0 group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-[10px] font-bold tracking-[0.18em] uppercase transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="w-2 h-2 rounded-full bg-[#00A884] animate-pulse" />
                <span>TELEHEALTH LIVE</span>
              </Link>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-[10px] font-bold uppercase tracking-wider text-[#5A544A] dark:text-[#DDD7C8] hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800 transition-all shadow-2xs"
                title="Toggle Language"
              >
                <Globe className="w-3 h-3 text-[#7A7163] dark:text-stone-400" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>

              {/* Theme Switcher Button */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="shrink-0 p-1.5 sm:p-2 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-[#5A544A] dark:text-[#DDD7C8] hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800 transition-all shadow-2xs"
                aria-label="Toggle Dark Mode"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-stone-600" />
                )}
              </button>

              {/* Notifications Bell */}
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarTab('escapements');
                  if (urgentPatients[0]) openReviewModal(urgentPatients[0]);
                }}
                className="shrink-0 relative p-2 rounded-full bg-white/70 dark:bg-stone-900/70 border border-[#DDD7C8] dark:border-stone-700 text-[#6B6355] dark:text-[#DDD7C8] shadow-2xs cursor-pointer hover:border-stone-400 transition-colors"
                title="2 Urgent Escapements Active"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B71C1C] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  2
                </span>
              </button>

              {/* Clinician Profile Avatar & Name */}
              <div
                onClick={() => setAuthModalOpen(true)}
                className="shrink-0 flex items-center gap-2 pl-1 border-l border-[#DDD7C8] dark:border-stone-700 cursor-pointer group"
                title="Manage Clinician Credentials"
              >
                <div className="w-8 h-8 rounded-full bg-[#2A2724] dark:bg-stone-800 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-stone-300 dark:border-stone-600 group-hover:scale-105 transition-transform">
                  👨‍⚕️
                </div>
                <div className="hidden xl:flex flex-col text-left rtl:text-right">
                  <span className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] leading-tight">
                    {currentDoctor?.fullName || 'Dr. Tariq Al-Hashimi'}
                  </span>
                  <span className="text-[9px] text-[#8A8172] dark:text-stone-400">Consultant Andrologist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. CRITICAL EMERGENCY WARNING BANNER (Red Background, White Text)
          ======================================================== */}
      {urgentPatients.length > 0 && (
        <div className="max-w-[1520px] mx-auto mt-20 sm:mt-24 px-3 sm:px-6 mb-6">
          <div className="bg-[#B71C1C] dark:bg-[#991B1B] text-white py-3.5 px-6 rounded-2xl sm:rounded-3xl shadow-lg border border-red-700/50 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left rtl:md:text-right transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-wide block sm:inline">
                  Clinical Emergency Warning: 2 Patients require immediate review.
                </span>
                <span className="hidden lg:inline text-xs text-rose-200 ml-2">
                  (Acute Scrotal Pain Gate GC01 · Solitary Lump Gate GC02 · SLA Window: 42m active)
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveSidebarTab('escapements');
                  if (urgentPatients[0]) openReviewModal(urgentPatients[0]);
                }}
                className="px-5 py-2 rounded-full bg-white text-[#B71C1C] hover:bg-rose-50 text-[11px] font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>Review Immediate Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Layout */}
      <div className={`max-w-[1520px] mx-auto px-3 sm:px-6 ${urgentPatients.length > 0 ? 'mt-2' : 'mt-20 sm:mt-24'} pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start`}>
        {/* ========================================================
            3. LEFT SIDEBAR: CURVED SEGMENTED TIMELINE GRAPHIC
            (Subtle curved, segmented timeline graphic connecting menu items)
            ======================================================== */}
        <aside className="lg:col-span-3 bg-white/80 dark:bg-[#1C1A17]/85 backdrop-blur-md rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] relative overflow-hidden">
          {/* Header Title */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F0ECE1] dark:border-stone-800">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8172] dark:text-[#A8A092]">
              Clinical Navigation
            </span>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-bold">
              60.0 fps
            </span>
          </div>

          {/* Timeline Graphic Area with S-Curve SVG and Aligned Circular Nodes */}
          <div className="relative pl-7 space-y-6">
            {/* The Subtle Curved Connecting Timeline Graphic */}
            <svg
              className="absolute left-1 top-2.5 bottom-2.5 w-6 h-[calc(100%-20px)] pointer-events-none text-stone-300 dark:text-stone-700"
              preserveAspectRatio="none"
              viewBox="0 0 24 240"
              fill="none"
            >
              <path
                d="M 12,12 C 22,45 22,75 12,95 C 2,115 2,145 12,165 C 22,185 22,215 12,230"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Menu Item 1: Active Workflows */}
            <div
              onClick={() => setActiveSidebarTab('workflows')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'workflows'
                  ? 'bg-stone-100/90 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'workflows'
                    ? 'bg-[#1A1816] dark:bg-white border-white dark:border-[#1A1816] ring-2 ring-stone-400 dark:ring-stone-600 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-[#1A1816] dark:group-hover:bg-white'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  Active Workflows
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[#6B6355] dark:text-[#DDD7C8] font-bold border border-stone-200 dark:border-stone-700">
                  10 n8n
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Autonomous screening, red-flag triage, and lab dispatch loops.
              </p>
            </div>

            {/* Menu Item 2: Runtime Review (Default / Clinician Console) */}
            <div
              onClick={() => setActiveSidebarTab('runtime')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'runtime'
                  ? 'bg-stone-100/90 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'runtime'
                    ? 'bg-emerald-600 border-white dark:border-[#1C1A17] ring-4 ring-emerald-500/25 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-emerald-600'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  Runtime Review
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  237 Pending
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Human-in-the-loop review for borderline WHO 2021 motility cases.
              </p>
            </div>

            {/* Menu Item 3: Consent Ledger */}
            <div
              onClick={() => setActiveSidebarTab('consent')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'consent'
                  ? 'bg-stone-100/90 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'consent'
                    ? 'bg-[#1A1816] dark:bg-white border-white dark:border-[#1A1816] ring-2 ring-stone-400 dark:ring-stone-600 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-[#1A1816] dark:group-hover:bg-white'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  Consent Ledger
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[#6B6355] dark:text-[#DDD7C8] font-bold border border-stone-200 dark:border-stone-700">
                  511 SHA-256
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Zero-PII cryptographically signed Abu Dhabi DoH sharing receipts.
              </p>
            </div>

            {/* Menu Item 4: Patient Escapements */}
            <div
              onClick={() => setActiveSidebarTab('escapements')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'escapements'
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border border-red-300 dark:border-red-900 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'escapements'
                    ? 'bg-[#B71C1C] border-white ring-4 ring-red-400/30 scale-110 animate-pulse'
                    : 'bg-[#B71C1C] border-white'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B71C1C] dark:text-rose-400">
                  Patient Escapements
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-[#B71C1C] dark:text-rose-300 font-bold">
                  2 SLA Active
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Urgent deterministic red flags requiring physician override.
              </p>
            </div>
          </div>

          {/* Clinician On-Call Status Card */}
          <div className="mt-8 p-4 rounded-2xl bg-[#F9F8F6] dark:bg-stone-900/60 border border-[#EBE7DF] dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#6B6355] dark:text-stone-400">Physician Duty Status</span>
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#8A8172] dark:text-stone-400 leading-relaxed">
              Dr. Tariq Al-Hashimi · License: DOH-AUH-2018-0924 (Malaffi Provider #PRV-882190)
            </p>
          </div>
        </aside>

        {/* ========================================================
            4. MAIN DASHBOARD AREA (Clinician Review Console)
            ======================================================== */}
        <main className="lg:col-span-9 space-y-8">
          {/* Hero Banner: Runtime & Clinician Review Console */}
          <div className="bg-white/80 dark:bg-[#1C1A17]/85 backdrop-blur-md rounded-3xl p-8 lg:p-10 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] relative overflow-hidden text-center space-y-4">
            {/* Subtle decorative curved background pattern in hero */}
            <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20">
              <svg className="w-full h-full" viewBox="0 0 800 240" fill="none">
                <path
                  d="M 50 200 C 250 80, 550 80, 750 200"
                  stroke="currentColor"
                  className="text-stone-300 dark:text-stone-700"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </svg>
            </div>

            <div className="relative z-10 space-y-3.5 max-w-2xl mx-auto">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-[#C8E6C9] dark:border-emerald-800 text-[10px] font-black uppercase tracking-[0.2em] text-[#1B5E20] dark:text-emerald-300 shadow-2xs">
                Autonomous WHO 2021 Semen Analysis & Deterministic Triage Gateway
              </span>

              {/* High-contrast Serif Headline matching reference aesthetic */}
              <h1 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#1A1816] dark:text-[#FAF7F2] leading-[1.14]">
                Runtime & Clinician Review Console
              </h1>

              <p className="text-xs sm:text-sm text-[#6B6355] dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
                Review asynchronous WHO 2021 computer-assisted semen analysis (CASA) parameters,
                override algorithmic risk bands with clinical justification, and issue official DoH
                Malaffi e-prescriptions.
              </p>

              {/* Prominent Dark Pill Button with Ripple Effect (Fully Rounded Pill) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (displayedPatients[0]) openReviewModal(displayedPatients[0]);
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Launch Clinician Review Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              ANALYTICS & PARAMETER CARDS BAR
              ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Sperm Rating */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                Total Sperm Metrics
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  99%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  +1.33%
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Quality index across 511 CASA verified samples.
              </p>
            </div>

            {/* Metric 2: Average Progressive Motility */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                Prog Motility Average
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  60%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  Normal (≥32%)
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Mean forward progressive motility score.
              </p>
            </div>

            {/* Metric 3: Total Sperm Count Throughput */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                Total Sperm Count
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  24.5 M/ml
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  Normal
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                WHO 2021 reference floor: 15 M/ml.
              </p>
            </div>

            {/* Metric 4: Immediate Escapement Alerts */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B71C1C] dark:text-rose-400 block">
                Clinical Escapements
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#B71C1C] dark:text-rose-400">
                  2 Cases
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 border border-red-300 dark:border-red-800 text-[#B71C1C] dark:text-rose-300 font-bold">
                  Action SLA
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Deterministic red-flag safety triggers.
              </p>
            </div>
          </div>

          {/* ========================================================
              CENTRAL GRID OF PATIENT CARDS AWAITING ASYNC REVIEW
              (With WHO 2021 Semen Analysis Simulator Metrics & Sparklines)
              ======================================================== */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EBE7DF] dark:border-stone-800">
              <div className="flex items-center gap-3">
                <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  Awaiting Async Clinician Review ({displayedPatients.length} Cases)
                </h3>
              </div>

              {/* Timeframe selector matching video (1b, 6M, 1M, All) */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white dark:bg-stone-900 border border-[#E5E0D5] dark:border-stone-700 text-xs font-bold shadow-2xs">
                {(['1b', '6M', '1M', 'All'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 rounded-full text-[11px] transition-all ${
                      timeframe === t
                        ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-2xs font-bold'
                        : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {displayedPatients.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1C1A17] rounded-3xl border border-[#EBE7DF] dark:border-stone-800 text-xs text-[#8A8172] dark:text-stone-400 shadow-2xs">
                No patients found in this queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedPatients.map((patient) => {
                  const isUrgent =
                    patient.triageTier === 'URGENT' ||
                    (patient.redFlags && patient.redFlags.length > 0);

                  return (
                    <div
                      key={patient.bookingId}
                      className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-lg transition-all space-y-5 flex flex-col justify-between"
                    >
                      {/* Top Patient Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] dark:bg-stone-800 flex items-center justify-center text-xl font-bold shadow-2xs border border-[#EAE5D9] dark:border-stone-700">
                            {isUrgent ? '🚨' : '🧑'}
                          </div>
                          <div>
                            <h4 className="font-editorial-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2] leading-tight">
                              Patient #{patient.pseudonymId.slice(-7)}
                            </h4>
                            <p className="text-[11px] text-[#8A8172] dark:text-stone-400 font-mono">
                              Ref: {patient.bookingId} · {patient.facility.name}
                            </p>
                          </div>
                        </div>

                        {/* Acuity Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border shadow-2xs ${
                            isUrgent
                              ? 'bg-red-50 dark:bg-red-950/70 text-[#B71C1C] dark:text-rose-300 border-red-200 dark:border-red-800'
                              : 'bg-blue-50 dark:bg-blue-950/70 text-blue-900 dark:text-sky-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {patient.triageTier}
                        </span>
                      </div>

                      {/* Chief Complaint */}
                      <div className="p-3.5 rounded-2xl bg-[#F9F8F6] dark:bg-stone-900/60 border border-[#EFECE3] dark:border-stone-800 text-xs text-[#4A453C] dark:text-stone-300 leading-relaxed">
                        <span className="font-bold text-[#1A1816] dark:text-white block mb-0.5">
                          Reported Symptom / Triage Intake:
                        </span>
                        {patient.chiefComplaint ||
                          '14 months primary subfertility. Asthenozoospermia pattern with sluggish motility.'}
                      </div>

                      {/* WHO 2021 Semen Analysis Simulator Metric Blocks */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Block 1: Total Sperm Count */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900/50 border border-[#EBE7DF] dark:border-stone-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400">
                              Total Sperm Count
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/80 text-[#1B5E20] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Normal
                            </span>
                          </div>
                          <div className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                            {patient.whoParameters?.concentration || '24.5 M/ml'}
                          </div>
                          <span className="text-[10px] text-[#8A8172] dark:text-stone-400 block">Ref: ≥15 M/ml</span>
                        </div>

                        {/* Block 2: Progressive Motility */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900/50 border border-[#EBE7DF] dark:border-stone-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400">
                              Prog Motility
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFEBEE] dark:bg-red-950/80 text-[#C62828] dark:text-rose-300 border border-red-200 dark:border-red-800">
                              Flagged
                            </span>
                          </div>
                          <div className="font-editorial-serif text-xl font-bold text-[#C62828] dark:text-rose-400">
                            {patient.whoParameters?.progressiveMotility || '16.8% (USTS)'}
                          </div>
                          <span className="text-[10px] text-[#C62828] dark:text-rose-400 block">Sub-ref: &lt;32%</span>
                        </div>
                      </div>

                      {/* Mini Sparkline Motility Curve SVG */}
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900/50 border border-[#EBE7DF] dark:border-stone-800 flex items-center justify-between">
                        <div className="text-left rtl:text-right">
                          <span className="text-[10px] font-bold text-[#8A8172] dark:text-stone-400 block uppercase tracking-wider">
                            Motility Curve Trajectory
                          </span>
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                            ↑ 18% Recovery Projection
                          </span>
                        </div>
                        <div className="w-28 h-8">
                          <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                            <path
                              d="M 5 22 Q 25 15, 45 18 T 85 8 T 95 6"
                              stroke="#00A884"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                            <circle cx="95" cy="6" r="3" fill="#00A884" />
                          </svg>
                        </div>
                      </div>

                      {/* Primary Actions on Card */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                        {/* Prominent Dark Pill Button on Each Card (Requested) */}
                        <button
                          type="button"
                          onClick={() => openReviewModal(patient)}
                          className="w-full sm:flex-1 py-3 px-5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold tracking-wider uppercase transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <span>Launch Clinician Review Portal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Telehealth Video Call Pill Button */}
                        {patient.consultType === 'TELEHEALTH_VIDEO' && (
                          <Link
                            href={`/telehealth/${patient.bookingId}?role=doctor`}
                            target="_blank"
                            className="w-full sm:w-auto px-4 py-3 rounded-full bg-[#00A884] hover:bg-[#008f70] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-95"
                            title="Start WhatsApp Video Call"
                          >
                            <Video className="w-4 h-4" />
                            <span>Video</span>
                          </Link>
                        )}

                        {/* Copy Room Link */}
                        <button
                          type="button"
                          onClick={() => copyPatientLink(patient.bookingId)}
                          className="p-3 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[#6B6355] dark:text-stone-300 transition-colors"
                          title="Copy Patient Room URL"
                        >
                          {copiedBookingId === patient.bookingId ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================
          5. INTERACTIVE CLINICIAN REVIEW PORTAL MODAL / DRAWER
          ======================================================== */}
      {selectedReviewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] dark:bg-[#181614] border border-[#DDD7C8] dark:border-stone-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E8E2D5] dark:border-stone-800 bg-white dark:bg-[#1C1A17] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A1816] dark:bg-white text-white dark:text-[#181614] flex items-center justify-center font-bold shadow-xs">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                    Clinician Review Portal · Patient #{selectedReviewPatient.pseudonymId}
                  </h3>
                  <p className="text-xs text-[#8A8172] dark:text-stone-400">
                    WHO 2021 Human-In-The-Loop Triage & DoH Malaffi E-Prescription Gateway
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReviewPatient(null)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Patient Snapshot */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block">
                    Assigned Urgency Tier
                  </span>
                  <span className="font-bold text-sm text-[#1A1816] dark:text-[#FAF7F2]">
                    {selectedReviewPatient.triageTier}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block">
                    Consultation Modality
                  </span>
                  <span className="font-bold text-sm text-[#1A1816] dark:text-[#FAF7F2]">
                    {selectedReviewPatient.consultType === 'TELEHEALTH_VIDEO'
                      ? '📹 Telehealth Live'
                      : '🏥 In-Person Visit'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8A8172] dark:text-stone-400 block">
                    Consent Audit
                  </span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified SHA-256</span>
                  </span>
                </div>
              </div>

              {/* WHO 2021 Semen Analysis Simulator Detail Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                  WHO 2021 Semen Analysis Simulator (6th Edition Limits)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-[#E8E2D5] dark:border-stone-800">
                    <span className="text-[10px] text-[#8A8172] dark:text-stone-400 block">Sperm Concentration</span>
                    <span className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                      {selectedReviewPatient.whoParameters?.concentration || '24.5 M/ml'}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                      Ref: ≥ 15 M/ml (Normal)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                    <span className="text-[10px] text-[#C62828] dark:text-rose-400 font-bold block">
                      Progressive Motility (PR)
                    </span>
                    <span className="font-editorial-serif text-xl font-bold text-[#C62828] dark:text-rose-400">
                      {selectedReviewPatient.whoParameters?.progressiveMotility || '16.8%'}
                    </span>
                    <span className="text-[10px] text-[#C62828] dark:text-rose-400 font-bold block">
                      Sub-ref: &lt; 32% (Flagged)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-stone-900 border border-[#E8E2D5] dark:border-stone-800">
                    <span className="text-[10px] text-[#8A8172] dark:text-stone-400 block">Strict Normal Forms</span>
                    <span className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                      {selectedReviewPatient.whoParameters?.normalForms || '3%'}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                      Borderline: Ref ≥ 4%
                    </span>
                  </div>
                </div>
              </div>

              {/* Triage Decision Override Engine */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                  Clinician Human-In-The-Loop Triage Decision
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'ANDROLOGY_UROLOGY',
                    'URGENT',
                    'FERTILITY_SERVICES',
                    'PRIMARY_CARE',
                    'SELF_CARE',
                  ].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setOverrideTier(tier)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        overrideTier === tier
                          ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                          : 'bg-[#FAF8F5] dark:bg-stone-900 text-[#6B6355] dark:text-stone-400 border border-[#E5E0D5] dark:border-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block mb-1">
                    Clinical Justification & Audit Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={justificationNotes}
                    onChange={(e) => setJustificationNotes(e.target.value)}
                    placeholder="Document clinical reasoning for this acuity pathway..."
                    className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
                  />
                </div>
              </div>

              {/* Abu Dhabi Diagnostic Referral Suite */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                  1-Click Abu Dhabi Diagnostic Referral Builder
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    'Bilateral Scrotal Doppler Ultrasound',
                    'Serum Endocrine Profile (FSH/LH/Testosterone)',
                    'Repeat CASA Semen Analysis',
                    'Sperm DNA Fragmentation Index (DFI)',
                  ].map((order) => {
                    const isChecked = selectedLabOrders.includes(order);
                    return (
                      <div
                        key={order}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedLabOrders(selectedLabOrders.filter((o) => o !== order));
                          } else {
                            setSelectedLabOrders([...selectedLabOrders, order]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-[#E8F5E9] dark:bg-emerald-950/70 border-[#A5D6A7] dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold'
                            : 'bg-[#FAF8F5] dark:bg-stone-900 border-[#E8E2D5] dark:border-stone-800 text-[#6B6355] dark:text-stone-400'
                        }`}
                      >
                        <span>{order}</span>
                        <span>{isChecked ? '✓' : '+'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DoH Malaffi E-Prescription */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1B5E20] dark:text-emerald-400 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Official DoH Malaffi E-Prescription Pad</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#8A8172] dark:text-stone-400">
                    Dr. Tariq Al-Hashimi (DOH-AUH-2018-0924)
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#E8E2D5] dark:border-stone-800 bg-white dark:bg-[#1C1A17] flex items-center justify-between">
              <span className="text-xs text-[#8A8172] dark:text-stone-400">
                {decisionSuccess ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Decision successfully persisted & Malaffi synced!
                  </span>
                ) : (
                  'Changes are committed to the sovereign clinical audit trail.'
                )}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReviewPatient(null)}
                  className="px-5 py-2.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 text-xs font-bold text-[#6B6355] dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDecision}
                  disabled={savingDecision}
                  className="px-6 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{savingDecision ? 'Saving...' : 'Apply Decision & Issue Rx'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. CLINICIAN AUTH & PROFILE DIALOG
          ======================================================== */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] dark:bg-[#181614] border border-[#DDD7C8] dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D5] dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#1A1816] dark:bg-white text-white dark:text-[#181614] flex items-center justify-center font-bold">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-editorial-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                    Clinician Identity
                  </h4>
                  <p className="text-[10px] text-[#8A8172] dark:text-stone-400">DoH Malaffi Authorized Session</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {currentDoctor ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-1.5">
                  <p className="font-bold text-sm text-[#1A1816] dark:text-white">{currentDoctor.fullName}</p>
                  <p className="text-[#6B6355] dark:text-stone-400">{currentDoctor.email}</p>
                  <p className="text-[#8A8172] dark:text-stone-400 font-mono text-[11px]">
                    License: {currentDoctor.licenseNumber}
                  </p>
                  <p className="text-[#8A8172] dark:text-stone-400 text-[11px]">{currentDoctor.facility}</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-full border border-red-300 dark:border-red-900 text-red-700 dark:text-rose-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out Clinician Session</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-[#6B6355] dark:text-stone-400">
                  Authenticate with authorized Abu Dhabi Health Authority credentials:
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDemoLogin();
                    setAuthModalOpen(false);
                  }}
                  className="w-full py-3 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] font-bold uppercase tracking-wider text-[11px] transition-transform active:scale-95 shadow-sm"
                >
                  Quick Sign In as Dr. Tariq Al-Hashimi (Demo)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
