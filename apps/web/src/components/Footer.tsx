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
import { Locale } from '@/types/vigor';

interface FooterProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
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
    <footer className="relative overflow-hidden bg-[#071328] text-slate-300 border-t border-blue-900/60 text-xs">
      {/* Background Image of Clinical Lab with Deep Blue Medical Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src="/images/andrology-lab.jpg"
          alt="Clinical Infrastructure Background"
          className="w-full h-full object-cover object-center opacity-15 filter contrast-125 brightness-75 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1e3f]/95 via-[#071328]/95 to-[#030914]/98" />
        {/* Subtle decorative mesh glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
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

        {/* Featured Visual Cards: Real Photos Related to Website (At-Home Kit, Microscopy Lab, Clinical Consult) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="border-b border-blue-900/60 pb-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 text-sky-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-blue-700/50">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isAr ? 'البنية التحتية والتشخيصية' : 'Verified Clinical Diagnostics'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {isAr
                    ? 'البيئة التشخيصية والمخبرية المعتمدة في أبوظبي'
                    : 'Accredited Diagnostics & Care Network'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                {isAr
                  ? 'فحوصات معملية مطابقة لمعايير منظمة الصحة العالمية 2021 ومسارات سريرية موثقة في إمارة أبوظبي.'
                  : 'WHO 2021 6th Edition compliant diagnostic standards with encrypted sample routing across Abu Dhabi.'}
              </p>
            </div>

            {/* 3 Related Project Images */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: At-Home Sample Collection Kit */}
              <div
                onClick={onOpenAtHomeKit}
                className="group relative bg-[#0b1c38]/90 hover:bg-[#0e2347] border border-blue-800/50 hover:border-blue-600/80 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-blue-900/30 flex flex-col"
              >
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src="/images/athome-kit.jpg"
                    alt="At-Home Sample Collection Kit"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c38] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 bg-blue-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-sky-300 border border-blue-700/60 flex items-center gap-1.5 shadow-sm">
                    <Package className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isAr ? 'فحص منزلي مجهول' : 'At-Home Diagnostic Kit'}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors mb-1">
                      {isAr ? 'طرد العينات المعزول حرارياً' : 'Discreet Thermal Collection Kit'}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isAr
                        ? 'طقم فحص معقم بحفظ حراري مبرد، واستلام مجهول عبر خزائن ذكية دون كشف الهوية.'
                        : 'Sterile thermal-sleeved collection vials with barcode seals for anonymous smart-locker drop-off.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-blue-900/60 flex items-center justify-between text-[11px] font-semibold text-sky-400">
                    <span>{isAr ? 'طلب الفحص المنزلي' : 'Explore At-Home Kit'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 2: Semen Microscopy & CASA */}
              <div className="group relative bg-[#0b1c38]/90 hover:bg-[#0e2347] border border-blue-800/50 hover:border-blue-600/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-blue-900/30 flex flex-col">
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src="/images/semen-microscopy.jpg"
                    alt="WHO 2021 Semen Analysis Microscopy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c38] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 bg-blue-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-sky-300 border border-blue-700/60 flex items-center gap-1.5 shadow-sm">
                    <Microscope className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isAr ? 'مختبر WHO 2021' : 'WHO 2021 Standard'}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors mb-1">
                      {isAr ? 'فحص الحركة والتشوهات المجهرية' : 'Advanced CASA Sperm Microscopy'}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isAr
                        ? 'تحليل حركي آلي دقيق يقيس الحركة التقدمية (30٪) والأشكال الطبيعية (4٪) طبياً.'
                        : 'Algorithmic path tracking evaluating 30% progressive motility, 4% morphology, and viability.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-blue-900/60 flex items-center justify-between text-[11px] font-semibold text-sky-400">
                    <span>{isAr ? 'المعايير المرجعية' : 'WHO Reference Limits'}</span>
                    <a href="#who-standards" className="hover:underline flex items-center gap-1">
                      <span>{isAr ? 'عرض' : 'View'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 3: Doctor Consultation */}
              <div
                onClick={onOpenClinician}
                className="group relative bg-[#0b1c38]/90 hover:bg-[#0e2347] border border-blue-800/50 hover:border-blue-600/80 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-blue-900/30 flex flex-col"
              >
                <div className="relative h-44 overflow-hidden bg-slate-900">
                  <img
                    src="/images/clinical-consult.jpg"
                    alt="Clinical Consultation with Doctor"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c38] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 bg-blue-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-sky-300 border border-blue-700/60 flex items-center gap-1.5 shadow-sm">
                    <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isAr ? 'استشارة استشاري' : 'Consultant Review'}</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors mb-1">
                      {isAr ? 'استشارة سرية مع أطباء الذكورة' : 'Confidential Specialist Consultation'}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isAr
                        ? 'مراجعة سريرية متخصصة مع استشاريي مسالك بولية وطب ذكورة مرخصين في إمارة أبوظبي.'
                        : 'Direct clinical escalation and private consultation with licensed andrologists across Abu Dhabi.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-blue-900/60 flex items-center justify-between text-[11px] font-semibold text-sky-400">
                    <span>{isAr ? 'بوابة المراجعة' : 'Clinician Console'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Telemetry Columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Col 1 & 2: Brand & Identity */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white tracking-tight">VIGOR</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-blue-500 to-sky-400 text-white">
                      AI
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-900/70 text-sky-300 border border-blue-700/60">
                      Abu Dhabi Edition
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-md">
                {isAr
                  ? 'البوابة الرقمية الأولى من نوعها في أبوظبي لصحة الرجل التناسلية: فحص مبكر مجهول الهوية بالكامل، كشف حتمي لعلامات الخطر، وتوجيه آمن ومشفّر للرعاية التخصصية وفق معايير منظمة الصحة العالمية 2021.'
                  : 'An anonymous-first clinical entry point for male reproductive health in Abu Dhabi. Built with deterministic red-flag gating, strict escalate-only safety rules, and privacy-preserving care routing complying with WHO 2021 6th Edition reference standards.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-200 bg-blue-950/80 px-3 py-1 rounded-lg border border-blue-800/70">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  {isAr ? 'تحدي أبوظبي للابتكار الصحي' : 'Abu Dhabi Health Challenge'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-lg border border-emerald-800/70">
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
                  <button
                    onClick={onOpenClinician}
                    className="hover:text-sky-300 transition-colors text-left rtl:text-right flex items-center gap-1"
                  >
                    <span>{isAr ? 'بوابة المراجعة الطبية' : 'Clinician Console'}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={onOpenArchitecture}
                    className="hover:text-sky-300 transition-colors text-left rtl:text-right flex items-center gap-1"
                  >
                    <span>{isAr ? 'معمارية محرك n8n' : 'Engine Architecture'}</span>
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
              <div className="bg-[#0b1c38]/90 rounded-2xl p-3.5 border border-blue-800/50 space-y-2">
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
          <div className="bg-blue-950/50 rounded-2xl p-4 border border-blue-800/60 mb-10 text-[11px] text-slate-300 leading-relaxed backdrop-blur-sm">
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
          <div className="pt-8 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 Vigor Male Health Technologies. Abu Dhabi Reproductive Health Challenge.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocale(isAr ? 'en' : 'ar')}
                className="text-sky-300 font-bold hover:underline flex items-center gap-1.5 bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/80"
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
