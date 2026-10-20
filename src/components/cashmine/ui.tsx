import { palette as c, type as font } from "@/constants/cashmine";
import { SymbolView } from "expo-symbols";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextProps,
  View,
} from "react-native";

const symbols = {
  wallet: "account_balance_wallet",
  activity: "history",
  arrow: "arrow_outward",
  back: "arrow_back",
  right: "chevron_right",
  refresh: "refresh",
  clock: "schedule",
  check: "check",
  close: "close",
  shield: "verified_user",
  down: "south_west",
  up: "north_east",
  info: "info",
  error: "error_outline",
} as const;
export function Icon({
  name,
  size = 22,
  color = c.ink,
}: {
  name: keyof typeof symbols;
  size?: number;
  color?: string;
}) {
  return (
    <SymbolView
      name={{ web: symbols[name], android: symbols[name] }}
      size={size}
      tintColor={color}
      aria-hidden
    />
  );
}
export function Copy({
  style,
  weight = "regular",
  muted,
  ...props
}: TextProps & { weight?: keyof typeof font; muted?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        s.copy,
        { fontFamily: font[weight], color: muted ? c.muted : c.ink },
        style,
      ]}
    />
  );
}
type ActionProps = Omit<
  ComponentProps<typeof Pressable>,
  "style" | "children"
> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  icon?: keyof typeof symbols;
  busy?: boolean;
};
export function Action({
  children,
  variant = "primary",
  icon,
  busy,
  disabled,
  ...props
}: ActionProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled || busy}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={({ pressed }) => [
        s.action,
        s[variant],
        (disabled || busy) && s.disabled,
        pressed && s.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={c.ink} size="small" />
      ) : (
        <>
          <Copy weight="semibold">{children}</Copy>
          {icon && <Icon name={icon} size={19} />}
        </>
      )}
    </Pressable>
  );
}
export function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "negative";
}) {
  const colors = {
    neutral: [c.field, c.muted],
    positive: [c.positiveSoft, c.positive],
    warning: [c.promo, c.accent],
    negative: [c.negativeSoft, c.negative],
  };
  return (
    <View style={[s.badge, { backgroundColor: colors[tone][0] }]}>
      <View style={[s.dot, { backgroundColor: colors[tone][1] }]} />
      <Copy style={{ fontSize: 11, color: colors[tone][1] }} weight="semibold">
        {children}
      </Copy>
    </View>
  );
}
export function SectionTitle({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <View style={s.sectionTitle}>
      <Copy weight="semibold" style={{ fontSize: 19 }}>
        {children}
      </Copy>
      {aside}
    </View>
  );
}
const s = StyleSheet.create({
  copy: { fontSize: 14, lineHeight: 21 },
  action: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: c.brand },
  secondary: { backgroundColor: c.field },
  quiet: { backgroundColor: "transparent" },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.72 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  dot: { height: 5, width: 5, borderRadius: 3 },
  sectionTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
});
