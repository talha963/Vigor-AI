/**
 * Identifier conventions shared by the seeder, the verifier and the smoke test.
 *
 * These must satisfy the patterns in packages/contracts/events.schema.json.
 * `psn_gc01` was the original form and failed the `^psn_[a-z0-9]{6,32}$`
 * pattern, which the schema validation caught - exactly what it is there for.
 */

export const goldenPseudonymId = (caseId) => `psn_golden${caseId.toLowerCase()}`;
export const goldenAssessmentId = (caseId) => `asm_golden${caseId.toLowerCase()}`;
export const goldenConsentId = (caseId) => `cns_golden${caseId.toLowerCase()}`;
