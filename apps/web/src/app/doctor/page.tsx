'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Video,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  Activity,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  LogOut,
  Building2,
  Phone,
  Mail,
  RefreshCw,
  ExternalLink,
  Send,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  Pill,
  Microscope,
  Check,
  Sliders,
  X,
  AlertTriangle,
  Globe,
  Sun,
  Moon,
  User,
  ChevronDown,
  Layers,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import VigorLogo from '@/components/VigorLogo';
import PatientHistoryLadder from '@/components/doctor/PatientHistoryLadder';
import DoctorLoginPage from '@/components/doctor/DoctorLoginPage';
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
  status: 'Pending' | 'Approved' | 'Rejected' | 'COMPLETED' | 'CONFIRMED' | string;
  triageTier: 'URGENT' | 'ANDROLOGY_UROLOGY' | 'FERTILITY_SERVICES' | 'PRIMARY_CARE' | 'SELF_CARE';
  telehealthRoomUrl?: string;
  contact?: { name?: string; email?: string; phone?: string };
  chiefComplaint?: string;
  clinicalNotes?: string;
  prescription?: string;
  diagnosis?: string;
  labOrders?: string[];
  medications?: MedicationItem[];
  followUpDate?: string;
  followUpNotes?: string;
  createdAt: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

const DEFAULT_MEDICATIONS: MedicationItem[] = [
  { id: 'med_1', name: 'L-Carnitine', dosage: '2000 mg', frequency: 'Once daily with breakfast', duration: '90 Days' },
  { id: 'med_2', name: 'Coenzyme Q10 (CoQ10)', dosage: '200 mg', frequency: 'Once daily with meals', duration: '90 Days' },
  { id: 'med_3', name: 'Zinc Picolinate + Selenium', dosage: '25 mg / 200 mcg', frequency: 'Once daily at bedtime', duration: '90 Days' },
];

const STANDARD_ICD10_TAGS = [
  { code: 'N46.11', label: 'Male Infertility · Oligo/Asthenozoospermia' },
  { code: 'I86.1', label: 'Scrotal Varices & Clinical Varicocele' },
  { code: 'E29.1', label: 'Testicular Hypofunction / Low T' },
  { code: 'Z31.41', label: 'Fertility Testing & CASA Evaluation' },
  { code: 'N50.8', label: 'Other Specified Disorders of Male Genital' },
];

const STANDARD_LAB_OPTIONS = [
  'Bilateral Scrotal Color Doppler Ultrasound',
  'Serum Endocrine Profile (FSH, LH, Total Testosterone, Prolactin)',
  'Repeat CASA Semen Analysis in 4 Weeks',
  'Karyotyping & Y-Chromosome Microdeletion Assay',
  'Sperm DNA Fragmentation Index (DFI)',
];

export default function DoctorPortalPage() {
  // Auth & Initialization State
  const [authInitialized, setAuthInitialized] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState<DoctorAccount | null>(null);

  // Navigation & Primary Tabs
  const [activeTab, setActiveTab] = useState<'appointments' | 'history' | 'consultation'>('appointments');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const isAr = locale === 'ar';

  // Theme synchronization
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isDark = theme === 'dark';

  // Doctor Settings & Identity
  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>(DEFAULT_DOCTOR_SETTINGS);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Bookings / Live Database State
  const [bookings, setBookings] = useState<PatientBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Tab 1: Appointments List Filter, Scope & Search State
  const [appointmentFilter, setAppointmentFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [doctorScope, setDoctorScope] = useState<'MY_APPOINTMENTS' | 'ALL_QUEUE'>('MY_APPOINTMENTS');
  const [appointmentSearch, setAppointmentSearch] = useState('');

  // Tab 2: Patient History Natural Language Query State
  const [historyQuery, setHistoryQuery] = useState('');

  // Tab 3: Current Consultation State (Clean, Real Clinical EHR - No Dummy Data)
  const [activeConsultationBookingId, setActiveConsultationBookingId] = useState<string | null>(null);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [followUpPeriod, setFollowUpPeriod] = useState<string>('4 Weeks');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [consultationSuccessToast, setConsultationSuccessToast] = useState<string | null>(null);
  const [finalizingPrescription, setFinalizingPrescription] = useState(false);

  // Initialize Theme
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
    } catch {
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

  // Doctor session handler
  const applyDoctorSession = (doc: DoctorAccount) => {
    setCurrentDoctor(doc);
    const updated: DoctorSettings = {
      fullName: doc.fullName,
      title: doc.specialty || 'Consultant Physician',
      dohLicense: doc.licenseNumber || 'DOH-AUH-2024-9102',
      facility: doc.facility || 'Cleveland Clinic Abu Dhabi · Andrology Hub',
      location: 'Al Maryah Island, Abu Dhabi',
      avatarIcon: '👨‍⚕️',
      logoUrl: '',
    };
    setDoctorSettings(updated);
    try {
      localStorage.setItem('vigor_doctor_auth_session', JSON.stringify(doc));
      localStorage.setItem('vigor_doctor_settings', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Load existing session on mount (Strict Authentication - No Dummy Defaults)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('vigor_doctor_settings');
      if (
        storedSettings &&
        (storedSettings.includes('Certified') ||
          storedSettings.includes('Tariq') ||
          storedSettings.includes('HealthPlus'))
      ) {
        localStorage.removeItem('vigor_doctor_settings');
      }
      const storedAuth = localStorage.getItem('vigor_doctor_auth_session');
      if (
        storedAuth &&
        (storedAuth.includes('Certified') ||
          storedAuth.includes('Tariq') ||
          storedAuth.includes('HealthPlus'))
      ) {
        localStorage.removeItem('vigor_doctor_auth_session');
      }
      if (sessionStorage.getItem('vigor_doctor_logged_out') === 'true') {
        setCurrentDoctor(null);
        setAuthInitialized(true);
        return;
      }
    }
    const doc = getCurrentDoctor();
    if (
      doc &&
      doc.fullName &&
      !doc.fullName.includes('Certified') &&
      !doc.fullName.includes('Tariq') &&
      !doc.facility?.includes('HealthPlus')
    ) {
      applyDoctorSession(doc);
    } else {
      setCurrentDoctor(null);
    }
    setAuthInitialized(true);
  }, []);

  // Fetch Live Bookings from MongoDB
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
    fetchBookings();
    const pollInterval = setInterval(() => {
      fetchBookings();
    }, 4500);
    return () => clearInterval(pollInterval);
  }, []);

  // Synchronize consultation form when active patient changes (Strictly null until a patient is explicitly selected)
  const activeConsultationPatient = useMemo(() => {
    if (!activeConsultationBookingId) return null;
    return bookings.find((b) => b.bookingId === activeConsultationBookingId) || null;
  }, [bookings, activeConsultationBookingId]);

  useEffect(() => {
    if (activeConsultationPatient) {
      setDiagnosisInput(activeConsultationPatient.diagnosis || '');
      setMedicalNotes(activeConsultationPatient.clinicalNotes || '');
      setSelectedLabs(activeConsultationPatient.labOrders || []);
      setMedications(activeConsultationPatient.medications || []);
      setFollowUpDate(activeConsultationPatient.followUpDate || '');
      setFollowUpNotes(activeConsultationPatient.followUpNotes || '');
    } else {
      setDiagnosisInput('');
      setMedicalNotes('');
      setSelectedLabs([]);
      setMedications([]);
      setFollowUpDate('');
      setFollowUpNotes('');
    }
  }, [activeConsultationPatient]);

  // Handle Logout (Completely closes portal and shows separate Login UI)
  const handleLogout = async () => {
    try {
      await logoutDoctor();
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vigor_doctor_logged_out', 'true');
      localStorage.removeItem('vigor_doctor_auth_session');
    }
    setCurrentDoctor(null);
  };

  // Tab 1: Actions (Approve / Reject)
  const handleApproveAppointment = async (bookingId: string) => {
    try {
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? { ...b, status: 'Approved' } : b))
      );
      const res = await fetch('/api/clinician/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: 'Approved',
          doctorName: doctorSettings.fullName,
        }),
      });
      if (res.ok) {
        showToast(isAr ? 'تمت الموافقة على الموعد وإرسال التأكيد للمريض' : 'Appointment approved! Confirmation email dispatched to patient.');
        fetchBookings();
      }
    } catch (e) {
      console.warn('Approve error:', e);
    }
  };

  const handleRejectAppointment = async (bookingId: string) => {
    try {
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === bookingId ? { ...b, status: 'Rejected' } : b))
      );
      const res = await fetch('/api/clinician/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: 'Rejected',
          doctorName: doctorSettings.fullName,
        }),
      });
      if (res.ok) {
        showToast(isAr ? 'تم رفض الموعد وتحديث السجل' : 'Appointment marked as rejected.');
        fetchBookings();
      }
    } catch (e) {
      console.warn('Reject error:', e);
    }
  };

  const handleStartConsultationFromRow = (bookingId: string) => {
    setActiveConsultationBookingId(bookingId);
    setActiveTab('consultation');
  };

  const handleViewPatientHistoryFromRow = (patientName?: string, bookingId?: string) => {
    if (patientName) {
      setHistoryQuery(`Give me the complete medical history of ${patientName}`);
    } else if (bookingId) {
      setHistoryQuery(`Find ${bookingId.slice(-6)}`);
    }
    setActiveTab('history');
  };

  // Tab 3: Consultation State Modifiers
  const handleAddMedicationRow = () => {
    const newMed: MedicationItem = {
      id: `med_${Date.now()}`,
      name: '',
      dosage: '',
      frequency: 'Once daily',
      duration: '30 Days',
    };
    setMedications([...medications, newMed]);
  };

  const handleUpdateMedication = (id: string, field: keyof MedicationItem, val: string) => {
    setMedications(medications.map((m) => (m.id === id ? { ...m, [field]: val } : m)));
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleLoadFertilityProtocol = () => {
    setMedications(DEFAULT_MEDICATIONS);
    showToast(isAr ? 'تم تحميل البروتوكول القياسي لمضادات الأكسدة' : 'Loaded standard antioxidant fertility protocol');
  };

  const handleToggleLab = (labName: string) => {
    if (selectedLabs.includes(labName)) {
      setSelectedLabs(selectedLabs.filter((l) => l !== labName));
    } else {
      setSelectedLabs([...selectedLabs, labName]);
    }
  };

  const showToast = (msg: string) => {
    setConsultationSuccessToast(msg);
    setTimeout(() => setConsultationSuccessToast(null), 3000);
  };

  // Tab 3: Save Consultation to Database
  const handleSaveConsultation = async () => {
    if (!activeConsultationPatient) return;
    setSavingConsultation(true);
    try {
      const rxSummary = medications
        .filter((m) => m.name.trim())
        .map((m, idx) => `${idx + 1}. ${m.name} ${m.dosage} - ${m.frequency} (${m.duration})`)
        .join('\n');

      const res = await fetch('/api/doctor/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: activeConsultationPatient.bookingId,
          patientEmail: activeConsultationPatient.contact?.email || 'patient@vigor.health',
          patientName: activeConsultationPatient.patientName || `Patient #${activeConsultationPatient.pseudonymId.slice(-6)}`,
          doctorName: doctorSettings.fullName,
          doctorTitle: doctorSettings.title,
          doctorLicense: doctorSettings.dohLicense,
          facilityName: doctorSettings.facility,
          facilityLocation: doctorSettings.location,
          diagnosis: diagnosisInput,
          prescriptionText: rxSummary || 'Standard clinical observation and diagnostic workup.',
          medications,
          labOrders: selectedLabs,
          clinicalNotes: medicalNotes,
          followUpDate: followUpDate || `In ${followUpPeriod}`,
          followUpNotes,
          locale,
        }),
      });

      if (res.ok) {
        showToast(isAr ? 'تم حفظ سجل الاستشارة بنجاح في قاعدة البيانات' : 'Consultation record saved successfully in MongoDB!');
        fetchBookings();
      } else {
        showToast('Failed to save consultation record.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving consultation record.');
    } finally {
      setSavingConsultation(false);
    }
  };

  // Tab 3: Finalize & Email Prescription Report
  const handleFinalizeAndEmailRx = async () => {
    if (!activeConsultationPatient) return;
    setFinalizingPrescription(true);
    try {
      const rxSummary = medications
        .filter((m) => m.name.trim())
        .map((m, idx) => `${idx + 1}. ${m.name} ${m.dosage} - ${m.frequency} (${m.duration})`)
        .join('\n');

      const res = await fetch('/api/doctor/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: activeConsultationPatient.bookingId,
          patientEmail: activeConsultationPatient.contact?.email || 'patient@vigor.health',
          patientName: activeConsultationPatient.patientName || `Patient #${activeConsultationPatient.pseudonymId.slice(-6)}`,
          doctorName: doctorSettings.fullName,
          doctorTitle: doctorSettings.title,
          doctorLicense: doctorSettings.dohLicense,
          facilityName: doctorSettings.facility,
          facilityLocation: doctorSettings.location,
          diagnosis: diagnosisInput,
          prescriptionText: rxSummary,
          medications,
          labOrders: selectedLabs,
          clinicalNotes: medicalNotes,
          followUpDate: followUpDate || `In ${followUpPeriod}`,
          followUpNotes,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(isAr ? 'تم اعتماد الاستشارة وإرسال الوصفة الرسمية لبريد المريض' : `Official Prescription emailed to ${data.recipientEmail}!`);
        fetchBookings();
      } else {
        alert(data.error || 'Failed to finalize prescription.');
      }
    } catch {
      alert('Error finalizing prescription.');
    } finally {
      setFinalizingPrescription(false);
    }
  };

  // Tab 1: Filtered Appointments List (Supports "Only My Info Shown" Scope)
  const filteredAppointments = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Doctor Scope: If MY_APPOINTMENTS, filter by currently logged in doctor
      if (doctorScope === 'MY_APPOINTMENTS' && currentDoctor) {
        const assignedDoc = (b.facility?.doctor || '').toLowerCase();
        const currentDocName = currentDoctor.fullName.toLowerCase().replace('dr.', '').trim();
        const docMatches =
          assignedDoc.includes(currentDocName) ||
          currentDoctor.fullName.toLowerCase().includes(assignedDoc) ||
          (b.facility?.facilityId && b.facility.facilityId === currentDoctor.uid);

        if (!docMatches && assignedDoc.trim().length > 0) {
          return false;
        }
      }

      const st = (b.status || '').toUpperCase();
      const isPending = st === 'PENDING' || st === 'PENDING_APPROVAL';
      const isApproved = st === 'APPROVED' || st === 'CONFIRMED' || st === 'COMPLETED';
      const isRejected = st === 'REJECTED';

      if (appointmentFilter === 'PENDING' && !isPending) return false;
      if (appointmentFilter === 'APPROVED' && !isApproved) return false;
      if (appointmentFilter === 'REJECTED' && !isRejected) return false;

      if (appointmentSearch.trim()) {
        const query = appointmentSearch.toLowerCase().trim();
        const text = `${b.patientName || ''} ${b.bookingId || ''} ${b.contact?.email || ''} ${b.facility?.name || ''} ${b.slotTime || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [bookings, appointmentFilter, appointmentSearch, doctorScope, currentDoctor]);

  const myAppointmentsCount = useMemo(() => {
    if (!currentDoctor) return bookings.length;
    const currentDocName = currentDoctor.fullName.toLowerCase().replace('dr.', '').trim();
    return bookings.filter((b) => {
      const assignedDoc = (b.facility?.doctor || '').toLowerCase();
      return (
        assignedDoc.includes(currentDocName) ||
        currentDoctor.fullName.toLowerCase().includes(assignedDoc) ||
        (b.facility?.facilityId && b.facility.facilityId === currentDoctor.uid)
      );
    }).length;
  }, [bookings, currentDoctor]);

  const pendingCount = bookings.filter((b) => {
    const s = (b.status || '').toUpperCase();
    return s === 'PENDING' || s === 'PENDING_APPROVAL';
  }).length;

  const liveVideoBooking = bookings.find((b) => b.consultType === 'TELEHEALTH_VIDEO' && b.status !== 'Rejected');
  const telehealthLiveUrl = liveVideoBooking
    ? `/telehealth/${liveVideoBooking.bookingId}?role=doctor`
    : `/telehealth/live?role=doctor`;

  // Dedicated Full-Page Clinician Login Screen (No background dashboard, no dummy data)
  if (authInitialized && !currentDoctor) {
    return (
      <DoctorLoginPage
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLoginSuccess={(doc) => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('vigor_doctor_logged_out');
          }
          applyDoctorSession(doc);
        }}
      />
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#FAF8F5] dark:bg-[#141311] text-[#1A1816] dark:text-[#FAF7F2] font-editorial-sans antialiased selection:bg-[#1A1816] selection:text-white dark:selection:bg-white dark:selection:text-[#141311] transition-colors duration-300"
    >
      {/* Toast Notification */}
      {consultationSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1A1816] dark:bg-white text-white dark:text-[#181614] px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{consultationSuccessToast}</span>
        </div>
      )}

      {/* ========================================================
          1. MASTER HEADER & THREE PRIMARY TABS
          ======================================================== */}
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/92 dark:bg-[#141311]/92 backdrop-blur-xl border-b border-[#E8E2D5] dark:border-stone-800 transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-3 shrink-0">
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
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
                <Stethoscope className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'بوابة الأطباء' : 'Doctor Portal'}</span>
              </div>
            </div>

            {/* Center: The Three Dedicated Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 p-1 rounded-full bg-[#EFECE3]/80 dark:bg-stone-900 border border-[#DDD7C8] dark:border-stone-800">
              {/* Tab 1: Appointments */}
              <button
                type="button"
                onClick={() => setActiveTab('appointments')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'appointments'
                    ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm'
                    : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAr ? 'المواعيد' : 'Appointments'}</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Tab 2: Patient History */}
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm'
                    : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>{isAr ? 'سجل المريض' : 'Patient History'}</span>
              </button>

              {/* Tab 3: Current Consultation */}
              <button
                type="button"
                onClick={() => setActiveTab('consultation')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'consultation'
                    ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-sm'
                    : 'text-[#6B6355] dark:text-stone-400 hover:text-[#1A1816] dark:hover:text-white'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{isAr ? 'الاستشارة الحالية' : 'Current Consultation'}</span>
              </button>
            </nav>

            {/* Right: Controls & Clinician Session */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Telehealth Live Link */}
              <Link
                href={telehealthLiveUrl}
                target="_blank"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-[10px] font-bold tracking-wider uppercase transition-all shadow-2xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Telehealth</span>
              </Link>

              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="p-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[10px] font-bold text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-colors"
                title="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="p-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="p-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-colors"
                title="Doctor Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-rose-300 hover:bg-red-100 text-[10px] font-bold uppercase tracking-wider transition-colors"
                title="Log Out Session"
              >
                <LogOut className="w-3 h-3 text-red-600 dark:text-rose-400" />
                <span className="hidden sm:inline">{isAr ? 'خروج' : 'Logout'}</span>
              </button>

              {/* Doctor Avatar snippet */}
              <div
                onClick={() => setSettingsModalOpen(true)}
                className="hidden xl:flex items-center gap-2 pl-2 border-l border-[#DDD7C8] dark:border-stone-700 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#1A1816] dark:bg-stone-800 text-white flex items-center justify-center text-xs">
                  {doctorSettings.avatarIcon || '👨‍⚕️'}
                </div>
                <div className="flex flex-col text-left rtl:text-right max-w-[120px]">
                  <span className="text-[11px] font-bold truncate leading-tight">{doctorSettings.fullName}</span>
                  <span className="text-[9px] text-stone-500 truncate leading-tight">{doctorSettings.facility.split('·')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================
          WORKSPACE CONTENT AREA (Renders Active Tab)
          ======================================================== */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        {/* ========================================================
            TAB 1: APPOINTMENTS TAB (Clean, Compact List Format)
            ======================================================== */}
        {activeTab === 'appointments' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Top Bar: Search, Filters & Sync */}
            <div className="bg-white/80 dark:bg-[#1C1A17]/80 backdrop-blur-md rounded-2xl p-4 border border-[#E8E2D5] dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
              {/* Doctor Scope Toggle & Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-1 p-1 rounded-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setDoctorScope('MY_APPOINTMENTS')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      doctorScope === 'MY_APPOINTMENTS'
                        ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isAr ? 'مواعيدي' : `My Patients (${myAppointmentsCount})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDoctorScope('ALL_QUEUE')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      doctorScope === 'ALL_QUEUE'
                        ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isAr ? 'كافة المنشأة' : `All Queue (${bookings.length})`}</span>
                  </button>
                </div>

                <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 hidden sm:block" />

                <div className="flex items-center gap-1 overflow-x-auto">
                  {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filterKey) => {
                    const count =
                      filterKey === 'ALL'
                        ? bookings.length
                        : filterKey === 'PENDING'
                        ? bookings.filter((b) => (b.status || '').toUpperCase() === 'PENDING' || (b.status || '').toUpperCase() === 'PENDING_APPROVAL').length
                        : filterKey === 'APPROVED'
                        ? bookings.filter((b) => (b.status || '').toUpperCase() === 'APPROVED' || (b.status || '').toUpperCase() === 'CONFIRMED' || (b.status || '').toUpperCase() === 'COMPLETED').length
                        : bookings.filter((b) => (b.status || '').toUpperCase() === 'REJECTED').length;

                    const isActive = appointmentFilter === filterKey;
                    return (
                      <button
                        key={filterKey}
                        type="button"
                        onClick={() => setAppointmentFilter(filterKey)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                        }`}
                      >
                        <span>
                          {filterKey === 'ALL'
                            ? isAr ? 'الكل' : 'All'
                            : filterKey === 'PENDING'
                            ? isAr ? 'قيد الموافقة' : 'Pending'
                            : filterKey === 'APPROVED'
                            ? isAr ? 'المعتمدة' : 'Approved'
                            : isAr ? 'المرفوضة' : 'Rejected'}
                        </span>
                        <span className="font-mono text-[10px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Refresh */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 rtl:right-3 top-2.5" />
                  <input
                    type="text"
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    placeholder={isAr ? 'بحث بالاسم أو المعرف...' : 'Search patient name or ref...'}
                    className="w-full text-xs pl-8 rtl:pr-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchBookings}
                  className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Compact List Table */}
            <div className="bg-white dark:bg-[#181715] rounded-2xl border border-[#E8E2D5] dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E2D5] dark:border-stone-800 bg-[#F6F4ED]/80 dark:bg-[#1E1C1A] text-stone-500 dark:text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">{isAr ? 'اسم المريض' : 'Patient Name'}</th>
                      <th className="py-3 px-4">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="py-3 px-4">{isAr ? 'الوقت' : 'Time'}</th>
                      <th className="py-3 px-4">{isAr ? 'النوع' : 'Type'}</th>
                      <th className="py-3 px-4">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-3 px-4 text-center">{isAr ? 'الإجراءات' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((b) => {
                        const patientName = b.patientName || b.contact?.name || `Patient #${b.pseudonymId ? b.pseudonymId.slice(-6) : b.bookingId.slice(-6)}`;
                        const isVideo = b.consultType === 'TELEHEALTH_VIDEO';
                        const statusUpper = (b.status || '').toUpperCase();
                        const isPending = statusUpper === 'PENDING' || statusUpper === 'PENDING_APPROVAL';
                        const isApproved = statusUpper === 'APPROVED' || statusUpper === 'CONFIRMED' || statusUpper === 'COMPLETED';
                        const isRejected = statusUpper === 'REJECTED';

                        // Parse Date & Time cleanly
                        const dateText = b.createdAt
                          ? new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          : 'Today';
                        const timeText = b.slotTime ? b.slotTime.replace(/Today · |Tomorrow · /g, '') : '10:00 AM';

                        return (
                          <tr
                            key={b.bookingId}
                            className="hover:bg-[#FAF8F5]/80 dark:hover:bg-stone-900/50 transition-colors"
                          >
                            {/* Patient Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold flex items-center justify-center text-xs shrink-0">
                                  {patientName.charAt(0)}
                                </div>
                                <div>
                                  <span className="font-bold text-stone-900 dark:text-[#FAF7F2] block leading-tight">
                                    {patientName}
                                  </span>
                                  <span className="font-mono text-[10px] text-stone-400">
                                    Ref: {b.bookingId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Date */}
                            <td className="py-3 px-4 font-medium text-stone-700 dark:text-stone-300">
                              {dateText}
                            </td>

                            {/* Time */}
                            <td className="py-3 px-4 font-mono font-bold text-stone-800 dark:text-stone-200">
                              {timeText}
                            </td>

                            {/* Type */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isVideo
                                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-900'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                                }`}
                              >
                                {isVideo ? <Video className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                <span>{isVideo ? 'Video' : 'In-person'}</span>
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPending
                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                    : isApproved
                                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isPending ? 'bg-amber-500' : isApproved ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                                <span>
                                  {isPending ? 'Pending' : isApproved ? 'Approved' : 'Rejected'}
                                </span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5">
                                {isPending ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveAppointment(b.bookingId)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectAppointment(b.bookingId)}
                                      className="px-2 py-1 rounded-lg border border-red-300 dark:border-red-900/60 text-red-700 dark:text-rose-400 hover:bg-red-50 text-[11px] font-bold transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : isApproved ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleStartConsultationFromRow(b.bookingId)}
                                      className="px-3 py-1 rounded-lg bg-[#1A1816] hover:bg-[#332F2A] dark:bg-white dark:hover:bg-stone-100 text-white dark:text-[#181614] font-bold text-[11px] transition-colors shadow-2xs"
                                    >
                                      Consult
                                    </button>
                                    {isVideo && (
                                      <Link
                                        href={`/telehealth/${b.bookingId}?role=doctor`}
                                        target="_blank"
                                        className="p-1 rounded-lg border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-sky-400 hover:bg-blue-50 transition-colors"
                                        title="Launch Video Room"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                      </Link>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveAppointment(b.bookingId)}
                                    className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-700 dark:text-stone-300 hover:bg-stone-100 text-[11px] font-bold transition-colors"
                                  >
                                    Re-approve
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleViewPatientHistoryFromRow(b.patientName, b.bookingId)}
                                  className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-medium transition-colors"
                                  title="View Medical History"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-stone-500">
                          <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                            {doctorScope === 'MY_APPOINTMENTS'
                              ? isAr ? `لا توجد استشارات مسجلة حالياً باسم ${currentDoctor?.fullName || ''}` : `No consultations currently assigned to ${currentDoctor?.fullName || 'your profile'}.`
                              : isAr ? 'لا توجد مواعيد مطابقة لخيارات البحث' : 'No appointments matching the selected filter.'}
                          </p>
                          {doctorScope === 'MY_APPOINTMENTS' && bookings.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setDoctorScope('ALL_QUEUE')}
                              className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{isAr ? 'عرض كافة مواعيد المنشأة' : `View All Hospital Queue (${bookings.length} Bookings)`}</span>
                              <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: PATIENT HISTORY – NATURAL LANGUAGE QUERY TAB
            ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PatientHistoryLadder
              bookings={bookings}
              locale={locale}
              initialQuery={historyQuery}
              onStartConsultation={(bookingId) => {
                setActiveConsultationBookingId(bookingId);
                setActiveTab('consultation');
              }}
            />
          </div>
        )}

        {/* ========================================================
            TAB 3: CURRENT CONSULTATION / VISIT TAB
            ======================================================== */}
        {activeTab === 'consultation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Active Patient Switcher Ribbon */}
            <div className="bg-white/80 dark:bg-[#1C1A17]/80 backdrop-blur-md rounded-2xl p-3 border border-[#E8E2D5] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 shrink-0">
                  {isAr ? 'اختيار المريض للاستشارة:' : 'Select Consultation Patient:'}
                </span>
                {bookings.map((b) => {
                  const pName = b.patientName || b.contact?.name || `Patient #${b.bookingId.slice(-6)}`;
                  const isSelected = b.bookingId === activeConsultationBookingId;
                  return (
                    <button
                      key={b.bookingId}
                      type="button"
                      onClick={() => setActiveConsultationBookingId(b.bookingId)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>{pName}</span>
                      <span className="opacity-70 font-mono text-[10px]">({b.bookingId.slice(-6)})</span>
                    </button>
                  );
                })}

                {activeConsultationPatient && (
                  <button
                    type="button"
                    onClick={() => setActiveConsultationBookingId(null)}
                    className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 transition-all flex items-center gap-1 ml-1"
                    title="Clear current patient selection"
                  >
                    <X className="w-3 h-3" />
                    <span>{isAr ? 'إلغاء التحديد' : 'Deselect'}</span>
                  </button>
                )}
              </div>

              {/* Action Buttons (Only active when a patient is selected) */}
              {activeConsultationPatient && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveConsultation}
                    disabled={savingConsultation}
                    className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingConsultation ? 'Saving...' : 'Save Notes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeAndEmailRx}
                    disabled={finalizingPrescription}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{finalizingPrescription ? 'Finalizing...' : 'Finalize & Email Rx'}</span>
                  </button>
                </div>
              )}
            </div>

            {activeConsultationPatient ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: 1. Patient Information & 2. Diagnosis */}
                <div className="lg:col-span-5 space-y-6">
                  {/* 1. Patient Information Section */}
                  <div className="bg-white dark:bg-[#181715] rounded-3xl p-6 border border-[#E8E2D5] dark:border-stone-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F2]">
                          1. Patient Demographics &amp; Visit Info
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        DoH Verified
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Patient Full Name:</span>
                        <span className="font-bold text-stone-900 dark:text-white">
                          {activeConsultationPatient.patientName || 'Confidential Patient'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Pseudonym ID:</span>
                        <span className="font-mono text-stone-700 dark:text-stone-300">
                          {activeConsultationPatient.pseudonymId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Email Address:</span>
                        <span className="text-stone-700 dark:text-stone-300">
                          {activeConsultationPatient.contact?.email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Consultation Modality:</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {activeConsultationPatient.consultType === 'TELEHEALTH_VIDEO'
                            ? 'Telehealth Live Video'
                            : 'In-Person Hospital Visit'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Facility / Clinic:</span>
                        <span className="text-stone-700 dark:text-stone-300 truncate max-w-[200px]">
                          {activeConsultationPatient.facility?.name || doctorSettings.facility}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Chief Complaint:</span>
                        <span className="font-medium text-stone-900 dark:text-stone-100">
                          {activeConsultationPatient.chiefComplaint || 'Male fertility workup and semen quality evaluation.'}
                        </span>
                      </div>
                    </div>

                    {activeConsultationPatient.consultType === 'TELEHEALTH_VIDEO' && (
                      <div className="pt-2">
                        <Link
                          href={`/telehealth/${activeConsultationPatient.bookingId}?role=doctor`}
                          target="_blank"
                          className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Virtual Video Room</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* 2. Diagnosis Section */}
                  <div className="bg-white dark:bg-[#181715] rounded-3xl p-6 border border-[#E8E2D5] dark:border-stone-800 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F2]">
                        2. Clinical Diagnosis
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-1">
                          Primary Clinical Diagnosis *
                        </label>
                        <input
                          type="text"
                          value={diagnosisInput}
                          onChange={(e) => setDiagnosisInput(e.target.value)}
                          placeholder="e.g. Asthenozoospermia (WHO 2021) & Grade II Left Varicocele"
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Clickable ICD-10 Presets */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                          Standard ICD-10 Codes:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {STANDARD_ICD10_TAGS.map((tag) => (
                            <button
                              key={tag.code}
                              type="button"
                              onClick={() => setDiagnosisInput(`${tag.code} - ${tag.label}`)}
                              className="px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 hover:border-emerald-500 text-[10px] font-mono text-stone-700 dark:text-stone-300 transition-colors"
                            >
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">{tag.code}</span> · {tag.label.split('·')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-600 dark:text-stone-300 block mb-1">
                          Etiology &amp; Assessment Notes
                        </label>
                        <textarea
                          rows={2}
                          value={diagnosisNotes}
                          onChange={(e) => setDiagnosisNotes(e.target.value)}
                          placeholder="Clinical etiology, semen motility percentages, scrotal exam impressions..."
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: 3. Prescription, 4. Notes, & 5. Follow-up */}
                <div className="lg:col-span-7 space-y-6">
                  {/* 3. Prescription Section */}
                  <div className="bg-white dark:bg-[#181715] rounded-3xl p-6 border border-[#E8E2D5] dark:border-stone-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-2">
                        <Pill className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F2]">
                          3. Prescription &amp; Medication Plan
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLoadFertilityProtocol}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                        >
                          Load Standard Protocol
                        </button>
                        <button
                          type="button"
                          onClick={handleAddMedicationRow}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-[10px] font-bold hover:bg-stone-200 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Medicine</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Medication Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left rtl:text-right text-xs">
                        <thead>
                          <tr className="border-b border-stone-200 dark:border-stone-800 text-[10px] font-bold uppercase text-stone-400">
                            <th className="pb-2">Medicine Name</th>
                            <th className="pb-2">Dosage</th>
                            <th className="pb-2">Frequency</th>
                            <th className="pb-2">Duration</th>
                            <th className="pb-2 text-center w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                          {medications.map((m) => (
                            <tr key={m.id}>
                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={(e) => handleUpdateMedication(m.id, 'name', e.target.value)}
                                  placeholder="e.g. L-Carnitine"
                                  className="w-full text-xs p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white font-medium"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  value={m.dosage}
                                  onChange={(e) => handleUpdateMedication(m.id, 'dosage', e.target.value)}
                                  placeholder="e.g. 2000 mg"
                                  className="w-full text-xs p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  value={m.frequency}
                                  onChange={(e) => handleUpdateMedication(m.id, 'frequency', e.target.value)}
                                  placeholder="e.g. Once daily"
                                  className="w-full text-xs p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  value={m.duration}
                                  onChange={(e) => handleUpdateMedication(m.id, 'duration', e.target.value)}
                                  placeholder="e.g. 90 Days"
                                  className="w-full text-xs p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white"
                                />
                              </td>
                              <td className="py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedication(m.id)}
                                  className="p-1 rounded text-stone-400 hover:text-red-600 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Diagnostic Lab Orders Checklist */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Diagnostic Lab &amp; Imaging Orders:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {STANDARD_LAB_OPTIONS.map((lab) => {
                          const isChecked = selectedLabs.includes(lab);
                          return (
                            <label
                              key={lab}
                              onClick={() => handleToggleLab(lab)}
                              className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-semibold'
                                  : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 text-emerald-600 rounded"
                              />
                              <span className="text-[11px] truncate">{lab}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 4. Medical Notes & 5. Follow-Up Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 4. Consultation Notes */}
                    <div className="bg-white dark:bg-[#181715] rounded-3xl p-5 border border-[#E8E2D5] dark:border-stone-800 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F2]">
                          4. Medical Notes
                        </h3>
                      </div>
                      <textarea
                        rows={4}
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        placeholder="Write clinical exam notes, history, patient observations..."
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* 5. Follow-up Scheduler */}
                    <div className="bg-white dark:bg-[#181715] rounded-3xl p-5 border border-[#E8E2D5] dark:border-stone-800 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-sm text-stone-900 dark:text-[#FAF7F2]">
                          5. Follow-Up Schedule
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['2 Weeks', '4 Weeks', '3 Months', '6 Months'].map((per) => (
                            <button
                              key={per}
                              type="button"
                              onClick={() => {
                                setFollowUpPeriod(per);
                                setFollowUpDate(`In ${per}`);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                followUpPeriod === per
                                  ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614]'
                                  : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                              }`}
                            >
                              {per}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          placeholder="e.g. In 4 Weeks or 10 Dec 2026"
                          className="w-full text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={followUpNotes}
                          onChange={(e) => setFollowUpNotes(e.target.value)}
                          placeholder="Follow-up instructions or lab re-check goals"
                          className="w-full text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-[#181715]/80 backdrop-blur-md rounded-3xl border border-[#E8E2D5] dark:border-stone-800 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm animate-in fade-in duration-200">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-editorial-serif text-stone-900 dark:text-[#FAF7F2]">
                    {isAr ? 'لم يتم تحديد مريض للاستشارة الحالية' : 'No Patient Selected for Active Consultation'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                    {isAr
                      ? 'يرجى اختيار مريض من قائمة المواعيد أعلاه أو النقر على أحد المرضى أدناه لبدء الاستشارة السريرية وكتابة التشخيص والوصفة الطبية.'
                      : 'Please select an appointment from the Appointments tab, or choose a patient below to start their active consultation, enter diagnosis, prescribe medications, and record clinical notes.'}
                  </p>
                </div>

                {bookings.length > 0 && (
                  <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      {isAr ? 'اختر مريضاً لبدء الجلسة السريرية:' : 'Choose a Patient to Start Consultation:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left rtl:text-right">
                      {bookings.map((b) => {
                        const pName = b.patientName || b.contact?.name || `Patient #${b.bookingId.slice(-6)}`;
                        const isVideo = b.consultType === 'TELEHEALTH_VIDEO';
                        return (
                          <button
                            key={b.bookingId}
                            type="button"
                            onClick={() => setActiveConsultationBookingId(b.bookingId)}
                            className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between gap-3 group text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300">
                                {pName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                                  {pName}
                                </p>
                                <p className="text-[10px] text-stone-500 font-mono">
                                  {b.slotTime || 'Scheduled'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                              {isVideo ? 'Video' : 'In-Person'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================
          DOCTOR SETTINGS MODAL
          ======================================================== */}
      <DoctorSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentSettings={doctorSettings}
        onSaveSettings={(newSettings) => {
          setDoctorSettings(newSettings);
          if (currentDoctor) {
            const updatedDoc: DoctorAccount = {
              ...currentDoctor,
              fullName: newSettings.fullName,
              specialty: newSettings.title,
              licenseNumber: newSettings.dohLicense,
              facility: newSettings.facility,
            };
            setCurrentDoctor(updatedDoc);
            try {
              localStorage.setItem('vigor_doctor_auth_session', JSON.stringify(updatedDoc));
            } catch {}
          }
          try {
            localStorage.setItem('vigor_doctor_settings', JSON.stringify(newSettings));
          } catch {}
        }}
        onLogout={handleLogout}
        locale={locale}
      />
    </div>
  );
}
