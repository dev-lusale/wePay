import React, { useRef, useState } from "react";
import { Dimensions, FlatList, Image, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { BadgeCheck, CalendarClock, Calculator } from "lucide-react-native";
import { AppText, Button } from "@/components/ui";
import { colors, gradient, radius, space } from "@/lib/theme";

const { width } = Dimensions.get("window");

// Describes only what WePay actually does today (salary-backed loan applications).
const SLIDES = [
  { icon: BadgeCheck, title: "Borrow against your salary", body: "Apply for a salary-backed loan of up to 3× your monthly pay, straight from your phone." },
  { icon: Calculator, title: "Know the cost up front", body: "See your monthly repayment, interest and total cost before you apply. No surprises." },
  { icon: CalendarClock, title: "Track every kwacha", body: "Follow your application, repayment schedule and transaction history in one place." },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.navy, paddingTop: insets.top, paddingBottom: insets.bottom + space.lg }}>
      <StatusBar style="light" />
      <View style={styles.brandRow}>
        <Image source={require("../../../assets/logo-mark.png")} style={{ width: 36, height: 36 }} accessibilityIgnoresInvertColors />
        <AppText variant="h2" color={colors.white}>
          We<AppText variant="h2" color={colors.mint}>Pay</AppText>
        </AppText>
      </View>

      <Animated.View entering={FadeInUp.duration(600)} style={styles.hero}>
        <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroRing} />
          <AppText variant="label" color={colors.navy} style={{ opacity: 0.7 }}>Drawing your needs closer to your salary</AppText>
          <AppText variant="h1" color={colors.navy} style={{ marginTop: space.sm }}>Salary-backed{"\n"}loans for Zambia</AppText>
        </LinearGradient>
      </Animated.View>

      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={{ width, paddingHorizontal: space.xxl, gap: space.sm }}>
              <View style={styles.slideIcon}><Icon size={22} color={colors.mint} /></View>
              <AppText variant="h1" color={colors.white}>{item.title}</AppText>
              <AppText color={colors.onDarkMuted}>{item.body}</AppText>
            </View>
          );
        }}
        style={{ flexGrow: 0, marginTop: space.xxl }}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && { width: 22, backgroundColor: colors.mint }]} />
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: space.xxl, gap: space.md }}>
        <Button title="Get started" onPress={() => router.push("/register")} />
        <Button title="I already have an account" variant="onDark" onPress={() => router.push("/login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingHorizontal: space.xxl, paddingTop: space.lg },
  hero: { paddingHorizontal: space.xxl, marginTop: space.xxl },
  heroCard: { borderRadius: radius.xl, padding: space.xxl, minHeight: 170, justifyContent: "flex-end", overflow: "hidden" },
  heroRing: { position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: 75, borderWidth: 28, borderColor: "rgba(255,255,255,0.25)" },
  slideIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navy2, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  dots: { flexDirection: "row", gap: 6, paddingHorizontal: space.xxl, marginTop: space.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.navy3 },
});
