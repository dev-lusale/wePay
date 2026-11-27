import React from "react";
import { Gauge } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Badge, Card, EmptyState, ErrorState, KeyValue, Skeleton } from "@/components/ui";
import { useProfile } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, space } from "@/lib/theme";

export default function Credit() {
  const q = useProfile();
  const c = q.data?.creditProfile;
  return (
    <Screen edgeTop={false} header={<TopBar title="Credit profile" />}>
      {q.isPending ? <Skeleton height={160} /> : q.isError ? <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : c && c.transunionScore !== null ? (
        <Card>
          <KeyValue label="TransUnion score" value={String(c.transunionScore)} strong />
          <KeyValue label="Report date" value={formatDate(c.reportDate)} />
          <KeyValue label="Status" value={<Badge label={c.status} tone="info" />} />
        </Card>
      ) : (
        <>
          <EmptyState icon={Gauge} title="No credit report yet" message={`Status: ${c?.status ?? "PENDING"}. A credit check hasn't been completed for your account, so there's no score to show.`} />
          <AppText variant="small" color={colors.textFaint} style={{ textAlign: "center", marginTop: space.md }}>
            WePay never shows an estimated or simulated credit score.
          </AppText>
        </>
      )}
    </Screen>
  );
}
