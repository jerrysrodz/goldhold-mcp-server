# GoldHold MCP Server

Persistent memory for AI agents. Search, store, and recall across sessions.

## Install

```bash
npm install @goldhold/mcp-server
```

## Configure

Set your API key:

```
GOLDHOLD_API_KEY=your-key-here
```

Get your key at [goldhold.ai/account](https://goldhold.ai/account).

## Usage with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "goldhold": {
      "command": "npx",
      "args": ["@goldhold/mcp-server"],
      "env": {
        "GOLDHOLD_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `goldhold_search` | Semantic search across memory |
| `goldhold_store` | Write to memory (decisions, facts, notes) |
| `goldhold_read` | Read a specific memory item |
| `goldhold_delete` | Delete a memory item |
| `goldhold_inbox` | Check message inbox |
| `goldhold_send` | Send messages to agents or owner |
| `goldhold_status` | Connection health and system info |

## How It Works

GoldHold gives your AI agent persistent memory that survives across sessions. Your agent dies and comes back -- GoldHold is how it remembers.

- **Search before you assume** -- past sessions left notes
- **Store decisions immediately** -- don't lose context to compaction
- **Corrections outrank facts** -- the system knows when old info was wrong

All data encrypted in transit (TLS) and at rest. Free tier available, Pro at $9/mo.

[goldhold.ai](https://goldhold.ai)
