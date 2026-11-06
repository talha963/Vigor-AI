'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Video,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { TriageResult, Locale } from '@/types/vigor';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  triageResult: TriageResult | null;
  assessmentId?: string;
  initialEmail?: string;
  locale?: Locale;
}

interface SpecialistOption {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  facility: string;
  facilityAr: string;
  location: string;
  locationAr: string;
  dohLicense: string;
  experience: string;
  languages: string[];
  avatar: string;
  telehealthAvailable: boolean;
  inPersonAvailable: boolean;
  earliestSlot: string;
  slots: string[];
  tierMatch: ('URGENT' | 'ANDROLOGY_UROLOGY' | 'FERTILITY_SERVICES' | 'PRIMARY_CARE' | 'SELF_CARE')[];
}

const SPECIALISTS: SpecialistOption[] = [
  {
    id: 'spec_ali',
    name: 'Dr. Ali Khan',
    nameAr: 'د. علي خان',
    title: 'Consultant Andrologist & Male Infertility Microsurgeon',
    titleAr: 'استشاري أمراض الذكورة والعقم وجراحة المسالك البولية المجهرية',
    facility: 'Cleveland Clinic Abu Dhabi · Andrology & Fertility Hub',
    facilityAr: 'كليفلاند كلينك أبوظبي · مركز صحة الرجل والإخصاب',
    location: 'Al Maryah Island, Abu Dhabi',
    locationAr: 'جزيرة المارية، أبوظبي',
    dohLicense: 'DOH-AUH-2024-9102',
    experience: '16+ Years Experience (European Board & Cleveland Clinic)',
    languages: ['Arabic', 'English', 'Urdu'],
    avatar: '👨‍⚕️',
    telehealthAvailable: true,
    inPersonAvailable: true,
    earliestSlot: 'Today · 5:30 PM',
    slots: ['Today · 5:30 PM', 'Today · 7:00 PM', 'Tomorrow · 11:00 AM', 'Tomorrow · 3:30 PM'],
    tierMatch: ['ANDROLOGY_UROLOGY', 'FERTILITY_SERVICES', 'URGENT', 'PRIMARY_CARE'],
  },
  {
    id: 'spec_01',
    name: 'Dr. Tariq Al-Hashimi',
    nameAr: 'د. طارق الهاشمي',
    title: 'Consultant Andrologist & Reproductive Urologist',
    titleAr: 'استشاري أمراض الذكورة والعقم وجراحة المسالك',
    facility: 'HealthPlus Fertility & Andrology Center',
    facilityAr: 'مركز هيلث بلس للإخصاب وصحة الرجل',
    location: 'Al Bateen, Abu Dhabi',
    locationAr: 'البطين، أبوظبي',
    dohLicense: 'DOH-AUH-2018-0924',
    experience: '18+ Years Experience (Ex-Cleveland Clinic)',
    languages: ['Arabic', 'English'],
    avatar: '👨‍⚕️',
    telehealthAvailable: true,
    inPersonAvailable: true,
    earliestSlot: 'Today · 6:30 PM',
    slots: ['Today · 6:30 PM', 'Today · 8:00 PM', 'Tomorrow · 10:30 AM', 'Tomorrow · 2:00 PM'],
    tierMatch: ['ANDROLOGY_UROLOGY', 'FERTILITY_SERVICES', 'URGENT'],
  },
  {
    id: 'spec_02',
    name: 'Dr. Ziad Al-Khafaji',
    nameAr: 'د. زياد الخفاجي',
    title: 'Senior Specialist Urological Microsurgeon',
    titleAr: 'أخصائي أول جراحة المسالك المجهرية وصحة الرجل',
    facility: 'Cleveland Clinic Abu Dhabi',
    facilityAr: 'كليفلاند كلينك أبوظبي',
    location: 'Al Maryah Island, Abu Dhabi',
    locationAr: 'جزيرة المارية، أبوظبي',
    dohLicense: 'DOH-AUH-2015-8821',
    experience: '15+ Years (European Board Certified)',
    languages: ['Arabic', 'English', 'French'],
    avatar: '👨‍⚕️',
    telehealthAvailable: true,
    inPersonAvailable: true,
    earliestSlot: 'Tomorrow · 9:00 AM',
    slots: ['Tomorrow · 9:00 AM', 'Tomorrow · 11:30 AM', 'Tomorrow · 4:00 PM'],
    tierMatch: ['ANDROLOGY_UROLOGY', 'URGENT'],
  },
  {
    id: 'spec_03',
    name: 'Dr. Sarah Al-Marzooqi',
    nameAr: 'د. سارة المرزوقي',
    title: 'Reproductive Medicine & Male Factor Fertility Director',
    titleAr: 'مديرة طب الإنجاب وعقم العوامل الذكورية',
    facility: 'Capital Reproductive Medicine Institute',
    facilityAr: 'معهد العاصمة لطب الإنجاب',
    location: 'Al Nahyan, Abu Dhabi',
    locationAr: 'آل نهيان، أبوظبي',
    dohLicense: 'DOH-AUH-2017-4310',
    experience: '14+ Years Experience (WHO 2021 Advisory)',
    languages: ['Arabic', 'English'],
    avatar: '👩‍⚕️',
    telehealthAvailable: true,
    inPersonAvailable: true,
    earliestSlot: 'Today · 7:15 PM',
    slots: ['Today · 7:15 PM', 'Tomorrow · 1:00 PM', 'Tomorrow · 3:30 PM'],
    tierMatch: ['FERTILITY_SERVICES', 'PRIMARY_CARE'],
  },
  {
    id: 'spec_04',
    name: 'SSMC Acute Urology On-Call Team',
    nameAr: 'فريق طوارئ المسالك البولية على مدار الساعة',
    title: '24/7 Urgent Urology & Emergency Escalation Service',
    titleAr: 'خدمة التدخل العاجل وطوارئ المسالك 24/7',
    facility: 'Sheikh Shakhbout Medical City (SSMC)',
    facilityAr: 'مدينة الشيخ شخبوط الطبية',
    location: 'Al Mafraq, Abu Dhabi',
    locationAr: 'المفرق، أبوظبي',
    dohLicense: 'DOH-AUH-EMERG-001',
    experience: 'Immediate Emergency Care (Zero Waiting Time)',
    languages: ['Arabic', 'English', 'Urdu'],
    avatar: '🚨',
    telehealthAvailable: true,
    inPersonAvailable: true,
    earliestSlot: 'Immediate (Within 15 mins)',
    slots: ['Immediate Dispatch (15 Mins)', 'Today · Next Available'],
    tierMatch: ['URGENT'],
  },
];

export default function BookingModal({
  isOpen,
  onClose,
  triageResult,
  assessmentId,
  initialEmail = '',
  locale = 'en',
}: BookingModalProps) {
  const isAr = locale === 'ar';
  const tier = triageResult?.tier || 'ANDROLOGY_UROLOGY';
  const isUrgent = tier === 'URGENT';

  // Filter specialists matching current acuity tier
  const matchingSpecialists = SPECIALISTS.filter((s) => s.tierMatch.includes(tier));
  const fallbackSpecialists = matchingSpecialists.length > 0 ? matchingSpecialists : SPECIALISTS;

  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistOption>(fallbackSpecialists[0]);
  const [consultType, setConsultType] = useState<'TELEHEALTH_VIDEO' | 'IN_PERSON'>('TELEHEALTH_VIDEO');
  const [selectedSlot, setSelectedSlot] = useState<string>(fallbackSpecialists[0]?.slots[0] || 'Today · 6:30 PM');
  const [emailInput, setEmailInput] = useState<string>(initialEmail);
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [confirmedDetails, setConfirmedDetails] = useState<{
    bookingId: string;
    telehealthRoomUrl?: string;
    slotTime: string;
    doctorName: string;
    facilityName: string;
    emailDispatched: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectSpecialist = (spec: SpecialistOption) => {
    setSelectedSpecialist(spec);
    setSelectedSlot(spec.slots[0]);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: selectedSpecialist.id,
          facilityName: selectedSpecialist.facility,
          doctorName: selectedSpecialist.name,
          department: selectedSpecialist.title,
          location: selectedSpecialist.location,
          consultType,
          slotTime: selectedSlot,
          email: emailInput.trim(),
          phone: phoneInput.trim(),
          assessmentId,
          triageResult,
          locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setConfirmedDetails({
          bookingId: data.bookingId,
          telehealthRoomUrl: data.telehealthRoomUrl,
          slotTime: data.slotTime,
          doctorName: data.doctorName,
          facilityName: data.facilityName,
          emailDispatched: data.emailDispatched,
        });
        setBookingConfirmed(true);
      } else {
        alert(data.error || 'Booking could not be finalized. Please try again.');
      }
    } catch {
      alert('Network error while booking consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadIcsCalendar = () => {
    if (!confirmedDetails) return;
    const title = `Vigor Consultation with ${confirmedDetails.doctorName}`;
    const desc = `Confidential Clinical Consultation via Vigor AI Network. Booking Ref: ${confirmedDetails.bookingId}. Room: ${confirmedDetails.telehealthRoomUrl || 'In-Clinic'}`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Vigor AI//Clinical Telehealth//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigor_appointment_${confirmedDetails.bookingId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in text-left rtl:text-right">
      <div className="bg-[#FAF8F5] dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8E2D5] dark:border-stone-800 flex items-center justify-between bg-[#F4EFE6] dark:bg-[#1F1D1A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Video className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-[#FAF7F2]">
                  {isAr ? 'حجز استشارة سريرية خاصة · شبكة أبوظبي' : 'Confidential Clinical Booking & Telehealth'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  DoH Verified
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'استشارة مشفرة وفورية مع أطباء معتمدين دون الحاجة لفتح ملف أو بطاقة هوية'
                  : 'Zero-friction access to top certified andrologists with pre-loaded clinical triage'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!bookingConfirmed ? (
            <>
              {/* Triage Pathway Match Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  isUrgent
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-950 dark:text-red-200'
                    : 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-sky-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-sky-400 shrink-0" />
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider block opacity-75">
                      {isAr ? 'المسار السريري الموجه له:' : 'Triage Pathway Target:'}
                    </span>
                    <p className="text-sm font-bold">
                      {triageResult?.recommendedService || 'Specialist Andrology & Urology Evaluation'}
                    </p>
                  </div>
                </div>
                <div className="text-right rtl:text-left shrink-0">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-white dark:bg-[#1C1A17] border border-blue-100 dark:border-stone-700 shadow-2xs">
                    {triageResult?.tier.replace('_', ' ') || 'SPECIALIST CARE'}
                  </span>
                </div>
              </div>

              {/* Consultation Modality Switcher */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2">
                  {isAr ? 'اختر طريقة الاستشارة' : 'Select Consultation Modality'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultType('TELEHEALTH_VIDEO')}
                    className={`p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3 ${
                      consultType === 'TELEHEALTH_VIDEO'
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-sky-500 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-[#1C1A17] border-[#E5E0D5] dark:border-stone-800 hover:border-stone-400'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        consultType === 'TELEHEALTH_VIDEO'
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2]">
                          {isAr ? 'مكالمة مرئية مشفرة (عن بُعد)' : 'Private Telehealth Video'}
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {isAr ? 'فوري' : 'Fastest'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-[#DDD7C8] mt-1">
                        {isAr
                          ? 'استشارة من منزلك بخصوصية تامة عبر متصفحك دون تسجيل أو تثبيت برامج'
                          : 'Connect from home via secure end-to-end video. Camera optional, zero account needed.'}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultType('IN_PERSON')}
                    className={`p-4 rounded-2xl border text-left rtl:text-right transition-all flex items-start gap-3 ${
                      consultType === 'IN_PERSON'
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-sky-500 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-[#1C1A17] border-[#E5E0D5] dark:border-stone-800 hover:border-stone-400'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        consultType === 'IN_PERSON'
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2]">
                        {isAr ? 'زيارة حضورية بالعيادة' : 'In-Clinic Hospital Visit'}
                      </span>
                      <p className="text-xs text-stone-600 dark:text-[#DDD7C8] mt-1">
                        {isAr
                          ? 'فحص سريري مباشر ومجهري في أرقى مستشفيات أبوظبي المعتمدة'
                          : 'Physical clinical exam and microscopy at accredited medical centers.'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specialists List */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2">
                  {isAr ? 'الأطباء والمراكز المتخصصة المتاحة' : 'Available Licensed Specialists in Abu Dhabi'}
                </label>
                <div className="space-y-3">
                  {fallbackSpecialists.map((spec) => {
                    const isSelected = selectedSpecialist.id === spec.id;
                    return (
                      <div
                        key={spec.id}
                        onClick={() => handleSelectSpecialist(spec)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-white dark:bg-[#1C1A17] border-blue-600 dark:border-sky-500 shadow-md ring-2 ring-blue-500/10'
                            : 'bg-white/60 dark:bg-[#1C1A17]/60 border-[#E8E2D5] dark:border-stone-800 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="text-2xl p-2 rounded-2xl bg-stone-100 dark:bg-stone-800 shrink-0">
                            {spec.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-stone-900 dark:text-[#FAF7F2]">
                                {isAr ? spec.nameAr : spec.name}
                              </h4>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-blue-700 dark:text-sky-300 flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-stone-600 dark:text-[#DDD7C8] mt-0.5">
                              {isAr ? spec.titleAr : spec.title}
                            </p>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 mt-1">
                              <span>🏥 {isAr ? spec.facilityAr : spec.facility}</span>
                              <span>•</span>
                              <span>{isAr ? spec.locationAr : spec.location}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200 dark:border-stone-800 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
                            ⚡ {isAr ? 'أقرب موعد' : 'Earliest'}: {spec.earliestSlot}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2">
                  {isAr ? 'اختر التوقيت المناسب لك' : 'Select Convenient Consultation Slot'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedSpecialist.slots.map((slot) => {
                    const isSlotSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          isSlotSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white dark:bg-[#1C1A17] border-[#DDD7C8] dark:border-stone-800 text-stone-700 dark:text-[#FAF7F2] hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Contact Information */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-stone-900 dark:text-[#FAF7F2]">
                    {isAr ? 'بيانات تأكيد الموعد ورابط المكالمة' : 'Appointment Confirmation & Join Link Delivery'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-[#DDD7C8] block mb-1">
                      {isAr ? 'البريد الإلكتروني لاستلام الرابط' : 'Email (to receive private video room link)'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full text-xs font-medium pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 dark:text-[#DDD7C8] block mb-1">
                      {isAr ? 'رقم الهاتف للتذكير (اختياري)' : 'Mobile for SMS Reminder (Optional)'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+971 50 000 0000"
                        className="w-full text-xs font-medium pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-relaxed">
                  🔒 {isAr
                    ? 'يتم تشفير وسرية بياناتك بالكامل. لن يرى الطبيب إلا المعرف السريري المشفر وملخص درجات الفحص.'
                    : 'Your contact details are protected under strict Abu Dhabi DoH privacy protocols. The clinician receives only your anonymized assessment ID and risk bands.'}
                </p>
              </div>
            </>
          ) : (
            /* Booking Confirmed State */
            <div className="py-6 px-4 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="text-xs uppercase font-black tracking-widest text-emerald-700 dark:text-emerald-400 block mb-1">
                  {isAr ? 'تم تأكيد الحجز بنجاح' : 'Consultation Confirmed'}
                </span>
                <h3 className="text-xl font-black text-stone-900 dark:text-[#FAF7F2]">
                  {isAr ? 'تم حجز استشارتك السريرية بنجاح' : 'Your Confidential Consultation is Booked'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {isAr ? 'رقم الحجز السريري المرجعي:' : 'Clinical Booking Reference:'}{' '}
                  <strong className="text-stone-800 dark:text-white font-mono">{confirmedDetails?.bookingId}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1A17] border border-[#E8E2D5] dark:border-stone-800 text-left rtl:text-right max-w-md mx-auto space-y-2">
                <p className="text-xs font-bold text-stone-900 dark:text-[#FAF7F2]">
                  👨‍⚕️ {confirmedDetails?.doctorName}
                </p>
                <p className="text-xs text-stone-600 dark:text-[#DDD7C8]">
                  🏥 {confirmedDetails?.facilityName}
                </p>
                <p className="text-xs font-bold text-blue-700 dark:text-sky-300">
                  🗓️ {confirmedDetails?.slotTime}
                </p>
                {confirmedDetails?.emailDispatched && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-2 border-t border-stone-100 dark:border-stone-800">
                    ✉️ {isAr ? `تم إرسال تفاصيل الموعد ورابط الغرفة إلى بريدك` : `Confirmation and video link sent to your email`}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {confirmedDetails?.telehealthRoomUrl && (
                  <a
                    href={confirmedDetails.telehealthRoomUrl}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    <span>{isAr ? 'الدخول إلى غرفة الاستشارة الافتراضية' : 'Join Virtual Waiting Room'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={downloadIcsCalendar}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-[#25221E] border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-[#FAF7F2] font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>{isAr ? 'إضافة إلى التقويم (.ics)' : 'Add to Calendar (.ics)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F4EFE6] dark:bg-[#1F1D1A] border-t border-[#E8E2D5] dark:border-stone-800 flex items-center justify-between">
          <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAr ? 'خاضع لبروتوكولات دائرة الصحة - أبوظبي' : 'Abu Dhabi DoH Telehealth Governed'}</span>
          </p>

          {!bookingConfirmed ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
              >
                {isSubmitting ? (
                  <span>{isAr ? 'جاري تأكيد الموعد...' : 'Confirming Slot...'}</span>
                ) : (
                  <>
                    <span>{isAr ? 'تأكيد الحجز والاستشارة' : 'Confirm Consultation Booking'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
