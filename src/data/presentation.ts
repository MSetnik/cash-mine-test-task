import type { ActivityItem } from "../api/contracts.ts";
export function assetPresentation(asset: string) {
  const known: Record<
    string,
    { name: string; symbol: string; color: string; tint: string }
  > = {
    USDT: { name: "Tether", symbol: "₮", color: "#21764B", tint: "#EAF3ED" },
    BTC: { name: "Bitcoin", symbol: "₿", color: "#A94708", tint: "#F4E9DC" },
    ETH: { name: "Ethereum", symbol: "Ξ", color: "#5B3B8A", tint: "#EDE9F7" },
  };
  return (
    known[asset] ?? {
      name: asset,
      symbol: asset.slice(0, 1),
      color: "#625B54",
      tint: "#EFEBE6",
    }
  );
}
export function presentActivity(item: ActivityItem) {
  return {
    id: item.id,
    asset: item.asset,
    kind:
      item.type === "accrual"
        ? "Payback"
        : item.type === "claim"
          ? "Claim"
          : "Reversal",
    title:
      item.type === "accrual"
        ? `${item.exchange} payback`
        : item.type === "claim"
          ? "Claim"
          : "Payback adjustment",
    subtitle: `${item.type === "reversal" ? `${item.exchange} · ` : ""}${item.createdAt.slice(11, 16)} UTC`,
    amount:
      item.type === "accrual" && !item.amount.startsWith("-")
        ? `+${item.amount}`
        : item.amount,
    status: item.status[0].toUpperCase() + item.status.slice(1),
    date: item.createdAt.slice(0, 10),
  };
}
export type PresentedActivity = ReturnType<typeof presentActivity>;
