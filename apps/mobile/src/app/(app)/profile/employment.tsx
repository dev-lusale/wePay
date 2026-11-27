import React from "react";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Badge, Card, EmptyState, ErrorState, KeyValue, Skeleton } from "@/components/ui";
import { useProfile } from "@/lib/queries";
import { formatZMW, mask } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, space } from "@/lib/theme";

export default function Employment() {
  const q = useProfile();
  const e = q.data?.employmentProfile;
  const tone = e?.verificationStatus === "VERIFIED" ? "success" : e?.verificationStatus === "FAILED" ? "danger" : "warning";
  return (
    <Screen edgeTop={false} header={<TopBar title="Employment & NAPSA" />}>
      {q.isPending ? <Skeleton height={200} /> : q.isError ? <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : e ? (
        <>
          <Card>
            <KeyValue label="Verification" value={<Badge label={e.verificationStatus === "VERIFIED" ? "Verified" : e.verificationStatus === "FAILED" ? "Failed" : "Pending"} tone={tone} />} />
            <KeyValue label="Employer" value={e.employerName} />
            <KeyValue label="NAPSA number" value={mask(e.napsaNumber)} />
            <KeyValue label="Declared monthly salary" value={formatZMW(e.monthlySalary)} />
            <KeyValue label="Borrowing limit" value={formatZMW(Math.min(Number(e.monthlySalary) * 3, 100000))} />
          </Card>
          <AppText variant="small" color={colors.textFaint} style={{ marginTop: space.lg }}>
            Your borrowing limit is 3× your declared salary (up to K100,000). To update employment details, contact WePay support.
          </AppText>
        </>
      ) : (
        <EmptyState title="No employment details" message="Employment details are captured when you register." />
      )}
    </Screen>
  );
}
