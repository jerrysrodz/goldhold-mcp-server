#!/usr/bin/env node
// GoldHold MCP Server -- persistent memory for AI agents
// https://goldhold.ai

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as relay from "./relay-client.js";

const server = new McpServer({
  name: "goldhold",
  version: "1.1.0",
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

const transport = new StdioServerTransport();
await server.connect(transport);
