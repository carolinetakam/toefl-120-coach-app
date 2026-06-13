# Agent Tool Loop Protocol

Use this protocol to keep TOEFL 120 Coach agents productive without burning tokens in repeated inspect/test/build loops.

## Default Limits

For normal implementation turns:

- Max steps per message: 8
- Tool call limit: 25

For inspection-only turns:

- Max steps per message: 4
- Tool call limit: 12

For verification-only turns:

- Max steps per message: 4
- Tool call limit: 8

For emergency bugfix turns:

- Max steps per message: 12
- Tool call limit: 35

## Goal-Assigned Turns

When an agent has an active goal assigned, allow more room but require checkpoints.

- Goal max steps per message: 12
- Goal tool call limit: 35
- Hard ceiling max steps: 16
- Hard ceiling tool calls: 45

Do not let goal mode run unlimited. Goal mode is for sustained progress, not unbounded exploration.

## Checkpoint Rule

At 12 steps, or when the tool call limit is reached, the agent must stop and report:

- Current objective status
- Files changed
- Tests/builds run
- What passed
- What is blocked or still unverified
- Next highest-ROI action
- Exact next command, when applicable

If the agent reaches the max step or tool-call cap twice on the same goal without passing the relevant gates, it must stop coding and hand off a concise blocker report.

## Gate Discipline

Run only the gates needed for the change.

Preferred sequence:

1. Run the focused test once.
2. Run the full test suite once.
3. Run TypeScript once.
4. Run lint once.
5. Run production build once.

If one gate fails, fix only that failure and rerun only the failed gate. Do not rerun the entire gate sequence after every small edit.

## Tool Loop Guardrails

After 15 tool calls, the agent must state the current blocker or the next exact edit before continuing.

After 25 tool calls, the agent must stop, summarize evidence, and hand off the next command unless the task is explicitly in goal mode.

Avoid repeating broad scans. Prefer targeted reads after the first inspection pass.

Use this order for codebase search:

1. `rg` for text search.
2. `rg --files` for file discovery.
3. Targeted `sed` or `nl` reads for exact context.

## TOEFL App Defaults

Use these settings for this repository:

- Normal turn: 8 steps, 25 tool calls
- Goal turn: 12 steps, 35 tool calls
- Hard ceiling: 16 steps, 45 tool calls

Use a higher limit only for browser verification or a failing production build that has a clear, narrow failure.

## Definition Of Useful Progress

A step counts as useful only if it does at least one of these:

- Narrows the current unknown
- Edits a file toward the active objective
- Runs a relevant verification gate
- Interprets a failed gate into a specific next edit
- Produces a handoff that reduces future work

Repeated status checks, broad searches, or rerunning the same passing gate do not count as useful progress.
