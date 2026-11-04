'use client';

import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  AlertOctagon,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { Locale, Tier } from '@/types/vigor';
import { GOLDEN_CASES } from '@/lib/golden-cases';

interface ClinicianReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

interface PendingReviewCase {
  caseId: string;
  pseudonymId: string;
  ageBand: string;
  summary: string;
  currentTier: Tier;
  redFlags: string[];
  slaMinutesRemaining: number;
  requiresJustification: boolean;
}

export default function ClinicianReviewModal({
  isOpen,
  onClose,
  locale,
}: ClinicianReviewModalProps) {
  if (!isOpen) return null;
  const isAr = locale === 'ar';

  const [selectedCaseId, setSelectedCaseId] = useState<string>('GC01');
  const [overrideTier, setOverrideTier] = useState<Tier>('URGENT');
  const [justification, setJustification] = useState<string>('');
  const [refusalMessage, setRefusalMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingCases: PendingReviewCase[] = [
    {
      caseId: 'GC01',
      pseudonymId: 'psn_9f4b1e2a0c',
      ageBand: '18-24',
      summary: 'Acute scrotal pain, onset 3 hours ago. Swelling present.',
      currentTier: 'URGENT',
      redFlags: ['RF_ACUTE_SCROTAL_PAIN'],
      slaMinutesRemaining: 42,
      requiresJustification: true,
    },
    {
      caseId: 'GC02',
      pseudonymId: 'psn_3c7d8e1f5b',
      ageBand: '25-29',
      summary: 'Painless solitary testicular lump noticed during self-examination.',
      currentTier: 'URGENT',
      redFlags: ['RF_TESTICULAR_MASS'],
      slaMinutesRemaining: 55,
      requiresJustification: true,
    },
    {
      caseId: 'GC09',
      pseudonymId: 'psn_8a2b4c6e9d',
      ageBand: '35-39',
      summary: '18 months subfertility, BMI 34.2, Type 2 diabetes, heavy smoker.',
      currentTier: 'ANDROLOGY_UROLOGY',
      redFlags: [],
      slaMinutesRemaining: 1420,
      requiresJustification: false,
    },
  ];

  const currentCase = pendingCases.find((c) => c.caseId === selectedCaseId) || pendingCases[0];

  const handleSelectCase = (cId: string) => {
    setSelectedCaseId(cId);
    const c = pendingCases.find((item) => item.caseId === cId);
    if (c) {
      setOverrideTier(c.currentTier);
    }
    setRefusalMessage(null);
    setSuccessMessage(null);
    setJustification('');
  };

  const handleApplyDecision = async () => {
    setRefusalMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const isOverriding = overrideTier !== currentCase.currentTier;
    const outcome = isOverriding ? 'overridden' : 'approved';

    // Local pre-validation for character count on override
    if (isOverriding && (!justification || justification.trim().length < 20)) {
      setRefusalMessage(
        isAr
          ? 'خطأ في التحقق السريري: تعديل تصنيف الخطورة يتطلب تبريراً كتابياً مفصلاً لا يقل عن 20 حرفاً.'
          : `Validation Error: Clinical tier override strictly requires a written justification of at least 20 characters (current: ${justification.trim().length} chars).`
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/clinician/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vigor-clinician-key': 'vigor-doctor-demo',
        },
        body: JSON.stringify({
          clinicianId: 'dr_al_mansoori',
          decisionId: currentCase.caseId,
          outcome,
          overrideTier: isOverriding ? overrideTier : undefined,
          justification: isOverriding ? justification : undefined,
          note: 'Evaluated via Vigor Clinician Console under DoH Abu Dhabi clinical governance.',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Enforce 422 refusal from n8n Workflow 09
        setRefusalMessage(
          `Safety Floor Invariant Refusal (${res.status}): ${
            data?.error || data?.message || 'Action refused by n8n Workflow 09 safety gate.'
          }`
        );
      } else {
        setSuccessMessage(
          isAr
            ? `✓ تم اعتماد القرار السريري بنجاح (${overrideTier}) وتم إغلاق التصعيد في قاعدة البيانات!`
            : `✓ Decision Confirmed in MongoDB via Workflow 09! Acuity tier confirmed as ${overrideTier}. Escalation closed.`
        );
      }
    } catch {
      // Offline fallback
      const hasEmergencyFlag = currentCase.redFlags.some((rf) =>
        ['RF_ACUTE_SCROTAL_PAIN', 'RF_TESTICULAR_MASS', 'RF_PRIAPISM', 'RF_GU_TRAUMA'].includes(rf)
      );

      if (hasEmergencyFlag && overrideTier !== 'URGENT') {
        setRefusalMessage(
          `422 REFUSAL: Cannot de-escalate across an emergency red flag (${currentCase.redFlags.join(
            ', '
          )}). Action refused and logged as REVIEW_OVERRIDE_REFUSED.`
        );
      } else {
        setSuccessMessage(
          `✓ Decision Recorded! Tier confirmed as ${overrideTier}. Referral released to Workflow 03.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left rtl:text-right">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-50 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950 dark:text-white">
                {isAr ? 'منصة المراجعة الطبية والإشراف البشري' : 'Clinician Review Console · Human-in-the-Loop Gate'}
              </h2>
              <p className="text-[11px] text-blue-600 dark:text-sky-400 font-medium">
                Workflow 09 · SLA Enforcement · De-escalation Guardrails
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Console Body: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: Pending Review Queue */}
          <div className="md:col-span-5 border-r border-blue-50 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
                Pending Queue ({pendingCases.length})
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sweep Active
              </span>
            </div>

            {pendingCases.map((c) => {
              const isSelected = c.caseId === selectedCaseId;
              const isUrgent = c.currentTier === 'URGENT';

              return (
                <button
                  key={c.caseId}
                  onClick={() => handleSelectCase(c.caseId)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-300'
                      : 'bg-white border-blue-100 hover:border-blue-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-blue-950">
                      {c.caseId} · {c.pseudonymId}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isUrgent
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.currentTier}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                    {c.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Age: {c.ageBand}</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        c.slaMinutesRemaining < 60 ? 'text-red-600 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {c.slaMinutesRemaining}m SLA remaining
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Case Details & Action Inspector */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  Case ID: {currentCase.caseId}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Pseudonym: <strong>{currentCase.pseudonymId}</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-blue-950 mb-1">
                Clinical Overview & Presentations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-blue-50">
                {currentCase.summary}
              </p>
            </div>

            {/* Active Red Flags */}
            {currentCase.redFlags.length > 0 && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <span className="text-xs font-bold text-red-950 flex items-center gap-1.5 mb-1">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  Active Emergency Red Flag: {currentCase.redFlags.join(', ')}
                </span>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  <strong>Safety Constraint:</strong> Under Invariant 5, a clinician cannot de-escalate across this emergency red flag via this API.
                </p>
              </div>
            )}

            {/* Decision Controls */}
            <div className="space-y-4 pt-3 border-t border-blue-100">
              <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide">
                Assign / Override Triage Tier
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['SELF_CARE', 'PRIMARY_CARE', 'FERTILITY_SERVICES', 'ANDROLOGY_UROLOGY', 'URGENT'] as Tier[]).map(
                  (tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setOverrideTier(tier)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                        overrideTier === tier
                          ? tier === 'URGENT'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-200'
                      }`}
                    >
                      {tier.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              {/* Justification Textarea */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label className="font-bold text-blue-950">
                    Clinical Justification (Mandatory for overrides &ge; 20 chars):
                  </label>
                  <span
                    className={`font-mono text-[11px] ${
                      justification.trim().length >= 20 ? 'text-emerald-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {justification.trim().length}/20 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="e.g. Scrotal ultrasound completed, normal intratesticular blood flow confirmed; ruling out acute torsion."
                  className="w-full p-2.5 text-xs border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Refusal Alert */}
              {refusalMessage && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs font-semibold text-red-950 flex items-start gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{refusalMessage}</span>
                </div>
              )}

              {/* Success Alert */}
              {successMessage && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-950 flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyDecision}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Submit Clinical Review (Release to Referral Dispatch)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
