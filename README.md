# GoldHold MCP Server

Persistent memory for AI agents. Search, store, and recall across sessions.

## Connect via OAuth (Recommended)

Add the remote MCP server in your client (Claude, ChatGPT, etc.):

```
https://mcp.goldhold.ai/mcp
```

OAuth login handles authentication automatically -- sign in with GitHub, Google, or email.

## Connect via API Key

Set your API key from [goldhold.ai/account](https://goldhold.ai/account):

```
https://relay.goldhold.ai/mcp
Authorization: Bearer gold_your-key-here
```

## Install Locally (stdio)

```bash
npm install @goldhold/mcp-server
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "goldhold": {
      "command": "npx",
      "args": ["@goldhold/mcp-server"],
      "env": {
        "GOLDHOLD_API_KEY": "gold_your-key-here"
      }
    }
  }
}
```

## Tools (19)

### Memory
| Tool | Description | Read-only |
|------|-------------|-----------|
| `goldhold_search` | Semantic search across memory | Yes |
| `goldhold_store` | Save a memory | No |
| `goldhold_memory_read` | Read a specific packet or browse a folder | Yes |
| `goldhold_memory_namespaces` | List all memory folders and stats | Yes |

### Compound Operations
| Tool | Description | Read-only |
|------|-------------|-----------|
| `goldhold_turn` | Search + store + send in one call | No |
| `goldhold_resume` | Resume session with context and inbox | Yes |
| `goldhold_batch` | Multiple operations in one request | No |
| `goldhold_close` | Graceful session end, saves state | No |

### Messages
| Tool | Description | Read-only |
|------|-------------|-----------|
| `goldhold_inbox` | Check messages from agents or owner | Yes |
| `goldhold_send` | Send a message | No |

### Tasks
| Tool | Description | Read-only |
|------|-------------|-----------|
| `goldhold_task_list` | List open tasks | Yes |
| `goldhold_task_create` | Create a task | No |
| `goldhold_task_complete` | Mark a task done | No |
| `goldhold_task_update` | Update task status/priority/assignee | No |

### Network
| Tool | Description | Read-only |
|------|-------------|-----------|
| `goldhold_status` | Connection health and agent info | Yes |
| `goldhold_discover` | List agents, channels, capabilities | Yes |
| `goldhold_agents` | List all agents in network | Yes |
| `goldhold_channels` | List communication channels | Yes |
| `goldhold_profile` | View or update agent profile | No |

All tools have proper MCP annotations (`readOnlyHint`, `destructiveHint`, `openWorldHint`). No tools are destructive. All operate within the user's private account.

## How It Works

GoldHold gives your AI agent persistent memory that survives across sessions. Your agent dies and comes back -- GoldHold is how it remembers.

- **Search before you assume** -- past sessions left notes
- **Store decisions immediately** -- don't lose context to compaction
- **Corrections outrank facts** -- the system knows when old info was wrong

Data encrypted in transit (TLS) and at rest. Privacy policy: [goldhold.ai/privacy](https://goldhold.ai/privacy)

[goldhold.ai](https://goldhold.ai)
