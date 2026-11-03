'use client';

import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  HelpCircle,
  Activity,
  Check,
} from 'lucide-react';
import { IntakeAnswers, Locale, Symptom, TriageResult } from '@/types/vigor';
import { reconcileIntake } from '@/lib/clinical-engine';
import { GOLDEN_CASES } from '@/lib/golden-cases';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  onAssessmentCompleted: (result: TriageResult, answers: IntakeAnswers) => void;
  initialAnswers?: IntakeAnswers;
}

export default function IntakeModal({
  isOpen,
  onClose,
  locale,
  onAssessmentCompleted,
  initialAnswers,
}: IntakeModalProps) {
  const isAr = locale === 'ar';
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<IntakeAnswers>(initialAnswers || {});

  // Sync initialAnswers if provided
  React.useEffect(() => {
    if (initialAnswers) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleUpdate = <K extends keyof IntakeAnswers>(field: K, value: IntakeAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (sym: Symptom) => {
    const current = answers.symptoms || [];
    if (current.includes(sym)) {
      handleUpdate(
        'symptoms',
        current.filter((s) => s !== sym)
      );
    } else {
      handleUpdate('symptoms', [...current, sym]);
    }
  };

  const handlePreloadGoldenCase = (caseId: string) => {
    const gc = GOLDEN_CASES.find((c) => c.id === caseId);
    if (gc) {
      setAnswers(gc.answers);
      setStep(4); // jump to symptoms review
    }
  };

  const handleSubmit = () => {
    const result = reconcileIntake(answers);
    onAssessmentCompleted(result, answers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950">
                {isAr ? 'الفرز السريري السري لصحة الرجل' : 'Confidential Male Health Intake'}
              </h2>
              <p className="text-[11px] text-blue-600 font-medium">
                {isAr
                  ? `الخطوة ${step} من ${totalSteps} · جميع الأسئلة اختيارية`
                  : `Step ${step} of ${totalSteps} · All questions skippable`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Golden Cases Quick Picker Bar */}
        <div className="px-6 py-2 bg-blue-50/30 border-b border-blue-50 text-xs flex items-center gap-2 overflow-x-auto">
          <span className="font-bold text-blue-900 shrink-0">
            {isAr ? 'تحميل سيناريو مسبق:' : 'Load Golden Case:'}
          </span>
          <button
            onClick={() => handlePreloadGoldenCase('GC01')}
            className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-semibold shrink-0 hover:bg-red-200"
          >
            GC01 Torsion (Urgent)
          </button>
          <button
            onClick={() => handlePreloadGoldenCase('GC02')}
            className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[11px] font-semibold shrink-0 hover:bg-red-200"
          >
            GC02 Mass (Urgent)
          </button>
          <button
            onClick={() => handlePreloadGoldenCase('GC09')}
            className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-semibold shrink-0 hover:bg-blue-200"
          >
            GC09 Metabolic
          </button>
          <button
            onClick={() => handlePreloadGoldenCase('GC15')}
            className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold shrink-0 hover:bg-emerald-200"
          >
            GC15 Healthy
          </button>
          <button
            onClick={() => handlePreloadGoldenCase('GC16')}
            className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold shrink-0 hover:bg-slate-200"
          >
            GC16 Gradual Ache
          </button>
        </div>

        {/* Modal Body / Steps */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1: Anthropometrics & Metabolic */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-blue-50 pb-3">
                <h3 className="text-lg font-bold text-blue-950">
                  {isAr ? '1. مؤشرات القياس وصحة التمثيل الغذائي' : '1. Anthropometrics & Metabolic Indicators'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'تؤثر السمنة وداء السكري وضغط الدم على جودة النطاف ومستويات هرمون الذكورة (التستوستيرون).'
                    : 'Metabolic syndrome and elevated BMI are clinically linked to peripheral aromatization of testosterone.'}
                </p>
              </div>

              {/* BMI */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-1">
                  {isAr ? 'مؤشر كتلة الجسم (BMI)' : 'Body Mass Index (BMI)'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="15"
                    max="60"
                    step="0.5"
                    placeholder="e.g. 24.5"
                    value={answers.bmi || ''}
                    onChange={(e) => handleUpdate('bmi', parseFloat(e.target.value) || undefined)}
                    className="w-40 px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">
                    {answers.bmi ? (answers.bmi >= 30 ? '⚠️ Obese' : answers.bmi >= 25 ? 'Overweight' : '✓ Normal') : '(Optional / Skippable)'}
                  </span>
                </div>
              </div>

              {/* Diabetes */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'تاريخ داء السكري' : 'Diabetes Status'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['none', 'prediabetes', 'type2', 'type1'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleUpdate('diabetes', status)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                        answers.diabetes === status
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {status === 'none' ? 'None' : status === 'prediabetes' ? 'Prediabetes' : status === 'type2' ? 'Type 2' : 'Type 1'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hypertension */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'هل تعاني من ارتفاع ضغط الدم المشخص؟' : 'Diagnosed Hypertension'}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdate('hypertension', true)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      answers.hypertension === true
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    {isAr ? 'نعم' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate('hypertension', false)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      answers.hypertension === false
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    {isAr ? 'لا' : 'No'}
                  </button>
                </div>
              </div>

              {/* Trying to Conceive */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-1">
                  {isAr ? 'مدة محاولة الإنجاب (بالأشهر)' : 'Months Trying to Conceive'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="e.g. 12"
                    value={answers.tryingToConceiveMonths ?? ''}
                    onChange={(e) =>
                      handleUpdate(
                        'tryingToConceiveMonths',
                        e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-40 px-3 py-2 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">
                    {(answers.tryingToConceiveMonths ?? 0) >= 12
                      ? '⚠️ >= 12 mo qualifies for andrology evaluation'
                      : '0 if not actively trying'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Lifestyle & Exposures */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-blue-50 pb-3">
                <h3 className="text-lg font-bold text-blue-950">
                  {isAr ? '2. نمط الحياة والعوامل البيئية' : '2. Lifestyle & Environmental Factors'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'التدخين والحرارة المفرطة واستخدام الستيرويدات تؤثر بشكل مباشر على تكوين النطاف وتلف المادة الوراثية (DNA Fragmentation).'
                    : 'Tobacco use, testicular heat exposure, and anabolic steroids significantly affect spermatogenesis.'}
                </p>
              </div>

              {/* Smoking */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'التدخين والتبغ' : 'Tobacco & Smoking'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['never', 'former', 'current'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleUpdate('smoking', status)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                        answers.smoking === status
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {status === 'never' ? 'Never' : status === 'former' ? 'Former Smoker' : 'Active Smoker'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Testicular Heat Exposure */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'التعرض للحرارة (الساونا، الحمامات الساخنة، العمل بحرارة عالية)' : 'Frequent Testicular Heat Exposure'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'occasional', 'frequent'] as const).map((heat) => (
                    <button
                      key={heat}
                      type="button"
                      onClick={() => handleUpdate('heatExposure', heat)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                        answers.heatExposure === heat
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {heat === 'none' ? 'None' : heat === 'occasional' ? 'Occasional' : 'Frequent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anabolic Steroids */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'الستيرويدات البنائية / هرمونات كمال الأجسام' : 'Anabolic-Androgenic Steroids (TRT/Gym enhancers)'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['never', 'past', 'current'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleUpdate('anabolicSteroids', status)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                        answers.anabolicSteroids === status
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {status === 'never' ? 'Never' : status === 'past' ? 'Past Use' : 'Current Use'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medical & Anatomical History */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-blue-50 pb-3">
                <h3 className="text-lg font-bold text-blue-950">
                  {isAr ? '3. التاريخ الجراحي والتشريحي' : '3. Anatomical & Surgical History'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'دوالي الخصية، والخصية الهاجرة، وجراحات الفتق السابقة، وقطع القناة المنوية.'
                    : 'Known varicoceles, history of cryptorchidism, or prior inguinal/scrotal surgeries.'}
                </p>
              </div>

              {/* Varicocele */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'دوالي الخصية (Varicocele)' : 'Varicocele (Scrotal Varicose Veins)'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'known', 'unknown'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleUpdate('varicocele', v)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                        answers.varicocele === v
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {v === 'none' ? 'None' : v === 'known' ? 'Diagnosed Varicocele' : 'Unchecked / Unknown'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Undescended Testis */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'تاريخ الخصية الهاجرة في الصغر (Undescended Testis)' : 'History of Undescended Testis'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'none', label: 'None' },
                      { key: 'unilateral_corrected', label: 'Unilateral (Fixed)' },
                      { key: 'bilateral_corrected', label: 'Bilateral (Fixed)' },
                      { key: 'bilateral_uncorrected', label: 'Bilateral Uncorrected ⚠️' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleUpdate('undescendedTestis', item.key as any)}
                      className={`px-2 py-2 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                        answers.undescendedTestis === item.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prior Vasectomy */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  {isAr ? 'هل خضعت سابقاً لعملية قطع القناة المنوية (Vasectomy)؟' : 'Prior Vasectomy'}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdate('priorVasectomy', true)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      answers.priorVasectomy === true
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    Yes (Prior Vasectomy)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate('priorVasectomy', false)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      answers.priorVasectomy === false
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-blue-100 hover:border-blue-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Closed-Vocabulary Symptoms & Red Flags */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="border-b border-blue-50 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-lg font-bold text-blue-950">
                    {isAr ? '4. الأعراض السريرية وعلامات الأمان الحمراء' : '4. Clinical Symptoms & Safety Red Flags'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'حدد أي أعراض حالية. تؤدي العلامات الحادة إلى تفعيل صمام الأمان الفوري لضمان التدخل الطارئ.'
                    : 'Select any current presentations. Acute red flags trigger the deterministic safety clamp to ensure immediate care.'}
                </p>
              </div>

              {/* Symptoms Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    code: 'acute_scrotal_pain',
                    label: 'Acute scrotal pain (sudden severe pain)',
                    isRedFlag: true,
                  },
                  {
                    code: 'scrotal_swelling',
                    label: 'Scrotal swelling',
                    isRedFlag: false,
                  },
                  {
                    code: 'testicular_lump',
                    label: 'Testicular lump or mass (painless)',
                    isRedFlag: true,
                  },
                  {
                    code: 'prolonged_erection',
                    label: 'Prolonged painful erection (>4 hours)',
                    isRedFlag: true,
                  },
                  {
                    code: 'cannot_pass_urine',
                    label: 'Unable to pass urine (acute retention)',
                    isRedFlag: true,
                  },
                  {
                    code: 'recent_genital_trauma',
                    label: 'Recent genital trauma or injury',
                    isRedFlag: true,
                  },
                  {
                    code: 'fever',
                    label: 'Fever or chills',
                    isRedFlag: false,
                  },
                  {
                    code: 'dysuria',
                    label: 'Pain or burning during urination (dysuria)',
                    isRedFlag: false,
                  },
                  {
                    code: 'urethral_discharge',
                    label: 'Urethral discharge',
                    isRedFlag: false,
                  },
                  {
                    code: 'scrotal_ache',
                    label: 'Gradual scrotal ache (no sudden pain)',
                    isRedFlag: false,
                  },
                  {
                    code: 'visual_field_loss',
                    label: 'Visual field loss or peripheral vision deficit',
                    isRedFlag: true,
                  },
                  {
                    code: 'gynaecomastia',
                    label: 'Gynaecomastia (male breast tissue enlargement)',
                    isRedFlag: false,
                  },
                ].map((item) => {
                  const isChecked = (answers.symptoms || []).includes(item.code as Symptom);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => toggleSymptom(item.code as Symptom)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        isChecked
                          ? item.isRedFlag
                            ? 'bg-red-50 border-red-300 text-red-900'
                            : 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-blue-100 text-slate-700 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isChecked
                              ? item.isRedFlag
                                ? 'bg-red-600 border-red-600 text-white'
                                : 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.isRedFlag && (
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider shrink-0">
                          Red Flag
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* If scrotal pain or swelling is selected, show onset hours */}
              {((answers.symptoms || []).includes('acute_scrotal_pain') ||
                (answers.symptoms || []).includes('scrotal_swelling')) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wide mb-1">
                    Onset Time: How many hours ago did the pain/swelling begin?
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="72"
                      placeholder="e.g. 3"
                      value={answers.painOnsetHours ?? ''}
                      onChange={(e) =>
                        handleUpdate('painOnsetHours', parseInt(e.target.value, 10) || undefined)
                      }
                      className="w-32 px-3 py-1.5 text-sm border border-amber-300 rounded-lg bg-white"
                    />
                    <span className="text-xs text-amber-800">
                      {(answers.painOnsetHours ?? 0) <= 6
                        ? '⚠️ Window <= 6h: High testicular torsion risk'
                        : 'Subacute onset'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-blue-50 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isAr ? 'السابق' : 'Previous'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>{isAr ? 'التالي' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isAr ? 'معالجة الفرز السريري' : 'Execute Clinical Triage'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
