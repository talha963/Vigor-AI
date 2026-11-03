'use client';

import React, { useState } from 'react';
import {
  Microscope,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FlaskConical,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { Locale } from '@/types/vigor';
import { WHO_2021_REFERENCE_LIMITS } from '@/lib/clinical-engine';

interface WhoStandardsSectionProps {
  locale: Locale;
}

export default function WhoStandardsSection({ locale }: WhoStandardsSectionProps) {
  const isAr = locale === 'ar';

  const [volume, setVolume] = useState<number>(2.5);
  const [concentration, setConcentration] = useState<number>(25);
  const [totalMotility, setTotalMotility] = useState<number>(55);
  const [progressiveMotility, setProgressiveMotility] = useState<number>(38);
  const [normalForms, setNormalForms] = useState<number>(6);
  const [vitality, setVitality] = useState<number>(68);

  const totalSperm = Math.round(volume * concentration * 10) / 10;

  // Evaluation against WHO 2021 6th Edition
  const isVolumeOk = volume >= WHO_2021_REFERENCE_LIMITS.volumeMl;
  const isConcOk = concentration >= WHO_2021_REFERENCE_LIMITS.concentrationMillionPerMl;
  const isTotalOk = totalSperm >= WHO_2021_REFERENCE_LIMITS.totalSpermMillion;
  const isTotalMotOk = totalMotility >= WHO_2021_REFERENCE_LIMITS.totalMotilityPct;
  const isProgMotOk = progressiveMotility >= WHO_2021_REFERENCE_LIMITS.progressiveMotilityPct;
  const isFormsOk = normalForms >= WHO_2021_REFERENCE_LIMITS.normalFormsPct;
  const isVitalityOk = vitality >= WHO_2021_REFERENCE_LIMITS.vitalityPct;

  const isAzoospermia = concentration === 0;
  const isSevereOligo = concentration > 0 && concentration < 5;
  const isAllNormal =
    isVolumeOk && isConcOk && isTotalOk && isTotalMotOk && isProgMotOk && isFormsOk && isVitalityOk;

  // Preset lab cases from golden-cases.json
  const applyLabCase = (caseType: 'normal' | 'azoospermia' | 'severeOligo' | 'suboptimal') => {
    if (caseType === 'normal') {
      setVolume(3.2);
      setConcentration(45);
      setTotalMotility(62);
      setProgressiveMotility(48);
      setNormalForms(7);
      setVitality(75);
    } else if (caseType === 'azoospermia') {
      setVolume(1.8);
      setConcentration(0);
      setTotalMotility(0);
      setProgressiveMotility(0);
      setNormalForms(0);
      setVitality(0);
    } else if (caseType === 'severeOligo') {
      setVolume(1.5);
      setConcentration(2.1);
      setTotalMotility(20);
      setProgressiveMotility(12);
      setNormalForms(2);
      setVitality(35);
    } else {
      setVolume(1.2);
      setConcentration(14);
      setTotalMotility(38);
      setProgressiveMotility(25);
      setNormalForms(3);
      setVitality(50);
    }
  };

  return (
    <section id="who-standards" className="py-20 bg-slate-50/70 border-b border-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Microscope className="w-4 h-4 text-blue-600" />
            <span>{isAr ? 'المعايير الدولية المعتمدة' : 'WHO 2021 (6th Edition) Semen Reference'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight mb-4">
            {isAr ? 'معايير تحليل السائل المنوي المعتمدة' : 'Laboratory Reference Thresholds'}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {isAr
              ? 'تعتمد فيجور الحدود المرجعية الدنيا لمنظمة الصحة العالمية (الإصدار السادس 2021). العينة الواحدة ليست تشخيصاً نهائياً، بل تتطلب إعادة الفحص التأكيدي بعد 6 إلى 12 أسبوعاً.'
              : 'Vigor strictly benchmarks against the 5th centile reference distribution of fertile men established by WHO 2021. A single suboptimal specimen is never a diagnosis—confirmatory sampling is mandatory.'}
          </p>
        </div>

        {/* Interactive Lab Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Sliders & Presets */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-blue-50">
              <div>
                <h3 className="text-lg font-bold text-blue-950">
                  {isAr ? 'محاكي تحليل السائل المنوي التفاعلي' : 'Interactive Semen Analysis Simulator'}
                </h3>
                <p className="text-xs text-slate-600">
                  {isAr ? 'اضبط القيم لفحص تطابقها مع معايير منظمة الصحة' : 'Adjust parameters to test WHO 2021 gating logic'}
                </p>
              </div>

              {/* Lab Case Presets */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => applyLabCase('normal')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                >
                  LC04 Normal
                </button>
                <button
                  onClick={() => applyLabCase('severeOligo')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                >
                  LC02 Severe Oligo
                </button>
                <button
                  onClick={() => applyLabCase('azoospermia')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                >
                  LC01 Azoospermia
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              {/* Volume */}
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-950 mb-1">
                  <span>{isAr ? 'حجم العينة (Volume)' : 'Ejaculate Volume'}</span>
                  <span className={isVolumeOk ? 'text-blue-700' : 'text-amber-600'}>
                    {volume} mL (Ref &ge; {WHO_2021_REFERENCE_LIMITS.volumeMl} mL)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="6.0"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Concentration */}
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-950 mb-1">
                  <span>{isAr ? 'تركيز الحيوانات المنوية (Concentration)' : 'Sperm Concentration'}</span>
                  <span className={isConcOk ? 'text-blue-700' : 'text-red-600'}>
                    {concentration} M/mL (Ref &ge; {WHO_2021_REFERENCE_LIMITS.concentrationMillionPerMl} M/mL)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={concentration}
                  onChange={(e) => setConcentration(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Progressive Motility */}
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-950 mb-1">
                  <span>{isAr ? 'الحركة التقدمية (Progressive Motility)' : 'Progressive Motility (PR)'}</span>
                  <span className={isProgMotOk ? 'text-blue-700' : 'text-amber-600'}>
                    {progressiveMotility}% (Ref &ge; {WHO_2021_REFERENCE_LIMITS.progressiveMotilityPct}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={progressiveMotility}
                  onChange={(e) => setProgressiveMotility(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Total Motility */}
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-950 mb-1">
                  <span>{isAr ? 'الحركة الكلية (Total Motility)' : 'Total Motility (PR + NP)'}</span>
                  <span className={isTotalMotOk ? 'text-blue-700' : 'text-amber-600'}>
                    {totalMotility}% (Ref &ge; {WHO_2021_REFERENCE_LIMITS.totalMotilityPct}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={totalMotility}
                  onChange={(e) => setTotalMotility(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Normal Forms */}
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-950 mb-1">
                  <span>{isAr ? 'الأشكال الطبيعية (Morphology)' : 'Normal Forms (Morphology)'}</span>
                  <span className={isFormsOk ? 'text-blue-700' : 'text-amber-600'}>
                    {normalForms}% (Ref &ge; {WHO_2021_REFERENCE_LIMITS.normalFormsPct}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={normalForms}
                  onChange={(e) => setNormalForms(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Vitality */}
              <div>
                <div className="flex justify-between text-xs font-bold text-blue-950 mb-1">
                  <span>{isAr ? 'نسبة الحيوية (Vitality)' : 'Vitality (Live Spermatozoa)'}</span>
                  <span className={isVitalityOk ? 'text-blue-700' : 'text-amber-600'}>
                    {vitality}% (Ref &ge; {WHO_2021_REFERENCE_LIMITS.vitalityPct}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="95"
                  step="1"
                  value={vitality}
                  onChange={(e) => setVitality(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Right: Live Clinical Evaluation Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-blue-950 uppercase tracking-wide">
                  {isAr ? 'التقييم السريري الفوري' : 'Automated Gate Decision'}
                </h3>
              </div>

              {/* Status Outcome Banner */}
              {isAzoospermia ? (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 mb-6">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>LC01: Azoospermia Detected (0 M/mL)</span>
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    <strong>Invariant Enforced:</strong> Detail is withheld from automated delivery.
                    Direct clinician consultation scheduled. Confirmatory centrifuged pellet exam and
                    endocrine panel (FSH, LH, Total Testosterone) triggered.
                  </p>
                </div>
              ) : isSevereOligo ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-6">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>LC02: Severe Oligozoospermia (&lt; 5 M/mL)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Elevated clinical priority. Karyotype and Y-chromosome microdeletion (AZF) testing
                    recommended. Triage automatically clamped to ANDROLOGY_UROLOGY.
                  </p>
                </div>
              ) : isAllNormal ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 mb-6">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All Parameters Meet WHO 2021 Reference Floor</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Sample parameters fall at or above the 5th percentile of fertile men. Routine
                    wellness optimization recommended.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 mb-6">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-1">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Borderline / Suboptimal Parameters</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    One or more metrics are below the 5th percentile. Under WHO guidelines, spermatogenesis
                    takes ~74 days; lifestyle review and a 10-week repeat test are indicated.
                  </p>
                </div>
              )}

              {/* Calculated Total Sperm */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-blue-50 mb-6">
                <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                  <span>{isAr ? 'إجمالي الحيوانات المنوية المحسوب' : 'Calculated Total Sperm Count'}</span>
                  <span className="font-mono text-[11px] text-blue-600">Volume &times; Conc</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-950">{totalSperm}</span>
                  <span className="text-xs font-semibold text-slate-600">Million per ejaculate</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  WHO reference floor: <strong>39 Million</strong>. Current sample:{' '}
                  <span className={isTotalOk ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {isTotalOk ? 'Above Reference' : 'Below Reference'}
                  </span>
                </p>
              </div>

              {/* Summary Checklist */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-blue-50">
                  <span className="text-slate-600">Volume &ge; 1.4 mL</span>
                  <span className={isVolumeOk ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {isVolumeOk ? 'Pass' : 'Suboptimal'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-blue-50">
                  <span className="text-slate-600">Concentration &ge; 16 M/mL</span>
                  <span className={isConcOk ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {isConcOk ? 'Pass' : 'Suboptimal'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-blue-50">
                  <span className="text-slate-600">Progressive Motility &ge; 30%</span>
                  <span className={isProgMotOk ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {isProgMotOk ? 'Pass' : 'Suboptimal'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-blue-50">
                  <span className="text-slate-600">Normal Forms &ge; 4%</span>
                  <span className={isFormsOk ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                    {isFormsOk ? 'Pass' : 'Suboptimal'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-100 text-[11px] text-slate-600">
              <p>
                <strong>Clinical Guardrail:</strong> Azoospermia triggers withholding of raw numbers from
                automated email/SMS to protect patient mental health. A clinical appointment is required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
