# Examples: GoldHold Persistent Memory Skill

Copy-paste examples that demonstrate correct GoldHold MCP usage.

## Example 1: Restore at session start

User: "What were we doing last time?"

Assistant (tool call):
- `goldhold_preflight`

Assistant (response):
- Summarize the restored checkpoint and list the next actions.

## Example 2: Store a preference, then recall it

User: "Remember I prefer dark mode and compact tables."

Assistant:
- Call `goldhold_store` with:
  - subject: "UI preference"
  - body: "User prefers dark mode and compact tables."

Later:
User: "What UI style do I like?"
Assistant:
- Call `goldhold_search` query: "UI preference dark mode compact tables"
- Answer with the stored preference.

## Example 3: Compound turn (search + store)

User: "We decided last week to use OAuth. Also note that we must support Streamable HTTP."

Assistant:
- Call `goldhold_turn` with:
  - search.query: "what did we decide about auth"
  - store: [{ subject: "MCP auth decision", body: "Use OAuth 2.0 / OAuth 2.1 flow for MCP connection. Support Streamable HTTP transport.", type: "DECISION" }]

## Example 4: Tasks

User: "Add a task to ship the directory submission."

Assistant:
- Call `goldhold_task_create` description: "Ship Anthropic MCP Directory submission" priority: high

User: "What tasks are open?"
Assistant:
- Call `goldhold_task_list`

## Example 5: Verify connectivity

User: "Are we connected?"
Assistant:
- Call `goldhold_status`
