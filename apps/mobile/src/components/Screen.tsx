import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { ArrowLeft, WifiOff } from "lucide-react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { AppText } from "./ui";
import { colors, space } from "@/lib/theme";
import { useIsOnline } from "@/lib/network";

export function OfflineBanner() {
  const online = useIsOnline();
  if (online) return null;
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutUp} style={styles.offline} accessibilityLiveRegion="polite">
      <WifiOff size={14} color={colors.white} />
      <AppText variant="small" color={colors.white}>
        You're offline — showing what was last loaded
      </AppText>
    </Animated.View>
  );
}

/**
 * Standard screen: safe areas, optional pull-to-refresh and keyboard avoidance.
 * `header` renders above the scroll content (e.g. the dark hero header).
 */
export function Screen({
  children,
  refreshing,
  onRefresh,
  scroll = true,
  keyboard,
  header,
  contentStyle,
  dark,
  edgeTop = true,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  keyboard?: boolean;
  header?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  dark?: boolean;
  edgeTop?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[{ padding: space.xl, paddingBottom: space.xxxl + insets.bottom }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.turquoise]} tintColor={colors.turquoise} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: dark ? colors.navy : colors.bg, paddingTop: edgeTop && !header ? insets.top : 0 }}>
      <StatusBar style={dark || header ? "light" : "dark"} />
      {header}
      <OfflineBanner />
      {keyboard ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

/** Dark navy hero header used at the top of the main tabs (matches the reference design). */
export function HeroHeader({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + space.lg }, style]}>
      {children}
    </View>
  );
}

/** Simple stack header with Android-style back arrow. */
export function TopBar({ title, right, onBack }: { title: string; right?: React.ReactNode; onBack?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topbar, { paddingTop: insets.top + space.sm }]}>
      <Pressable
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))}
        hitSlop={12}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={22} color={colors.navy} />
      </Pressable>
      <AppText variant="h3" style={{ flex: 1, textAlign: "center" }} numberOfLines={1}>
        {title}
      </AppText>
      <View style={{ width: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  offline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.navy3,
    paddingVertical: 6,
  },
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    backgroundColor: colors.bg,
  },
  back: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
});
