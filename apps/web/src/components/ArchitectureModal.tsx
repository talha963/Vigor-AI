'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Cpu,
  GitBranch,
  Shield,
  Layers,
  CheckCircle,
  ExternalLink,
  Workflow,
  Server,
  Terminal,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export default function ArchitectureModal({
  isOpen,
  onClose,
  locale,
}: ArchitectureModalProps) {
  if (!isOpen) return null;
  const isAr = locale === 'ar';

  const WORKFLOWS = [
    {
      id: 'vigor01',
      name: 'Intake Completed → Risk & Triage',
      trigger: 'POST /webhook/vigor/intake-completed',
      nodes: 33,
      desc: 'Validates intake, runs red-flag gate, requests agent score, reconciles with escalate-only clamp, writes decision.',
    },
    {
      id: 'vigor02',
      name: 'Red-flag Escalation & SLA Sweep',
      trigger: 'Webhook + Cron */5 * * * *',
      nodes: 27,
      desc: 'Sweeps unacknowledged emergency escalations every 5 minutes; alerts on-call doctor; marks breaches.',
    },
    {
      id: 'vigor03',
      name: 'Referral Dispatch & Completion',
      trigger: '2 Webhooks (/referral-consent, /referral-status)',
      nodes: 47,
      desc: 'Consent-gated referral dispatch with clinician review check. Refuses dispatch if human review is pending.',
    },
    {
      id: 'vigor04',
      name: 'At-home Kit Logistics',
      trigger: 'POST /webhook/vigor/kit-request + Cron 0 9 * * *',
      nodes: 33,
      desc: 'Books discreet courier or smart-locker bay, checks tracking, nudges for sample return.',
    },
    {
      id: 'vigor05',
      name: 'Lab Result Ingestion & Re-score',
      trigger: 'POST /webhook/vigor/lab-result',
      nodes: 26,
      desc: 'Applies WHO 2021 semen thresholds. Withholds detail on azoospermia/severe oligo from auto-notifications.',
    },
    {
      id: 'vigor06',
      name: 'Re-engagement Nudge',
      trigger: 'Cron 0 */2 * * *',
      nodes: 16,
      desc: 'Nudges incomplete intakes respecting local quiet hours (21:00 - 08:00 Asia/Dubai).',
    },
    {
      id: 'vigor07',
      name: 'Consent Revocation Cascade',
      trigger: 'POST /webhook/vigor/consent-revoked',
      nodes: 27,
      desc: 'Invalidates share tokens, revokes downstream facility access, emits verifiable receipt.',
    },
    {
      id: 'vigor08',
      name: 'Daily Metrics Rollup',
      trigger: 'Cron 30 0 * * * + Webhook',
      nodes: 23,
      desc: 'Calculates daily cohort metrics: completion rate, safety clamp rate, fairness gaps across locales and age bands.',
    },
    {
      id: 'vigor09',
      name: 'Clinician Review (Human in the Loop)',
      trigger: 'POST /webhook/vigor/clinician-review',
      nodes: 25,
      desc: 'Handles human review overrides. Enforces >= 20 char justification and blocks emergency red-flag de-escalation.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in text-left rtl:text-right">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-blue-100 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-50 dark:border-slate-800 flex items-center justify-between bg-blue-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950 dark:text-white">
                {isAr ? 'المعمارية ونظام سير العمل n8n' : 'System Architecture & n8n Orchestration Spine'}
              </h2>
              <p className="text-[11px] text-blue-600 dark:text-sky-400 font-medium">
                9 Workflows · 257 Nodes · 13 MongoDB Collections · 107 Offline Safety Assertions
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Architecture Pipeline Visual */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-blue-100">
            <div className="text-xs font-bold text-blue-950 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>End-to-End Orchestration Spine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Layer 1</span>
                <h4 className="text-xs font-bold text-blue-950 dark:text-white">Next.js 15 App</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Anonymous Intake & Consent Centre</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Layer 2</span>
                <h4 className="text-xs font-bold text-blue-950 dark:text-white">FastAPI & LangGraph</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Adaptive State Machine & Risk Engine</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-300 ring-2 ring-blue-500/20 shadow-xs">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Layer 3 (Spine)</span>
                <h4 className="text-xs font-black text-blue-950 dark:text-white">n8n Orchestrator</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">9 Workflows / 257 Nodes / SLAs</p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-500 uppercase">Layer 4</span>
                <h4 className="text-xs font-bold text-blue-950 dark:text-white">MongoDB Atlas</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">13 Collections & Append-Only Ledgers</p>
              </div>
            </div>
          </div>

          {/* 9 Workflows List */}
          <div>
            <h3 className="text-xs font-bold text-blue-950 dark:text-white uppercase tracking-wider mb-3">
              The 9 Lifecycle Workflows (Generated & Contract-Verified)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WORKFLOWS.map((wf) => (
                <div
                  key={wf.id}
                  className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {wf.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {wf.nodes} Nodes
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-blue-950 dark:text-white mb-1">{wf.name}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-2">{wf.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-blue-50 text-[10px] font-mono text-blue-800 truncate">
                    {wf.trigger}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Facts / Invariants */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-2">
            <h4 className="font-bold text-blue-950 dark:text-white">Offline Verification & Stability Facts</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>107/107 safety checks pass offline</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Single shared Docker image (zero new disk bytes)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Deterministic red-flag safety clamp</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>WHO 2021 (6th ed.) semen reference limits</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-blue-50 flex items-center justify-end">
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
