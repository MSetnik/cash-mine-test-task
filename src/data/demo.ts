/** Deliberate fixtures. No API, token, or remote account is used by this preview. */
export const demoAssets = [
  {
    asset: "USDT",
    symbol: "₮",
    decimals: 6,
    available: "820.413207",
    pending: "50.12",
    claiming: "0",
    usd: "870.53",
    min: "10",
    fee: "1",
  },
  {
    asset: "BTC",
    symbol: "₿",
    decimals: 8,
    available: "0.0032",
    pending: "0.00018",
    claiming: "0",
    usd: "228.15",
    min: "0.0001",
    fee: "0.00002",
  },
  {
    asset: "ETH",
    symbol: "Ξ",
    decimals: 18,
    available: "0.042",
    pending: "0.003",
    claiming: "0.01",
    usd: "176.00",
    min: "0.01",
    fee: "0.0012",
  },
] as const;
export type DemoAsset = (typeof demoAssets)[number];
export const demoWallet = "0x8f3e…a91c";
export const demoTotals = {
  whole: "1,274",
  fraction: ".68",
  available: "1,170.81",
  pending: "71.87",
  claiming: "32.00",
} as const;

export type ActivityKind = "Payback" | "Claim" | "Reversal";
type ActivityBase = {
  id: string;
  amount: string;
  asset: string;
  status: "Confirmed" | "Pending" | "Completed" | "Failed";
  date: string;
  time: string;
};
export type ActivityItem = ActivityBase &
  (
    | { kind: "Payback"; exchange: string }
    | { kind: "Reversal"; exchange: string }
    | { kind: "Claim"; wallet: string }
  );
export const demoActivity: ActivityItem[] = [
  {
    id: "a1",
    kind: "Payback",
    exchange: "Binance",
    time: "10:42",
    amount: "+12.84",
    asset: "USDT",
    status: "Confirmed",
    date: "2026-10-20",
  },
  {
    id: "a2",
    kind: "Claim",
    wallet: demoWallet,
    time: "10:18",
    amount: "−0.01",
    asset: "ETH",
    status: "Pending",
    date: "2026-10-20",
  },
  {
    id: "a3",
    kind: "Payback",
    exchange: "Bybit",
    time: "09:36",
    amount: "+0.00018",
    asset: "BTC",
    status: "Pending",
    date: "2026-10-20",
  },
  {
    id: "a4",
    kind: "Claim",
    wallet: demoWallet,
    time: "16:24",
    amount: "−100",
    asset: "USDT",
    status: "Completed",
    date: "2026-10-19",
  },
  {
    id: "a5",
    kind: "Reversal",
    exchange: "Binance",
    time: "14:05",
    amount: "−2.40",
    asset: "USDT",
    status: "Confirmed",
    date: "2026-10-19",
  },
  {
    id: "a6",
    kind: "Payback",
    exchange: "OKX",
    time: "11:08",
    amount: "+0.012",
    asset: "ETH",
    status: "Confirmed",
    date: "2026-10-19",
  },
  {
    id: "a7",
    kind: "Claim",
    wallet: demoWallet,
    time: "08:32",
    amount: "10",
    asset: "USDT",
    status: "Failed",
    date: "2026-10-18",
  },
];

export type DemoClaimError =
  "invalidAmount" | "minimumAmount" | "exceedsAvailable";

// Exact arithmetic for the isolated demo form only. Production choices remain open.
export function parseDemoAmount(
  value: string,
  decimals: number,
): bigint | null {
  if (value.length > 80 || !/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) return null;
  return BigInt(whole + fraction.padEnd(decimals, "0"));
}
export function formatDemoUnits(value: bigint, decimals: number): string {
  const padded = value.toString().padStart(decimals + 1, "0");
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return decimals === 0
    ? padded
    : `${padded.slice(0, -decimals)}${fraction ? `.${fraction}` : ""}`;
}
export function previewDemoClaim(
  value: string,
  asset: DemoAsset,
): {
  error: DemoClaimError | null;
  receive: string | null;
} {
  const units = parseDemoAmount(value, asset.decimals);
  if (units === null)
    return {
      error: "invalidAmount",
      receive: null,
    };
  if (units < parseDemoAmount(asset.min, asset.decimals)!)
    return {
      error: "minimumAmount",
      receive: null,
    };
  if (units > parseDemoAmount(asset.available, asset.decimals)!)
    return {
      error: "exceedsAvailable",
      receive: null,
    };
  return {
    error: null,
    receive: formatDemoUnits(
      units - parseDemoAmount(asset.fee, asset.decimals)!,
      asset.decimals,
    ),
  };
}
