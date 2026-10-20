import { strings } from "@/localization";
import { router } from "expo-router";
import { View } from "react-native";
import { Shell } from "@/components/cashmine/shell";
import { Action, Copy, Icon } from "@/components/cashmine/ui";
import { palette } from "@/styles/theme";

export default function NotFoundScreen() {
  return (
    <Shell title={strings.notFound.pageTitle}>
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
          {strings.notFound.title}
        </Copy>
        <Copy muted>{strings.notFound.description}</Copy>
        <Action onPress={() => router.replace("/")}>
          {strings.notFound.back}
        </Action>
      </View>
    </Shell>
  );
}
