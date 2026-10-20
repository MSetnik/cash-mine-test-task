import { Link, router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { ActivityRow } from "@/components/cashmine/activity-row";
import { Shell } from "@/components/cashmine/shell";
import {
  Action,
  Copy,
  Icon,
  SectionTitle,
  Status,
} from "@/components/cashmine/ui";
import { palette as c, type as font } from "@/constants/cashmine";
import { assetPresentation } from "@/data/presentation";
import { usdTotals } from "@/lib/amounts";
import { useBalances, useOperation } from "@/state/session";
import { useActivity } from "@/state/activity";
import {
  ClaimStatusCard,
  RequestError,
  SnapshotTime,
} from "@/components/cashmine/live-state";

export default function HomeScreen() {
  const balances = useBalances();
  const activity = useActivity();
  const { operation } = useOperation();
  const refreshing = balances.isFetching;
  const totals = balances.data ? usdTotals(balances.data.items) : null;
  function refresh() {
    void balances.refetch();
  }
  return (
    <Shell title="Balances">
      <View style={s.heading}>
        <View style={{ flex: 1 }}>
          <Copy style={s.eyebrow}>YOUR PAYBACK</Copy>
          <Copy role="heading" aria-level={1} style={s.title}>
            Made from your trades.
          </Copy>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh balances"
          disabled={refreshing}
          onPress={refresh}
          style={({ pressed }) => [s.refresh, pressed && { opacity: 0.6 }]}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={c.muted} />
          ) : (
            <Icon name="refresh" size={21} />
          )}
        </Pressable>
      </View>
      <ClaimStatusCard />
      <RequestError error={balances.error} retry={refresh} />
      {balances.isPending && <Copy>Loading balances…</Copy>}
      {totals && (
        <View style={s.balanceCard}>
          <View style={s.balanceTop}>
            <Copy style={{ color: c.darkMuted }}>Total payback</Copy>
            <Copy style={s.currency}>USD</Copy>
          </View>
          <Copy style={s.total}>${totals.total}</Copy>
          <Copy style={s.balanceCaption}>
            Your available, pending, and claiming balances.
          </Copy>
          <View style={s.stats}>
            {[
              ["Available", `$${totals.available}`, c.brand],
              ["Pending", `$${totals.pending}`, c.darkMuted],
              ["Claiming", `$${totals.claiming}`, c.darkBorder],
            ].map(([label, amount, color]) => (
              <View style={s.stat} key={label}>
                <View style={s.statLabel}>
                  <View style={[s.dot, { backgroundColor: color }]} />
                  <Copy style={s.statText}>{label}</Copy>
                </View>
                <Copy style={s.statValue}>{amount}</Copy>
              </View>
            ))}
          </View>
          <Action
            disabled={!!operation}
            icon="arrow"
            onPress={() => router.push("/claim")}
          >
            Claim payback
          </Action>
        </View>
      )}
      <View style={s.freshness} accessibilityLiveRegion="polite">
        <SnapshotTime asOf={balances.data?.asOf} refreshing={refreshing} />
      </View>
      <View nativeID="dashboard-columns" style={s.columns}>
        <View style={s.column}>
          <SectionTitle
            aside={
              <Copy muted style={s.small}>
                {balances.data?.items.length ?? "—"} assets
              </Copy>
            }
          >
            Your assets
          </SectionTitle>
          {balances.data?.items.map((balance) => {
            const asset = {
              ...balance,
              ...assetPresentation(balance.asset),
              usd: usdTotals([balance]).total,
            };
            return (
              <Pressable
                key={asset.asset}
                accessibilityRole="button"
                accessibilityLabel={`Claim ${asset.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/claim",
                    params: { asset: asset.asset },
                  })
                }
                style={({ pressed }) => [
                  s.assetCard,
                  pressed && { opacity: 0.72 },
                ]}
              >
                <View style={s.assetTop}>
                  <View style={[s.coin, { backgroundColor: asset.tint }]}>
                    <Copy
                      style={{
                        color: asset.color,
                        fontSize: 25,
                        fontFamily: font.semibold,
                      }}
                    >
                      {asset.symbol}
                    </Copy>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Copy weight="semibold" style={{ fontSize: 15 }}>
                      {asset.name}
                    </Copy>
                    <Copy muted style={s.small}>
                      {asset.asset}
                    </Copy>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Copy weight="semibold" style={{ fontSize: 17 }}>
                      ${asset.usd}
                    </Copy>
                    <Copy muted style={s.small}>
                      Total value
                    </Copy>
                  </View>
                  <Icon name="right" size={17} color={c.muted} />
                </View>
                <View style={s.assetLine} />
                <View style={s.assetDetail}>
                  <Copy muted style={s.small}>
                    Available
                  </Copy>
                  <Copy weight="semibold" style={s.small}>
                    {asset.available} {asset.asset}
                  </Copy>
                </View>
                <View style={s.assetDetail}>
                  <Copy muted style={s.small}>
                    Pending
                  </Copy>
                  <Copy muted style={s.small}>
                    {asset.pending} {asset.asset}
                  </Copy>
                </View>
                {asset.claiming !== "0" && (
                  <View style={s.assetDetail}>
                    <Copy style={[s.small, { color: c.accent }]}>Claiming</Copy>
                    <Copy style={[s.small, { color: c.accent }]}>
                      {asset.claiming} {asset.asset}
                    </Copy>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={s.column}>
          <SectionTitle
            aside={
              <Link href="/activity" style={s.textLink}>
                View all ↗
              </Link>
            }
          >
            Recent activity
          </SectionTitle>
          <RequestError
            error={activity.error}
            retry={() => void activity.refetch()}
          />
          {activity.isPending && <Copy>Loading activity…</Copy>}
          <View style={s.activityCard}>
            {activity.items.slice(0, 3).map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </View>
          <View style={s.explainer}>
            <Status tone="warning">Good to know</Status>
            <Copy weight="semibold" style={{ fontSize: 17 }}>
              Trading fees. Coming back.
            </Copy>
            <Copy muted>
              Your confirmed payback is ready to claim. Pending payback becomes
              available once it’s confirmed.
            </Copy>
          </View>
        </View>
      </View>
    </Shell>
  );
}
const s = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 24,
  },
  eyebrow: {
    color: c.accent,
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: font.semibold,
    marginBottom: 5,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.8,
    fontFamily: font.semibold,
  },
  refresh: {
    flexShrink: 0,
    backgroundColor: c.card,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: { backgroundColor: c.dark, padding: 24, borderRadius: 24 },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currency: {
    color: c.darkMuted,
    fontSize: 10,
    borderWidth: 1,
    borderColor: c.darkBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  total: {
    color: c.card,
    fontFamily: font.semibold,
    fontSize: 39,
    lineHeight: 64,
    letterSpacing: -2,
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  cents: {
    color: c.darkMuted,
    fontFamily: font.regular,
    fontSize: 36,
    letterSpacing: -1,
  },
  balanceCaption: {
    color: c.darkMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },
  allocation: {
    flexDirection: "row",
    gap: 4,
    height: 5,
    marginTop: 25,
    marginBottom: 18,
  },
  bar: { borderRadius: 3 },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginVertical: 24,
  },
  stat: { flex: 1, gap: 5 },
  statLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { height: 5, width: 5, borderRadius: 3 },
  statText: { color: c.darkMuted, fontSize: 10 },
  statValue: {
    color: c.card,
    fontFamily: font.semibold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  freshness: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    marginBottom: 18,
  },
  columns: { gap: 28 },
  column: { gap: 16 },
  small: { fontSize: 12, lineHeight: 19 },
  assetCard: { backgroundColor: c.card, borderRadius: 18, padding: 18, gap: 7 },
  assetTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  coin: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  assetLine: { height: 1, backgroundColor: c.field, marginVertical: 6 },
  assetDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  textLink: {
    color: c.accent,
    fontSize: 12,
    fontFamily: font.semibold,
    paddingVertical: 12,
  },
  activityCard: {
    backgroundColor: c.card,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  explainer: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    padding: 20,
    gap: 10,
  },
});
