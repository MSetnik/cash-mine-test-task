import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate as nextTurn } from "node:timers/promises";
import { createCashmineApi, ApiError } from "../src/api/index.ts";

const time = "2026-10-20T08:01:15.000Z";
const balances = {
  asOf: time,
  items: [{
    asset: "USDT", decimals: 6, available: "9007199254740993.123456",
    pending: "50.12", claiming: "0", usdPrice: "1.0002",
  }],
};
const options = {
  asset: "ETH", minAmount: "0.01", fee: "0.0012",
  destinations: [{ id: "dest_wallet", label: "Wallet example" }],
};
const body = { asset: "ETH", amount: "0.5", destinationId: "dest_wallet" };
const claim = {
  ...body, id: "clm_example", fee: "0.0012", receiveAmount: "0.4988",
  status: "pending", failureReason: null, createdAt: time, updatedAt: time,
};
const activity = {
  items: [{
    id: "act_example", type: "claim", asset: "ETH", amount: "-0.5",
    status: "pending", exchange: null, relatedId: "clm_example", createdAt: time,
  }],
  nextCursor: "opaque+/=&?# cursor",
};
const json = (data, status = 200, headers) => new Response(JSON.stringify(data), { status, headers });
const apiError = (kind, outcome, extra = {}) => (error) => {
  assert(error instanceof ApiError);
  assert.equal(error.kind, kind);
  assert.equal(error.submissionOutcome, outcome);
  for (const [key, value] of Object.entries(extra)) assert.equal(error[key], value);
  return true;
};
// Axios's real fetch adapter runs in these tests. Only the network boundary is
// replaced; the mock follows fetch's AbortSignal behavior.
function mockFetch(respond, calls) {
  return async (input, options) => {
    const request = new Request(input, options);
    const init = {
      method: request.method,
      headers: request.headers,
      signal: request.signal,
      cache: request.cache,
      credentials: request.credentials,
      redirect: request.redirect,
      body: undefined,
    };
    calls.push({ url: request.url, init });
    if (request.body) init.body = await request.text();
    let cancel;
    const aborted = new Promise((_, reject) => {
      cancel = () => reject(init.signal.reason);
      if (init.signal.aborted) cancel();
      else init.signal.addEventListener("abort", cancel, { once: true });
    });
    try {
      return await Promise.race([respond(request.url, init), aborted]);
    } finally {
      init.signal.removeEventListener("abort", cancel);
    }
  };
}
function client(respond, extra = {}) {
  const calls = [];
  const api = createCashmineApi({
    token: "test-only-token",
    fetchImpl: mockFetch(respond, calls),
    ...extra,
  });
  return { api, calls };
}

test("balances preserve exact strings and server freshness; credentials are sent only as a header", async () => {
  const { api, calls } = client(() => json(balances));
  assert.deepEqual(await api.getBalances(), balances);
  assert.equal(calls[0].url, "https://task-api.cashmine.io/v1/balances");
  assert.equal(calls[0].init.headers.get("Authorization"), "Bearer test-only-token");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.body, undefined);
});

test("claim options encode the asset and reject a response for a different asset", async () => {
  const { api, calls } = client(() => json(options));
  assert.deepEqual(await api.getClaimOptions("ETH"), options);
  await assert.rejects(api.getClaimOptions("ETH&asset=BTC"), apiError("protocol", "not-applicable"));
  assert.equal(new URL(calls[1].url).searchParams.get("asset"), "ETH&asset=BTC");
  assert.equal(new URL(calls[1].url).searchParams.getAll("asset").length, 1);
});

test("claim submission serializes a stable body and requires an explicit key", async () => {
  const { api, calls } = client(() => json(claim, 201));
  const input = { ...body, unwanted: "excluded" };
  const promise = api.createClaim(input, "operation-1");
  input.amount = "999";
  assert.deepEqual(await promise, { claim, replayed: false });
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.get("Idempotency-Key"), "operation-1");
  assert.equal(calls[0].init.headers.get("Content-Type"), "application/json");
  assert.equal(calls[0].init.body, JSON.stringify(body));
});

test("same-key recovery after a lost response is explicit and recognizes a replay without CORS header access", async () => {
  let attempts = 0;
  const { api, calls } = client(() => {
    if (++attempts === 1) throw new TypeError("Connection lost");
    return json(claim, 200);
  });
  await assert.rejects(api.createClaim(body, "same-key"), apiError("network", "unknown"));
  assert.equal(calls.length, 1, "transport must not automatically retry");
  assert.deepEqual(await api.createClaim(body, "same-key"), { claim, replayed: true });
  assert.equal(calls[0].init.body, calls[1].init.body);
  assert.equal(calls[0].init.headers.get("Idempotency-Key"), calls[1].init.headers.get("Idempotency-Key"));
});

test("public errors do not retain Axios request configuration or credentials", async () => {
  const { api } = client(() => json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } }, 401));
  await assert.rejects(api.getBalances(), (error) => {
    assert.equal(error.config, undefined);
    assert.equal(error.request, undefined);
    assert.equal(error.response, undefined);
    assert.equal(error.cause, undefined);
    assert(!JSON.stringify(error).includes("test-only-token"));
    return apiError("http", "not-applicable", { status: 401 })(error);
  });
});

test("claim tracking encodes opaque IDs and preserves a failed status and reason", async () => {
  const id = "claim/with ?reserved";
  const failed = { ...claim, id, status: "failed", failureReason: "Destination unavailable" };
  const { api, calls } = client(() => json(failed));
  assert.deepEqual(await api.getClaim(id), failed);
  assert(calls[0].url.endsWith("/claims/claim%2Fwith%20%3Freserved"));
  await assert.rejects(api.getClaim("other-id"), apiError("protocol", "not-applicable"));
});

test("activity preserves signed amounts and opaque cursors; null marks the last page", async () => {
  const { api, calls } = client(() => json(activity));
  assert.deepEqual(await api.getActivity(), activity);
  assert.equal(new URL(calls[0].url).searchParams.get("limit"), "20");
  await api.getActivity({ limit: 5, cursor: activity.nextCursor });
  assert.equal(new URL(calls[1].url).searchParams.get("cursor"), activity.nextCursor);
  assert.equal(new URL(calls[1].url).searchParams.get("limit"), "5");
  const lastPage = client(() => json({ items: [], nextCursor: null }));
  assert.deepEqual(await lastPage.api.getActivity(), { items: [], nextCursor: null });
});

test("invalid request inputs are rejected before any network call", async () => {
  const { api, calls } = client(() => { throw new Error("Must not call fetch"); });
  for (const amount of ["", ".5", "1.", "05", "-1", "1e-3", " 1", 0.5]) {
    await assert.rejects(api.createClaim({ ...body, amount }, "key"), apiError("validation", "not-sent", { field: "amount" }));
  }
  for (const key of ["", " ", " key", "key ", "x".repeat(101), "key\r\ninjection"]) {
    await assert.rejects(api.createClaim(body, key), apiError("validation", "not-sent"));
  }
  for (const limit of [0, 21, 1.5, NaN]) {
    await assert.rejects(api.getActivity({ limit }), apiError("validation", "not-applicable"));
  }
  await assert.rejects(api.getClaim(".."), apiError("validation", "not-applicable"));
  await assert.rejects(api.getClaimOptions(""), apiError("validation", "not-applicable"));
  assert.equal(calls.length, 0);
});

test("request rejection retains field information; 409 and server failures remain uncertain", async () => {
  for (const [status, code, outcome] of [
    [400, "VALIDATION", "rejected"],
    [401, "UNAUTHORIZED", "rejected"],
    [404, "NOT_FOUND", "rejected"],
    [409, "IDEMPOTENCY_MISMATCH", "unknown"],
    [429, "RATE_LIMITED", "rejected"],
    [500, "SERVER", "unknown"],
    [503, "SERVER", "unknown"],
    [504, "TIMEOUT", "unknown"],
    [400, "UNRECOGNIZED", "unknown"],
  ]) {
    const { api, calls } = client(() => json({ error: { code, message: "Request error", field: "amount" } }, status));
    await assert.rejects(api.createClaim(body, "key"), apiError("http", outcome, { status, code, field: "amount" }));
    assert.equal(calls.length, 1);
  }
});

test("rate limits expose the longer server delay without retrying or sleeping", async () => {
  const { api, calls } = client(() => json(
    { error: { code: "RATE_LIMITED", message: "Wait", retryAfterMs: 2300 } },
    429, { "Retry-After": "3" },
  ));
  await assert.rejects(api.getBalances(), apiError("http", "not-applicable", { retryAfterMs: 3000 }));
  assert.equal(calls.length, 1);
  const bodyOnly = client(() => json({ error: { code: "RATE_LIMITED", message: "Wait", retryAfterMs: 2300 } }, 429));
  await assert.rejects(bodyOnly.api.getBalances(), apiError("http", "not-applicable", { retryAfterMs: 2300 }));
});

test("non-JSON errors remain structured and do not expose a raw response body", async () => {
  const { api } = client(() => new Response("<html>upstream private diagnostic</html>", { status: 503, headers: { "Retry-After": "2" } }));
  await assert.rejects(api.createClaim(body, "key"), (error) => {
    assert(!error.message.includes("private diagnostic"));
    return apiError("http", "unknown", { status: 503, retryAfterMs: 2000 })(error);
  });
});

test("malformed success payloads are rejected and never presented as valid claim outcomes", async () => {
  const wrongAmount = client(() => json({ ...claim, amount: 0.5 }, 201));
  await assert.rejects(wrongAmount.api.createClaim(body, "key"), apiError("protocol", "unknown"));
  const brokenJson = client(() => new Response("not json", { status: 201 }));
  await assert.rejects(brokenJson.api.createClaim(body, "key"), apiError("protocol", "unknown"));
  const unexpectedStatus = client(() => json(claim, 202));
  await assert.rejects(unexpectedStatus.api.createClaim(body, "key"), apiError("protocol", "unknown"));
  const wrongAsset = client(() => json({ ...claim, asset: "BTC" }, 201));
  await assert.rejects(wrongAsset.api.createClaim(body, "key"), apiError("protocol", "unknown"));
  const mismatchedAmount = client(() => json({ ...claim, amount: "0.51" }, 201));
  await assert.rejects(mismatchedAmount.api.createClaim(body, "key"), apiError("protocol", "unknown"));
  const equivalentAmount = client(() => json({ ...claim, amount: "0.500" }, 201));
  assert.equal((await equivalentAmount.api.createClaim(body, "key")).claim.amount, "0.500");
  const invalidBalance = client(() => json({ ...balances, items: [{ ...balances.items[0], decimals: 2 }] }));
  await assert.rejects(invalidBalance.api.getBalances(), apiError("protocol", "not-applicable"));
  const invalidActivity = client(() => json({ ...activity, items: [{ ...activity.items[0], status: "confirmed" }] }));
  await assert.rejects(invalidActivity.api.getActivity(), apiError("protocol", "not-applicable"));
});

test("Axios timeout cancels an in-flight request without retrying", async () => {
  let requestSignal;
  const { api, calls } = client((_, init) => {
    requestSignal = init.signal;
    return new Promise(() => {});
  }, { timeoutMs: 15 });
  await assert.rejects(api.createClaim(body, "key"), apiError("timeout", "unknown"));
  assert.equal(requestSignal.aborted, true);
  assert.equal(calls.length, 1);
});

test("deadline includes response-body consumption", async () => {
  const { api } = client((_, init) => new Response(new ReadableStream({
    start(controller) {
      init.signal.addEventListener("abort", () => controller.error(init.signal.reason), { once: true });
    },
  }), { status: 201 }), { timeoutMs: 15 });
  await assert.rejects(api.createClaim(body, "key"), apiError("timeout", "unknown"));
});

test("pre-aborted claims are not sent; in-flight cancellation cannot prove non-submission", async () => {
  const controller = new AbortController();
  controller.abort();
  const { api, calls } = client(() => new Promise(() => {}));
  await assert.rejects(api.createClaim(body, "key", { signal: controller.signal }), apiError("aborted", "not-sent"));
  assert.equal(calls.length, 0);
  const active = new AbortController();
  const pending = api.createClaim(body, "key", { signal: active.signal });
  await nextTurn();
  active.abort();
  await assert.rejects(pending, apiError("aborted", "unknown"));
  assert.equal(calls.length, 1);
});

test("separate token clients do not change credentials on in-flight requests or share abort signals", async () => {
  const calls = [];
  const resolvers = [];
  const fetchImpl = mockFetch(() => new Promise((resolve) => {
    resolvers.push(resolve);
  }), calls);
  const first = createCashmineApi({ token: "session-a", fetchImpl });
  const second = createCashmineApi({ token: "session-b", fetchImpl });
  const controller = new AbortController();
  const a = first.getBalances({ signal: controller.signal });
  const b = second.getBalances();
  await nextTurn();
  controller.abort();
  await assert.rejects(a, apiError("aborted", "not-applicable"));
  resolvers[0](json(balances));
  resolvers[1](json(balances));
  assert.deepEqual(await b, balances);
  assert.equal(calls[0].init.headers.get("Authorization"), "Bearer session-a");
  assert.equal(calls[1].init.headers.get("Authorization"), "Bearer session-b");
  assert.notEqual(calls[0].init.signal, calls[1].init.signal);
  assert.equal(calls[1].init.signal.aborted, false);
});

test("client configuration rejects invalid credentials and timeouts without echoing their values", () => {
  for (const token of ["", " ", "secret\r\nheader"]) {
    assert.throws(() => createCashmineApi({ token }), (error) => {
      assert.equal(error.kind, "validation");
      assert(!error.message.includes("secret"));
      return true;
    });
  }
  for (const timeoutMs of [0, -1, NaN, Infinity, 2_147_483_648]) {
    assert.throws(() => createCashmineApi({ token: "test-only-token", timeoutMs }), ApiError);
  }
});
