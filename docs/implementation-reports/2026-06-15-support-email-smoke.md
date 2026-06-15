# Implementation Report: Support Email Smoke

Date/time: 2026-06-15 22:22 KST  
Repo: `/Users/carolinetakam/Documents/Apps/toefl-120-coach-app-only`  
Branch/head: `main` local working tree after `626eb02`  
Owner/agent: Codex

## 1. Status

Partial smoke completed. Inbox receipt remains unverified.

## 2. Objective

Test `support@score120coach.com` enough to determine whether the beta support path can be cleared.

## 3. Starting point / handoff used

The current launch docs list real support email send/receive verification as one of the external beta blockers.

## 4. Files changed

- `docs/implementation-reports/2026-06-15-support-email-smoke.md`: records the support email smoke result.
- `docs/PROJECT_STATUS.md`: records partial support email evidence and keeps beta blocked.
- `docs/NEXT_PHASE_HANDOFF.md`: adds a support email smoke addendum and next action.

## 5. What shipped

No product code shipped. This was an operational smoke test only.

## 6. What was verified

Commands run from repo root:

- `curl -fsS -o /tmp/toefl-support-page.html -w '%{http_code} %{url_effective}\n' https://score120coach.com/support`
  - Result: `200 https://score120coach.com/support`
  - The production support page displays `support@score120coach.com` and a `mailto:support@score120coach.com?...` link.
- `dig +short MX score120coach.com`
  - Result:
    - `94 route1.mx.cloudflare.net.`
    - `45 route3.mx.cloudflare.net.`
    - `35 route2.mx.cloudflare.net.`
- `dig +short TXT score120coach.com`
  - Result: `"v=spf1 include:_spf.mx.cloudflare.net ~all"`
- `dig +short TXT _dmarc.score120coach.com`
  - Result: no DMARC record returned.
- `nc -vz -w 8 route1.mx.cloudflare.net 25`, `route2`, and `route3`
  - Result: TCP port 25 reachable on all three Cloudflare MX hosts.
- Non-DATA SMTP recipient check against `route1.mx.cloudflare.net`
  - Result: server returned `250 2.1.0 Ok` for `MAIL FROM:<codex-smoke@score120coach.com>` and `RCPT TO:<support@score120coach.com>`.
- Raw unauthenticated DATA send attempt with subject `TOEFL 120 Coach support smoke test 2026-06-15 22:18 KST`
  - Result: rejected after DATA with `550 5.7.26 Cannot forward emails that are not authenticated`.

## 7. What remains unverified

- A real authenticated email sent from a normal mailbox to `support@score120coach.com`.
- Arrival in the monitored destination inbox behind Cloudflare Email Routing.
- Reply path from the monitored inbox.

## 8. Beta/onboarding decision

No change. External beta remains blocked because the required support email send/receive loop has not been proven.

## 9. Risks / rollback notes

- The support page and MX route are configured, but Cloudflare rejects unauthenticated raw SMTP messages. This is not proof that normal authenticated user email fails.
- No DMARC record was visible during this smoke. That is not necessarily a blocker for inbound routing, but it is worth adding before broader public launch.

## 10. Next smallest useful step

Caroline or an agent with access to an authenticated mailbox should send a normal email to `support@score120coach.com` with subject:

`TOEFL 120 Coach support smoke test`

Then confirm it arrives in the monitored inbox and record the result in `docs/PROJECT_STATUS.md`.
