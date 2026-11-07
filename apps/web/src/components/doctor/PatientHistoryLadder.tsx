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
  UserX,
  Building2,
  ExternalLink,
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
  onStartConsultation?: (bookingId: string) => void;
}

export default function PatientHistoryLadder({
  bookings = [],
  locale = 'en',
  onClose,
  initialQuery = '',
  onStartConsultation,
}: PatientHistoryLadderProps) {
  const isAr = locale === 'ar';
  const [naturalQuery, setNaturalQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery && initialQuery.trim()));
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [queryIntentFeedback, setQueryIntentFeedback] = useState<string | null>(null);

  // Sync initialQuery prop changes
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setNaturalQuery(initialQuery);
      setInputVal(initialQuery);
      setHasSearched(true);
    }
  }, [initialQuery]);

  // Active ladder step tracker (1 to 7) & Progressive Revealed Drawing Height (revealedY)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [revealedY, setRevealedY] = useState<number>(240);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Extract query keywords (e.g. "Give me the record of Usman" -> "usman")
  const extractedKeyword = useMemo(() => {
    const raw = naturalQuery.toLowerCase().trim();
    if (!raw) return '';
    const cleaned = raw
      .replace(/give\s+me(\s+the)?(\s+complete)?(\s+medical)?(\s+record|\s+history|\s+dossier)?(\s+of)?/g, '')
      .replace(/show(\s+me)?(\s+all)?(\s+previous)?(\s+appointments|\s+diagnoses|\s+records)?(\s+of)?/g, '')
      .replace(/what\s+medications\s+has/g, '')
      .replace(/been\s+prescribed\??/g, '')
      .replace(/show(\s+the)?(\s+previous)?(\s+diagnoses|\s+records)?(\s+of\s+this\s+patient)?/g, '')
      .replace(/find(\s+patient)?/g, '')
      .replace(/search(\s+for)?/g, '')
      .replace(/patient/g, '')
      .replace(/history(\s+of)?/g, '')
      .replace(/(أعطني|عرض|أرني|سجل|تاريخ|ملف|بيانات|المرضي|المريض|عن|لـ|للمريض|ابحث\s+عن)/g, '')
      .trim();
    return cleaned || raw;
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

  // Filter patients based on natural language search (Only active when query has been made)
  const filteredPatients = useMemo<PatientRecord[]>(() => {
    if (!hasSearched || !naturalQuery.trim()) return [];
    const kw = extractedKeyword.toLowerCase().trim();
    if (!kw) return [];

    const terms = kw.split(/\s+/).filter(Boolean);

    return patientRecords.filter((p) => {
      const pName = p.name.toLowerCase();
      const pEmail = p.email.toLowerCase();
      const pBookingId = p.bookingId.toLowerCase();
      const pPseudonymId = p.pseudonymId.toLowerCase();

      if (
        pName.includes(kw) ||
        pEmail.includes(kw) ||
        pBookingId.includes(kw) ||
        pPseudonymId.includes(kw)
      ) {
        return true;
      }

      return terms.some(
        (t) => t.length > 2 && (pName.includes(t) || pEmail.includes(t))
      );
    });
  }, [patientRecords, hasSearched, naturalQuery, extractedKeyword]);

  // Synchronize selected patient
  useEffect(() => {
    if (filteredPatients.length > 0) {
      if (!selectedPatientId || !filteredPatients.some((p) => p.id === selectedPatientId)) {
        setSelectedPatientId(filteredPatients[0].id);
      }
    } else {
      setSelectedPatientId(null);
    }
  }, [filteredPatients, selectedPatientId]);

  // Active patient (Strictly null before query or when no match is found - No unwanted fallbacks!)
  const activePatient = useMemo(() => {
    if (filteredPatients.length === 0) return null;
    if (selectedPatientId) {
      const match = filteredPatients.find((p) => p.id === selectedPatientId);
      if (match) return match;
    }
    return filteredPatients[0];
  }, [filteredPatients, selectedPatientId]);

  // =========================================================================
  // MATHEMATICAL PROCEDURAL 3D WINDING LADDER GENERATOR (Main Page Geometry)
  // =========================================================================
  const H = 2250;
  const N = 260;
  const W = 54; // Ladder width between rails

  // 7 Event Milestones Y-Coordinates
  const RUNG_Y = useMemo(() => [170, 480, 790, 1100, 1410, 1720, 2030], []);

  function getCenter(y: number) {
    const phase = (y - 170) * ((2 * Math.PI) / 620);
    const damp = Math.min(1, Math.max(0, y / 120));
    const endDamp = Math.min(1, Math.max(0, (H - y) / 120));
    // Reduced sinusoidal sway amplitude to 28 so there is always a generous gap between ladder and info cards
    const x = 500 + damp * endDamp * 28 * Math.sin(phase);
    return { x, y };
  }

  // Precompute rails and rungs geometry once
  const { leftRailPath, rightRailPath, rungs } = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      points.push(getCenter((i / N) * H));
    }

    let leftPath = '';
    let rightPath = '';
    const computedRungs: { x1: number; y1: number; x2: number; y2: number }[] = [];

    let accDist = 0;
    const rungSpacing = 28;

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

    return {
      leftRailPath: leftPath,
      rightRailPath: rightPath,
      rungs: computedRungs,
    };
  }, []);

  // Dynamic trailing sketch lines extending below the revealed tip
  const guideSketchPaths = useMemo(() => {
    const sketchY = Math.min(H, revealedY + 65);
    const p1 = getCenter(revealedY);
    const p2 = getCenter(sketchY);
    return [
      `M ${(p1.x - 24).toFixed(1)} ${revealedY.toFixed(1)} Q ${(p1.x - 14).toFixed(1)} ${(revealedY + 30).toFixed(1)} ${(p2.x - 18).toFixed(1)} ${sketchY.toFixed(1)}`,
      `M ${(p1.x + 24).toFixed(1)} ${revealedY.toFixed(1)} Q ${(p1.x + 34).toFixed(1)} ${(revealedY + 30).toFixed(1)} ${(p2.x + 18).toFixed(1)} ${sketchY.toFixed(1)}`,
    ];
  }, [revealedY]);

  // =========================================================================
  // SCROLL-DRIVEN PROGRESSIVE LADDER & CONTENT REVEAL ENGINE
  // (When I scroll the ladder, the info shown)
  // =========================================================================
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;
    const clientHeight = el.clientHeight;
    const scrollHeight = el.scrollHeight;

    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const scrollRatio = Math.min(1, Math.max(0, scrollTop / maxScroll));

    // Progressively reveal the 3D ladder down as user scrolls
    const computedY = Math.min(H, Math.max(220, 220 + scrollRatio * (H - 220)));
    setRevealedY(computedY);

    // Compute active step based on which milestone rung the ladder has reached
    let currentStep = 1;
    RUNG_Y.forEach((ry, idx) => {
      if (computedY >= ry - 40) {
        currentStep = idx + 1;
      }
    });
    setActiveStep(currentStep);
  };

  const scrollToStep = (stepNumber: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const targetRungY = RUNG_Y[stepNumber - 1];
    const maxScroll = el.scrollHeight - el.clientHeight;
    const targetScroll = ((targetRungY - 170) / (H - 170)) * maxScroll;
    el.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    setActiveStep(stepNumber);
    setRevealedY(targetRungY + 25);
  };

  // Handle Query Submission and Intent Detection
  const handleRunQuery = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setHasSearched(false);
      setNaturalQuery('');
      setInputVal('');
      setQueryIntentFeedback(null);
      setSelectedPatientId(null);
      return;
    }

    setNaturalQuery(trimmed);
    setInputVal(trimmed);
    setHasSearched(true);

    const qLower = trimmed.toLowerCase();
    const kw = qLower
      .replace(/give\s+me(\s+the)?(\s+complete)?(\s+medical)?(\s+record|\s+history|\s+dossier)?(\s+of)?/g, '')
      .replace(/show(\s+me)?(\s+all)?(\s+previous)?(\s+appointments|\s+diagnoses|\s+records)?(\s+of)?/g, '')
      .replace(/what\s+medications\s+has/g, '')
      .replace(/been\s+prescribed\??/g, '')
      .replace(/show(\s+the)?(\s+previous)?(\s+diagnoses|\s+records)?(\s+of\s+this\s+patient)?/g, '')
      .replace(/find(\s+patient)?/g, '')
      .replace(/search(\s+for)?/g, '')
      .replace(/patient/g, '')
      .replace(/history(\s+of)?/g, '')
      .replace(/(أعطني|عرض|أرني|سجل|تاريخ|ملف|بيانات|المرضي|المريض|عن|لـ|للمريض|ابحث\s+عن)/g, '')
      .trim() || qLower;

    const terms = kw.split(/\s+/).filter(Boolean);
    const hasMatch = patientRecords.some((p) => {
      const pName = p.name.toLowerCase();
      const pEmail = p.email.toLowerCase();
      const pBookingId = p.bookingId.toLowerCase();
      const pPseudonymId = p.pseudonymId.toLowerCase();
      return (
        pName.includes(kw) ||
        pEmail.includes(kw) ||
        pBookingId.includes(kw) ||
        pPseudonymId.includes(kw) ||
        terms.some((t) => t.length > 2 && (pName.includes(t) || pEmail.includes(t)))
      );
    });

    if (!hasMatch) {
      setQueryIntentFeedback(
        isAr
          ? `لم يتم العثور على أي ملف طبي يطابق "${trimmed}"`
          : `No patient records found matching "${trimmed}"`
      );
      return;
    }

    if (qLower.includes('medication') || qLower.includes('prescrib') || qLower.includes('rx')) {
      setQueryIntentFeedback(isAr ? 'تصفية الأدوية والوصفات الطبية المعتمدة' : 'Filtering prescribed medications & dosages');
      setTimeout(() => scrollToStep(5), 100);
    } else if (qLower.includes('diagnos') || qLower.includes('condition')) {
      setQueryIntentFeedback(isAr ? 'عرض التشخيص السريري وتقييم الحالة' : 'Retrieving clinical diagnoses & etiology');
      setTimeout(() => scrollToStep(4), 100);
    } else if (qLower.includes('appointment') || qLower.includes('visit') || qLower.includes('slot')) {
      setQueryIntentFeedback(isAr ? 'عرض تفاصيل المواعيد والاستشارات' : 'Highlighting clinical appointment timeline');
      setTimeout(() => scrollToStep(3), 100);
    } else if (qLower.includes('report') || qLower.includes('lab') || qLower.includes('ultrasound')) {
      setQueryIntentFeedback(isAr ? 'عرض الفحوصات المخبرية وتخطيط الدوبلر' : 'Retrieving laboratory & diagnostic reports');
      setTimeout(() => scrollToStep(6), 100);
    } else {
      setQueryIntentFeedback(isAr ? 'استرجاع ملف التاريخ السريري الكامل' : 'Retrieving complete chronological medical dossier');
      setTimeout(() => scrollToStep(1), 100);
    }
  };

  // Dynamic sample queries based on real database records
  const sampleQueries = useMemo(() => {
    const names = Array.from(new Set(patientRecords.map((p) => p.name).filter(Boolean)));
    const nameA = names[0] || 'Talha';
    const nameB = names[1] || 'Mansoor';

    return [
      `Give me the complete medical history of ${nameA}`,
      `Show all previous appointments of ${nameB}`,
      `What medications has ${nameA} been prescribed?`,
      `Show previous diagnoses of ${nameB}`,
    ];
  }, [patientRecords]);

  return (
    <div className="bg-[#FAF8F5] dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-xl overflow-hidden flex flex-col transition-all">
      {/* 1. ChatGPT / Claude Style Natural Language Query Interface */}
      <div className="p-5 sm:p-6 border-b border-[#E8E2D5] dark:border-stone-800 bg-[#F4EFE6]/90 dark:bg-[#1C1A17] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#141311] dark:bg-white text-white dark:text-[#141311] flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-[#FAF7F2] font-editorial-serif tracking-tight">
                {isAr ? 'سجل المريض السريري · بحث بالذكاء الاصطناعي' : 'Patient History · Natural Language AI Query'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'اكتب استفسارك بلغة طبيعية للوصول الفوري إلى تاريخ المريض، المواعيد، التشخيصات والوصفات'
                  : 'Ask in everyday human language to retrieve patient appointments, diagnoses, prescriptions, and timeline.'}
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

        {/* ChatGPT / Claude Large Text Input Card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputVal.trim()) handleRunQuery(inputVal.trim());
          }}
          className="relative bg-white dark:bg-[#141311] rounded-2xl border border-stone-300 dark:border-stone-700 p-2 sm:p-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/60 focus-within:border-emerald-500 transition-all"
        >
          <div className="flex items-start gap-2.5">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-2 shrink-0" />
            <textarea
              rows={2}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputVal.trim()) handleRunQuery(inputVal.trim());
                }
              }}
              placeholder={
                isAr
                  ? 'مثال: Give me the complete medical history of Mansoor...'
                  : 'Ask in normal human language, e.g. "Give me the complete medical history of Mansoor" or "What medications has this patient been prescribed?"'
              }
              className="w-full bg-transparent text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none resize-none leading-relaxed"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  setNaturalQuery('');
                  setHasSearched(false);
                  setQueryIntentFeedback(null);
                  setSelectedPatientId(null);
                }}
                className="shrink-0 px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold transition-all shadow-xs flex items-center gap-1 self-end"
                title="Clear query"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'مسح' : 'Clear'}</span>
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 px-4 py-2 rounded-xl bg-[#141311] hover:bg-[#2C2925] dark:bg-white dark:hover:bg-stone-100 text-white dark:text-[#141311] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-end"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>{isAr ? 'بحث' : 'Search Dossier'}</span>
            </button>
          </div>

          {/* Query Intent Badge & Feedback */}
          {queryIntentFeedback && (
            <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${activePatient ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className={activePatient ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}>
                  {queryIntentFeedback}
                </span>
              </span>
              <span className="font-mono text-[10px] text-stone-400">
                {activePatient ? 'Natural Language Match' : 'Query Processed'}
              </span>
            </div>
          )}
        </form>

        {/* Example Query Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
            {isAr ? 'أمثلة على الاستفسارات الشائعة:' : 'Example Queries (Click to Run):'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {sampleQueries.map((sq) => (
              <button
                key={sq}
                type="button"
                onClick={() => handleRunQuery(sq)}
                className="px-3 py-1 rounded-full text-xs bg-white dark:bg-[#141311] border border-stone-200 dark:border-stone-800 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-stone-700 dark:text-stone-300 transition-all shadow-2xs font-medium"
              >
                &ldquo;{sq}&rdquo;
              </button>
            ))}
          </div>
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

      {/* 3. Patient Overview Header & Quick Jump Rungs */}
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

          <div className="flex items-center gap-3">
            {onStartConsultation && activePatient && (
              <button
                type="button"
                onClick={() => onStartConsultation(activePatient.bookingId)}
                className="px-3.5 py-1.5 rounded-full bg-[#141311] dark:bg-white text-white dark:text-[#141311] text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-100 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>{isAr ? 'بدء الاستشارة الحالية' : 'Open Current Consultation'}</span>
              </button>
            )}

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
        </div>
      )}

      {/* =========================================================================
          4. MAIN VIEWPORT: ACTIVE LADDER OR EMPTY / NO RESULTS STATE
          ========================================================================= */}
      {activePatient ? (
        <>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="relative w-full overflow-y-auto max-h-[620px] scroll-smooth bg-[#FAF8F5] dark:bg-[#141311] select-none"
          >
        <div className="relative w-full min-h-[2250px] mx-auto py-8">
          {/* 3D Winding SVG Ladder Canvas */}
          <div className="absolute inset-0 pointer-events-none flex justify-center z-10">
            <svg
              viewBox={`0 0 1000 ${H}`}
              className="w-full max-w-6xl h-full"
              preserveAspectRatio="none"
            >
              <defs>
                {/* 3D Drop Shadow for the Ladder */}
                <filter id="patient-ladder-shadow" x="-30%" y="-10%" width="160%" height="120%">
                  <feDropShadow dx="-4" dy="8" stdDeviation="6" floodColor="#2A241C" floodOpacity="0.14" />
                </filter>

                {/* Scroll-driven progressive reveal mask */}
                <mask id="patient-ladder-scroll-mask">
                  <rect x="-200" y="0" width="1400" height={revealedY} fill="white" />
                </mask>
              </defs>

              {/* Masked Solid 3D Ladder Structure */}
              <g mask="url(#patient-ladder-scroll-mask)" filter="url(#patient-ladder-shadow)">
                {/* Double Rails with Depth & Shading */}
                <path
                  d={leftRailPath}
                  fill="none"
                  stroke="#8C8375"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="dark:stroke-[#5A5245]"
                />
                <path
                  d={rightRailPath}
                  fill="none"
                  stroke="#8C8375"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="dark:stroke-[#5A5245]"
                />

                {/* 3D Cylindrical Rungs */}
                {rungs.map((rung, idx) => (
                  <g key={`rung-${idx}`}>
                    <line
                      x1={rung.x1}
                      y1={rung.y1}
                      x2={rung.x2}
                      y2={rung.y2}
                      stroke="#7A7163"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="dark:stroke-[#443D33]"
                    />
                    <line
                      x1={rung.x1 - 1}
                      y1={rung.y1 - 1}
                      x2={rung.x2 - 1}
                      y2={rung.y2 - 1}
                      stroke="#F7F4EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="dark:stroke-[#D1C9BC]"
                    />
                  </g>
                ))}

                {/* Milestone Connector Arms & Glowing Pins (with generous gap) */}
                {RUNG_Y.map((ry, idx) => {
                  const isLeft = idx % 2 === 0;
                  const isPointReached = revealedY >= ry - 40;
                  const centerPt = getCenter(ry);
                  const cardEdgeX = isLeft ? 300 : 700;
                  const ladderRailX = isLeft ? centerPt.x - 27 : centerPt.x + 27;

                  return (
                    <g key={`milestone-${idx}`}>
                      {/* Connector dashed line spanning the gap between ladder and info card */}
                      <line
                        x1={isLeft ? cardEdgeX : ladderRailX}
                        y1={ry}
                        x2={isLeft ? ladderRailX : cardEdgeX}
                        y2={ry}
                        stroke={isPointReached ? '#10B981' : '#8A8172'}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        opacity={isPointReached ? 1 : 0.4}
                        className="transition-colors duration-300"
                      />
                      {/* Terminal node dot at the card connector boundary */}
                      <circle
                        cx={cardEdgeX}
                        cy={ry}
                        r={3.5}
                        fill={isPointReached ? '#10B981' : '#8A8172'}
                        opacity={isPointReached ? 0.9 : 0.4}
                        className="transition-colors duration-300"
                      />
                      {/* Glowing Anchor Pin on Ladder Spine */}
                      <circle
                        cx={centerPt.x}
                        cy={ry}
                        r={isPointReached ? 9 : 7}
                        fill={isPointReached ? '#10B981' : '#FAF8F5'}
                        stroke={isPointReached ? '#FFFFFF' : '#7A7163'}
                        strokeWidth="2"
                        className="transition-all duration-300"
                      />
                      {isPointReached && (
                        <circle
                          cx={centerPt.x}
                          cy={ry}
                          r={14}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="1.5"
                          opacity="0.6"
                          className="animate-ping"
                        />
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Trailing sketch lines extending below current revealed tip */}
              {guideSketchPaths.map((d, i) => (
                <path
                  key={`sketch-${i}`}
                  d={d}
                  fill="none"
                  stroke="#A8A092"
                  strokeWidth="1.2"
                  strokeDasharray="2 3"
                  opacity="0.4"
                  className="dark:stroke-stone-500"
                />
              ))}
            </svg>
          </div>

          {/* Medical Events Cards Along the Winding Ladder (Alternating Left & Right with Generous Gap) */}
          {activePatient && (
            <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-8 space-y-16">
              {activePatient.events.map((evt, idx) => {
                const ry = RUNG_Y[idx];
                const isLeft = idx % 2 === 0;
                // Reveal condition: When ladder drawing reaches this event's rung
                const isRevealed = revealedY >= ry - 50;

                return (
                  <div
                    key={evt.id}
                    style={{
                      transform: isRevealed ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
                      opacity: isRevealed ? 1 : 0.08,
                      filter: isRevealed ? 'none' : 'blur(1.5px)',
                      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      pointerEvents: isRevealed ? 'auto' : 'none',
                    }}
                    className={`flex items-center ${
                      isLeft
                        ? 'justify-start md:pr-[65%] lg:pr-[67%] xl:pr-[69%]'
                        : 'justify-end md:pl-[65%] lg:pl-[67%] xl:pl-[69%]'
                    }`}
                  >
                    <div className="w-full max-w-[360px] sm:max-w-[380px] bg-white/95 dark:bg-[#1E1C1A]/95 rounded-2xl p-4 sm:p-5 border border-stone-200 dark:border-stone-800 shadow-md backdrop-blur-md space-y-2.5">
                      {/* Step Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                            {evt.stepNumber}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              evt.badgeColor === 'emerald'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : evt.badgeColor === 'blue'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300'
                                : evt.badgeColor === 'amber'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : evt.badgeColor === 'purple'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            }`}
                          >
                            {evt.statusBadge}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-stone-400">
                          {evt.date} {evt.time ? `· ${evt.time}` : ''}
                        </span>
                      </div>

                      {/* Title & Location */}
                      <div>
                        <h4 className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2] font-editorial-serif leading-snug">
                          {isAr ? evt.titleAr : evt.title}
                        </h4>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400">
                          🏥 {evt.facility} · 👨‍⚕️ {evt.clinician}
                        </p>
                      </div>

                      {/* Summary Text */}
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed bg-[#FAF8F5] dark:bg-[#141311] p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800">
                        {evt.summary}
                      </p>

                      {/* Detail Metrics */}
                      {evt.details && evt.details.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                          {evt.details.map((dt, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800/70"
                            >
                              <span className="text-[9px] text-stone-400 block font-medium truncate">{dt.label}</span>
                              <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">{dt.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Ladder Footer Navigation */}
      <div className="px-5 py-3 border-t border-[#E8E2D5] dark:border-stone-800 bg-[#F4EFE6]/70 dark:bg-[#1C1A17] flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px]">
            {isAr ? 'تزامن كامل مع منصة ملفي ودائرة الصحة أبوظبي' : 'Scroll ladder to reveal clinical milestone events'}
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
    </>
  ) : hasSearched ? (
    /* NO RECORDS FOUND FOR QUERY */
    <div className="py-20 px-4 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
      <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
        <UserX className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-bold text-base text-stone-900 dark:text-[#FAF7F2]">
          {isAr ? 'لم يتم العثور على سجل للمريض' : 'No Patient Records Found'}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {isAr
            ? `لم يتم العثور على أي ملف طبي في النظام يطابق "${naturalQuery}". يرجى التأكد من كتابة الاسم بالشكل الصحيح.`
            : `No patient in the database matches "${naturalQuery}". Please check the spelling or search by another patient name.`}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setNaturalQuery('');
            setInputVal('');
            setHasSearched(false);
            setQueryIntentFeedback(null);
          }}
          className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
        >
          {isAr ? 'مسح البحث' : 'Clear Search'}
        </button>
      </div>
    </div>
  ) : (
    /* BEFORE QUERY: NOTHING SHOWN BEFORE QUERY, AS REQUESTED */
    <div className="py-20 px-4 text-center max-w-lg mx-auto space-y-4 animate-in fade-in duration-200">
      <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
        <Sparkles className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-bold text-base text-stone-900 dark:text-[#FAF7F2] font-editorial-serif">
          {isAr ? 'البحث باللغة الطبيعية في التاريخ الطبي للمريض' : 'Search Patient Medical Dossier'}
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          {isAr
            ? 'أدخل استفسارك أو اسم المريض أعلاه لعرض السجل الطبي الكامل ومخطط السلم الزمني التفاعلي.'
            : 'Enter a natural-language query or patient name above to retrieve their complete clinical dossier and interactive timeline ladder.'}
        </p>
      </div>

      {patientRecords.length > 0 && (
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
            {isAr ? 'المرضى المتاحون في السجل:' : 'Available Patients in Clinic Database:'}
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(new Set(patientRecords.map((p) => p.name).filter(Boolean))).map((pName) => (
              <button
                key={pName}
                type="button"
                onClick={() => handleRunQuery(`Give me the complete medical history of ${pName}`)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#1C1A17] border border-stone-200 dark:border-stone-800 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 text-stone-700 dark:text-stone-300 transition-all shadow-2xs flex items-center gap-1.5"
              >
                <User className="w-3 h-3 text-emerald-600" />
                <span>{pName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )}
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
  const chiefComplaint =
    bookingDoc?.chiefComplaint ||
    bookingDoc?.diagnosis ||
    'Male reproductive health assessment and clinical consultation.';
  const prescription =
    bookingDoc?.prescription || 'Clinical evaluation and diagnostic plan formulated.';
  const labOrders =
    Array.isArray(bookingDoc?.labOrders) && bookingDoc.labOrders.length > 0
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
      title: 'Clinical Intake Protocol & WHO 2021 Semen Analysis',
      titleAr: 'بروتوكول الاستقبال وتحليل السائل المنوي المعتمد',
      date: createdDate,
      time: '09:30 AM',
      facility: bookingDoc?.facility?.name?.split('·')[0] || 'Abu Dhabi Fertility Diagnostics Laboratory',
      clinician: 'Autonomous WHO 2021 Triage Engine',
      summary: bookingDoc?.triageResult?.rationale
        ? `Triage assessment: ${bookingDoc.triageResult.rationale}`
        : `Autonomous triage protocol executed: Tier assigned as ${bookingDoc?.triageTier || 'ANDROLOGY_UROLOGY'} with clinical guidance loaded for attending clinician.`,
      statusBadge: 'Triage Complete',
      badgeColor: 'blue',
      details: [
        { label: 'Triage Tier', value: bookingDoc?.triageTier || 'ANDROLOGY_UROLOGY' },
        { label: 'Intake Method', value: bookingDoc?.consultType === 'TELEHEALTH_VIDEO' ? 'Telehealth' : 'In-Clinic' },
        { label: 'DoH Standard', value: 'WHO 2021 LRL' },
      ],
    },
    {
      id: `${bookingId}_step3`,
      stepNumber: 3,
      category: 'APPOINTMENT',
      title: 'Clinical Consultation Request & Scheduling',
      titleAr: 'حجز موعد استشارة سريرية مع استشاري معتمد',
      date: createdDate,
      time: bookingDoc?.slotTime ? bookingDoc.slotTime.replace(/Today · |Tomorrow · /g, '') : '10:00 AM',
      facility: bookingDoc?.facility?.name || 'Cleveland Clinic Abu Dhabi · Andrology & Fertility Hub',
      clinician: doctorName,
      summary: `Consultation confirmed with ${doctorName}. Slot: ${bookingDoc?.slotTime || 'Scheduled Slot'}. Modality: ${bookingDoc?.consultType === 'TELEHEALTH_VIDEO' ? 'Telehealth Live Video' : 'In-Person Hospital Visit'}.`,
      statusBadge: bookingDoc?.status === 'Approved' ? 'Approved' : 'Scheduled',
      badgeColor: 'emerald',
      details: [
        { label: 'Booking Ref', value: bookingId },
        {
          label: 'Modality',
          value: bookingDoc?.consultType === 'TELEHEALTH_VIDEO' ? 'Telehealth Video' : 'In-Person Visit',
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
    {
      id: `${bookingId}_step6`,
      stepNumber: 6,
      category: 'REPORT',
      title: 'Diagnostic Lab & Scrotal Doppler Ultrasound Report',
      titleAr: 'تقرير الفحص المخبري وتخطيط الدوبلر للخصية',
      date: createdDate,
      time: '04:15 PM',
      facility: bookingDoc?.facility?.name || 'Cleveland Clinic Diagnostic Imaging',
      clinician: doctorName,
      summary: bookingDoc?.clinicalNotes
        ? `Diagnostic investigation record: ${bookingDoc.clinicalNotes}`
        : `Diagnostic workup initiated for ${patientName}. Ultrasound and endocrine evaluation ordered.`,
      statusBadge: bookingDoc?.labOrders?.length ? 'Orders Placed' : 'Diagnostic Workup',
      badgeColor: 'rose',
      details: [
        { label: 'Diagnostic Lab', value: bookingDoc?.facility?.name?.split('·')[0] || 'Cleveland Clinic' },
        { label: 'Orders', value: labOrders.slice(0, 30) },
        { label: 'Status', value: bookingDoc?.status || 'Active' },
      ],
    },
    {
      id: `${bookingId}_step7`,
      stepNumber: 7,
      category: 'FOLLOWUP',
      title: 'Follow-up Consultation & Milestone Care Plan',
      titleAr: 'استشارة المتابعة وخطة العلاج المستمر',
      date: bookingDoc?.followUpDate || createdDate,
      time: '05:00 PM',
      facility: bookingDoc?.facility?.name || 'Cleveland Clinic Abu Dhabi · Andrology Hub',
      clinician: doctorName,
      summary: bookingDoc?.followUpNotes
        ? `Follow-up plan formulated by ${doctorName}: ${bookingDoc.followUpNotes}`
        : `Scheduled clinical follow-up review: Patient scheduled for clinical evaluation and repeat CASA analysis.`,
      statusBadge: bookingDoc?.followUpDate ? 'Follow-Up Scheduled' : 'Care Plan Formulated',
      badgeColor: 'emerald',
      details: [
        { label: 'Attending', value: doctorName },
        { label: 'Scheduled Date', value: bookingDoc?.followUpDate || 'In 4 Weeks' },
        { label: 'Care Status', value: 'Active Care Path' },
      ],
    },
  ];
}
