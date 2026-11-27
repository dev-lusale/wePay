import { useMemo } from "react";
import { useLoans, useProfile, useStats } from "./queries";
import { daysUntil, formatDate, formatZMW } from "./format";

export interface Alert {
  id: string;
  tone: "info" | "warning" | "danger" | "success";
  title: string;
  body: string;
  loanId?: string;
}

/**
 * Account alerts derived from the user's real records. The backend has no
 * notifications table or push service yet, so nothing here is "sent" — it's
 * computed from loans, repayments and profile status every time.
 */
export function useAlerts(): Alert[] {
  const { data: loans } = useLoans();
  const { data: stats } = useStats();
  const { data: profile } = useProfile();

  return useMemo(() => {
    const out: Alert[] = [];
    for (const l of loans ?? []) {
      const overdue = l.repayments.filter((r) => r.status === "OVERDUE");
      if (overdue.length) {
        out.push({
          id: `overdue-${l.id}`,
          tone: "danger",
          title: `${overdue.length} overdue repayment${overdue.length > 1 ? "s" : ""}`,
          body: `Your loan of ${formatZMW(l.amount)} has missed repayments. Contact WePay support to arrange payment.`,
          loanId: l.id,
        });
      }
      if (l.status === "PENDING") {
        out.push({ id: `pending-${l.id}`, tone: "info", title: "Application under review", body: `Your ${formatZMW(l.amount)} application from ${formatDate(l.createdAt)} is awaiting a decision.`, loanId: l.id });
      }
      if (l.status === "APPROVED") {
        out.push({ id: `approved-${l.id}`, tone: "success", title: "Loan approved", body: `Your ${formatZMW(l.amount)} loan has been approved and is awaiting disbursement.`, loanId: l.id });
      }
    }
    if (stats?.nextPaymentDate) {
      const d = daysUntil(stats.nextPaymentDate);
      if (d >= 0 && d <= 7) {
        out.push({ id: "due-soon", tone: "warning", title: d === 0 ? "Repayment due today" : `Repayment due in ${d} day${d > 1 ? "s" : ""}`, body: `${formatZMW(stats.nextPaymentAmount)} is due on ${formatDate(stats.nextPaymentDate)}.` });
      }
    }
    const v = profile?.employmentProfile?.verificationStatus;
    if (v === "PENDING") out.push({ id: "emp-pending", tone: "info", title: "Employment verification pending", body: "Your employer and NAPSA details haven't been verified yet." });
    if (v === "FAILED") out.push({ id: "emp-failed", tone: "danger", title: "Employment verification failed", body: "We couldn't verify your employment details. Please contact support." });
    return out;
  }, [loans, stats, profile]);
}
