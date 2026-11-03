'use client';

import React from 'react';
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
} from 'lucide-react';
import { TriageResult, Locale } from '@/types/vigor';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TriageResult | null;
  locale: Locale;
  onOpenConsent: () => void;
  onOpenAtHomeKit: () => void;
}

export default function ResultsModal({
  isOpen,
  onClose,
  result,
  locale,
  onOpenConsent,
  onOpenAtHomeKit,
}: ResultsModalProps) {
  if (!isOpen || !result) return null;
  const isAr = locale === 'ar';

  const isUrgent = result.tier === 'URGENT';
  const isAndrology = result.tier === 'ANDROLOGY_UROLOGY';
  const isFertility = result.tier === 'FERTILITY_SERVICES';
  const isPrimary = result.tier === 'PRIMARY_CARE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                isUrgent ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              {isUrgent ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950">
                {isAr ? 'نتائج الفرز السريري وشرح المخاطر' : 'Clinical Triage & Risk Breakdown'}
              </h2>
              <p className="text-[11px] text-blue-600 font-medium">
                {isAr ? 'تقرير فرز استرشادي معتمد' : 'Explainable Guidance & Recommended Pathway'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Tier Acuity Banner */}
          <div
            className={`rounded-2xl p-6 border ${
              isUrgent
                ? 'bg-red-50/80 border-red-200'
                : isAndrology
                ? 'bg-blue-50/80 border-blue-200'
                : 'bg-slate-50 border-blue-100'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  {isAr ? 'فئة التوجيه السريري المحسوبة' : 'Calculated Clinical Triage Tier'}
                </span>
                <div className="flex items-center gap-3">
                  <h3
                    className={`text-2xl font-black ${
                      isUrgent
                        ? 'text-red-700'
                        : isAndrology
                        ? 'text-blue-900'
                        : 'text-blue-950'
                    }`}
                  >
                    {result.tier.replace('_', ' ')}
                  </h3>
                  {result.clamped && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Safety Clamped
                    </span>
                  )}
                </div>
              </div>

              {/* Confidence Score Pill */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-xs">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-950">
                  {Math.round(result.overall.confidence * 100)}% Confidence
                </span>
              </div>
            </div>

            {/* Recommended Service & Guidance */}
            <div className="mt-4 pt-4 border-t border-blue-100/60">
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
                {isAr ? 'الخدمة السريرية الموصى بها:' : 'Recommended Care Pathway:'}
              </p>
              <p className="text-sm font-semibold text-slate-800 mb-2">
                {isAr ? result.recommendedServiceAr : result.recommendedService}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isAr ? result.actionGuidanceAr : result.actionGuidance}
              </p>
            </div>
          </div>

          {/* Red Flag Alerts (if any triggered) */}
          {result.redFlags.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>
                  {isAr
                    ? `تم رصد ${result.redFlags.length} علامة إنذار حمراء طارئة`
                    : `${result.redFlags.length} Clinical Red Flag(s) Active`}
                </span>
              </div>
              {result.redFlags.map((rf) => (
                <div key={rf.code} className="bg-white p-3 rounded-xl border border-red-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-red-900 mb-1">
                    <span>{rf.code}</span>
                    <span className="flex items-center gap-1 text-[11px] text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3" />
                      SLA: &le; {rf.slaMinutes} mins
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{rf.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Domain Breakdown Cards */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">
              {isAr ? 'تفصيل درجات المخاطر حسب المحاور السريرية' : '5 Clinical Domain Scores & Drivers'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.domains.map((dom) => (
                <div
                  key={dom.name}
                  className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-950">{dom.name}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        dom.band === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : dom.band === 'ELEVATED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {dom.band} ({dom.score}/100)
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1">
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
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Uncertainty / Missing Inputs:</strong>{' '}
                <span>{result.missingInputs.join(', ')} were skipped. Confidence was adjusted to {Math.round(result.overall.confidence * 100)}%.</span>
              </div>
            </div>
          )}

          {/* Mandatory Boundary Payload Display */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Non-Negotiable Medical Boundary (Payload Invariant):</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {isAr ? result.boundary.statementAr : result.boundary.statement}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-blue-50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenConsent}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-blue-50 transition-colors"
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
              className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-blue-200 text-blue-900 hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Package className="w-4 h-4 text-blue-600" />
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
