import type {
  ActivityItem,
  ActivityResponse,
  BalancesResponse,
  Claim,
  ClaimOptions,
} from "./contracts.ts";

export const DECIMAL_PATTERN = /^(0|[1-9]\d*)(\.\d+)?$/;
const SIGNED_DECIMAL_PATTERN = /^-?(0|[1-9]\d*)(\.\d+)?$/;

// Compare valid transport decimals without choosing an arithmetic representation.
// The server may normalize insignificant trailing fractional zeros.
export function sameDecimal(left: string, right: string): boolean {
  const normalize = (value: string) => value.includes(".")
    ? value.replace(/0+$/, "").replace(/\.$/, "")
    : value;
  return normalize(left) === normalize(right);
}

function invalid(field: string): never {
  // Include the field, never raw response data or credentials.
  throw new Error(`Invalid API response field: ${field}.`);
}

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return invalid("object");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  return typeof value === "string" && value.length > 0 ? value : invalid(field);
}

function nullableText(value: unknown, field: string): string | null {
  return value === null ? null : text(value, field);
}

function amount(value: unknown, field: string, signed = false): string {
  const result = text(value, field);
  return (signed ? SIGNED_DECIMAL_PATTERN : DECIMAL_PATTERN).test(result)
    ? result
    : invalid(field);
}

function timestamp(value: unknown, field: string): string {
  const result = text(value, field);
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(result)
    && Number.isFinite(Date.parse(result))
    ? result
    : invalid(field);
}

function array(value: unknown, field: string): unknown[] {
  return Array.isArray(value) ? value : invalid(field);
}

function oneOf<const T extends string>(
  value: unknown,
  choices: readonly T[],
  field: string,
): T {
  return choices.includes(value as T) ? value as T : invalid(field);
}

const claimStatuses = ["pending", "completed", "failed"] as const;

export function parseBalances(value: unknown): BalancesResponse {
  const data = object(value);
  return {
    asOf: timestamp(data.asOf, "asOf"),
    items: array(data.items, "items").map((item) => {
      const row = object(item);
      const decimals = row.decimals;
      if (typeof decimals !== "number" || !Number.isSafeInteger(decimals) || decimals < 0) {
        return invalid("decimals");
      }
      const available = amount(row.available, "available");
      const pending = amount(row.pending, "pending");
      const claiming = amount(row.claiming, "claiming");
      for (const value of [available, pending, claiming]) {
        if ((value.split(".")[1]?.length ?? 0) > decimals) invalid("balance precision");
      }
      return {
        asset: text(row.asset, "asset"),
        decimals,
        available,
        pending,
        claiming,
        usdPrice: amount(row.usdPrice, "usdPrice"),
      };
    }),
  };
}

export function parseClaimOptions(value: unknown): ClaimOptions {
  const data = object(value);
  return {
    asset: text(data.asset, "asset"),
    minAmount: amount(data.minAmount, "minAmount"),
    fee: amount(data.fee, "fee"),
    destinations: array(data.destinations, "destinations").map((item) => {
      const row = object(item);
      return { id: text(row.id, "destination.id"), label: text(row.label, "destination.label") };
    }),
  };
}

export function parseClaim(value: unknown): Claim {
  const data = object(value);
  return {
    id: text(data.id, "id"),
    asset: text(data.asset, "asset"),
    amount: amount(data.amount, "amount"),
    fee: amount(data.fee, "fee"),
    receiveAmount: amount(data.receiveAmount, "receiveAmount"),
    destinationId: text(data.destinationId, "destinationId"),
    status: oneOf(data.status, claimStatuses, "status"),
    failureReason: nullableText(data.failureReason, "failureReason"),
    createdAt: timestamp(data.createdAt, "createdAt"),
    updatedAt: timestamp(data.updatedAt, "updatedAt"),
  };
}

export function parseActivity(value: unknown): ActivityResponse {
  const data = object(value);
  return {
    nextCursor: nullableText(data.nextCursor, "nextCursor"),
    items: array(data.items, "items").map((item): ActivityItem => {
      const row = object(item);
      const base = {
        id: text(row.id, "id"),
        asset: text(row.asset, "asset"),
        amount: amount(row.amount, "amount", true),
        createdAt: timestamp(row.createdAt, "createdAt"),
        relatedId: nullableText(row.relatedId, "relatedId"),
      };
      const type = oneOf(row.type, ["accrual", "reversal", "claim"], "type");
      if (type === "claim") {
        if (row.exchange !== null) invalid("exchange");
        return { ...base, type, status: oneOf(row.status, claimStatuses, "status"), exchange: null };
      }
      const exchange = text(row.exchange, "exchange");
      if (type === "reversal") {
        return { ...base, type, exchange, status: oneOf(row.status, ["confirmed"], "status") };
      }
      return { ...base, type, exchange, status: oneOf(row.status, ["pending", "confirmed"], "status") };
    }),
  };
}
