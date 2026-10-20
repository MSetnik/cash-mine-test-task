import { strings } from "@/localization";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { palette } from "@/styles/theme";
import "@/global.css";
import { SessionGate } from "@/state/session";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: require("@/assets/fonts/Inter-Regular.ttf"),
    InterSemiBold: require("@/assets/fonts/Inter-SemiBold.ttf"),
    InterBold: require("@/assets/fonts/Inter-Bold.ttf"),
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          accessibilityLabel={strings.shell.loading}
          color={palette.accent}
        />
      </View>
    );
  return (
    <>
      <StatusBar style="dark" />
      <SessionGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.background },
            animation: "none",
          }}
        />
      </SessionGate>
    </>
  );
}
