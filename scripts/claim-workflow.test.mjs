import test from "node:test";
import assert from "node:assert/strict";
import { ClaimWorkflow, snapshotSettled } from "../src/state/claim-workflow.ts";
import { ApiError } from "../src/api/errors.ts";
const body = { asset: "USDT", amount: "20", destinationId: "wallet" };
const claim = {
  id: "c1",
  ...body,
  fee: "1",
  receiveAmount: "19",
  status: "pending",
  failureReason: null,
  createdAt: "2026-10-20T13:00:00Z",
  updatedAt: "2026-10-20T13:00:00Z",
};
function storage() {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
}
test("persist before send, duplicate taps blocked, reload replays exact request and key", async () => {
  const store = storage();
  let calls = [],
    resolve;
  const workflow = new ClaimWorkflow(store, "token-a", async (body, key) => {
    assert.ok(store.getItem("token-a"));
    calls.push({ body, key });
    await new Promise((r) => (resolve = r));
    throw new ApiError("Timeout", {
      kind: "timeout",
      submissionOutcome: "unknown",
    });
  });
  const first = workflow.submit(body);
  await workflow.submit(body);
  assert.equal(calls.length, 1);
  resolve();
  await first;
  assert.equal(workflow.getSnapshot().operation.claim, undefined);
  const reloaded = new ClaimWorkflow(store, "token-a", async (body, key) => {
    calls.push({ body, key });
    return { claim, replayed: true };
  });
  await reloaded.recover();
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(reloaded.getSnapshot().operation.claim.id, "c1");
  assert.equal(
    new ClaimWorkflow(store, "token-b", async () => {}).getSnapshot().operation,
    null,
  );
});
test("401 on recovery cannot disprove an accepted request", async () => {
  const store = storage();
  store.setItem("a", JSON.stringify({ body, key: "same" }));
  const w = new ClaimWorkflow(store, "a", async () => {
    throw new ApiError("Unauthorized", {
      kind: "http",
      status: 401,
      submissionOutcome: "rejected",
    });
  });
  await w.recover();
  assert.equal(w.getSnapshot().operation.key, "same");
  assert.ok(store.getItem("a"));
});
test("explicit rejection allows review; a stale snapshot cannot unlock terminal claims", async () => {
  const store = storage();
  const w = new ClaimWorkflow(store, "a", async () => {
    throw new ApiError("Insufficient balance", {
      kind: "http",
      status: 400,
      submissionOutcome: "rejected",
    });
  });
  await w.submit(body);
  assert.equal(w.getSnapshot().operation, null);
  assert.equal(store.getItem("a"), null);
  const op = {
    key: "key",
    body,
    claim: { ...claim, status: "failed", failureReason: "Rejected" },
  };
  assert.equal(snapshotSettled(op, "2026-10-20T12:59:59Z"), false);
  assert.equal(snapshotSettled(op, "2026-10-20T13:00:00Z"), true);
});
test("unavailable persistence prevents all submission", async () => {
  let calls = 0;
  const w = new ClaimWorkflow(
    {
      getItem: () => null,
      setItem: () => {
        throw new Error("Full");
      },
      removeItem: () => {},
    },
    "a",
    async () => {
      calls++;
    },
  );
  await w.submit(body);
  assert.equal(calls, 0);
  assert.match(w.getSnapshot().error, /No claim was sent/);
});
