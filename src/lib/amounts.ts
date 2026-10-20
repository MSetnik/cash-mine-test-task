import { Decimal } from "decimal.js";
import type { Balance, ClaimOptions } from "../api/contracts.ts";

// Precision grows with the operands: no financial operations use JS numbers.
function arithmetic(values: string[], count = 1) {
  return Decimal.clone({
    precision:
      Math.max(80, ...values.map((v) => v.length * 2)) +
      String(count).length +
      10,
  });
}
export function parseAmount(value: string, decimals: number): string | null {
  if (
    value.length > 80 ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(value) ||
    (value.split(".")[1]?.length ?? 0) > decimals
  )
    return null;
  return new Decimal(value).toFixed();
}
export function previewClaim(
  value: string,
  balance: Balance,
  options: ClaimOptions,
  destinationId: string,
) {
  const amount = parseAmount(value, balance.decimals);
  if (amount === null)
    return {
      error: `Use digits with up to ${balance.decimals} decimal places.`,
      amount: null,
      receive: null,
    };
  const D = arithmetic([
    amount,
    balance.available,
    options.fee,
    options.minAmount,
  ]);
  const n = new D(amount);
  const error = !n.isPositive()
    ? "Enter an amount greater than zero."
    : n.lt(options.minAmount)
      ? `Minimum claim is ${options.minAmount} ${balance.asset}.`
      : n.gt(balance.available)
        ? "This amount exceeds your available balance."
        : n.lt(options.fee)
          ? "The amount must cover the fee."
          : !options.destinations.some((d) => d.id === destinationId)
            ? "Choose an available destination."
            : null;
  return {
    error,
    amount,
    receive: error ? null : n.minus(options.fee).toFixed(),
  };
}
export function usdTotals(items: Balance[]) {
  const D = arithmetic(
    items.flatMap((b) => [b.available, b.pending, b.claiming, b.usdPrice]),
    items.length,
  );
  let available = new D(0),
    pending = new D(0),
    claiming = new D(0);
  for (const b of items) {
    available = available.plus(new D(b.available).times(b.usdPrice));
    pending = pending.plus(new D(b.pending).times(b.usdPrice));
    claiming = claiming.plus(new D(b.claiming).times(b.usdPrice));
  }
  const format = (value: Decimal) =>
    value
      .toFixed(2, Decimal.ROUND_HALF_UP)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return {
    available: format(available),
    pending: format(pending),
    claiming: format(claiming),
    total: format(available.plus(pending).plus(claiming)),
  };
}
