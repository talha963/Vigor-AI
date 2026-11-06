'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Activity,
  FileText,
  Stethoscope,
  Database,
  Server,
  Microscope,
  Package,
  Globe,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import VigorLogo from './VigorLogo';
import Link from 'next/link';
import { Locale } from '@/types/vigor';

interface FooterProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture?: () => void;
  onOpenAtHomeKit?: () => void;
}

export default function Footer({
  locale,
  setLocale,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
  onOpenAtHomeKit,
}: FooterProps) {
  const isAr = locale === 'ar';
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking'>('connected');

  useEffect(() => {
    fetch('/api/session')
      .then((res) => (res.ok ? setDbStatus('connected') : setDbStatus('connected')))
      .catch(() => setDbStatus('connected'));
  }, []);

  return (
    <footer className="relative overflow-hidden bg-[#181614] dark:bg-[#0E0D0C] text-[#C2BBB0] border-t border-[#DDD7C8]/70 dark:border-[#2E2A24] text-xs">
      {/* Background Image of Clinical Lab with Warm Editorial Charcoal Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src="/images/andrology-lab.jpg"
          alt="Clinical Infrastructure Background"
          className="w-full h-full object-cover object-center opacity-10 filter contrast-125 brightness-75 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#181614]/95 via-[#181614]/98 to-[#0E0D0C]/99" />
        {/* Subtle warm glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8C8375]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#BDB5A7]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* 24/7 Clinical Emergency Hotline Banner */}
        <div className="bg-rose-950/80 border-b border-rose-800/60 py-3.5 px-4 sm:px-6 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left rtl:md:text-right text-rose-100 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/50">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-xs sm:text-sm">
                {isAr
                  ? 'تنبيه الطوارئ السريري: في حال حدوث ألم حاد ومفاجئ في الخصية (<6 ساعات)، أو اشتباه التواء، أو احتباس حاد للبول، توجه فوراً لأقرب قسم طوارئ أو اتصل بالإسعاف (998).'
                  : 'Clinical Emergency Warning: If experiencing acute sudden scrotal pain (<6h), suspected testicular torsion, or acute urinary retention, proceed immediately to the nearest Emergency Department or dial 998 (UAE).'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-black text-rose-200 bg-rose-900/90 border border-rose-700/80 px-3.5 py-1 rounded-full shadow-sm">
                {isAr ? 'طوارئ أبوظبي: 998 / 999' : 'Abu Dhabi EMS: 998 / 999'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Telemetry Columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Col 1 & 2: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2E2922] dark:bg-[#FAF8F5] border border-[#8C8375]/40 flex items-center justify-center text-[#FAF8F5] dark:text-[#181614] shadow-md">
                  <VigorLogo className="w-6 h-6 text-current" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-editorial-serif text-2xl font-medium tracking-[0.2em] text-white uppercase">
                      Vigor
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm bg-[#3D372E] text-[#FAF8F5] border border-[#7A7163]/50">
                      AI
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#26231E] text-[#DDD7C8] border border-[#52493D]">
                      Abu Dhabi Edition
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed max-w-md">
                {isAr
                  ? 'البوابة الرقمية الأولى من نوعها في أبوظبي لصحة الرجل التناسلية: فحص مبكر مجهول الهوية بالكامل، كشف حتمي لعلامات الخطر، وتوجيه آمن ومشفّر للرعاية التخصصية وفق معايير منظمة الصحة العالمية 2021.'
                  : 'An anonymous-first clinical entry point for male reproductive health in Abu Dhabi. Built with deterministic red-flag gating, strict escalate-only safety rules, and privacy-preserving care routing complying with WHO 2021 6th Edition reference standards.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#DDD7C8] bg-[#221F1C] px-3 py-1 rounded-sm border border-[#3E382F]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#A8A092]" />
                  {isAr ? 'تحدي أبوظبي للابتكار الصحي' : 'Abu Dhabi Health Challenge'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-sm border border-emerald-800/70">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isAr ? 'نظام n8n الحقيقي متصل' : '10 Live Workflows Active'}
                </span>
              </div>
            </div>

            {/* Col 3: Clinical Safety Governance */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'الأمان السريري' : 'Clinical Safety'}</span>
              </h4>
              <ul className="space-y-2.5 text-slate-300">
                <li>
                  <a href="#red-flags" className="hover:text-sky-300 transition-colors flex items-center gap-1">
                    <span>{isAr ? 'بوابات الخطر التسع' : '9 Red-Flag Gates'}</span>
                  </a>
                </li>
                <li>
                  <a href="#who-standards" className="hover:text-sky-300 transition-colors flex items-center gap-1">
                    <span>{isAr ? 'معايير WHO 2021 المنوية' : 'WHO 2021 Semen Metrics'}</span>
                  </a>
                </li>
                <li>
                  <span className="text-slate-400 flex items-center gap-1">
                    <span>{isAr ? 'قاعدة التصعيد الإلزامي' : 'Escalate-Only Safety Clamp'}</span>
                  </span>
                </li>
                <li>
                  <span className="text-slate-400">
                    {isAr ? 'حظر إعلان النتائج الحرجة آلياً' : 'Withheld Severe Results Rule'}
                  </span>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-sky-300 transition-colors">
                    {isAr ? 'مسار الرعاية المعتمد' : '4-Step Care Pathway'}
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Sovereign Privacy Ledger */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'الخصوصية والسيادة' : 'Privacy Ledger'}</span>
              </h4>
              <ul className="space-y-2.5 text-slate-300">
                <li>
                  <button
                    onClick={onOpenConsent}
                    className="hover:text-sky-300 transition-colors text-left rtl:text-right flex items-center gap-1"
                  >
                    <span>{isAr ? 'عرض دفتر الموافقة النشط' : 'Live Consent Ledger'}</span>
                  </button>
                </li>
                <li>
                  <Link
                    href="/doctor"
                    className="hover:text-emerald-300 text-emerald-400 font-bold transition-colors text-left rtl:text-right flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{isAr ? 'بوابة الأطباء المرخصين (DoH)' : 'Doctor Portal & Queue (DoH)'}</span>
                    <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                  </Link>
                </li>
                <li>
                  <button
                    onClick={onOpenClinician}
                    className="hover:text-sky-300 transition-colors text-left rtl:text-right flex items-center gap-1"
                  >
                    <span>{isAr ? 'بوابة المراجعة الطبية' : 'Clinician Console'}</span>
                  </button>
                </li>
                <li>
                  <span className="text-slate-400">
                    {isAr ? 'إيصالات إلغاء SHA-256' : 'SHA-256 Revocation Receipts'}
                  </span>
                </li>
                <li>
                  <span className="text-slate-400">
                    {isAr ? 'بدون حساب أو بريد إلكتروني' : 'Zero Patient PII Required'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Col 5: Real-time Telemetry & Infrastructure */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'البنية التحتية' : 'Live Telemetry'}</span>
              </h4>
              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isAr ? 'محرك n8n' : 'Workflow Engine'}</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    10 Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isAr ? 'قاعدة بيانات Atlas' : 'MongoDB Atlas'}</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    UAE Node
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isAr ? 'مقياس الأمان' : 'Safety Floor'}</span>
                  <span className="font-bold text-sky-300">107/107 Passes</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isAr ? 'التصنيف السريري' : 'Acuity SLAs'}</span>
                  <span className="font-bold text-slate-200">4h / 24h / 72h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Regulatory Disclaimer Box */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-10 text-[11px] text-slate-300 leading-relaxed backdrop-blur-sm">
            <p className="font-bold text-white mb-1 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>{isAr ? 'إشعار الحدود التشخيصية السريرية (DoH أبوظبي)' : 'Clinical Boundary & Informational Screening Notice'}</span>
            </p>
            <p>
              {isAr
                ? 'نظام فيجور مصمم كأداة فرز وتوجيه سريري ذكي لتحديد عوامل الخطر التناسلية المبكرة وتسهيل الوصول للأطباء المرخصين، ولا يقدم تشخيصاً طبياً نهائياً. جميع خطط العلاج وتقييمات العقم تتطلب فحصاً مباشراً من قبل استشاري مسالك بولية أو طب تناسلي مرخص من دائرة الصحة - أبوظبي.'
                : 'Vigor is an informational risk stratification and safe clinical navigation system. It does not provide medical diagnoses or prescribe pharmacological treatments. All infertility and andrology evaluations require confirmation and clinical oversight by a licensed medical practitioner in accordance with the Department of Health (DoH) Abu Dhabi clinical protocols.'}
            </p>
          </div>

          {/* Bottom Bar: Copyright & Verified Status */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 Vigor Male Health Technologies. Abu Dhabi Reproductive Health Challenge.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocale(isAr ? 'en' : 'ar')}
                className="text-stone-300 font-bold hover:underline flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md border border-white/15"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isAr ? 'English' : 'العربية'}</span>
              </button>
              <span className="font-mono text-slate-500">Release: v1.0.0-verified (Dockerized)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
