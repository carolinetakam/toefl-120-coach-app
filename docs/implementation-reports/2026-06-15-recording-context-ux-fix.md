# Implementation Report: Recording Context UX Fix

Date/time: 2026-06-15 14:32 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / local changes after prior auth-state and smoke-test work  
Owner/agent: Codex

## 1. Status

Done locally. Not deployed in this phase.

## 2. Objective

Implement the first priority slice of the non-structural UX improvement plan without changing routes, pages, navigation model, dashboard, path, library, progress, mini mock, or exercise/card systems.

## 3. Starting point / handoff used

Used:

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/architecture/TOEFL_Coach_Architecture/README.md`
- `docs/architecture/TOEFL_Coach_Architecture/FOLDER_SYSTEM_BLUEPRINT.md`
- `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`
- `docs/Frontend_Building_Process_Package/AGENT_MAP.md`
- `docs/Frontend_Building_Process_Package/agent-handoff/FRONTEND_AGENT_HANDOFF.md`
- `docs/Frontend_Building_Process_Package/process/FRONTEND_BUILD_PROCESS.md`
- `docs/Frontend_Building_Process_Package/reference/MYRIAD_FRONTEND_PHILOSOPHY.md`
- `docs/Frontend_Building_Process_Package/reference/UI_COMPONENT_SPEC.md`
- `docs/Frontend_Building_Process_Package/checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md`

Read-only subagents inspected recording/context, prompt/material support, and progress/completion behavior before implementation.

## 4. Files changed

- `components/coach-app.tsx`
  - Added `TaskContext`, `RecorderState`, and `MicrophonePermissionState` models.
  - Carries source page, day, prompt, title, note, task id/type, and return target into the recording flow.
  - Preserves mini mock speaking context when the learner opens Practice > Speaking to record evidence.
  - Replaces the small recording toggle with a visible recorder panel showing prompt context, state, duration, permission status, playback, stop, re-record, and return controls.
  - Adds browser microphone permission checks and denied-state help copy.
  - Changes writing/speaking completion buttons from “Save” wording to “Submit” wording.
  - Labels current required practice actions as `Required Repair` and optional sprint actions as `Optional Practice`.
  - Avoids showing “choose another card” copy unless related cards are available.
- `app/globals.css`
  - Added recorder panel, task context, permission panel, record button, and timer styles using existing app tokens.

## 5. What shipped

- Recording opened from the path/mini mock flow now keeps visible task context instead of becoming a generic Library recording surface.
- The recorder is visually dominant and shows a large Record button, Stop, Re-record, duration, playback state, and microphone status.
- Blocked microphone access now has explicit recovery copy and an inline help panel.
- Practice completion language now separates drafts/local state from submitted attempts.
- Required repair and optional practice are clearer in Path cards.

## 6. What was verified

Automated checks:

- `tsc --noEmit` -> PASS.
- `eslint components/coach-app.tsx` -> PASS.
- `eslint .` -> PASS.
- `vitest run tests/progression.test.ts tests/repair-path.test.ts tests/storage.test.ts tests/proof-loop-smoke.test.ts --pool=threads` -> PASS, 4 files / 25 tests.
- `vitest run` -> PASS, 25 files / 121 tests.
- `next build --webpack` -> PASS, compiled successfully and generated 9 static pages.

Browser verification:

- In-app Browser plugin was unavailable in this session (`iab` unavailable).
- Used bundled Playwright against local production server `next start -p 3004`.
- Desktop `1440x1000`: guest -> profile -> diagnostic -> Path -> start speaking drill showed recorder panel, Record button, task prompt context, Return to Path, and no horizontal overflow.
- Mobile `390x844`: same flow showed recorder panel, Record button, task prompt context, Return to Path, and no horizontal overflow.

## 7. What remains unverified

- Real browser microphone permission prompt/denied behavior was not clicked because accepting/denying browser permissions is a manual environment action.
- Real audio capture was not verified with a physical microphone.
- This change has not been deployed to production.
- Real production Clerk/Convex signed-in account flow remains unverified in this phase.

## 8. Beta/onboarding decision

**BETA BLOCKED**

This improves local user experience for recording and repair clarity, but external beta remains blocked until production signed-in sync, backup/reset/import restore, and support email checks pass.

## 9. Risks / rollback notes

- Audio remains local/browser-only; persistent state stores audio evidence, not durable audio playback.
- `TaskContext` is UI state, not a backend attempt contract.
- If recorder behavior regresses, rollback is limited to `components/coach-app.tsx` recorder/context changes and the recorder CSS block in `app/globals.css`.

## 10. Next smallest useful step

After production smoke blockers are cleared or while another agent owns them, implement the Priority 2 non-structural UX slice:

1. add task timers to current task/card/mini mock screens;
2. add examples/templates to existing speaking/writing cards;
3. add structure trackers to speaking/writing tasks;
4. add missing-material fallback for integrated tasks.
