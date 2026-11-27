import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { FilePlus2, Landmark } from "lucide-react-native";
import { HeroHeader, OfflineBanner } from "@/components/Screen";
import { AppText, Button, Card, Chip, EmptyState, ErrorState, ListSkeleton, ProgressBar, Touchable } from "@/components/ui";
import { LoanStatusBadge } from "@/components/finance";
import { useLoans } from "@/lib/queries";
import { formatDate, formatZMW, num } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, space } from "@/lib/theme";
import type { Loan } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Active & pending" },
  { key: "closed", label: "Completed" },
] as const;

export default function LoansScreen() {
  const router = useRouter();
  const q = useLoans();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const loans = useMemo(() => {
    const all = q.data ?? [];
    if (filter === "open") return all.filter((l) => ["PENDING", "APPROVED", "ACTIVE"].includes(l.status));
    if (filter === "closed") return all.filter((l) => ["COMPLETED", "DEFAULTED"].includes(l.status));
    return all;
  }, [q.data, filter]);
  const hasOpen = q.data?.some((l) => ["PENDING", "APPROVED", "ACTIVE"].includes(l.status));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeroHeader>
        <AppText variant="h1" color={colors.white}>My loans</AppText>
        <AppText variant="caption" color={colors.onDarkMuted}>Applications, active loans and history</AppText>
        {!hasOpen && q.isSuccess && (
          <Button title="Apply for a loan" icon={FilePlus2} onPress={() => router.push("/loans/apply")} style={{ marginTop: space.lg }} />
        )}
      </HeroHeader>
      <OfflineBanner />
      <View style={styles.filters}>
        {FILTERS.map((f) => <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
      </View>
      {q.isPending ? (
        <View style={{ padding: space.xl }}><ListSkeleton rows={3} /></View>
      ) : q.isError ? (
        <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: space.xl, paddingTop: 0, gap: space.md, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} colors={[colors.turquoise]} />}
          renderItem={({ item }) => <LoanCard loan={item} onPress={() => router.push({ pathname: "/loans/[id]", params: { id: item.id } })} />}
          ListEmptyComponent={
            <EmptyState
              icon={Landmark}
              title={filter === "all" ? "No loans yet" : "Nothing here"}
              message={filter === "all" ? "When you apply for a loan, you can follow its status and repayments here." : "No loans match this filter."}
              action={filter === "all" ? "Apply for a loan" : undefined}
              onAction={() => router.push("/loans/apply")}
            />
          }
        />
      )}
    </View>
  );
}

function LoanCard({ loan, onPress }: { loan: Loan; onPress: () => void }) {
  const paid = loan.repayments.filter((r) => r.status === "PAID").length;
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Loan of ${formatZMW(loan.amount)}`}>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <AppText variant="h2">{formatZMW(loan.amount)}</AppText>
            <AppText variant="small" color={colors.textFaint}>Applied {formatDate(loan.createdAt)}</AppText>
          </View>
          <LoanStatusBadge status={loan.status} />
        </View>
        <View style={{ flexDirection: "row", gap: space.xl }}>
          <Meta label="Monthly" value={formatZMW(loan.monthlyRepayment)} />
          <Meta label="Term" value={`${loan.termMonths} mo`} />
          <Meta label="Rate" value={`${num(loan.interestRate)}% p.a.`} />
        </View>
        {loan.repayments.length > 0 && (
          <View style={{ gap: 6 }}>
            <ProgressBar value={paid / loan.repayments.length} />
            <AppText variant="small" color={colors.textMuted}>{paid} of {loan.repayments.length} repayments made</AppText>
          </View>
        )}
      </Card>
    </Touchable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <AppText variant="small" color={colors.textFaint}>{label}</AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: space.sm, padding: space.xl, paddingBottom: space.lg },
});
