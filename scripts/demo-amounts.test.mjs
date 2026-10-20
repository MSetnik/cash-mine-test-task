import assert from "node:assert/strict";
import test from "node:test";
import {
  demoAssets,
  parseDemoAmount,
  formatDemoUnits,
  previewDemoClaim,
} from "../src/data/demo.ts";

test("parsing preserves precision beyond JavaScript safe integers", () => {
  assert.equal(
    parseDemoAmount("9007199254740993.123456", 6),
    9007199254740993123456n,
  );
  assert.equal(
    formatDemoUnits(9007199254740993123456n, 6),
    "9007199254740993.123456",
  );
});
test("malformed amounts and excess precision are rejected", () => {
  for (const value of [
    "",
    ".5",
    "1.",
    "05",
    "-1",
    "+1",
    "1e-3",
    "1,000",
    " 1",
    "0.1234567",
  ]) {
    assert.equal(parseDemoAmount(value, 6), null, value);
  }
});
test("minimum, available, and one-unit-outside boundaries are exact", () => {
  const usdt = demoAssets[0];
  assert.equal(previewDemoClaim("9.999999", usdt).receive, null);
  assert.equal(previewDemoClaim("10", usdt).receive, "9");
  assert.equal(previewDemoClaim(usdt.available, usdt).receive, "819.413207");
  assert.equal(previewDemoClaim("820.413208", usdt).receive, null);
});
test("fractional asset fees are deducted once from Max", () => {
  const btc = demoAssets[1];
  const eth = demoAssets[2];
  assert.equal(previewDemoClaim(btc.available, btc).receive, "0.00318");
  assert.equal(previewDemoClaim(eth.available, eth).receive, "0.0408");
  assert.equal(formatDemoUnits(0n, 18), "0");
});
