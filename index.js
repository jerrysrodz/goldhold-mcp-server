#!/usr/bin/env node
// GoldHold MCP Server -- persistent memory for AI agents
// https://goldhold.ai

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as relay from "./relay-client.js";

const server = new McpServer({
  name: "goldhold",
  version: "1.4.1",
});

// 1. goldhold_search
server.tool(
  "goldhold_search",
  "Semantic search across GoldHold memory. Returns ranked results from past sessions.",
  {
    query: z.string().describe("Natural language search query"),
    folder: z.string().optional().describe("Folder to scope search (e.g. decisions, people). Omit for all."),
    limit: z.number().optional().default(10).describe("Max results (default 10)"),
  },
  async ({ query, folder, limit }) => {
    const result = await relay.memorySearch(query, folder, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 2. goldhold_store
server.tool(
  "goldhold_store",
  "Save a memory to GoldHold. Stored via relay and synced to Pinecone.",
  {
    subject: z.string().describe("Short topic/subject line"),
    body: z.string().describe("Content to remember"),
    folder: z.string().optional().describe("Target folder (e.g. decisions, learnings, work, unfiled)"),
    type: z.string().optional().default("NOTE").describe("Packet type: NOTE, FACT, DECISION, DIRECTIVE, etc."),
  },
  async ({ subject, body, folder, type }) => {
    const result = await relay.store(subject, body, folder, type);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 3. goldhold_turn -- compound: search + store + send in one call
server.tool(
  "goldhold_turn",
  "Compound: search + store + send in one call. The primary tool for most interactions.",
  {
    search: z.object({
      query: z.string().describe("Search query"),
      limit: z.number().optional().default(5),
    }).optional().describe("Search memories"),
    store: z.array(z.object({
      subject: z.string(),
      body: z.string(),
      type: z.string().optional().default("NOTE"),
    })).optional().describe("Store one or more memories"),
    send: z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
    }).optional().describe("Send a message"),
    compact: z.boolean().optional().default(true),
  },
  async ({ search, store, send, compact }) => {
    const result = await relay.turn(search, store, send, compact);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 4. goldhold_resume -- session resume
server.tool(
  "goldhold_resume",
  "Resume a session. Returns recent context, inbox, and capability card.",
  {
    compact: z.boolean().optional().default(true),
  },
  async ({ compact }) => {
    const result = await relay.resume(compact);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 5. goldhold_batch -- multiple operations
server.tool(
  "goldhold_batch",
  "Multiple operations in one request. Each op has a method and params.",
  {
    ops: z.array(z.object({
      method: z.string().describe("Operation: search, store, send, inbox, status"),
      params: z.record(z.any()).optional(),
    })).describe("Array of operations"),
  },
  async ({ ops }) => {
    const result = await relay.batch(ops);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 6. goldhold_close -- graceful session end
server.tool(
  "goldhold_close",
  "Graceful session end with summary. Saves state for next session.",
  {
    session_summary: z.string().describe("Summary of what happened this session"),
    compact: z.boolean().optional().default(true),
  },
  async ({ session_summary, compact }) => {
    const result = await relay.close(session_summary, compact);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 7. goldhold_inbox
server.tool(
  "goldhold_inbox",
  "Check the GoldHold message inbox. Returns messages from other agents and the owner.",
  {
    include_read: z.boolean().optional().default(false).describe("Include already-read messages"),
    limit: z.number().optional().default(20).describe("Max messages to return"),
  },
  async ({ include_read, limit }) => {
    const result = await relay.inbox(include_read, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 8. goldhold_send
server.tool(
  "goldhold_send",
  "Send a message via GoldHold messaging. Recipients: owner, guardian, or agent name.",
  {
    to: z.string().describe("Recipient (owner, guardian, all, or agent name)"),
    subject: z.string().describe("Message subject line"),
    body: z.string().describe("Message body"),
  },
  async ({ to, subject, body }) => {
    const result = await relay.send(to, subject, body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 9. goldhold_status
server.tool(
  "goldhold_status",
  "Check GoldHold connection health, sync state, and system info.",
  {},
  async () => {
    const result = await relay.status();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 10. goldhold_discover
server.tool(
  "goldhold_discover",
  "List agents, channels, and capabilities in the GoldHold network.",
  {},
  async () => {
    const result = await relay.discover();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 11. goldhold_agents
server.tool(
  "goldhold_agents",
  "List all agents in the GoldHold network.",
  {},
  async () => {
    const result = await relay.agents();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 12. goldhold_memory_read
server.tool(
  "goldhold_memory_read",
  "Read a specific memory packet by ID, or browse a folder's contents.",
  {
    id: z.string().optional().describe("Packet ID to read directly"),
    folder: z.string().optional().describe("Folder to browse (e.g. decisions, people, work)"),
    limit: z.number().optional().default(10).describe("Max items when browsing a folder"),
  },
  async ({ id, folder, limit }) => {
    const result = await relay.memoryRead(id, folder, limit);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 13. goldhold_memory_namespaces
server.tool(
  "goldhold_memory_namespaces",
  "List all memory folders and their stats (count, last updated).",
  {},
  async () => {
    const result = await relay.memoryNamespaces();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 14. goldhold_task_list
server.tool(
  "goldhold_task_list",
  "List open tasks from the GoldHold task queue.",
  {},
  async () => {
    const result = await relay.taskList();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 15. goldhold_task_create
server.tool(
  "goldhold_task_create",
  "Create a new task in the GoldHold task queue.",
  {
    description: z.string().describe("Task description"),
    priority: z.enum(["low", "normal", "high", "critical"]).optional().default("normal").describe("Task priority"),
    assignee: z.string().optional().describe("Agent to assign the task to"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
  },
  async ({ description, priority, assignee, tags }) => {
    const result = await relay.taskCreate(description, priority, assignee, tags);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 16. goldhold_task_complete
server.tool(
  "goldhold_task_complete",
  "Mark a task as completed.",
  {
    task_id: z.string().describe("Task ID to complete (e.g. TASK-0001)"),
    notes: z.string().optional().describe("Completion notes"),
  },
  async ({ task_id, notes }) => {
    const result = await relay.taskComplete(task_id, notes);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 17. goldhold_task_update
server.tool(
  "goldhold_task_update",
  "Update a task's status, priority, or assignee.",
  {
    task_id: z.string().describe("Task ID to update"),
    status: z.string().optional().describe("New status (open, in_progress, blocked, done)"),
    priority: z.enum(["low", "normal", "high", "critical"]).optional().describe("New priority"),
    assignee: z.string().optional().describe("New assignee"),
  },
  async ({ task_id, status, priority, assignee }) => {
    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignee) updates.assignee = assignee;
    const result = await relay.taskUpdate(task_id, updates);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 18. goldhold_channels
server.tool(
  "goldhold_channels",
  "List communication channels available in the GoldHold network.",
  {},
  async () => {
    const result = await relay.channels();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 19. goldhold_profile
server.tool(
  "goldhold_profile",
  "View or update the agent's profile (display name, description, capabilities).",
  {
    display_name: z.string().optional().describe("New display name"),
    description: z.string().optional().describe("Agent description"),
  },
  async ({ display_name, description }) => {
    const update = {};
    if (display_name) update.display_name = display_name;
    if (description) update.description = description;
    const hasUpdate = Object.keys(update).length > 0;
    const result = hasUpdate ? await relay.profile(update) : await relay.profile();
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

const transport = new StdioServerTransport();

// 20. goldhold_checkpoint
server.tool(
  "goldhold_checkpoint",
  "Save a checkpoint of current working state. Use at natural breakpoints to enable seamless resume.",
  {
    summary: z.string().describe("What was being worked on and current status"),
    next_step: z.string().optional().describe("What should happen next"),
    scope: z.string().optional().describe("Active project or scope name"),
    open_loops: z.array(z.string()).optional().describe("Unresolved items to carry forward"),
  },
  async ({ summary, next_step, scope, open_loops }) => {
    const result = await relay.checkpoint(summary, next_step, scope, open_loops);
    return { content: [{ type: "text", text: result.ok ? `Checkpoint saved: ${summary.slice(0, 100)}` : `Failed: ${JSON.stringify(result)}` }] };
  }
);

// 21. goldhold_focus
server.tool(
  "goldhold_focus",
  "Set the current focus manifest -- what project is active, what matters now, what to ignore. Also creates ASSET_REF records for each ref.",
  {
    project: z.string().describe("Active project or objective"),
    priorities: z.array(z.string()).optional().describe("What matters right now"),
    ignore: z.array(z.string()).optional().describe("What to deprioritize or ignore"),
    refs: z.array(z.string()).optional().describe("Key files, URLs, or resource identifiers in scope"),
  },
  async ({ project, priorities, ignore, refs }) => {
    const result = await relay.focus(project, priorities, ignore, refs);
    return { content: [{ type: "text", text: result.ok ? `Focus set: ${project}` : `Failed: ${JSON.stringify(result)}` }] };
  }
);

// 22. goldhold_restore
server.tool(
  "goldhold_restore",
  "Restore the current working state: latest checkpoint, focus manifest, asset refs, unresolved items, directives, and corrections. Use at session start instead of generic search.",
  {
    context_budget: z.number().optional().default(2000).describe("Max tokens for restore payload"),
  },
  async ({ context_budget }) => {
    const data = await relay.resume(true, context_budget || 2000);
    if (!data.ok) return { content: [{ type: "text", text: `Restore failed: ${JSON.stringify(data)}` }] };
    const ctx = data.context || {};
    const parts = [];
    if (ctx.focus_manifest) parts.push(`FOCUS: ${ctx.focus_manifest.subject}\n${ctx.focus_manifest.body}`);
    if (ctx.latest_checkpoint) parts.push(`CHECKPOINT: ${ctx.latest_checkpoint.subject}\n${ctx.latest_checkpoint.body}`);
    if (ctx.active_asset_refs?.length) parts.push(`ASSETS:\n${ctx.active_asset_refs.map(a => `- ${a.subject}`).join("\n")}`);
    if (ctx.unresolved_working?.length) parts.push(`WORKING:\n${ctx.unresolved_working.map(w => `- [${w.type}] ${w.subject}`).join("\n")}`);
    if (ctx.resume_hint) parts.push(`RESUME HINT: ${ctx.resume_hint}`);
    if (ctx.last_session_summary) parts.push(`LAST SESSION: ${ctx.last_session_summary}`);
    if (ctx.active_directives?.length) parts.push(`DIRECTIVES:\n${ctx.active_directives.map(d => `- ${d.subject}`).join("\n")}`);
    if (ctx.recent_corrections?.length) parts.push(`CORRECTIONS:\n${ctx.recent_corrections.map(c => `- ${c.subject} (corrects: ${c.corrects || "N/A"})`).join("\n")}`);
    if (ctx.unread_messages) parts.push(`UNREAD: ${ctx.unread_messages} message(s)`);
    return { content: [{ type: "text", text: parts.length ? parts.join("\n\n") : "No working state found. This is a fresh start." }] };
  }
);

// ─── PLANS V2 ────────────────────────────────────────────────────────────

// 23. goldhold_plan_create
server.tool(
  "goldhold_plan_create",
  "Create a new plan with PRD, manifest, tasks, facts, and asset refs in one call. Returns plan_slug and task IDs.",
  {
    plan_name: z.string().describe("Human-readable plan name"),
    goal: z.string().describe("What this plan achieves"),
    success_criteria: z.array(z.string()).optional().describe("How to know the plan is done"),
    in_scope: z.array(z.string()).optional().describe("What is in scope"),
    out_of_scope: z.array(z.string()).optional().describe("What is out of scope"),
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      priority: z.string().optional(),
      owner: z.string().optional(),
      blocked_by: z.array(z.string()).optional(),
      depends_on: z.array(z.string()).optional(),
      acceptance_criteria: z.array(z.string()).optional(),
    })).optional().describe("Initial tasks"),
    facts: z.array(z.object({ topic: z.string(), body: z.string().optional().describe("The actual fact content/assertion"), confidence: z.string().optional(), source: z.string().optional() })).optional(),
    refs: z.array(z.object({ label: z.string(), kind: z.string().optional(), ref: z.string(), selector: z.string().optional() })).optional(),
  },
  async ({ plan_name, goal, success_criteria, in_scope, out_of_scope, tasks, facts, refs }) => {
    const result = await relay.planCreate(plan_name, goal, success_criteria, in_scope, out_of_scope, tasks, facts, refs);
    return { content: [{ type: "text", text: result.ok ? `Plan created: ${result.plan_slug}\nTasks: ${(result.task_ids || []).join(", ")}\nPackets: ${(result.created_packets || []).length}` : `Failed: ${JSON.stringify(result)}` }] };
  }
);

// 24. goldhold_plan_task
server.tool(
  "goldhold_plan_task",
  "Manage tasks within a plan: create, start, block, complete, cancel, update, or reorder.",
  {
    plan_slug: z.string().describe("Plan slug"),
    action: z.enum(["create", "start", "block", "complete", "cancel", "update", "reorder"]),
    task_id: z.string().optional().describe("Task ID (T-001 format). Required for non-create actions."),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.string().optional(),
    order: z.number().optional(),
    owner: z.string().optional(),
    note: z.string().optional().describe("Completion or status note"),
    blocked_by: z.array(z.string()).optional(),
    depends_on: z.array(z.string()).optional(),
    acceptance_criteria: z.array(z.string()).optional(),
  },
  async ({ plan_slug, action, task_id, ...fields }) => {
    const result = await relay.planTask(plan_slug, action, task_id, fields);
    if (!result.ok) return { content: [{ type: "text", text: `Failed: ${JSON.stringify(result)}` }] };
    const parts = [`Task ${result.task_id}: ${result.status || action}`];
    // Return authoritative task state for non-create actions
    if (action !== "create" && result.task) {
      parts.push(`Title: ${result.task.title || result.task_id}`);
      parts.push(`Priority: ${result.task.priority || "normal"}`);
      if (result.task.note) parts.push(`Note: ${result.task.note}`);
    }
    parts.push(`\nSuggestion: Consider checkpointing if this completes a logical unit of work.`);
    return { content: [{ type: "text", text: parts.join("\n") }] };
  }
);

// 25. goldhold_plan_checkpoint
server.tool(
  "goldhold_plan_checkpoint",
  "Save a plan checkpoint with task counts, active refs, and resume hint.",
  {
    plan_slug: z.string(),
    objective: z.string().optional(),
    current_state: z.string().optional(),
    open_loops: z.array(z.string()).optional(),
    next_step: z.string().optional(),
    active_task_id: z.string().optional(),
    active_refs: z.array(z.string()).optional(),
    resume_hint: z.string().optional(),
  },
  async ({ plan_slug, objective, current_state, open_loops, next_step, active_task_id, active_refs, resume_hint }) => {
    const result = await relay.planCheckpoint(plan_slug, objective, current_state, open_loops, next_step, active_task_id, active_refs, resume_hint);
    if (!result.ok) return { content: [{ type: "text", text: `Failed: ${JSON.stringify(result)}` }] };
    const parts = [`Checkpoint saved for ${plan_slug}`];
    parts.push(`Tasks: ${result.tasks_total} total, ${result.tasks_done} done, ${result.tasks_open} open, ${result.tasks_active} active, ${result.tasks_blocked} blocked`);
    if (next_step) parts.push(`Next: ${next_step}`);
    if (resume_hint) parts.push(`Resume: ${resume_hint}`);
    return { content: [{ type: "text", text: parts.join("\n") }] };
  }
);

// 26. goldhold_plan_restore
server.tool(
  "goldhold_plan_restore",
  "Restore a plan's working state: manifest, checkpoint, tasks, assets, corrections. Use at session start instead of search.",
  {
    plan_slug: z.string(),
    context_budget: z.number().optional().default(2000),
    include_closed: z.boolean().optional().default(false),
  },
  async ({ plan_slug, context_budget, include_closed }) => {
    const data = await relay.planRestore(plan_slug, context_budget, include_closed);
    if (!data.ok) return { content: [{ type: "text", text: `Restore failed: ${JSON.stringify(data)}` }] };
    const d = data.data || data;
    const parts = [];
    if (d.manifest) {
      let m = d.manifest;
      try { const mb = JSON.parse(m.body); parts.push(`PLAN: ${mb.plan_name || plan_slug}\nGoal: ${mb.goal || ""}\nPhase: ${mb.phase || ""}\nStatus: ${mb.status || ""}`); } catch { parts.push(`MANIFEST: ${m.subject}`); }
    }
    if (d.latest_checkpoint) {
      try { const cp = JSON.parse(d.latest_checkpoint.body); parts.push(`CHECKPOINT:\nNext: ${cp.next_step || "N/A"}\nResume: ${cp.resume_hint || "N/A"}`); } catch { parts.push(`CHECKPOINT: ${d.latest_checkpoint.subject}`); }
    }
    if (d.unresolved_tasks?.length) {
      parts.push(`TASKS (${d.task_counts?.open || "?"} open, ${d.task_counts?.active || "?"} active, ${d.task_counts?.blocked || "?"} blocked):\n${d.unresolved_tasks.map(t => `- ${t.task_id || "?"} [${t.status}] ${t.title} (P:${t.priority})`).join("\n")}`);
    }
    if (d.active_asset_refs?.length) parts.push(`ASSETS:\n${d.active_asset_refs.map(a => `- ${a.asset_id}: ${a.label} (${a.ref})`).join("\n")}`);
    if (d.facts_and_decisions?.length) parts.push(`FACTS/DECISIONS:\n${d.facts_and_decisions.map(f => `- [${f.type}] ${f.topic}: ${f.subject}`).join("\n")}`);
    if (d.recent_corrections?.length) parts.push(`CORRECTIONS:\n${d.recent_corrections.map(c => `- ${c.subject}`).join("\n")}`);
    if (d.resume_hint) parts.push(`RESUME: ${d.resume_hint}`);
    return { content: [{ type: "text", text: parts.length ? parts.join("\n\n") : `No state found for plan: ${plan_slug}` }] };
  }
);

// 27. goldhold_plan_fact
server.tool(
  "goldhold_plan_fact",
  "Record a fact (SSOT) within a plan. Supersedes previous facts on the same topic.",
  {
    plan_slug: z.string(),
    topic: z.string(),
    body: z.string(),
    confidence: z.string().optional(),
    source: z.string().optional(),
  },
  async ({ plan_slug, topic, body, confidence, source }) => {
    const result = await relay.planFact(plan_slug, topic, body, confidence, source);
    return { content: [{ type: "text", text: result.ok ? `Fact recorded: ${topic}` : `Failed: ${JSON.stringify(result)}` }] };
  }
);

// 28. goldhold_plan_decision
server.tool(
  "goldhold_plan_decision",
  "Record a decision within a plan with rationale and impact.",
  {
    plan_slug: z.string(),
    topic: z.string(),
    body: z.string(),
    why: z.string(),
    impact: z.string().optional(),
    replaces: z.string().optional(),
  },
  async ({ plan_slug, topic, body, why, impact, replaces }) => {
    const result = await relay.planDecision(plan_slug, topic, body, why, impact, replaces);
    return { content: [{ type: "text", text: result.ok ? `Decision recorded: ${topic}` : `Failed: ${JSON.stringify(result)}` }] };
  }
);

// 29. goldhold_plan_close
server.tool(
  "goldhold_plan_close",
  "Close a plan: writes final checkpoint, outcome fact, and closed manifest.",
  {
    plan_slug: z.string(),
    outcome: z.string().describe("shipped, cancelled, deferred, etc."),
    summary: z.string(),
    followups: z.array(z.string()).optional(),
  },
  async ({ plan_slug, outcome, summary, followups }) => {
    const result = await relay.planClose(plan_slug, outcome, summary, followups);
    if (!result.ok) return { content: [{ type: "text", text: `Failed: ${JSON.stringify(result)}` }] };
    const parts = [`Plan closed: ${plan_slug}`, `Outcome: ${outcome}`, `Summary: ${summary}`];
    if (followups && followups.length) parts.push(`Followups:\n${followups.map(f => `- ${f}`).join("\n")}`);
    if (result.manifest) {
      const m = result.manifest;
      if (m.plan_name) parts.push(`Plan: ${m.plan_name}`);
      if (m.goal) parts.push(`Goal: ${m.goal}`);
    }
    return { content: [{ type: "text", text: parts.join("\n") }] };
  }
);

await server.connect(transport);
