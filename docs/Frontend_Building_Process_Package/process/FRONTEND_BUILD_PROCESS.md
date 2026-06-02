# Frontend Build Process

Use this process for every app frontend.

## 1. Inspect Before Building

Read the app source first.

Find:

- framework and routing
- current components
- styling approach
- data layer
- auth/session handling
- existing screens
- broken or placeholder areas
- current build/test commands

Use `rg --files`, `rg`, and focused file reads. Do not load the whole repo when a narrow read will work.

## 2. Define The First Useful Screen

Before writing UI, answer:

- What is the app?
- Who is using it?
- What job are they trying to do?
- What should they see first?
- What is the next useful action?
- What data/status must be truthful?

Then build that screen as the actual product experience.

## 3. Establish The App Shell

Most Caroline-style apps should use an operational shell:

- left sidebar or strong primary navigation
- visible product identity
- workspace/business/project context
- top bar with page title and status
- main workflow canvas
- compact status/action area

Mobile should collapse navigation without hiding active context.

## 4. Build Real Workflow Surfaces

Prioritize the product's core workflow over decorative sections.

Examples:

- marketing app: radar, analyze, generate, publish, learn
- learning app: profile, diagnostic, review, next drill, progress
- business app: target, offer, research, launch, metrics
- operations app: intake, queue, work, review, delivery
- AI app: input, agent work, output, approval, audit

The workflow should be visible, understandable, and controllable.

## 5. Use A Small Component System

Build reusable components for:

- app shell
- navigation item
- section header
- panel/card
- status badge
- data-source indicator
- primary/secondary/icon buttons
- tabs or segmented controls
- detail drawer/modal
- loading state
- empty state
- error state
- permission/read-only state

Do not create one-off styling for every screen.

## 6. Make State Truthful

Every major screen needs:

- loading
- empty
- ready
- needs attention
- error
- permission denied or read-only, when relevant

If data is local/demo, label it.
If an action is local-only, say so or disable production-like claims.
If a backend/integration is missing, show the readiness gap.

## 7. Apply The Visual System

Use the Myriad-inspired house style:

- warm off-white base
- soft raised panels
- tactile controls
- restrained shadows
- compact density
- one accent color
- editorial headings
- clean sans-serif UI text
- clear status dots/badges
- restrained motion

The interface should look expensive because it is clear, calm, and precise.

## 8. Preserve Human Agency

If automation or AI is involved, show:

- what happened
- what inputs were used
- what assumptions were made
- what risks or confidence level exist
- what needs human approval
- what the next action is

The system can assist. The user keeps authority.

## 9. Verify In Browser

After meaningful frontend changes:

- run build/test commands when available
- start the dev server
- open the app in the browser
- check desktop viewport
- check mobile viewport
- inspect console errors
- verify primary workflow
- verify text does not overlap
- verify buttons and cards remain stable
- verify loading/empty/error states where possible

Do not finish after code edits without verifying the UI.

## 10. Final Handoff

Report:

- what changed
- what files changed
- what was verified
- what remains blocked or production-incomplete

Do not bury known gaps.
