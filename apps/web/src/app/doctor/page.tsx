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
  Mic,
  MicOff,
  User,
  Sliders,
  X,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';
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
}

export default function DoctorPortalPage() {
  const [currentDoctor, setCurrentDoctor] = useState<DoctorAccount | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('DOH-AUH-2018-0924');
  const [specialtyInput, setSpecialtyInput] = useState('Consultant Andrologist & Male Infertility');
  const [facilityInput, setFacilityInput] = useState('HealthPlus Fertility & Andrology Center · Al Bateen');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard State
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterModality, setFilterModality] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);

  // Audio / Device Diagnostic Test State
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [speakerTested, setSpeakerTested] = useState(false);
  const micAudioContextRef = useRef<AudioContext | null>(null);

  // Detailed Patient EHR Dossier & Prescription Modal State
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [activeEHRTab, setActiveEHRTab] = useState<'overview' | 'who' | 'orders' | 'rx'>('overview');
  const [notesInput, setNotesInput] = useState('');
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([]);
  const [savingNotes, setSavingNotes] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Load existing doctor session on mount
  useEffect(() => {
    const doc = getCurrentDoctor();
    if (doc) {
      setCurrentDoctor(doc);
    }
  }, []);

  // Fetch live bookings from MongoDB API
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch('/api/booking');
      const data = await res.json();
      if (res.ok && data.bookings) {
        setBookings(data.bookings);
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

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const res = await loginDoctorWithFirebase(emailInput, passwordInput);
    setAuthLoading(false);
    if (res.ok && res.doctor) {
      setCurrentDoctor(res.doctor);
    } else {
      setAuthError(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const res = await registerDoctorWithFirebase({
      email: emailInput,
      password: passwordInput,
      fullName: fullNameInput,
      licenseNumber: licenseInput,
      specialty: specialtyInput,
      facility: facilityInput,
    });
    setAuthLoading(false);
    if (res.ok && res.doctor) {
      setCurrentDoctor(res.doctor);
    } else {
      setAuthError(res.error || 'Registration failed. Please check your inputs.');
    }
  };

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

  const handleStatusToggle = (newStatus: 'available' | 'busy') => {
    const updated = updateDoctorStatus(newStatus);
    if (updated) setCurrentDoctor({ ...updated });
  };

  const handleUpdateStatus = async (bookingId: string, status: PatientBooking['status']) => {
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.bookingId === bookingId ? { ...b, status } : b))
        );
        if (selectedBooking && selectedBooking.bookingId === bookingId) {
          setSelectedBooking({ ...selectedBooking, status });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // EHR Dossier Selection & Pre-fill
  const openEHRDossier = (b: PatientBooking, defaultTab: 'overview' | 'who' | 'orders' | 'rx' = 'overview') => {
    setSelectedBooking(b);
    setActiveEHRTab(defaultTab);
    setNotesInput(b.clinicalNotes || '');
    setPrescriptionInput(
      b.prescription ||
        '1. Bilateral Scrotal Doppler Ultrasound to evaluate subclinical varicocele.\n2. Serum Endocrine Panel: Total Testosterone, FSH, LH, and Prolactin.\n3. Repeat CASA Semen Analysis in 4 weeks.\n4. Micronutrient protocol: L-Carnitine 2000mg + CoQ10 200mg daily.'
    );
    setSelectedLabOrders(
      b.labOrders || ['Scrotal Doppler Ultrasound', 'Serum Hormone Panel (FSH/LH/Testosterone)', 'Repeat CASA Semen Analysis']
    );
    setPrintSuccess(false);
  };

  const handleSaveEHRAndRx = async () => {
    if (!selectedBooking) return;
    setSavingNotes(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.bookingId,
          clinicalNotes: notesInput,
          prescription: prescriptionInput,
          labOrders: selectedLabOrders,
          status: 'COMPLETED',
        }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === selectedBooking.bookingId
              ? {
                  ...b,
                  clinicalNotes: notesInput,
                  prescription: prescriptionInput,
                  labOrders: selectedLabOrders,
                  status: 'COMPLETED',
                }
              : b
          )
        );
        setSelectedBooking((prev) =>
          prev
            ? {
                ...prev,
                clinicalNotes: notesInput,
                prescription: prescriptionInput,
                labOrders: selectedLabOrders,
                status: 'COMPLETED',
              }
            : null
        );
        setPrintSuccess(true);
        setTimeout(() => setPrintSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving clinical notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Mic Diagnostic Tester
  const startMicTest = async () => {
    if (isMicTesting) {
      setIsMicTesting(false);
      if (micAudioContextRef.current) micAudioContextRef.current.close();
      setMicLevel(0);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      micAudioContextRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      setIsMicTesting(true);

      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        if (ctx.state !== 'closed') requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn('Mic permission error:', e);
    }
  };

  const playSpeakerTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setSpeakerTested(true);
      setTimeout(() => setSpeakerTested(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyPatientTelehealthLink = (bId: string) => {
    const url = `${window.location.origin}/telehealth/${bId}`;
    navigator.clipboard.writeText(url);
    setCopiedBookingId(bId);
    setTimeout(() => setCopiedBookingId(null), 2500);
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesTier = filterTier === 'ALL' || b.triageTier === filterTier;
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesModality = filterModality === 'ALL' || b.consultType === filterModality;
    const matchesSearch =
      searchQuery.trim() === '' ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pseudonymId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.chiefComplaint && b.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTier && matchesStatus && matchesModality && matchesSearch;
  });

  // KPI Metrics
  const totalBookings = bookings.length;
  const urgentCount = bookings.filter((b) => b.triageTier === 'URGENT').length;
  const waitingRoomCount = bookings.filter((b) => b.status === 'IN_WAITING_ROOM').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-[#F5F3EA] dark:bg-[#121110] text-stone-900 dark:text-[#FAF7F2] font-sans transition-colors duration-200">
      {/* ========================================================
          1. TOP HOSPITAL-GRADE EXECUTIVE HEADER
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181715]/95 backdrop-blur-xl border-b border-[#DDD7C8] dark:border-stone-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Brand & Abu Dhabi Clinical Identity */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#22201D] dark:bg-[#FAF7F2] text-white dark:text-[#181614] flex items-center justify-center font-bold shadow-sm">
                <Stethoscope className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-editorial-serif text-lg tracking-wider font-bold uppercase text-stone-900 dark:text-white">
                    Vigor
                  </span>
                  <span className="text-[10px] font-black tracking-widest text-[#00A884] uppercase bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    Clinician Hub
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Abu Dhabi DoH Malaffi Provider Portal
                </p>
              </div>
            </Link>

            {/* Department of Health Verification Seal */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DoH Licensed Telehealth Operator</span>
            </div>
          </div>

          {/* Right: Doctor Profile & Actions */}
          {currentDoctor && (
            <div className="flex items-center gap-3">
              {/* Doctor Status Badge */}
              <button
                onClick={() =>
                  handleStatusToggle(currentDoctor.status === 'available' ? 'busy' : 'available')
                }
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs ${
                  currentDoctor.status === 'available'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                }`}
                title="Click to toggle availability"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentDoctor.status === 'available'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                <span>
                  {currentDoctor.status === 'available' ? 'Available for Video' : 'In Procedure'}
                </span>
              </button>

              {/* Doctor Details Pill */}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-stone-900 dark:text-white">
                  {currentDoctor.fullName}
                </span>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                  {currentDoctor.licenseNumber}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================
          2. MAIN CONTENT AREA
          ======================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentDoctor ? (
          /* ========================================================
             DOCTOR AUTHENTICATION CARD (LOGIN / REGISTER)
             ======================================================== */
          <div className="max-w-lg mx-auto bg-white dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 p-8 shadow-xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[#00A884] flex items-center justify-center mx-auto shadow-sm">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-stone-900 dark:text-[#FAF7F2]">
                Physician & Specialist Portal
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Department of Health Abu Dhabi (DoH) Malaffi Telehealth Integration
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-[#25221E] text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Clinician Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-[#25221E] text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Register License (DoH)
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Auth Forms */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Hospital / Clinician Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="dr.tariq@healthplus.ae"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-[#22201D] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#181614] font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-[1.01] transition-transform"
                >
                  {authLoading ? 'Verifying with DoH Malaffi...' : 'Sign In to Clinical Suite'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Full Name & Title
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Dr. Tariq Al-Hashimi, MD, FRCS"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      DoH License #
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value)}
                      placeholder="DOH-AUH-2018-0924"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Specialty
                    </label>
                    <input
                      type="text"
                      required
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      placeholder="Consultant Andrologist"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Primary Facility / Hospital
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="HealthPlus Fertility & Andrology Center"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="doctor@healthplus.ae"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors mt-2"
                >
                  {authLoading ? 'Registering with DoH...' : 'Complete Clinician Registration'}
                </button>
              </form>
            )}

            {/* Instant 1-Click Demo Login */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-bold text-emerald-700 dark:text-[#00A884] hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Instant Demo: Login as Dr. Tariq (No password needed)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             DOCTOR COMMAND DASHBOARD & PATIENT APPOINTMENTS QUEUE
             ======================================================== */
          <div className="space-y-6">
            {/* Top Doctor Profile & Diagnostics Ribbon */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-2xl shadow-md font-bold">
                  👨‍⚕️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-stone-900 dark:text-[#FAF7F2]">
                      {currentDoctor.fullName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                      DoH Verified
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 font-medium">
                    {currentDoctor.specialty} · {currentDoctor.facility}
                  </p>
                  <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                    Licence: {currentDoctor.licenseNumber} · Malaffi Provider ID: PRV-882190
                  </p>
                </div>
              </div>

              {/* Hardware Diagnostic Suite: Mic VU Meter & Sound Test */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
                {/* Mic VU Meter */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#181715] border border-stone-200 dark:border-stone-800">
                  <button
                    onClick={startMicTest}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isMicTesting ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                    }`}
                    title="Click to test mic"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-stone-400 uppercase">
                      {isMicTesting ? 'Speak now' : 'Mic Test'}
                    </span>
                    <div className="w-20 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-0.5">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${isMicTesting ? micLevel : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Speaker Sound Test */}
                <button
                  onClick={playSpeakerTestSound}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#181715] border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold text-[11px] text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>{speakerTested ? 'Chime OK!' : 'Test Speaker'}</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">Consultations Today</p>
                  <p className="text-2xl font-black text-stone-900 dark:text-[#FAF7F2]">{totalBookings}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">Urgent Red-Flags</p>
                  <p className="text-2xl font-black text-red-600 dark:text-red-400">{urgentCount}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">In Waiting Room</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{waitingRoomCount}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">Completed Cases</p>
                  <p className="text-2xl font-black text-stone-900 dark:text-[#FAF7F2]">{completedCount}</p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-stone-50 dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800">
                <Search className="w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search patient pseudonym, complaint, or booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="ALL">All Acuity Tiers</option>
                  <option value="URGENT">Urgent Red-Flags</option>
                  <option value="ANDROLOGY_UROLOGY">Andrology Review</option>
                  <option value="FERTILITY_SERVICES">Fertility Pathway</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="IN_WAITING_ROOM">In Waiting Room</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <button
                  onClick={fetchBookings}
                  className="p-2.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-300 dark:border-stone-700"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBookings ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Patients Appointments Queue */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Live Patient Roster ({filteredBookings.length} Cases)
                </h3>
                <span className="text-[11px] text-stone-400">
                  Encrypted under DoH Sovereign Privacy Standards
                </span>
              </div>

              {filteredBookings.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 text-xs text-stone-500 space-y-2">
                  <p className="font-bold text-sm text-stone-700 dark:text-stone-300">
                    No patient consultations found
                  </p>
                  <p>Check filter criteria or click Refresh above to reload.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredBookings.map((b) => {
                    const isUrgent = b.triageTier === 'URGENT';
                    const isWaiting = b.status === 'IN_WAITING_ROOM';
                    const isCompleted = b.status === 'COMPLETED';

                    return (
                      <div
                        key={b.bookingId}
                        className={`p-5 rounded-3xl border transition-all bg-white dark:bg-[#181715] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                          isUrgent
                            ? 'border-red-300 dark:border-red-900/60 ring-1 ring-red-500/20'
                            : isWaiting
                            ? 'border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/20'
                            : 'border-[#DDD7C8] dark:border-stone-800'
                        }`}
                      >
                        {/* Left: Patient Info & Clinical Triage */}
                        <div className="space-y-2.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-black text-stone-900 dark:text-[#FAF7F2]">
                              {b.pseudonymId}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              ({b.bookingId})
                            </span>

                            {/* Acuity Tier Badge */}
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                isUrgent
                                  ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-sky-300'
                              }`}
                            >
                              {b.triageTier}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isWaiting
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse'
                                  : isCompleted
                                  ? 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              ● {b.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Chief Complaint */}
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                            {b.chiefComplaint || 'Assessment for male subfertility and motility optimization'}
                          </p>

                          {/* WHO 2021 Reference Parameters Preview */}
                          {b.whoParameters && (
                            <div className="flex flex-wrap items-center gap-3 text-[11px] bg-stone-50 dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 font-mono">
                              <span>
                                <strong>Sperm Conc:</strong> {b.whoParameters.concentration || '16 M/ml (Ref ≥15)'}
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Prog. Motility:</strong>{' '}
                                <span className={b.whoParameters.progressiveMotility?.includes('Sub') ? 'text-red-600 dark:text-red-400 font-bold' : 'text-emerald-600'}>
                                  {b.whoParameters.progressiveMotility || '28% (Sub-ref <32%)'}
                                </span>
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Normal Forms:</strong> {b.whoParameters.normalForms || '3% (Ref ≥4%)'}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400">
                            <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-sky-300">
                              <Clock className="w-3.5 h-3.5" />
                              {b.slotTime}
                            </span>
                            <span>
                              {b.consultType === 'TELEHEALTH_VIDEO' ? '📹 Telehealth Video' : '🏥 In-Clinic'}
                            </span>
                            {b.contact?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {b.contact.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-200 dark:border-stone-800">
                          {/* Join Video Room Button */}
                          {b.consultType === 'TELEHEALTH_VIDEO' && (
                            <Link
                              href={`/telehealth/${b.bookingId}?role=doctor`}
                              target="_blank"
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                            >
                              <Video className="w-4 h-4" />
                              <span>Join Live Video Room</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}

                          {/* Copy Patient Link */}
                          <button
                            type="button"
                            onClick={() => copyPatientTelehealthLink(b.bookingId)}
                            className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
                            title="Copy Patient Consultation Link"
                          >
                            {copiedBookingId === b.bookingId ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Full EHR Dossier Button */}
                          <button
                            type="button"
                            onClick={() => openEHRDossier(b, 'overview')}
                            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#25221E] border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-[#FAF7F2] font-bold text-xs flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                            <span>Clinical EHR / Rx</span>
                          </button>

                          {/* Quick Mark Completed Toggle */}
                          {b.status !== 'COMPLETED' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(b.bookingId, 'COMPLETED')}
                              className="px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-stone-600 hover:text-emerald-700 dark:text-stone-300 text-xs font-bold transition-colors"
                              title="Mark Consultation Complete"
                            >
                              Mark Done
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-emerald-600 font-bold text-xs">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================
          3. COMPREHENSIVE ELECTRONIC HEALTH RECORD (EHR) MODAL
          ======================================================== */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#181715] border border-stone-300 dark:border-stone-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-[#1D1B18]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-stone-900 dark:text-[#FAF7F2]">
                      Patient Clinical EHR Dossier · {selectedBooking.pseudonymId}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 text-[10px] font-black">
                      {selectedBooking.triageTier}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Ref: {selectedBooking.bookingId} · Facility: {selectedBooking.facility.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#151412] px-4 gap-2">
              <button
                onClick={() => setActiveEHRTab('overview')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeEHRTab === 'overview'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Patient Overview & Safety</span>
              </button>

              <button
                onClick={() => setActiveEHRTab('who')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeEHRTab === 'who'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                }`}
              >
                <Microscope className="w-4 h-4" />
                <span>WHO 2021 Semen Analysis</span>
              </button>

              <button
                onClick={() => setActiveEHRTab('orders')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeEHRTab === 'orders'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Diagnostic Test Orders</span>
              </button>

              <button
                onClick={() => setActiveEHRTab('rx')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeEHRTab === 'rx'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>DoH Malaffi E-Prescription</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* TAB 1: OVERVIEW & SAFETY AUDIT */}
              {activeEHRTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                        Consultation Modality
                      </span>
                      <p className="font-bold text-sm text-stone-900 dark:text-white">
                        {selectedBooking.consultType === 'TELEHEALTH_VIDEO'
                          ? '📹 Real-Time WebRTC Telehealth'
                          : '🏥 In-Clinic Physical Consult'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                        Consent Verification
                      </span>
                      <p className="font-bold text-sm text-emerald-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Active Sovereign Ledger</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                        SLA Escalation Window
                      </span>
                      <p className="font-bold text-sm text-stone-900 dark:text-white">
                        {selectedBooking.triageTier === 'URGENT' ? '🚨 Immediate (SLA <60m)' : 'Standard Elective (1-7 Days)'}
                      </p>
                    </div>
                  </div>

                  {/* 16 Red-Flag Safety Audit Checklist */}
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                      Deterministic Safety Gate Audit (16 Red Flags)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181715] border border-stone-200 dark:border-stone-800">
                        <span>Acute Sudden Scrotal Pain (&lt;6h)</span>
                        <span className="font-bold text-emerald-600">✓ Ruled Out</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181715] border border-stone-200 dark:border-stone-800">
                        <span>Painless Testicular Mass</span>
                        <span className="font-bold text-emerald-600">✓ Negative</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181715] border border-stone-200 dark:border-stone-800">
                        <span>Prolonged Painful Erection</span>
                        <span className="font-bold text-emerald-600">✓ None</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181715] border border-stone-200 dark:border-stone-800">
                        <span>Acute Urinary Retention</span>
                        <span className="font-bold text-emerald-600">✓ None</span>
                      </div>
                    </div>
                  </div>

                  {/* Clinician Consultation Notes */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Doctor Clinical Consultation Notes & History:
                    </label>
                    <textarea
                      rows={4}
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Enter clinical examination notes, patient history, duration of subfertility, physical findings..."
                      className="w-full text-xs p-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: WHO 2021 SEMEN ANALYSIS BENCHMARKS */}
              {activeEHRTab === 'who' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1">
                    <h4 className="text-xs font-black uppercase text-blue-900 dark:text-sky-300">
                      WHO Laboratory Manual for the Examination and Processing of Human Semen (6th Edition)
                    </h4>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300">
                      Standardized thresholds established by the World Health Organization (WHO 2021).
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Concentration */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 dark:text-white">
                          Sperm Concentration
                        </span>
                        <span className="font-mono font-bold text-emerald-600">
                          16 M/ml (Normal: ≥15 M/ml)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>

                    {/* Progressive Motility */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 dark:text-white">
                          Progressive Motility (PR)
                        </span>
                        <span className="font-mono font-bold text-red-500">
                          22% (Sub-reference: Threshold ≥32%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '44%' }} />
                      </div>
                      <p className="text-[10px] text-red-500 font-medium">
                        Asthenozoospermia flagged: Sub-reference forward motility contributing to delayed conception.
                      </p>
                    </div>

                    {/* Strict Normal Forms */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 dark:text-white">
                          Strict Normal Morphology (Tygerberg Criteria)
                        </span>
                        <span className="font-mono font-bold text-amber-500">
                          3% (Borderline: Threshold ≥4%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '38%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DIAGNOSTIC TEST ORDERS */}
              {activeEHRTab === 'orders' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <h4 className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-300">
                      1-Click Abu Dhabi Diagnostic Referral Builder
                    </h4>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300">
                      Select official investigations to dispatch to Cleveland Clinic Abu Dhabi or HealthPlus.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        name: 'Bilateral Scrotal Doppler Ultrasound',
                        desc: 'Evaluate varicocele reflux, venous diameter, and testicular volume',
                      },
                      {
                        name: 'Serum Endocrine Panel (FSH, LH, Total Testosterone, Prolactin)',
                        desc: 'Investigate hypothalamic-pituitary-gonadal axis integrity',
                      },
                      {
                        name: 'Repeat CASA Semen Analysis in 4 Weeks',
                        desc: 'Confirm asthenozoospermia pattern with second sample',
                      },
                      {
                        name: 'Sperm DNA Fragmentation Index (DFI)',
                        desc: 'Assess chromatin integrity and oxidative sperm damage',
                      },
                      {
                        name: 'Karyotype & Y-Chromosome Microdeletion',
                        desc: 'Indicated if sperm concentration drops below 5 M/ml',
                      },
                      {
                        name: 'Urine Chlamydia / Gonorrhoea PCR',
                        desc: 'Rule out occult accessory gland infection',
                      },
                    ].map((test) => {
                      const isSelected = selectedLabOrders.includes(test.name);
                      return (
                        <div
                          key={test.name}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLabOrders(selectedLabOrders.filter((t) => t !== test.name));
                            } else {
                              setSelectedLabOrders([...selectedLabOrders, test.name]);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-500/30'
                              : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-stone-900 dark:text-white">
                              {test.name}
                            </span>
                            <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-emerald-600 text-white' : 'border border-stone-300 dark:border-stone-700'
                            }`}>
                              {isSelected ? '✓' : ''}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                            {test.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: DoH MALAFFI E-PRESCRIPTION */}
              {activeEHRTab === 'rx' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4" />
                        <span>Department of Health Abu Dhabi · Malaffi Digital Prescription</span>
                      </span>
                      <p className="text-xs text-stone-600 dark:text-stone-300">
                        Signed by: <strong>{currentDoctor?.fullName || 'Dr. Tariq Al-Hashimi'}</strong> ({currentDoctor?.licenseNumber || 'DOH-AUH-2018-0924'})
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono">
                      Malaffi Active
                    </span>
                  </div>

                  {/* Prescription Textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Medication Orders, Dosages & Clinical Directives:
                    </label>
                    <textarea
                      rows={6}
                      value={prescriptionInput}
                      onChange={(e) => setPrescriptionInput(e.target.value)}
                      className="w-full text-xs font-mono p-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setPrescriptionInput(
                          (prev) =>
                            prev +
                            '\n• L-Carnitine 2000mg PO QD + CoQ10 200mg PO QD for 90 days (Sperm mitochondrial motility support).'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                    >
                      + Add Antioxidant Protocol
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPrescriptionInput(
                          (prev) =>
                            prev +
                            '\n• Bilateral Scrotal Ultrasound with Doppler at Cleveland Clinic Abu Dhabi.'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                    >
                      + Add Ultrasound Referral
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-[#1D1B18]">
              <div className="flex items-center gap-2">
                {printSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Prescription synced to patient & Malaffi!</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveEHRAndRx}
                  disabled={savingNotes}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                >
                  {savingNotes ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Save EHR & Issue Official DoH Rx</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
