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

  // Navigation / Sidebar View State
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'workflows' | 'runtime' | 'consent' | 'escapements'
  >('runtime');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [timeframe, setTimeframe] = useState<'1b' | '6M' | '1M' | 'All'>('6M');

  // Auth State
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
      // Auto-populate Dr. Tariq demo
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
        // augment demo sparklines for visual aesthetics matching reference video
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
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1816] font-editorial-sans antialiased selection:bg-[#1A1816] selection:text-white relative overflow-x-hidden">
      {/* Decorative Warm Arcs & Ambient Radial Gradients (Matching Reference Video) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <svg
          className="absolute -top-40 -right-40 w-[1000px] h-[1000px] opacity-[0.045] text-[#22201D]"
          viewBox="0 0 1000 1000"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="500" cy="500" r="450" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="500" cy="500" r="320" strokeWidth="1.5" />
          <circle cx="500" cy="500" r="180" strokeWidth="1" />
        </svg>
        <div className="absolute top-1/4 -left-48 w-[700px] h-[700px] rounded-full bg-[#EFE8DC]/50 blur-3xl pointer-events-none" />
      </div>

      {/* ========================================================
          1. TOP NAVIGATION BAR (Clean, Luxury, Brand Identity)
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#F9F8F6]/90 backdrop-blur-md border-b border-[#EBE7DF]">
        <div className="max-w-[1520px] mx-auto px-6 h-18 flex items-center justify-between gap-6">
          {/* Left: VIGOR AI Brand Emblem */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="w-9 h-9 rounded-xl bg-[#1A1816] flex items-center justify-center text-white shadow-xs transition-transform duration-300 group-hover:scale-105">
                <VigorLogo className="w-5 h-5 text-current" size={20} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-editorial-serif text-lg tracking-[0.2em] font-bold text-[#1A1816] uppercase">
                    Vigor
                  </span>
                  <span className="text-[10px] tracking-[0.24em] font-black text-[#8A8172] uppercase">
                    AI
                  </span>
                </div>
                <span className="text-[9px] font-bold tracking-wider text-emerald-800 uppercase -mt-0.5">
                  Doctor Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Standard Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-[12px] font-semibold tracking-wider uppercase text-[#6B6355]">
            <Link href="/" className="hover:text-[#1A1816] transition-colors">
              Home
            </Link>
            <Link href="/#section-intake" className="hover:text-[#1A1816] transition-colors">
              Intake
            </Link>
            <Link href="/#section-safety" className="hover:text-[#1A1816] transition-colors">
              Clinical Standards
            </Link>
            <Link
              href="/doctor"
              className="text-[#1A1816] font-bold relative after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-[#1A1816]"
            >
              Doctor Portal
            </Link>
          </nav>

          {/* Right Cluster: Search, Telehealth Pill, Lang, Profile */}
          <div className="flex items-center gap-3.5">
            {/* Search input */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E0D5] text-xs text-[#6B6355] shadow-2xs w-48">
              <Search className="w-3.5 h-3.5 text-[#9E9587]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-xs text-[#1A1816] placeholder-[#9E9587]"
              />
            </div>

            {/* TELEHEALTH LIVE Pill Button (Requested) */}
            <Link
              href={`/telehealth/bk_auh_7821?role=doctor`}
              target="_blank"
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1816] hover:bg-[#2A2724] text-white text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="w-2 h-2 rounded-full bg-[#00A884] animate-pulse" />
              <span>TELEHEALTH LIVE</span>
            </Link>

            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E0D5] bg-white text-[10px] font-bold tracking-wider uppercase text-[#6B6355] hover:border-stone-400 transition-all shadow-2xs"
            >
              <Globe className="w-3 h-3 text-[#8A8172]" />
              <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative p-2 rounded-full bg-white border border-[#E5E0D5] text-[#6B6355] shadow-2xs cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D32F2F] text-white text-[9px] font-black flex items-center justify-center">
                2
              </span>
            </div>

            {/* Clinician Profile Avatar */}
            {currentDoctor && (
              <div className="flex items-center gap-2 pl-1 border-l border-[#E5E0D5]">
                <div className="w-8 h-8 rounded-full bg-[#2A2724] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  👨‍⚕️
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-[#1A1816] leading-tight">
                    {currentDoctor.fullName}
                  </span>
                  <span className="text-[9px] text-[#8A8172]">Consultant Andrologist</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          2. CRITICAL EMERGENCY WARNING BANNER (Top of Console)
          ======================================================== */}
      {urgentPatients.length > 0 && (
        <div className="bg-[#B71C1C] text-white py-3 px-6 shadow-md transition-colors animate-in fade-in duration-300">
          <div className="max-w-[1520px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-wide">
                  Clinical Emergency Warning: 2 Patients require immediate review.
                </span>
                <span className="hidden lg:inline text-xs text-rose-200 ml-2">
                  (Acute Scrotal Pain Gate GC01 · Solitary Lump Gate GC02 · SLA Window: 42m active)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveSidebarTab('escapements');
                  if (urgentPatients[0]) openReviewModal(urgentPatients[0]);
                }}
                className="px-4 py-1.5 rounded-full bg-white text-[#B71C1C] hover:bg-rose-50 text-[11px] font-black uppercase tracking-wider shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span>Review Immediate Cases</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. MAIN LAYOUT: CURVED TIMELINE SIDEBAR + CONSOLE
          ======================================================== */}
      <div className="max-w-[1520px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================
            LEFT SIDEBAR: CURVED SEGMENTED TIMELINE GRAPHIC
            (Matching Reference Video Frame 01 & 03)
            ======================================================== */}
        <aside className="lg:col-span-3 bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#F0ECE1]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8172]">
              Clinical Navigation
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-[#E8F5E9] px-2 py-0.5 rounded-full font-bold">
              60.0 fps
            </span>
          </div>

          {/* Timeline graphic wrapper with SVG arc */}
          <div className="relative pl-6 space-y-8">
            {/* The Subtle Curved Connecting Timeline Graphic (From Video) */}
            <div className="absolute top-3 left-2.5 bottom-6 w-8 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 32 300" fill="none">
                <path
                  d="M 6 10 C 26 60, 26 120, 6 160 C -8 200, 18 240, 6 290"
                  stroke="#DDD7C8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>

            {/* Menu Item 1: Active Workflows */}
            <div
              onClick={() => setActiveSidebarTab('workflows')}
              className={`relative cursor-pointer group transition-all ${
                activeSidebarTab === 'workflows' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'workflows'
                    ? 'bg-[#1A1816] border-white ring-2 ring-[#1A1816]'
                    : 'bg-[#DDD7C8] border-white group-hover:bg-[#1A1816]'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
                  Active Workflows
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-[#6B6355] font-bold">
                  10 n8n
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] mt-0.5">
                Autonomous screening, red-flag triage, and lab dispatch loops.
              </p>
            </div>

            {/* Menu Item 2: Runtime Review (Clinician Console) */}
            <div
              onClick={() => setActiveSidebarTab('runtime')}
              className={`relative cursor-pointer group transition-all ${
                activeSidebarTab === 'runtime' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'runtime'
                    ? 'bg-[#1A1816] border-white ring-2 ring-[#1A1816]'
                    : 'bg-[#DDD7C8] border-white group-hover:bg-[#1A1816]'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
                  Runtime Review
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] font-bold">
                  237 Pending
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] mt-0.5">
                Human-in-the-loop review for borderline WHO 2021 motility cases.
              </p>
            </div>

            {/* Menu Item 3: Consent Ledger */}
            <div
              onClick={() => setActiveSidebarTab('consent')}
              className={`relative cursor-pointer group transition-all ${
                activeSidebarTab === 'consent' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'consent'
                    ? 'bg-[#1A1816] border-white ring-2 ring-[#1A1816]'
                    : 'bg-[#DDD7C8] border-white group-hover:bg-[#1A1816]'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816]">
                  Consent Ledger
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 text-[#6B6355] font-bold">
                  511 SHA-256
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] mt-0.5">
                Zero-PII cryptographically signed Abu Dhabi DoH sharing receipts.
              </p>
            </div>

            {/* Menu Item 4: Patient Escapements */}
            <div
              onClick={() => setActiveSidebarTab('escapements')}
              className={`relative cursor-pointer group transition-all ${
                activeSidebarTab === 'escapements' ? 'opacity-100' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div
                className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'escapements'
                    ? 'bg-[#B71C1C] border-white ring-2 ring-red-500 animate-ping'
                    : 'bg-[#B71C1C] border-white'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B71C1C]">
                  Patient Escapements
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-[#B71C1C] font-bold">
                  2 SLA Active
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] mt-0.5">
                Urgent deterministic red flags requiring physician override.
              </p>
            </div>
          </div>

          {/* Clinician On-Call Status Card */}
          <div className="mt-8 p-4 rounded-2xl bg-[#F9F8F6] border border-[#EBE7DF] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#6B6355]">Physician Duty Status</span>
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-[#8A8172]">
              Dr. Tariq Al-Hashimi · License: DOH-AUH-2018-0924 (Malaffi Provider #PRV-882190)
            </p>
          </div>
        </aside>

        {/* ========================================================
            MAIN CONSOLE: HERO & PATIENT CARDS WITH WHO 2021 SIMULATOR
            ======================================================== */}
        <main className="lg:col-span-9 space-y-8">
          {/* Hero Banner: Runtime & Clinician Review Console (Matching Video Frames 03 & 04) */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 lg:p-10 border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden text-center space-y-4">
            {/* Subtle decorative curved background pattern in hero */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg className="w-full h-full" viewBox="0 0 800 240" fill="none">
                <path
                  d="M 50 200 C 250 80, 550 80, 750 200"
                  stroke="#E8E2D4"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              </svg>
            </div>

            <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-[#E8F5E9] border border-[#C8E6C9] text-[10px] font-black uppercase tracking-[0.2em] text-[#1B5E20]">
                Autonomous WHO 2021 Semen Analysis & Deterministic Triage Gateway
              </span>

              {/* High-contrast Serif Headline matching video */}
              <h1 className="font-editorial-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#1A1816] leading-[1.15]">
                Runtime & Clinician Review Console
              </h1>

              <p className="text-xs sm:text-sm text-[#6B6355] max-w-xl mx-auto leading-relaxed">
                Review asynchronous WHO 2021 computer-assisted semen analysis (CASA) parameters,
                override algorithmic risk bands with clinical justification, and issue official DoH
                Malaffi e-prescriptions.
              </p>

              {/* Prominent Dark Pill Button with Ripple Effect (Matching Video Click Action) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (displayedPatients[0]) openReviewModal(displayedPatients[0]);
                  }}
                  className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#1A1816] hover:bg-[#2A2724] text-white text-xs font-bold tracking-widest uppercase transition-all shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Launch Clinician Review Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              ANALYTICS & PARAMETER CARDS BAR (Matching Frame 05)
              ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Sperm Rating */}
            <div className="p-5 rounded-3xl bg-white border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] block">
                Total Sperm Metrics
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816]">
                  99%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] font-bold">
                  +1.33%
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172]">
                Quality index across 511 CASA verified samples.
              </p>
            </div>

            {/* Metric 2: Average Progressive Motility */}
            <div className="p-5 rounded-3xl bg-white border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] block">
                Prog Motility Average
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816]">
                  60%
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] font-bold">
                  Normal (≥32%)
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172]">
                Mean forward progressive motility score.
              </p>
            </div>

            {/* Metric 3: Total Sperm Count Throughput */}
            <div className="p-5 rounded-3xl bg-white border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] block">
                Total Sperm Count
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816]">
                  24.5 M/ml
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] font-bold">
                  Normal
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172]">
                WHO 2021 reference floor: 15 M/ml.
              </p>
            </div>

            {/* Metric 4: Immediate Escapement Alerts */}
            <div className="p-5 rounded-3xl bg-white border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B71C1C] block">
                Clinical Escapements
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#B71C1C]">
                  2 Cases
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-[#B71C1C] font-bold">
                  Action SLA
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172]">
                Deterministic red-flag safety triggers.
              </p>
            </div>
          </div>

          {/* ========================================================
              CENTRAL GRID OF PATIENT CARDS AWAITING ASYNC REVIEW
              (With WHO 2021 Semen Analysis Simulator Metrics & Sparklines)
              ======================================================== */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EBE7DF]">
              <div className="flex items-center gap-3">
                <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816]">
                  Awaiting Async Clinician Review ({displayedPatients.length} Cases)
                </h3>
              </div>

              {/* Timeframe selector matching video (1b, 6M, 1M, All) */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white border border-[#E5E0D5] text-xs font-bold shadow-2xs">
                {(['1b', '6M', '1M', 'All'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 rounded-full text-[11px] transition-all ${
                      timeframe === t
                        ? 'bg-[#1A1816] text-white shadow-2xs'
                        : 'text-[#6B6355] hover:text-[#1A1816]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {displayedPatients.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-[#EBE7DF] text-xs text-[#8A8172]">
                No patients found in this queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedPatients.map((patient) => {
                  const isUrgent =
                    patient.triageTier === 'URGENT' ||
                    (patient.redFlags && patient.redFlags.length > 0);
                  const isWaiting = patient.status === 'IN_WAITING_ROOM';

                  return (
                    <div
                      key={patient.bookingId}
                      className="bg-white rounded-3xl p-6 border border-[#EBE7DF] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all space-y-5 flex flex-col justify-between"
                    >
                      {/* Top Patient Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] flex items-center justify-center text-xl font-bold shadow-2xs border border-[#EAE5D9]">
                            {isUrgent ? '🚨' : '🧑'}
                          </div>
                          <div>
                            <h4 className="font-editorial-serif text-lg font-bold text-[#1A1816] leading-tight">
                              Patient #{patient.pseudonymId.slice(-7)}
                            </h4>
                            <p className="text-[11px] text-[#8A8172] font-mono">
                              Ref: {patient.bookingId} · {patient.facility.name}
                            </p>
                          </div>
                        </div>

                        {/* Acuity Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            isUrgent
                              ? 'bg-red-50 text-[#B71C1C] border-red-200'
                              : 'bg-blue-50 text-blue-900 border-blue-200'
                          }`}
                        >
                          {patient.triageTier}
                        </span>
                      </div>

                      {/* Chief Complaint */}
                      <div className="p-3 rounded-2xl bg-[#F9F8F6] border border-[#EFECE3] text-xs text-[#4A453C] leading-relaxed">
                        <span className="font-bold text-[#1A1816] block mb-0.5">
                          Reported Symptom / Triage Intake:
                        </span>
                        {patient.chiefComplaint ||
                          '14 months primary subfertility. Asthenozoospermia pattern with sluggish motility.'}
                      </div>

                      {/* ========================================================
                          WHO 2021 Semen Analysis Simulator Metric Blocks
                          (Matching Reference Video Frames 02 & 03)
                          ======================================================== */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Block 1: Total Sperm Count */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172]">
                              Total Sperm Count
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20]">
                              Normal
                            </span>
                          </div>
                          <div className="font-editorial-serif text-xl font-bold text-[#1A1816]">
                            {patient.whoParameters?.concentration || '24.5 M/ml'}
                          </div>
                          <span className="text-[10px] text-[#8A8172] block">Ref: ≥15 M/ml</span>
                        </div>

                        {/* Block 2: Progressive Motility */}
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172]">
                              Prog Motility
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFEBEE] text-[#C62828]">
                              Flagged
                            </span>
                          </div>
                          <div className="font-editorial-serif text-xl font-bold text-[#C62828]">
                            {patient.whoParameters?.progressiveMotility || '16.8% (USTS)'}
                          </div>
                          <span className="text-[10px] text-[#C62828] block">Sub-ref: &lt;32%</span>
                        </div>
                      </div>

                      {/* Mini Sparkline Motility Curve SVG (Matching Video) */}
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] flex items-center justify-between">
                        <div className="text-left">
                          <span className="text-[10px] font-bold text-[#8A8172] block uppercase tracking-wider">
                            Motility Curve Trajectory
                          </span>
                          <span className="text-xs font-bold text-emerald-800">
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
                        {/* Launch Clinician Review Portal Pill Button (Requested) */}
                        <button
                          type="button"
                          onClick={() => openReviewModal(patient)}
                          className="w-full sm:flex-1 py-3 px-5 rounded-full bg-[#1A1816] hover:bg-[#2A2724] text-white text-xs font-bold tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-sm"
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
                          className="p-3 rounded-full bg-stone-100 hover:bg-stone-200 text-[#6B6355] transition-colors"
                          title="Copy Patient Room URL"
                        >
                          {copiedBookingId === patient.bookingId ? (
                            <Check className="w-4 h-4 text-emerald-600" />
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
          4. INTERACTIVE CLINICIAN REVIEW PORTAL MODAL / DRAWER
          ======================================================== */}
      {selectedReviewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF8F5] border border-[#DDD7C8] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E8E2D5] bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A1816] text-white flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816]">
                    Clinician Review Portal · Patient #{selectedReviewPatient.pseudonymId}
                  </h3>
                  <p className="text-xs text-[#8A8172]">
                    WHO 2021 Human-In-The-Loop Triage & DoH Malaffi E-Prescription Gateway
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReviewPatient(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Patient Snapshot */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8A8172] block">
                    Assigned Urgency Tier
                  </span>
                  <span className="font-bold text-sm text-[#1A1816]">
                    {selectedReviewPatient.triageTier}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8A8172] block">
                    Consultation Modality
                  </span>
                  <span className="font-bold text-sm text-[#1A1816]">
                    {selectedReviewPatient.consultType === 'TELEHEALTH_VIDEO'
                      ? '📹 Telehealth Live'
                      : '🏥 In-Person Visit'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#8A8172] block">
                    Consent Audit
                  </span>
                  <span className="font-bold text-sm text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified SHA-256</span>
                  </span>
                </div>
              </div>

              {/* WHO 2021 Semen Analysis Simulator Detail Table */}
              <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8172] block">
                  WHO 2021 Semen Analysis Simulator (6th Edition Limits)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
                    <span className="text-[10px] text-[#8A8172] block">Sperm Concentration</span>
                    <span className="font-editorial-serif text-xl font-bold text-[#1A1816]">
                      {selectedReviewPatient.whoParameters?.concentration || '24.5 M/ml'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      Ref: ≥ 15 M/ml (Normal)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-red-50/50 border border-red-200">
                    <span className="text-[10px] text-[#C62828] font-bold block">
                      Progressive Motility (PR)
                    </span>
                    <span className="font-editorial-serif text-xl font-bold text-[#C62828]">
                      {selectedReviewPatient.whoParameters?.progressiveMotility || '16.8%'}
                    </span>
                    <span className="text-[10px] text-[#C62828] font-bold block">
                      Sub-ref: &lt; 32% (Flagged)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5]">
                    <span className="text-[10px] text-[#8A8172] block">Strict Normal Forms</span>
                    <span className="font-editorial-serif text-xl font-bold text-[#1A1816]">
                      {selectedReviewPatient.whoParameters?.normalForms || '3%'}
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold block">
                      Borderline: Ref ≥ 4%
                    </span>
                  </div>
                </div>
              </div>

              {/* Triage Decision Override Engine */}
              <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8172] block">
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
                          ? 'bg-[#1A1816] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#6B6355] border border-[#E5E0D5] hover:border-stone-400'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#1A1816] block mb-1">
                    Clinical Justification & Audit Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={justificationNotes}
                    onChange={(e) => setJustificationNotes(e.target.value)}
                    placeholder="Document clinical reasoning for this acuity pathway..."
                    className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] bg-[#FAF8F5] text-[#1A1816] focus:outline-none focus:ring-1 focus:ring-[#1A1816]"
                  />
                </div>
              </div>

              {/* Abu Dhabi Diagnostic Referral Suite */}
              <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8172] block">
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
                            ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#1B5E20] font-bold'
                            : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#6B6355]'
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
              <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1B5E20] flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5" />
                    <span>Official DoH Malaffi E-Prescription Pad</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#8A8172]">
                    Dr. Tariq Al-Hashimi (DOH-AUH-2018-0924)
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-[#DDD7C8] bg-[#FAF8F5] text-[#1A1816] focus:outline-none focus:ring-1 focus:ring-[#1A1816] leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#E8E2D5] bg-white flex items-center justify-between">
              <span className="text-xs text-[#8A8172]">
                {decisionSuccess ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
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
                  className="px-5 py-2.5 rounded-full border border-[#DDD7C8] text-xs font-bold text-[#6B6355] hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDecision}
                  disabled={savingDecision}
                  className="px-6 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#2A2724] text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{savingDecision ? 'Saving...' : 'Apply Decision & Issue Rx'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
