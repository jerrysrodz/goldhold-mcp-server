# GoldHold Persistent Memory (Claude Skill)

This folder contains a lightweight **Claude Skill** that teaches Claude how to use the GoldHold MCP tools effectively.

## What this Skill is for

Use this Skill to guide Claude to:
- Restore context at the start of a session (do not guess)
- Store durable memories (facts, decisions, preferences) as they are learned
- Retrieve information via semantic search instead of re-asking the user
- Manage tasks and messages as first-class objects

## Where the instructions live

- `instructions.md` -- operational rules and recommended workflows
- `examples.md` -- copy-paste examples you can give Claude

## Requirements

GoldHold MCP access (either):
- Remote OAuth MCP: https://mcp.goldhold.ai/mcp
- Local MCP server: `npx -y @goldhold/mcp-server`

Auth uses a GoldHold API key:
- `GOLDHOLD_API_KEY=gold_...` from https://goldhold.ai/account
