# API client structure

Contract source: [CashMine task API](https://task-api.cashmine.io/docs), rechecked on 2026-10-20. This branch adds the endpoint foundation. Screens still use fixtures.

## Requirement analysis

The existing server owns balances, claim rules, destinations, claim acceptance, and settlement. The app needs five operations:

| Method | Endpoint | Contract to preserve |
| --- | --- | --- |
| `getBalances(options?)` | `GET /v1/balances` | Decimal strings, asset precision, all balance categories, server `asOf`. |
| `getClaimOptions(asset, options?)` | `GET /v1/claim-options?asset=...` | Minimum, fee, destinations; verify the returned asset. |
| `createClaim(body, key, options?)` | `POST /v1/claims` | Caller-supplied idempotency key and stable body; 201 creation / 200 replay. |
| `getClaim(id, options?)` | `GET /v1/claims/{id}` | Verify the returned ID; preserve pending/completed/failed and failure reason. |
| `getActivity(query?, options?)` | `GET /v1/activity` | Limit 1–20, opaque cursor, signed amounts, null at the end. |

Snapshot freshness and request completion differ: balances are recomputed every 15 seconds. The transport preserves `asOf`; callers must not substitute the fetch timestamp. A pending claim's approximate 20-second settlement period is not a failure deadline.

## Implementation

The public entry point is `src/api/index.ts`:

```ts
import { createCashmineApi } from "@/api";

const api = createCashmineApi({ token: runtimeToken });
const controller = new AbortController();
const snapshot = await api.getBalances({ signal: controller.signal });
```

The token must come from the future runtime session layer. The client never reads `.env`, local storage, or Expo environment variables. Recreate it on token replacement, cancel previous reads, discard late responses, and clear the previous session's cache. Token-scoped client instances alone do not implement that UI lifecycle.

| File | Responsibility |
| --- | --- |
| `config.ts` | One API base URL and a configurable 15-second request deadline. This deadline is a client choice, not a server SLA. |
| `contracts.ts` | Request/response types; all monetary values remain strings. |
| `validation.ts` | Runtime checks for documented fields, decimal syntax, precision, timestamps, statuses, and nullable values. Unknown extra fields are ignored. |
| `errors.ts` | Structured failures, API codes/fields, retry delays, submission uncertainty. |
| `client.ts` | Authentication, encoding, bounded requests, cancellation, endpoint methods. |

The client uses browser-standard `fetch`, sends no cookies, avoids browser response caching, and rejects redirects. No automatic retries, polling, storage, or cache is hidden inside it. The deadline covers both response headers and body consumption. Abort listeners and timers are cleaned up.

Claim inputs are copied and serialized before awaiting a response. The workflow supplies the key; this layer never creates one. Returned claims must match the submitted asset, destination, and amount (allowing insignificant trailing fractional zeros). This is string normalization, not an amount-arithmetic policy.

## Error contract

`ApiError` exposes `kind`, optional `status`, `code`, `field`, `retryAfterMs`, and `submissionOutcome`. The latter describes this request attempt:

| Outcome | Meaning |
| --- | --- |
| `not-applicable` | A read request. |
| `not-sent` | Local claim-input rejection or cancellation before dispatch. |
| `rejected` | A documented HTTP/code pair explicitly rejected this attempt: validation, unauthorized, not found, or rate limited. |
| `unknown` | Submission started, but acceptance cannot be established: lost response, timeout, in-flight cancellation, malformed success, server error, or idempotency mismatch. |

An error on a recovery attempt never disproves a previous acceptance. In particular, a 401 must not delete an unresolved operation, and a 409 must not generate a fresh key.

When available, both `retryAfterMs` and `Retry-After` are parsed; the longer nonnegative delay is exposed. HTTP-date headers are also supported. Scheduling belongs to the caller. Missing or malformed server errors receive safe fallback messages without copying raw response bodies or request credentials.

## Libraries and screen integration

Recommended next layer: **TanStack Query + this typed fetch client**.

- Axios offers client instances, interceptors, timeout configuration, and cancellation. It would replace the HTTP transport, while domain validation and uncertainty handling remain ours.
- TanStack Query manages server-data state, shared cache, refresh, polling, and pagination. It would replace substantial custom hook/effect code and can use either fetch or Axios.
- Query keys/cache lifetime must be scoped to the active session without putting the raw token in query keys. Explicit retry/refetch rules must honor rate limits and stop terminal claim polling.
- Claim mutations should explicitly disable automatic retries. A separate, token-scoped operation record is still needed for reload-safe same-key recovery. This is a recommendation for the upcoming product decision, not an implemented recovery policy.
- Query cache freshness is not server snapshot freshness: continue displaying `asOf`.

Sources: [Axios interceptors](https://axios-http.com/docs/interceptors), [TanStack defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults), [mutation retries](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [fetch/Axios cancellation integration](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).

Live read checks observed an overlapping activity item between consecutive cursor pages on two runs. The client preserves each server page. When integrating the activity list, deduplicate displayed items by ID and continue using the server's cursor; do not derive a cursor from the number of unique rows.

## Verification and boundaries

`npm test` covers endpoint construction, exact string preservation, URL encoding, replay, HTTP errors, rate limits, malformed payloads, timeout/body timeout, cancellation, and independent token clients. Tests inject fetch and make no network requests. Explicit `.ts` imports allow Node 24 to run the same source; TypeScript's `allowImportingTsExtensions` is safe with Expo's existing `noEmit` configuration.

The live smoke check calls only balances, claim options, and activity pages. Its sanitized report is in `ai-logs/verification/api-client-live-reads.json`. Live POST submission and settlement tracking have not been exercised.

Runtime token UI/storage, React Query hooks, financial arithmetic, balance reconciliation, persistent claim recovery, and deployment are not implemented in this branch. The three required product decisions remain open; transport strings and error classification do not settle them.
