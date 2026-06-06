# Frontend Agent Handoff

You are building the frontend for an app in Caroline's product style.

Read this before making UI or frontend implementation decisions.

## Core Instruction

Build the actual usable app experience first.

Do not build a generic landing page, fake dashboard, decorative mockup, or placeholder interface. The first screen should feel like the user has entered a serious product workspace.

## Required Reading In This Package

1. `process/FRONTEND_BUILD_PROCESS.md`
2. `reference/MYRIAD_FRONTEND_PHILOSOPHY.md`
3. `reference/UI_COMPONENT_SPEC.md`
4. `checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md`

## Build From Current Reality

Before changing code:

1. Inspect the current app source.
2. Identify the framework, routes, components, styles, data adapters, and existing UI patterns.
3. Reuse working structure where possible.
4. Improve, refactor, and enrich the existing frontend instead of rebuilding from scratch.

Do not ask the user for work an agent can do itself.

## Product Feel

The app should feel:

- calm
- capable
- premium
- focused
- operational
- tactile
- clear
- ready for real users

It should not feel:

- like a generic admin template
- like a marketing landing page
- like a playful toy unless the product is a game
- like a dark terminal
- like a fake analytics mockup
- like a collection of decorative cards

## First Screen Rule

The first screen should show:

- product identity
- active user/workspace/business/project context
- current system or data status
- primary workflow or decision surface
- next useful action

If the app is a workflow tool, show the workflow.
If it is a dashboard, show real operational status.
If it is an AI app, show what the AI is doing, what it used, and what needs human decision.

## Production Truthfulness

Never imply production work happened unless it actually happened.

Examples:

- Do not say an item was published unless a publish mutation/job/integration ran.
- Do not show fake live counts as real data.
- Do not hide demo/local state.
- Do not pretend AI output is validated when it is not.
- Do not ship placeholder buttons that appear to perform real actions.

## Human Agency Principle

The UI must preserve human agency.

Avoid:

- manipulative urgency
- addictive checking loops
- infinite feeds
- dark patterns
- hidden exits
- red-alert abuse
- unexplainable automation

Prefer:

- clear choices
- visible state
- finite workflows
- calm next actions
- explainable automation
- human approval where authority matters

## Expected Final Work

When done, the frontend should be:

- visually polished
- responsive
- accessible
- state-complete
- connected to real app data or truthfully labeled local/demo data
- tested or manually verified
- production-shaped, not a stub
- consistent with the shared button, card, panel, input, badge, progress, and navigation specs
