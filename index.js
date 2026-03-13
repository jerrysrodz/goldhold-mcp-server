#!/usr/bin/env node
// GoldHold MCP Server -- persistent memory for AI agents
// https://goldhold.ai

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as relay from "./relay-client.js";

const server = new McpServer({
  name: "goldhold",
  version: "1.3.0",
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

await server.connect(transport);
