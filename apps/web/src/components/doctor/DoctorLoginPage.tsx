'use client';

import React, { useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Award,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import VigorLogo from '@/components/VigorLogo';
import {
  DoctorAccount,
  loginDoctorWithFirebase,
  registerDoctorWithFirebase,
} from '@/lib/firebase';

interface DoctorLoginPageProps {
  locale?: 'en' | 'ar';
  setLocale?: (l: 'en' | 'ar') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLoginSuccess: (doctor: DoctorAccount) => void;
}

export default function DoctorLoginPage({
  locale = 'en',
  setLocale,
  theme = 'light',
  onToggleTheme,
  onLoginSuccess,
}: DoctorLoginPageProps) {
  const isAr = locale === 'ar';
  const isDark = theme === 'dark';

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('DOH-AUH-2024-9102');
  const [specialtyInput, setSpecialtyInput] = useState('Consultant Andrologist & Male Infertility Microsurgeon');
  const [facilityInput, setFacilityInput] = useState('Cleveland Clinic Abu Dhabi · Andrology Hub');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick 1-click test doctors
  const handleQuickLogin = async (presetEmail: string, presetName: string, presetFacility: string) => {
    setLoading(true);
    setErrorMsg(null);
    setEmailInput(presetEmail);
    setPasswordInput('demo123456');

    const res = await loginDoctorWithFirebase(presetEmail, 'demo123456');
    setLoading(false);
    if (res.ok && res.doctor) {
      onLoginSuccess(res.doctor);
    } else {
      setErrorMsg(res.error || 'Failed to authenticate doctor.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال عنوان البريد الإلكتروني' : 'Please provide your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const res = await loginDoctorWithFirebase(emailInput.trim(), passwordInput || 'demo123456');
    setLoading(false);
    if (res.ok && res.doctor) {
      onLoginSuccess(res.doctor);
    } else {
      setErrorMsg(res.error || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials. Please verify your details.'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !fullNameInput.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال الاسم والبريد الإلكتروني' : 'Please provide doctor name and email address.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const formattedName = fullNameInput.trim().startsWith('Dr.') ? fullNameInput.trim() : `Dr. ${fullNameInput.trim()}`;

    const res = await registerDoctorWithFirebase({
      email: emailInput.trim(),
      password: passwordInput || 'demo123456',
      fullName: formattedName,
      licenseNumber: licenseInput.trim() || 'DOH-AUH-2024-9182',
      specialty: specialtyInput.trim() || 'Consultant Physician',
      facility: facilityInput.trim() || 'Cleveland Clinic Abu Dhabi',
    });

    setLoading(false);
    if (res.ok && res.doctor) {
      onLoginSuccess(res.doctor);
    } else {
      setErrorMsg(res.error || (isAr ? 'فشل إنشاء حساب الطبيب' : 'Failed to register doctor profile.'));
    }
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#FAF8F5] dark:bg-[#141311] text-[#1A1816] dark:text-[#FAF7F2] font-editorial-sans antialiased selection:bg-[#1A1816] selection:text-white dark:selection:bg-white dark:selection:text-[#141311] flex flex-col justify-between transition-colors duration-300"
    >
      {/* 1. TOP HEADER */}
      <header className="w-full bg-[#FAF8F5]/90 dark:bg-[#141311]/90 backdrop-blur-md border-b border-[#E8E2D5] dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none" aria-label="Vigor AI Home">
            <div className="w-8 h-8 rounded-xl bg-[#1A1816] dark:bg-white flex items-center justify-center text-white dark:text-[#181614] shadow-xs">
              <VigorLogo className="w-4 h-4 text-current" size={18} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="font-editorial-serif text-base tracking-[0.2em] font-medium text-[#1A1816] dark:text-[#FAF7F2] uppercase">
                  Vigor
                </span>
                <span className="text-[9px] tracking-[0.24em] font-black text-[#8A8172] dark:text-[#C5BEB2] uppercase">
                  AI
                </span>
              </div>
            </div>
          </Link>

          {/* DoH Abu Dhabi Clinical Gateway Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'بوابة الكادر الطبي المعتمد · دائرة الصحة أبوظبي' : 'Authorized Clinician Portal · DoH Abu Dhabi'}</span>
          </div>

          {/* Switchers */}
          <div className="flex items-center gap-2">
            {setLocale && (
              <button
                type="button"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[11px] font-bold text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-all"
              >
                <Globe className="w-3 h-3 text-stone-500" />
                <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-stone-400 transition-all"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN CENTER STAGE */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg bg-white/95 dark:bg-[#181614]/95 border border-[#DDD7C8] dark:border-stone-800 rounded-3xl shadow-xl backdrop-blur-xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-editorial-serif text-[#1A1816] dark:text-[#FAF7F2]">
              {isAr ? 'تسجيل دخول الكادر الطبي' : 'Clinician Identity Gateway'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {isAr
                ? 'يرجى تسجيل الدخول إلى ملفك الطبي للوصول إلى قائمة المواعيد المباشرة، وسجلات المرضى، والاستشارات السريرية.'
                : 'Sign in to access your assigned consultation queue, natural-language patient history ladder, and electronic prescribing.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-2xl bg-[#EFECE3]/80 dark:bg-stone-900 border border-[#DDD7C8] dark:border-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                authMode === 'login'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'تسجيل الدخول' : 'Clinician Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                authMode === 'register'
                  ? 'bg-[#1A1816] text-white dark:bg-[#FAF7F2] dark:text-[#181614] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {isAr ? 'تسجيل طبيب جديد' : 'New Practitioner Registration'}
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* FORM: Sign In or Register */}
          <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4 text-xs">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isAr ? 'اسم الطبيب الكامل *' : 'Doctor Full Name *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      placeholder="e.g. Dr. Talha Habib"
                      className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      {isAr ? 'رقم ترخيص دائرة الصحة *' : 'DoH License Number *'}
                    </label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                      <input
                        type="text"
                        required
                        value={licenseInput}
                        onChange={(e) => setLicenseInput(e.target.value)}
                        placeholder="DOH-AUH-2024-9102"
                        className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      {isAr ? 'التخصص الطبي *' : 'Medical Specialty *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      placeholder="Consultant Andrologist & Urologist"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    {isAr ? 'المنشأة الصحية / المستشفى *' : 'Healthcare Facility / Hospital *'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                    <input
                      type="text"
                      required
                      value={facilityInput}
                      onChange={(e) => setFacilityInput(e.target.value)}
                      placeholder="Cleveland Clinic Abu Dhabi · Andrology Hub"
                      className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                {isAr ? 'البريد الإلكتروني المهني *' : 'Professional Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={authMode === 'login' ? 'Enter your email or select profile below' : 'doctor@hospital.ae'}
                  className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1">
                {isAr ? 'كلمة المرور *' : 'Password *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 rtl:pr-9 pr-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#1A1816] hover:bg-[#312C26] dark:bg-white dark:hover:bg-stone-100 text-white dark:text-[#181614] font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>{isAr ? 'جاري التحقق...' : 'Authenticating Clinician...'}</span>
              ) : (
                <>
                  <span>{authMode === 'login' ? (isAr ? 'دخول المنصة' : 'Sign In to Doctor Portal') : (isAr ? 'تسجيل والدخول' : 'Register & Access Portal')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Clinician Profiles for Testing */}
          {authMode === 'login' && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block text-center">
                {isAr ? 'أو اختر حساب الطبيب المعتمد مباشرة للتحقق:' : 'Or Quick Sign In with Registered Clinician Profile:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickLogin(
                      'ziad.alkhafaji@clevelandclinicabudhabi.ae',
                      'Dr. Ziad Al-Khafaji',
                      'Cleveland Clinic Abu Dhabi · Al Maryah Island'
                    )
                  }
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/60 hover:border-emerald-500 text-left rtl:text-right transition-all group"
                >
                  <p className="font-bold text-stone-900 dark:text-white text-xs flex items-center justify-between">
                    <span>Dr. Ziad Al-Khafaji</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                      Microsurgeon
                    </span>
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    Cleveland Clinic · Al Maryah
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickLogin(
                      'ali.khan@clevelandclinicabudhabi.ae',
                      'Dr. Ali Khan',
                      'Cleveland Clinic Abu Dhabi · Andrology Hub'
                    )
                  }
                  className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/60 hover:border-emerald-500 text-left rtl:text-right transition-all group"
                >
                  <p className="font-bold text-stone-900 dark:text-white text-xs flex items-center justify-between">
                    <span>Dr. Ali Khan</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 font-bold">
                      Andrologist
                    </span>
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    Cleveland Clinic · Andrology Hub
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full py-4 px-6 border-t border-[#E8E2D5] dark:border-stone-800 text-center text-xs text-stone-400">
        <p className="text-[11px]">
          {isAr
            ? 'نظام معلومات الرعاية الصحية المعتمد من دائرة الصحة أبوظبي · متوافق مع معايير ADHICS v2.0 ومنصة ملفي'
            : 'Department of Health (DoH) Abu Dhabi Governed · ADHICS v2.0 Cyber Security & Malaffi HIE Aligned'}
        </p>
      </footer>
    </div>
  );
}
