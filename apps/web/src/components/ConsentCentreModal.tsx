'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { Locale, ConsentScope } from '@/types/vigor';
import {
  getStoredConsentState,
  revokeAllConsents,
  grantConsentScope,
  StoredConsentState,
} from '@/lib/consent-store';

interface ConsentCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export default function ConsentCentreModal({
  isOpen,
  onClose,
  locale,
}: ConsentCentreModalProps) {
  if (!isOpen) return null;
  const isAr = locale === 'ar';

  const [state, setState] = useState<StoredConsentState>(getStoredConsentState());
  const [copiedPsn, setCopiedPsn] = useState(false);
  const [lastRevocationReceipt, setLastRevocationReceipt] = useState<any>(null);

  const handleCopyPsn = () => {
    navigator.clipboard.writeText(state.pseudonymId);
    setCopiedPsn(true);
    setTimeout(() => setCopiedPsn(false), 2000);
  };

  const handleRevoke = () => {
    const receipt = revokeAllConsents();
    setLastRevocationReceipt(receipt);
    setState(getStoredConsentState());
  };

  const handleGrantScope = (scope: ConsentScope) => {
    grantConsentScope([scope]);
    setState(getStoredConsentState());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950">
                {isAr ? 'مركز الخصوصية ودفتر الموافقة' : 'Consent & Privacy Centre'}
              </h2>
              <p className="text-[11px] text-blue-600 font-medium">
                {isAr
                  ? 'سجل غير قابل للتعديل · التحكم الكامل ببياناتك'
                  : 'Append-Only Ledger · Complete User Sovereign Control'}
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
          {/* Pseudonym Id Box */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                Active Pseudonym ID (Pseudonymized Identity)
              </span>
              <span className="font-mono text-sm font-black text-blue-950 tracking-wide">
                {state.pseudonymId}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Clinical records link ONLY to this pseudonym. No personal identifiers are stored in clinical tables.
              </p>
            </div>

            <button
              onClick={handleCopyPsn}
              className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copiedPsn ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPsn ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Revocation Alert Receipt Banner */}
          {lastRevocationReceipt && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <span>Revocation Cascade Complete · Cryptographic Receipt</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed mb-2">
                All facility share tokens have been immediately invalidated. Any ongoing referral or kit dispatch is terminated.
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100 font-mono text-[10px] text-slate-700 space-y-0.5">
                <p><strong>Receipt ID:</strong> {lastRevocationReceipt.receiptId}</p>
                <p><strong>Timestamp:</strong> {lastRevocationReceipt.revokedAt}</p>
                <p><strong>Hash Proof:</strong> {lastRevocationReceipt.hashProof}</p>
              </div>
            </div>
          )}

          {/* Active Consents Ledger */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Append-Only Consent Ledger
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {state.consents.filter((c) => c.status === 'ACTIVE').length} Active Scopes
              </span>
            </div>

            <div className="space-y-2">
              {state.consents.map((c) => (
                <div
                  key={c.consentId}
                  className="bg-white p-3 rounded-xl border border-blue-100 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-900">
                        {c.consentId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.scopes.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.grantedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revoke All Trigger */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                Instant Revocation Cascade
              </h4>
              <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
                Revoking consent instantly kills active referral tokens in Workflow 07. Partner clinics will receive a 401 Unauthorized if attempting to access results.
              </p>
            </div>

            <button
              onClick={handleRevoke}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              Revoke All Now
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-blue-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
