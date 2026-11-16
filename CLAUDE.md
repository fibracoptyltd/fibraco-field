# Cost policy: model routing for agents

Be cash conscious. The main session may run on Fable, but sub-agents must NOT
default to Fable. Always pass an explicit `model` when spawning an agent, or use
one of the agents in `.claude/agents/`, which already pin their model.

| Task | Model | Agent to use |
|---|---|---|
| Fetching / finding / reading documents, files, web pages, Drive, Slack, monday.com lookups | **sonnet** | `doc-fetcher` |
| Simple mechanical edits, formatting, bulk renames, summarising short text | **sonnet** | `worker` |
| Reviewing documents, code, contracts, quotes, specs; checking work for errors | **opus** | `doc-reviewer` |
| Planning / architecture decisions on non-trivial changes | **opus** | `planner` |
| Only the hardest reasoning, or when the user explicitly asks for it | **fable** | (main session) |

Rules:
1. Never spawn a sub-agent on Fable unless the user explicitly asks for it.
2. Prefer doing a small lookup directly over spawning any agent at all.
3. Keep agent prompts narrow so they finish quickly and cost less.
4. If a Sonnet result is clearly not good enough, escalate to Opus, not Fable.
