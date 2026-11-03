/**
 * DISPLAY-ONLY clinical reference values.
 *
 * Nothing here decides anything. The authoritative red-flag gate and the
 * thresholds that drive routing live in `n8n/src/shared.mjs` and run on the
 * server; these constants exist solely so the UI can *explain* what the system
 * uses.
 *
 * That distinction matters: an earlier version of this app shipped a full
 * TypeScript reimplementation of the gate and scored people in the browser,
 * which meant a tampered client could talk itself into a lower tier, and gave
 * the project three copies of the catalogue that could silently drift.
 *
 * `tools/verify-contracts.js` asserts that the numbers below still match
 * `shared.mjs`, so the explanation cannot drift from the behaviour.
 */

export const WHO_2021_LOWER_LIMITS = {
  volumeMl: 1.4,
  totalSpermMillion: 39,
  concentrationMillionPerMl: 16,
  totalMotilityPct: 42,
  progressiveMotilityPct: 30,
  normalFormsPct: 4,
  vitalityPct: 54,
} as const;

export const WHO_REFERENCE_VERSION = 'WHO-2021-6th';

export type TierName =
  | 'SELF_CARE'
  | 'PRIMARY_CARE'
  | 'FERTILITY_SERVICES'
  | 'ANDROLOGY_UROLOGY'
  | 'URGENT';

/** Ordered by clinical acuity, matching the escalate-only clamp on the server. */
export const TIER_ORDER: TierName[] = [
  'SELF_CARE',
  'PRIMARY_CARE',
  'FERTILITY_SERVICES',
  'ANDROLOGY_UROLOGY',
  'URGENT',
];

export const TIER_COPY: Record<TierName, { en: string; ar: string; tone: 'positive' | 'info' | 'caution' | 'urgent' }> = {
  SELF_CARE: {
    en: 'Nothing that needs a clinic right now',
    ar: 'لا يوجد ما يستدعي زيارة العيادة الآن',
    tone: 'positive',
  },
  PRIMARY_CARE: {
    en: 'Worth a routine GP appointment',
    ar: 'يستحسن حجز موعد اعتيادي مع طبيب عام',
    tone: 'info',
  },
  FERTILITY_SERVICES: {
    en: 'A fertility service is the right place to start',
    ar: 'خدمة الخصوبة هي المكان المناسب للبدء',
    tone: 'info',
  },
  ANDROLOGY_UROLOGY: {
    en: 'A specialist should take a closer look',
    ar: 'يُفضّل أن يقوم أخصائي بفحص أدق',
    tone: 'caution',
  },
  URGENT: {
    en: 'Please get seen today',
    ar: 'يرجى الحصول على تقييم طبي اليوم',
    tone: 'urgent',
  },
};

/** Plain-language names for the codes the server may return. */
export const RED_FLAG_COPY: Record<string, { en: string; ar: string }> = {
  RF_ACUTE_SCROTAL_PAIN: { en: 'Sudden testicular pain', ar: 'ألم مفاجئ في الخصية' },
  RF_TESTICULAR_MASS: { en: 'A lump that needs checking', ar: 'كتلة تحتاج إلى فحص' },
  RF_PRIAPISM: { en: 'A prolonged erection', ar: 'انتصاب مُطوّل' },
  RF_GU_TRAUMA: { en: 'Recent injury', ar: 'إصابة حديثة' },
  RF_ACUTE_URINARY_RETENTION: { en: 'Unable to pass urine', ar: 'عدم القدرة على التبول' },
  RF_FEBRILE_GU_INFECTION: { en: 'Fever with urinary symptoms', ar: 'حمى مع أعراض بولية' },
  RF_PITUITARY_SUSPICION: { en: 'Vision change with hormonal symptoms', ar: 'تغير في الرؤية مع أعراض هرمونية' },
  RF_BILATERAL_UNDESCENDED: { en: 'Undescended testes', ar: 'خصيتان غير نازلتين' },
  RF_ABSENT_VAS: { en: 'Absent vas deferens', ar: 'غياب الأسهر' },
  AZOOSPERMIA: { en: 'No measurable sperm in the sample', ar: 'لا توجد حيوانات منوية قابلة للقياس' },
  SEVERE_OLIGOZOOSPERMIA: { en: 'Very low sperm concentration', ar: 'تركيز منخفض جداً للحيوانات المنوية' },
};

export const DOMAIN_COPY: Record<string, { en: string; ar: string }> = {
  metabolic: { en: 'Metabolic', ar: 'الأيض' },
  lifestyle: { en: 'Lifestyle', ar: 'نمط الحياة' },
  infectious: { en: 'Infection history', ar: 'تاريخ العدوى' },
  anatomical: { en: 'Anatomy', ar: 'التشريح' },
  endocrine: { en: 'Hormonal', ar: 'الهرمونات' },
  semen: { en: 'Semen analysis', ar: 'تحليل السائل المنوي' },
};
