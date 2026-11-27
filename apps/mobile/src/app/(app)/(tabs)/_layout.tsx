import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChartNoAxesColumn, House, Landmark, ArrowLeftRight, UserRound, type LucideIcon } from "lucide-react-native";
import { colors, font } from "@/lib/theme";

function TabIcon({ icon: Icon, color, focused }: { icon: LucideIcon; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: "center", width: 48, height: 28, justifyContent: "center", borderRadius: 14, backgroundColor: focused ? colors.mintSoft : "transparent" }}>
      <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tab = (icon: LucideIcon) =>
    function TabBarIcon({ color, focused }: { color: unknown; focused: boolean }) {
      return <TabIcon icon={icon} color={String(color)} focused={focused} />;
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11, lineHeight: 16 },
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
          borderTopWidth: 0,
          backgroundColor: colors.white,
          elevation: 12,
          shadowColor: colors.navy,
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tab(House) }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics", tabBarIcon: tab(ChartNoAxesColumn) }} />
      <Tabs.Screen name="loans" options={{ title: "Loans", tabBarIcon: tab(Landmark) }} />
      <Tabs.Screen name="transactions" options={{ title: "Activity", tabBarIcon: tab(ArrowLeftRight) }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tab(UserRound) }} />
    </Tabs>
  );
}
