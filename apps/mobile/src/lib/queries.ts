import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  Analytics,
  DashboardStats,
  DeviceSession,
  Loan,
  LoanDetail,
  LoanQuoteResponse,
  Profile,
  Transaction,
  TransactionType,
} from "./types";

export const keys = {
  profile: ["profile"] as const,
  stats: ["stats"] as const,
  loans: ["loans"] as const,
  loan: (id: string) => ["loan", id] as const,
  quote: (a?: number, t?: number) => ["quote", a ?? null, t ?? null] as const,
  transactions: (f: TxFilters) => ["transactions", f] as const,
  transaction: (id: string) => ["transaction", id] as const,
  analytics: (m: number) => ["analytics", m] as const,
  sessions: ["sessions"] as const,
};

export const useProfile = () => useQuery({ queryKey: keys.profile, queryFn: () => api<Profile>("/api/user/profile") });
export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api<DashboardStats>("/api/dashboard/stats") });
export const useLoans = () => useQuery({ queryKey: keys.loans, queryFn: () => api<Loan[]>("/api/loans") });
export const useLoan = (id: string) =>
  useQuery({ queryKey: keys.loan(id), queryFn: () => api<LoanDetail>(`/api/loans/${encodeURIComponent(id)}`), enabled: !!id });
export const useAnalytics = (months: number) =>
  useQuery({ queryKey: keys.analytics(months), queryFn: () => api<Analytics>(`/api/analytics?months=${months}`) });
export const useTransaction = (id: string) =>
  useQuery({ queryKey: keys.transaction(id), queryFn: () => api<Transaction>(`/api/transactions/${encodeURIComponent(id)}`), enabled: !!id });
export const useSessions = () =>
  useQuery({ queryKey: keys.sessions, queryFn: () => api<DeviceSession[]>("/api/mobile/auth/sessions") });

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Server-side loan quote. Without amount/term it returns just the rules & limit. */
export function useLoanQuote(amount?: number, termMonths?: number) {
  const valid = amount !== undefined && termMonths !== undefined && Number.isFinite(amount);
  return useQuery({
    queryKey: keys.quote(valid ? amount : undefined, valid ? termMonths : undefined),
    queryFn: () =>
      api<LoanQuoteResponse>(
        valid ? `/api/loans/quote?amount=${amount}&termMonths=${termMonths}` : "/api/loans/quote"
      ),
    placeholderData: (prev) => prev,
    retry: (count, err) => (err as { status?: number })?.status !== 400 && count < 2,
  });
}

export interface TxFilters {
  q?: string;
  type?: TransactionType;
  from?: string;
}

const PAGE = 25;
export function useTransactions(f: TxFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: keys.transactions(f),
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const p = new URLSearchParams({ limit: String(PAGE) });
      if (f.q) p.set("q", f.q);
      if (f.type) p.set("type", f.type);
      if (f.from) p.set("from", f.from);
      if (pageParam) p.set("before", pageParam);
      return api<Transaction[]>(`/api/transactions?${p.toString()}`);
    },
    getNextPageParam: (last) => (last.length === PAGE ? last[last.length - 1].createdAt : undefined),
  });
}

export function useApplyForLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { amount: number; termMonths: number }) => api<Loan>("/api/loans", { body: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.loans });
      qc.invalidateQueries({ queryKey: keys.stats });
      qc.invalidateQueries({ queryKey: ["quote"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/mobile/auth/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sessions }),
  });
}
