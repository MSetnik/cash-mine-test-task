import assert from "node:assert/strict";
import test from "node:test";
import { parseAmount, previewClaim, usdTotals } from "../src/lib/amounts.ts";
const balance = {
  asset: "USDT",
  decimals: 6,
  available: "9007199254740993.123456",
  pending: "0",
  claiming: "0",
  usdPrice: "1",
};
const options = {
  asset: "USDT",
  minAmount: "10",
  fee: "1",
  destinations: [{ id: "wallet", label: "Wallet" }],
};
test("strict input syntax, precision and canonical transport strings", () => {
  for (const value of [
    "",
    " ",
    " 1",
    "1 ",
    ".5",
    "1.",
    "05",
    "-1",
    "+1",
    "1e2",
    "1,000",
    "0.1234567",
  ])
    assert.equal(parseAmount(value, 6), null, value);
  assert.equal(parseAmount("10.000000", 6), "10");
  assert.equal(parseAmount("9007199254740993.123456", 6), balance.available);
  assert.equal(parseAmount("0", 0), "0");
  assert.equal(parseAmount("0.0", 0), null);
});
test("minimum, available and one unit outside boundaries stay exact", () => {
  const preview = (value) => previewClaim(value, balance, options, "wallet");
  assert.ok(preview("0").error);
  assert.ok(preview("9.999999").error);
  assert.equal(preview("10").receive, "9");
  assert.equal(preview(balance.available).receive, "9007199254740992.123456");
  assert.ok(preview("9007199254740993.123457").error);
  assert.ok(previewClaim("10", balance, options, "missing").error);
});
test("Max uses all available and deducts a fractional fee exactly once", () => {
  const b = {
    ...balance,
    asset: "ETH",
    decimals: 18,
    available: "0.123456789123456789",
  };
  assert.equal(
    previewClaim(
      b.available,
      b,
      { ...options, minAmount: "0.01", fee: "0.000000000000000001" },
      "wallet",
    ).receive,
    "0.123456789123456788",
  );
});
test("USD includes every balance category, rounding half up only at display", () => {
  assert.deepEqual(
    usdTotals([
      {
        ...balance,
        available: "0.1",
        pending: "0.2",
        claiming: "0.005",
        usdPrice: "1",
      },
    ]),
    { available: "0.10", pending: "0.20", claiming: "0.01", total: "0.31" },
  );
  assert.equal(
    usdTotals([
      { ...balance, available: "0.001", usdPrice: "2.5" },
      { ...balance, available: "0.001", usdPrice: "2.5" },
    ]).total,
    "0.01",
  );
  assert.equal(usdTotals([balance]).total, "9,007,199,254,740,993.12");
});
