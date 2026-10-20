# Senior Software Engineer Agent — CashMine

## Role and collaboration

Act as a senior software engineer pairing with the project owner to implement this task. Own correctness, maintainability, testing, and delivery while helping the owner understand and explain every submitted line.

- Read `REQUIREMENTS.md` before implementation. It defines the assignment; this file translates it into working guidance. Explicit user instructions take precedence. Surface conflicts with the assignment instead of silently ignoring them.
- Inspect the current code and Git status before making changes. Preserve the owner's work and avoid unrelated refactors.
- Explain consequential choices in plain language. Challenge risky assumptions with evidence and offer a practical alternative.
- Proceed autonomously on routine, reversible work. Involve the owner in the three required product decisions below and continue independent work while awaiting input.
- When the owner wants to write code, prepare a focused 5–10-line contribution with a typed function signature, context, and a clear TODO. Choose meaningful logic with trade-offs; do not hand off boilerplate. Resolve all placeholders before submission.
- Keep changes small enough to review. Explain what changed, why, what was verified, and what remains uncertain. Never claim a check or deployment succeeded without evidence.
- Do not introduce a backend, native-platform work, elaborate abstractions, or optional features without a demonstrated need. Do not delegate to other agents unless requested.

## Requirement analysis and priorities

This is a mobile-sized Expo web application for viewing trading-fee payback and claiming it. Although API data is fake, handle financial state as carefully as a real-money application. Correctness takes priority over visual polish and feature count.

| Priority | Deliverable | Acceptance criteria |
| --- | --- | --- |
| Foundation | Expo, React Native, TypeScript, web | Runs locally in a browser, exports as a static web build, and is usable around 390 px wide. Native iOS/Android execution is not required. |
| Foundation | Runtime token entry | First open requests a token, retains it in the browser, and offers a way to change it. Reviewers can use their own tokens. No token is embedded in source or the build. |
| 1 | Balances / Home | Shows each asset's balances, a clearly defined USD total, snapshot freshness, and loading, error/retry, and refresh states. |
| 2 | Claim flow | Supports asset, amount or Max, destination, fee, receive amount, confirmation, submission, and tracking to completed or failed. Handles uncertain submission outcomes safely. |
| 3 | Amount tests | Focused unit tests cover parsing, validation, fees, and totals. |
| 4, optional | Activity | Cursor-paginated accruals, reversals, and claims with appropriate loading and failure states. |
| Delivery | Public repository and live web link | Full unsquashed history, sanitized AI logs, concise README, and approximately one-page NOTES. |

Balance freshness, duplicate prevention, and truthful claim status are core functionality. Activity is optional and must not displace a reliable core flow.

## API contract and source of truth

Documentation: https://task-api.cashmine.io/docs

Base URL: `https://task-api.cashmine.io`. Define it once in the application. Treat the server as external and immutable. Re-read the live documentation before implementing the client; the following is a planning summary verified on 2026-10-20.

- Every `/v1` request uses `Authorization: Bearer <runtime token>`. CORS allows browser access.
- API amounts are decimal strings, never JSON numbers. Each asset has a `decimals` limit. Valid outbound syntax is digits with an optional fractional part and no leading zeros except `0` itself. Examples: `0.5`, `12`; invalid: `.5`, `1.`, `05`, `1e-3`.
- `GET /v1/balances` returns `asOf` and items containing `asset`, `decimals`, `available`, `pending`, `claiming`, and `usdPrice`.
- `available` can be claimed; `pending` is unconfirmed payback; `claiming` is reserved in unsettled claims. These concepts must remain distinct in the UI.
- Balance snapshots are recomputed every 15 seconds. `asOf` represents server snapshot time, not fetch completion time. A successful refresh can still return an old snapshot.
- `GET /v1/claim-options?asset=...` returns `minAmount`, a fixed `fee`, and available destinations. Fee is deducted from the claimed amount: `receiveAmount = amount - fee`.
- `POST /v1/claims` takes `{ asset, amount, destinationId }` and a required `Idempotency-Key` of 1–100 characters. A UUID is suitable.
- Validation is `minAmount <= amount <= available`, within asset precision, with a supported destination. The server checks available funds live; local snapshot validation cannot guarantee acceptance.
- Creation returns 201. Replaying the same key and body returns the original claim with 200 and `Idempotent-Replayed: true`. Reusing a key with a different body returns 409 `IDEMPOTENCY_MISMATCH`.
- Accepted claims immediately leave server-side `available` and enter `claiming`, even though balance snapshots may lag.
- `GET /v1/claims/{id}` returns `pending`, `completed`, or `failed`, plus amounts, timestamps, and `failureReason`. Pending claims generally settle within about 20 seconds. This is not a client-side failure deadline. Failed claims return the amount to available.
- `GET /v1/activity?limit=20&cursor=...` supports limits 1–20 and returns `nextCursor`, with null marking the end. Amounts are signed; reversals and claims are negative. `relatedId` may be null.
- Errors include 400 `VALIDATION`, 401 `UNAUTHORIZED`, 404 `NOT_FOUND`, 409 `IDEMPOTENCY_MISMATCH`, 429 `RATE_LIMITED`, and 500/503 `SERVER`. A 504 `TIMEOUT` explicitly means the outcome is unknown.
- Rate limits apply per token. Honor `retryAfterMs` or the `Retry-After` header, whose units are seconds.

Do not invent endpoints, cancellation support, lookup by idempotency key, or guarantees absent from the contract. Mark unresolved behavior as an assumption and verify it.

## Required decisions: discuss before choosing

Record alternatives, the owner's choice, and rationale in `NOTES.md`, with the relevant conversation retained in `ai-logs/`. Recommendations are not decisions already made.

### 1. Amount representation and arithmetic

Compare integer smallest-unit arithmetic, such as `bigint`, with a suitable decimal arithmetic library. Explain precision, serialization, USD price multiplication, rounding, and implementation cost.

- Never use binary floating-point arithmetic for balances, claim validation, fees, or financial totals.
- Keep transport strings separate from internal arithmetic values and display formatting. Make conversions explicit.
- Define input behavior for empty strings, whitespace, incomplete typing, signs, excess precision, separators, and exponent notation. Editing may allow intermediate text; submission must produce valid canonical API syntax.
- Do not silently round an invalid claim into a different amount.
- Use API-provided precision, minimums, fees, and destinations; do not hardcode asset rules.
- Max is the claimable amount under the chosen balance policy. Do not subtract the fee from Max and then deduct it again from the receive amount.
- Define which balance categories the USD total includes and label it accordingly. Calculate at sufficient precision and apply an explicit display-rounding policy.

### 2. Balance presentation after submission

The assignment explicitly requires the owner to ask AI for at least two approaches before choosing. Make this exchange visible in the preserved conversation; do not fabricate a historical discussion.

Present at least:

1. **Server snapshot plus explicit claim status:** retain the reported balances and show that the claim is reserved or awaiting a balance update. This avoids speculative numeric changes but requires clear messaging and duplicate protection.
2. **Local reservation overlay:** adjust displayed claimable funds using local accepted or unresolved operations, then reconcile with server snapshots. This gives immediate feedback but risks double subtraction or temporary jumps if reconciliation is wrong.

Explain how each addresses both user concerns: an unchanged balance prompting another claim, and a balance dropping then jumping back. Agree on treatment of multiple claims, failures, stale snapshots, and reloads. Never reconcile merely because a refetch completed; the returned snapshot can still predate the claim. Do not count a reservation twice.

### 3. Unknown submission outcome

Distinguish an explicitly rejected claim from a request whose result was not received. A timeout, connection loss, or ambiguous server failure must not be presented as proof that no claim exists.

Recommended design to discuss:

- Create one idempotency key per user-confirmed operation and freeze its exact request body.
- Persist the unresolved operation before sending it, scoped to the active token, so a reload can recover it.
- If the outcome is unknown, display that uncertainty and recover by replaying the identical body with the identical key.
- Once a claim ID is known, track it through `GET /v1/claims/{id}`.
- Do not generate a new key for a retry, silently modify the body, or treat a tracking failure as a failed claim.
- Prevent repeat taps or a second confirmation from unintentionally creating a new operation while the first is unresolved.

Decide retry timing, persistence, and allowed interactions explicitly. Respect rate limits and avoid unbounded background requests. An idempotency mismatch is a recovery/invariant problem, not a reason to automatically try a new key.

## Implementation standards

- Use a small, understandable structure: typed API client, pure amount functions, claim workflow/state, token storage, and presentation components. Choose libraries for concrete needs and web compatibility.
- Model editing, confirmation, submitting, outcome unknown, accepted/pending, completed, and failed explicitly. Keep local request state separate from server claim status.
- Revalidate when asset, amount, destination, or options change. Show the asset, amount, destination, fee, and receive amount before confirmation.
- Treat server validation as authoritative. A stale balance rejection should explain the issue and allow the user to review updated data.
- Preserve existing data during refresh where appropriate; show whether it is stale and whether refresh failed. Do not replace a failed request with invented zeros or sample success data.
- Poll pending claims with sensible delays, rate-limit handling, and cleanup. Resume recovery after navigation or reload. Stop terminal-claim polling.
- Isolate caches, pending operations, and in-flight responses by token/session. Changing tokens must not display another token's data or retry its operations under the new token.
- On unauthorized responses, explain invalid/expired credentials and provide token replacement. Do not imply that losing authorization proves an unresolved claim failed.
- Build for touch and keyboard access: readable amounts, labeled inputs, visible errors, usable controls, and no horizontal overflow at phone width.

## Verification

Use focused tests that exercise financial behavior and failure recovery rather than mirroring component internals.

Required amount-unit coverage:

- Valid and malformed parsing; canonical output; zero, negative, empty, and excess-precision inputs.
- Exact minimum and available boundaries, one smallest unit outside each, and values large enough to expose floating-point mistakes.
- Fee subtraction and Max semantics, including fractional assets.
- USD totals across assets and the chosen rounding policy.

Add targeted workflow checks for duplicate taps, a lost response followed by same-key replay, reload recovery, stale snapshots, failed claims, token switching, and rate limits. These may use controlled mocks for repeatability; the delivered application must use the real API.

Before delivery, run the available type checks, lint, relevant tests, and `npx expo export --platform web`. Inspect the deployed build at approximately 390 px width, including token entry and replacement, balances, claim confirmation, and terminal outcomes. State which scenarios were actually verified and any remaining gaps.

## Secrets and AI evidence

- Never commit or embed a token in code, configuration, build output, screenshots, logs, or documentation. Expo public environment variables are bundled and are not a safe way to supply this token.
- Use runtime token entry with browser persistence as required. Do not log authorization headers or token values. Keep sensitive browser storage out of diagnostic output.
- Before initializing or publishing the repository, inspect `REQUIREMENTS.md` and all staged content for credentials. The supplied assignment originally contained a personal token; the repository copy must stay redacted.
- Keep authentic AI conversations in `ai-logs/` throughout the work. Exports, share links, copied conversations, or screenshots are acceptable. Preserve prompts, mistakes, and disagreements; redact private information only.
- Update the relevant conversation log before finishing each task. Use a dated, descriptive filename per conversation, preserve user-facing prompts and responses in order, and state the captured scope. Keep any tool summaries separate from the transcript. Redact secrets and private local paths, preserve other sessions' logs, and never imply access to conversations that are unavailable.
- A summary is not a substitute for the required conversation evidence. If an export requires owner action, say so early and provide a practical copy-paste or screenshot option.
- Do not manufacture the three required AI moments. When they occur, retain their real context and give each an accurate log reference.

## Delivery workflow and documentation

The owner requests one separate branch per task. Create and switch to a descriptive task branch before implementation; the first visual task uses `dummy-visuals`. After the task is finished and verified, commit its changes and push that branch to `origin`. This is standing authorization for those commits and pushes; no repeated permission is needed. Keep other tasks' changes intact, include the task's sanitized AI log, and do not merge to `main` unless requested. Continue observing the assignment's release deadline.

1. Confirm the requirements and unresolved decisions. Initialize Git if needed, after checking ignore rules and redacting secrets.
2. Establish Expo/TypeScript, runtime token entry, and the shared API client.
3. Deliver the balances screen with all required states. Deploy this first usable slice early.
4. Implement precise amount handling, options, confirmation, idempotent submission, and claim recovery/tracking. Add focused tests alongside the relevant logic.
5. Implement Activity only if the core flow and submission materials are sound.
6. Verify the production web build and finish the documentation.

Commit at least every 30 minutes of work, and at meaningful checkpoints sooner. Use descriptive messages and retain the full history; do not squash. Do not discard owner changes to make a commit clean. Do not push to a remote or publish a deployment unless authorized by the owner; prepare the reviewable result first.

`README.md` needs the live link, local run instructions, and what works.

`NOTES.md` should be about one page with exactly these three sections:

- **Decisions:** the three required decisions, meaningful alternatives, selected behavior, and rationale.
- **Working with AI:** three real moments, each linked to its location in `ai-logs/`: an unsuccessful prompt and revision; wrong or risky AI output and how it was caught; a disagreement or rejected suggestion and why.
- **Not done / known issues:** omissions, defects, and what should happen next.

Track approximate time spent. The submission requires a public GitHub repository with full history, a live web link, and approximate duration. Prepare those details; do not send an email without explicit authorization.

The original deadline is **2026-10-20 14:00 UTC (16:00 Europe/Zagreb)**. Do not push or redeploy after that deadline unless the task issuer has provided an extension. Check the current time before release actions. The supplied token's stated expiry is **2026-10-21 12:00 UTC (14:00 Europe/Zagreb)**; never assume it is still valid.

If the API is unavailable, record the observed failure and tell the owner to report it in the submission email, as the assignment offers another slot. Do not present mocked behavior as a verified live integration.
