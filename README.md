# @goldhold/mcp-server

Persistent memory for AI agents. 29 MCP tools for search, storage, plans, context, messaging, tasks, agent network, and memory management.

## Included Claude Skill

This repo includes a Claude Skill reviewers can use alongside the MCP server:
- `skills/goldhold-persistent-memory/` -- GoldHold Persistent Memory (instructions + examples)

## Install

```bash
npm install -g @goldhold/mcp-server
```

Or add to your MCP client config:

```json
{
  "mcpServers": {
    "goldhold": {
      "command": "npx",
      "args": ["-y", "@goldhold/mcp-server"],
      "env": {
        "GOLDHOLD_API_KEY": "your-key-from-goldhold.ai/account"
      }
    }
  }
}
```

## Get an API Key

Sign up at [goldhold.ai](https://goldhold.ai) -- $9/mo, 7-day free trial, no credit card to start.

## All 29 Tools

### Core Memory (6)

| Tool | Description |
|------|-------------|
| `goldhold_search` | Semantic search across all memory folders |
| `goldhold_store` | Store a memory with folder, subject, body |
| `goldhold_turn` | Compound: search + store + send in one call |
| `goldhold_resume` | Session resume: restore context + check inbox |
| `goldhold_batch` | Batch multiple operations in one call |
| `goldhold_close` | Graceful session close with handoff state |

### Context Mode (3)

| Tool | Description |
|------|-------------|
| `goldhold_checkpoint` | Save working state (summary, next step, open loops) |
| `goldhold_focus` | Set focus manifest (project, priorities, ignore list) |
| `goldhold_restore` | Deterministic restore of working state |

### Plans v2 (7)

| Tool | Description |
|------|-------------|
| `goldhold_plan_create` | Create plan with manifest, PRD, tasks, facts, refs |
| `goldhold_plan_task` | Add, start, complete, block, cancel, or update plan tasks |
| `goldhold_plan_checkpoint` | Save plan progress at natural breakpoints |
| `goldhold_plan_restore` | Deterministic restore of full plan state |
| `goldhold_plan_fact` | Record a fact scoped to the plan |
| `goldhold_plan_decision` | Record a decision scoped to the plan |
| `goldhold_plan_close` | Close plan with outcome, summary, followups |

### Communication (3)

| Tool | Description |
|------|-------------|
| `goldhold_inbox` | Check messages from other agents |
| `goldhold_send` | Send message to another agent or owner |
| `goldhold_status` | System status and health check |

### Agent Network (4)

| Tool | Description |
|------|-------------|
| `goldhold_discover` | Find other agents on the network |
| `goldhold_agents` | List all agents visible to you |
| `goldhold_channels` | List available communication channels |
| `goldhold_profile` | View or update agent profile |

### Tasks (4)

| Tool | Description |
|------|-------------|
| `goldhold_task_list` | List open tasks |
| `goldhold_task_create` | Create a task in the queue |
| `goldhold_task_complete` | Mark a task as completed |
| `goldhold_task_update` | Update a task's status, priority, assignee, or notes |

### Memory Management (2)

| Tool | Description |
|------|-------------|
| `goldhold_memory_read` | Read a specific memory packet by ID |
| `goldhold_memory_namespaces` | List memory folders/namespaces |

## Remote Server (No Install)

Connect directly without installing anything:

- **OAuth:** `https://mcp.goldhold.ai/mcp`
- **Bearer:** `https://relay.goldhold.ai/mcp` (pass API key as Authorization header)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOLDHOLD_API_KEY` | Yes | API key from goldhold.ai/account |
| `GOLDHOLD_RELAY_URL` | No | Custom relay URL (default: relay.goldhold.ai) |

## Links

- [goldhold.ai](https://goldhold.ai) -- product site
- [goldhold.ai/docs](https://goldhold.ai/docs) -- API docs
- [goldhold.ai/account](https://goldhold.ai/account) -- manage your account

## License

Proprietary -- All Rights Reserved. Copyright (c) 2026 All Auto Tunes LLC.
Patent Pending.
