'use client';

import React, { useState, useEffect } from 'react';
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
  };
  redFlags?: { code: string; severity: string; slaMinutes?: number }[];
  chiefComplaint?: string;
  clinicalNotes?: string;
  prescription?: string;
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
  const [filterModality, setFilterModality] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Prescription / Clinical Notes Modal State
  const [selectedBooking, setSelectedBooking] = useState<PatientBooking | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [prescriptionInput, setPrescriptionInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Load existing session on mount
  useEffect(() => {
    const doc = getCurrentDoctor();
    if (doc) {
      setCurrentDoctor(doc);
    }
  }, []);

  // Fetch live bookings
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
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveNotes = async () => {
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
                  status: 'COMPLETED',
                }
              : b
          )
        );
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesTier = filterTier === 'ALL' || b.triageTier === filterTier;
    const matchesModality = filterModality === 'ALL' || b.consultType === filterModality;
    const matchesSearch =
      searchQuery === '' ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.pseudonymId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.facility.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesModality && matchesSearch;
  });

  // Analytics counts
  const totalBookings = bookings.length;
  const urgentCount = bookings.filter((b) => b.triageTier === 'URGENT').length;
  const waitingRoomCount = bookings.filter((b) => b.status === 'IN_WAITING_ROOM').length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-[#F5F3EA] dark:bg-[#121110] text-stone-900 dark:text-[#FAF7F2] font-sans transition-colors">
      {/* Top Clinical Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#181715]/95 backdrop-blur-md border-b border-[#DDD7C8] dark:border-stone-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-xs hover:scale-105 transition-transform"
            >
              <Stethoscope className="w-5 h-5 text-sky-300" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight">
                  Vigor Clinical Console · Abu Dhabi Doctor Hub
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  DoH Malaffi Gateway
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Encrypted Physician Teleconsultation & Patient Decision Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentDoctor ? (
              <div className="flex items-center gap-3">
                {/* Availability Status Badge */}
                <button
                  onClick={() =>
                    handleStatusToggle(currentDoctor.status === 'available' ? 'busy' : 'available')
                  }
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                    currentDoctor.status === 'available'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      currentDoctor.status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {currentDoctor.status === 'available' ? 'Available for Calls' : 'In Surgery / Busy'}
                  </span>
                </button>

                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-stone-900 dark:text-[#FAF7F2]">
                    {currentDoctor.fullName}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    {currentDoctor.licenseNumber} · {currentDoctor.facility}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="hidden sm:inline text-stone-500 text-[11px]">
                  {isLiveFirebaseConfigured ? '🔥 Firebase Auth Active' : '⚡ Local Auth Sandbox Active'}
                </span>
                <button
                  onClick={handleDemoLogin}
                  disabled={authLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  1-Click Doctor Demo
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentDoctor ? (
          /* ========================================================
             DOCTOR AUTHENTICATION / REGISTRATION CARD (FIREBASE)
             ======================================================== */
          <div className="max-w-md mx-auto my-8 bg-white dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center mx-auto shadow-md">
                <Stethoscope className="w-7 h-7 text-sky-300" />
              </div>
              <h2 className="text-xl font-black text-stone-900 dark:text-[#FAF7F2]">
                Physician Credentials Gateway
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Licensed healthcare professionals in Abu Dhabi & UAE: Sign in or register to manage male reproductive consultations.
              </p>
            </div>

            {/* Auth Switcher */}
            <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-[#1C1A17] text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 rounded-xl transition-all ${
                  authMode === 'register'
                    ? 'bg-white dark:bg-[#1C1A17] text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                Register as Doctor
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Sign In Form */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Physician Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="doctor@healthplus.ae"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {authLoading ? 'Verifying Credentials...' : 'Sign In to Clinical Console'}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Full Name & Medical Title
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Dr. Tariq Al-Hashimi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    DoH / MOHAP Medical License #
                  </label>
                  <input
                    type="text"
                    required
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    placeholder="DOH-AUH-2018-0924"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Clinical Specialty
                  </label>
                  <input
                    type="text"
                    required
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    placeholder="Consultant Andrologist & Male Infertility"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Hospital / Facility Affiliation
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="HealthPlus Fertility & Andrology Center · Al Bateen"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Professional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="doctor@healthplus.ae"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {authLoading ? 'Registering with Firebase...' : 'Create Verified Doctor Account'}
                </button>
              </form>
            )}

            {/* Quick Demo Access Bar */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="text-xs font-bold text-blue-700 dark:text-sky-400 hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Demo: Login as Dr. Tariq (No password needed)</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             DOCTOR COMMAND DASHBOARD & PATIENT APPOINTMENTS QUEUE
             ======================================================== */
          <div className="space-y-6">
            {/* Top Doctor Greeting & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">Consultations Today</p>
                  <p className="text-xl font-black text-stone-900 dark:text-[#FAF7F2]">{totalBookings}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">Urgent Red-Flags</p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">{urgentCount}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">In Waiting Room</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{waitingRoomCount}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-stone-500 uppercase">Completed Cases</p>
                  <p className="text-xl font-black text-stone-900 dark:text-[#FAF7F2]">{completedCount}</p>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#181715] border border-[#DDD7C8] dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search patient pseudonym, booking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-transparent border-none focus:outline-none text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="ALL">All Acuity Tiers</option>
                  <option value="URGENT">Urgent Only</option>
                  <option value="ANDROLOGY_UROLOGY">Andrology Review</option>
                  <option value="FERTILITY_SERVICES">Fertility Pathway</option>
                </select>

                <select
                  value={filterModality}
                  onChange={(e) => setFilterModality(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-none"
                >
                  <option value="ALL">All Modalities</option>
                  <option value="TELEHEALTH_VIDEO">Telehealth Video</option>
                  <option value="IN_PERSON">In-Clinic Visit</option>
                </select>

                <button
                  onClick={fetchBookings}
                  className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBookings ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Patients Appointments Queue */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Scheduled Patients & Triage Records ({filteredBookings.length})
              </h3>

              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 text-xs text-stone-500">
                  No appointments found matching your filters.
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
                            : 'border-[#DDD7C8] dark:border-stone-800'
                        }`}
                      >
                        {/* Left: Patient Info & Clinical Triage */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900 dark:text-[#FAF7F2]">
                              {b.bookingId}
                            </span>
                            <span className="text-xs text-stone-400">•</span>
                            <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                              Patient Ref: {b.pseudonymId}
                            </span>

                            {/* Acuity Tier Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isUrgent
                                  ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-800'
                              }`}
                            >
                              {b.triageTier.replace('_', ' ')}
                            </span>

                            {/* Status Pill */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isWaiting
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 animate-pulse border border-emerald-300'
                                  : isCompleted
                                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {isWaiting ? '● In Waiting Room (Ready)' : b.status}
                            </span>
                          </div>

                          <div className="text-xs text-stone-700 dark:text-[#DDD7C8] leading-relaxed">
                            <p className="font-medium">
                              <strong>Chief Presentation:</strong>{' '}
                              {b.chiefComplaint || 'Male reproductive evaluation & semen parameter screening'}
                            </p>
                          </div>

                          {/* WHO 2021 Reference Parameters Preview */}
                          {b.whoParameters && (
                            <div className="flex flex-wrap items-center gap-3 text-[11px] bg-stone-50 dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
                              <span>
                                <strong>Sperm Conc:</strong> {b.whoParameters.concentration || '16 M/ml (Normal)'}
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Prog. Motility:</strong>{' '}
                                <span className={b.whoParameters.progressiveMotility?.includes('Sub') ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                                  {b.whoParameters.progressiveMotility || '30% (Ref)'}
                                </span>
                              </span>
                              <span>•</span>
                              <span>
                                <strong>Normal Forms:</strong> {b.whoParameters.normalForms || '4% (Ref)'}
                              </span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400">
                            <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-sky-300">
                              <Clock className="w-3.5 h-3.5" />
                              {b.slotTime}
                            </span>
                            <span>
                              {b.consultType === 'TELEHEALTH_VIDEO' ? '📹 Telehealth Video Call' : '🏥 In-Clinic'}
                            </span>
                            {b.contact?.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {b.contact.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Action Buttons (WhatsApp-Style Call & Case Review) */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-200 dark:border-stone-800">
                          {b.consultType === 'TELEHEALTH_VIDEO' && (
                            <Link
                              href={`/telehealth/${b.bookingId}?role=doctor`}
                              target="_blank"
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                            >
                              <Video className="w-4 h-4" />
                              <span>Start WhatsApp Video Call</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBooking(b);
                              setNotesInput(b.clinicalNotes || '');
                              setPrescriptionInput(b.prescription || '');
                            }}
                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#25221E] border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-[#FAF7F2] font-bold text-xs flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                            <span>Clinical Notes / Rx</span>
                          </button>

                          {b.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(b.bookingId, 'COMPLETED')}
                              className="p-2.5 rounded-xl text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
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

        {/* ========================================================
           CLINICAL PRESCRIPTION & NOTES MODAL
           ======================================================== */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in text-left">
            <div className="bg-[#FAF8F5] dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E8E2D5] dark:border-stone-800 flex items-center justify-between bg-[#F4EFE6] dark:bg-[#1F1D1A]">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-700 dark:text-sky-400" />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2]">
                      Clinical Consultation Notes & Prescription
                    </h3>
                    <p className="text-[11px] text-stone-500 font-mono">
                      Ref: {selectedBooking.bookingId} · Patient: {selectedBooking.pseudonymId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-800 dark:text-[#FAF7F2] block mb-1">
                    Physician Impression & Notes
                  </label>
                  <textarea
                    rows={4}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Enter diagnostic impression, ultrasound recommendation, or WHO 2021 review notes..."
                    className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 dark:text-[#FAF7F2] block mb-1">
                    Prescriptions & Laboratory Requisitions
                  </label>
                  <textarea
                    rows={3}
                    value={prescriptionInput}
                    onChange={(e) => setPrescriptionInput(e.target.value)}
                    placeholder="e.g. Scrotal Doppler Ultrasound, Serum Testosterone, Repeat CASA Semen Analysis in 4 weeks."
                    className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-[#F4EFE6] dark:bg-[#1F1D1A] border-t border-[#E8E2D5] dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{savingNotes ? 'Saving...' : 'Finalize & Sign Off Case'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
