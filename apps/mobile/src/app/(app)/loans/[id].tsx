import React from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CircleCheck, CircleDashed, CircleAlert, Info } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Card, Divider, ErrorState, KeyValue, ProgressBar, SectionHeader, Skeleton } from "@/components/ui";
import { BalanceCard, LoanStatusBadge } from "@/components/finance";
import { useLoan } from "@/lib/queries";
import { formatDate, formatZMW } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, radius, space } from "@/lib/theme";

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useLoan(id);
  const l = q.data;

  return (
    <Screen edgeTop={false} header={<TopBar title="Loan details" />} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isPending ? (
        <View style={{ gap: space.lg }}>
          <Skeleton height={160} r={radius.xl} />
          <Skeleton height={200} r={radius.lg} />
        </View>
      ) : q.isError ? (
        <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : l ? (
        <View style={{ gap: space.lg }}>
          {l.schedule.kind === "official" ? (
            <BalanceCard label="Outstanding balance" amount={formatZMW(l.schedule.outstandingBalance)} footerLeft={`${l.schedule.paidCount} of ${l.schedule.totalCount} repayments made`} footerRight={formatZMW(l.schedule.amountPaid) + " paid"}>
              <View style={{ marginTop: space.md }}>
                <ProgressBar value={l.schedule.paidCount / l.schedule.totalCount} color={colors.navy} track="rgba(255,255,255,0.4)" />
              </View>
            </BalanceCard>
          ) : (
            <BalanceCard label="Loan amount" amount={formatZMW(l.amount)} footerLeft={statusLine(l.status)} />
          )}

          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
              <AppText variant="h3">Summary</AppText>
              <LoanStatusBadge status={l.status} />
            </View>
            <KeyValue label="Principal" value={formatZMW(l.amount)} />
            <KeyValue label="Interest rate" value={`${l.interestRate}% per year`} />
            <KeyValue label="Term" value={`${l.termMonths} months`} />
            <KeyValue label="Monthly repayment" value={formatZMW(l.monthlyRepayment)} />
            <KeyValue label="Total interest" value={formatZMW(l.totalInterest)} />
            <KeyValue label="Fees" value={l.fees.length ? formatZMW(l.fees.reduce((s, f) => s + f.amount, 0)) : "None"} />
            <Divider style={{ marginVertical: space.xs }} />
            <KeyValue label="Total repayable" value={formatZMW(l.totalRepayment)} strong />
            <Divider style={{ marginVertical: space.xs }} />
            <KeyValue label="Applied" value={formatDate(l.createdAt)} />
            <KeyValue label="Disbursed" value={l.disbursedAt ? formatDate(l.disbursedAt) : "Not yet"} />
          </Card>

          <Card>
            <SectionHeader title="Repayment schedule" />
            {l.schedule.kind === "official" ? (
              l.schedule.repayments.map((r, i) => {
                const Icon = r.status === "PAID" ? CircleCheck : r.status === "OVERDUE" ? CircleAlert : CircleDashed;
                const tint = r.status === "PAID" ? colors.success : r.status === "OVERDUE" ? colors.danger : colors.textFaint;
                return (
                  <View key={r.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: 10 }}>
                    <Icon size={20} color={tint} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong">Instalment {i + 1}</AppText>
                      <AppText variant="small" color={colors.textFaint}>
                        Due {formatDate(r.dueDate)}{r.paidAt ? ` · paid ${formatDate(r.paidAt)}` : ""}
                      </AppText>
                    </View>
                    <AppText variant="bodyStrong" color={r.status === "OVERDUE" ? colors.danger : colors.text}>{formatZMW(r.amount)}</AppText>
                  </View>
                );
              })
            ) : (
              <>
                <View style={{ flexDirection: "row", gap: space.sm, backgroundColor: colors.infoSoft, padding: space.md, borderRadius: radius.md, marginBottom: space.md }}>
                  <Info size={18} color={colors.info} />
                  <AppText variant="small" color={colors.info} style={{ flex: 1 }}>{l.schedule.note}</AppText>
                </View>
                {l.schedule.rows.map((r) => (
                  <View key={r.installment} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: space.md }}>
                    <AppText variant="label" color={colors.textFaint} style={{ width: 28 }}>#{r.installment}</AppText>
                    <View style={{ flex: 1 }}>
                      <AppText variant="caption">≈ {formatDate(r.dueDate)}</AppText>
                      <AppText variant="small" color={colors.textFaint}>Principal {formatZMW(r.principal)} · Interest {formatZMW(r.interest)}</AppText>
                    </View>
                    <AppText variant="label">{formatZMW(r.payment)}</AppText>
                  </View>
                ))}
              </>
            )}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function statusLine(s: string) {
  switch (s) {
    case "PENDING": return "Application under review — no decision yet.";
    case "APPROVED": return "Approved — awaiting disbursement.";
    case "ACTIVE": return "Active — repayment schedule not issued yet.";
    case "COMPLETED": return "Fully repaid.";
    case "DEFAULTED": return "In default — please contact support.";
    default: return "";
  }
}
