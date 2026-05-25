import { Role, LoanStatus, RepaymentStatus, TransactionType, VerificationStatus } from "@prisma/client";

export type { Role, LoanStatus, RepaymentStatus, TransactionType, VerificationStatus };

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  nrcNumber: string;
  role: Role;
  createdAt: Date;
  employmentProfile?: EmploymentProfileData | null;
  creditProfile?: CreditProfileData | null;
}

export interface EmploymentProfileData {
  id: string;
  userId: string;
  employerName: string;
  napsaNumber: string;
  monthlySalary: number;
  verificationStatus: VerificationStatus;
}

export interface CreditProfileData {
  id: string;
  userId: string;
  transunionScore: number | null;
  reportDate: Date | null;
  status: string;
}

export interface LoanData {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyRepayment: number;
  status: LoanStatus;
  disbursedAt: Date | null;
  createdAt: Date;
  repayments?: LoanRepaymentData[];
}

export interface LoanRepaymentData {
  id: string;
  loanId: string;
  dueDate: Date;
  amount: number;
  paidAt: Date | null;
  status: RepaymentStatus;
}

export interface TransactionData {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalBalance: number;
  activeLoans: number;
  totalBorrowed: number;
  nextPaymentDate: Date | null;
  nextPaymentAmount: number;
}

// Form types
export interface RegisterStep1Data {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nrcNumber: string;
}

export interface RegisterStep2Data {
  employerName: string;
  napsaNumber: string;
  monthlySalary: number;
}

export interface RegisterStep3Data {
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface LoanApplicationData {
  amount: number;
  termMonths: number;
}

// Next Auth extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}
