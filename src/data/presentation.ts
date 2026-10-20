import { palette } from "../styles/theme/colors.ts";
import type { ActivityItem } from "../api/contracts.ts";
export function assetPresentation(asset: string) {
  const known: Record<
    string,
    { name: string; symbol: string; color: string; tint: string }
  > = {
    USDT: { name: "Tether", symbol: "₮", color: palette.positive, tint: palette.positiveSoft },
    BTC: { name: "Bitcoin", symbol: "₿", color: palette.accent, tint: palette.promo },
    ETH: { name: "Ethereum", symbol: "Ξ", color: palette.ethereum, tint: palette.ethereumSoft },
  };
  return (
    known[asset] ?? {
      name: asset,
      symbol: asset.slice(0, 1),
      color: palette.muted,
      tint: palette.field,
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
