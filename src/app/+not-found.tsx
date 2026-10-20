import { router } from "expo-router";
import { View } from "react-native";
import { Shell } from "@/components/cashmine/shell";
import { Action, Copy, Icon } from "@/components/cashmine/ui";
import { palette } from "@/constants/cashmine";

export default function NotFoundScreen() {
  return (
    <Shell title="Page not found">
      <View
        style={{
          maxWidth: 480,
          alignSelf: "center",
          gap: 20,
          paddingVertical: 40,
        }}
      >
        <Icon name="wallet" size={36} color={palette.accent} />
        <Copy
          role="heading"
          aria-level={1}
          weight="semibold"
          style={{ fontSize: 27, lineHeight: 35 }}
        >
          This page isn’t here.
        </Copy>
        <Copy muted>Head back to your balances to find your payback.</Copy>
        <Action onPress={() => router.replace("/")}>Back to balances</Action>
      </View>
    </Shell>
  );
}
