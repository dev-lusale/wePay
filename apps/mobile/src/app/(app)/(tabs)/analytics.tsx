import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ArrowDownLeft, ArrowUpRight, ChartNoAxesColumn } from "lucide-react-native";
import { HeroHeader, Screen } from "@/components/Screen";
import { AppText, Card, Chip, EmptyState, ErrorState, KeyValue, Skeleton, SectionHeader, Divider } from "@/components/ui";
import { AreaChart, GroupedBarChart, ProgressRing } from "@/components/Charts";
import { LOAN_STATUS } from "@/components/finance";
import { useAnalytics } from "@/lib/queries";
import { formatZMW, monthLabel } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, radius, space } from "@/lib/theme";
import type { LoanStatus } from "@/lib/types";

const RANGES = [3, 6, 12] as const;

export default function AnalyticsScreen() {
  const [months, setMonths] = useState<number>(6);
  const [sel, setSel] = useState<number | undefined>();
  const q = useAnalytics(months);
  const a = q.data;
  const volume = a?.monthly.map((m) => m.disbursed + m.repaid + m.fees) ?? [];
  const labels = a?.monthly.map((m) => monthLabel(m.month)) ?? [];
  const hasActivity = (a?.totals.transactionCount ?? 0) > 0;
  const selIdx = sel !== undefined && sel < volume.length ? sel : volume.length - 1;

  const header = (
    <HeroHeader>
      <AppText variant="caption" color={colors.onDarkMuted} style={{ textAlign: "center" }}>Total repaid · last {months} months</AppText>
      {a ? (
        <AppText variant="display" color={colors.white} style={{ textAlign: "center" }}>{formatZMW(a.totals.repaid)}</AppText>
      ) : (
        <Skeleton width={180} height={36} style={{ alignSelf: "center", marginTop: 4, backgroundColor: colors.navy3 }} />
      )}
      <View style={styles.ranges}>
        {RANGES.map((r) => (
          <Chip key={r} dark label={`${r} months`} active={months === r} onPress={() => { setMonths(r); setSel(undefined); }} />
        ))}
      </View>
    </HeroHeader>
  );

  return (
    <Screen header={header} refreshing={q.isRefetching} onRefresh={() => void q.refetch()} contentStyle={{ paddingTop: space.xl }}>
      {q.isPending ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={220} r={radius.lg} />
          <Skeleton height={120} r={radius.lg} />
        </View>
      ) : q.isError ? (
        <Card><ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} /></Card>
      ) : (
        <>
          <Card>
            <SectionHeader title="Monthly activity" />
            {hasActivity ? (
              <>
                <AreaChart data={volume} labels={labels} selected={selIdx} onSelect={setSel} />
                <AppText variant="small" color={colors.textFaint} style={{ marginTop: space.sm }}>
                  {labels[selIdx]}: {a!.monthly[selIdx]?.count ?? 0} transaction(s). Tap a month to inspect it.
                </AppText>
              </>
            ) : (
              <EmptyState icon={ChartNoAxesColumn} title="No activity in this period" message="Charts are built only from transactions recorded on your account. Once a loan is disbursed or repaid, it shows up here." />
            )}
          </Card>

          <View style={styles.tiles}>
            <View style={[styles.tile, { backgroundColor: colors.turquoise }]}>
              <View style={styles.tileIcon}><ArrowDownLeft size={18} color={colors.white} /></View>
              <AppText variant="caption" color={colors.white}>Received</AppText>
              <AppText variant="h3" color={colors.white}>{formatZMW(a!.totals.disbursed)}</AppText>
            </View>
            <View style={[styles.tile, { backgroundColor: colors.mint }]}>
              <View style={styles.tileIcon}><ArrowUpRight size={18} color={colors.navy} /></View>
              <AppText variant="caption" color={colors.navy}>Repaid</AppText>
              <AppText variant="h3" color={colors.navy}>{formatZMW(a!.totals.repaid)}</AppText>
            </View>
          </View>

          {hasActivity && (
            <Card style={{ marginTop: space.lg }}>
              <SectionHeader title="Received vs repaid" />
              <GroupedBarChart series={[a!.monthly.map((m) => m.disbursed), a!.monthly.map((m) => m.repaid)]} labels={labels} />
              <View style={styles.legend}>
                <Legend color={colors.turquoise} label="Received" />
                <Legend color={colors.navy} label="Repaid" />
              </View>
            </Card>
          )}

          <Card style={{ marginTop: space.lg }}>
            <SectionHeader title="Repayment progress" />
            {a!.repaymentProgress ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.xl }}>
                <ProgressRing value={a!.repaymentProgress.paidInstallments / a!.repaymentProgress.totalInstallments} />
                <View style={{ flex: 1 }}>
                  <KeyValue label="Instalments paid" value={`${a!.repaymentProgress.paidInstallments} / ${a!.repaymentProgress.totalInstallments}`} />
                  <KeyValue label="Paid" value={formatZMW(a!.repaymentProgress.amountPaid)} />
                  <KeyValue label="Outstanding" value={formatZMW(a!.repaymentProgress.amountOutstanding)} />
                </View>
              </View>
            ) : (
              <AppText variant="caption" color={colors.textMuted}>No active loan with an issued repayment schedule.</AppText>
            )}
          </Card>

          <Card style={{ marginTop: space.lg }}>
            <SectionHeader title="Loan history" />
            <KeyValue label="Applications" value={String(a!.loans.total)} />
            <KeyValue label="Total borrowed (disbursed loans)" value={formatZMW(a!.loans.totalBorrowedAllTime)} />
            <Divider style={{ marginVertical: space.sm }} />
            {(Object.keys(LOAN_STATUS) as LoanStatus[]).filter((s) => a!.loans.byStatus[s]).map((s) => (
              <KeyValue key={s} label={LOAN_STATUS[s].label} value={String(a!.loans.byStatus[s])} />
            ))}
            {a!.loans.total === 0 && <AppText variant="caption" color={colors.textMuted}>You haven't applied for a loan yet.</AppText>}
            {a!.totals.fees > 0 && <KeyValue label={`Fees (last ${months} months)`} value={formatZMW(a!.totals.fees)} />}
          </Card>
        </>
      )}
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="small" color={colors.textMuted}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  ranges: { flexDirection: "row", gap: space.sm, justifyContent: "center", marginTop: space.lg },
  tiles: { flexDirection: "row", gap: space.md, marginTop: space.lg },
  tile: { flex: 1, borderRadius: radius.lg, padding: space.lg, gap: 4 },
  tileIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: space.sm },
  legend: { flexDirection: "row", gap: space.lg, marginTop: space.md },
});
