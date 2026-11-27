// Shapes returned by the WePay backend. Decimal columns may arrive as strings.
export type Money = number | string;

export type LoanStatus = "PENDING" | "APPROVED" | "ACTIVE" | "COMPLETED" | "DEFAULTED";
export type RepaymentStatus = "PENDING" | "PAID" | "OVERDUE";
export type TransactionType = "DISBURSEMENT" | "REPAYMENT" | "FEE";
export type VerificationStatus = "PENDING" | "VERIFIED" | "FAILED";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
  sessionId: string;
}

export interface LoginResponse extends TokenResponse {
  user: SessionUser;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nrcNumber: string;
  role: string;
  createdAt: string;
  employmentProfile: {
    employerName: string;
    napsaNumber: string;
    monthlySalary: Money;
    verificationStatus: VerificationStatus;
  } | null;
  creditProfile: {
    transunionScore: number | null;
    reportDate: string | null;
    status: string;
  } | null;
}

export interface DashboardStats {
  totalBalance: number;
  availableCredit: number;
  activeLoans: number;
  totalBorrowed: number;
  nextPaymentDate: string | null;
  nextPaymentAmount: number;
  monthlySalary: number;
}

export interface Repayment {
  id: string;
  dueDate: string;
  amount: Money;
  paidAt: string | null;
  status: RepaymentStatus;
}

export interface Loan {
  id: string;
  amount: Money;
  interestRate: Money;
  termMonths: number;
  monthlyRepayment: Money;
  status: LoanStatus;
  disbursedAt: string | null;
  createdAt: string;
  repayments: Repayment[];
}

export interface ScheduleRow {
  installment: number;
  dueDate: string;
  payment: number;
  principal: number;
  interest: number;
  balanceAfter: number;
}

export interface LoanDetail {
  id: string;
  status: LoanStatus;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyRepayment: number;
  totalRepayment: number;
  totalInterest: number;
  fees: { name: string; amount: number }[];
  disbursedAt: string | null;
  createdAt: string;
  schedule:
    | {
        kind: "official";
        repayments: (Omit<Repayment, "amount"> & { amount: number })[];
        paidCount: number;
        totalCount: number;
        amountPaid: number;
        outstandingBalance: number;
        nextRepayment: (Omit<Repayment, "amount"> & { amount: number }) | null;
      }
    | { kind: "estimated"; note: string; rows: ScheduleRow[]; outstandingBalance: null };
}

export interface LoanRules {
  currency: string;
  annualInterestRate: number;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  salaryMultiple: number;
  termOptions: number[];
  fees: { name: string; amount: number }[];
}

export interface LoanQuoteResponse {
  rules: LoanRules;
  maxLoan: number;
  employment: { employerName: string; verificationStatus: VerificationStatus } | null;
  canApply: boolean;
  blockingReason: "NO_EMPLOYMENT_PROFILE" | "OPEN_APPLICATION_OR_LOAN" | null;
  openLoan: { id: string; status: LoanStatus } | null;
  quote: {
    amount: number;
    termMonths: number;
    annualInterestRate: number;
    monthlyRepayment: number;
    totalInterest: number;
    fees: { name: string; amount: number }[];
    totalFees: number;
    totalRepayment: number;
    exceedsLimit: boolean;
  } | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: Money;
  description: string;
  createdAt: string;
}

export interface Analytics {
  range: { months: number; from: string; to: string };
  totals: { disbursed: number; repaid: number; fees: number; transactionCount: number };
  monthly: { month: string; disbursed: number; repaid: number; fees: number; count: number }[];
  loans: { total: number; byStatus: Partial<Record<LoanStatus, number>>; totalBorrowedAllTime: number };
  repaymentProgress: {
    loanId: string;
    paidInstallments: number;
    totalInstallments: number;
    amountPaid: number;
    amountOutstanding: number;
  } | null;
}

export interface DeviceSession {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string;
  ipAddress: string | null;
  current: boolean;
}
