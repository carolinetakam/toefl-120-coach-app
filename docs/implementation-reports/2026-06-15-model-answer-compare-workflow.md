# Implementation Report: Model Answer Compare Workflow v1

Date/time: 2026-06-15 22:11 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` local working tree before commit  
Owner/agent: Codex

## 1. Status

Done.

## 2. Objective

Implement the smallest production-ready version of the Model Answer & Compare Workflow v1 from the product, technical, and acceptance specs: every Speaking/Writing task should expose a model answer in-task, and submitted learner work should get a checklist-only compare step without AI, official TOEFL scoring, or audio-based scoring claims.

## 3. Starting point / handoff used

- `docs/PROJECT_STATUS.md`
- `docs/NEXT_PHASE_HANDOFF.md`
- `docs/implementation-reports/2026-06-15-timer-structure-tracker-ui.md`
- `docs/architecture/TOEFL_Coach_Architecture/README.md`
- `docs/architecture/TOEFL_Coach_Architecture/FOLDER_SYSTEM_BLUEPRINT.md`
- `docs/architecture/TOEFL_Coach_Architecture/APP_AUDIT.md`
- `docs/Frontend_Building_Process_Package/AGENT_MAP.md`
- `docs/Frontend_Building_Process_Package/agent-handoff/FRONTEND_AGENT_HANDOFF.md`
- `docs/Frontend_Building_Process_Package/process/FRONTEND_BUILD_PROCESS.md`
- `docs/Frontend_Building_Process_Package/reference/UI_COMPONENT_SPEC.md`
- `docs/Frontend_Building_Process_Package/checklists/FRONTEND_ACCEPTANCE_CHECKLIST.md`
- `docs/Model Answer & Compare Workflow v1-Product Specification .rtf`
- `docs/Model Answer & Compare Workflow v1 - Technical Specification.rtf`
- `docs/Model Answer & Compare Workflow v1 - Acceptance Specification.rtf`

## 4. Files changed

- `lib/types.ts`: added shared `ModelAnswer` content contract and optional `modelAnswer` on practice cards.
- `lib/seed.ts`: added approved seed model answers to all Speaking and Writing practice cards, including template-only support cards.
- `lib/mock-tests.ts`: added model answers to every mini mock Speaking and Writing task.
- `components/model-answer/model-answer-card.tsx`: new reusable in-task model answer card.
- `components/model-answer/ets-expectations-card.tsx`: new reusable "What ETS Wants" card.
- `components/model-answer/answer-comparison-card.tsx`: new checklist-only compare card.
- `components/coach-app.tsx`: wired model answer / ETS cards into Speaking and Writing practice and mini mock surfaces; added post-submit comparison cards.
- `app/globals.css`: added styles for model answer, expectation, and compare cards.
- `tests/model-answers.test.ts`: verifies model-answer coverage for every Speaking/Writing practice card and mini mock task.
- `tests/model-answer-workflow-ui.test.ts`: verifies UI wiring, compare workflow wiring, and no AI/audio scoring claims in the workflow.

## 5. What shipped

- Speaking and Writing practice tasks now show `What ETS Wants` and `Model Answer` in the same task screen before the learner records or writes.
- Mini mock Speaking and Writing tasks now show the same in-task model answer workflow.
- After a Speaking/Writing practice submission or mini mock submission, the app shows:
  - learner response/reflection or notes;
  - model answer;
  - functional checklist comparison.
- Reading and Listening behavior is unchanged except existing answer explanations.
- No new AI dependency, official TOEFL score claim, GPT feedback, or audio-based scoring was introduced.

## 6. What was verified

Commands run from `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`:

- `./node_modules/.bin/vitest run tests/model-answers.test.ts tests/model-answer-workflow-ui.test.ts --pool=threads` -> focused tests passed after assertion adjustment.
- `./node_modules/.bin/vitest run --pool=threads` -> 34 test files passed, 152 tests passed.
- `./node_modules/.bin/tsc --noEmit` -> PASS after `next build` regenerated `.next/types`; an earlier parallel run failed because `.next/types` was being regenerated at the same time.
- `./node_modules/.bin/eslint .` -> PASS.
- `./node_modules/.bin/next build --webpack` -> PASS, compiled successfully and generated 9 static pages.
- `./node_modules/.bin/next start --port 3002` -> local production server started.
- Bundled headless Chromium guest smoke on `http://localhost:3002`:
  - fresh signed-out state reached guest mode after auth timeout;
  - onboarding and diagnostic completed locally;
  - Library full practice opened;
  - Speaking task showed in-task `Model Answer`, `High 4/5 speaking signal`, and `What ETS Wants`;
  - submitting a speaking reflection showed `Compare Yourself`, learner answer, model answer, and comparison checklist;
  - no `AI scoring`, `GPT feedback`, or `audio-based scoring` claim appeared;
  - no desktop or mobile horizontal overflow detected.

## 7. What remains unverified

- Production deployment of this workflow was not performed in this phase.
- Signed-in production persistence of the new workflow was not manually checked.
- Real microphone recording was not used; this workflow intentionally uses checklist/self-review and does not claim audio scoring.
- Full production beta smoke, backup/import restore, and support email checks remain unverified.

## 8. Beta/onboarding decision

No change. External beta remains blocked by the existing production signed-in sync matrix, backup/export/reset/paste-import restore smoke, and support email send/receive verification.

## 9. Risks / rollback notes

- Model answers are static approved seed content; rollback is straightforward by reverting the model-answer component wiring and seed content additions.
- Speaking compare uses learner reflection/audio-evidence note rather than speech transcription. This is truthful for the current app because there is no speech-to-text or audio scoring pipeline.
- Template-only cards expose model use of the scaffold but still do not collect learner answers.

## 10. Next smallest useful step

After this commit is deployed, rerun the existing production smoke checklist with a real signed-in account and confirm the new Speaking/Writing model answer cards persist visually in signed-in production flows.
