/**
 * n8n workflow construction kit.
 *
 * Hand-maintaining n8n export JSON is unreviewable: the JavaScript inside Code
 * nodes becomes a single escaped string, so a diff tells you nothing. Instead the
 * workflows are declared in `n8n/src/w*.mjs` using the factories below, and
 * `node n8n/build.mjs` emits import-ready JSON into `n8n/workflows/`.
 *
 * Positions are declared as [column, row] on a grid and converted to canvas
 * coordinates, so inserting a node never reshuffles a hundred magic numbers.
 */

const COL = 240;
const ROW = 170;
const ORIGIN = [-180, -40];

/** Deterministic UUIDv4-shaped id, so rebuilding a workflow yields a stable diff. */
export function stableId(seed) {
  // FNV-1a, expanded to 32 hex characters by re-hashing with a counter.
  const fnv = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  };
  const hex = (fnv(seed) + fnv(seed + "#1") + fnv(seed + "#2") + fnv(seed + "#3")).slice(0, 32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "4" + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

function position(pos) {
  const [col, row] = pos ?? [0, 0];
  return [ORIGIN[0] + col * COL, ORIGIN[1] + row * ROW];
}

function baseNode(name, type, typeVersion, parameters, opts = {}) {
  const node = {
    parameters,
    id: stableId(name + "|" + type),
    name,
    type,
    typeVersion,
    position: position(opts.pos),
  };
  if (opts.notes) node.notes = opts.notes;
  if (opts.notes) node.notesInFlow = opts.notesInFlow ?? false;
  if (opts.onError) node.onError = opts.onError;
  if (opts.retry) {
    node.retryOnFail = true;
    node.maxTries = opts.retry.tries ?? 3;
    node.waitBetweenTries = opts.retry.waitMs ?? 2000;
  }
  if (opts.alwaysOutputData) node.alwaysOutputData = true;
  // An n8n node runs ONCE PER INPUT ITEM. For a read whose query does not
  // depend on the incoming item, that is a combinatorial explosion as soon as
  // an upstream node emits more than one item. executeOnce pins it to a single
  // run. See the chained reads in w08.
  if (opts.executeOnce) node.executeOnce = true;
  if (opts.credentials) node.credentials = opts.credentials;
  if (opts.webhookId) node.webhookId = opts.webhookId;
  return node;
}

/* ------------------------------------------------------------------ triggers */

export function webhook(name, { path, method = "POST", pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.webhook",
    2,
    {
      httpMethod: method,
      path,
      responseMode: "responseNode",
      options: {},
    },
    { pos, notes, webhookId: stableId("webhook|" + path) },
  );
}

export function schedule(name, { cron, pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.scheduleTrigger",
    1.2,
    { rule: { interval: [{ field: "cronExpression", expression: cron }] } },
    { pos, notes },
  );
}

/* --------------------------------------------------------------------- logic */

export function code(name, { js, mode = "all", pos, notes, onError }) {
  return baseNode(
    name,
    "n8n-nodes-base.code",
    2,
    {
      mode: mode === "each" ? "runOnceForEachItem" : "runOnceForAllItems",
      language: "javaScript",
      jsCode: js.trim(),
    },
    { pos, notes, onError },
  );
}

const conditionOptions = {
  caseSensitive: true,
  leftValue: "",
  typeValidation: "loose",
  version: 2,
};

/**
 * `cond` builds a single condition. `op` is a short form such as
 * "boolean:true", "string:equals", "number:gte", "array:contains",
 * "string:exists", "object:notEmpty".
 */
export function cond(left, op, right = "") {
  const [type, operation] = op.split(":");
  const singleValue = ["true", "false", "exists", "notExists", "empty", "notEmpty"].includes(
    operation,
  );
  const operator = { type, operation };
  if (singleValue) operator.singleValue = true;
  const c = { id: stableId(`${left}|${op}|${right}`), leftValue: left, operator };
  c.rightValue = singleValue ? "" : right;
  return c;
}

export function ifNode(name, { when, combinator = "and", pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.if",
    2.2,
    {
      conditions: { options: conditionOptions, conditions: when, combinator },
      looseTypeValidation: true,
      options: {},
    },
    { pos, notes },
  );
}

/** `routes` is [{ key, when, combinator? }]; a renamed fallback output is appended. */
export function switchNode(name, { routes, fallback = "other", pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.switch",
    3.2,
    {
      rules: {
        values: routes.map((r) => ({
          conditions: {
            options: conditionOptions,
            conditions: r.when,
            combinator: r.combinator ?? "and",
          },
          renameOutput: true,
          outputKey: r.key,
        })),
      },
      looseTypeValidation: true,
      options: fallback
        ? { fallbackOutput: "extra", renameFallbackOutput: fallback }
        : { fallbackOutput: "none" },
    },
    { pos, notes },
  );
}

export function noOp(name, { pos, notes } = {}) {
  return baseNode(name, "n8n-nodes-base.noOp", 1, {}, { pos, notes });
}

/**
 * Resolves runtime configuration once per execution, as the first node on each
 * trigger path, and exposes it as `$json.vigorConfig` for everything downstream.
 *
 * This is the ONLY place in the whole project that touches `$env`, which matters
 * more than it looks. In n8n 2.x the env provider reads:
 *
 *     isEnvAccessBlocked = process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE !== 'false'
 *
 * so env access is BLOCKED unless that variable is literally the string
 * "false" — and that provider backs ordinary expressions as well as Code nodes.
 * The variable no longer appears in n8n's typed config schema, so a missing or
 * misspelled value produces a runtime `access to env vars denied` error with
 * nothing warning you in advance. `infra/docker-compose.yml` sets it.
 *
 * Because one wrong environment variable would otherwise break every workflow
 * at once, the expression catches the failure and falls back to defaults,
 * reporting `envBlocked: true` so the condition is visible in the execution data
 * instead of being inferred from a stack trace. `internalToken` deliberately
 * falls back to an empty string, which makes the lab and clinician endpoints
 * fail closed rather than open.
 *
 * `includeOtherFields` keeps the trigger payload intact, so a validator
 * downstream still sees `$json.body`.
 */
export function configNode(name = "Vigor config", { pos } = {}) {
  const fallbacks =
    "{ agentServiceUrl: 'http://host.docker.internal:8000', internalToken: '', " +
    "notifyMode: 'DEMO', oncallEmail: 'oncall@example-clinic.ae', " +
    "escalationSlaMinutes: 60, quietHoursStart: 21, quietHoursEnd: 8, " +
    "webhookBase: 'http://localhost:5678', envBlocked: true }";

  const resolved =
    "{ agentServiceUrl: $env.VIGOR_AGENT_SERVICE_URL || d.agentServiceUrl, " +
    "internalToken: $env.VIGOR_INTERNAL_TOKEN || '', " +
    // Defaults to DEMO when unset: claiming a message was sent when nothing was
    // configured to send it would make the notification log a liar.
    "notifyMode: $env.VIGOR_NOTIFY_MODE || 'DEMO', " +
    "oncallEmail: $env.VIGOR_ONCALL_EMAIL || d.oncallEmail, " +
    "escalationSlaMinutes: Number($env.VIGOR_ESCALATION_SLA_MINUTES || 60), " +
    "quietHoursStart: Number($env.VIGOR_QUIET_HOURS_START || 21), " +
    "quietHoursEnd: Number($env.VIGOR_QUIET_HOURS_END || 8), " +
    "webhookBase: ($env.WEBHOOK_URL || 'http://localhost:5678/').replace(/\\/$/, ''), " +
    "envBlocked: false }";

  const expr =
    `={{ (() => { const d = ${fallbacks}; try { return ${resolved}; } catch (e) { return d; } })() }}`;

  return baseNode(
    name,
    "n8n-nodes-base.set",
    3.4,
    {
      mode: "manual",
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: stableId(name + "|vigorConfig"),
            name: "vigorConfig",
            type: "object",
            value: expr,
          },
        ],
      },
      options: {},
    },
    {
      pos,
      notes:
        "The only node that reads $env. Needs N8N_BLOCK_ENV_ACCESS_IN_NODE=false, " +
        "and falls back to defaults with envBlocked:true if that is missing.",
    },
  );
}

export function wait(name, { amount, unit = "minutes", pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.wait",
    1.1,
    { amount, unit },
    { pos, notes, webhookId: stableId("wait|" + name) },
  );
}

export function stopAndError(name, { message, pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.stopAndError",
    1,
    { errorMessage: message },
    { pos, notes },
  );
}

export function merge(name, { inputs = 2, mode = "append", pos, notes } = {}) {
  return baseNode(
    name,
    "n8n-nodes-base.merge",
    3,
    { mode, numberInputs: inputs, options: {} },
    { pos, notes },
  );
}

export function splitInBatches(name, { size = 1, pos, notes } = {}) {
  return baseNode(
    name,
    "n8n-nodes-base.splitInBatches",
    3,
    { batchSize: size, options: {} },
    { pos, notes },
  );
}

/* ------------------------------------------------------------------- mongodb */

export const MONGO_CREDENTIALS = {
  mongoDb: { id: "VigorAtlas", name: "Vigor Atlas" },
};

export function mongoFind(name, { collection, query, limit, sort, projection, pos, notes, executeOnce }) {
  const options = {};
  if (limit !== undefined) options.limit = limit;
  if (sort !== undefined) options.sort = typeof sort === "string" ? sort : JSON.stringify(sort);
  if (projection !== undefined) {
    options.projection = typeof projection === "string" ? projection : JSON.stringify(projection);
  }
  return baseNode(
    name,
    "n8n-nodes-base.mongoDb",
    1.1,
    {
      operation: "find",
      collection,
      query: typeof query === "string" ? query : JSON.stringify(query),
      options,
    },
    { pos, notes, executeOnce, credentials: MONGO_CREDENTIALS, alwaysOutputData: true },
  );
}

export function mongoAggregate(name, { collection, pipeline, pos, notes, executeOnce }) {
  return baseNode(
    name,
    "n8n-nodes-base.mongoDb",
    1.1,
    {
      operation: "aggregate",
      collection,
      query: typeof pipeline === "string" ? pipeline : JSON.stringify(pipeline),
    },
    { pos, notes, executeOnce, credentials: MONGO_CREDENTIALS, alwaysOutputData: true },
  );
}

/** `fields` is the list of top-level keys on the incoming item to persist. */
export function mongoInsert(name, { collection, fields, pos, notes, onError }) {
  return baseNode(
    name,
    "n8n-nodes-base.mongoDb",
    1.1,
    { operation: "insert", collection, fields: fields.join(","), options: {} },
    { pos, notes, onError, credentials: MONGO_CREDENTIALS },
  );
}

export function mongoUpdate(name, { collection, updateKey, fields, upsert = false, pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.mongoDb",
    1.1,
    {
      operation: "update",
      collection,
      updateKey,
      fields: fields.join(","),
      // `upsert` is a TOP-LEVEL node parameter, not a member of `options`. The
      // node reads it as `getNodeParameter('upsert', i)` on both the modern and
      // the legacy code paths. Putting it under `options` reads as undefined, so
      // the node performs a plain update that matches nothing, writes nothing,
      // and reports success — which is how a "successful" metrics rollup left
      // metrics_daily completely empty.
      upsert,
      options: {},
    },
    { pos, notes, credentials: MONGO_CREDENTIALS },
  );
}

/* ----------------------------------------------------------------- outbound */

export function http(name, { url, method = "POST", body, headers = {}, timeout = 20000, pos, notes, onError, retry }) {
  const parameters = { method, url, options: { timeout } };
  const headerEntries = Object.entries(headers);
  if (headerEntries.length) {
    parameters.sendHeaders = true;
    parameters.headerParameters = {
      parameters: headerEntries.map(([n, v]) => ({ name: n, value: v })),
    };
  }
  if (body !== undefined) {
    parameters.sendBody = true;
    parameters.specifyBody = "json";
    parameters.jsonBody = body;
  }
  return baseNode(name, "n8n-nodes-base.httpRequest", 4.2, parameters, {
    pos,
    notes,
    onError,
    retry,
    alwaysOutputData: true,
  });
}

export function respond(name, { body = "={{ JSON.stringify($json) }}", code: statusCode = 200, pos, notes }) {
  return baseNode(
    name,
    "n8n-nodes-base.respondToWebhook",
    1.1,
    {
      respondWith: "json",
      responseBody: body,
      options: statusCode === 200 ? {} : { responseCode: statusCode },
    },
    { pos, notes },
  );
}

export function sticky(content, { pos, width = 460, height = 220, color = 7 }) {
  const node = baseNode(
    "Note " + stableId(content).slice(0, 8),
    "n8n-nodes-base.stickyNote",
    1,
    { content, height, width, color },
    { pos },
  );
  return node;
}

/* ---------------------------------------------------------------- assemble */

/**
 * `edges` entries are [from, to] or [from, to, outputIndex].
 * Multiple edges from the same output fan out in parallel.
 */
export function workflow({ name, nodes, edges, tags = [], settings = {} }) {
  const byName = new Map(nodes.map((n) => [n.name, n]));
  const connections = {};

  for (const [from, to, out = 0] of edges) {
    if (!byName.has(from)) throw new Error(`${name}: edge from unknown node "${from}"`);
    if (!byName.has(to)) throw new Error(`${name}: edge to unknown node "${to}"`);
    connections[from] ??= { main: [] };
    while (connections[from].main.length <= out) connections[from].main.push([]);
    connections[from].main[out].push({ node: to, type: "main", index: 0 });
  }

  return {
    name,
    // Imported with `n8n import:workflow --activeState=fromJson`, so this is
    // what makes the webhooks listen without nine manual clicks.
    active: true,
    nodes,
    connections,
    pinData: {},
    settings: {
      executionOrder: "v1",
      saveManualExecutions: true,
      // Off deliberately. Progress saving writes node output after every node,
      // which multiplies disk writes on an instance whose storage is tight.
      // Failed executions are still saved in full below, which is what you
      // actually need to debug a missed escalation.
      saveExecutionProgress: false,
      // Vigor keeps failed executions: an escalation that did not fire is a
      // clinical-safety event and must be inspectable after the fact.
      saveDataErrorExecution: "all",
      saveDataSuccessExecution: "all",
      ...settings,
    },
    // Tags are deliberately NOT exported. `n8n import:workflow --separate`
    // creates tags per file without deduplicating them, so the second workflow
    // carrying a shared tag aborts the whole import with
    // `SQLITE_CONSTRAINT: UNIQUE constraint failed: tag_entity.name`.
    // The declared tags are kept in the build summary instead.
    vigorTags: tags,
    meta: { instanceId: "vigor-local" },
  };
}
