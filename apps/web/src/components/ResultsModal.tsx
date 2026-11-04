'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle,
  Lock,
  ChevronRight,
  Package,
  Calendar,
  FileText,
  AlertCircle,
  HelpCircle,
  Mail,
  Send,
} from 'lucide-react';
import { TriageResult, Locale, IntakeAnswers } from '@/types/vigor';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TriageResult | null;
  locale: Locale;
  onOpenConsent: () => void;
  onOpenAtHomeKit: () => void;
  recipientEmail?: string;
  answers?: IntakeAnswers;
}

export default function ResultsModal({
  isOpen,
  onClose,
  result,
  locale,
  onOpenConsent,
  onOpenAtHomeKit,
  recipientEmail,
  answers,
}: ResultsModalProps) {
  const [emailInput, setEmailInput] = useState(recipientEmail || '');
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(
    recipientEmail ? `Report automatically formatted and dispatched to ${recipientEmail}` : null
  );
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  // Sync if recipientEmail changes
  React.useEffect(() => {
    if (recipientEmail) {
      setEmailInput(recipientEmail);
      setEmailStatus(`Report automatically formatted and dispatched to ${recipientEmail}`);
    }
  }, [recipientEmail]);

  if (!isOpen || !result) return null;
  const isAr = locale === 'ar';

  const isUrgent = result.tier === 'URGENT';
  const isAndrology = result.tier === 'ANDROLOGY_UROLOGY';
  const isFertility = result.tier === 'FERTILITY_SERVICES';
  const isPrimary = result.tier === 'PRIMARY_CARE';

  const handleSendEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) return;
    setEmailSending(true);
    try {
      const res = await fetch('/api/report/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          triageResult: result,
          answers,
          locale,
        }),
      });
      if (res.ok) {
        setEmailStatus(`Report successfully dispatched to ${emailInput.trim()}`);
      } else {
        setEmailStatus('Failed to dispatch report. Please check the email address.');
      }
    } catch {
      setEmailStatus('Network error while dispatching report.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left rtl:text-right">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-50 dark:border-slate-800 flex items-center justify-between bg-blue-50/40 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                isUrgent ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {isUrgent ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950 dark:text-white">
                {isAr ? 'نتائج الفرز السريري وشرح المخاطر' : 'Clinical Triage & Risk Breakdown'}
              </h2>
              <p className="text-[11px] text-blue-600 font-medium">
                {isAr ? 'تقرير فرز استرشادي معتمد' : 'Explainable Guidance & Recommended Pathway'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Automated Email Dispatch Status Banner */}
          {emailStatus && (
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{emailStatus}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 underline hover:text-emerald-950 dark:hover:text-white"
              >
                {showEmailPreview ? 'Close Preview' : 'Preview Formatted Email Report ↗'}
              </button>
            </div>
          )}

          {/* Main Tier Acuity Banner */}
          <div
            className={`rounded-2xl p-6 border ${
              isUrgent
                ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                : isAndrology
                ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60'
                : 'bg-slate-50 dark:bg-[#1C1A17] border-blue-100 dark:border-stone-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-stone-400 block mb-1">
                  {isAr ? 'فئة التوجيه السريري المحسوبة' : 'Calculated Clinical Triage Tier'}
                </span>
                <div className="flex items-center gap-3">
                  <h3
                    className={`text-2xl font-black ${
                      isUrgent
                        ? 'text-red-700 dark:text-red-400'
                        : isAndrology
                        ? 'text-blue-900 dark:text-sky-300'
                        : 'text-blue-950 dark:text-[#FAF7F2]'
                    }`}
                  >
                    {result.tier.replace('_', ' ')}
                  </h3>
                  {result.clamped && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Safety Clamped
                    </span>
                  )}
                </div>
              </div>

              {/* Confidence Score Pill */}
              <div className="flex items-center gap-2 bg-white dark:bg-[#1C1A17] px-3 py-1.5 rounded-xl border border-blue-100 dark:border-stone-700 shadow-xs">
                <Activity className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span className="text-xs font-bold text-blue-950 dark:text-[#FAF7F2]">
                  {Math.round(result.overall.confidence * 100)}% Confidence
                </span>
              </div>
            </div>

            {/* Recommended Service & Guidance */}
            <div className="mt-4 pt-4 border-t border-red-200/60 dark:border-red-900/50">
              <p className="text-xs font-bold text-red-900 dark:text-red-300 uppercase tracking-wide mb-1">
                {isAr ? 'الخدمة السريرية الموصى بها:' : 'Recommended Care Pathway:'}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#FAF7F2] mb-2">
                {isAr ? result.recommendedServiceAr : result.recommendedService}
              </p>
              <p className="text-xs text-slate-700 dark:text-[#DDD7C8] leading-relaxed">
                {isAr ? result.actionGuidanceAr : result.actionGuidance}
              </p>
            </div>
          </div>

          {/* Red Flag Alerts (if any triggered) */}
          {result.redFlags.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-3">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span>
                  {isAr
                    ? `تم رصد ${result.redFlags.length} علامة إنذار حمراء طارئة`
                    : `${result.redFlags.length} Clinical Red Flag(s) Active`}
                </span>
              </div>
              {result.redFlags.map((rf) => (
                <div key={rf.code} className="bg-white dark:bg-[#1C1A17] p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs shadow-xs">
                  <div className="flex items-center justify-between font-bold text-red-900 dark:text-red-400 mb-1.5">
                    <span className="font-mono text-xs">{rf.code}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/80 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/50">
                      <Clock className="w-3 h-3" />
                      SLA: &le; {rf.slaMinutes} mins
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-[#DDD7C8] leading-relaxed">{rf.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Domain Breakdown Cards */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 dark:text-white uppercase tracking-wider mb-3">
              {isAr ? 'تفصيل درجات المخاطر حسب المحاور السريرية' : '5 Clinical Domain Scores & Drivers'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.domains.map((dom) => (
                <div
                  key={dom.name}
                  className="bg-white dark:bg-[#1C1A17] p-3.5 rounded-xl border border-blue-100 dark:border-stone-800 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-950 dark:text-[#FAF7F2]">{dom.name}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        dom.band === 'HIGH'
                          ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300'
                          : dom.band === 'ELEVATED'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300'
                      }`}
                    >
                      {dom.band} ({dom.score}/100)
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-[#C5BEB2] space-y-1">
                    {dom.drivers.map((drv, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{drv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Inputs / Uncertainty */}
          {result.missingInputs.length > 0 && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Uncertainty / Missing Inputs:</strong>{' '}
                <span>{result.missingInputs.join(', ')} were skipped. Confidence was adjusted to {Math.round(result.overall.confidence * 100)}%.</span>
              </div>
            </div>
          )}

          {/* Mandatory Boundary Payload Display */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 dark:text-white">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Non-Negotiable Medical Boundary (Payload Invariant):</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {isAr ? result.boundary.statementAr : result.boundary.statement}
            </p>
          </div>

          {/* Confidential Report Email Dispatch Section */}
          <div className="bg-[#FAF8F5] dark:bg-[#1C1A17] p-5 rounded-2xl border border-[#DDD7C8] dark:border-stone-800 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EFECE3] dark:bg-[#28241F] flex items-center justify-center text-[#2E2922] dark:text-[#FAF7F2] shrink-0 border border-[#DDD7C8] dark:border-stone-700">
                  <Mail className="w-4 h-4 text-[#7A7163] dark:text-[#DDD7C8]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2E2922] dark:text-[#FAF7F2]">
                    {isAr ? 'إرسال التقرير السري إلى بريدك' : 'Confidential Report Email Dispatch'}
                  </h4>
                  <p className="text-[11px] text-[#7A7163] dark:text-[#A8A092]">
                    {isAr
                      ? 'احصل على نسخة كاملة بتنسيق فاخر متوافق مع معايير منظمة الصحة العالمية 2021.'
                      : 'Send or resend a matched-theme clinical report to your email.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your.email@example.com"
                  className="px-3.5 py-2 text-xs rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-[#25221E] text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#7A7163] w-full sm:w-56"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={emailSending || !emailInput.includes('@')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2E2922] dark:bg-[#FAF8F5] text-[#FAF8F5] dark:text-[#181614] hover:bg-[#453E34] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{emailSending ? 'Sending...' : 'Send Report'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#DDD7C8] dark:border-stone-700 text-[#7A7163] dark:text-[#DDD7C8] hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors shrink-0"
                >
                  {showEmailPreview ? 'Hide' : 'Preview'}
                </button>
              </div>
            </div>

            {/* Live Rendered Email Report Preview */}
            {showEmailPreview && (
              <div className="mt-4 pt-4 border-t border-[#DDD7C8] dark:border-stone-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold text-[#7A7163] dark:text-[#A8A092] uppercase tracking-wider">
                    {isAr ? 'معاينة حية للتقرير المرسل عبر البريد:' : 'Live Rendered Email Report Preview:'}
                  </span>
                  <a
                    href={`/api/report/email?email=${encodeURIComponent(emailInput || 'patient@example.com')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline"
                  >
                    Open Full Report in New Tab ↗
                  </a>
                </div>
                <div className="w-full h-80 rounded-xl border border-[#DDD7C8] dark:border-stone-800 overflow-hidden bg-white shadow-inner">
                  <iframe
                    src={`/api/report/email?email=${encodeURIComponent(emailInput || 'patient@example.com')}`}
                    title="Email Report Preview"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#181715] border-t border-blue-50 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenConsent}
            className="text-xs font-bold text-blue-700 dark:text-sky-300 hover:text-blue-900 dark:hover:text-white flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-blue-50 dark:hover:bg-stone-800 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Manage Consent / View Ledger</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenAtHomeKit();
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#25221E] border border-blue-200 dark:border-stone-700 text-blue-900 dark:text-[#FAF7F2] hover:bg-blue-50 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Package className="w-4 h-4 text-blue-600 dark:text-sky-400" />
              <span>Order Discreet At-Home Kit</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
