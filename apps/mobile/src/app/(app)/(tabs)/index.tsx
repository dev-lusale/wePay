import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Bell, ChartNoAxesColumn, FilePlus2, Landmark, ArrowLeftRight, CalendarClock } from "lucide-react-native";
import { HeroHeader, Screen } from "@/components/Screen";
import { AppText, Avatar, Card, EmptyState, ErrorState, ListSkeleton, SectionHeader, Skeleton, ProgressBar } from "@/components/ui";
import { BalanceCard, LoanStatusBadge, QuickAction, TransactionRow } from "@/components/finance";
import { useLoans, useProfile, useStats, useTransactions } from "@/lib/queries";
import { formatDate, formatZMW, greeting, initials } from "@/lib/format";
import { isNetworkError, errorMessage } from "@/lib/api";
import { colors, radius, space } from "@/lib/theme";
import { useAlerts } from "@/lib/alerts";

export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const stats = useStats();
  const loans = useLoans();
  const txs = useTransactions({});
  const alerts = useAlerts();

  const refreshing = profile.isRefetching || stats.isRefetching || loans.isRefetching || txs.isRefetching;
  const onRefresh = () => Promise.all([profile.refetch(), stats.refetch(), loans.refetch(), txs.refetch()]);

  const openLoan = loans.data?.find((l) => ["PENDING", "APPROVED", "ACTIVE"].includes(l.status));
  const recent = txs.data?.pages[0]?.slice(0, 5) ?? [];
  const p = profile.data;

  const header = (
    <HeroHeader>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.mint}>{greeting()}, welcome back</AppText>
          {p ? (
            <AppText variant="h1" color={colors.white} numberOfLines={1}>{p.firstName} {p.lastName}</AppText>
          ) : (
            <Skeleton width={160} height={26} style={{ marginTop: 4, backgroundColor: colors.navy3 }} />
          )}
        </View>
        <Pressable onPress={() => router.push("/notifications")} hitSlop={8} style={styles.bell} accessibilityRole="button" accessibilityLabel={`Account alerts, ${alerts.length}`}>
          <Bell size={20} color={colors.white} />
          {alerts.length > 0 ? <View style={styles.dot} /> : null}
        </Pressable>
        <Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Open profile">
          <Avatar text={initials(p?.firstName, p?.lastName)} dark />
        </Pressable>
      </View>
    </HeroHeader>
  );

  return (
    <Screen header={header} refreshing={refreshing} onRefresh={onRefresh} contentStyle={{ paddingTop: space.xl }}>
      {/* Balance */}
      <Animated.View entering={FadeInDown.duration(400)}>
        {stats.isPending ? (
          <Skeleton height={170} r={radius.xl} />
        ) : stats.isError ? (
          <Card><ErrorState offline={isNetworkError(stats.error)} message={errorMessage(stats.error)} onRetry={() => stats.refetch()} /></Card>
        ) : stats.data.monthlySalary === 0 ? (
          <BalanceCard label="Available to borrow" amount="—" footerLeft="Add your employment details to see your salary-based limit." />
        ) : (
          <BalanceCard
            label="Available to borrow"
            amount={formatZMW(stats.data.availableCredit)}
            footerLeft={`Limit: 3× your declared salary of ${formatZMW(stats.data.monthlySalary, { decimals: 0 })}`}
            footerRight={stats.data.activeLoans ? `${stats.data.activeLoans} open loan` : undefined}
          />
        )}
      </Animated.View>

      {/* Quick actions */}
      <View style={styles.actions}>
        <QuickAction icon={FilePlus2} label="Apply" onPress={() => router.push("/loans/apply")} />
        <QuickAction icon={Landmark} label="My loans" onPress={() => router.push("/loans")} />
        <QuickAction icon={ArrowLeftRight} label="Activity" onPress={() => router.push("/transactions")} />
        <QuickAction icon={ChartNoAxesColumn} label="Insights" onPress={() => router.push("/analytics")} />
      </View>

      {/* Active loan */}
      <SectionHeader title="Current loan" action={loans.data?.length ? "See all" : undefined} onAction={() => router.push("/loans")} />
      {loans.isPending ? (
        <Skeleton height={120} r={radius.lg} />
      ) : loans.isError ? (
        <Card><ErrorState offline={isNetworkError(loans.error)} message={errorMessage(loans.error)} onRetry={() => loans.refetch()} /></Card>
      ) : openLoan ? (
        <Pressable onPress={() => router.push({ pathname: "/loans/[id]", params: { id: openLoan.id } })} accessibilityRole="button">
          <Card style={{ gap: space.md }}>
            <View style={styles.rowBetween}>
              <View>
                <AppText variant="caption" color={colors.textMuted}>Loan amount</AppText>
                <AppText variant="h2">{formatZMW(openLoan.amount)}</AppText>
              </View>
              <LoanStatusBadge status={openLoan.status} />
            </View>
            {openLoan.repayments.length > 0 ? (
              <>
                <ProgressBar value={openLoan.repayments.filter((r) => r.status === "PAID").length / openLoan.repayments.length} />
                <AppText variant="small" color={colors.textMuted}>
                  {openLoan.repayments.filter((r) => r.status === "PAID").length} of {openLoan.repayments.length} repayments made
                </AppText>
              </>
            ) : (
              <AppText variant="caption" color={colors.textMuted}>
                {openLoan.status === "PENDING" ? "Your application is being reviewed. We'll update the status here." : "Repayment schedule not issued yet."}
              </AppText>
            )}
            {stats.data?.nextPaymentDate ? (
              <View style={styles.nextPay}>
                <CalendarClock size={18} color={colors.navy} />
                <AppText variant="label" style={{ flex: 1 }}>Next repayment {formatDate(stats.data.nextPaymentDate)}</AppText>
                <AppText variant="bodyStrong">{formatZMW(stats.data.nextPaymentAmount)}</AppText>
              </View>
            ) : (
              <AppText variant="small" color={colors.textFaint}>Monthly repayment: {formatZMW(openLoan.monthlyRepayment)}</AppText>
            )}
          </Card>
        </Pressable>
      ) : (
        <Card><EmptyState icon={Landmark} title="No open loan" message="Check what you could borrow and what it would cost before you apply." action="Explore a loan" onAction={() => router.push("/loans/apply")} /></Card>
      )}

      {/* Recent transactions */}
      <View style={{ height: space.xxl }} />
      <SectionHeader title="Recent transactions" action={recent.length ? "See all" : undefined} onAction={() => router.push("/transactions")} />
      <Card>
        {txs.isPending ? (
          <ListSkeleton rows={3} />
        ) : txs.isError ? (
          <ErrorState offline={isNetworkError(txs.error)} message={errorMessage(txs.error)} onRetry={() => txs.refetch()} />
        ) : recent.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No transactions yet" message="Disbursements, repayments and fees will appear here once they're recorded on your account." />
        ) : (
          recent.map((t) => <TransactionRow key={t.id} tx={t} onPress={() => router.push({ pathname: "/transactions/[id]", params: { id: t.id } })} />)
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  bell: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navy2, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 10, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.mint },
  actions: { flexDirection: "row", marginTop: space.xxl, marginBottom: space.xxl },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  nextPay: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.mintSoft, padding: space.md, borderRadius: radius.md },
});
