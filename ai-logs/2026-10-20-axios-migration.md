# Axios migration — conversation log

Date: 2026-10-20 (Europe/Zagreb). Branch: `api-client-structure`, as explicitly requested by the owner.

User-facing messages copied in order across the interrupted turn and its continuation. Private local paths and credentials are excluded. Tool summaries below are separate from the transcript. Captured scope ends at the final verification update.

## User

why do you think that `fetch` would be better that `axios`? What benefits do we have with current approach that with using `axios`? If there are no really good benefits and it is causing us a complication with the amount of code, lets use `axios`

## Assistant

`fetch` mainly saves a dependency and keeps the HTTP layer on browser-standard APIs. Those benefits are modest here: we’ve written timeout, cancellation, JSON parsing, and HTTP-error handling that Axios can simplify.

You’re right to question the code cost. I’ll switch the transport to Axios on a new branch, keeping the CashMine-specific validation and claim-safety rules, then compare the result and rerun the tests.

## User

switch to axios on this branch

## Assistant

I’ll switch to Axios on the current `api-client-structure` branch and commit and push the change there.

## Assistant

Axios is installed. I’ll use its built-in timeout, cancellation, and JSON handling to remove our manual request machinery.

`★ Insight ─────────────────────────────────────`
- Axios can simplify HTTP handling; CashMine’s response validation and idempotency rules still need application code.
- I’ll keep our small `ApiError` interface so screens receive useful errors without exposing Axios’s request configuration, which can contain the token.
`─────────────────────────────────────────────────`

## Assistant

The Axios version passes the existing contract tests, including timeout, cancellation, replay, and malformed-response handling. It replaces the manual timer and abort race with Axios configuration while preserving the endpoint methods.

I’m checking the browser runtime and live read endpoints next, then updating the documentation to record Axios as the chosen transport.

## Assistant

Axios reduced the shared request helper from 85 to 53 lines and removed our manual timer and cancellation race. All 21 tests, TypeScript, lint, the web build, and the isolated Chrome checks pass.

The live API returned a temporary `503` during the claim-options check, which the client reported correctly. I’ll retry that read check once before pushing the commit.

## Assistant

The live-read retry passed. I’m committing and pushing the Axios migration on `api-client-structure` now.

`★ Insight ─────────────────────────────────────`
- Keeping the endpoint interface stable let us replace the transport without changing how screens will call it.
- The tests exercise Axios’s real adapter, including its timeout behavior; only the network responses are mocked.
`─────────────────────────────────────────────────`

## Tool-event record — summaries

- The interrupted turn inspected the current client and official Axios configuration, cancellation, and error documentation. No branch or source changes had been made before the owner clarified that the current branch should be used.
- Kept `api-client-structure`, superseding the general separate-branch-per-task preference for this change. Preserved unrelated formatting and JSX diagnostic edits.
- Installed Axios 1.20.0 and updated the lockfile. Reviewed dependency changes: Axios and its dependency tree were added, with shared dependencies promoted from development-only where necessary.
- npm emitted existing Expo/React Native engine warnings because the available Node executable reports 25.5.0, including at the path labeled Node 24. This task's checks ran on Node 25.5.0; the project still recommends Node 24. No claim of verification on Node 24 is made here.
- Replaced the handwritten fetch request lifecycle with an Axios instance. Selected Axios's built-in fetch adapter to retain no-store caching, omitted cookies, and rejected redirects. Axios now owns timeout/cancellation coordination, JSON transformation, and HTTP rejection. CashMine-specific validation, rate-limit information, caller-supplied idempotency keys, and uncertainty classification remain.
- Adapted the network mock to accept standard Request objects and honor AbortSignal. The tests exercise the real Axios fetch adapter. The old non-cooperative-fetch mock test was replaced with an abort-aware transport test; we no longer claim that our wrapper forcefully bounds arbitrary injected implementations that ignore cancellation. The response-body timeout remains tested using a stream.
- The first test run passed all 20 existing tests. Lint reported four named-export warnings for Axios's default import. Switched to named imports and added a credential-isolation test. The final TypeScript, lint, all 21 tests, and Expo web export passed.
- Used an isolated headless Chrome session with the installed Axios browser ESM build and controlled API responses. Verified exact decimal strings, creation/replay, malformed success, rate limits, timeout/unknown outcome, unchanged caller keys, and sanitized errors. No real claim was submitted.
- A live read-only smoke check passed balances, then received HTTP 503 / SERVER for claim options. The client normalized the error correctly. One explicit read-only verification retry followed; no automatic retry was added to the client.
- Measured the shared request helper at 53 lines versus 85 previously; the full client is 201 lines versus 221. The benefit is reduced custom request-lifecycle code, while financial contract validation remains intentionally explicit.
- The explicit live-read retry passed balances, claim options, and both activity pages. Saved sanitized Axios browser and live-read verification reports under `ai-logs/verification/`.
- Updated README and API guidance to identify Axios as the chosen transport and TanStack Query as the recommended future UI layer. Approximate migration and verification duration: 10 minutes. This log preserves the owner's challenge to the original fetch recommendation and the resulting change of approach.
