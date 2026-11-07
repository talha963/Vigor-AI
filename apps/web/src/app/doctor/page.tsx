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
  Database,
  Network,
} from 'lucide-react';
import Link from 'next/link';
import VigorLogo from '@/components/VigorLogo';
import GraphDbExplorer from '@/components/doctor/GraphDbExplorer';
import PatientHistoryLadder from '@/components/doctor/PatientHistoryLadder';
import DoctorSettingsModal, {
  DoctorSettings,
  DEFAULT_DOCTOR_SETTINGS,
} from '@/components/doctor/DoctorSettingsModal';
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
  patientName?: string;
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
  status: 'Pending' | 'Approved' | 'CONFIRMED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PRESCRIBED' | 'IN_WAITING_ROOM' | 'IN_CALL' | 'COMPLETED' | string;
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

  // Doctor Settings & Identity Customization (e.g. Dr. Ali Khan, Clinic Logo, License)
  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>(DEFAULT_DOCTOR_SETTINGS);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Load persisted doctor settings and sanitize legacy dummy accounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vigor_doctor_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          parsed.fullName &&
          !parsed.fullName.includes('Certified') &&
          !parsed.fullName.includes('Tariq')
        ) {
          setDoctorSettings(parsed);
          return;
        }
      }
      setDoctorSettings(DEFAULT_DOCTOR_SETTINGS);
      localStorage.setItem('vigor_doctor_settings', JSON.stringify(DEFAULT_DOCTOR_SETTINGS));
    } catch (e) {
      setDoctorSettings(DEFAULT_DOCTOR_SETTINGS);
    }
  }, []);

  const handleSaveDoctorSettings = (newSettings: DoctorSettings) => {
    setDoctorSettings(newSettings);
    try {
      localStorage.setItem('vigor_doctor_settings', JSON.stringify(newSettings));
    } catch (e) {
      // ignore
    }
  };

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

  // Navigation / Dedicated Tabs View State
  const [activeSidebarTab, setActiveSidebarTab] = useState<
    'appointments' | 'ladder' | 'review' | 'graphdb' | 'escapements' | 'workflows' | 'consent'
  >('appointments');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterModality, setFilterModality] = useState<'ALL' | 'IN_PERSON' | 'VIDEO' | 'PENDING' | 'APPROVED'>('ALL');
  const [timeframe, setTimeframe] = useState<'1b' | '6M' | '1M' | 'All'>('6M');

  // Interactive Medical History Ladder State
  const [ladderModalOpen, setLadderModalOpen] = useState(false);
  const [ladderQuery, setLadderQuery] = useState('Give me the record of Mansoor');

  // Auth State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('DOH-AUH-2024-9102');
  const [specialtyInput, setSpecialtyInput] = useState('Consultant Andrologist & Male Infertility Microsurgeon');
  const [facilityInput, setFacilityInput] = useState('Cleveland Clinic Abu Dhabi · Andrology Hub');
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

  // Apply authenticated doctor session to UI & settings
  const applyDoctorSession = (doc: DoctorAccount) => {
    const isLegacyDummy =
      !doc.fullName ||
      doc.fullName.includes('Certified') ||
      doc.fullName.includes('Tariq') ||
      doc.fullName.includes('Demo') ||
      Boolean(doc.facility && doc.facility.includes('HealthPlus'));

    const cleanName = isLegacyDummy ? 'Dr. Ali Khan' : doc.fullName;
    const cleanFacility =
      isLegacyDummy || !doc.facility || doc.facility.includes('HealthPlus')
        ? 'Cleveland Clinic Abu Dhabi · Andrology Hub'
        : doc.facility;
    const cleanLicense = isLegacyDummy || !doc.licenseNumber ? 'DOH-AUH-2024-9102' : doc.licenseNumber;
    const cleanTitle =
      isLegacyDummy || !doc.specialty
        ? 'Consultant Andrologist & Male Infertility Microsurgeon'
        : doc.specialty;

    const cleanDoc: DoctorAccount = {
      ...doc,
      fullName: cleanName,
      facility: cleanFacility,
      licenseNumber: cleanLicense,
      specialty: cleanTitle,
    };

    setCurrentDoctor(cleanDoc);
    const updated: DoctorSettings = {
      fullName: cleanName,
      title: cleanTitle,
      dohLicense: cleanLicense,
      facility: cleanFacility,
      location: 'Al Maryah Island, Abu Dhabi',
      avatarIcon: '👨‍⚕️',
      logoUrl: '',
    };
    setDoctorSettings(updated);
    try {
      localStorage.setItem('vigor_doctor_auth_session', JSON.stringify(cleanDoc));
      localStorage.setItem('vigor_doctor_settings', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Load existing session or default to Dr. Ali Khan as primary logged in doctor
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('vigor_doctor_logged_out') === 'true') {
      setCurrentDoctor(null);
      setAuthModalOpen(true);
      return;
    }
    const doc = getCurrentDoctor();
    if (
      doc &&
      !doc.fullName.includes('Certified') &&
      !doc.fullName.includes('Tariq') &&
      !doc.facility?.includes('HealthPlus')
    ) {
      applyDoctorSession(doc);
    } else {
      const defaultDoc: DoctorAccount = {
        uid: 'doc_ali_01',
        email: 'ali.khan@clevelandclinicabudhabi.ae',
        fullName: 'Dr. Ali Khan',
        licenseNumber: 'DOH-AUH-2024-9102',
        specialty: 'Consultant Andrologist & Male Infertility Microsurgeon',
        facility: 'Cleveland Clinic Abu Dhabi · Andrology Hub',
        dohVerified: true,
        role: 'doctor',
        status: 'available',
        createdAt: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('vigor_doctor_auth_session', JSON.stringify(defaultDoc));
      }
      applyDoctorSession(defaultDoc);
    }
  }, []);

  // Fetch live real-time bookings from MongoDB
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

  // Real-time synchronization polling (updates automatically when patient books or status changes)
  useEffect(() => {
    fetchBookings();
    const pollInterval = setInterval(() => {
      fetchBookings();
    }, 4000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput) return;
    setAuthLoading(true);
    setAuthError('');
    const res = await loginDoctorWithFirebase(emailInput, passwordInput || 'demo123456');
    setAuthLoading(false);
    if (res.ok && res.doctor) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vigor_doctor_logged_out');
      }
      applyDoctorSession(res.doctor);
      setAuthModalOpen(false);
      setEmailInput('');
      setPasswordInput('');
    } else {
      setAuthError(res.error || 'Failed to authenticate doctor.');
    }
  };

  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput || !fullNameInput) {
      setAuthError('Please provide your name and email.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const res = await registerDoctorWithFirebase({
      email: emailInput,
      password: passwordInput || 'demo123456',
      fullName: fullNameInput.startsWith('Dr.') ? fullNameInput : `Dr. ${fullNameInput}`,
      licenseNumber: licenseInput,
      specialty: specialtyInput,
      facility: facilityInput,
    });
    setAuthLoading(false);
    if (res.ok && res.doctor) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vigor_doctor_logged_out');
      }
      applyDoctorSession(res.doctor);
      setAuthModalOpen(false);
      setEmailInput('');
      setPasswordInput('');
      setFullNameInput('');
    } else {
      setAuthError(res.error || 'Failed to register doctor.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutDoctor();
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vigor_doctor_logged_out', 'true');
      localStorage.removeItem('vigor_doctor_auth_session');
    }
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

  // Appointment Approval Workflow with Automated Patient Email Notification
  const handleApproveAppointment = async (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.bookingId === bookingId ? { ...b, status: 'Approved' } : b))
    );
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status: 'Approved' }),
      });
      await res.json();
      alert(
        isAr
          ? 'تمت الموافقة على الموعد بنجاح وإرسال إشعار التأكيد الرسمي إلى بريد المريض الإلكتروني.'
          : 'Appointment approved! Official confirmation email dispatched to patient.'
      );
      fetchBookings();
    } catch (e) {
      console.warn('Sync booking approval status:', e);
    }
  };

  // Dispatch Video Room Link Directly to Patient Email
  const handleSendMeetingLink = async (bookingId: string) => {
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action: 'send_meeting_link' }),
      });
      const data = await res.json();
      if (data.emailDispatched) {
        alert(isAr ? 'تم إرسال رابط مكالمة الفيديو المباشر إلى بريد المريض.' : 'Live meeting room URL dispatched to patient email.');
      } else {
        copyPatientLink(bookingId);
        alert(isAr ? 'تم نسخ رابط غرفة الفيديو إلى الحافظة.' : 'Meeting room URL copied to clipboard.');
      }
    } catch (e) {
      console.warn('Failed to email meeting link:', e);
    }
  };

  // Open Interactive Patient Medical History Ladder
  const openPatientLadder = (patientQuery: string) => {
    setLadderQuery(patientQuery);
    setLadderModalOpen(true);
  };

  // Choice 1: Prescribe Patient & Send Email Report State
  const [emailModalPatient, setEmailModalPatient] = useState<PatientBooking | null>(null);
  const [patientEmailInput, setPatientEmailInput] = useState('');
  const [prescribeDiagnosis, setPrescribeDiagnosis] = useState('');
  const [prescribeRxText, setPrescribeRxText] = useState('');
  const [prescribeLabOrders, setPrescribeLabOrders] = useState<string[]>([]);
  const [prescribeNotes, setPrescribeNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<{ message: string; email: string } | null>(null);

  const openPrescribeEmailModal = (patient: PatientBooking) => {
    setEmailModalPatient(patient);
    setPatientEmailInput(patient.contact?.email || '');
    const defaultDx =
      patient.clinicalNotes ||
      patient.chiefComplaint ||
      (patient.triageTier === 'URGENT'
        ? 'Acute Andrology Urgent Review'
        : 'Clinical Andrology Consultation & Diagnostic Review');
    setPrescribeDiagnosis(defaultDx);
    setPrescribeRxText(
      patient.prescription ||
        `1. Clinical Consultation & Diagnostic Evaluation for ${patient.patientName || `Patient #${patient.pseudonymId.slice(-6)}`}.\n2. Baseline Endocrine Serum Panel (FSH/LH/Testosterone).\n3. Standard lifestyle & antioxidant protocol.\n4. Follow-up review scheduled.`
    );
    setPrescribeLabOrders(
      patient.labOrders || [
        'Bilateral Scrotal Doppler Ultrasound',
        'Serum Endocrine Profile (Total Testosterone, FSH, LH)',
        'Repeat CASA Semen Analysis',
      ]
    );
    setPrescribeNotes(
      patient.clinicalNotes ||
        `Patient reviewed and approved by ${doctorSettings.fullName}. Follow-up scheduled.`
    );
    setEmailSentSuccess(null);
  };

  const handleDispatchPrescriptionEmail = async () => {
    if (!emailModalPatient) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/doctor/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: emailModalPatient.bookingId,
          patientEmail: patientEmailInput.trim(),
          patientName: `Patient #${emailModalPatient.pseudonymId.slice(-6)}`,
          doctorName: doctorSettings.fullName,
          doctorTitle: doctorSettings.title,
          doctorLicense: doctorSettings.dohLicense,
          facilityName: doctorSettings.facility,
          facilityLocation: doctorSettings.location,
          diagnosis: prescribeDiagnosis,
          prescriptionText: prescribeRxText,
          labOrders: prescribeLabOrders,
          clinicalNotes: prescribeNotes,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.bookingId === emailModalPatient.bookingId
              ? {
                  ...b,
                  status: 'COMPLETED',
                  clinicalNotes: prescribeNotes,
                  prescription: prescribeRxText,
                  labOrders: prescribeLabOrders,
                  contact: { ...b.contact, email: patientEmailInput.trim() },
                }
              : b
          )
        );
        setEmailSentSuccess({
          message: data.message || 'Prescription report successfully dispatched to patient email!',
          email: data.recipientEmail,
        });
        setTimeout(() => {
          setEmailModalPatient(null);
          setEmailSentSuccess(null);
        }, 1800);
      } else {
        alert(data.error || 'Failed to dispatch email prescription.');
      }
    } catch (err) {
      alert('Network error while dispatching prescription email.');
    } finally {
      setSendingEmail(false);
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

    // Status & Modality check
    const isApproved = b.status === 'Approved' || b.status === 'APPROVED' || b.status === 'COMPLETED' || b.status === 'CONFIRMED';
    const isPending = b.status === 'Pending' || b.status === 'PENDING' || b.status === 'PENDING_APPROVAL';

    if (filterModality === 'IN_PERSON' && b.consultType !== 'IN_PERSON') return false;
    if (filterModality === 'VIDEO' && b.consultType !== 'TELEHEALTH_VIDEO') return false;
    if (filterModality === 'PENDING' && !isPending) return false;
    if (filterModality === 'APPROVED' && !isApproved) return false;

    const query = searchQuery.trim().toLowerCase();
    const searchTarget = `${b.patientName || ''} ${(b as any).contact?.name || ''} ${(b as any).contact?.email || ''} ${b.pseudonymId || ''} ${b.bookingId || ''} ${b.chiefComplaint || ''}`.toLowerCase();
    const matchesSearch = query === '' || searchTarget.includes(query);
    const matchesTier = filterTier === 'ALL' || b.triageTier === filterTier;

    return matchesSearch && matchesTier;
  });

  const urgentPatients = bookings.filter(
    (b) => b.triageTier === 'URGENT' || (b.redFlags && b.redFlags.length > 0)
  );

  const liveVideoBooking =
    bookings.find(
      (b) =>
        b.consultType === 'TELEHEALTH_VIDEO' &&
        (b.status === 'Approved' || b.status === 'APPROVED' || b.status === 'CONFIRMED')
    ) || bookings.find((b) => b.consultType === 'TELEHEALTH_VIDEO');
  const telehealthLiveUrl = liveVideoBooking
    ? `/telehealth/${liveVideoBooking.bookingId}?role=doctor`
    : `/telehealth/live?role=doctor`;

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
        <div className="absolute top-2/3 -right-48 w-[600px] h-[600px] rounded-full bg-[#E5DFCF]/40 dark:stone-900/20 blur-3xl" />
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
            </nav>

            {/* Right: TELEHEALTH LIVE Pill, Switches & Doctor Profile */}
            <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5 whitespace-nowrap">
              {/* TELEHEALTH LIVE Pill Button (Dynamic Live Meeting URL) */}
              <Link
                href={telehealthLiveUrl}
                target="_blank"
                className="shrink-0 group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-[10px] font-bold tracking-[0.18em] uppercase transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="w-2 h-2 rounded-full bg-[#00A884] animate-pulse" />
                <span className="hidden xs:inline">TELEHEALTH LIVE</span>
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
                className="shrink-0 relative p-1.5 sm:p-2 rounded-full bg-white/70 dark:bg-stone-900/70 border border-[#DDD7C8] dark:border-stone-700 text-[#6B6355] dark:text-[#DDD7C8] shadow-2xs cursor-pointer hover:border-stone-400 transition-colors"
                title={`${urgentPatients.length} Urgent Escapement${urgentPatients.length === 1 ? '' : 's'} Active`}
              >
                <Bell className="w-3.5 h-3.5" />
                {urgentPatients.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B71C1C] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {urgentPatients.length}
                  </span>
                )}
              </button>

              {/* Settings Pill Button */}
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-[10px] font-bold uppercase tracking-wider text-[#5A544A] dark:text-[#DDD7C8] hover:border-stone-400 dark:hover:border-stone-500 hover:bg-white dark:hover:bg-stone-800 transition-all shadow-2xs"
                title="Customize Doctor Profile, Logo & DoH License"
              >
                <Sliders className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span className="hidden md:inline">{isAr ? 'الإعدادات' : 'Settings'}</span>
              </button>

              {/* Logout Pill Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-rose-300 hover:bg-red-100 dark:hover:bg-red-900/60 hover:border-red-300 transition-all shadow-2xs active:scale-95"
                title={isAr ? 'تسجيل الخروج من البوابة' : 'Log Out Clinician Session'}
              >
                <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-rose-400" />
                <span>{isAr ? 'خروج' : 'Logout'}</span>
              </button>

              {/* Clinician Profile Avatar & Name */}
              <div
                onClick={() => setSettingsModalOpen(true)}
                className="shrink-0 flex items-center gap-2 pl-2 border-l border-[#DDD7C8] dark:border-stone-700 cursor-pointer group"
                title="Customize Doctor Profile & Logo"
              >
                <div className="w-8 h-8 rounded-full bg-[#2A2724] dark:bg-stone-800 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-stone-300 dark:border-stone-600 group-hover:scale-105 transition-transform shrink-0">
                  {doctorSettings.avatarIcon || '👨‍⚕️'}
                </div>
                <div className="hidden sm:flex flex-col text-left rtl:text-right max-w-[120px] md:max-w-[150px] lg:max-w-[170px]">
                  <span className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] leading-tight truncate">
                    {doctorSettings.fullName}
                  </span>
                  <span className="text-[9px] text-[#8A8172] dark:text-stone-400 truncate">
                    {doctorSettings.facility.split('·')[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. CRITICAL EMERGENCY WARNING BANNER (Only renders when real urgent cases exist)
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
                  Clinical Emergency Warning: {urgentPatients.length} {urgentPatients.length === 1 ? 'Patient requires' : 'Patients require'} immediate review.
                </span>
                <span className="hidden lg:inline text-xs text-rose-200 ml-2">
                  (Deterministic Red-Flag Escalation · Physician Review Required)
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

            {/* Menu Item 1: Appointments Check & Approval Queue (Default) */}
            <div
              onClick={() => setActiveSidebarTab('appointments')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'appointments'
                  ? 'bg-stone-100/90 dark:bg-stone-800/80 border border-stone-300/80 dark:border-stone-700 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'appointments'
                    ? 'bg-emerald-600 border-white dark:border-[#1C1A17] ring-4 ring-emerald-500/25 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-emerald-600'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  {isAr ? 'فحص المواعيد' : 'Appointments Check'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  {bookings.filter((b) => b.status === 'Pending' || b.status === 'PENDING' || b.status === 'PENDING_APPROVAL').length} Pending
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Review, approve patient appointments, and launch live video rooms.
              </p>
            </div>

            {/* Menu Item 2: Patient Medical History Ladder (Natural Language Query) */}
            <div
              onClick={() => setActiveSidebarTab('ladder')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'ladder'
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'ladder'
                    ? 'bg-emerald-600 border-white dark:border-[#1C1A17] ring-4 ring-emerald-500/25 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-emerald-600'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  {isAr ? 'سجل المريض (بحث لغوي)' : 'Patient History (NL)'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">
                  NL Ladder
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Natural language query (&quot;Give me the record of ALI&quot;) &amp; timeline ladder.
              </p>
            </div>

            {/* Menu Item 3: Clinical Review & Malaffi Rx */}
            <div
              onClick={() => setActiveSidebarTab('review')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'review'
                  ? 'bg-teal-50/90 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'review'
                    ? 'bg-teal-600 border-white dark:border-[#1C1A17] ring-4 ring-teal-500/25 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-teal-600'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  {isAr ? 'المراجعة السريرية' : 'WHO Review & Rx'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-bold">
                  WHO 2021
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Human-in-the-loop review for CASA motility &amp; DoH e-prescriptions.
              </p>
            </div>

            {/* Menu Item 4: Physical Visit GraphDB (SPARQL & Turtle) */}
            <div
              onClick={() => setActiveSidebarTab('graphdb')}
              className={`relative cursor-pointer group p-3 rounded-2xl transition-all ${
                activeSidebarTab === 'graphdb'
                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 shadow-2xs'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
              }`}
            >
              {/* Circular Anchor Node sitting on the curve */}
              <div
                className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  activeSidebarTab === 'graphdb'
                    ? 'bg-amber-600 border-white dark:border-[#1C1A17] ring-4 ring-amber-500/25 scale-110'
                    : 'bg-[#DDD7C8] dark:bg-stone-700 border-white dark:border-[#1C1A17] group-hover:bg-amber-600'
                }`}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                  Physical GraphDB
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold">
                  SPARQL 1.1
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Longitudinal physical history, Doppler imaging &amp; W3C Turtle explorer.
              </p>
            </div>

            {/* Menu Item 5: Patient Escapements */}
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
                  {isAr ? 'الحالات العاجلة' : 'Patient Escapements'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-[#B71C1C] dark:text-rose-300 font-bold">
                  {urgentPatients.length} Urgent
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Urgent deterministic red flags requiring physician override.
              </p>
            </div>

            {/* Menu Item 6: Active Workflows */}
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
                  {isAr ? 'سير العمل' : 'Active Workflows'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-[#6B6355] dark:text-[#DDD7C8] font-bold border border-stone-200 dark:border-stone-700">
                  11 Workflows
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400 mt-1 leading-tight">
                Autonomous screening, red-flag triage, and lab dispatch loops.
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
            <p className="text-[11px] text-[#8A8172] dark:text-stone-400 leading-relaxed font-mono">
              {doctorSettings.fullName} · {doctorSettings.dohLicense}
            </p>
            <p className="text-[10px] text-[#8A8172] dark:text-stone-400">
              {doctorSettings.facility}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 w-full py-1.5 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-rose-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-rose-400" />
              <span>{isAr ? 'تسجيل الخروج' : 'Log Out Clinician'}</span>
            </button>
          </div>
        </aside>

        {/* ========================================================
            4. MAIN DASHBOARD AREA (Clinician Review Console)
            ======================================================== */}
        <main className="lg:col-span-9 space-y-6">
          {/* ========================================================
              DEDICATED TOP TAB NAVIGATION BAR
              ======================================================== */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#EBE7DF] dark:border-stone-800 no-scrollbar">
            {/* Tab 1: Appointments Check */}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('appointments')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeSidebarTab === 'appointments'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-900/80 text-[#6B6355] dark:text-stone-300 hover:bg-[#EFECE3] dark:hover:bg-stone-800 border border-[#EBE7DF] dark:border-stone-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'فحص المواعيد' : 'Appointments Check'}</span>
              {bookings.filter((b) => b.status === 'Pending' || b.status === 'PENDING' || b.status === 'PENDING_APPROVAL').length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500 text-white font-bold">
                  {bookings.filter((b) => b.status === 'Pending' || b.status === 'PENDING' || b.status === 'PENDING_APPROVAL').length}
                </span>
              )}
            </button>

            {/* Tab 2: Patient History & Natural Language Query */}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('ladder')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeSidebarTab === 'ladder'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-900/80 text-[#6B6355] dark:text-stone-300 hover:bg-[#EFECE3] dark:hover:bg-stone-800 border border-[#EBE7DF] dark:border-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'سجل المريض (بحث لغوي)' : 'Patient History (NL Query)'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                NL Ladder
              </span>
            </button>

            {/* Tab 3: WHO Clinical Review & Rx */}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('review')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeSidebarTab === 'review'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-900/80 text-[#6B6355] dark:text-stone-300 hover:bg-[#EFECE3] dark:hover:bg-stone-800 border border-[#EBE7DF] dark:border-stone-800'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'المراجعة السريرية والوصفة' : 'WHO Review & Rx'}</span>
            </button>

            {/* Tab 4: Physical Visit GraphDB */}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('graphdb')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeSidebarTab === 'graphdb'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-900/80 text-[#6B6355] dark:text-stone-300 hover:bg-[#EFECE3] dark:hover:bg-stone-800 border border-[#EBE7DF] dark:border-stone-800'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'قاعدة الرسم البياني للزيارة' : 'Physical GraphDB'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                SPARQL
              </span>
            </button>

            {/* Tab 5: Urgent Escapements */}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('escapements')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeSidebarTab === 'escapements'
                  ? 'bg-[#B71C1C] text-white shadow-sm scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-900/80 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-red-200 dark:border-red-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? 'الحالات العاجلة' : 'Urgent Escapements'}</span>
              {urgentPatients.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white text-[#B71C1C] font-bold">
                  {urgentPatients.length}
                </span>
              )}
            </button>

            {/* Tab 6: Active Workflows */}
            <button
              type="button"
              onClick={() => setActiveSidebarTab('workflows')}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                activeSidebarTab === 'workflows'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm scale-[1.02]'
                  : 'bg-white/80 dark:bg-stone-900/80 text-[#6B6355] dark:text-stone-300 hover:bg-[#EFECE3] dark:hover:bg-stone-800 border border-[#EBE7DF] dark:border-stone-800'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>{isAr ? 'سير العمل النشط' : 'Active Workflows'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border border-stone-300 dark:border-stone-700">
                11
              </span>
            </button>
          </div>

          {activeSidebarTab === 'graphdb' ? (
            <GraphDbExplorer currentDoctorName={doctorSettings.fullName} bookings={bookings} locale={locale} />
          ) : activeSidebarTab === 'ladder' ? (
            <PatientHistoryLadder bookings={bookings} locale={locale} initialQuery={ladderQuery} />
          ) : activeSidebarTab === 'workflows' ? (
            <div className="space-y-6">
              <div className="bg-white/80 dark:bg-[#1C1A17]/85 backdrop-blur-md rounded-3xl p-8 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Autonomous Clinical Engine
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    11 Workflows Operational
                  </span>
                </div>
                <h2 className="font-editorial-serif text-3xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  {isAr ? 'خطوط الأتمتة السريرية النشطة' : 'Active Clinical Automation Workflows'}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6355] dark:text-stone-400 max-w-2xl leading-relaxed">
                  Autonomous n8n micro-pipelines enforcing deterministic zero-account triage, instantaneous
                  patient booking confirmation emails, clinician one-click approval, WebRTC room generation, and DoH Malaffi ledger sync.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'wf_01',
                    name: 'Bilingual Intake & Pseudonym Derivation',
                    endpoint: 'POST /webhook/vigor/intake',
                    status: 'Active',
                    trigger: 'Patient Form Submission',
                    desc: 'HMAC-SHA256 salted pseudonymous ID psn_ generation with zero PII exposure.',
                  },
                  {
                    id: 'wf_02',
                    name: 'WHO 2021 Semen Analysis & Triage Floor',
                    endpoint: 'POST /webhook/vigor/triage',
                    status: 'Active',
                    trigger: 'Automated Diagnostic Engine',
                    desc: '16 deterministic red flag gates with non-negotiable emergency hospital escalation.',
                  },
                  {
                    id: 'wf_03',
                    name: 'Consultation Booking & Email Dispatch',
                    endpoint: 'POST /webhook/vigor/appointment-booked',
                    status: 'Active',
                    trigger: 'Patient Appointment Request',
                    desc: 'Immediate automated "Appointment Request Received" email with ICS calendar event.',
                  },
                  {
                    id: 'wf_04',
                    name: 'Clinician One-Click Approval Automation',
                    endpoint: 'POST /webhook/vigor/appointment-approved',
                    status: 'Active',
                    trigger: 'Doctor Approve Button',
                    desc: 'Instant official "Appointment Approved" confirmation email sent to patient with video link.',
                  },
                  {
                    id: 'wf_05',
                    name: 'WebRTC Telehealth Room Dispatch',
                    endpoint: 'POST /webhook/vigor/telehealth-dispatch',
                    status: 'Active',
                    trigger: 'Doctor Room Activation',
                    desc: 'Dynamic room URL generation, peer notification, and secure in-call chat encryption.',
                  },
                  {
                    id: 'wf_06',
                    name: 'CASA Semen Analysis Ingestion',
                    endpoint: 'POST /webhook/vigor/lab-dispatch',
                    status: 'Active',
                    trigger: 'Laboratory Micro-Hub',
                    desc: 'Computer-assisted sperm motility tracking (PR/NP/IM) & WHO 2021 reference comparison.',
                  },
                  {
                    id: 'wf_07',
                    name: 'DoH Malaffi Consent Ledger & Receipt',
                    endpoint: 'POST /webhook/vigor/consent-ledger',
                    status: 'Active',
                    trigger: 'Patient Consent Grant',
                    desc: 'Zero-PII cryptographically signed Abu Dhabi Health Data Law receipt generation.',
                  },
                  {
                    id: 'wf_08',
                    name: 'Emergency Escapement SLA Timer',
                    endpoint: 'CRON */1 * * * *',
                    status: 'Active',
                    trigger: 'Deterministic Clock',
                    desc: '60-minute SLA countdown monitoring. Auto-escalation to SSMC on-call urology.',
                  },
                  {
                    id: 'wf_09',
                    name: 'Physical Visit Doppler GraphDB Sync',
                    endpoint: 'POST /webhook/vigor/graphdb-sync',
                    status: 'Active',
                    trigger: 'Clinical Imaging Upload',
                    desc: 'W3C Turtle ontology & SPARQL 1.1 synchronized graph for scrotal Doppler reports.',
                  },
                  {
                    id: 'wf_10',
                    name: 'Automated ICS Calendar Generation',
                    endpoint: 'POST /webhook/vigor/calendar-invite',
                    status: 'Active',
                    trigger: 'Booking Confirmation',
                    desc: 'Standards-compliant iCalendar (.ics) generation with time-zone normalization (GST).',
                  },
                  {
                    id: 'wf_11',
                    name: 'Sovereign Right to Erasure & Revocation',
                    endpoint: 'POST /webhook/vigor/consent-revoke',
                    status: 'Active',
                    trigger: 'Patient Revoke Action',
                    desc: 'Immediate irreversible cryptographic session erasure and collection purging.',
                  },
                ].map((wf) => (
                  <div
                    key={wf.id}
                    className="p-5 rounded-2xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">
                        {wf.id.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                        {wf.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1A1816] dark:text-[#FAF7F2] leading-snug">
                      {wf.name}
                    </h4>
                    <p className="text-[11px] text-[#6B6355] dark:text-stone-400 leading-relaxed">
                      {wf.desc}
                    </p>
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[10px] font-mono text-stone-500">
                      <span className="truncate max-w-[170px]">{wf.endpoint}</span>
                      <span className="font-bold text-stone-700 dark:text-stone-300">{wf.trigger}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
          {/* Header Banner: Appointments Check or Clinical Review */}
          <div className="bg-white/80 dark:bg-[#1C1A17]/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] relative overflow-hidden space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-[#C8E6C9] dark:border-emerald-800 text-[10px] font-black uppercase tracking-[0.2em] text-[#1B5E20] dark:text-emerald-300 shadow-2xs">
                  {activeSidebarTab === 'review'
                    ? 'Autonomous WHO 2021 CASA & Deterministic Triage Gateway'
                    : 'Real-Time Consultation & Telehealth Gateway'}
                </span>

                <h1 className="font-editorial-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#1A1816] dark:text-[#FAF7F2] leading-[1.14]">
                  {activeSidebarTab === 'review'
                    ? 'WHO 2021 CASA Clinical Review & Malaffi Rx'
                    : isAr
                    ? 'فحص المواعيد وقائمة الاستشارات المباشرة'
                    : 'Appointments Check & Consultations Queue'}
                </h1>

                <p className="text-xs sm:text-sm text-[#6B6355] dark:text-stone-400 max-w-xl leading-relaxed">
                  {activeSidebarTab === 'review'
                    ? 'Review asynchronous WHO 2021 CASA semen analysis parameters, override risk bands with clinical notes, and issue Malaffi e-prescriptions.'
                    : isAr
                    ? 'مراجعة المواعيد الواردة، الموافقة الفورية بنقرة واحدة مع إرسال بريد إلكتروني، وإطلاق استشارات الفيديو.'
                    : 'Review incoming patient appointments, approve bookings with one click to trigger confirmation emails, and start live video consultations.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchBookings}
                  className="px-3.5 py-2 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-bold text-[#1A1816] dark:text-white flex items-center gap-1.5 shadow-2xs transition-all"
                  title="Real-time sync with database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isAr ? 'تحديث' : 'Refresh'}</span>
                </button>
                {displayedPatients[0] && (
                  <button
                    type="button"
                    onClick={() => openReviewModal(displayedPatients[0])}
                    className="px-5 py-2 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <span>Launch WHO Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================
              ANALYTICS & REAL-TIME PARAMETER CARDS (Calculated directly from live database)
              ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Patients Queue */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400 block">
                Total Queue
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  {bookings.length}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  Live DB
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                {bookings.length === 1 ? '1 active patient booking registered.' : `${bookings.length} active patient bookings registered.`}
              </p>
            </div>

            {/* Metric 2: Pending Approval */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Pending Approval
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {bookings.filter((b) => b.status === 'Pending' || b.status === 'PENDING' || b.status === 'PENDING_APPROVAL').length}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold">
                  Review
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Awaiting physician review &amp; confirmation.
              </p>
            </div>

            {/* Metric 3: Telehealth Video Consultations */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-sky-400 block">
                Video Consultations
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-blue-700 dark:text-sky-400">
                  {bookings.filter((b) => b.consultType === 'TELEHEALTH_VIDEO').length}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-sky-300 font-bold">
                  Telehealth
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Remote WebRTC video consultations.
              </p>
            </div>

            {/* Metric 4: Approved & Completed */}
            <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1C1A17]/90 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Approved &amp; Active
              </span>
              <div className="flex items-center justify-between">
                <span className="font-editorial-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {bookings.filter((b) => b.status === 'Approved' || b.status === 'APPROVED' || b.status === 'CONFIRMED' || b.status === 'COMPLETED').length}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold">
                  Confirmed
                </span>
              </div>
              <p className="text-[11px] text-[#8A8172] dark:text-stone-400">
                Approved appointments and active sessions.
              </p>
            </div>
          </div>

          {/* ========================================================
              CENTRAL GRID OF PATIENT CARDS AWAITING ASYNC REVIEW
              (With WHO 2021 Semen Analysis Simulator Metrics & Sparklines)
              ======================================================== */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EBE7DF] dark:border-stone-800">
              <div className="flex items-center gap-3">
                <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                  Patient Queue &amp; Consultations ({displayedPatients.length} Active)
                </h3>
                <button
                  type="button"
                  onClick={fetchBookings}
                  className="p-1.5 rounded-full border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-all shadow-2xs"
                  title="Real-time sync with database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>

              {/* Natural Language History Ladder Quick Trigger & Timeframe */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPatientLadder('Give me the record of ALI')}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-emerald-100 transition-all group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>{isAr ? 'سلم التاريخ الطبي (بحث)' : 'Patient History Ladder'}</span>
                </button>

                <div className="flex items-center gap-1 p-1 rounded-full bg-white dark:bg-stone-900 border border-[#E5E0D5] dark:border-stone-700 text-xs font-bold shadow-2xs">
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
            </div>

            {/* Filter Tabs: All, In-Person, Video Consultations, Pending, Approved */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFilterModality('ALL')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all ${
                  filterModality === 'ALL'
                    ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#141311] shadow-2xs'
                    : 'bg-white dark:bg-[#1E1C1A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                {isAr ? 'جميع المواعيد' : 'All Appointments'} ({bookings.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterModality('VIDEO')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  filterModality === 'VIDEO'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-[#1E1C1A] text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-900/60 hover:border-blue-300'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isAr ? 'استشارات الفيديو عن بُعد' : 'Video Consultations 📹'}</span>
                <span className="opacity-75 font-mono text-[10px]">
                  ({bookings.filter((b) => b.consultType === 'TELEHEALTH_VIDEO').length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterModality('IN_PERSON')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  filterModality === 'IN_PERSON'
                    ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#141311] shadow-2xs'
                    : 'bg-white dark:bg-[#1E1C1A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'زيارات حضورية' : 'In-Person Visits'}</span>
                <span className="opacity-75 font-mono text-[10px]">
                  ({bookings.filter((b) => b.consultType === 'IN_PERSON').length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterModality('PENDING')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  filterModality === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-[#1E1C1A] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:border-amber-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isAr ? 'بانتظار الموافقة' : 'Pending Approval'}</span>
                <span className="opacity-75 font-mono text-[10px]">
                  ({bookings.filter((b) => b.status === 'Pending' || b.status === 'PENDING' || b.status === 'PENDING_APPROVAL').length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterModality('APPROVED')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  filterModality === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-[#1E1C1A] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'معتمد' : 'Approved'}</span>
                <span className="opacity-75 font-mono text-[10px]">
                  ({bookings.filter((b) => b.status === 'Approved' || b.status === 'APPROVED' || b.status === 'CONFIRMED').length})
                </span>
              </button>
            </div>

            {displayedPatients.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1C1A17] rounded-3xl border border-[#EBE7DF] dark:border-stone-800 text-xs text-[#8A8172] dark:text-stone-400 shadow-2xs space-y-2">
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  {isAr ? 'لا توجد مواعيد في هذا القسم حالياً' : 'No patient appointments in this queue.'}
                </p>
                <p className="text-[11px] text-stone-500">
                  {isAr
                    ? 'عندما يقوم أي مريض بحجز استشارة حضورية أو مكالمة فيديو من البوابة، ستظهر فوراً هنا للمراجعة والموافقة.'
                    : 'When patients book an in-person or video consultation from the patient portal, requests appear here immediately for clinician review and approval.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedPatients.map((patient) => {
                  const isUrgent =
                    patient.triageTier === 'URGENT' ||
                    (patient.redFlags && patient.redFlags.length > 0);
                  const isApproved =
                    patient.status === 'Approved' ||
                    patient.status === 'APPROVED' ||
                    patient.status === 'CONFIRMED' ||
                    patient.status === 'COMPLETED';
                  const isPrescribed = patient.status === 'COMPLETED' || !!patient.prescription;
                  const isVideo = patient.consultType === 'TELEHEALTH_VIDEO';
                  const displayName =
                    patient.patientName ||
                    (patient as any).contact?.name ||
                    `Patient #${patient.pseudonymId.slice(-7)}`;

                  return (
                    <div
                      key={patient.bookingId}
                      className="bg-white/95 dark:bg-[#1C1A17]/95 rounded-3xl p-6 border border-[#EBE7DF] dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-lg transition-all space-y-5 flex flex-col justify-between"
                    >
                      {/* Top Patient Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] dark:bg-stone-800 flex items-center justify-center text-xl font-bold shadow-2xs border border-[#EAE5D9] dark:border-stone-700">
                            {isUrgent ? '🚨' : isVideo ? '📹' : '🧑'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-editorial-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2] leading-tight">
                                {displayName}
                              </h4>
                              {/* Status Badge */}
                              {isPrescribed ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                                  ✓ Rx Dispatched
                                </span>
                              ) : isApproved ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                                  ✓ Approved
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300">
                                  ● Pending Approval
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#8A8172] dark:text-stone-400 font-mono mt-0.5">
                              Ref: {patient.bookingId} ·{' '}
                              <span className={isVideo ? 'text-blue-600 dark:text-sky-400 font-bold' : 'text-stone-600 dark:text-stone-300'}>
                                {isVideo ? '📹 Telehealth Video' : '🏥 In-Person Visit'}
                              </span>
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

                      {/* Chief Complaint & Scheduled Time */}
                      <div className="p-3.5 rounded-2xl bg-[#F9F8F6] dark:bg-stone-900/60 border border-[#EFECE3] dark:border-stone-800 text-xs text-[#4A453C] dark:text-stone-300 leading-relaxed space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#1A1816] dark:text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            <span>🗓️ {patient.slotTime || 'Scheduled Slot'}</span>
                          </span>
                          {patient.contact?.email && (
                            <span className="text-[10px] text-blue-700 dark:text-sky-400 font-mono truncate max-w-[160px]">
                              ✉️ {patient.contact.email}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-stone-400">
                          {patient.chiefComplaint ||
                            'Clinical consultation request for comprehensive semen analysis evaluation.'}
                        </p>
                      </div>

                      {/* Real-time Consultation & Lab Parameter Blocks */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900/50 border border-[#EBE7DF] dark:border-stone-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400">
                              {patient.whoParameters?.concentration ? 'Sperm Count' : 'Modality'}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              patient.whoParameters?.concentration
                                ? 'bg-[#E8F5E9] dark:bg-emerald-950/80 text-[#1B5E20] dark:text-emerald-300 border border-emerald-200'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                            }`}>
                              {patient.whoParameters?.concentration ? 'Normal' : isVideo ? 'Telehealth' : 'In-Person'}
                            </span>
                          </div>
                          <div className="font-editorial-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2] truncate">
                            {patient.whoParameters?.concentration || (isVideo ? 'Live Video Room' : 'Facility Visit')}
                          </div>
                          <span className="text-[10px] text-[#8A8172] dark:text-stone-400 block truncate">
                            {patient.whoParameters?.concentration ? 'Ref: ≥15 M/ml' : patient.facility?.name || 'Cleveland Clinic AD'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-stone-900/50 border border-[#EBE7DF] dark:border-stone-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8172] dark:text-stone-400">
                              {patient.whoParameters?.progressiveMotility ? 'Prog Motility' : 'Acuity / Tier'}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isUrgent
                                ? 'bg-[#FFEBEE] dark:bg-red-950/80 text-[#C62828] dark:text-rose-300 border border-red-200'
                                : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                            }`}>
                              {patient.whoParameters?.progressiveMotility ? 'Flagged' : patient.triageTier}
                            </span>
                          </div>
                          <div className={`font-editorial-serif text-lg font-bold truncate ${isUrgent ? 'text-[#C62828] dark:text-rose-400' : 'text-[#1A1816] dark:text-[#FAF7F2]'}`}>
                            {patient.whoParameters?.progressiveMotility || (isUrgent ? 'Urgent Review' : 'Standard Routine')}
                          </div>
                          <span className="text-[10px] text-[#8A8172] dark:text-stone-400 block truncate">
                            {patient.whoParameters?.progressiveMotility ? 'Sub-ref: <32%' : 'DoH Protocol Compliant'}
                          </span>
                        </div>
                      </div>

                      {/* Primary Actions on Card */}
                      <div className="pt-2 space-y-2.5">
                        {!isApproved && !isPrescribed ? (
                          /* Step 1: Doctor Approves Appointment (Sends Automated Approval Email) */
                          <button
                            type="button"
                            onClick={() => handleApproveAppointment(patient.bookingId)}
                            className="w-full py-3 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isVideo ? 'Approve Video Consultation' : 'Approve In-Person Appointment'}
                            </span>
                          </button>
                        ) : (
                          /* Step 2: Doctor Actions (Start Video Call / Email Link / Prescribe) */
                          <div className="space-y-2 border-t border-[#EBE7DF] dark:border-stone-800 pt-2.5">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#6B6355] dark:text-stone-400">
                              <span>Approved Consultation Actions:</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {isVideo ? (
                                <>
                                  {/* Choice A: Start Video Call */}
                                  <Link
                                    href={`/telehealth/${patient.bookingId}?role=doctor`}
                                    target="_blank"
                                    className="py-2.5 px-3.5 rounded-full bg-[#1A1816] hover:bg-black dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] font-black text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                                  >
                                    <Video className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                                    <span>Start Video Call</span>
                                  </Link>

                                  {/* Choice B: Email Meeting Link to Patient */}
                                  <button
                                    type="button"
                                    onClick={() => handleSendMeetingLink(patient.bookingId)}
                                    className="py-2.5 px-3.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-sky-300 text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                                    <span>Email Link</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* In-Person Choice A: Prescribe & Send Email */}
                                  <button
                                    type="button"
                                    onClick={() => openPrescribeEmailModal(patient)}
                                    className="py-2.5 px-3.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Prescribe & Email</span>
                                  </button>

                                  {/* In-Person Choice B: Physical GraphDB */}
                                  <button
                                    type="button"
                                    onClick={() => setActiveSidebarTab('graphdb')}
                                    className="py-2.5 px-3.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 text-xs font-bold uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Physical Graph</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactive Medical History Ladder & WHO Review Row */}
                        <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() => openPatientLadder(`Give me the record of ${displayName}`)}
                            className="flex-1 py-2 px-3 rounded-full bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>History Ladder</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openReviewModal(patient)}
                            className="flex-1 py-2 px-3 rounded-full border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-[#6B6355] dark:text-stone-300 text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5"
                          >
                            <span>WHO Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => copyPatientLink(patient.bookingId)}
                            className="p-2 rounded-full border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-[#6B6355] dark:text-stone-300 transition-colors"
                            title="Copy Consultation URL"
                          >
                            {copiedBookingId === patient.bookingId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
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
                    {doctorSettings.fullName} ({doctorSettings.dohLicense})
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

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setSettingsModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-full border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Clinic Settings & Logo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-full border border-red-300 dark:border-red-900 text-red-700 dark:text-rose-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out Clinician Session</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Tabs: Sign In / Register */}
                <div className="flex rounded-full bg-stone-100 dark:bg-stone-900 p-1 border border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-stone-800 text-[#1A1816] dark:text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Doctor Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-stone-800 text-[#1A1816] dark:text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Register Clinician
                  </button>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-rose-300 text-[11px]">
                    {authError}
                  </div>
                )}

                {authMode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                        Doctor Email:
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. ali.khan@clevelandclinicabudhabi.ae"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                        Password:
                      </label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-2.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] font-bold uppercase tracking-wider text-xs shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {authLoading ? 'Signing In...' : 'Sign In to Doctor Portal'}
                    </button>

                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          setAuthLoading(true);
                          const res = await loginDoctorWithFirebase('ali.khan@clevelandclinicabudhabi.ae', 'demo123456');
                          setAuthLoading(false);
                          if (res.ok && res.doctor) {
                            applyDoctorSession(res.doctor);
                            setAuthModalOpen(false);
                          }
                        }}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        ⚡ 1-Click Access as Dr. Ali Khan (Cleveland Clinic AD)
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-0.5">
                        Clinician Name:
                      </label>
                      <input
                        type="text"
                        required
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        placeholder="e.g. Dr. Ali Khan"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-0.5">
                        Email Address:
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="doctor@hospital.ae"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-0.5">
                        Hospital / Clinic:
                      </label>
                      <input
                        type="text"
                        value={facilityInput}
                        onChange={(e) => setFacilityInput(e.target.value)}
                        placeholder="e.g. Cleveland Clinic Abu Dhabi"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-0.5">
                        DoH License:
                      </label>
                      <input
                        type="text"
                        value={licenseInput}
                        onChange={(e) => setLicenseInput(e.target.value)}
                        placeholder="DOH-AUH-2024-9102"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full mt-2 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase tracking-wider text-xs shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {authLoading ? 'Registering...' : 'Register & Enter Portal'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          7. DOCTOR SETTINGS MODAL (Customize Name, Clinic Logo, License)
          ======================================================== */}
      <DoctorSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentSettings={doctorSettings}
        onSaveSettings={handleSaveDoctorSettings}
        onLogout={handleLogout}
        locale={locale}
      />

      {/* ========================================================
          8. CHOICE 1: PRESCRIBE PATIENT & SEND EMAIL REPORT MODAL
          ======================================================== */}
      {emailModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] dark:bg-[#181614] border border-[#DDD7C8] dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E8E2D5] dark:border-stone-800 bg-white dark:bg-[#1C1A17] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                    Prescribe & Send Email Clinical Report
                  </h3>
                  <p className="text-xs text-[#8A8172] dark:text-stone-400">
                    Patient #{emailModalPatient.pseudonymId} · Booking Ref: {emailModalPatient.bookingId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEmailModalPatient(null)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Recipient Email Destination */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-2">
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] flex items-center justify-between">
                  <span>Patient Recipient Email (From Appointment Booking Form):</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                    Direct Delivery Target
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={patientEmailInput}
                    onChange={(e) => setPatientEmailInput(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-[#FAF8F5] dark:bg-stone-900 text-xs text-[#1A1816] dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-[#8A8172] dark:text-stone-400">
                  The clinical evaluation, Rx prescriptions, and diagnostic orders will be dispatched directly to this address.
                </p>
              </div>

              {/* Prescribing Clinician Identity */}
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] dark:bg-emerald-950/40 border border-[#86EFAC] dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {doctorSettings.avatarIcon || '👨‍⚕️'}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#14532D] dark:text-emerald-300 block">
                      {doctorSettings.fullName}
                    </span>
                    <span className="text-[10px] text-[#166534] dark:text-emerald-400 block font-mono">
                      {doctorSettings.facility} · License: {doctorSettings.dohLicense}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  Change Profile
                </button>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block">
                  Clinical Diagnosis & Acuity:
                </label>
                <input
                  type="text"
                  value={prescribeDiagnosis}
                  onChange={(e) => setPrescribeDiagnosis(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Rx Prescription Textarea */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] flex items-center justify-between">
                  <span>Official Medical Prescription (Rx):</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] font-mono">
                    DoH Malaffi E-Rx Compliant
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={prescribeRxText}
                  onChange={(e) => setPrescribeRxText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              {/* Diagnostic Orders */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block">
                  Laboratory & Diagnostic Orders to Include:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    'Bilateral Scrotal Doppler Ultrasound',
                    'Serum Endocrine Profile (Total Testosterone, FSH, LH)',
                    'Repeat CASA Semen Analysis',
                    'Sperm DNA Fragmentation Index (DFI)',
                  ].map((order) => {
                    const isChecked = prescribeLabOrders.includes(order);
                    return (
                      <div
                        key={order}
                        onClick={() => {
                          if (isChecked) {
                            setPrescribeLabOrders(prescribeLabOrders.filter((o) => o !== order));
                          } else {
                            setPrescribeLabOrders([...prescribeLabOrders, order]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-[#E8F5E9] dark:bg-emerald-950/70 border-[#A5D6A7] dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-300 font-bold'
                            : 'bg-white dark:bg-stone-900 border-[#E8E2D5] dark:border-stone-800 text-[#6B6355] dark:text-stone-400'
                        }`}
                      >
                        <span>{order}</span>
                        <span>{isChecked ? '✓' : '+'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clinical Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block">
                  Clinical Recommendations & Follow-Up Advice:
                </label>
                <textarea
                  rows={2}
                  value={prescribeNotes}
                  onChange={(e) => setPrescribeNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Success Result Banner */}
              {emailSentSuccess && (
                <div className="p-4 rounded-2xl bg-[#E8F5E9] dark:bg-emerald-950/80 border border-[#86EFAC] dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs block">{emailSentSuccess.message}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                      Target: {emailSentSuccess.email} · Encrypted & Logged to GraphDB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#E8E2D5] dark:border-stone-800 bg-white dark:bg-[#1C1A17] flex items-center justify-between">
              <span className="text-xs text-[#8A8172] dark:text-stone-400">
                Official DoH Malaffi Telehealth standard.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEmailModalPatient(null)}
                  className="px-5 py-2.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 text-xs font-bold text-[#6B6355] dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDispatchPrescriptionEmail}
                  disabled={sendingEmail || !patientEmailInput}
                  className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {sendingEmail
                      ? 'Dispatching Report...'
                      : `Send Prescription to ${patientEmailInput.split('@')[0] || 'Patient'}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. INTERACTIVE PATIENT MEDICAL HISTORY LADDER MODAL
          ======================================================== */}
      {ladderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-2xl w-full max-h-[92vh] flex flex-col">
            <PatientHistoryLadder
              bookings={bookings}
              locale={locale}
              initialQuery={ladderQuery}
              onClose={() => setLadderModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
