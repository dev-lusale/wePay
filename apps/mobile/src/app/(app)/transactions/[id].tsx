import React, { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Share2 } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Button, Card, ErrorState, KeyValue, Skeleton } from "@/components/ui";
import { txMeta } from "@/components/finance";
import { useProfile, useTransaction } from "@/lib/queries";
import { formatDateTime, formatZMW, num } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { shareTransactionReceipt } from "@/lib/receipt";
import { colors, radius, space } from "@/lib/theme";

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useTransaction(id);
  const profile = useProfile();
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const t = q.data;

  return (
    <Screen edgeTop={false} header={<TopBar title="Transaction" />}>
      {q.isPending ? (
        <Skeleton height={260} r={radius.lg} />
      ) : q.isError ? (
        <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : t ? (
        (() => {
          const m = txMeta(t.type);
          const Icon = m.icon;
          const signed = num(t.amount) * m.sign;
          return (
            <View style={{ gap: space.lg }}>
              <Card style={{ alignItems: "center", gap: space.sm, paddingVertical: space.xxl }}>
                <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: m.bg, alignItems: "center", justifyContent: "center" }}>
                  <Icon size={28} color={m.tint} />
                </View>
                <AppText variant="display" color={signed > 0 ? colors.success : colors.text}>{formatZMW(signed, { sign: true })}</AppText>
                <AppText color={colors.textMuted}>{m.label}</AppText>
              </Card>
              <Card>
                <KeyValue label="Description" value={t.description} />
                <KeyValue label="Date & time" value={formatDateTime(t.createdAt)} />
                <KeyValue label="Type" value={m.label} />
                <KeyValue label="Status" value="Recorded" />
                <KeyValue label="Reference" value={t.id} />
              </Card>
              {shareError ? <AppText variant="caption" color={colors.danger}>{shareError}</AppText> : null}
              <Button
                title="Download receipt (PDF)"
                icon={Share2}
                variant="dark"
                loading={sharing}
                onPress={async () => {
                  setSharing(true);
                  setShareError(null);
                  try {
                    const holder = profile.data ? `${profile.data.firstName} ${profile.data.lastName}` : "";
                    await shareTransactionReceipt(t, holder);
                  } catch {
                    setShareError("Couldn't create the receipt on this device.");
                  } finally {
                    setSharing(false);
                  }
                }}
              />
            </View>
          );
        })()
      ) : null}
    </Screen>
  );
}
