import React from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { confirmAction } from "@/lib/confirm";
import { Fingerprint, KeyRound, LogOut, Smartphone } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Badge, Button, Card, ErrorState, ListRow, ListSkeleton } from "@/components/ui";
import { useProfile, useRevokeSession, useSessions } from "@/lib/queries";
import { useAppLock } from "@/lib/applock";
import { formatDate, formatDateTime } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { api, errorMessage, isNetworkError } from "@/lib/api";
import { colors, space } from "@/lib/theme";

export default function Security() {
  const q = useSessions();
  const revoke = useRevokeSession();
  const { signOut } = useAuth();
  const router = useRouter();
  const profile = useProfile();
  const lock = useAppLock();
  const [lockMsg, setLockMsg] = React.useState<string | null>(null);

  const signOutEverywhere = () =>
    confirmAction("Sign out of all devices?", "Every phone signed in to your WePay account, including this one, will need to sign in again.", "Sign out all", async () => {
      try {
        await api("/api/mobile/auth/sessions", { method: "DELETE" });
      } finally {
        await signOut();
      }
    });

  return (
    <Screen edgeTop={false} header={<TopBar title="Security" />} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <AppText variant="h3" style={{ marginBottom: space.sm }}>Sign-in & access</AppText>
      <View style={{ gap: space.sm, marginBottom: space.xxl }}>
        <ListRow
          icon={KeyRound}
          title="Password"
          subtitle={`Last changed: ${profile.data?.passwordChangedAt ? formatDate(profile.data.passwordChangedAt) : "Never"}`}
          onPress={() => router.push("/profile/change-password")}
          right={<AppText variant="label" color={colors.turquoise}>Change</AppText>}
        />
        <ListRow
          icon={Fingerprint}
          title="Fingerprint / face lock"
          subtitle={lock.supported ? "Ask for biometrics when opening WePay" : "Set up fingerprint or face unlock in your phone settings to use this"}
          right={
            <Switch
              value={lock.enabled}
              disabled={!lock.supported}
              onValueChange={async (v) => {
                setLockMsg(null);
                const r = await lock.setEnabled(v);
                if (!r.ok && r.message) setLockMsg(r.message);
              }}
              trackColor={{ true: colors.mint, false: colors.border }}
              thumbColor={colors.white}
              accessibilityLabel="Fingerprint or face lock"
            />
          }
        />
        {lockMsg ? <AppText variant="small" color={colors.danger}>{lockMsg}</AppText> : null}
      </View>
      <AppText variant="h3">Signed-in devices</AppText>
      <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: space.lg }}>
        Sessions refresh automatically and expire after 30 days without use. Remove any device you don't recognise.
      </AppText>
      {q.isPending ? <ListSkeleton rows={2} /> : q.isError ? (
        <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <View style={{ gap: space.sm }}>
          {q.data.map((s) => (
            <Card key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <Smartphone size={22} color={colors.navy} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{s.deviceName ?? "Unknown device"}</AppText>
                <AppText variant="small" color={colors.textFaint}>Last active {formatDateTime(s.lastUsedAt)}</AppText>
              </View>
              {s.current ? (
                <Badge label="This device" tone="success" />
              ) : (
                <Button title="Remove" variant="danger" style={{ minHeight: 40, paddingHorizontal: space.md }} loading={revoke.isPending && revoke.variables === s.id} onPress={() => revoke.mutate(s.id)} />
              )}
            </Card>
          ))}
        </View>
      )}
      <Button title="Sign out of all devices" icon={LogOut} variant="danger" onPress={signOutEverywhere} style={{ marginTop: space.xxl }} />
      <AppText variant="small" color={colors.textFaint} style={{ marginTop: space.lg }}>
        Forgot your password? Sign out and use "Forgot password" on the sign-in screen. Resetting it signs out every device.
      </AppText>
    </Screen>
  );
}
