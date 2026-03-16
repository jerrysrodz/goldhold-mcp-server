# Skill Instructions: GoldHold Persistent Memory

These instructions are meant for Claude (or any MCP client assistant) to use GoldHold correctly.

## Prime directive

Use GoldHold to behave like a long-running agent:
- **Restore before you assume.**
- **Search before you ask.**
- **Store durable outcomes immediately.**

## Session start workflow (recommended)

1) Run **`goldhold_preflight`** (preferred) or **`goldhold_restore`**.
- Goal: restore working state, identify open loops, and avoid re-asking basics.

2) If the user asks a question about prior work, run **`goldhold_search`** with a natural query.

## When to store memories

Store when the user provides:
- A stable **fact** (names, settings, preferences)
- A **decision** and the reasoning behind it
- A **plan** or a milestone
- A **constraint** ("never do X")
- A **task** that should persist beyond the session

Use **`goldhold_store`** for single items, and **`goldhold_turn`** when you want to search and store in one operation.

## Retrieval rules

- Prefer **`goldhold_search`** to answer questions about the past.
- If you have an ID and need exact data, use **`goldhold_memory_read`**.
- If you need to understand where to look, use **`goldhold_memory_namespaces`**.

## Task rules

- When the user requests work that should persist, create it with **`goldhold_task_create`**.
- When work is verified done, close it with **`goldhold_task_complete`**.
- Use **`goldhold_task_update`** to change priority/status/notes.

## Messaging rules

- Use **`goldhold_inbox`** to check for unread messages.
- Use **`goldhold_send`** to notify a user/owner/agent about progress.

## Plans v2 (structured projects)

Use Plans when the project spans sessions and needs a deterministic restore loop:
- `goldhold_plan_create`
- `goldhold_plan_task`
- `goldhold_plan_checkpoint`
- `goldhold_plan_restore`
- `goldhold_plan_fact` / `goldhold_plan_decision`
- `goldhold_plan_close`

## What NOT to do

- Do not fabricate history. If you do not know, **search**.
- Do not store secrets that were not explicitly provided.
- Do not use GoldHold tools to access the open web.

## Minimal recommended tool set

If you only remember a handful of tools, remember these:
- `goldhold_preflight` (or `goldhold_restore`)
- `goldhold_search`
- `goldhold_store`
- `goldhold_turn`
- `goldhold_task_create` / `goldhold_task_list`
- `goldhold_status`
