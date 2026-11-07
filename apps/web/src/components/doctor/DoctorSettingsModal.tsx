'use client';

import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Building2,
  Award,
  MapPin,
  Save,
  Sparkles,
  Check,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';

export interface DoctorSettings {
  fullName: string;
  title: string;
  dohLicense: string;
  facility: string;
  location: string;
  avatarIcon: string;
  logoUrl?: string;
}

export const DEFAULT_DOCTOR_SETTINGS: DoctorSettings = {
  fullName: 'Dr. Ali Khan',
  title: 'Consultant Andrologist & Male Infertility Microsurgeon',
  dohLicense: 'DOH-AUH-2024-9102',
  facility: 'Cleveland Clinic Abu Dhabi · Andrology Hub',
  location: 'Al Maryah Island, Abu Dhabi',
  avatarIcon: '👨‍⚕️',
  logoUrl: '',
};

interface DoctorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: DoctorSettings;
  onSaveSettings: (settings: DoctorSettings) => void;
  onLogout?: () => void;
  locale?: 'en' | 'ar';
}

const LOGO_PRESETS = [
  { id: 'ccad', label: 'Cleveland Clinic', icon: '🏥', color: 'from-blue-600 to-indigo-700' },
  { id: 'ssmc', label: 'SSMC Abu Dhabi', icon: '🏛️', color: 'from-emerald-600 to-teal-700' },
  { id: 'vigor', label: 'Vigor Sovereign', icon: '🛡️', color: 'from-amber-600 to-stone-800' },
  { id: 'caduceus', label: 'UAE Malaffi', icon: '⚕️', color: 'from-red-600 to-rose-700' },
  { id: 'andrology', label: 'Micro-Andrology', icon: '🔬', color: 'from-cyan-600 to-blue-800' },
  { id: 'stethoscope', label: 'Consultant Clinician', icon: '🩺', color: 'from-stone-700 to-black' },
];

export default function DoctorSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
  onLogout,
  locale = 'en',
}: DoctorSettingsModalProps) {
  const isAr = locale === 'ar';
  const [form, setForm] = useState<DoctorSettings>({ ...currentSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form state when modal opens or currentSettings changes
  React.useEffect(() => {
    setForm({ ...currentSettings });
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF8F5] dark:bg-[#181614] border border-[#DDD7C8] dark:border-stone-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E2D5] dark:border-stone-800 bg-white dark:bg-[#1C1A17] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1816] dark:bg-white text-white dark:text-[#181614] flex items-center justify-center font-bold text-lg shadow-xs">
              ⚙️
            </div>
            <div>
              <h3 className="font-editorial-serif text-xl font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                {isAr ? 'إعدادات وهوية الطبيب' : 'Doctor Identity & Clinic Settings'}
              </h3>
              <p className="text-xs text-[#8A8172] dark:text-stone-400">
                {isAr
                  ? 'تخصيص الاسم والشعار والترخيص المعتمد في الوصفات الطبية'
                  : 'Customize your clinician display name, facility logo, and Malaffi license'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2E2922] to-[#181614] dark:from-stone-800 dark:to-stone-900 text-white flex items-center justify-center text-2xl shadow-xs shrink-0 border border-stone-300 dark:border-stone-700">
              {form.avatarIcon || '👨‍⚕️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-editorial-serif text-base font-bold text-[#1A1816] dark:text-[#FAF7F2] truncate">
                {form.fullName || 'Dr. Ali Khan'}
              </div>
              <div className="text-[11px] text-[#6B6355] dark:text-stone-400 truncate">{form.title}</div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                🏥 {form.facility} · {form.dohLicense}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block mb-1">
                {isAr ? 'الاسم الكامل للطبيب' : 'Clinician Full Name'}
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Dr. Ali Khan"
                className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block mb-1">
                {isAr ? 'المسمى الوظيفي والتخصص' : 'Title & Specialty'}
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Consultant Andrologist & Male Infertility Microsurgeon"
                className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block mb-1">
                  {isAr ? 'المستشفى أو المركز الطبي' : 'Clinic / Hospital Name'}
                </label>
                <input
                  type="text"
                  value={form.facility}
                  onChange={(e) => setForm({ ...form, facility: e.target.value })}
                  placeholder="e.g. Cleveland Clinic Abu Dhabi"
                  className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block mb-1">
                  {isAr ? 'رقم ترخيص دائرة الصحة' : 'DoH License Number'}
                </label>
                <input
                  type="text"
                  value={form.dohLicense}
                  onChange={(e) => setForm({ ...form, dohLicense: e.target.value })}
                  placeholder="e.g. DOH-AUH-2024-9102"
                  className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Clinic Logo & Avatar Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block">
                {isAr ? 'شعار العيادة / الأيقونة' : 'Clinic Logo / Avatar Emblem'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {LOGO_PRESETS.map((p) => {
                  const isSelected = form.avatarIcon === p.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, avatarIcon: p.icon })}
                      className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-[#1A1816] text-white dark:bg-white dark:text-[#181614] border-stone-900 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-stone-900 border-[#E8E2D5] dark:border-stone-800 text-[#6B6355] dark:text-stone-300 hover:border-stone-400'
                      }`}
                    >
                      <span className="text-xl">{p.icon}</span>
                      <span className="text-[9px] font-bold truncate max-w-full">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Logo URL */}
            <div>
              <label className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] block mb-1">
                {isAr ? 'رابط شعار مخصص (اختياري)' : 'Custom Logo URL (Optional)'}
              </label>
              <input
                type="text"
                value={form.logoUrl || ''}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://example.com/clinic-logo.png"
                className="w-full text-xs p-3 rounded-xl border border-[#DDD7C8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#1A1816] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1A1816] dark:focus:ring-white"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E8E2D5] dark:border-stone-800 bg-white dark:bg-[#1C1A17] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="px-4 py-2 rounded-full border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-rose-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>{isAr ? 'تسجيل الخروج' : 'Log Out'}</span>
              </button>
            )}
            <span className="text-xs text-[#8A8172] dark:text-stone-400 hidden sm:inline">
              {savedSuccess ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {isAr ? 'تم حفظ وتفعيل الإعدادات بنجاح!' : 'Settings saved and applied!'}
                </span>
              ) : (
                (isAr ? 'يتم حفظ التغييرات محلياً' : 'Changes take effect across portal.')
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#DDD7C8] dark:border-stone-700 text-xs font-bold text-[#6B6355] dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#332F2A] dark:bg-[#FAF7F2] dark:hover:bg-white text-white dark:text-[#181614] text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتطبيق' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
