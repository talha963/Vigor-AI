'use client';

import React from 'react';
import { Shield, Heart, Globe, AlertTriangle, ExternalLink } from 'lucide-react';
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

  return (
    <footer className="bg-white border-t border-blue-100 text-slate-600 text-xs">
      {/* Emergency Notice Banner */}
      <div className="bg-red-50/80 border-b border-red-100 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left text-red-950 font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {isAr
                ? 'تنبيه الطوارئ: في حال الشعور بألم حاد ومفاجئ في الخصية أو حبس بول كامل، اتصل بالإسعاف (998) أو توجه لأقرب قسم طوارئ فوراً.'
                : 'Emergency Notice: If you experience acute scrotal pain, severe trauma, or complete urinary retention, call 998 (UAE) or visit an Emergency Department immediately.'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
            Emergency Hotline: 998
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-blue-950 tracking-tight">VIGOR</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'بوابة رقمية سرية وموثوقة للفحص المبكر وتوجيه الرعاية لصحة الرجل التناسلية في أبوظبي.'
                : 'A confidential, anonymous-first front door for early male reproductive risk identification and safe routing in Abu Dhabi.'}
            </p>
            <div className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 w-fit">
              Abu Dhabi Challenge · 2026
            </div>
          </div>

          {/* Col 2: Clinical Invariants */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">
              {isAr ? 'المحددات السريرية' : 'Clinical Safety'}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#red-flags" className="hover:text-blue-700 transition-colors">
                  {isAr ? 'علامات الخطر التسع' : '9 Red-Flag Gates'}
                </a>
              </li>
              <li>
                <a href="#who-standards" className="hover:text-blue-700 transition-colors">
                  {isAr ? 'معايير منظمة الصحة 2021' : 'WHO 2021 Reference Limits'}
                </a>
              </li>
              <li>
                <span className="text-slate-400">Escalate-Only Safety Clamp</span>
              </li>
              <li>
                <span className="text-slate-400">Non-Automated Severe Delivery</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Privacy & Technology */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">
              {isAr ? 'الخصوصية والمعمارية' : 'Privacy & Tech'}
            </h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenConsent} className="hover:text-blue-700 transition-colors text-left">
                  {isAr ? 'سجل الموافقة المشفر' : 'Cryptographic Consent Ledger'}
                </button>
              </li>
              <li>
                <button onClick={onOpenClinician} className="hover:text-blue-700 transition-colors text-left">
                  {isAr ? 'مكتب المراجعة الطبية' : 'Clinician Review Console'}
                </button>
              </li>
              <li>
                <button onClick={onOpenArchitecture} className="hover:text-blue-700 transition-colors text-left">
                  {isAr ? 'نظام n8n وقواعد البيانات' : 'n8n & MongoDB Architecture'}
                </button>
              </li>
              <li>
                <span className="text-slate-400">Zero Direct Identifiers</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Medical Disclaimer */}
          <div>
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">
              {isAr ? 'إخلاء المسؤولية الطبية' : 'Regulatory Disclaimer'}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isAr
                ? 'فيجور أداة للفرز المبدئي وتسهيل الوصول للرعاية المتخصصة، ولا تعتبر بديلاً عن الاستشارة الطبية أو التشخيص السريري الرسمي من قبل طبيب مرخص.'
                : 'Vigor provides informational risk stratification and routing. It does not provide medical diagnoses or replace direct consultations with licensed healthcare practitioners.'}
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-blue-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 Vigor Health Technologies. Developed for Abu Dhabi Male Reproductive Health Challenge.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocale(isAr ? 'en' : 'ar')}
              className="text-blue-700 font-bold hover:underline flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
            <span>v0.1.0 Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
