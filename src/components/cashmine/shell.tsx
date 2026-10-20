import { palette as c, layout } from "@/styles/theme";
import { Image } from "expo-image";
import { Link, usePathname } from "expo-router";
import Head from "expo-router/head";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "@/state/session";
import { Action, Copy, Icon } from "./ui";

export function Shell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const { changeToken } = useSession();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={s.root}>
      <Head>
        <title>{title} · CashMine</title>
        <meta
          name="description"
          content="CashMine payback balances, claims, and activity."
        />
      </Head>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        style={s.scroll}
      >
        <View style={[s.container, { paddingTop: Math.max(20, insets.top) }]}>
          <View style={s.header}>
            <Link href="/" accessibilityLabel="CashMine home">
              <Image
                source={require("@/assets/brand/cashmine-logo.webp")}
                style={s.logo}
                contentFit="contain"
                accessibilityLabel="CashMine"
              />
            </Link>
            <Action variant="quiet" onPress={changeToken}>
              Change token
            </Action>
          </View>
          {children}
          <View style={s.footer}>
            <Icon name="shield" size={15} color={c.muted} />
            <Copy muted style={{ fontSize: 11 }}>
              Connected to CashMine test API · Test funds only.
            </Copy>
          </View>
        </View>
      </ScrollView>
      <View
        style={[s.navOuter, { paddingBottom: Math.max(12, insets.bottom) }]}
      >
        <View style={s.nav}>
          {(
            [
              { href: "/", label: "Balances", icon: "wallet" },
              { href: "/claim", label: "Claim", icon: "arrow" },
              { href: "/activity", label: "Activity", icon: "activity" },
            ] as const
          ).map((item) => {
            const selected = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={[s.navLink, selected && s.navSelected]}
                aria-current={selected ? "page" : undefined}
              >
                <View style={s.navContent}>
                  <Icon
                    name={item.icon}
                    color={selected ? c.accent : c.muted}
                    size={21}
                  />
                  <Copy
                    weight={selected ? "semibold" : "regular"}
                    style={{
                      fontSize: 11,
                      color: selected ? c.accent : c.muted,
                    }}
                  >
                    {item.label}
                  </Copy>
                </View>
              </Link>
            );
          })}
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.background },
  scroll: { flex: 1 },
  container: {
    width: "100%",
    maxWidth: layout.page,
    alignSelf: "center",
    paddingHorizontal: layout.inset,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    minHeight: 35,
  },
  logo: { width: 120, height: 32 },
  footer: {
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    flexWrap: "wrap",
  },
  navOuter: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 8,
    alignItems: "center",
  },
  nav: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 520,
    paddingHorizontal: 20,
    gap: 8,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    textDecorationLine: "none",
  },
  navSelected: { backgroundColor: c.promo },
  navContent: { alignItems: "center", gap: 3 },
});
