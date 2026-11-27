import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Briefcase, Check, CircleCheckBig, Info, Minus, Plus, ShieldAlert } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Badge, Button, Card, Chip, Divider, EmptyState, ErrorState, KeyValue, Skeleton } from "@/components/ui";
import { useApplyForLoan, useDebounced, useLoanQuote, useProfile } from "@/lib/queries";
import { formatZMW, mask } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, font, radius, space } from "@/lib/theme";

const STEPS = ["Amount", "Employment", "Review"];

export default function ApplyScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [amountText, setAmountText] = useState("5000");
  const [term, setTerm] = useState(12);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const amount = Number(amountText.replace(/[^0-9.]/g, "")) || 0;
  const debounced = useDebounced(amount, 400);
  const base = useLoanQuote(); // rules + salary limit
  const rules = base.data?.rules;
  const inRange = !!rules && debounced >= rules.minAmount && debounced <= rules.maxAmount;
  const quote = useLoanQuote(inRange ? debounced : undefined, inRange ? term : undefined);
  const profile = useProfile();
  const apply = useApplyForLoan();

  const q = quote.data?.quote;
  const maxLoan = base.data?.maxLoan ?? 0;
  const amountError = useMemo(() => {
    if (!rules) return null;
    if (amount < rules.minAmount) return `Minimum loan is ${formatZMW(rules.minAmount, { decimals: 0 })}`;
    if (amount > rules.maxAmount) return `Maximum loan is ${formatZMW(rules.maxAmount, { decimals: 0 })}`;
    if (amount > maxLoan) return `Your limit is ${formatZMW(maxLoan, { decimals: 0 })} (3× declared salary)`;
    return null;
  }, [amount, rules, maxLoan]);
  const quoteFresh = q && q.amount === amount && q.termMonths === term;

  if (submitted) {
    return (
      <Screen edgeTop={false} header={<TopBar title="Application sent" onBack={() => router.replace("/loans")} />}>
        <EmptyState
          icon={CircleCheckBig}
          title="Application submitted"
          message="Your application is now pending review. Submitting doesn't mean it's approved — you'll see the decision on the loan's status."
          action="View application"
          onAction={() => router.replace({ pathname: "/loans/[id]", params: { id: submitted } })}
        />
      </Screen>
    );
  }

  if (base.isPending) {
    return (
      <Screen edgeTop={false} header={<TopBar title="Apply for a loan" />}>
        <Skeleton height={220} r={radius.lg} />
      </Screen>
    );
  }
  if (base.isError) {
    return (
      <Screen edgeTop={false} header={<TopBar title="Apply for a loan" />}>
        <ErrorState offline={isNetworkError(base.error)} message={errorMessage(base.error)} onRetry={() => base.refetch()} />
      </Screen>
    );
  }
  if (!base.data.canApply) {
    const reason =
      base.data.blockingReason === "OPEN_APPLICATION_OR_LOAN"
        ? "You already have an open application or active loan. You can apply again once it's completed."
        : "We need your employment details before you can apply.";
    return (
      <Screen edgeTop={false} header={<TopBar title="Apply for a loan" />}>
        <EmptyState
          icon={ShieldAlert}
          title="You can't apply right now"
          message={reason}
          action={base.data.openLoan ? "View my loan" : undefined}
          onAction={() => base.data.openLoan && router.replace({ pathname: "/loans/[id]", params: { id: base.data.openLoan.id } })}
        />
      </Screen>
    );
  }

  const quick = [0.25, 0.5, 0.75, 1].map((f) => Math.max(rules!.minAmount, Math.floor((maxLoan * f) / 100) * 100));

  return (
    <Screen keyboard edgeTop={false} header={<TopBar title="Apply for a loan" onBack={() => (step > 0 ? setStep(step - 1) : router.back())} />}>
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.mint : colors.border }} />
            <AppText variant="small" color={i === step ? colors.navy : colors.textFaint}>{s}</AppText>
          </View>
        ))}
      </View>

      <Animated.View key={step} entering={FadeInRight.duration(250)} style={{ gap: space.lg }}>
        {step === 0 && (
          <>
            <Card>
              <AppText variant="label" color={colors.textMuted}>How much do you need?</AppText>
              <View style={styles.amountRow}>
                <Stepper icon={Minus} onPress={() => setAmountText(String(Math.max(rules!.minAmount, amount - 500)))} label="Decrease by 500" />
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                  <AppText variant="h1" color={colors.textMuted}>K</AppText>
                  <TextInput
                    value={amountText}
                    onChangeText={(t) => setAmountText(t.replace(/[^0-9]/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    style={styles.amountInput}
                    accessibilityLabel="Loan amount in kwacha"
                    selectTextOnFocus
                  />
                </View>
                <Stepper icon={Plus} onPress={() => setAmountText(String(Math.min(maxLoan, amount + 500)))} label="Increase by 500" />
              </View>
              {amountError ? (
                <AppText variant="small" color={colors.danger} style={{ textAlign: "center" }}>{amountError}</AppText>
              ) : (
                <AppText variant="small" color={colors.textFaint} style={{ textAlign: "center" }}>Your limit: {formatZMW(maxLoan, { decimals: 0 })}</AppText>
              )}
              <View style={styles.quick}>
                {quick.map((v, i) => <Chip key={i} label={i === 3 ? "Max" : formatZMW(v, { decimals: 0 })} active={amount === v} onPress={() => setAmountText(String(v))} />)}
              </View>
            </Card>

            <Card>
              <AppText variant="label" color={colors.textMuted}>Repayment period</AppText>
              <View style={[styles.quick, { justifyContent: "flex-start" }]}>
                {rules!.termOptions.map((t) => <Chip key={t} label={`${t} months`} active={term === t} onPress={() => setTerm(t)} />)}
              </View>
            </Card>

            <QuoteCard loading={quote.isFetching && !quoteFresh} quote={!amountError && quoteFresh ? q : null} />

            <Button title="Continue" disabled={!!amountError || !quoteFresh} onPress={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <Card style={{ gap: space.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Briefcase size={20} color={colors.navy} />
                <AppText variant="h3" style={{ flex: 1 }}>Employment on file</AppText>
                {profile.data?.employmentProfile ? <VerificationBadge status={profile.data.employmentProfile.verificationStatus} /> : null}
              </View>
              {profile.isPending ? (
                <Skeleton height={80} />
              ) : profile.data?.employmentProfile ? (
                <>
                  <KeyValue label="Employer" value={profile.data.employmentProfile.employerName} />
                  <KeyValue label="NAPSA number" value={mask(profile.data.employmentProfile.napsaNumber)} />
                  <KeyValue label="Declared monthly salary" value={formatZMW(profile.data.employmentProfile.monthlySalary)} />
                </>
              ) : (
                <AppText variant="caption" color={colors.textMuted}>Couldn't load your employment details.</AppText>
              )}
            </Card>
            <View style={styles.note}>
              <Info size={18} color={colors.info} />
              <AppText variant="small" color={colors.info} style={{ flex: 1 }}>
                Repayments are deducted from the salary declared above. If these details have changed, contact WePay support before applying.
              </AppText>
            </View>
            <Button title="Details are correct" onPress={() => setStep(2)} />
          </>
        )}

        {step === 2 && q && (
          <>
            <Card>
              <AppText variant="h3" style={{ marginBottom: space.sm }}>Review your application</AppText>
              <KeyValue label="Loan amount" value={formatZMW(q.amount)} />
              <KeyValue label="Repayment period" value={`${q.termMonths} months`} />
              <KeyValue label="Interest rate" value={`${q.annualInterestRate}% per year`} />
              <KeyValue label="Monthly repayment" value={formatZMW(q.monthlyRepayment)} />
              <KeyValue label="Total interest" value={formatZMW(q.totalInterest)} />
              <KeyValue label="Fees" value={q.fees.length ? formatZMW(q.totalFees) : "None"} />
              <Divider style={{ marginVertical: space.xs }} />
              <KeyValue label="Total repayable" value={formatZMW(q.totalRepayment)} strong />
            </Card>
            <Pressable onPress={() => setAgreed(!agreed)} style={styles.agree} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
              <View style={[styles.box, agreed && { backgroundColor: colors.mint, borderColor: colors.mint }]}>
                {agreed ? <Check size={16} color={colors.navy} strokeWidth={3} /> : null}
              </View>
              <AppText variant="caption" style={{ flex: 1 }}>
                I confirm my details are accurate and I understand this is an application — approval is not guaranteed and depends on WePay's review.
              </AppText>
            </Pressable>
            {apply.isError ? <AppText variant="caption" color={colors.danger} accessibilityRole="alert">{errorMessage(apply.error)}</AppText> : null}
            <Button
              title="Submit application"
              disabled={!agreed}
              loading={apply.isPending}
              onPress={() => apply.mutate({ amount: q.amount, termMonths: q.termMonths }, { onSuccess: (loan) => setSubmitted(loan.id) })}
            />
          </>
        )}
      </Animated.View>
    </Screen>
  );
}

function QuoteCard({ quote, loading }: { quote: NonNullable<ReturnType<typeof useLoanQuote>["data"]>["quote"]; loading: boolean }) {
  return (
    <Card style={{ backgroundColor: colors.navy }}>
      <AppText variant="label" color={colors.onDarkMuted}>Estimated monthly repayment</AppText>
      {loading || !quote ? (
        <Skeleton height={34} width={160} style={{ marginTop: 6, backgroundColor: colors.navy3 }} />
      ) : (
        <AppText variant="display" color={colors.white}>{formatZMW(quote.monthlyRepayment)}</AppText>
      )}
      <View style={{ flexDirection: "row", marginTop: space.lg, gap: space.lg }}>
        <QuoteMeta label="Interest" value={quote ? `${quote.annualInterestRate}% p.a.` : "—"} />
        <QuoteMeta label="Total interest" value={quote ? formatZMW(quote.totalInterest, { decimals: 0 }) : "—"} />
        <QuoteMeta label="Total repayable" value={quote ? formatZMW(quote.totalRepayment, { decimals: 0 }) : "—"} />
      </View>
      <AppText variant="small" color={colors.onDarkMuted} style={{ marginTop: space.md }}>Calculated by WePay's servers using current loan rules. {quote?.fees.length ? "" : "No fees apply."}</AppText>
    </Card>
  );
}

function QuoteMeta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="small" color={colors.onDarkMuted}>{label}</AppText>
      <AppText variant="label" color={colors.white}>{value}</AppText>
    </View>
  );
}

function Stepper({ icon: Icon, onPress, label }: { icon: typeof Plus; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.stepper} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <Icon size={20} color={colors.navy} />
    </Pressable>
  );
}

function VerificationBadge({ status }: { status: "PENDING" | "VERIFIED" | "FAILED" }) {
  if (status === "VERIFIED") return <Badge label="Verified" tone="success" />;
  if (status === "FAILED") return <Badge label="Not verified" tone="danger" />;
  return <Badge label="Verification pending" tone="warning" />;
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", gap: space.sm, marginBottom: space.xl },
  amountRow: { flexDirection: "row", alignItems: "center", marginVertical: space.lg, gap: space.sm },
  amountInput: { fontFamily: font.bold, fontSize: 36, color: colors.navy, minWidth: 80, textAlign: "center", padding: 0 },
  stepper: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  quick: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center", marginTop: space.md },
  note: { flexDirection: "row", gap: space.sm, backgroundColor: colors.infoSoft, padding: space.md, borderRadius: radius.md },
  agree: { flexDirection: "row", gap: space.md, alignItems: "flex-start", minHeight: 48 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginTop: 2 },
});
