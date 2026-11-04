'use client';

import React from 'react';
import {
  Shield,
  Activity,
  Heart,
  EyeOff,
  GitBranch,
  Lock,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Sparkles,
  Users,
  FlaskConical,
  Package,
  Microscope,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface AboutSectionProps {
  locale: Locale;
}

export default function AboutSection({ locale }: AboutSectionProps) {
  const isAr = locale === 'ar';

  return (
    <section id="how-it-works" className="relative overflow-hidden py-20 bg-slate-50/70 dark:bg-[#070d1a] border-b border-blue-100/60 dark:border-slate-800 transition-colors duration-200">
      {/* Background Animated Ambient Light Glow */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl animate-ambient-glow pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl animate-ambient-glow pointer-events-none -z-10 [animation-delay:2.5s]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-sky-300 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-200/60 dark:border-blue-800/60">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>{isAr ? 'منهجية فيجور السريرية والتقنية' : 'Platform Architecture & Clinical Design'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 dark:text-white tracking-tight mb-4">
            {isAr
              ? 'كيف تحول فيجور مسار رعاية صحة الرجل التناسلية؟'
              : 'How Vigor Redefines Male Reproductive Health'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {isAr
              ? 'نهج شامل يجمع بين الفرز الذاتي المجهول، وصمامات الأمان السريرية الحتمية، وحماية الخصوصية بالتشفير، لضمان وصول الرعاية في الوقت المناسب دون أي حرج.'
              : 'A multi-tier architecture combining anonymous self-assessment, deterministic safety gates, and privacy-preserving orchestration to ensure timely clinical intervention without stigma.'}
          </p>
        </div>

        {/* The 4-Step Pathway Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 items-stretch">
          {/* Step 1 */}
          <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl p-6 border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all relative overflow-hidden group flex flex-col justify-between text-left rtl:text-right">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-100/30 dark:to-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 shadow-xs transition-all duration-300">
                01
              </div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                {isAr ? 'الفرز المجهول ثنائي اللغة' : 'Anonymous Bilingual Intake'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {isAr
                  ? 'فحص رقمي لا يتطلب بريداً إلكترونياً أو اسماً. كل سؤال اختياري وقابل للتخطي، وتسجل التخطيات بشفافية لحساب نسبة الدقة السريرية.'
                  : 'Zero accounts, no direct identifiers. Complete in under 10 minutes. Every question is skippable, and skips are transparently factored into result confidence.'}
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1.5 pt-3 border-t border-blue-50 dark:border-slate-800 mt-auto">
              <EyeOff className="w-4 h-4 shrink-0 group-hover:rotate-12 transition-transform duration-300" />
              <span>{isAr ? 'هوية مقنعة (Pseudonym ID)' : 'Pseudonymous psn_ ID'}</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl p-6 border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all relative overflow-hidden group flex flex-col justify-between text-left rtl:text-right">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-100/30 dark:to-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 shadow-xs transition-all duration-300">
                02
              </div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                {isAr ? 'صمام الأمان السريري الحتمي' : 'Deterministic Safety Floor'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {isAr
                  ? '9 دوال برمجية نقية تفحص علامات الخطر الحرجة (مثل التواء الخصية أو الكتل) قبل أي نموذج ذكاء اصطناعي. يمكن للنظام رفع مستوى الخطورة فقط، ويمنع خفضها.'
                  : '9 pure functions over a closed symptom vocabulary run before any AI model. The system strictly enforces the escalate-only clamp—AI can elevate care, never lower it.'}
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1.5 pt-3 border-t border-blue-50 dark:border-slate-800 mt-auto">
              <Activity className="w-4 h-4 shrink-0 group-hover:scale-125 transition-transform duration-300 text-red-500" />
              <span>{isAr ? 'استجابة طارئة خلال 60 دقيقة' : '60-Min Emergency SLA'}</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl p-6 border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all relative overflow-hidden group flex flex-col justify-between text-left rtl:text-right">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-100/30 dark:to-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 shadow-xs transition-all duration-300">
                03
              </div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                {isAr ? 'دفتر الموافقة غير القابل للتعديل' : 'Cryptographic Consent Ledger'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {isAr
                  ? 'سجل موافقة تسلسلي صارم. لا تتم أي مشاركة أو إجراء إلا بإذن صريح. زر واحد يطلق تسلسل الإلغاء الفوري ويبطل جميع الرموز مع إيصال مشفر.'
                  : 'Append-only ledger. No consent, no action. The user inspects shared scopes and can trigger an instant revocation cascade with a signed receipt.'}
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1.5 pt-3 border-t border-blue-50 dark:border-slate-800 mt-auto">
              <Lock className="w-4 h-4 shrink-0 group-hover:-rotate-12 transition-transform duration-300" />
              <span>{isAr ? 'إلغاء فوري بضغطة واحدة' : 'Instant Revocation Cascade'}</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl p-6 border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all relative overflow-hidden group flex flex-col justify-between text-left rtl:text-right">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-100/30 dark:to-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 shadow-xs transition-all duration-300">
                04
              </div>
              <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                {isAr ? 'التوجيه السري المعتمد' : 'Safe Closed-Loop Routing'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {isAr
                  ? 'توجيه آمن نحو عينات الفحص المنزلي مع خزائن استلام سرية، أو حجز استشارة طبية متخصصة في مراكز طب الذكورة المعتمدة في أبوظبي.'
                  : 'Tailored care pathways: discreet courier/smart-locker at-home test kits, specialist teleconsultations, or accredited urology/andrology centres in Abu Dhabi.'}
              </p>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-sky-400 flex items-center gap-1.5 pt-3 border-t border-blue-50 dark:border-slate-800 mt-auto">
              <Stethoscope className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span>{isAr ? 'مراكز معتمدة في أبوظبي' : 'Abu Dhabi Accredited Facilities'}</span>
            </div>
          </div>
        </div>

        {/* Visual Healthcare Gallery: Clinical Infrastructure & Care Delivery in Abu Dhabi */}
        <div id="clinical-lab" className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-sky-400 mb-2 block">
              {isAr ? 'البنية التحتية الطبية' : 'Clinical Infrastructure'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-blue-950 dark:text-white">
              {isAr
                ? 'البيئة السريرية والمخبرية المعتمدة في أبوظبي'
                : 'Accredited Clinical & Diagnostic Environment'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              {isAr
                ? 'فحوصات معيارية تواكب أحدث المعايير العالمية لمنظمة الصحة العالمية لعام 2021 والرقابة الطبية المباشرة'
                : 'Strict alignment with WHO 2021 6th Edition laboratory protocols and licensed medical facilities'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Photo Card 1: Andrology Lab */}
            <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/andrology-lab.jpg"
                    alt="Modern Andrology Laboratory"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  {/* Diagnostic Scanline Laser Beam on Hover */}
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-950 dark:text-sky-200 border border-blue-100 dark:border-slate-700 shadow-xs flex items-center gap-1.5 group-hover:border-blue-300 dark:group-hover:border-sky-500 transition-colors">
                    <FlaskConical className="w-3 h-3 text-blue-600 dark:text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
                    <span>{isAr ? 'مختبر أندورلوجيا' : 'Andrology Laboratory'}</span>
                  </div>
                </div>
                <div className="p-4 text-left rtl:text-right">
                  <h4 className="text-sm font-bold text-blue-950 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                    {isAr ? 'مختبرات الفحص المجهري المتقدم' : 'High-Precision Diagnostics'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'أجهزة مجهرية متطورة لتحليل السائل المنوي ومراقبة حركة وتشوهات الحيوانات المنوية بدقة عالية.'
                      : 'Phase-contrast microscopy and automated CASA workstations ensuring strict compliance with WHO standards.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Card 2: Clinical Consultation */}
            <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/clinical-consult.jpg"
                    alt="Doctor Clinical Consultation"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  {/* Diagnostic Scanline Laser Beam on Hover */}
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-950 dark:text-sky-200 border border-blue-100 dark:border-slate-700 shadow-xs flex items-center gap-1.5 group-hover:border-blue-300 dark:group-hover:border-sky-500 transition-colors">
                    <Stethoscope className="w-3 h-3 text-blue-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300" />
                    <span>{isAr ? 'استشارة استشاري' : 'Consultant Review'}</span>
                  </div>
                </div>
                <div className="p-4 text-left rtl:text-right">
                  <h4 className="text-sm font-bold text-blue-950 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                    {isAr ? 'استشارة طبية خاصة وسرية' : 'Private Clinical Consult'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'جلسات مراجعة خاصة وسرية مع استشاريي طب الذكورة والمسالك البولية المرخصين في أبوظبي.'
                      : 'Dedicated private consultation environments with licensed urologists and andrologists across Abu Dhabi.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Card 3: At-Home Testing Kit */}
            <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/athome-kit.jpg"
                    alt="At-Home Sample Collection Kit"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  {/* Diagnostic Scanline Laser Beam on Hover */}
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-950 dark:text-sky-200 border border-blue-100 dark:border-slate-700 shadow-xs flex items-center gap-1.5 group-hover:border-blue-300 dark:group-hover:border-sky-500 transition-colors">
                    <Package className="w-3 h-3 text-blue-600 dark:text-sky-400 group-hover:scale-110 transition-transform duration-300" />
                    <span>{isAr ? 'فحص منزلي سري' : 'At-Home Testing Kit'}</span>
                  </div>
                </div>
                <div className="p-4 text-left rtl:text-right">
                  <h4 className="text-sm font-bold text-blue-950 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                    {isAr ? 'طرد العينات المعزول حرارياً' : 'Discreet Thermal Collection'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'طقم جمع عينات معقم مزود بحفظ حراري مبرد، ورمز باركود مشفر يضمن عدم كشف الهوية عند التسليم.'
                      : 'Sterile thermal-sleeved collection vials with tamper-evident barcoded seals for discreet locker collection.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Photo Card 4: Semen Microscopy */}
            <div className="hover-lift bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-sky-500 transition-all group flex flex-col justify-between">
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/semen-microscopy.jpg"
                    alt="WHO 2021 Semen Analysis Microscopy"
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  {/* Diagnostic Scanline Laser Beam on Hover */}
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent scanline-beam opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-950 dark:text-sky-200 border border-blue-100 dark:border-slate-700 shadow-xs flex items-center gap-1.5 group-hover:border-blue-300 dark:group-hover:border-sky-500 transition-colors">
                    <Microscope className="w-3 h-3 text-blue-600 dark:text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
                    <span>{isAr ? 'معايير WHO 2021' : 'WHO 2021 Standard'}</span>
                  </div>
                </div>
                <div className="p-4 text-left rtl:text-right">
                  <h4 className="text-sm font-bold text-blue-950 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                    {isAr ? 'تحليل الحركة والتركيز الحقيقي' : 'CASA Motility & Viability'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'تتبع حركي متقدم وحساب النسبة المئوية للحركة التقدمية (30٪) والأشكال الطبيعية (4٪) طبياً.'
                      : 'Algorithmic path tracking measuring 30% progressive motility, 4% normal forms, and viability thresholds.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Vigor Matters (The Problem vs The Solution) */}
        <div className="bg-white dark:bg-slate-900/90 rounded-3xl p-8 sm:p-12 border border-blue-100 dark:border-slate-800 shadow-sm mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <div className="flex flex-col justify-between text-left rtl:text-right">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400 mb-2 block">
                  {isAr ? 'الواقع السريري الحالي' : 'The Clinical Challenge'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-blue-950 dark:text-white mb-4">
                  {isAr
                    ? 'لماذا تتأخر الرعاية الصحية التناسلية للرجال؟'
                    : 'Why Male Reproductive Health Suffers From Delay'}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  {isAr
                    ? 'تسهم العوامل الذكورية في نحو 50٪ من حالات صعوبة الإنجاب، ومع ذلك، لا يتم فحص الرجل غالباً إلا بعد خضوع الشريكة لفحوصات مجهدة وطويلة. هذا التأخر يعيق العلاج المبكر للأسباب القابلة للتصحيح مثل دوالي الخصية، والمتلازمات الأيضية، والالتهابات غير المعالجة.'
                    : 'Male factors contribute to nearly 50% of reproductive challenges, yet men typically seek care only after years of unsuccessful conception and extensive female partner testing. This delays the identification of reversible causes: varicoceles, metabolic dysregulation, endocrine deficits, and chronic genital infections.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✕
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">{isAr ? 'وصمة اجتماعية وتجنب للفحص:' : 'Social Stigma & Avoidance:'}</strong>{' '}
                    {isAr
                      ? 'الخجل والتردد في مناقشة الأعراض في العيادات التقليدية.'
                      : 'Embarrassment prevents in-person clinical consultations until symptoms become severe.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✕
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">{isAr ? 'فوات نافذة العلاج الحرجة:' : 'Missed Critical Intervention Windows:'}</strong>{' '}
                    {isAr
                      ? 'حالات حادة كالتواء الخصية تتطلب تدخلاً خلال أقل من 6 ساعات لتجنب فقدان النسيج.'
                      : 'Time-critical emergencies like testicular torsion require surgical intervention within 6 hours.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 dark:bg-slate-800/60 rounded-2xl p-6 sm:p-8 border border-blue-100 dark:border-slate-700 flex flex-col justify-between text-left rtl:text-right">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-sky-400 mb-2 block">
                  {isAr ? 'الحل مع فيجور' : 'The Vigor Paradigm'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-blue-950 dark:text-white mb-4">
                  {isAr ? 'الفرز الوقائي المبكر والمبني على الأدلة' : 'Confidential, Preventive, Evidence-Based'}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 dark:text-white">
                      {isAr ? 'مشاركة البيانات بالحد الأدنى (Data Minimisation)' : 'Data Minimisation by Default'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'لا تطلع المرافق الطبية على نصوص الإجابات الحرة، بل تستلم فقط فئات المخاطر ورموز الفرز.'
                        : 'Clinics receive category codes and acuity tiers, never raw answers or free text.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 dark:text-white">
                      {isAr ? 'الفرز ليس تشخيصاً (Boundary Invariant)' : 'Screening is NOT Diagnosis Boundary'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'تتضمن كل نتيجة بياناً إلزامياً في صلب البيانات يوضح أن الفحص استرشادي ويستلزم تقييماً طبياً.'
                        : 'Every response carries the non-negotiable boundary payload requiring clinical physician validation.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 dark:text-white">
                      {isAr ? 'حجب النتائج الصادمة تلقائياً (Severe Results Gate)' : 'Non-Automated Delivery for Severe Findings'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {isAr
                        ? 'في حالات انعدام الحيوانات المنوية (Azoospermia)، تحجب التفاصيل الرقمية وتوجه لمقابلة الطبيب تجنباً للصدمة النفسية.'
                        : 'Findings like azoospermia withhold raw numbers from automated notifications, routing directly to physician consultation.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
