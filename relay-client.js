// relay-client.js -- GoldHold Relay API client

const RELAY_URL = process.env.GOLDHOLD_RELAY_URL || "https://relay.goldhold.ai";
const API_KEY = process.env.GOLDHOLD_API_KEY || "";

async function relayCall(method, path, body) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "User-Agent": "GoldHold-MCP/1.1",
    },
  };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(`${RELAY_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Relay ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function memorySearch(query, folder, limit) {
  return relayCall("POST", "/v1/search", { query, namespace: folder, top_k: limit || 10 });
}

export async function store(subject, body, folder, type) {
  // Use /v1/turn store path for typed memory writes
  const storeItem = { subject, body, type: type || "NOTE" };
  if (folder) storeItem.namespace = folder;
  return relayCall("POST", "/v1/turn", { store: [storeItem], compact: true });
}

export async function turn(search, storeItems, send, compact) {
  const payload = { compact: compact !== false };
  if (search) payload.search = search;
  if (storeItems) payload.store = storeItems;
  if (send) payload.send = send;
  return relayCall("POST", "/v1/turn", payload);
}

export async function resume(compact, contextBudget) {
  const payload = { compact: compact !== false };
  if (contextBudget) payload.context_budget = contextBudget;
  return relayCall("POST", "/v1/auto", payload);
}

export async function checkpoint(summary, nextStep, scope, openLoops) {
  const body = [summary];
  if (nextStep) body.push(`Next: ${nextStep}`);
  if (scope) body.push(`Scope: ${scope}`);
  if (openLoops?.length) body.push(`Open loops: ${openLoops.join("; ")}`);
  return store(`CHECKPOINT: ${scope || "session"}`, body.join("\n"), null, "CHECKPOINT");
}

export async function focus(project, priorities, ignore, refs) {
  const body = [`Project: ${project}`];
  if (priorities?.length) body.push(`Priorities: ${priorities.join("; ")}`);
  if (ignore?.length) body.push(`Ignore: ${ignore.join("; ")}`);
  if (refs?.length) body.push(`Refs: ${refs.join("; ")}`);
  // Write the manifest
  const result = await store(`MANIFEST: ${project}`, body.join("\n"), null, "MANIFEST");
  // Write individual ASSET_REF packets for each ref
  if (refs?.length) {
    for (const ref of refs) {
      await store(`ASSET_REF: ${ref}`, `Referenced by project: ${project}`, null, "ASSET_REF");
    }
  }
  return result;
}

export async function batch(ops) {
  return relayCall("POST", "/v1/batch", { ops });
}

export async function close(sessionSummary, compact) {
  return relayCall("POST", "/v1/session/close", { session_summary: sessionSummary, compact: compact !== false });
}

export async function inbox(includeRead, limit) {
  return relayCall("POST", "/v1/inbox", { include_read: includeRead, limit: limit || 20 });
}

export async function send(to, subject, body) {
  return relayCall("POST", "/v1/send", { to, subject, body });
}

export async function status() {
  return relayCall("GET", "/v1/status");
}

export async function discover() {
  return relayCall("GET", "/v1/discover");
}

export async function agents() {
  return relayCall("GET", "/v1/agents");
}

export async function channels() {
  return relayCall("GET", "/v1/channels");
}

export async function profile(update) {
  if (update) return relayCall("POST", "/v1/profile", update);
  return relayCall("GET", "/v1/status");
}

export async function memoryRead(id, folder, limit) {
  return relayCall("POST", "/v1/memory/read", { id, folder, limit: limit || 10 });
}

export async function memoryNamespaces() {
  return relayCall("GET", "/v1/memory/namespaces");
}

export async function memoryWrite(subject, body, type, folder, tags) {
  return relayCall("POST", "/v1/memory/write", { subject, body, type: type || "note", folder: folder || "unfiled", tags: tags || [], source: "mcp" });
}

export async function taskList() {
  return relayCall("GET", "/v1/tasks");
}

export async function taskCreate(description, priority, assignee, tags) {
  return relayCall("POST", "/v1/tasks", { description, priority: priority || "normal", assignee, tags });
}

export async function taskComplete(taskId, notes) {
  return relayCall("POST", `/v1/tasks/${taskId}/complete`, { notes });
}

export async function taskUpdate(taskId, updates) {
  return relayCall("PATCH", `/v1/tasks/${taskId}`, updates);
}

// ─── PLANS V2 ────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

export async function planCreate(planName, goal, successCriteria, inScope, outOfScope, tasks, facts, refs) {
  const slug = slugify(planName);
  const ns = `plans/${slug}`;
  const storeItems = [];

  // PRD/DOCUMENT
  storeItems.push({
    subject: `PRD: ${planName}`, body: JSON.stringify({ plan_slug: slug, goal, success_criteria: successCriteria, in_scope: inScope, out_of_scope: outOfScope }),
    type: "DOCUMENT", namespace: ns, metadata: { plan_slug: slug }
  });

  // MANIFEST
  const taskIds = (tasks || []).map((_, i) => `T-${String(i + 1).padStart(3, "0")}`);
  storeItems.push({
    subject: `PLAN MANIFEST: ${planName}`,
    body: JSON.stringify({ plan_slug: slug, plan_name: planName, goal, success_criteria: successCriteria, phase: "build", status: "active", in_scope: inScope || [], out_of_scope: outOfScope || [], active_task_id: taskIds[0] || null, active_refs: (refs || []).map((_, i) => `A-${String(i + 1).padStart(3, "0")}`) }),
    type: "MANIFEST", namespace: ns, metadata: { plan_slug: slug }, dedupe_key: `${slug}:manifest`
  });

  // Tasks as DIRECTIVEs
  for (let i = 0; i < (tasks || []).length; i++) {
    const t = tasks[i]; const tid = taskIds[i];
    storeItems.push({
      subject: `TASK ${tid}: ${t.title}`,
      body: JSON.stringify({ plan_slug: slug, task_id: tid, title: t.title, description: t.description || t.title, status: "open", priority: t.priority || "normal", order: i + 1, blocked_by: t.blocked_by || [], depends_on: t.depends_on || [], acceptance_criteria: t.acceptance_criteria || [], owner: t.owner || "chief", updated_at: new Date().toISOString() }),
      type: "DIRECTIVE", namespace: ns, metadata: { plan_slug: slug, task_id: tid }, dedupe_key: `${slug}:${tid}`
    });
  }

  // Facts
  for (const f of (facts || [])) {
    storeItems.push({
      subject: `SSOT: ${f.topic}`, body: JSON.stringify({ plan_slug: slug, topic: f.topic, body: f.body || f.topic, confidence: f.confidence || "high", source: f.source || "plan_create" }),
      type: "FACT", namespace: ns, metadata: { plan_slug: slug, topic: f.topic }, dedupe_key: `${slug}:fact:${f.topic}`
    });
  }

  // Asset refs
  for (let i = 0; i < (refs || []).length; i++) {
    const r = refs[i]; const aid = `A-${String(i + 1).padStart(3, "0")}`;
    storeItems.push({
      subject: `ASSET ${aid}: ${r.label}`, body: JSON.stringify({ plan_slug: slug, asset_id: aid, label: r.label, kind: r.kind || "file", ref: r.ref, selector: r.selector || null, active: true }),
      type: "ASSET_REF", namespace: ns, metadata: { plan_slug: slug, asset_id: aid }, dedupe_key: `${slug}:asset:${aid}`
    });
  }

  // Schema version
  storeItems.push({
    subject: "SSOT: schema_version", body: JSON.stringify({ plan_slug: slug, topic: "schema_version", body: "plans_v2", confidence: "high", source: "plan_create" }),
    type: "FACT", namespace: ns, metadata: { plan_slug: slug, topic: "schema_version" }, dedupe_key: `${slug}:fact:schema_version`
  });

  const result = await turn(null, storeItems, null, true);
  return { ok: result.ok, plan_slug: slug, task_ids: taskIds, created_packets: result.stored || [] };
}

export async function planTask(planSlug, action, taskId, fields) {
  const ns = `plans/${planSlug}`;
  if (action === "create") {
    // Monotonic task-id allocator: fetch existing tasks to find next T-NNN
    let nextNum = 1;
    if (!taskId) {
      try {
        const restored = await planRestore(planSlug, 2000, false);
        if (restored && restored.tasks) {
          const nums = restored.tasks.map(t => {
            const m = t.task_id && t.task_id.match(/^T-(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
          });
          if (nums.length > 0) nextNum = Math.max(...nums) + 1;
        }
      } catch (_) { /* proceed with T-001 if restore fails */ }
    }
    const tid = taskId || `T-${String(nextNum).padStart(3, "0")}`;
    const item = {
      subject: `TASK ${tid}: ${fields.title}`,
      body: JSON.stringify({ plan_slug: planSlug, task_id: tid, title: fields.title, description: fields.description || fields.title, status: "open", priority: fields.priority || "normal", order: fields.order || 999, blocked_by: fields.blocked_by || [], depends_on: fields.depends_on || [], acceptance_criteria: fields.acceptance_criteria || [], owner: fields.owner || "chief", updated_at: new Date().toISOString() }),
      type: "DIRECTIVE", namespace: ns, metadata: { plan_slug: planSlug, task_id: tid }, dedupe_key: `${planSlug}:${tid}`
    };
    const result = await turn(null, [item], null, true);
    return { ok: result.ok, task_id: tid, stored: result.stored };
  }
  const transitions = { start: "active", block: "blocked", complete: "done", cancel: "cancelled", update: fields.status || "open", reorder: fields.status || "open" };
  if (!transitions[action]) return { ok: false, error: `Unknown action: ${action}` };
  const newStatus = transitions[action];
  // Fetch existing task to preserve fields not being updated
  let existing = {};
  try {
    const restored = await planRestore(planSlug, 4000, false);
    if (restored && restored.tasks) {
      const found = restored.tasks.find(t => t.task_id === taskId);
      if (found) existing = found;
    }
  } catch (_) { /* proceed with defaults if restore fails */ }
  const item = {
    subject: `TASK ${taskId}: ${fields.title || existing.title || taskId}`,
    body: JSON.stringify({ plan_slug: planSlug, task_id: taskId, title: fields.title || existing.title || taskId, description: fields.description || existing.description || "", status: newStatus, priority: fields.priority || existing.priority || "normal", order: fields.order != null ? fields.order : (existing.order != null ? existing.order : 999), blocked_by: fields.blocked_by || existing.blocked_by || [], depends_on: fields.depends_on || existing.depends_on || [], acceptance_criteria: fields.acceptance_criteria || existing.acceptance_criteria || [], owner: fields.owner || existing.owner || "chief", note: fields.note || null, updated_at: new Date().toISOString() }),
    type: "DIRECTIVE", namespace: ns, metadata: { plan_slug: planSlug, task_id: taskId }, dedupe_key: `${planSlug}:${taskId}`, auto_supersede: true
  };
  const result = await turn(null, [item], null, true);
  return { ok: result.ok, task_id: taskId, status: newStatus, stored: result.stored, task: { title: fields.title || existing.title || taskId, priority: fields.priority || existing.priority || "normal", note: fields.note || null } };
}

export async function planCheckpoint(planSlug, objective, currentState, openLoops, nextStep, activeTaskId, activeRefs, resumeHint) {
  const ns = `plans/${planSlug}`;
  // Compute task counts from current plan state
  let taskCounts = { tasks_total: 0, tasks_done: 0, tasks_open: 0, tasks_blocked: 0, tasks_active: 0, tasks_cancelled: 0 };
  try {
    const restored = await planRestore(planSlug, 2000, false);
    if (restored && restored.tasks) {
      taskCounts.tasks_total = restored.tasks.length;
      for (const t of restored.tasks) {
        const s = t.status || "open";
        if (s === "done") taskCounts.tasks_done++;
        else if (s === "blocked") taskCounts.tasks_blocked++;
        else if (s === "active") taskCounts.tasks_active++;
        else if (s === "cancelled") taskCounts.tasks_cancelled++;
        else taskCounts.tasks_open++;
      }
    }
  } catch (_) { /* proceed without counts if restore fails */ }
  const item = {
    subject: `CHECKPOINT: ${planSlug}`,
    body: JSON.stringify({ plan_slug: planSlug, objective: objective || "", active_task_id: activeTaskId || null, next_step: nextStep || null, current_state: currentState || null, open_loops: openLoops || [], active_refs: activeRefs || [], resume_hint: resumeHint || nextStep || null, ...taskCounts }),
    type: "CHECKPOINT", namespace: ns, metadata: { plan_slug: planSlug }, dedupe_key: `${planSlug}:checkpoint:latest`
  };
  const result = await turn(null, [item], null, true);
  return { ok: result.ok, stored: result.stored, ...taskCounts };
}

export async function planRestore(planSlug, contextBudget, includeClosed) {
  return relayCall("POST", "/v1/plan/restore", { plan_slug: planSlug, context_budget: contextBudget || 2000, include_closed: includeClosed || false });
}

export async function planFact(planSlug, topic, body, confidence, source) {
  const ns = `plans/${planSlug}`;
  const item = {
    subject: `SSOT: ${topic}`, body: JSON.stringify({ plan_slug: planSlug, topic, body, confidence: confidence || "high", source: source || "agent" }),
    type: "FACT", namespace: ns, metadata: { plan_slug: planSlug, topic }, dedupe_key: `${planSlug}:fact:${topic}`
  };
  const result = await turn(null, [item], null, true);
  return { ok: result.ok, stored: result.stored };
}

export async function planDecision(planSlug, topic, body, why, impact, replaces) {
  const ns = `plans/${planSlug}`;
  const item = {
    subject: `DECISION: ${topic}`, body: JSON.stringify({ plan_slug: planSlug, topic, body, why, impact, replaces: replaces || null }),
    type: "DECISION", namespace: ns, metadata: { plan_slug: planSlug, topic }
  };
  const result = await turn(null, [item], null, true);
  return { ok: result.ok, stored: result.stored };
}

export async function planClose(planSlug, outcome, summary, followups) {
  const ns = `plans/${planSlug}`;
  // Fetch existing manifest to preserve full metadata on close
  let existingManifest = {};
  try {
    const restored = await planRestore(planSlug, 2000, false);
    if (restored && restored.manifest) existingManifest = restored.manifest;
  } catch (_) { /* proceed with minimal manifest if restore fails */ }
  const storeItems = [
    { subject: `CHECKPOINT: ${planSlug}`, body: JSON.stringify({ plan_slug: planSlug, objective: "Plan close", next_step: null, resume_hint: null, outcome }), type: "CHECKPOINT", namespace: ns, metadata: { plan_slug: planSlug }, dedupe_key: `${planSlug}:checkpoint:latest` },
    { subject: "SSOT: outcome", body: JSON.stringify({ plan_slug: planSlug, topic: "outcome", body: outcome, confidence: "high", source: "plan_close" }), type: "FACT", namespace: ns, metadata: { plan_slug: planSlug, topic: "outcome" }, dedupe_key: `${planSlug}:fact:outcome` },
    { subject: `PLAN MANIFEST: ${planSlug}`, body: JSON.stringify({ ...existingManifest, plan_slug: planSlug, status: "closed", outcome, summary, followups: followups || [] }), type: "MANIFEST", namespace: ns, metadata: { plan_slug: planSlug }, dedupe_key: `${planSlug}:manifest` }
  ];
  const result = await turn(null, storeItems, null, true);
  return { ok: result.ok, stored: result.stored, manifest: existingManifest };
}