import React from "react";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Card, ErrorState, KeyValue, Skeleton } from "@/components/ui";
import { useProfile } from "@/lib/queries";
import { formatDate, mask } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, space } from "@/lib/theme";

export default function Personal() {
  const q = useProfile();
  const p = q.data;
  return (
    <Screen edgeTop={false} header={<TopBar title="Personal details" />}>
      {q.isPending ? <Skeleton height={220} /> : q.isError ? <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : p ? (
        <>
          <Card>
            <KeyValue label="First name" value={p.firstName} />
            <KeyValue label="Last name" value={p.lastName} />
            <KeyValue label="Email" value={p.email} />
            <KeyValue label="Phone" value={p.phone} />
            <KeyValue label="NRC number" value={mask(p.nrcNumber)} />
            <KeyValue label="Member since" value={formatDate(p.createdAt)} />
          </Card>
          <AppText variant="small" color={colors.textFaint} style={{ marginTop: space.lg }}>
            Identity details can't be changed in the app. Contact WePay support if something is wrong.
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}
