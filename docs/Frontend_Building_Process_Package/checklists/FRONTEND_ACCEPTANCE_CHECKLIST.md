# Frontend Acceptance Checklist

Use this before handing off frontend work.

## Product

- [ ] First screen is the usable app, not a landing page.
- [ ] Primary workflow is visible.
- [ ] User context is visible.
- [ ] Next useful action is clear.
- [ ] The app does not rely on long explanatory text.

## Design

- [ ] Interface feels calm, dense, premium, and operational.
- [ ] Buttons follow `reference/UI_COMPONENT_SPEC.md`.
- [ ] Cards and panels follow `reference/UI_COMPONENT_SPEC.md`.
- [ ] Inputs, badges, progress tracks, and navigation follow `reference/UI_COMPONENT_SPEC.md`.
- [ ] Accent color guides attention without dominating.
- [ ] Panels/cards have consistent treatment.
- [ ] Controls feel tactile and consistent.
- [ ] Typography hierarchy is clear.
- [ ] No decorative clutter or generic admin feel.

## State

- [ ] Loading states exist.
- [ ] Empty states are useful.
- [ ] Error states explain recovery.
- [ ] Permission/read-only states exist when needed.
- [ ] Data source status is visible.
- [ ] Demo/local/live boundaries are truthful.

## Actions

- [ ] Buttons perform real actions or are clearly disabled/local.
- [ ] No UI implies external publishing, saving, sending, or generation unless it happened.
- [ ] Important actions create records/audit events when the backend supports it.
- [ ] Authority-sensitive actions require human approval.

## Accessibility

- [ ] Icon buttons have accessible labels.
- [ ] Keyboard focus is visible.
- [ ] Controls are reachable.
- [ ] Text contrast is readable.
- [ ] Critical state is not hover-only.

## Responsive

- [ ] Desktop layout is verified.
- [ ] Mobile layout is verified.
- [ ] Navigation collapses cleanly.
- [ ] Text does not overlap.
- [ ] Buttons and cards do not resize unpredictably.
- [ ] Primary workflow remains usable on mobile.

## Technical

- [ ] Build passes.
- [ ] Tests pass where available.
- [ ] Console has no serious runtime errors.
- [ ] Data adapters are separate from UI where possible.
- [ ] Domain localStorage access is routed through a repository/adapter, not scattered in components.

## Final Handoff

- [ ] Changed files are summarized.
- [ ] Verification is reported.
- [ ] Remaining production gaps are stated honestly.
