import { ConsentScope, ConsentLedgerEntry } from '@/types/vigor';

export function generatePseudonymId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 12; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `psn_${rand}`;
}

const STORAGE_KEY = 'vigor_consent_state_v1';

export interface StoredConsentState {
  pseudonymId: string;
  consents: ConsentLedgerEntry[];
  revocationReceipts: Array<{
    revokedAt: string;
    receiptId: string;
    pseudonymId: string;
    scopesRevoked: ConsentScope[];
    hashProof: string;
  }>;
}

export function getStoredConsentState(): StoredConsentState {
  if (typeof window === 'undefined') {
    return {
      pseudonymId: 'psn_init_demo',
      consents: [],
      revocationReceipts: [],
    };
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  const initialPsn = generatePseudonymId();
  const initial: StoredConsentState = {
    pseudonymId: initialPsn,
    consents: [
      {
        consentId: `cst_${Math.random().toString(36).substring(2, 10)}`,
        pseudonymId: initialPsn,
        scopes: ['ASSESSMENT', 'STORE_RESULTS'],
        status: 'ACTIVE',
        grantedAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    revocationReceipts: [],
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveStoredConsentState(state: StoredConsentState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function grantConsentScope(scopes: ConsentScope[]): ConsentLedgerEntry {
  const state = getStoredConsentState();
  const newConsent: ConsentLedgerEntry = {
    consentId: `cst_${Math.random().toString(36).substring(2, 10)}`,
    pseudonymId: state.pseudonymId,
    scopes,
    status: 'ACTIVE',
    grantedAt: new Date().toISOString(),
  };

  state.consents.unshift(newConsent);
  saveStoredConsentState(state);
  return newConsent;
}

export function revokeAllConsents(): {
  receiptId: string;
  revokedAt: string;
  scopesRevoked: ConsentScope[];
  hashProof: string;
} {
  const state = getStoredConsentState();
  const allRevokedScopes: ConsentScope[] = [];

  state.consents.forEach(c => {
    if (c.status === 'ACTIVE') {
      c.status = 'REVOKED';
      c.revokedAt = new Date().toISOString();
      allRevokedScopes.push(...c.scopes);
    }
  });

  const receiptId = `rcpt_${Math.random().toString(36).substring(2, 12)}`;
  const now = new Date().toISOString();
  const hashProof = `sha256_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

  const receipt = {
    receiptId,
    revokedAt: now,
    pseudonymId: state.pseudonymId,
    scopesRevoked: Array.from(new Set(allRevokedScopes)),
    hashProof,
  };

  state.revocationReceipts.unshift(receipt);
  saveStoredConsentState(state);

  return receipt;
}
