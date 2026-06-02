# TOEFL Coach Architecture Package

Date: 2026-06-02

This folder contains the product, technical, agent-coordination, and strategy architecture for the TOEFL coach app.

## Start Here

1. `TOEFL_Coach_App_Architecture.md` - target production architecture for the app.
2. `STRATEGY_CARD_CATALOG.md` - concrete TOEFL strategy cards, cues, traps, repair drills, and subagent generation rules.
3. `REFACTOR_ROADMAP.md` - phased refactor and production-readiness roadmap.
4. `AGENT_COORDINATION.md` - roles, handoffs, quality gates, and coordination rules for coding/content/test-generation agents.
5. `APP_AUDIT.md` - records the current app source audit, constraints, and preferred refactor order.
6. `FOLDER_SYSTEM_BLUEPRINT.md` - folder-as-router rules for low-token AI work.
7. `AGENTS.md` - local operating rules for agents working in this TOEFL package.

## Current Status

The app source has been inspected at:

`/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`

The current app is a lean Next.js, Clerk, and Convex beta app with onboarding, diagnostic practice, mini mockups, review, error logging, local guest mode, and authenticated cloud sync. These documents now treat that app as the starting point. Agents should refactor and enrich the existing product instead of rebuilding from scratch.

## Product Constraints For First User-Ready App

- Follow the 80/20 rule: ship the smallest reliable learner loop that proves value.
- Preserve and improve existing app code, content, and flows before creating new systems.
- Use existing mini mockups and practice cards as seed content.
- Use agents to tag, enrich, validate, and create missing repair drills or variants, not to generate full TOEFL mock tests from scratch.
- Keep AI/model usage low: deterministic scoring first, cached explanations, compact prompts, and no live model call where static strategy cards work.
- Avoid unnecessary first-release features such as payments, coach dashboards, large admin panels, complex adaptive engines, or full generated test banks.
- First test-user onboarding must focus on: profile, target score/date, diagnostic or mini mock, review, exact next drill, and progress save.

The strategy catalog is based on the user-provided Andrew's Comprehensive TOEFL Study Guide 2.0 Notion page, transformed into original product logic rather than copied learner-facing content.

## Folder System Rule

This package follows a folder-as-workspace approach:

- Layer 1 map: `README.md`, `APP_AUDIT.md`, `FOLDER_SYSTEM_BLUEPRINT.md`, `AGENTS.md`
- Layer 2 task context: architecture, roadmap, coordination, and strategy docs
- Layer 3 tools/skills: only loaded when the task requires them

Agents should read the smallest relevant document first and avoid loading unrelated context.
