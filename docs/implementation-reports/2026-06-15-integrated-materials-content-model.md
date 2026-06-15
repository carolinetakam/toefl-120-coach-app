# Implementation Report: Integrated Materials Content Model

Date/time: 2026-06-15 15:28 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` / `21d23ae`  
Owner/agent: Prompt Support + Integrated Materials Agent

## 1. Status

Done.

## 2. Objective

Add production-safe content model support for integrated speaking/writing materials, label summary-only/template-only support content, and prevent incomplete integrated tasks from producing learner-answer scores.

## 3. Starting point / handoff used

Used the user P2 assignment and required route: `docs/PROJECT_STATUS.md`, `docs/NEXT_PHASE_HANDOFF.md`, latest relevant implementation report, architecture `README.md`, `FOLDER_SYSTEM_BLUEPRINT.md`, `APP_AUDIT.md`, then owned source files and focused tests.

## 4. Files changed

- `lib/types.ts`: added response-mode, source-material-completeness, and integrated-material fields.
- `lib/mock-tests.ts`: added structured speaking/writing task records with templates, examples, source materials, and answerability guards.
- `lib/seed.ts`: labeled integrated practice cards with summary-only/template-only source completeness and materials.
- `lib/content-metadata.ts`: propagated response mode/completeness into approved metadata and labeled summary-only reading questions.
- `lib/scoring.ts`: small adjacent guard so template-only speaking/writing support cards cannot be scored as learner answers.
- `tests/mock-tests.test.ts`: added integrated task material and incomplete-task guard coverage.
- `tests/content-metadata.test.ts`: added response-mode and summary/template label coverage.
- `tests/scoring.test.ts`: added template-only scoring rejection coverage.

## 5. What shipped

The content/model layer can now tell answerable learner tasks from summary-only or template-only support material. Mini mock speaking/writing tasks include structured materials, templates, and examples while preserving existing prompt fields for UI compatibility. Incomplete integrated tasks now fail loudly instead of creating fake learner score signals.

## 6. What was verified

Commands run with:

```bash
export PATH=/Users/carolinetakam/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:./node_modules/.bin:$PATH
```

- `vitest run tests/mock-tests.test.ts tests/content-metadata.test.ts tests/scoring.test.ts --pool=threads` -> 3 files passed, 22 tests passed.
- `tsc --noEmit` -> PASS.

## 7. What remains unverified

Full app suite, lint, production build, and browser UI flow were not run for this scoped P2 content-model pass. UI components may still need to consume the new response-mode fields to hide answer controls before submit.

## 8. Beta/onboarding decision

No change. External beta remains blocked by the existing production sync, backup/reset/import, and support email manual checks.

## 9. Risks / rollback notes

This is additive except for scoring guards on template-only support cards. If a UI route still allows submitting one of those cards, the model now throws instead of scoring it; the next UI owner should hide or route template-only cards as support material.

## 10. Next smallest useful step

UI/progression owner should read `card.responseMode`, `metadata.responseMode`, and `canCollectPracticeCardResponse` to avoid showing answer/submit controls for template-only support cards.
