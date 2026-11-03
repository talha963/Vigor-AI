/**
 * The only way the web app performs a clinical write.
 *
 * Every lifecycle event goes through an n8n webhook, because that is what
 * produces the consent check, the audit record, the escalation and the SLA
 * clock. Calling MongoDB directly would route around all four.
 *
 * Failures are translated into something the UI can act on rather than a raw
 * stack trace, and the internal token never reaches the browser.
 */
import 'server-only';
import { serverEnv } from './env';

export type N8nResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; data: unknown };

const DEFAULT_TIMEOUT_MS = 30_000;

export async function callWorkflow<T = unknown>(
  path: string,
  body: unknown,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<N8nResult<T>> {
  const url = `${serverEnv.n8nBase()}/webhook/${path.replace(/^\//, '')}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
      body: JSON.stringify(body),
      cache: 'no-store',
      // A workflow that stalls mid-execution never responds at all, so an
      // untimed fetch would hang the request thread indefinitely.
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const timedOut = /timeout|abort/i.test(message);
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      error: timedOut
        ? 'The workflow engine did not respond in time.'
        : 'Could not reach the workflow engine.',
      data: { url, message },
    };
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 500) };
  }

  if (!res.ok) {
    // n8n returns 404 for a workflow that exists but is not active, which is a
    // setup problem rather than a user error and deserves its own message.
    const error =
      res.status === 404
        ? `Workflow for /${path} is not active in n8n. Run: npm run stack:reload`
        : (data as { error?: string; message?: string })?.error ??
          (data as { message?: string })?.message ??
          `Workflow returned ${res.status}`;
    return { ok: false, status: res.status, error, data };
  }

  return { ok: true, status: res.status, data: data as T };
}

/** Endpoints that authenticate with the shared internal token. */
export function internalHeaders(kind: 'clinician' | 'lab'): Record<string, string> {
  const token = serverEnv.internalToken();
  return kind === 'clinician'
    ? { 'X-Vigor-Clinician-Key': token }
    : { 'X-Vigor-Lab-Key': token };
}
