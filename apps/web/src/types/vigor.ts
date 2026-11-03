/**
 * Type definitions matching packages/contracts/events.schema.json
 * and the Vigor clinical safety specifications.
 */

export type Locale = 'en' | 'ar';

export type Tier =
  | 'SELF_CARE'
  | 'PRIMARY_CARE'
  | 'FERTILITY_SERVICES'
  | 'ANDROLOGY_UROLOGY'
  | 'URGENT';

export type RedFlagCode =
  | 'RF_ACUTE_SCROTAL_PAIN'
  | 'RF_TESTICULAR_MASS'
  | 'RF_PRIAPISM'
  | 'RF_GU_TRAUMA'
  | 'RF_ACUTE_URINARY_RETENTION'
  | 'RF_FEBRILE_GU_INFECTION'
  | 'RF_PITUITARY_SUSPICION'
  | 'RF_BILATERAL_UNDESCENDED'
  | 'RF_ABSENT_VAS'
  | 'RF_SEVERE_SEMEN_FINDING'
  | 'RF_SEMEN_BELOW_REF'
  | 'AZOOSPERMIA'
  | 'SEVERE_OLIGOZOOSPERMIA';

export type Symptom =
  | 'acute_scrotal_pain'
  | 'scrotal_swelling'
  | 'scrotal_ache'
  | 'testicular_lump'
  | 'prolonged_erection'
  | 'recent_genital_trauma'
  | 'cannot_pass_urine'
  | 'dysuria'
  | 'urethral_discharge'
  | 'fever'
  | 'visual_field_loss'
  | 'gynaecomastia';

export type ConsentScope =
  | 'ASSESSMENT'
  | 'STORE_RESULTS'
  | 'SHARE_WITH_CLINICIAN'
  | 'SHARE_WITH_FERTILITY_SERVICE'
  | 'AT_HOME_TESTING'
  | 'CONTACT_REMINDERS'
  | 'RESEARCH_AGGREGATE';

export interface IntakeAnswers {
  // Anthropometrics / Metabolic
  bmi?: number;
  waistCm?: number;
  diabetes?: 'none' | 'prediabetes' | 'type1' | 'type2' | 'unknown';
  hba1c?: number;
  hypertension?: boolean;

  // Lifestyle
  smoking?: 'never' | 'former' | 'current';
  packYears?: number;
  alcohol?: 'none' | 'occasional' | 'weekly' | 'daily';
  heatExposure?: 'none' | 'occasional' | 'frequent';
  anabolicSteroids?: 'never' | 'past' | 'current';
  recreationalDrugs?: 'never' | 'past' | 'current';
  sleepHours?: number;
  occupationalExposure?: Array<'heat' | 'solvents' | 'pesticides' | 'heavy_metals' | 'radiation' | 'none'>;

  // Medical / Infectious
  stiHistory?: Array<'none' | 'chlamydia' | 'gonorrhoea' | 'syphilis' | 'other' | 'prefer_not_to_say'>;
  mumpsOrchitis?: boolean;
  currentDischarge?: boolean;

  // Anatomical
  varicocele?: 'none' | 'known' | 'unknown';
  undescendedTestis?: 'none' | 'unilateral_corrected' | 'bilateral_corrected' | 'bilateral_uncorrected' | 'unknown';
  priorHerniaRepair?: boolean;
  testicularTrauma?: boolean;
  absentVas?: boolean;

  // Endocrine & Fertility intent
  libidoChange?: 'normal' | 'reduced' | 'absent';
  erectileFunction?: 'normal' | 'mild_difficulty' | 'significant_difficulty';
  tryingToConceiveMonths?: number;
  priorPaternity?: boolean;
  priorVasectomy?: boolean;

  // Red flags & closed symptoms
  symptoms?: Symptom[];
  painOnsetHours?: number;
}

export interface DomainScore {
  name: string;
  score: number; // 0 to 100
  band: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  drivers: string[];
}

export interface RedFlagResult {
  code: RedFlagCode;
  severity: 'URGENT' | 'SAME_DAY' | 'ROUTINE_REVIEW';
  reason: string;
  slaMinutes: number;
}

export interface TriageResult {
  tier: Tier;
  redFlags: RedFlagResult[];
  domains: DomainScore[];
  overall: {
    score: number;
    band: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
    confidence: number;
  };
  missingInputs: string[];
  clamped: boolean;
  requiresHumanReview: boolean;
  boundary: {
    isDiagnosis: false;
    statement: string;
    statementAr: string;
  };
  recommendedService: string;
  recommendedServiceAr: string;
  actionGuidance: string;
  actionGuidanceAr: string;
}

export interface ConsentLedgerEntry {
  consentId: string;
  pseudonymId: string;
  scopes: ConsentScope[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  grantedAt: string;
  revokedAt?: string;
  receiptSignature?: string;
}
