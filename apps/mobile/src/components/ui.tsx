import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AlertCircle, ChevronRight, Inbox, RefreshCw, WifiOff, type LucideIcon } from "lucide-react-native";
import { colors, font, HIT, radius, shadow, space } from "@/lib/theme";

// ─── Text ──────────────────────────────────────────────────────────────────
type Variant = "display" | "h1" | "h2" | "h3" | "body" | "bodyStrong" | "caption" | "label" | "small";
const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: font.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  h1: { fontFamily: font.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontFamily: font.semibold, fontSize: 19, lineHeight: 26 },
  h3: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: font.regular, fontSize: 11, lineHeight: 15 },
};

export function AppText({
  variant = "body",
  color = colors.text,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...rest} style={[variants[variant], { color }, style]} maxFontSizeMultiplier={1.4} />;
}

// ─── Pressable with spring feedback ─────────────────────────────────────────
const APressable = Animated.createAnimatedComponent(Pressable);

export function Touchable({ style, onPressIn, onPressOut, ...rest }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.get() }] }));
  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        s.set(withSpring(0.97, { damping: 20, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, { damping: 20, stiffness: 400 }));
        onPressOut?.(e);
      }}
      style={[style, a]}
    />
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon: Icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "dark" | "secondary" | "ghost" | "danger" | "onDark";
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.mint, fg: colors.navy },
    dark: { bg: colors.navy, fg: colors.white },
    secondary: { bg: colors.surfaceMuted, fg: colors.navy },
    ghost: { bg: "transparent", fg: colors.navy },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    onDark: { bg: colors.navy2, fg: colors.white },
  }[variant];
  const off = disabled || loading;
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress?.();
      }}
      style={[styles.btn, { backgroundColor: palette.bg, opacity: off && !loading ? 0.5 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={palette.fg} strokeWidth={2.2} /> : null}
          <AppText variant="bodyStrong" color={palette.fg} style={{ fontFamily: font.semibold }}>
            {title}
          </AppText>
        </>
      )}
    </Touchable>
  );
}

// ─── Card / Badge / Chip ───────────────────────────────────────────────────
export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: space.lg }, style]}>{children}</View>;
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const t = {
    neutral: [colors.surfaceMuted, colors.textMuted],
    success: [colors.mintSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    info: [colors.infoSoft, colors.info],
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t[0] }]}>
      <AppText variant="small" color={t[1]} style={{ fontFamily: font.semibold }}>
        {label}
      </AppText>
    </View>
  );
}

export function Chip({ label, active, onPress, dark }: { label: string; active?: boolean; onPress?: () => void; dark?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[
        styles.chip,
        dark && { backgroundColor: "transparent", borderColor: colors.navy3 },
        active && (dark ? { backgroundColor: colors.mint, borderColor: colors.mint } : { backgroundColor: colors.navy, borderColor: colors.navy }),
      ]}
      hitSlop={6}
    >
      <AppText variant="label" color={dark ? (active ? colors.navy : colors.white) : active ? colors.white : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="h3">{title}</AppText>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <AppText variant="label" color={colors.turquoise}>
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Rows (profile/settings menu, key-value) ────────────────────────────────
export function ListRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  right,
  tint = colors.navy,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  tint?: string;
}) {
  return (
    <Touchable onPress={onPress} disabled={!onPress} style={styles.listRow} accessibilityRole={onPress ? "button" : undefined}>
      {Icon ? (
        <View style={styles.listIcon}>
          <Icon size={20} color={tint} strokeWidth={2} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? (onPress ? <ChevronRight size={18} color={colors.textFaint} /> : null)}
    </Touchable>
  );
}

export function KeyValue({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <View style={styles.kv}>
      <AppText variant="caption" color={colors.textMuted} style={{ flex: 1 }}>
        {label}
      </AppText>
      {typeof value === "string" || typeof value === "number" ? (
        <AppText variant={strong ? "h3" : "bodyStrong"} style={{ textAlign: "right", flexShrink: 1 }}>
          {value}
        </AppText>
      ) : (
        value
      )}
    </View>
  );
}

// ─── Avatar / progress ─────────────────────────────────────────────────────
export function Avatar({ text, size = 44, dark }: { text: string; size?: number; dark?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: dark ? colors.navy3 : colors.mintSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityLabel={`Profile initials ${text}`}
    >
      <AppText variant={size > 60 ? "h1" : "h3"} color={dark ? colors.mint : colors.navy}>
        {text}
      </AppText>
    </View>
  );
}

export function ProgressBar({ value, color = colors.mint, track = colors.surfaceMuted }: { value: number; color?: string; track?: string }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withTiming(Math.max(0, Math.min(1, value)), { duration: 700 }));
  }, [value, w]);
  const a = useAnimatedStyle(() => ({ width: `${w.get() * 100}%` }));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: track, overflow: "hidden" }}>
      <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: color }, a]} />
    </View>
  );
}

// ─── Loading / empty / error ───────────────────────────────────────────────
export function Skeleton({ height = 16, width = "100%", style, r = 8 }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle>; r?: number }) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.set(withRepeat(withSequence(withTiming(1, { duration: 650 }), withTiming(0.5, { duration: 650 })), -1));
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[{ height, width, borderRadius: r, backgroundColor: colors.surfaceMuted }, a, style]} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={{ gap: space.md }} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
          <Skeleton width={44} height={44} r={14} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" />
            <Skeleton width="35%" height={12} />
          </View>
          <Skeleton width={70} />
        </View>
      ))}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  action,
  onAction,
}: {
  title: string;
  message?: string;
  icon?: LucideIcon;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.stateIcon}>
        <Icon size={26} color={colors.turquoise} />
      </View>
      <AppText variant="h3" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
          {message}
        </AppText>
      ) : null}
      {action ? <Button title={action} variant="secondary" onPress={onAction} style={{ marginTop: space.sm, alignSelf: "stretch" }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, offline }: { message: string; onRetry?: () => void; offline?: boolean }) {
  return (
    <View style={styles.state} accessibilityRole="alert">
      <View style={[styles.stateIcon, { backgroundColor: offline ? colors.surfaceMuted : colors.dangerSoft }]}>
        {offline ? <WifiOff size={24} color={colors.textMuted} /> : <AlertCircle size={24} color={colors.danger} />}
      </View>
      <AppText variant="h3" style={{ textAlign: "center" }}>
        {offline ? "You're offline" : "Couldn't load this"}
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
        {message}
      </AppText>
      {onRetry ? <Button title="Try again" icon={RefreshCw} variant="secondary" onPress={onRetry} style={{ marginTop: space.sm, alignSelf: "stretch" }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadow.card },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, alignSelf: "flex-start" },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md },
  listRow: {
    minHeight: HIT + 16,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.mintSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  kv: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, gap: space.md },
  state: { alignItems: "center", gap: space.sm, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.turquoiseSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xs,
  },
});
