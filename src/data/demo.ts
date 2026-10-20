/** Deliberate fixtures. No API, token, or remote account is used by this preview. */
export const demoAssets = [
  {
    asset: "USDT",
    name: "Tether",
    symbol: "₮",
    decimals: 6,
    available: "820.413207",
    pending: "50.12",
    claiming: "0",
    usd: "870.53",
    min: "10",
    fee: "1",
    color: "#21764B",
    tint: "#EAF3ED",
  },
  {
    asset: "BTC",
    name: "Bitcoin",
    symbol: "₿",
    decimals: 8,
    available: "0.0032",
    pending: "0.00018",
    claiming: "0",
    usd: "228.15",
    min: "0.0001",
    fee: "0.00002",
    color: "#A94708",
    tint: "#F4E9DC",
  },
  {
    asset: "ETH",
    name: "Ethereum",
    symbol: "Ξ",
    decimals: 18,
    available: "0.042",
    pending: "0.003",
    claiming: "0.01",
    usd: "176.00",
    min: "0.01",
    fee: "0.0012",
    color: "#5B3B8A",
    tint: "#EDE9F7",
  },
] as const;
export type DemoAsset = (typeof demoAssets)[number];
export type ActivityKind = "Payback" | "Claim" | "Reversal";
export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  amount: string;
  asset: string;
  status: "Confirmed" | "Pending" | "Completed" | "Failed";
  date: string;
};
export const demoActivity: ActivityItem[] = [
  {
    id: "a1",
    kind: "Payback",
    title: "Binance payback",
    subtitle: "Trading fee payback · 10:42",
    amount: "+12.84",
    asset: "USDT",
    status: "Confirmed",
    date: "20 October 2026",
  },
  {
    id: "a2",
    kind: "Claim",
    title: "Claim to wallet",
    subtitle: "Wallet 0x8f3e…a91c · 10:18",
    amount: "−0.01",
    asset: "ETH",
    status: "Pending",
    date: "20 October 2026",
  },
  {
    id: "a3",
    kind: "Payback",
    title: "Bybit payback",
    subtitle: "Trading fee payback · 09:36",
    amount: "+0.00018",
    asset: "BTC",
    status: "Pending",
    date: "20 October 2026",
  },
  {
    id: "a4",
    kind: "Claim",
    title: "Claim to wallet",
    subtitle: "Wallet 0x8f3e…a91c · 16:24",
    amount: "−100",
    asset: "USDT",
    status: "Completed",
    date: "19 October 2026",
  },
  {
    id: "a5",
    kind: "Reversal",
    title: "Payback adjustment",
    subtitle: "Binance · 14:05",
    amount: "−2.40",
    asset: "USDT",
    status: "Confirmed",
    date: "19 October 2026",
  },
  {
    id: "a6",
    kind: "Payback",
    title: "OKX payback",
    subtitle: "Trading fee payback · 11:08",
    amount: "+0.012",
    asset: "ETH",
    status: "Confirmed",
    date: "19 October 2026",
  },
  {
    id: "a7",
    kind: "Claim",
    title: "Claim to wallet",
    subtitle: "Amount returned to available · 08:32",
    amount: "10",
    asset: "USDT",
    status: "Failed",
    date: "18 October 2026",
  },
];

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
export function previewDemoClaim(value: string, asset: DemoAsset) {
  const units = parseDemoAmount(value, asset.decimals);
  if (units === null)
    return {
      error: `Use a valid amount with up to ${asset.decimals} decimal places.`,
      receive: null,
    };
  if (units < parseDemoAmount(asset.min, asset.decimals)!)
    return {
      error: `Minimum claim is ${asset.min} ${asset.asset}.`,
      receive: null,
    };
  if (units > parseDemoAmount(asset.available, asset.decimals)!)
    return {
      error: "This amount exceeds your available balance.",
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
