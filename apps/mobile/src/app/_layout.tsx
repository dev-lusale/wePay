import React, { useEffect } from "react";
import { View } from "react-native";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
// Import only the weights we use so the APK doesn't ship all 18 Poppins files.
import { Poppins_400Regular } from "@expo-google-fonts/poppins/400Regular";
import { Poppins_500Medium } from "@expo-google-fonts/poppins/500Medium";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins/600SemiBold";
import { Poppins_700Bold } from "@expo-google-fonts/poppins/700Bold";
import { AuthProvider, useAuth } from "@/lib/auth";
import { queryClient, setupNetworkManagers } from "@/lib/network";
import { configProblem } from "@/lib/config";
import { colors, space } from "@/lib/theme";
import { AppText, Button } from "@/components/ui";

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  useEffect(() => setupNetworkManagers(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootNavigator fontsLoaded={fontsLoaded} />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { status } = useAuth();
  const ready = fontsLoaded && status !== "loading";

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  const problem = configProblem();
  if (problem) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: space.xxl, backgroundColor: colors.navy }}>
        <AppText variant="h2" color={colors.white}>App not configured</AppText>
        <AppText color={colors.onDarkMuted} style={{ marginTop: space.sm }}>{problem}</AppText>
      </View>
    );
  }

  const signedIn = status === "signedIn";
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

/** Shown instead of a blank screen if any screen throws while rendering. */
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: space.xxl, backgroundColor: colors.bg, gap: space.md }}>
      <AppText variant="h2">Something went wrong</AppText>
      <AppText color={colors.textMuted}>This screen couldn't be displayed. Check your connection and try again.</AppText>
      <Button title="Try again" onPress={() => void retry()} />
    </View>
  );
}
