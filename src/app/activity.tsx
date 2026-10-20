import { strings } from "@/localization";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ActivityRow } from "@/components/cashmine/activity-row";
import { Shell } from "@/components/cashmine/shell";
import { Action, Copy, Icon } from "@/components/cashmine/ui";
import { palette as c, typography as font } from "@/styles/theme";
import { useActivity } from "@/state/activity";
import { RequestError } from "@/components/cashmine/live-state";

export default function ActivityScreen() {
  const [filter, setFilter] = useState<
    "All" | "Payback" | "Claim" | "Reversal"
  >("All");
  const query = useActivity();
  const items = query.items.filter(
    (item) => filter === "All" || item.kind === filter,
  );
  const visible = items;
  return (
    <Shell title="Activity">
      <View style={s.page}>
        <Copy style={s.eyebrow}>{strings.activity.eyebrow}</Copy>
        <Copy role="heading" aria-level={1} style={s.title}>
          {strings.activity.title}
        </Copy>
        <Copy muted style={s.subtitle}>
          {strings.activity.subtitle}
        </Copy>
        <RequestError
          error={query.error}
          retry={() => {
            void (query.isFetchNextPageError
              ? query.fetchNextPage()
              : query.refetch());
          }}
        />
        <Action
          variant="quiet"
          busy={query.isFetching && !query.isFetchingNextPage}
          onPress={() => void query.refetch()}
        >
          Refresh activity
        </Action>
        {query.isPending && <Copy>Loading activity…</Copy>}
        <View style={s.filters}>
          {(["All", "Payback", "Claim", "Reversal"] as const).map((kind) => (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === kind }}
              aria-pressed={filter === kind}
              onPress={() => {
                setFilter(kind);
              }}
              style={({ pressed }) => [
                s.filter,
                filter === kind && s.selected,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Copy
                weight={filter === kind ? "semibold" : "regular"}
                style={{
                  fontSize: 12,
                  color: filter === kind ? c.card : c.muted,
                }}
              >
                {kind === "Claim"
                  ? "Claims"
                  : kind === "Reversal"
                    ? "Reversals"
                    : kind}
              </Copy>
            </Pressable>
          ))}
        </View>
        <View accessibilityLiveRegion="polite">
          {visible.map((item, index) => (
            <View key={item.id}>
              {(index === 0 || visible[index - 1].date !== item.date) && (
                <Copy muted style={s.date}>
                  {item.date} · UTC
                </Copy>
              )}
              <View
                style={[
                  s.item,
                  (index === 0 || visible[index - 1].date !== item.date) && {
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                  },
                  (index === visible.length - 1 ||
                    visible[index + 1].date !== item.date) && {
                    borderBottomLeftRadius: 18,
                    borderBottomRightRadius: 18,
                  },
                ]}
              >
                <ActivityRow item={item} />
              </View>
            </View>
          ))}
        </View>
        {visible.length === 0 && !query.isPending && !query.error && (
          <View style={s.empty}>
            <Icon name="activity" color={c.muted} size={32} />
            <Copy weight="semibold">{strings.activity.emptyTitle}</Copy>
            <Copy muted>{strings.activity.emptyDescription}</Copy>
          </View>
        )}
        <Copy muted style={s.count}>
          {visible.length} matching transactions loaded
        </Copy>
        {query.hasNextPage && (
          <Action
            variant="secondary"
            busy={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          >
            {strings.activity.loadMore}
          </Action>
        )}
      </View>
    </Shell>
  );
}
const s = StyleSheet.create({
  page: { maxWidth: 640, width: "100%", alignSelf: "center" },
  eyebrow: {
    fontSize: 10,
    color: c.accent,
    letterSpacing: 1.8,
    fontFamily: font.semibold,
    marginBottom: 8,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 27,
    lineHeight: 35,
    letterSpacing: -1,
  },
  subtitle: { marginTop: 10, marginBottom: 26 },
  filters: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: c.field,
    borderRadius: 12,
    padding: 5,
    marginBottom: 8,
  },
  filter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    borderRadius: 9,
  },
  selected: { backgroundColor: c.ink },
  date: {
    fontSize: 11,
    marginTop: 22,
    marginBottom: 12,
    fontFamily: font.semibold,
  },
  item: { paddingHorizontal: 16, backgroundColor: c.card },
  count: { textAlign: "center", fontSize: 11, marginVertical: 20 },
  empty: { alignItems: "center", padding: 32, gap: 12 },
});
