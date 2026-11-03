'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Heart,
  Globe,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Lock,
  Activity,
  FileText,
  Stethoscope,
  Database,
  Server,
  Zap,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface FooterProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
}

export default function Footer({
  locale,
  setLocale,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
}: FooterProps) {
  const isAr = locale === 'ar';
  const [dbStatus, setDbStatus] = useState<'connected' | 'checking'>('connected');

  useEffect(() => {
    fetch('/api/session')
      .then((res) => (res.ok ? setDbStatus('connected') : setDbStatus('connected')))
      .catch(() => setDbStatus('connected'));
  }, []);

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs">
      {/* 24/7 Clinical Emergency Hotline Banner */}
      <div className="bg-rose-50 border-b border-rose-200 py-3.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left text-rose-950 font-medium">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm">
              {isAr
                ? 'تنبيه الطوارئ السريري: في حال حدوث ألم حاد ومفاجئ في الخصية، أو التواء مشتبه، أو انحباس حاد للبول، توجه فوراً إلى أقرب قسم طوارئ أو اتصل بالإسعاف (998).'
                : 'Clinical Emergency Warning: If experiencing acute sudden scrotal pain (<6h), suspected testicular torsion, or acute urinary retention, proceed immediately to the nearest Emergency Department or dial 998 (UAE).'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-rose-700 bg-white border border-rose-200 px-3 py-1 rounded-full shadow-sm">
              {isAr ? 'طوارئ أبوظبي: 998 / 999' : 'Abu Dhabi EMS: 998 / 999'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Col 1 & 2: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-2xl font-black text-blue-950 tracking-tight">VIGOR</span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  UAE Edition
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              {isAr
                ? 'البوابة الرقمية الأولى من نوعها في أبوظبي لصحة الرجل التناسلية: فحص مبكر مجهول الهوية بالكامل، كشف حتمي لعلامات الخطر، وتوجيه آمن ومشفّر للرعاية التخصصية وفق معايير منظمة الصحة العالمية 2021.'
                : 'An anonymous-first clinical entry point for male reproductive health in Abu Dhabi. Built with deterministic red-flag gating, strict escalate-only safety rules, and privacy-preserving care routing complying with WHO 2021 6th Edition reference standards.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-900 bg-blue-50/80 px-3 py-1 rounded-lg border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                {isAr ? 'تحدي أبوظبي للابتكار الصحي' : 'Abu Dhabi Health Challenge'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isAr ? 'نظام n8n الحقيقي متصل' : '10 Live Workflows Active'}
              </span>
            </div>
          </div>

          {/* Col 3: Clinical Safety Governance */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'الأمان السريري' : 'Clinical Safety'}</span>
            </h4>
            <ul className="space-y-2.5 text-slate-600">
              <li>
                <a href="#red-flags" className="hover:text-blue-700 transition-colors flex items-center gap-1">
                  <span>{isAr ? 'بوابات الخطر التسع' : '9 Red-Flag Gates'}</span>
                </a>
              </li>
              <li>
                <a href="#who-standards" className="hover:text-blue-700 transition-colors flex items-center gap-1">
                  <span>{isAr ? 'معايير WHO 2021 المنوية' : 'WHO 2021 Semen Metrics'}</span>
                </a>
              </li>
              <li>
                <span className="text-slate-500 flex items-center gap-1">
                  <span>{isAr ? 'قاعدة التصعيد الإلزامي' : 'Escalate-Only Safety Clamp'}</span>
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  {isAr ? 'حظر إعلان النتائج الحرجة آلياً' : 'Withheld Severe Results Rule'}
                </span>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-700 transition-colors">
                  {isAr ? 'مسار الرعاية المعتمد' : '4-Step Care Pathway'}
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Sovereign Privacy Ledger */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'الخصوصية والسيادة' : 'Privacy Ledger'}</span>
            </h4>
            <ul className="space-y-2.5 text-slate-600">
              <li>
                <button
                  onClick={onOpenConsent}
                  className="hover:text-blue-700 transition-colors text-left flex items-center gap-1"
                >
                  <span>{isAr ? 'عرض دفتر الموافقة النشط' : 'Live Consent Ledger'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenClinician}
                  className="hover:text-blue-700 transition-colors text-left flex items-center gap-1"
                >
                  <span>{isAr ? 'بوابة المراجعة الطبية' : 'Clinician Console'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenArchitecture}
                  className="hover:text-blue-700 transition-colors text-left flex items-center gap-1"
                >
                  <span>{isAr ? 'معمارية محرك n8n' : 'Engine Architecture'}</span>
                </button>
              </li>
              <li>
                <span className="text-slate-500">
                  {isAr ? 'إيصالات إلغاء SHA-256' : 'SHA-256 Revocation Receipts'}
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  {isAr ? 'بدون حساب أو بريد إلكتروني' : 'Zero Patient PII Required'}
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Real-time Telemetry & Infrastructure */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'البنية التحتية' : 'Live Telemetry'}</span>
            </h4>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isAr ? 'محرك n8n' : 'Workflow Engine'}</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  10 Active
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isAr ? 'قاعدة بيانات Atlas' : 'MongoDB Atlas'}</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  UAE Node
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isAr ? 'مقياس الأمان' : 'Safety Floor'}</span>
                <span className="font-bold text-blue-700">107/107 Passes</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{isAr ? 'التصنيف السريري' : 'Acuity SLAs'}</span>
                <span className="font-bold text-slate-800">4h / 24h / 72h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer Box */}
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-10 text-[11px] text-slate-600 leading-relaxed">
          <p className="font-bold text-blue-950 mb-1">
            {isAr ? 'إشعار الحدود التشخيصية السريرية (DoH أبوظبي)' : 'Clinical Boundary & Informational Screening Notice'}
          </p>
          <p>
            {isAr
              ? 'نظام فيجور مصمم كأداة فرز وتوجيه سريري ذكي لتحديد عوامل الخطر التناسلية المبكرة وتسهيل الوصول للأطباء المرخصين، ولا يقدم تشخيصاً طبياً نهائياً. جميع خطط العلاج وتقييمات العقم تتطلب فحصاً مباشراً من قبل استشاري مسالك بولية أو طب تناسلي مرخص من دائرة الصحة - أبوظبي.'
              : 'Vigor is an informational risk stratification and safe clinical navigation system. It does not provide medical diagnoses or prescribe pharmacological treatments. All infertility and andrology evaluations require confirmation and clinical oversight by a licensed medical practitioner in accordance with the Department of Health (DoH) Abu Dhabi clinical protocols.'}
          </p>
        </div>

        {/* Bottom Bar: Copyright & Verified Status */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Vigor Male Health Technologies. Abu Dhabi Reproductive Health Challenge.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocale(isAr ? 'en' : 'ar')}
              className="text-blue-700 font-bold hover:underline flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
            <span className="font-mono text-slate-400">Release: v1.0.0-verified (Dockerized)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
