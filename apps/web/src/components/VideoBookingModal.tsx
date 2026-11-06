'use client';

import React, { useState } from 'react';
import {
  X,
  Video,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Mail,
  Phone,
  FileText,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Locale, TriageResult } from '@/types/vigor';

interface VideoBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  triageResult?: TriageResult | null;
  assessmentId?: string;
  initialEmail?: string;
  locale?: Locale;
}

interface Specialist {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  facility: string;
  location: string;
  dohLicense: string;
  avatar: string;
  slots: string[];
}

const VIDEO_SPECIALISTS: Specialist[] = [
  {
    id: 'spec_ali',
    name: 'Dr. Ali Khan',
    nameAr: 'د. علي خان',
    title: 'Consultant Andrologist & Male Infertility Microsurgeon',
    titleAr: 'استشاري أمراض الذكورة والعقم وجراحة المسالك المجهرية',
    facility: 'Cleveland Clinic Abu Dhabi · Andrology Hub',
    location: 'Al Maryah Island, Abu Dhabi',
    dohLicense: 'DOH-AUH-2024-9102',
    avatar: '👨‍⚕️',
    slots: [
      'Today · 5:30 PM (GST)',
      'Today · 7:00 PM (GST)',
      'Tomorrow · 11:30 AM (GST)',
      'Tomorrow · 4:00 PM (GST)',
    ],
  },
  {
    id: 'spec_02',
    name: 'Dr. Ziad Al-Khafaji',
    nameAr: 'د. زياد الخفاجي',
    title: 'Senior Specialist Urological Microsurgeon',
    titleAr: 'أخصائي أول جراحة المسالك المجهرية وصحة الرجل',
    facility: 'Cleveland Clinic Abu Dhabi',
    location: 'Al Maryah Island, Abu Dhabi',
    dohLicense: 'DOH-AUH-2015-8821',
    avatar: '👨‍⚕️',
    slots: [
      'Today · 6:30 PM (GST)',
      'Today · 8:15 PM (GST)',
      'Tomorrow · 10:00 AM (GST)',
      'Tomorrow · 2:30 PM (GST)',
    ],
  },
  {
    id: 'spec_03',
    name: 'Dr. Sarah Al-Marzooqi',
    nameAr: 'د. سارة المرزوقي',
    title: 'Reproductive Medicine & Male Factor Fertility Director',
    titleAr: 'مديرة طب الإنجاب وعقم العوامل الذكورية',
    facility: 'Capital Reproductive Medicine Institute',
    location: 'Al Nahyan, Abu Dhabi',
    dohLicense: 'DOH-AUH-2017-4310',
    avatar: '👩‍⚕️',
    slots: [
      'Today · 7:15 PM (GST)',
      'Tomorrow · 1:00 PM (GST)',
      'Tomorrow · 3:30 PM (GST)',
    ],
  },
];

export default function VideoBookingModal({
  isOpen,
  onClose,
  triageResult,
  assessmentId,
  initialEmail = '',
  locale = 'en',
}: VideoBookingModalProps) {
  const isAr = locale === 'ar';

  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist>(VIDEO_SPECIALISTS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>(VIDEO_SPECIALISTS[0].slots[0]);
  const [patientName, setPatientName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState(
    triageResult?.tier === 'ANDROLOGY_UROLOGY'
      ? 'Consultation regarding semen analysis parameters and male reproductive health.'
      : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert(isAr ? 'يرجى إدخال عنوان بريد إلكتروني صحيح' : 'Please provide a valid email address.');
      return;
    }
    if (!patientName.trim()) {
      alert(isAr ? 'يرجى إدخال اسم المريض' : 'Please provide your name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          facilityId: selectedSpecialist.id,
          facilityName: selectedSpecialist.facility,
          doctorName: isAr ? selectedSpecialist.nameAr : selectedSpecialist.name,
          department: isAr ? selectedSpecialist.titleAr : selectedSpecialist.title,
          location: selectedSpecialist.location,
          consultType: 'TELEHEALTH_VIDEO',
          slotTime: selectedSlot,
          chiefComplaint: chiefComplaint.trim() || 'Telehealth Video Consultation Request',
          assessmentId,
          triageResult,
          locale,
        }),
      });

      const data = await res.json();
      if (res.ok && data.bookingId) {
        setConfirmedBookingId(data.bookingId);
        setBookingConfirmed(true);
      } else {
        alert(data.error || 'Video booking could not be saved. Please try again.');
      }
    } catch (err) {
      alert('Network error while booking video consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setBookingConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left rtl:text-right">
      <div className="bg-[#FAF8F5] dark:bg-[#181715] rounded-3xl border border-[#DDD7C8] dark:border-stone-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Modal Top Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E8E2D5] dark:border-stone-800 flex items-center justify-between bg-[#F4EFE6] dark:bg-[#1F1D1A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-[#FAF7F2]">
                  {isAr ? 'طلب استشارة فيديو مشفرة (عن بُعد)' : 'Request Telehealth Video Consultation'}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/90 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                  Live Video
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isAr
                  ? 'مكالمة مرئية مباشرة عبر المتصفح مع استشاري معتمد فور موافقة الطبيب'
                  : 'Direct browser-to-browser WebRTC video consultation upon doctor approval'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {!bookingConfirmed ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Specialist Selection Cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
                  1. {isAr ? 'اختر الاستشاري المعتمد' : 'Select Certified Specialist'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {VIDEO_SPECIALISTS.map((spec) => {
                    const isSelected = selectedSpecialist.id === spec.id;
                    return (
                      <div
                        key={spec.id}
                        onClick={() => {
                          setSelectedSpecialist(spec);
                          setSelectedSlot(spec.slots[0]);
                        }}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-sm ring-1 ring-blue-500'
                            : 'bg-white dark:bg-[#1E1C1A] border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xl">{spec.avatar}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-stone-900 dark:text-white truncate">
                              {isAr ? spec.nameAr : spec.name}
                            </p>
                            <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 block truncate">
                              {spec.dohLicense}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-tight">
                          {spec.facility}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slot Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-2">
                  2. {isAr ? 'الموعد المطلوب للاستشارة المرئية' : 'Requested Video Consultation Slot'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedSpecialist.slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl border text-left rtl:text-right transition-all flex flex-col justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 font-bold shadow-xs'
                            : 'bg-white dark:bg-[#1E1C1A] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-[11px] truncate">{slot}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Details Form */}
              <div className="space-y-3 pt-2 border-t border-[#E8E2D5] dark:border-stone-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300">
                  3. {isAr ? 'بيانات المريض للتواصل وإرسال رابط المكالمة' : 'Patient Contact & Video Link Delivery'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder={isAr ? 'مثال: محمد السويدي' : 'e.g. Ali Al-Nuaimi'}
                        className="w-full pl-9 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1C1A] text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      {isAr ? 'البريد الإلكتروني لاستلام رابط المكالمة *' : 'Email Address (For Video Link) *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full pl-9 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1C1A] text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      {isAr ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="w-full pl-9 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1C1A] text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      {isAr ? 'سبب الاستشارة / الأعراض' : 'Chief Complaint / Clinical Notes'}
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-stone-400 absolute left-3 rtl:right-3 top-3" />
                      <input
                        type="text"
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder={isAr ? 'استشارة تحليل السائل المنوي، دوالي الخصية...' : 'Semen analysis review, varicocele...'}
                        className="w-full pl-9 rtl:pr-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1E1C1A] text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy & Direct Notification Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong>{isAr ? 'إشعار فوري بالموافقة:' : 'Instant Doctor Approval Workflow:'}</strong>{' '}
                  {isAr
                    ? 'بمجرد إرسال الطلب، ستصلك رسالة إلكترونية فورية تؤكد استلام الطلب. عند موافقة الطبيب، ستتلقى رابطاً مخصصاً مشفراً لغرفة الفيديو للاتصال المباشر دون الحاجة لتثبيت أي برامج.'
                    : 'Submitting will immediately send an acknowledgment email. Upon doctor approval, you will receive an approval email with your unique video room link to connect in 1 click.'}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wider uppercase shadow-md flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>{isAr ? 'جاري الإرسال...' : 'Submitting Request...'}</span>
                  ) : (
                    <>
                      <span>{isAr ? 'إرسال طلب استشارة الفيديو' : 'Request Video Consultation'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Success & Confirmation View */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {isAr ? 'قيد مراجعة الطبيب' : 'Status: Pending Doctor Approval'}
                </span>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                  {isAr
                    ? 'تم استلام طلب موعدك. يرجى انتظار موافقة الطبيب.'
                    : 'Your appointment request has been received. Please wait for doctor approval.'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  {isAr
                    ? 'تم إرسال رسالة تأكيد إلكترونية إلى بريدك المسجل. فور قيام الطبيب باعتماد الموعد، ستصلك رسالة بالموافقة تتضمن الرابط المباشر لمكالمة الفيديو.'
                    : `An email has been sent to ${email}. As soon as the doctor approves your request, you will receive an approval email with your live meeting URL.`}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1C1A] border border-stone-200 dark:border-stone-800 max-w-md mx-auto text-left rtl:text-right space-y-1.5 text-xs">
                <p>
                  <strong>{isAr ? 'رقم الحجز:' : 'Booking Reference:'}</strong>{' '}
                  <span className="font-mono text-blue-600 dark:text-sky-400 font-bold">{confirmedBookingId}</span>
                </p>
                <p>
                  <strong>{isAr ? 'الطبيب:' : 'Physician:'}</strong>{' '}
                  {isAr ? selectedSpecialist.nameAr : selectedSpecialist.name}
                </p>
                <p>
                  <strong>{isAr ? 'الموعد المطلوب:' : 'Requested Slot:'}</strong> {selectedSlot}
                </p>
                <p>
                  <strong>{isAr ? 'طريقة الاستشارة:' : 'Modality:'}</strong> 📹{' '}
                  {isAr ? 'استشارة مرئية مشفرة (عن بُعد)' : 'Telehealth Video Consultation'}
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-full bg-[#181614] text-white hover:bg-stone-800 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  {isAr ? 'إغلاق' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
