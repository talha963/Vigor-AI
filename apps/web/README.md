# apps/web — chunk 3

Next.js 15 (App Router). Not built yet.

Planned surfaces:

- **Anonymous bilingual intake** (EN/AR, full RTL). No account required. Every
  question skippable; skips are recorded so the result can state its own
  uncertainty.
- **Explainable results.** Domain bands with their drivers, `missingInputs`
  shown plainly, and the screening-not-diagnosis boundary rendered from the
  payload rather than hardcoded.
- **Consent & privacy centre.** The ledger as the user sees it: what is shared,
  with whom, until when, how many times it was opened, and one button that
  triggers the revocation cascade and shows the receipt.
- **Clinician review console.** The `pending_review` queue with its SLA clocks,
  and the override form that enforces the justification requirement.

Contracts it must satisfy: `packages/contracts/events.schema.json`.
