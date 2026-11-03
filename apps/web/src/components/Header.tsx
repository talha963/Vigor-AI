'use client';

import React from 'react';
import {
  Shield,
  Activity,
  UserCheck,
  FileText,
  Sliders,
  Globe,
  Stethoscope,
  ChevronRight,
  Database,
  Lock,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface HeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onOpenIntake: () => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
}

export default function Header({
  locale,
  setLocale,
  onOpenIntake,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
}: HeaderProps) {
  const isAr = locale === 'ar';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-blue-950 font-sans">
                  VIGOR
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Abu Dhabi
                </span>
              </div>
              <p className="text-[11px] font-medium text-blue-600/90 leading-tight">
                {isAr ? 'البوابة السرية لصحة الرجل التناسلية' : 'Confidential Male Reproductive Health'}
              </p>
            </div>
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-semibold text-blue-900">
          <a
            href="#how-it-works"
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            {isAr ? 'كيف يعمل' : 'How It Works'}
          </a>
          <a
            href="#red-flags"
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'علامات الخطر السريرية' : '9 Red Flags'}</span>
          </a>
          <a
            href="#who-standards"
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            {isAr ? 'معايير منظمة الصحة' : 'WHO 2021'}
          </a>
          <button
            onClick={onOpenConsent}
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-900"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'سجل الموافقة والخصوصية' : 'Consent Ledger'}</span>
          </button>
          <button
            onClick={onOpenClinician}
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-900"
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'مكتب المراجعة الطبية' : 'Clinician Console'}</span>
          </button>
          <button
            onClick={onOpenArchitecture}
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-700 text-xs bg-blue-50/70 border border-blue-200/80"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'المعمارية ونظام n8n' : 'n8n & Arch'}</span>
          </button>
        </nav>

        {/* Right CTA & Controls */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 px-3 py-2 rounded-xl transition-all"
            title="Switch Language / تبديل اللغة"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* Quick Intake Trigger Button */}
          <button
            onClick={onOpenIntake}
            className="relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all transform active:scale-95"
          >
            <span>{isAr ? 'ابدأ الفحص السري' : 'Begin Assessment'}</span>
            <ChevronRight className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </div>
    </header>
  );
}
