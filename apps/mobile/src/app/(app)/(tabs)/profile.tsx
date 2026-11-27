import React from "react";
import { View } from "react-native";
import { confirmAction } from "@/lib/confirm";
import { useRouter } from "expo-router";
import { Briefcase, CircleHelp, FileLock2, Gauge, LogOut, ShieldCheck, UserRound } from "lucide-react-native";
import { HeroHeader, Screen } from "@/components/Screen";
import { AppText, Avatar, Badge, Button, ErrorState, ListRow, Skeleton } from "@/components/ui";
import { useProfile } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, space } from "@/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const q = useProfile();
  const p = q.data;

  const header = (
    <HeroHeader style={{ alignItems: "center", paddingBottom: space.xxxl }}>
      {p ? (
        <>
          <Avatar text={initials(p.firstName, p.lastName)} size={84} dark />
          <AppText variant="h2" color={colors.white} style={{ marginTop: space.md }}>{p.firstName} {p.lastName}</AppText>
          <AppText variant="caption" color={colors.mint}>{p.email}</AppText>
        </>
      ) : q.isError ? (
        <AppText color={colors.white}>Profile</AppText>
      ) : (
        <>
          <Skeleton width={84} height={84} r={27} style={{ backgroundColor: colors.navy3 }} />
          <Skeleton width={160} height={20} style={{ marginTop: space.md, backgroundColor: colors.navy3 }} />
        </>
      )}
    </HeroHeader>
  );

  const confirmLogout = () =>
    confirmAction("Log out?", "You'll need your password to sign in again on this device.", "Log out", () => void signOut());

  return (
    <Screen header={header} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isError ? <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
      <AppText variant="label" color={colors.textMuted} style={{ marginBottom: space.sm }}>Account</AppText>
      <View style={{ gap: space.sm }}>
        <ListRow icon={UserRound} title="Personal details" subtitle="Name, phone, NRC" onPress={() => router.push("/profile/personal")} />
        <ListRow
          icon={Briefcase}
          title="Employment & NAPSA"
          subtitle={p?.employmentProfile?.employerName ?? "Employer and salary"}
          onPress={() => router.push("/profile/employment")}
          right={p?.employmentProfile ? <Badge label={p.employmentProfile.verificationStatus === "VERIFIED" ? "Verified" : p.employmentProfile.verificationStatus === "FAILED" ? "Failed" : "Pending"} tone={p.employmentProfile.verificationStatus === "VERIFIED" ? "success" : p.employmentProfile.verificationStatus === "FAILED" ? "danger" : "warning"} /> : undefined}
        />
        <ListRow icon={Gauge} title="Credit profile" subtitle="Credit check status" onPress={() => router.push("/profile/credit")} />
      </View>
      <AppText variant="label" color={colors.textMuted} style={{ marginTop: space.xxl, marginBottom: space.sm }}>General</AppText>
      <View style={{ gap: space.sm }}>
        <ListRow icon={ShieldCheck} title="Security" subtitle="Signed-in devices" onPress={() => router.push("/profile/security")} />
        <ListRow icon={FileLock2} title="Privacy" subtitle="How your data is handled" onPress={() => router.push("/profile/privacy")} />
      </View>
      <AppText variant="label" color={colors.textMuted} style={{ marginTop: space.xxl, marginBottom: space.sm }}>Help centre</AppText>
      <ListRow icon={CircleHelp} title="Help & FAQs" subtitle="How WePay loans work" onPress={() => router.push("/profile/help")} />
      <Button title="Log out" icon={LogOut} variant="dark" onPress={confirmLogout} style={{ marginTop: space.xxl }} />
    </Screen>
  );
}
