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

# How to explain things to the user

The user is not an IT specialist and mostly works from an Android phone.
- Give step-by-step instructions, one action per step, numbered.
- Describe exactly what they will see: the shape of the button (three horizontal
  lines, three vertical dots, a gear, an arrow), its colour, where it sits on the
  screen (top-left, bottom-right) and the exact words on it.
- Say what the screen should look like after each tap, so they know it worked.
- Never say only "go to Settings" or "click X" without describing where it is.
- Give solutions, not roadblocks: if something can't be done here, say where it
  can be done and give the clickable link or the exact next step.
- When the user asks to remember something, save it in this file and give them
  a link to tap to make it permanent.
