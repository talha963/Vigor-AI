# Vigor — Privacy by design

Reproductive data is among the most socially consequential data a man can
disclose. In a context where family formation carries religious and social
weight, a leak is not an inconvenience — it can affect a marriage, a reputation
or an employment prospect. So privacy here is not a settings page. It is the
shape of the system.

This document states what the system does, and equally what it refuses to do.

---

## 1. Anonymous by default

A man can complete a full assessment and receive a tier, an explanation and a
next step **without creating an account and without giving a name, a phone
number or an Emirates ID.**

- `pseudonymId` is `HMAC(deviceSeed, VIGOR_PSEUDONYM_SALT)`. The salt lives in
  the environment, not the database, so a database dump cannot be reversed into
  device identifiers.
- `subjects.accountLinked` stays `false` until the user explicitly signs up.
  Signing up adds a way to reach them; it does not unlock anything clinical.
- Age is stored as a band (`25-29`), never a date of birth. Geography is stored
  as an emirate, never an address.

An account is only genuinely needed for three things: receiving a result later,
ordering a kit to a physical place, and being contacted about an escalation. The
app asks at the point each of those becomes relevant, and not before.

## 2. Consent is a ledger, not a flag

`consents` is append-only. Nothing in it is ever edited.

| Scope | Authorises |
| --- | --- |
| `ASSESSMENT` | processing the intake at all |
| `STORE_RESULTS` | keeping the risk score and any lab result |
| `SHARE_WITH_CLINICIAN` | sending a risk summary to primary care, andrology or urology |
| `SHARE_WITH_FERTILITY_SERVICE` | sending a risk summary to a fertility service |
| `AT_HOME_TESTING` | ordering a collection kit and receiving a lab result |
| `CONTACT_REMINDERS` | any non-safety-critical outbound message |
| `RESEARCH_AGGREGATE` | inclusion in aggregate statistics |

Design choices worth stating plainly:

- **Fertility sharing is its own scope.** Sharing reproductive data with a
  urologist and sharing it with a fertility clinic are materially different
  decisions, and the second one carries an implication about family intent that
  we must not make on the user's behalf.
- **Every scope expires.** `expiresAt` is always set. Dormant consent is not
  consent.
- **A revocation is a new row.** Workflow 07 inserts a `granted: false` entry
  and stamps `revokedAt` on the live ones. The history of what someone agreed
  to, and when, survives intact — which is exactly what you need when asked to
  prove that a particular share was authorised.
- **Consent is checked at the moment of use.** Workflows 01, 03 and 04 read the
  ledger on every run. The gate (`evaluateConsent` in
  [`n8n/src/shared.mjs`](../n8n/src/shared.mjs)) treats expired, revoked and
  superseded all as "not authorised".

## 3. Data minimisation, including from clinicians

What a referred facility actually receives:

```json
{
  "referralId": "ref_...",
  "urgency": "routine",
  "riskSummary": { "tier": "ANDROLOGY_UROLOGY",
                   "redFlags": [], "scoreRef": "scr_..." },
  "patientRef": "psn_...",
  "preferences": { "language": "ar", "maleClinician": true, "teleconsult": true },
  "shareToken": "shr_...",
  "shareTokenExpiresAt": "..."
}
```

Not included: any answer value, the free-text field, contact details, or the full
driver list. The facility holds a token; clinical detail is retrieved by the
clinician in a session, where the access is logged and counted.

The same restraint applies to the on-call clinician alert in workflow 02: it
carries red-flag codes, their reasons and a review link. Not the questionnaire.

And to the audit log. `audit_log.meta` records *that* something happened and
with what tier and which codes, never what the person said. This is enforced by
a MongoDB schema validator in
[`tools/mongo-bootstrap.js`](../tools/mongo-bootstrap.js), so a buggy workflow
cannot turn the audit trail into a second copy of the clinical record.

## 4. Share tokens: scoped, expiring, revocable, counted

```js
shareToken: {
  token: "shr_...",
  expiresAt: "<14 days>",
  scope: ["risk_summary", "red_flags", "tier"],
  revokedAt: null,
  accessCount: 0
}
```

- **Scoped** — the token names what it unlocks. It is not a session.
- **Expiring** — 14 days by default. A facility that needs longer asks the user
  again.
- **Revocable** — workflow 07 replaces the token object wholesale, so no stale
  expiry survives, and workflow 03 then rejects it with a 401. The smoke test
  asserts exactly this: the token works, the user revokes, the token fails.
- **Counted** — `accessCount` is shown to the user. Being able to see that a
  clinic opened your summary three times is a different relationship with a
  service than being told it is "secure".

## 5. Application-level field encryption

MongoDB Atlas has no row-level security, so protections that would live in
Postgres RLS live in the application instead:

- Contact details (`subjects.contact.emailEnc`, `phoneEnc`) and the free-text
  answer (`assessments.answers.freeTextEnc`) are encrypted with AES-256-GCM
  using `VIGOR_FIELD_KEY` before they are written. The format is
  `v1:gcm:<iv>:<ciphertext>:<tag>`, versioned so the key can be rotated.
- The key is never in the database and never in a workflow. A dump of the
  cluster yields bands, codes and ciphertext.
- Atlas database users are scoped to the `vigor` database only.
- Clinical collections are keyed on `pseudonymId`, so the join that would
  re-identify someone requires `subjects` *and* the field key.

**Stated honestly:** this is weaker than per-row database enforcement. A
compromised application credential can read every clinical row. Production
should add Atlas Queryable Encryption for the contact fields and put the
clinician-facing read path behind a service that enforces per-subject access
rules. That is written down here rather than left implied.

## 6. Revocation actually cascades

The promise "you can withdraw at any time" is worth nothing if withdrawing
leaves a share token live in a clinic inbox and a reminder queued for Tuesday.
Workflow 07 does, in order:

1. writes append-only revocation entries for each scope
2. stamps `revokedAt` on every live consent in those scopes
3. revokes every outstanding share token — facility callbacks begin failing
4. sets `remindersStopped` on open kit orders and `nudgeStopped` on unfinished
   assessments
5. on explicit request, deletes contact details and nulls stored answers while
   keeping the assessment row, so counts and fairness metrics survive erasure
6. issues a receipt and audits every step

The receipt is specific and checkable:

> 5 consents withdrawn · 2 active data shares revoked — any clinic link now
> fails · 1 kit reminder schedule stopped · 1 unfinished check will no longer be
> followed up

Vague reassurance is what erodes trust in exactly this kind of service. A count
the user can verify does the opposite.

**Withdrawing consent does not delete results.** Erasure is a separate,
explicit ask (`eraseData: true`), because someone who stops sharing may still
want their own history.

## 7. Outbound communication discipline

| Rule | Where it lives |
| --- | --- |
| Subject lines never mention the topic | `DISCREET_SUBJECT` in `shared.mjs` |
| Quiet hours (21:00–08:00) suppress, not queue | workflow 06 checks before querying |
| Max 2 nudges per assessment, 72h apart | workflow 06 |
| One opt-out stops everything, permanently | `nudgeStopped`, `remindersStopped` |
| Nudges never reveal what the assessment was about | `revealsTopic: false`, asserted in the copy |
| Severe lab findings are never delivered by notification | workflow 05, `withholdsDetail` |

A suppressed message is written to `notifications` with
`status: "suppressed_quiet_hours"` or `"suppressed_no_consent"` rather than
silently dropped, and workflow 08 reports the count. Suppression you cannot
measure is indistinguishable from a bug.

### The one documented exception

Safety-critical templates — `urgent_care_instructions` and
`escalation_sla_breach` — ignore quiet hours and the `CONTACT_REMINDERS` scope.
Withholding "go to an emergency department now" because it is 22:00, or because
someone opted out of reminders, would be indefensible. Those notifications carry
`safetyCritical: true`, `consentOverrideBasis: "vital_interests"` and
`quietHoursOverridden`, so every instance of the exception is visible in the
record. The exception is written down here, in the contract, and on the data —
not buried in a Code node.

## 8. Cultural and religious design requirements

These are functional requirements with code behind them, not copy guidelines.

- **Full Arabic parity.** Every user-facing string in the workflows exists in
  both `ar` and `en`, including urgent guidance and the revocation receipt. The
  fairness slice in workflow 08 reports completion rate by locale, so a worse
  Arabic experience shows up as a number.
- **No assumptions about family intent.** Golden case GC12 exists specifically
  to assert this: metabolic reproductive risk found in a man who is not trying
  to conceive routes to primary care and says nothing about family plans.
- **Male clinician availability and language are matching criteria**, scored in
  workflow 03 alongside wait time. For this cohort these are access barriers,
  not preferences.
- **Locker and pickup-point delivery are first-class choices** for at-home kits,
  defaulted to over home delivery, because for many users a locker is the least
  exposing option. Packaging is plain, with no clinical markings and no sender
  name, and `discreetPackaging: true` is on the order rather than being an
  operational hope.
- **Skipping is always allowed.** `skippedSensitive` records what was skipped so
  the result can state its own uncertainty, rather than the intake refusing to
  continue.
- **Neutral clinical register throughout.** No euphemism, no moralising, no
  imagery.

## 9. What we do not do

- We do not require an account to be assessed.
- We do not share anything without a named, live, scoped consent record.
- We do not send clinical content in a notification subject line or preview.
- We do not put personal data in a URL or query string.
- We do not audit answer values.
- We do not let a model lower a clinical tier.
- We do not deliver a severe semen-analysis result without a clinician.
- We do not use reproductive data for advertising, scoring, or any purpose
  outside the scopes listed above, and `RESEARCH_AGGREGATE` is opt-in and
  separate.
