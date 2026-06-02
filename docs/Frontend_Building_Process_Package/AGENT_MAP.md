# Frontend Building Process Map

Use this as the Layer 1 map for any agent building or updating an app frontend.

## Identity

This package defines Caroline's frontend build process: build the real usable app first, preserve human agency, use a calm premium operational style, keep state truthful, and verify before handoff.

## Routing

| Task | Read First | Read Next Only If Needed |
| --- | --- | --- |
| Start frontend work | `agent-handoff/FRONTEND_AGENT_HANDOFF.md` | `process/FRONTEND_BUILD_PROCESS.md` |
| Understand build sequence | `process/FRONTEND_BUILD_PROCESS.md` | `checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md` |
| Understand visual/product philosophy | `reference/MYRIAD_FRONTEND_PHILOSOPHY.md` | `reference/MYRIAD_SOURCE_POINTERS.md` |
| Check whether work is done | `checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md` | current app source and browser verification |
| Hand off to another agent | `agent-handoff/COPY_PASTE_PROMPT.md` | `README.md` |

## Rules

- Inspect the actual app source before making frontend changes.
- Build from the current app; do not rebuild blindly.
- Open into the useful product experience, not a landing page.
- Make user context, data status, primary workflow, and next action visible.
- Keep demo/local/live state truthful.
- Do not imply production actions happened unless real code, mutation, job, or integration supports it.
- Verify desktop and mobile UI before final handoff.

## Tools

- Use shell/code tools to inspect and edit the app.
- Use Browser to verify local frontend behavior and screenshots after meaningful UI changes.
- Use Myriad source pointers only when the agent needs to inspect the original inspiration.
