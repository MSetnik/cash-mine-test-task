import type { ActivityItem } from "@/data/demo";
import { en } from "./en";

export const locale = "en-GB";
export const strings = en;

const activityDateFormatter = new Intl.DateTimeFormat(locale, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function activityDate(isoDate: string) {
  return strings.activity.dateGroup(
    activityDateFormatter.format(new Date(`${isoDate}T00:00:00Z`)),
  );
}

export function activityTitle(item: ActivityItem) {
  if (item.kind === "Payback")
    return strings.activity.paybackTitle(item.exchange);
  return item.kind === "Claim"
    ? strings.activity.claimTitle
    : strings.activity.adjustmentTitle;
}

export function activitySubtitle(item: ActivityItem) {
  if (item.kind === "Payback")
    return strings.activity.paybackSubtitle(item.time);
  if (item.kind === "Reversal")
    return strings.activity.exchangeSubtitle(item.exchange, item.time);
  return item.status === "Failed"
    ? strings.activity.returnedSubtitle(item.time)
    : strings.activity.walletSubtitle(item.wallet, item.time);
}
