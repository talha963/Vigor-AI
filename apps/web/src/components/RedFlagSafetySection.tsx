'use client';

import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface RedFlagSafetySectionProps {
  locale: Locale;
  onSelectGoldenCase: (caseId: string) => void;
}

export default function RedFlagSafetySection({
  locale,
  onSelectGoldenCase,
}: RedFlagSafetySectionProps) {
  const isAr = locale === 'ar';

  const RED_FLAGS = [
    {
      code: 'RF_ACUTE_SCROTAL_PAIN',
      titleEn: 'Acute Scrotal Pain / Sudden Swelling',
      titleAr: 'ألم حاد في كيس الصفن أو انتفاخ مفاجئ',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC01',
      descEn:
        'Sudden onset of severe testicular pain or swelling (onset <= 6 hours). Testicular torsion involves twisting of the spermatic cord and must be surgically explored immediately to prevent testicular loss.',
      descAr:
        'ألم شديد ومفاجئ أو تورم في الخصية (خلال أقل من 6 ساعات). يشير لاحتمال التواء الخصية الذي يتطلب استكشافاً جراحياً طارئاً لتفادي موت النسيج.',
    },
    {
      code: 'RF_TESTICULAR_MASS',
      titleEn: 'Painless Testicular Lump or Mass',
      titleAr: 'كتلة غير مؤلمة في الخصية',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC02',
      descEn:
        'A discrete lump within the testicular parenchyma. Peak incidence in young men aged 20–35. Testicular cancer is highly treatable if identified before regional or distant spread.',
      descAr:
        'وجود كتلة صلبة داخل نسيج الخصية. يكثر في فئة الشباب (20-35 سنة). أورام الخصية تستجيب للعلاج بشكل كامل عند اكتشافها المبكر.',
    },
    {
      code: 'RF_PRIAPISM',
      titleEn: 'Prolonged Painful Erection (Priapism)',
      titleAr: 'انتصاب مستمر ومؤلم لأكثر من 4 ساعات',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC03',
      descEn:
        'Persistent erection unrelated to sexual stimulation lasting > 4 hours. Ischaemic priapism requires urgent emergency aspiration and sympathomimetic decompression to avoid permanent cavernosal fibrosis.',
      descAr:
        'انتصاب مستمر وغير مرتبط بالرغبة الجنسية يدوم لأكثر من 4 ساعات. حالة طارئة تستدعي تدخلاً لتفريغ الدم الراكد وتفادي تلف نسيج الانتصاب الدائم.',
    },
    {
      code: 'RF_GU_TRAUMA',
      titleEn: 'Recent Genital Trauma',
      titleAr: 'إصابة أو صدمة مباشرة بالأعضاء التناسلية',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC01',
      descEn:
        'Blunt or penetrating trauma with swelling, ecchymosis, or acute tenderness. Urgent scrotal ultrasound is required to exclude testicular rupture or tunica albuginea fracture.',
      descAr:
        'إصابة ناجمة عن حادث أو ضربة تؤدي إلى تورم أو نزيف موضعي. يلزم إجراء فحص بالموجات فوق الصوتية لاستبعاد تمزق الغلاف المحيط بالخصية.',
    },
    {
      code: 'RF_ACUTE_URINARY_RETENTION',
      titleEn: 'Inability to Pass Urine (Retention)',
      titleAr: 'احتباس البول الحاد والعجز عن التبول',
      severity: 'URGENT',
      slaMinutes: 60,
      goldenCase: 'GC04',
      descEn:
        'Sudden, painful inability to void despite full bladder sensation. Demands emergency catheter decompression and investigation of the outflow tract.',
      descAr:
        'عجز مفاجئ ومؤلم عن تفريغ المثانة بالرغم من امتلائها. يستلزم تركيب قسطرة بولية عاجلة لمنع ارتجاع البول وتلف الكلى.',
    },
    {
      code: 'RF_FEBRILE_GU_INFECTION',
      titleEn: 'Fever with Urethral Discharge or Dysuria',
      titleAr: 'حمى مع إفرازات مجرى البول أو ألم حاد',
      severity: 'SAME_DAY',
      slaMinutes: 480,
      goldenCase: 'GC05',
      descEn:
        'Systemic fever paired with acute urethritis, dysuria, or epididymo-orchitis. Requires same-day microbiological culture, STI screening, and targeted empiric antibiotic therapy.',
      descAr:
        'ارتفاع في درجة الحرارة مصحوب بحرقة بولية أو إفرازات أو ألم بربخي. يتطلب تقييماً في نفس اليوم وبدء مضادات حيوية مستهدفة.',
    },
    {
      code: 'RF_PITUITARY_SUSPICION',
      titleEn: 'Visual Field Loss with Gynaecomastia or Libido Loss',
      titleAr: 'تغيرات في مجال الرؤية مع تثدي أو غياب الرغبة',
      severity: 'SAME_DAY',
      slaMinutes: 480,
      goldenCase: 'GC06',
      descEn:
        'Bitemporal hemianopia combined with endocrine signs suggests a mass expanding beyond the sella turcica compressing the optic chiasm (e.g. macroprolactinoma).',
      descAr:
        'فقدان جزئي لمجال الرؤية مع أعراض هرمونية تشير إلى ورم محتمل في الغدة النخامية يضغط على العصب البصري.',
    },
    {
      code: 'RF_BILATERAL_UNDESCENDED',
      titleEn: 'Bilateral Uncorrected Undescended Testes',
      titleAr: 'خصية هاجرة غير معالجة في الجانبين',
      severity: 'ROUTINE_REVIEW',
      slaMinutes: 2880,
      goldenCase: 'GC07',
      descEn:
        'Cryptorchidism remaining uncorrected into adulthood severely impairs spermatogenesis and carries an increased malignancy risk warranting specialist imaging and biopsy.',
      descAr:
        'عدم نزول الخصيتين لكيس الصفن منذ الطفولة. يؤثر بشدة على الخلايا المنوية ويتطلب تقييماً تخصصياً بالموجات فوق الصوتية.',
    },
    {
      code: 'RF_ABSENT_VAS',
      titleEn: 'Congenital Absence of Vas Deferens (CBAVD)',
      titleAr: 'غياب القناة المنوية الناقلة (CBAVD)',
      severity: 'ROUTINE_REVIEW',
      slaMinutes: 2880,
      goldenCase: 'GC08',
      descEn:
        'Strongly associated with cystic fibrosis gene (CFTR) mutations. Obstructive azoospermia requiring CFTR screening, renal tract ultrasound, and microsurgical sperm retrieval.',
      descAr:
        'يرتبط بطفرات جين التليف الكيسي (CFTR). يسبب انسداداً منوياً ويستلزم فحصاً جينياً وتخطيطاً لسحب النطاف مجهرياً.',
    },
  ];

  return (
    <section id="red-flags" className="relative overflow-hidden py-20 bg-white dark:bg-[#080d1a] border-b border-blue-50 dark:border-slate-800 transition-colors duration-200">
      {/* Background Animated Ambient Light Glow */}
      <div className="absolute top-1/3 left-10 w-96 h-96 bg-red-500/5 dark:bg-red-600/5 rounded-full blur-3xl animate-ambient-glow pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-3xl animate-ambient-glow pointer-events-none -z-10 [animation-delay:3s]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wider mb-4 border border-red-200 dark:border-red-900 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>{isAr ? 'صمام الأمان السريري غير القابل للتراجع' : 'The Deterministic Safety Floor'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 dark:text-white tracking-tight mb-4">
            {isAr ? 'علامات الخطر السريرية التسع (9 Red Flags)' : 'The 9 Clinical Red-Flag Gates'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {isAr
              ? 'صيغت هذه القواعد التسع لحماية سلامة المريض فوق كل اعتبار. تعمل دوال نقية على مفردات مغلقة من الأعراض، وتفرض تصعيد الحالة الطارئة بصورة إلزامية لا يمكن للذكاء الاصطناعي خفضها.'
              : 'These 9 deterministic gates establish the non-negotiable safety floor. AI models can elevate a tier, but can never lower it. Acute presentations bypass routine scheduling with a strict 60-minute SLA.'}
          </p>
        </div>

        {/* Invariant Banner */}
        <div className="mb-12 relative overflow-hidden bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 dark:from-blue-950 dark:via-blue-900 dark:to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-blue-700/50 dark:border-slate-700 group hover:border-blue-500/80 transition-all">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 text-left rtl:text-right">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 animate-cardiac">
                <AlertTriangle className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-wide uppercase text-blue-100 flex items-center gap-2">
                  <span>{isAr ? 'قاعدة التصعيد الحتمي الإلزامي' : 'The Escalate-Only Invariant'}</span>
                  <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </h3>
                <p className="text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  {isAr
                    ? 'في حال رصد أي من العلامات الحمراء، يثبت النظام الحالة على فئة الطوارئ (URGENT). حتى لو اقترح نموذج الذكاء الاصطناعي رعاية أولية، يرفض النظام ذلك جبرياً ويسجل الواقعة في سجل التدقيق.'
                    : 'The red-flag gate runs before any generative model. If an acute symptom is triggered, the clinical tier is clamped to URGENT. No downstream node or prompt can de-escalate it. Refused de-escalations are audited.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-400 text-blue-950 uppercase tracking-wider shadow-sm hover:scale-105 transition-transform">
                {isAr ? 'ضمان سلامة 100٪' : 'Zero-Drift Safety Floor'}
              </span>
            </div>
          </div>
        </div>

        {/* 9 Red Flags Accordion / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {RED_FLAGS.map((flag) => {
            const isUrgent = flag.severity === 'URGENT';
            const isSameDay = flag.severity === 'SAME_DAY';

            return (
              <div
                key={flag.code}
                className="hover-lift group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-blue-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between text-left rtl:text-right"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isUrgent
                          ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 shadow-xs'
                          : isSameDay
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-900'
                      }`}
                    >
                      {isUrgent ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                        </span>
                      ) : isSameDay ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      ) : null}
                      <span>{flag.severity} · {flag.slaMinutes}m SLA</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                      {flag.code}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-blue-950 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-sky-300 transition-colors">
                    {isAr ? flag.titleAr : flag.titleEn}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {isAr ? flag.descAr : flag.descEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-blue-50 dark:border-slate-800 flex items-center justify-between mt-auto">
                  <button
                    onClick={() => onSelectGoldenCase(flag.goldenCase)}
                    className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 flex items-center gap-1 group/btn"
                  >
                    <span>{isAr ? `اختبر حالة ${flag.goldenCase}` : `Test Case ${flag.goldenCase}`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-90 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {isUrgent ? 'SLA: <= 60 mins' : isSameDay ? 'SLA: <= 8 hours' : 'SLA: <= 48 hours'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
