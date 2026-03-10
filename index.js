#!/usr/bin/env node
// GoldHold MCP Server -- persistent memory for AI agents
// https://goldhold.ai

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as relay from "./relay-client.js";

const server = new McpServer({
  name: "goldhold",
  version: "1.0.0",
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
  "Write content to GoldHold memory. Stored via relay and synced to Pinecone.",
  {
    folder: z.string().describe("Target memory folder (e.g. decisions, learnings, work, unfiled)"),
    key: z.string().describe("Unique key/filename for this memory item"),
    content: z.string().describe("The content to store"),
  },
  async ({ folder, key, content }) => {
    const result = await relay.memoryWrite(folder, key, content);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 3. goldhold_read
server.tool(
  "goldhold_read",
  "Read a specific memory item by folder and key.",
  {
    folder: z.string().describe("Memory folder name"),
    key: z.string().describe("Key/filename of the memory item"),
  },
  async ({ folder, key }) => {
    const result = await relay.memoryRead(folder, key);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 4. goldhold_delete
server.tool(
  "goldhold_delete",
  "Delete a specific memory item by folder and key.",
  {
    folder: z.string().describe("Memory folder name"),
    key: z.string().describe("Key/filename to delete"),
  },
  async ({ folder, key }) => {
    const result = await relay.memoryDelete(folder, key);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// 5. goldhold_inbox
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

// 6. goldhold_send
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

// 7. goldhold_status
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
