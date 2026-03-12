# GoldHold ChatGPT App -- Test Cases

## Test Case 1: Store and Recall a Memory
**User prompt:** "Remember that my dog's name is Biscuit and he's a golden retriever."
**Expected tool call:** `goldhold_store` with subject like "Dog's name" and body containing "Biscuit" and "golden retriever"
**Expected response:** Confirmation that the memory was stored.
**Follow-up prompt:** "What's my dog's name?"
**Expected tool call:** `goldhold_search` with query about "dog" or "pet"
**Expected response:** Returns "Biscuit" and "golden retriever" from the stored memory.

## Test Case 2: Create and List Tasks
**User prompt:** "Add a task to buy groceries, high priority."
**Expected tool call:** `goldhold_task_create` with description "buy groceries" and priority "high"
**Expected response:** Confirmation with task ID.
**Follow-up prompt:** "What tasks do I have?"
**Expected tool call:** `goldhold_task_list`
**Expected response:** Shows the "buy groceries" task with high priority and open status.

## Test Case 3: Check Status
**User prompt:** "Is my GoldHold connected?"
**Expected tool call:** `goldhold_status`
**Expected response:** Shows connection is healthy with agent info. No internal IDs or telemetry exposed beyond what's needed.

## Test Case 4: Send and Check Messages
**User prompt:** "Send a message to the owner saying the weekly report is ready."
**Expected tool call:** `goldhold_send` with to="owner", subject about "weekly report", body about report being ready
**Expected response:** Confirmation message was sent.
**Follow-up prompt:** "Check my inbox."
**Expected tool call:** `goldhold_inbox`
**Expected response:** Shows inbox contents (may include the sent message or other messages). Clean formatting with sender, date, subject, preview.

## Test Case 5: Browse Memory Folders
**User prompt:** "What memory folders do I have?"
**Expected tool call:** `goldhold_memory_namespaces`
**Expected response:** Lists available folders (e.g., decisions, preferences, people, work) with stats. No internal system IDs leaked.

---

## Notes for Reviewers
- All tools operate within the user's private GoldHold account
- No data is posted publicly or sent to external services
- OAuth login via GitHub, Google, or email magic link (no 2FA required)
- Test credentials provided separately
- All tools have correct readOnlyHint, destructiveHint, and openWorldHint annotations
