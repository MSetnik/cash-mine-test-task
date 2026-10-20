import { palette as c } from "@/constants/cashmine";
import type { ActivityItem } from "@/data/demo";
import { StyleSheet, View } from "react-native";
import { Copy, Icon, Status } from "./ui";

export function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <View style={s.row}>
      <View
        style={[
          s.icon,
          item.kind === "Payback" && { backgroundColor: c.positiveSoft },
        ]}
      >
        <Icon
          name={
            item.kind === "Payback"
              ? "down"
              : item.kind === "Claim"
                ? "up"
                : "refresh"
          }
          size={18}
          color={item.kind === "Payback" ? c.positive : c.muted}
        />
      </View>
      <View style={s.content}>
        <View style={s.top}>
          <Copy weight="semibold" style={s.title}>
            {item.title}
          </Copy>
          <Copy
            weight="semibold"
            style={[s.amount, item.kind === "Payback" && { color: c.positive }]}
          >
            {item.amount} <Copy style={s.unit}>{item.asset}</Copy>
          </Copy>
        </View>
        <Copy muted style={s.subtitle}>
          {item.subtitle}
        </Copy>
        <Status
          tone={
            item.status === "Pending"
              ? "warning"
              : item.status === "Failed"
                ? "negative"
                : "positive"
          }
        >
          {item.status}
        </Status>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 17,
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: c.field,
  },
  icon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.field,
    marginTop: 2,
  },
  content: { flex: 1, gap: 5 },
  top: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: 8,
    rowGap: 2,
  },
  title: { fontSize: 13 },
  amount: { fontSize: 13, fontVariant: ["tabular-nums"] },
  unit: { fontSize: 10, color: c.muted },
  subtitle: { fontSize: 11, lineHeight: 17 },
});
