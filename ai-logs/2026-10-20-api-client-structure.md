# API client structure — conversation log

Date: 2026-10-20 (Europe/Zagreb). Branch: `api-client-structure`, based on `dummy-visuals`.

User-facing messages copied in order from this task. Private local paths and credentials are excluded. Tool summaries follow the transcript and are not a raw tool export. Scope currently ends at the final build-check update.

## User

Okay, i will review it on git. While i am doing that, create a new branch and start with the implementation of the structure of the endpoints (api calls).
Before you start implementation, make the analization of the requirements and give me the most optimal way of the endpoints implementation

## Assistant

I’ll review the requirements and live API contract, then recommend the client structure before writing endpoint code. I’ll also create a separate branch for this task and preserve the pending changes in your workspace.

## Assistant

I’m using the native-data-fetching skill to guide the API layer. This task can establish the request and response contracts while keeping the amount arithmetic, balance-after-claim behavior, and recovery UX decisions open for our next discussion.

## Assistant

The requirements call for five operations against the existing server. For this project, I recommend a small typed `fetch` client with runtime response validation and focused failure tests. A separate backend or a large networking framework would add little value at this stage.

| Client method | Endpoint | Important behavior |
|---|---|---|
| `getBalances()` | `GET /v1/balances` | Preserve decimal strings and the server’s `asOf` timestamp. Snapshots update every 15 seconds. |
| `getClaimOptions(asset)` | `GET /v1/claim-options` | Read minimum, fee, and destinations from the API. |
| `createClaim(body, key)` | `POST /v1/claims` | Require the caller’s idempotency key; accept both new and replayed claims. |
| `getClaim(id)` | `GET /v1/claims/{id}` | Return the server status for later polling. |
| `getActivity({ limit, cursor })` | `GET /v1/activity` | Preserve the opaque cursor and signed amounts. |

These contracts are verified against the [live API documentation](https://task-api.cashmine.io/docs).

I’ll organize this under `src/api/`: configuration, request/response contracts, response validation, structured errors, and the client. Screens will eventually call these methods through hooks; request handling will stay outside presentation components.

The important implementation rules are:

- **Runtime authentication:** each client instance receives one token. Changing tokens creates a new instance; the client never reads `.env` or browser storage.
- **Exact transport data:** amounts remain strings. Arithmetic and display rounding belong in a separate amount module.
- **Explicit errors:** expose HTTP status, API code, validation field, and retry delay. Validate successful responses too, so malformed financial data cannot silently reach the UI.
- **Controlled requests:** support cancellation and a bounded timeout. Return rate-limit timing to the caller; keep retries and polling explicit.
- **Safe claim submission:** require the key and exact body from the workflow. A lost response, timeout, or ambiguous server failure must be classified as an unknown outcome. The transport must never generate a replacement key or automatically resubmit.

`★ Insight ─────────────────────────────────────`
- A cancelled HTTP request does not prove that a claim was cancelled on the server.
- A successful balance refresh does not prove that the snapshot includes the latest claim. Keeping `asOf` intact lets the workflow handle that distinction.
`─────────────────────────────────────────────────`

I’ll implement this foundation on `api-client-structure` now. The three product decisions—amount arithmetic, post-claim balances, and recovery behavior—remain open; this layer will support their eventual choices.

## Assistant

The five endpoint methods and shared transport are in place. They preserve decimal strings, validate response shapes, accept cancellation signals, and distinguish rejected claim requests from unknown outcomes.

I’m testing the failure cases next: lost POST responses, malformed success responses, rate limits, and requests made by separate token-scoped clients. The visual screens still use fixtures until we connect the session and workflow layers.

## Assistant

All 20 automated tests pass, along with TypeScript and lint. Live reads also validated balances, claim options, and the first activity page.

The pagination check found an item repeated across two live pages. I’m checking the cursor handling before finalizing the client so the eventual activity list can account for what the server actually returns.

## User

We are free to use the plugins. What would be the pros and cons of, for example, axios or react query?

## Assistant

Axios and React Query solve different problems: Axios sends HTTP requests; React Query manages server data in the UI and can use either Axios or `fetch`.

I’ll compare them against this app’s refresh, polling, and claim-recovery requirements. Using a library is worthwhile where it removes complexity we would otherwise need to maintain.

## Assistant

**For CashMine, I recommend TanStack Query (React Query) over the typed `fetch` client.** Axios is also reasonable, but React Query would remove more of the complexity this app needs.

| Option | Pros for this project | Cons / responsibilities that remain |
|---|---|---|
| **Axios** | Convenient client instances, request/response interceptors, timeout configuration, and cancellation. [Axios docs](https://axios-http.com/docs/interceptors) | Adds a dependency and its own error/configuration model. We still need response validation, exact amounts, idempotency, and unknown-outcome handling. It does not manage React’s server-data lifecycle. |
| **React Query** | Manages cached data, loading/error states, background refresh, polling, and pagination. It would reduce custom effects and request-state code in our screens. [TanStack docs](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) | Requires deliberate query keys, cache isolation when tokens change, and retry/refetch configuration. It cannot decide whether a stale balance includes a claim or make an uncertain submission safe. |
| **Built-in `fetch`** | No extra HTTP dependency; works with React Query and the client we’ve built. [Integration docs](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) | We maintain the shared timeout, HTTP-error, and JSON handling ourselves. That foundation is now implemented and tested. |

The recommended flow is:

`Screen → React Query hook → typed API client → fetch → CashMine API`

For CashMine specifically, I’d use queries for balances and claim options, polling for pending claims, and an infinite query for activity. Claim submission would use a mutation with **explicit `retry: false`**; recovery would reuse the persisted body and idempotency key. Mutations already default to no retries, but declaring it makes our intent clear. [Mutation docs](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)

My earlier recommendation covered the HTTP layer. For connecting the screens, **React Query is worth adding**. Axios becomes more attractive if you prefer its API or expect richer HTTP middleware; it can replace `fetch` without changing the endpoint methods. I’ll document this recommendation while finishing the endpoint foundation.

## Assistant

The live checks now cover balances, claim options, and cursor pagination. Both pagination runs returned an overlapping item, so I’ve documented that the activity UI should deduplicate rows by ID while continuing to use the server’s cursor.

`★ Insight ─────────────────────────────────────`
- React Query can manage fetching and caching, but CashMine’s idempotency and snapshot rules still belong in our application logic.
- The endpoint client stays independent of React, so its failure behavior can be tested without rendering a screen.
`─────────────────────────────────────────────────`

I’m finishing the build check and review notes, then I’ll commit and push `api-client-structure`.

## Tool-event record — summaries

- Read `REQUIREMENTS.md`, `AGENTS.md`, the existing source layout, scripts, and native-data-fetching skill. The web reader could not access the public API docs; a direct HTTPS read succeeded. No private token was used to fetch documentation.
- Created `api-client-structure` from the completed visual branch. Preserved concurrent requirements formatting, starter-component formatting, and JSX diagnostic edits. These remain outside the task commit.
- Implemented typed contracts, runtime response validation, a token-scoped fetch client, all five endpoint methods, structured errors, cancellation, a request/body deadline, and caller-owned idempotency keys. All monetary transport data stays as decimal strings.
- Added 16 API tests to the existing four amount tests. The first full run passed all 20 tests; TypeScript and lint passed. Node emits its existing non-blocking module-type-detection warning when loading TypeScript source directly.
- Ran an isolated read-only live smoke check using the local ignored token file, without printing credentials or response bodies. Balances, claim options, and activity responses passed validation. The first smoke harness failed its assumption that consecutive activity pages could not overlap (`Smoke assertion failed`).
- Repeated the live read check, recording overlap as an observation instead of asserting an undocumented uniqueness guarantee. One overlapping item appeared again. Encoding/round-tripping opaque cursors is covered separately by the contract tests. Documented deduplication by ID for the future UI. Saved only sanitized counts and check outcomes.
- No live claim POST or settlement test was performed. Claim creation, replay, unknown outcomes, mismatches, and cancellation were checked with controlled fetch implementations.
- Read official Axios and TanStack Query documentation after the owner asked about libraries. Recommended TanStack Query above the endpoint client for future screen integration. No Axios or TanStack dependency has been added in this branch.
- Final Expo web export passed. No UI behavior changed in this task, so the browser visual suite was not repeated. The client itself was exercised by 16 API tests and live read calls; all 20 tests including the existing amount checks passed.
- Approximate implementation and verification duration: 15 minutes. The task commit includes only the endpoint foundation, its tests, documentation, and sanitized AI evidence; concurrent local edits are preserved separately.
