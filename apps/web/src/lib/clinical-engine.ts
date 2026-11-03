import { IntakeAnswers, RedFlagResult, Tier, TriageResult, DomainScore } from '@/types/vigor';

export const WHO_2021_REFERENCE_LIMITS = {
  volumeMl: 1.4,
  totalSpermMillion: 39,
  concentrationMillionPerMl: 16,
  totalMotilityPct: 42,
  progressiveMotilityPct: 30,
  normalFormsPct: 4,
  vitalityPct: 54,
};

const TIER_ACUITY: Record<Tier, number> = {
  SELF_CARE: 0,
  PRIMARY_CARE: 1,
  FERTILITY_SERVICES: 2,
  ANDROLOGY_UROLOGY: 3,
  URGENT: 4,
};

export function escalateOnly(current: Tier, proposed: Tier): Tier {
  return (TIER_ACUITY[proposed] ?? -1) > (TIER_ACUITY[current] ?? -1) ? proposed : current;
}

/**
 * 9 Deterministic Red-Flag Gates
 * Matches exact logic in n8n/src/shared.mjs and docs/06-clinical-safety.md
 */
export function runRedFlagGate(answers: IntakeAnswers): RedFlagResult[] {
  const flags: RedFlagResult[] = [];
  const s = answers.symptoms || [];

  // 1. Acute scrotal pain (torsion window <= 6h)
  if (
    s.includes('acute_scrotal_pain') ||
    (s.includes('scrotal_swelling') && answers.painOnsetHours != null && answers.painOnsetHours <= 6)
  ) {
    flags.push({
      code: 'RF_ACUTE_SCROTAL_PAIN',
      severity: 'URGENT',
      slaMinutes: 60,
      reason: 'Acute scrotal pain or swelling of sudden onset. Testicular torsion must be excluded immediately within hours.',
    });
  }

  // 2. Testicular mass
  if (s.includes('testicular_lump')) {
    flags.push({
      code: 'RF_TESTICULAR_MASS',
      severity: 'URGENT',
      slaMinutes: 60,
      reason: 'A testicular lump requires urgent evaluation to rule out malignancy.',
    });
  }

  // 3. Priapism
  if (s.includes('prolonged_erection')) {
    flags.push({
      code: 'RF_PRIAPISM',
      severity: 'URGENT',
      slaMinutes: 60,
      reason: 'A prolonged painful erection is a medical emergency requiring immediate decompression.',
    });
  }

  // 4. Genital trauma
  if (s.includes('recent_genital_trauma')) {
    flags.push({
      code: 'RF_GU_TRAUMA',
      severity: 'URGENT',
      slaMinutes: 60,
      reason: 'Recent significant genital trauma requires urgent imaging and physical assessment.',
    });
  }

  // 5. Acute urinary retention
  if (s.includes('cannot_pass_urine')) {
    flags.push({
      code: 'RF_ACUTE_URINARY_RETENTION',
      severity: 'URGENT',
      slaMinutes: 60,
      reason: 'Inability to pass urine requires urgent bladder drainage and investigation.',
    });
  }

  // 6. Febrile GU infection
  if (
    s.includes('fever') &&
    (s.includes('dysuria') || s.includes('urethral_discharge') || s.includes('scrotal_ache'))
  ) {
    flags.push({
      code: 'RF_FEBRILE_GU_INFECTION',
      severity: 'SAME_DAY',
      slaMinutes: 480,
      reason: 'Fever with urinary or genital symptoms suggests acute epididymo-orchitis or prostatitis needing same-day care.',
    });
  }

  // 7. Pituitary suspicion
  if (
    s.includes('visual_field_loss') &&
    (s.includes('gynaecomastia') || answers.libidoChange === 'absent')
  ) {
    flags.push({
      code: 'RF_PITUITARY_SUSPICION',
      severity: 'SAME_DAY',
      slaMinutes: 480,
      reason: 'Visual field disturbance with endocrine or prolactin signs raises suspicion of a sellar/pituitary lesion.',
    });
  }

  // 8. Bilateral uncorrected undescended testes
  if (answers.undescendedTestis === 'bilateral_uncorrected') {
    flags.push({
      code: 'RF_BILATERAL_UNDESCENDED',
      severity: 'ROUTINE_REVIEW',
      slaMinutes: 2880,
      reason: 'Uncorrected bilateral undescended testes require formal andrology examination and imaging.',
    });
  }

  // 9. Absent vas deferens
  if (answers.absentVas === true) {
    flags.push({
      code: 'RF_ABSENT_VAS',
      severity: 'ROUTINE_REVIEW',
      slaMinutes: 2880,
      reason: 'Congenital bilateral absence of the vas deferens (CBAVD) warrants CFTR genetic screening.',
    });
  }

  return flags;
}

/**
 * Domain scoring and risk estimation across 5 clinical vectors
 */
export function evaluateDomainScores(answers: IntakeAnswers): {
  domains: DomainScore[];
  overall: { score: number; band: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH'; confidence: number };
  missingInputs: string[];
} {
  const missingInputs: string[] = [];

  // 1. Metabolic
  let metabolicScore = 10;
  const metabolicDrivers: string[] = [];
  if (answers.bmi != null) {
    if (answers.bmi >= 30) {
      metabolicScore += 35;
      metabolicDrivers.push(`Elevated BMI (${answers.bmi}) linked to hyperestrogenism`);
    } else if (answers.bmi >= 25) {
      metabolicScore += 15;
      metabolicDrivers.push(`Overweight BMI (${answers.bmi})`);
    }
  } else {
    missingInputs.push('BMI / Height & Weight');
  }

  if (answers.diabetes && answers.diabetes !== 'none') {
    metabolicScore += answers.diabetes === 'type2' ? 30 : 25;
    metabolicDrivers.push(`History of ${answers.diabetes}`);
  }
  if (answers.hypertension) {
    metabolicScore += 15;
    metabolicDrivers.push('Hypertension');
  }

  // 2. Lifestyle & Environmental
  let lifestyleScore = 10;
  const lifestyleDrivers: string[] = [];
  if (answers.smoking === 'current') {
    lifestyleScore += 30;
    lifestyleDrivers.push('Active tobacco use (increased sperm DNA fragmentation)');
  } else if (answers.smoking === 'former') {
    lifestyleScore += 10;
  }

  if (answers.alcohol === 'daily') {
    lifestyleScore += 20;
    lifestyleDrivers.push('Frequent alcohol consumption');
  }
  if (answers.heatExposure === 'frequent') {
    lifestyleScore += 25;
    lifestyleDrivers.push('Frequent testicular heat exposure (saunas/hot baths/hot work)');
  }
  if (answers.anabolicSteroids === 'current') {
    lifestyleScore += 45;
    lifestyleDrivers.push('Current anabolic-androgenic steroid use (suppresses HPG axis / spermatogenesis)');
  } else if (answers.anabolicSteroids === 'past') {
    lifestyleScore += 20;
    lifestyleDrivers.push('Prior steroid use (potential delayed recovery)');
  }

  // 3. Infectious / Inflammatory
  let infectiousScore = 5;
  const infectiousDrivers: string[] = [];
  if (answers.mumpsOrchitis) {
    infectiousScore += 35;
    infectiousDrivers.push('Post-pubertal mumps orchitis (germ cell vulnerability)');
  }
  if (answers.stiHistory && answers.stiHistory.length > 0 && !answers.stiHistory.includes('none')) {
    infectiousScore += 25;
    infectiousDrivers.push(`STI history (${answers.stiHistory.join(', ')})`);
  }
  if (answers.currentDischarge) {
    infectiousScore += 30;
    infectiousDrivers.push('Active urethral discharge');
  }

  // 4. Anatomical
  let anatomicalScore = 10;
  const anatomicalDrivers: string[] = [];
  if (answers.varicocele === 'known') {
    anatomicalScore += 40;
    anatomicalDrivers.push('Known varicocele (thermal and oxidative stress)');
  }
  if (answers.undescendedTestis && answers.undescendedTestis !== 'none') {
    anatomicalScore += 35;
    anatomicalDrivers.push(`Cryptorchidism history (${answers.undescendedTestis.replace('_', ' ')})`);
  }
  if (answers.priorHerniaRepair) {
    anatomicalScore += 15;
    anatomicalDrivers.push('Prior inguinal hernia repair');
  }
  if (answers.priorVasectomy) {
    anatomicalScore += 50;
    anatomicalDrivers.push('Prior vasectomy with fertility intent');
  }

  // 5. Endocrine / Functional
  let endocrineScore = 10;
  const endocrineDrivers: string[] = [];
  if (answers.libidoChange === 'absent') {
    endocrineScore += 35;
    endocrineDrivers.push('Marked loss of libido');
  } else if (answers.libidoChange === 'reduced') {
    endocrineScore += 15;
    endocrineDrivers.push('Reduced libido');
  }
  if (answers.erectileFunction === 'significant_difficulty') {
    endocrineScore += 25;
    endocrineDrivers.push('Significant erectile difficulty');
  }

  const domains: DomainScore[] = [
    {
      name: 'Metabolic Health',
      score: Math.min(100, metabolicScore),
      band: getBand(metabolicScore),
      drivers: metabolicDrivers.length > 0 ? metabolicDrivers : ['No significant metabolic risk factors noted'],
    },
    {
      name: 'Lifestyle & Environment',
      score: Math.min(100, lifestyleScore),
      band: getBand(lifestyleScore),
      drivers: lifestyleDrivers.length > 0 ? lifestyleDrivers : ['Lifestyle indicators within low-risk parameters'],
    },
    {
      name: 'Infectious & History',
      score: Math.min(100, infectiousScore),
      band: getBand(infectiousScore),
      drivers: infectiousDrivers.length > 0 ? infectiousDrivers : ['No prior genital infections or orchitis reported'],
    },
    {
      name: 'Anatomical Factors',
      score: Math.min(100, anatomicalScore),
      band: getBand(anatomicalScore),
      drivers: anatomicalDrivers.length > 0 ? anatomicalDrivers : ['No known anatomical anomalies reported'],
    },
    {
      name: 'Endocrine & Hormonal',
      score: Math.min(100, endocrineScore),
      band: getBand(endocrineScore),
      drivers: endocrineDrivers.length > 0 ? endocrineDrivers : ['Hormonal indicators reported as normal'],
    },
  ];

  const overallScore = Math.round(
    domains.reduce((acc, d) => acc + d.score, 0) / domains.length
  );

  // Confidence calculation based on skipped/missing inputs
  const totalTrackedFields = 14;
  const answeredFields = totalTrackedFields - missingInputs.length;
  const confidence = Math.max(0.55, Math.min(0.98, answeredFields / totalTrackedFields));

  return {
    domains,
    overall: {
      score: overallScore,
      band: getBand(overallScore),
      confidence,
    },
    missingInputs,
  };
}

function getBand(score: number): 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MODERATE';
  if (score < 75) return 'ELEVATED';
  return 'HIGH';
}

/**
 * Full deterministic intake reconciliation
 */
export function reconcileIntake(answers: IntakeAnswers): TriageResult {
  const redFlags = runRedFlagGate(answers);
  const { domains, overall, missingInputs } = evaluateDomainScores(answers);

  let proposedTier: Tier = 'SELF_CARE';
  let recommendedService = 'Preventive Lifestyle & Education Module';
  let recommendedServiceAr = 'برنامج نمط الحياة الوقائي والتثقيف الصحي';
  let actionGuidance = 'Maintain optimal metabolic health, avoid excessive testicular heat, and re-screen in 6 months.';
  let actionGuidanceAr = 'حافظ على صحة التمثيل الغذائي المثالية، وتجنب التعرض المفرط للحرارة، وأعد الفحص خلال 6 أشهر.';

  // Trying to conceive duration checks
  if (answers.tryingToConceiveMonths != null) {
    if (answers.tryingToConceiveMonths >= 12) {
      proposedTier = 'ANDROLOGY_UROLOGY';
      recommendedService = 'Specialist Male Reproductive Clinic (Andrology/Urology)';
      recommendedServiceAr = 'عيادة المسالك البولية وطب الذكورة التخصصية';
      actionGuidance = 'Couples trying to conceive for 12+ months qualify for a comprehensive semen analysis and male factor workup.';
      actionGuidanceAr = 'الأزواج الذين يحاولون الإنجاب لأكثر من 12 شهرًا مؤهلون لإجراء تحليل شامل للسائل المنوي وتقييم عامل الذكورة.';
    } else if (answers.tryingToConceiveMonths > 0) {
      proposedTier = 'PRIMARY_CARE';
      recommendedService = 'Primary Care Reproductive Pre-conception Check';
      recommendedServiceAr = 'فحص ما قبل الحمل لدى طبيب الأسرة / الرعاية الأولية';
      actionGuidance = 'You are in the early preconception window. Optimize lifestyle factors and consider baseline semen health.';
      actionGuidanceAr = 'أنت في مرحلة التخطيط المبكرة للإنجاب. ينصح بتحسين عوامل نمط الحياة والنظر في فحص صحة الخصوبة الأساسي.';
    }
  }

  // Prior vasectomy seeking conception -> Fertility / Microsurgery
  if (answers.priorVasectomy) {
    proposedTier = 'FERTILITY_SERVICES';
    recommendedService = 'Microsurgical Reversal or Sperm Retrieval (IVF/ICSI)';
    recommendedServiceAr = 'جراحة مجهرية لاستعادة القنوات أو سحب الحيوانات المنوية';
    actionGuidance = 'Specialist reproductive microsurgery consultation is recommended for post-vasectomy family planning.';
    actionGuidanceAr = 'يوصى باستشارة تخصصية في الجراحة المجهرية لإعادة التوصيل بعد قطع القناة المنوية.';
  }

  // Elevated domain scores bump to Primary Care or Andrology
  if (overall.band === 'HIGH' || domains.some(d => d.band === 'HIGH')) {
    proposedTier = escalateOnly(proposedTier, 'ANDROLOGY_UROLOGY');
    recommendedService = 'Specialist Andrology / Male Reproductive Endocrinology';
    recommendedServiceAr = 'استشارة تخصصية في طب الذكورة والغدد الصماء التناسلية';
  } else if (overall.band === 'ELEVATED') {
    proposedTier = escalateOnly(proposedTier, 'PRIMARY_CARE');
  }

  // NON-NEGOTIABLE SAFETY CLAMP:
  // If ANY red flag fired, clamp upward to emergency tier!
  let clamped = false;
  let finalTier = proposedTier;

  const urgentFlag = redFlags.find(f => f.severity === 'URGENT');
  const sameDayFlag = redFlags.find(f => f.severity === 'SAME_DAY');
  const routineReviewFlag = redFlags.find(f => f.severity === 'ROUTINE_REVIEW');

  if (urgentFlag || sameDayFlag) {
    finalTier = 'URGENT';
    clamped = true;
    recommendedService = 'Urgent Care / Emergency Urology Department';
    recommendedServiceAr = 'قسم الطوارئ أو الرعاية العاجلة لجراحة المسالك البولية';
    actionGuidance = `EMERGENCY ALERT: ${urgentFlag?.reason || sameDayFlag?.reason} Seek immediate clinical evaluation (SLA: ${urgentFlag?.slaMinutes || 60} minutes).`;
    actionGuidanceAr = `تنبيه عاجل: ${urgentFlag?.reason || sameDayFlag?.reason} توجه فوراً للتقييم السريري الطارئ.`;
  } else if (routineReviewFlag) {
    finalTier = escalateOnly(finalTier, 'ANDROLOGY_UROLOGY');
    if (finalTier !== proposedTier) clamped = true;
    recommendedService = 'Dedicated Andrology Specialist Referral';
    recommendedServiceAr = 'تحويل مباشر إلى أخصائي طب الذكورة المعتمد';
    actionGuidance = `Red-flag flag noted: ${routineReviewFlag.reason}. Priority specialist review recommended.`;
    actionGuidanceAr = `تم رصد مؤشر ذو أولوية: ${routineReviewFlag.reason}. يوصى بمراجعة أخصائي معتمد.`;
  }

  const requiresHumanReview = finalTier === 'URGENT' || clamped || overall.band === 'HIGH';

  return {
    tier: finalTier,
    redFlags,
    domains,
    overall,
    missingInputs,
    clamped,
    requiresHumanReview,
    boundary: {
      isDiagnosis: false,
      statement: 'Vigor is an early risk-identification and routing platform, not a diagnostic medical service. All findings must be confirmed by a licensed physician.',
      statementAr: 'منصة فيجور هي أداة رقمية للفرز المبدئي وتحديد المخاطر وتوجيه الرعاية، وليست تشخيصاً طبياً نهائياً. يجب تأكيد جميع النتائج من قبل طبيب مرخص.',
    },
    recommendedService,
    recommendedServiceAr,
    actionGuidance,
    actionGuidanceAr,
  };
}
