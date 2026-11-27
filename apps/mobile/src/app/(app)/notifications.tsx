import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { BellOff, CircleAlert, CircleCheck, Clock, Info } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Card, EmptyState, Touchable } from "@/components/ui";
import { useAlerts } from "@/lib/alerts";
import { colors, space } from "@/lib/theme";

const TONE = {
  info: { icon: Info, color: colors.info, bg: colors.infoSoft },
  warning: { icon: Clock, color: colors.warning, bg: colors.warningSoft },
  danger: { icon: CircleAlert, color: colors.danger, bg: colors.dangerSoft },
  success: { icon: CircleCheck, color: colors.success, bg: colors.mintSoft },
} as const;

export default function Notifications() {
  const router = useRouter();
  const alerts = useAlerts();
  return (
    <Screen edgeTop={false} header={<TopBar title="Account alerts" />}>
      {alerts.length === 0 ? (
        <EmptyState icon={BellOff} title="You're all caught up" message="Alerts about your applications, repayments and verification appear here." />
      ) : (
        <View style={{ gap: space.md }}>
          {alerts.map((a) => {
            const t = TONE[a.tone];
            const Icon = t.icon;
            return (
              <Touchable key={a.id} disabled={!a.loanId} onPress={() => a.loanId && router.push({ pathname: "/loans/[id]", params: { id: a.loanId } })}>
                <Card style={{ flexDirection: "row", gap: space.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
                    <Icon size={20} color={t.color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="bodyStrong">{a.title}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>{a.body}</AppText>
                  </View>
                </Card>
              </Touchable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
