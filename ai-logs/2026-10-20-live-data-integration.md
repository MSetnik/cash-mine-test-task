# Live data integration — conversation log

Date: 2026-10-20. Branch: `live-data-integration`, based on `api-client-structure`.

Captured scope: the request, required decision questions and replies, and subsequent user-facing progress messages available in this turn. Earlier explanatory prose around the questions was compacted and is not reconstructed as a verbatim transcript. Private local paths are replaced by repository-relative links. Tool-event summaries are separate below.

## User

okay, i will check it out on git. I want you to now continue with the connecting UI with endpoints and live data

## Assistant — decision questions

For exact amount calculations, should we use decimal.js (less custom code, explicit USD rounding) or bigint smallest-unit arithmetic (no dependency, more scaling code)?

After submission, which balance approach should we use? The server-snapshot approach keeps reported numbers, shows the claim status, and blocks another claim until settlement and a newer snapshot. The reservation overlay subtracts locally and reconciles later.

For an unknown claim result, should recovery be user-triggered or automatic? Both preserve the same request and idempotency key across reloads and block new claims; known pending claims will poll until terminal.

## User — replies

1. decimal.js (Recommended)
2. Server snapshot + claim status (Recommended)
3. User-triggered same-key recovery (Recommended)

## Assistant

I’ll use those three choices: decimal.js for exact amounts, server-reported balances with visible claim status, and user-triggered recovery using the original request and key.

`★ Insight ─────────────────────────────────────`
A timed-out claim may still have succeeded. Saving its request before sending lets us recover safely after a reload. Balances will remain tied to the server’s snapshot timestamp, so a successful refresh won’t imply that settlement is already reflected.
`─────────────────────────────────────────────────`

## Assistant

The session and claim foundation is in place. Each token gets its own query cache and saved claim request, and a claim is saved before submission. Next I’m connecting the screens to those states and adding tests for exact amounts and recovery.

## Assistant

The screens now read live balances, claim rules, destinations, and activity. All 29 unit and API tests pass, including large decimal amounts, duplicate taps, same-key recovery after reload, and an unauthorized recovery attempt.

I’m checking the exported app in a phone-sized browser next, especially whether stale balances keep another claim blocked and whether recovery preserves the original request.

## Assistant

The live API returned `503 SERVER` on the latest balances check. I’ll record that and retry the read check once.

The browser test reached the unknown-outcome state, but its assertion matched a hidden screen retained by navigation as well as the visible screen. I’m correcting that selector so the test checks what the user actually sees.

## Assistant

The controlled browser checks passed: confirmation, double-click protection, reload recovery with the same body and key, pending-to-completed tracking, stale-snapshot blocking, pagination, rate limiting, and token replacement. The 390 px screenshots also look correct.

The live retry loaded all three balances, then received another `503` for claim options. I’ll document that API instability, finish the final checks, and push `live-data-integration`.

`★ Insight ─────────────────────────────────────`
The query cache is disposable; the saved claim request is not. Keeping them separate lets token changes clear screen data without losing the information needed to recover an uncertain claim.
`─────────────────────────────────────────────────`

## Assistant

Final checks pass: TypeScript, lint, all 29 tests, the web export, and the browser scenarios—including failed claims and expired-token replacement. I’m committing and pushing the branch now with the decision notes and sanitized logs.

Two limits are documented: live claim submission was tested with controlled responses, and claiming should use one active tab per token until cross-tab coordination is added.

## User

we need to wrap things up. I need to deploy changes in 5 minutes

## Assistant

I’m wrapping up now. The verified production build is ready in `dist/`; I’m committing and pushing `live-data-integration` so you can deploy it immediately.

## Tool-event record — summaries

- Read requirements and AGENTS guidance, checked the remaining deadline, created `live-data-integration`, and preserved unrelated formatting/JSX work. Applied the native-data-fetching guidance already read during API work; the owner's explicit Axios choice takes precedence over its fetch preference.
- Presented decimal.js versus bigint, server snapshots versus a reservation overlay, and manual versus automatic same-key recovery. The owner selected all three recommended approaches before production policy implementation.
- Installed TanStack Query and decimal.js. npm reported existing Expo engine warnings with the available Node 25.5 runtime. No claim of Node 24 verification is made.
- Implemented token entry and browser persistence; distinct session clients/caches; decimal amount logic; a persisted claim workflow; live balances, options, confirmation, status tracking, and activity pagination. Saved operation keys use a SHA-256 token fingerprint; raw tokens are not query keys or bundled constants.
- Added eight focused amount/workflow tests. The first complete test run passed 29 tests. Fixed a lint warning by using decimal.js's named export. Type checking and lint then passed.
- The first exported-browser harness incorrectly assumed the dashboard total text was unique. The second attempt exposed another test-selector ambiguity because Expo retains hidden screens. Corrected selectors to target visible status text. Also corrected the test fixture to return the documented raw claim object, rather than wrapping it in a `claim` property.
- A live read-only smoke attempt returned HTTP 503 / SERVER on balances. No live claim was submitted.
- The controlled 390 px browser workflow passed confirmation, duplicate taps, same-key/body replay after reload, pending-to-completed polling, stale/newer snapshot gating, activity deduplication, rate-limit gating, token replacement, overflow checks, and no page errors. Inspected token/dashboard/claim screenshots separately.
- The one live-read retry loaded and validated three balances, then claim options returned another HTTP 503 / SERVER. This integration task does not claim a full successful live read pass; earlier API-client checks are historical evidence only.
- Added a visible snapshot age rather than implying freshness from a successful refresh. Settlement invalidates balances and activity; balance polling stops once a suitable settlement snapshot is present.
- Final checks passed: TypeScript, ESLint with no warnings, all 29 tests, and Expo web export. A second browser run against the final export also verified unauthorized-token replacement, pending-to-failed status, failure-reason rendering, and continued blocking while a failed claim's balance snapshot is stale. No page errors or horizontal overflow were observed at 390 px.
- Saved sanitized browser/live-read reports and three controlled-data screenshots under `ai-logs/verification/`. The browser harness uses an externally installed Playwright module; it is preserved as verification evidence, not part of `npm test`.
- Unrelated REQUIREMENTS formatting, starter-component formatting, the owner's import ordering, and JSX diagnostics edits are excluded from this task's commit. Approximate implementation and verification duration: 20 minutes, after the earlier endpoint/client work.
