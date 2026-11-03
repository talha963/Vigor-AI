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
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface AboutSectionProps {
  locale: Locale;
}

export default function AboutSection({ locale }: AboutSectionProps) {
  const isAr = locale === 'ar';

  return (
    <section id="how-it-works" className="py-20 bg-slate-50/60 border-b border-blue-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? 'منهجية فيجور السريرية والتقنية' : 'Platform Architecture & Clinical Design'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mb-4">
            {isAr
              ? 'كيف تحول فيجور مسار رعاية صحة الرجل التناسلية؟'
              : 'How Vigor Redefines Male Reproductive Health'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {isAr
              ? 'نهج شامل يجمع بين الفرز الذاتي المجهول، وصمامات الأمان السريرية الحتمية، وحماية الخصوصية بالتشفير، لضمان وصول الرعاية في الوقت المناسب دون أي حرج.'
              : 'A multi-tier architecture combining anonymous self-assessment, deterministic safety gates, and privacy-preserving orchestration to ensure timely clinical intervention without stigma.'}
          </p>
        </div>

        {/* The 4-Step Pathway Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              01
            </div>
            <h3 className="text-lg font-bold text-blue-950 mb-2">
              {isAr ? 'الفرز المجهول ثنائي اللغة' : 'Anonymous Bilingual Intake'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {isAr
                ? 'فحص رقمي لا يتطلب بريداً إلكترونياً أو اسماً. كل سؤال اختياري وقابل للتخطي، وتسجل التخطيات بشفافية لحساب نسبة الدقة السريرية.'
                : 'Zero accounts, no direct identifiers. Complete in under 10 minutes. Every question is skippable, and skips are transparently factored into result confidence.'}
            </p>
            <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 mt-auto pt-2 border-t border-blue-50">
              <EyeOff className="w-4 h-4" />
              <span>{isAr ? 'هوية مقنعة (Pseudonym ID)' : 'Pseudonymous psn_ ID'}</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              02
            </div>
            <h3 className="text-lg font-bold text-blue-950 mb-2">
              {isAr ? 'صمام الأمان السريري الحتمي' : 'Deterministic Safety Floor'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {isAr
                ? '9 دوال برمجية نقية تفحص علامات الخطر الحرجة (مثل التواء الخصية أو الكتل) قبل أي نموذج ذكاء اصطناعي. يمكن للنظام رفع مستوى الخطورة فقط، ويمنع خفضها.'
                : '9 pure functions over a closed symptom vocabulary run before any AI model. The system strictly enforces the escalate-only clamp—AI can elevate care, never lower it.'}
            </p>
            <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 mt-auto pt-2 border-t border-blue-50">
              <Activity className="w-4 h-4" />
              <span>{isAr ? 'استجابة طارئة خلال 60 دقيقة' : '60-Min Emergency SLA'}</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              03
            </div>
            <h3 className="text-lg font-bold text-blue-950 mb-2">
              {isAr ? 'دفتر الموافقة غير القابل للتعديل' : 'Cryptographic Consent Ledger'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {isAr
                ? 'سجل موافقة تسلسلي صارم. لا تتم أي مشاركة أو إجراء إلا بإذن صريح. زر واحد يطلق تسلسل الإلغاء الفوري ويبطل جميع الرموز مع إيصال مشفر.'
                : 'Append-only ledger. No consent, no action. The user inspects shared scopes and can trigger an instant revocation cascade with a signed receipt.'}
            </p>
            <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 mt-auto pt-2 border-t border-blue-50">
              <Lock className="w-4 h-4" />
              <span>{isAr ? 'إلغاء فوري بضغطة واحدة' : 'Instant Revocation Cascade'}</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-black text-xl flex items-center justify-center mb-5 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              04
            </div>
            <h3 className="text-lg font-bold text-blue-950 mb-2">
              {isAr ? 'التوجيه السري المعتمد' : 'Safe Closed-Loop Routing'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {isAr
                ? 'توجيه آمن نحو عينات الفحص المنزلي مع خزائن استلام سرية، أو حجز استشارة طبية متخصصة في مراكز طب الذكورة المعتمدة في أبوظبي.'
                : 'Tailored care pathways: discreet courier/smart-locker at-home test kits, specialist teleconsultations, or accredited urology/andrology centres in Abu Dhabi.'}
            </p>
            <div className="text-xs font-semibold text-blue-600 flex items-center gap-1.5 mt-auto pt-2 border-t border-blue-50">
              <Stethoscope className="w-4 h-4" />
              <span>{isAr ? 'مراكز معتمدة في أبوظبي' : 'Abu Dhabi Accredited Facilities'}</span>
            </div>
          </div>
        </div>

        {/* Why Vigor Matters (The Problem vs The Solution) */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-blue-100 shadow-sm mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 mb-2 block">
                {isAr ? 'الواقع السريري الحالي' : 'The Clinical Challenge'}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-blue-950 mb-4">
                {isAr
                  ? 'لماذا تتأخر الرعاية الصحية التناسلية للرجال؟'
                  : 'Why Male Reproductive Health Suffers From Delay'}
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                {isAr
                  ? 'تسهم العوامل الذكورية في نحو 50٪ من حالات صعوبة الإنجاب، ومع ذلك، لا يتم فحص الرجل غالباً إلا بعد خضوع الشريكة لفحوصات مجهدة وطويلة. هذا التأخر يعيق العلاج المبكر للأسباب القابلة للتصحيح مثل دوالي الخصية، والمتلازمات الأيضية، والالتهابات غير المعالجة.'
                  : 'Male factors contribute to nearly 50% of reproductive challenges, yet men typically seek care only after years of unsuccessful conception and extensive female partner testing. This delays the identification of reversible causes: varicoceles, metabolic dysregulation, endocrine deficits, and chronic genital infections.'}
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">✕</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    <strong>{isAr ? 'وصمة اجتماعية وتجنب للفحص:' : 'Social Stigma & Avoidance:'}</strong>{' '}
                    {isAr
                      ? 'الخجل والتردد في مناقشة الأعراض في العيادات التقليدية.'
                      : 'Embarrassment prevents in-person clinical consultations until symptoms become severe.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">✕</span>
                  </div>
                  <p className="text-sm text-slate-700">
                    <strong>{isAr ? 'فوات نافذة العلاج الحرجة:' : 'Missed Critical Intervention Windows:'}</strong>{' '}
                    {isAr
                      ? 'حالات حادة كالتواء الخصية تتطلب تدخلاً خلال أقل من 6 ساعات لتجنب فقدان النسيج.'
                      : 'Time-critical emergencies like testicular torsion require surgical intervention within 6 hours.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 rounded-2xl p-6 sm:p-8 border border-blue-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 mb-2 block">
                {isAr ? 'الحل مع فيجور' : 'The Vigor Paradigm'}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-950 mb-4">
                {isAr ? 'الفرز الوقائي المبكر والمبني على الأدلة' : 'Confidential, Preventive, Evidence-Based'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950">
                      {isAr ? 'مشاركة البيانات بالحد الأدنى (Data Minimisation)' : 'Data Minimisation by Default'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
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
                    <h4 className="text-sm font-bold text-blue-950">
                      {isAr ? 'الفرز ليس تشخيصاً (Boundary Invariant)' : 'Screening is NOT Diagnosis Boundary'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
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
                    <h4 className="text-sm font-bold text-blue-950">
                      {isAr ? 'حجب النتائج الصادمة تلقائياً (Severe Results Gate)' : 'Non-Automated Delivery for Severe Findings'}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
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
