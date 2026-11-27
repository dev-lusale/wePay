import { calculateMonthlyRepayment, calculateMaxLoanAmount } from "@/lib/utils";

/**
 * Single source of truth for WePay's lending rules.
 *
 * These values are exactly the rules already enforced by POST /api/loans and
 * shown on the web application form (18% p.a. amortised, 3× monthly salary
 * cap, ZMW 500–100,000, 1–36 months). Mobile clients must never compute
 * these themselves — they ask GET /api/loans/quote.
 */
export const LOAN_RULES = {
  currency: "ZMW",
  annualInterestRate: 18,
  minAmount: 500,
  maxAmount: 100_000,
  minTermMonths: 1,
  maxTermMonths: 36,
  salaryMultiple: 3,
  termOptions: [3, 6, 9, 12, 18, 24, 36],
  /** No fees are defined in the current backend. Listed explicitly so clients can show "No fees". */
  fees: [] as { name: string; amount: number }[],
} as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function maxLoanForSalary(monthlySalary: number): number {
  return Math.min(calculateMaxLoanAmount(monthlySalary), LOAN_RULES.maxAmount);
}

export function quoteLoan(amount: number, termMonths: number) {
  const monthlyRepayment = calculateMonthlyRepayment(
    amount,
    LOAN_RULES.annualInterestRate,
    termMonths
  );
  const totalFees = LOAN_RULES.fees.reduce((s, f) => s + f.amount, 0);
  const totalRepayment = round2(monthlyRepayment * termMonths + totalFees);
  return {
    amount: round2(amount),
    termMonths,
    annualInterestRate: LOAN_RULES.annualInterestRate,
    monthlyRepayment,
    totalInterest: round2(monthlyRepayment * termMonths - amount),
    fees: LOAN_RULES.fees,
    totalFees,
    totalRepayment,
  };
}

export interface ScheduleRow {
  installment: number;
  dueDate: string;
  payment: number;
  principal: number;
  interest: number;
  balanceAfter: number;
}

/**
 * Amortisation schedule derived from a loan's own stored terms. Used ONLY to
 * show an *estimated* schedule for loans that have not had an official
 * repayment schedule issued yet; responses label it as estimated.
 */
export function estimateSchedule(
  amount: number,
  annualInterestRate: number,
  termMonths: number,
  monthlyRepayment: number,
  startDate: Date
): ScheduleRow[] {
  const r = annualInterestRate / 100 / 12;
  let balance = amount;
  const rows: ScheduleRow[] = [];
  for (let i = 1; i <= termMonths; i++) {
    const interest = round2(balance * r);
    let principal = round2(monthlyRepayment - interest);
    let payment = monthlyRepayment;
    if (i === termMonths) {
      principal = round2(balance);
      payment = round2(principal + interest);
    }
    balance = round2(Math.max(0, balance - principal));
    const due = new Date(startDate);
    due.setMonth(due.getMonth() + i);
    rows.push({
      installment: i,
      dueDate: due.toISOString(),
      payment,
      principal,
      interest,
      balanceAfter: balance,
    });
  }
  return rows;
}
