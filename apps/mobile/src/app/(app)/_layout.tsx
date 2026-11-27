import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export const unstable_settings = { anchor: "(tabs)" };

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="loans/apply" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="loans/[id]" />
      <Stack.Screen name="transactions/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="profile/personal" />
      <Stack.Screen name="profile/employment" />
      <Stack.Screen name="profile/credit" />
      <Stack.Screen name="profile/security" />
      <Stack.Screen name="profile/privacy" />
      <Stack.Screen name="profile/help" />
    </Stack>
  );
}
