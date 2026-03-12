# GoldHold -- ChatGPT App Directory Submission

## App Info
- **Name:** GoldHold
- **Tagline:** Persistent memory for AI agents
- **Description:** GoldHold gives ChatGPT persistent memory that survives across sessions. Store decisions, preferences, tasks, and context -- then recall them instantly with semantic search. Your agent dies and comes back, but GoldHold is how it remembers. Supports 30 organized memory folders, task management, inter-agent messaging, and session continuity.
- **Category:** Productivity / Developer Tools
- **Website:** https://goldhold.ai
- **Privacy Policy:** https://goldhold.ai/privacy
- **MCP Server URL:** https://mcp.goldhold.ai/mcp
- **OAuth Discovery:** https://mcp.goldhold.ai/.well-known/oauth-authorization-server

## Test Credentials
- **Method:** API key (paste on the authorize page under "I have my API key")
- **API Key:** gold_demo_s0rbwzqjh7a4nc1p29okfuml
- **Account:** demo@goldhold.ai (lite tier, fully functional)
- **No 2FA required**
- **Pre-loaded sample data:** 3 memories (dog info, coffee preference, Q2 project), 2 tasks, ~40 demo context memories

## Test Cases

### Test 1: Store and Recall
1. Say: "Remember that my dog's name is Biscuit and he's a golden retriever."
2. Expected: goldhold_store called, confirmation returned
3. Say: "What's my dog's name?"
4. Expected: goldhold_search called, returns "Biscuit" / "golden retriever"

### Test 2: Task Management
1. Say: "Add a task to buy groceries, high priority."
2. Expected: goldhold_task_create called, task ID returned
3. Say: "What tasks do I have?"
4. Expected: goldhold_task_list called, shows tasks including the new one

### Test 3: Connection Check
1. Say: "Is my GoldHold connected?"
2. Expected: goldhold_status called, shows healthy connection

### Test 4: Messaging
1. Say: "Send a message to the owner saying the weekly report is ready."
2. Expected: goldhold_send called, confirmation returned
3. Say: "Check my inbox."
4. Expected: goldhold_inbox called, shows messages

### Test 5: Memory Browsing
1. Say: "What memory folders do I have?"
2. Expected: goldhold_memory_namespaces called, lists folders

## Tool Annotations Summary
- 19 tools total
- 10 read-only (search, resume, inbox, status, discover, agents, memory_read, memory_namespaces, task_list, channels)
- 9 write (store, turn, batch, close, send, task_create, task_complete, task_update, profile)
- 0 destructive (no delete operations)
- 0 openWorld (all operations within user's private account)

## Screenshots Needed
1. OAuth consent screen (one-click authorize)
2. Memory search in action (ChatGPT searching + returning results)
3. Task creation flow
4. Status check showing healthy connection
