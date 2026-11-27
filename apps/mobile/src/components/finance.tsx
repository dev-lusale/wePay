import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownLeft, ArrowUpRight, Receipt, type LucideIcon } from "lucide-react-native";
import { AppText, Badge, Touchable } from "./ui";
import { colors, font, gradient, radius, shadow, space } from "@/lib/theme";
import { formatDateTime, formatZMW, num } from "@/lib/format";
import type { LoanStatus, Transaction } from "@/lib/types";

export const LOAN_STATUS: Record<LoanStatus, { label: string; tone: "warning" | "info" | "success" | "neutral" | "danger" }> = {
  PENDING: { label: "Pending review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  COMPLETED: { label: "Completed", tone: "neutral" },
  DEFAULTED: { label: "Defaulted", tone: "danger" },
};

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const s = LOAN_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge label={s.label} tone={s.tone} />;
}

/** Gradient summary card (the reference's mint/turquoise card). */
export function BalanceCard({
  label,
  amount,
  footerLeft,
  footerRight,
  children,
}: {
  label: string;
  amount: string;
  footerLeft?: string;
  footerRight?: string;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient colors={gradient.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balance}>
      <View style={styles.ringA} />
      <View style={styles.ringB} />
      <AppText variant="label" color={colors.navy} style={{ opacity: 0.75 }}>
        {label}
      </AppText>
      <AppText variant="display" color={colors.navy} style={{ marginTop: 4 }} adjustsFontSizeToFit numberOfLines={1}>
        {amount}
      </AppText>
      {children}
      {(footerLeft || footerRight) && (
        <View style={styles.balanceFooter}>
          <AppText variant="caption" color={colors.navy} style={{ opacity: 0.8, flex: 1 }} numberOfLines={2}>
            {footerLeft}
          </AppText>
          {footerRight ? (
            <AppText variant="label" color={colors.navy} style={{ fontFamily: font.semibold }}>
              {footerRight}
            </AppText>
          ) : null}
        </View>
      )}
    </LinearGradient>
  );
}

export function QuickAction({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress?: () => void }) {
  return (
    <Touchable onPress={onPress} style={styles.qa} accessibilityRole="button" accessibilityLabel={label}>
      <View style={styles.qaIcon}>
        <Icon size={22} color={colors.navy} strokeWidth={2} />
      </View>
      <AppText variant="small" color={colors.textMuted} style={{ fontFamily: font.medium }}>
        {label}
      </AppText>
    </Touchable>
  );
}

const TX_META: Record<string, { icon: LucideIcon; tint: string; bg: string; label: string; sign: 1 | -1 }> = {
  DISBURSEMENT: { icon: ArrowDownLeft, tint: colors.success, bg: colors.mintSoft, label: "Disbursement", sign: 1 },
  REPAYMENT: { icon: ArrowUpRight, tint: colors.navy, bg: colors.surfaceMuted, label: "Repayment", sign: -1 },
  FEE: { icon: Receipt, tint: colors.warning, bg: colors.warningSoft, label: "Fee", sign: -1 },
};

export const txMeta = (type: string) => TX_META[type] ?? TX_META.FEE;

export function TransactionRow({ tx, onPress }: { tx: Transaction; onPress?: () => void }) {
  const m = txMeta(tx.type);
  const Icon = m.icon;
  const amount = num(tx.amount) * m.sign;
  return (
    <Touchable onPress={onPress} style={styles.txRow} accessibilityRole="button" accessibilityLabel={`${m.label} ${formatZMW(amount)} ${tx.description}`}>
      <View style={[styles.txIcon, { backgroundColor: m.bg }]}>
        <Icon size={20} color={m.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {tx.description}
        </AppText>
        <AppText variant="small" color={colors.textFaint}>
          {formatDateTime(tx.createdAt)}
        </AppText>
      </View>
      <AppText variant="bodyStrong" color={amount > 0 ? colors.success : colors.text}>
        {formatZMW(amount, { sign: true })}
      </AppText>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  balance: { borderRadius: radius.xl, padding: space.xl, overflow: "hidden", ...shadow.card },
  ringA: { position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: 80, borderWidth: 26, borderColor: "rgba(255,255,255,0.22)" },
  ringB: { position: "absolute", right: 30, bottom: -60, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.12)" },
  balanceFooter: { flexDirection: "row", alignItems: "flex-end", marginTop: space.lg, gap: space.md },
  qa: { alignItems: "center", gap: 6, flex: 1, minHeight: 72 },
  qaIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm, minHeight: 56 },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
