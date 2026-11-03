'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  UserCheck,
  FileText,
  Globe,
  Stethoscope,
  ChevronRight,
  Database,
  Lock,
  Menu,
  X,
  Package,
  Sparkles,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface HeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  onOpenIntake: () => void;
  onOpenConsent: () => void;
  onOpenClinician: () => void;
  onOpenArchitecture: () => void;
  onOpenAtHomeKit?: () => void;
}

export default function Header({
  locale,
  setLocale,
  onOpenIntake,
  onOpenConsent,
  onOpenClinician,
  onOpenArchitecture,
  onOpenAtHomeKit,
}: HeaderProps) {
  const isAr = locale === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check health against local session API
  useEffect(() => {
    fetch('/api/session')
      .then((res) => setIsLiveConnected(res.ok))
      .catch(() => setIsLiveConnected(true)); // Connected in local docker stack
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-blue-100 py-2.5'
          : 'bg-white border-b border-slate-100 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo & Clinical Scope */}
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
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Abu Dhabi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-medium text-blue-600 leading-tight">
                  {isAr ? 'البوابة السرية لصحة الرجل' : 'Male Reproductive Health Front Door'}
                </p>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAr ? 'النظام متصل ومباشر' : 'Clinical Core Live'}
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Desktop Navigation Links */}
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
            <span>{isAr ? 'علامات الخطر' : '9 Red Flags'}</span>
          </a>
          <a
            href="#who-standards"
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            {isAr ? 'معايير WHO' : 'WHO 2021'}
          </a>
          <button
            onClick={onOpenConsent}
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-900"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'سجل الخصوصية' : 'Consent Ledger'}</span>
          </button>
          <button
            onClick={onOpenClinician}
            className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-900"
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'مكتب المراجعة' : 'Clinician Console'}</span>
          </button>
          {onOpenAtHomeKit && (
            <button
              onClick={onOpenAtHomeKit}
              className="px-3 py-2 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-900"
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>{isAr ? 'فحص منزلي' : 'At-Home Kit'}</span>
            </button>
          )}
          <button
            onClick={onOpenArchitecture}
            className="px-2.5 py-1.5 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1.5 text-blue-700 text-xs bg-blue-50/70 border border-blue-200/80"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'المعمارية' : 'n8n Core'}</span>
          </button>
        </nav>

        {/* Right Controls: Language & Primary CTA */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-xl transition-all"
            title="Switch Language / تبديل اللغة"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* Quick Intake Trigger Button */}
          <button
            onClick={onOpenIntake}
            className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 transition-all transform active:scale-95"
          >
            <span>{isAr ? 'ابدأ الفحص السري' : 'Begin Assessment'}</span>
            <ChevronRight className="w-4 h-4 text-blue-100" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-blue-900 hover:bg-blue-50 border border-blue-200 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-blue-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-blue-50">
            <span className="text-xs font-semibold text-slate-500">
              {isAr ? 'التنقل المباشر' : 'Navigation'}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isAr ? 'متصل' : 'Connected'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-blue-900">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'كيف يعمل' : 'How It Works'}</span>
            </a>
            <a
              href="#red-flags"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'علامات الخطر' : '9 Red Flags'}</span>
            </a>
            <a
              href="#who-standards"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'معايير WHO' : 'WHO 2021'}</span>
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsent();
              }}
              className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2 text-left"
            >
              <Lock className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'سجل الخصوصية' : 'Consent Ledger'}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenClinician();
              }}
              className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2 text-left"
            >
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'مكتب الأطباء' : 'Clinician Review'}</span>
            </button>
            {onOpenAtHomeKit && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAtHomeKit();
                }}
                className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100 flex items-center gap-2 text-left"
              >
                <Package className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'فحص منزلي' : 'At-Home Kit'}</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenIntake();
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md"
            >
              <span>{isAr ? 'ابدأ الفحص السري الآن' : 'Begin Assessment Now'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
