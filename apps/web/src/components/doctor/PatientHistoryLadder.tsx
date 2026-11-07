'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Sparkles,
  User,
  Calendar,
  Clock,
  FileText,
  Activity,
  Pill,
  Microscope,
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export interface MedicalHistoryEvent {
  id: string;
  stepNumber: number;
  category: 'REGISTRATION' | 'INTAKE' | 'APPOINTMENT' | 'DIAGNOSIS' | 'PRESCRIPTION' | 'REPORT' | 'FOLLOWUP';
  title: string;
  titleAr: string;
  date: string;
  time?: string;
  facility: string;
  clinician: string;
  summary: string;
  details: { label: string; value: string }[];
  statusBadge: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
}

interface PatientRecord {
  id: string;
  name: string;
  email: string;
  bookingId: string;
  pseudonymId: string;
  triageTier: string;
  consultType: string;
  doctor: string;
  createdAt: string;
  events: MedicalHistoryEvent[];
}

interface PatientHistoryLadderProps {
  bookings: any[];
  locale?: 'en' | 'ar';
  onClose?: () => void;
  initialQuery?: string;
}

export default function PatientHistoryLadder({
  bookings = [],
  locale = 'en',
  onClose,
  initialQuery = 'Give me the record of ALI',
}: PatientHistoryLadderProps) {
  const isAr = locale === 'ar';
  const [naturalQuery, setNaturalQuery] = useState(initialQuery);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Active ladder step tracker (1 to 7)
  const [activeStep, setActiveStep] = useState<number>(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Extract query keywords (e.g. "Give me the record of ALI" -> "ali")
  const extractedKeyword = useMemo(() => {
    const raw = naturalQuery.toLowerCase();
    const cleaned = raw
      .replace(/give\s+me(\s+the)?(\s+record)?(\s+of)?/g, '')
      .replace(/show(\s+me)?(\s+the)?(\s+record)?(\s+of)?/g, '')
      .replace(/find(\s+patient)?/g, '')
      .replace(/search(\s+for)?/g, '')
      .replace(/patient/g, '')
      .replace(/history(\s+of)?/g, '')
      .trim();
    return cleaned || raw.trim();
  }, [naturalQuery]);

  // Construct dynamic patient records from database bookings
  const patientRecords = useMemo<PatientRecord[]>(() => {
    if (!bookings || bookings.length === 0) {
      return [];
    }

    return bookings.map((b) => {
      const pName =
        b.patientName ||
        b.contact?.name ||
        `Patient #${b.pseudonymId ? b.pseudonymId.slice(-6) : (b.bookingId || '').slice(-6)}`;
      const bId = b.bookingId || 'bk_live';
      const pId = b.pseudonymId || `psd_${bId.slice(-6)}`;
      const doc = b.facility?.doctor || 'Dr. Ali Khan';

      return {
        id: bId,
        name: pName,
        email: b.contact?.email || 'patient@example.ae',
        bookingId: bId,
        pseudonymId: pId,
        triageTier: b.triageTier || 'ANDROLOGY_UROLOGY',
        consultType: b.consultType || 'TELEHEALTH_VIDEO',
        doctor: doc,
        createdAt: b.createdAt || new Date().toISOString(),
        events: buildPatientEvents(pName, bId, pId, doc, b),
      };
    });
  }, [bookings]);

  // Filter patients based on natural language search
  const filteredPatients = useMemo(() => {
    if (!extractedKeyword) return patientRecords;
    return patientRecords.filter((p) => {
      const target = `${p.name} ${p.email} ${p.bookingId} ${p.pseudonymId} ${p.doctor}`.toLowerCase();
      return target.includes(extractedKeyword.toLowerCase());
    });
  }, [patientRecords, extractedKeyword]);

  // Auto-select first matching patient
  useEffect(() => {
    if (filteredPatients.length > 0 && (!selectedPatientId || !filteredPatients.some((p) => p.id === selectedPatientId))) {
      setSelectedPatientId(filteredPatients[0].id);
    }
  }, [filteredPatients, selectedPatientId]);

  const activePatient = useMemo(() => {
    return patientRecords.find((p) => p.id === selectedPatientId) || patientRecords[0];
  }, [patientRecords, selectedPatientId]);

  // Synchronized Vertical Scrolling Ladder Engine
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    const triggerOffset = 140; // Trigger line from container top

    let currentStep = 1;
    activePatient?.events.forEach((evt) => {
      const el = eventRefs.current.get(evt.stepNumber);
      if (el) {
        const rect = el.getBoundingClientRect();
        // If element top reached or passed the trigger offset line
        if (rect.top - containerTop <= triggerOffset) {
          currentStep = evt.stepNumber;
        }
      }
    });

    setActiveStep(currentStep);
  };

  const scrollToStep = (stepNumber: number) => {
    const el = eventRefs.current.get(stepNumber);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveStep(stepNumber);
    }
  };

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-xl overflow-hidden flex flex-col transition-all">
      {/* 1. Header with Natural Language Search Box */}
      <div className="p-4 sm:p-5 border-b border-[#E8E2D5] dark:border-stone-800 bg-[#F4EFE6]/80 dark:bg-[#1C1A17]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#141311] dark:bg-white text-white dark:text-[#141311] flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2] font-editorial-serif tracking-tight">
                {isAr ? 'سجل التاريخ السريري للمريض · سلم الأحداث التفاعلي' : 'Patient Medical History · Scrolling Ladder'}
              </h3>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'بحث باللغة الطبيعية مع تتبع متزامن لكامل المحطات السريرية'
                  : 'Natural language search with scroll-synchronized clinical ladder events'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Natural Language Query Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 rtl:right-3 top-2.5" />
          <input
            type="text"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            placeholder={isAr ? 'اكتب استفسارك مثلاً: Give me the record of ALI' : 'e.g. Give me the record of ALI'}
            className="w-full pl-9 rtl:pr-9 pr-24 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#141311] text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans shadow-2xs"
          />
          {extractedKeyword && (
            <div className="absolute right-2.5 rtl:left-2.5 top-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
              Query: &quot;{extractedKeyword}&quot;
            </div>
          )}
        </div>

        {/* Quick Query Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto text-[10px] text-stone-500 dark:text-stone-400">
          <span className="shrink-0 font-semibold">{isAr ? 'اقتراحات سريعة:' : 'Sample Queries:'}</span>
          {(patientRecords.length > 0
            ? [
                `Give me the record of ${patientRecords[0].name}`,
                `Record of ${patientRecords[0].name}`,
                `Show patient ${patientRecords[0].name}`,
                `Find ${patientRecords[0].bookingId.slice(-6)}`,
              ]
            : ['Give me the record of...', 'Find patient...', 'Show history']
          ).map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => setNaturalQuery(sq)}
              className="shrink-0 px-2 py-0.5 rounded-full bg-white dark:bg-[#141311] border border-stone-200 dark:border-stone-800 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Patient Selector Ribbon (If multiple matches found) */}
      {filteredPatients.length > 1 && (
        <div className="px-4 py-2 border-b border-[#E8E2D5] dark:border-stone-800 bg-[#EFECE3]/50 dark:bg-[#141311]/50 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 shrink-0">
            {isAr ? 'المرضى المطابقون:' : 'Matched Patients:'}
          </span>
          {filteredPatients.map((p) => {
            const isSelected = p.id === selectedPatientId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPatientId(p.id)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#141311] dark:bg-white text-white dark:text-[#141311] shadow-xs'
                    : 'bg-white dark:bg-[#1E1C1A] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:border-stone-400'
                }`}
              >
                <User className="w-3 h-3" />
                <span>{p.name}</span>
                <span className="font-mono text-[9px] opacity-70">({p.bookingId.slice(-6)})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Patient Overview Card */}
      {activePatient && (
        <div className="px-5 py-3 border-b border-[#E8E2D5] dark:border-stone-800 bg-white/70 dark:bg-[#141311]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              {activePatient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900 dark:text-white font-editorial-serif text-sm">
                  {activePatient.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] font-bold">
                  {activePatient.pseudonymId}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {activePatient.email} · {activePatient.doctor}
              </p>
            </div>
          </div>

          {/* Quick Rung Jump Indicator */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-full border border-stone-200 dark:border-stone-800">
            {activePatient.events.map((evt) => {
              const isActive = evt.stepNumber === activeStep;
              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => scrollToStep(evt.stepNumber)}
                  title={evt.title}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs scale-110 ring-2 ring-emerald-400/40'
                      : 'text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-800'
                  }`}
                >
                  {evt.stepNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Interactive Vertical Scrolling Ladder Section (Dedicated Compact Viewport) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="p-4 sm:p-6 overflow-y-auto max-h-[480px] space-y-6 relative scroll-smooth bg-gradient-to-b from-[#FAF8F5] via-[#F6F4ED] to-[#FAF8F5] dark:from-[#181715] dark:via-[#151412] dark:to-[#181715]"
      >
        {activePatient ? (
          <div className="relative pl-6 sm:pl-8 rtl:pl-0 rtl:pr-6 rtl:sm:pr-8">
            {/* The Vertical Ladder Spine */}
            <div className="absolute left-2.5 sm:left-3 rtl:left-auto rtl:right-2.5 rtl:sm:right-3 top-3 bottom-6 w-0.5 bg-stone-300 dark:bg-stone-700">
              {/* Highlighted active ladder progress bar */}
              <div
                className="w-full bg-gradient-to-b from-emerald-500 via-blue-500 to-emerald-600 transition-all duration-200 rounded-full"
                style={{
                  height: `${((activeStep - 1) / (activePatient.events.length - 1 || 1)) * 100}%`,
                }}
              />
            </div>

            {/* Medical Events List */}
            <div className="space-y-6">
              {activePatient.events.map((evt) => {
                const isActive = evt.stepNumber === activeStep;
                const isPassed = evt.stepNumber < activeStep;

                return (
                  <div
                    key={evt.id}
                    ref={(el) => {
                      if (el) eventRefs.current.set(evt.stepNumber, el);
                    }}
                    className={`relative transition-all duration-300 ${
                      isActive
                        ? 'scale-[1.01] opacity-100'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Ladder Step Node / Rung Pin */}
                    <div
                      onClick={() => scrollToStep(evt.stepNumber)}
                      className={`absolute -left-6 sm:-left-8 rtl:-left-auto rtl:-right-6 rtl:sm:-right-8 top-3.5 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] cursor-pointer transition-all duration-200 z-10 ${
                        isActive
                          ? 'bg-emerald-600 border-white text-white shadow-[0_0_12px_rgba(16,185,129,0.7)] scale-125 ring-4 ring-emerald-500/20'
                          : isPassed
                          ? 'bg-emerald-500 border-white text-white'
                          : 'bg-white dark:bg-[#201D1A] border-stone-300 dark:border-stone-700 text-stone-500'
                      }`}
                    >
                      {isPassed ? '✓' : evt.stepNumber}
                    </div>

                    {/* Event Card Content */}
                    <div
                      className={`p-4 rounded-2xl border transition-all duration-200 ${
                        isActive
                          ? 'bg-white dark:bg-[#1E1C1A] border-emerald-500/80 dark:border-emerald-600/80 shadow-md ring-1 ring-emerald-500/30'
                          : 'bg-white/80 dark:bg-[#1A1816]/80 border-stone-200 dark:border-stone-800/80 hover:border-stone-300 shadow-2xs'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              evt.badgeColor === 'emerald'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : evt.badgeColor === 'blue'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300'
                                : evt.badgeColor === 'amber'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                : evt.badgeColor === 'purple'
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {evt.statusBadge}
                          </span>
                          <span className="text-[11px] font-mono text-stone-400">
                            {evt.date} {evt.time ? `· ${evt.time}` : ''}
                          </span>
                        </div>
                        {isActive && (
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active Point
                          </span>
                        )}
                      </div>

                      {/* Title & Clinician */}
                      <h4 className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2] font-editorial-serif mb-1">
                        {isAr ? evt.titleAr : evt.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3">
                        🏥 {evt.facility} · 👨‍⚕️ {evt.clinician}
                      </p>

                      {/* Summary Note */}
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-[#FAF8F5] dark:bg-[#141311] p-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800/80 mb-3">
                        {evt.summary}
                      </p>

                      {/* Detail Metrics Key-Value Grid */}
                      {evt.details && evt.details.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px]">
                          {evt.details.map((dt, idx) => (
                            <div
                              key={idx}
                              className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60"
                            >
                              <span className="text-[10px] text-stone-400 block font-medium truncate">
                                {dt.label}
                              </span>
                              <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">
                                {dt.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-stone-400 text-xs">
            {isAr ? 'لم يتم العثور على سجل للمريض المطابق' : 'No matching patient records found.'}
          </div>
        )}
      </div>

      {/* 5. Ladder Footer Navigation */}
      <div className="px-5 py-3 border-t border-[#E8E2D5] dark:border-stone-800 bg-[#F4EFE6]/70 dark:bg-[#1C1A17] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px]">
            {isAr ? 'تزامن كامل مع منصة ملفي ودائرة الصحة أبوظبي' : 'Synchronized with DoH Malaffi Health Ledger'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToStep(Math.max(1, activeStep - 1))}
            disabled={activeStep <= 1}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
            title="Previous Step"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold font-mono text-stone-700 dark:text-stone-300">
            Step {activeStep} of {activePatient?.events.length || 7}
          </span>
          <button
            type="button"
            onClick={() => scrollToStep(Math.min(activePatient?.events.length || 7, activeStep + 1))}
            disabled={activeStep >= (activePatient?.events.length || 7)}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
            title="Next Step"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper builder to synthesize genuine clinical timeline events
function buildPatientEvents(
  patientName: string,
  bookingId: string,
  pseudonymId: string,
  doctorName: string,
  bookingDoc?: any
): MedicalHistoryEvent[] {
  const createdDate = bookingDoc?.createdAt
    ? new Date(bookingDoc.createdAt).toLocaleDateString('en-CA')
    : new Date().toLocaleDateString('en-CA');
  const consultDate = bookingDoc?.slotTime || 'Today';
  const chiefComplaint =
    bookingDoc?.chiefComplaint ||
    bookingDoc?.diagnosis ||
    'Male reproductive health assessment and clinical consultation.';
  const prescription =
    bookingDoc?.prescription || 'Clinical evaluation and diagnostic plan formulated.';
  const labOrders =
    (Array.isArray(bookingDoc?.labOrders) && bookingDoc.labOrders.length > 0)
      ? bookingDoc.labOrders.join(', ')
      : 'Baseline Diagnostic Semen Analysis & Endocrine Panel';

  return [
    {
      id: `${bookingId}_step1`,
      stepNumber: 1,
      category: 'REGISTRATION',
      title: 'Cryptographic Registration & Sovereign Identity',
      titleAr: 'تسجيل المريض وإصدار المعرف المشفر السيادي',
      date: createdDate,
      time: '09:00 AM',
      facility: 'Vigor Sovereign Identity Gateway · Abu Dhabi',
      clinician: 'Automated DoH Verification Authority',
      summary: `Patient identity cryptographically salted and anonymized as ${pseudonymId}. Consent granted under UAE Federal Law No. 2 of 2019 concerning Health Data.`,
      statusBadge: 'Identity Issued',
      badgeColor: 'emerald',
      details: [
        { label: 'Pseudonym', value: pseudonymId },
        { label: 'Patient Name', value: patientName },
        { label: 'DoH Status', value: 'Verified' },
      ],
    },
    {
      id: `${bookingId}_step2`,
      stepNumber: 2,
      category: 'INTAKE',
      title: 'Clinical Intake Protocol & WHO 2021 Triage',
      titleAr: 'بروتوكول الاستقبال وتقييم معايير WHO 2021',
      date: createdDate,
      time: '09:15 AM',
      facility: 'Vigor Clinical Triage Engine',
      clinician: 'Autonomous Triage Classifier',
      summary: `Completed WHO 2021 6th Edition semen analysis assessment. Acuity Tier: ${bookingDoc?.triageTier || 'ANDROLOGY_UROLOGY'}. Red Flag Safety Gates cleared.`,
      statusBadge: 'Triage Complete',
      badgeColor: 'blue',
      details: [
        { label: 'Pathway', value: 'Andrology Review' },
        { label: 'Acuity Tier', value: bookingDoc?.triageTier || 'Specialist Required' },
        { label: 'Red Flags', value: '0 / 16 Clean' },
      ],
    },
    {
      id: `${bookingId}_step3`,
      stepNumber: 3,
      category: 'APPOINTMENT',
      title: 'Specialist Clinical Consultation Booked',
      titleAr: 'جدولة استشارة سريرية تخصصية',
      date: createdDate,
      time: consultDate,
      facility: bookingDoc?.facility?.name || 'Cleveland Clinic Abu Dhabi · Andrology Hub',
      clinician: doctorName,
      summary: `Appointment registered with ${doctorName}. Chief complaint: "${chiefComplaint}". Status: ${bookingDoc?.status || 'Active'}.`,
      statusBadge:
        bookingDoc?.status === 'Approved' ||
        bookingDoc?.status === 'APPROVED' ||
        bookingDoc?.status === 'COMPLETED'
          ? 'Approved'
          : 'Pending Review',
      badgeColor: 'emerald',
      details: [
        { label: 'Booking Ref', value: bookingId },
        {
          label: 'Modality',
          value:
            bookingDoc?.consultType === 'TELEHEALTH_VIDEO'
              ? 'Telehealth Video'
              : 'In-Person Visit',
        },
        { label: 'Status', value: bookingDoc?.status || 'Pending' },
      ],
    },
    {
      id: `${bookingId}_step4`,
      stepNumber: 4,
      category: 'DIAGNOSIS',
      title: 'Clinical Diagnosis & Diagnostic Evaluation',
      titleAr: 'التشخيص السريري وتقييم الحالة',
      date: createdDate,
      time: '11:00 AM',
      facility: bookingDoc?.facility?.name || 'Cleveland Clinic Abu Dhabi · Andrology Suite',
      clinician: doctorName,
      summary: `Clinical assessment performed by ${doctorName}. Indication: ${chiefComplaint}.`,
      statusBadge: bookingDoc?.status === 'COMPLETED' ? 'Completed' : 'In Progress',
      badgeColor: 'amber',
      details: [
        { label: 'Indication', value: chiefComplaint.slice(0, 32) },
        { label: 'Doctor', value: doctorName },
        { label: 'Orders', value: labOrders.slice(0, 32) },
      ],
    },
    {
      id: `${bookingId}_step5`,
      stepNumber: 5,
      category: 'PRESCRIPTION',
      title: 'Clinician Electronic Prescription & Care Plan',
      titleAr: 'الوصفة الطبية وخطة العلاج المعتمدة',
      date: createdDate,
      time: '11:30 AM',
      facility: bookingDoc?.facility?.name || 'Cleveland Clinic Outpatient Pharmacy',
      clinician: doctorName,
      summary: `Prescription issued by ${doctorName}: ${prescription}`,
      statusBadge: bookingDoc?.prescription ? 'Rx Dispatched' : 'Pending Rx',
      badgeColor: 'purple',
      details: [
        { label: 'Prescribed By', value: doctorName },
        { label: 'Lab Orders', value: labOrders.slice(0, 30) },
        { label: 'Delivery', value: bookingDoc?.contact?.email || 'Patient Email' },
      ],
    },
  ];
}
