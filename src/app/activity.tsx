import { strings, activityDate } from "@/localization";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ActivityRow } from "@/components/cashmine/activity-row";
import { Shell } from "@/components/cashmine/shell";
import { Action, Copy, Icon } from "@/components/cashmine/ui";
import { palette as c, typography as font } from "@/styles/theme";
import { demoActivity, type ActivityKind } from "@/data/demo";

export default function ActivityScreen() {
  const [filter, setFilter] = useState<"All" | ActivityKind>("All");
  const [limit, setLimit] = useState(4);
  const items = demoActivity.filter(
    (item) => filter === "All" || item.kind === filter,
  );
  const visible = items.slice(0, limit);
  return (
    <Shell title={strings.activity.pageTitle}>
      <View style={s.page}>
        <Copy style={s.eyebrow}>{strings.activity.eyebrow}</Copy>
        <Copy role="heading" aria-level={1} style={s.title}>
          {strings.activity.title}
        </Copy>
        <Copy muted style={s.subtitle}>
          {strings.activity.subtitle}
        </Copy>
        <View style={s.filters}>
          {(["All", "Payback", "Claim", "Reversal"] as const).map((kind) => (
            <Pressable
              key={kind}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === kind }}
              aria-pressed={filter === kind}
              onPress={() => {
                setFilter(kind);
                setLimit(4);
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
                {strings.activity.filters[kind]}
              </Copy>
            </Pressable>
          ))}
        </View>
        <View accessibilityLiveRegion="polite">
          {visible.map((item, index) => (
            <View key={item.id}>
              {(index === 0 || visible[index - 1].date !== item.date) && (
                <Copy muted style={s.date}>
                  {activityDate(item.date)}
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
        {visible.length === 0 && (
          <View style={s.empty}>
            <Icon name="activity" color={c.muted} size={32} />
            <Copy weight="semibold">{strings.activity.emptyTitle}</Copy>
            <Copy muted>{strings.activity.emptyDescription}</Copy>
          </View>
        )}
        <Copy muted style={s.count}>
          {strings.activity.count(visible.length, items.length)}
        </Copy>
        {limit < items.length && (
          <Action
            variant="secondary"
            onPress={() => setLimit((value) => value + 4)}
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
