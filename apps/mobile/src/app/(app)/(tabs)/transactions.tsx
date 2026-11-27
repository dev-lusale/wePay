import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeftRight, Search, X } from "lucide-react-native";
import { HeroHeader, OfflineBanner } from "@/components/Screen";
import { AppText, Chip, EmptyState, ErrorState, ListSkeleton } from "@/components/ui";
import { TransactionRow } from "@/components/finance";
import { useDebounced, useTransactions, useTxSummary, type TxFilters } from "@/lib/queries";
import { formatZMW } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { colors, font, radius, space } from "@/lib/theme";
import type { TransactionType } from "@/lib/types";

const TYPES: { key?: TransactionType; label: string }[] = [
  { label: "All" },
  { key: "DISBURSEMENT", label: "Received" },
  { key: "REPAYMENT", label: "Repayments" },
  { key: "FEE", label: "Fees" },
];
const PERIODS = [
  { days: 0, label: "Any time" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TransactionType | undefined>();
  const [days, setDays] = useState(0);
  const q = useDebounced(search.trim(), 350);
  const filters: TxFilters = useMemo(
    () => ({
      q: q || undefined,
      type,
      // Rounded to the day so the query key stays stable between renders.
      from: days ? new Date(new Date().setHours(0, 0, 0, 0) - days * 86_400_000).toISOString() : undefined,
    }),
    [q, type, days]
  );
  const tx = useTransactions(filters);
  const summary = useTxSummary();
  const items = tx.data?.pages.flat() ?? [];
  const filtered = !!(q || type || days);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeroHeader>
        <AppText variant="h1" color={colors.white}>Activity</AppText>
        <View style={styles.search}>
          <Search size={18} color={colors.textFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search transactions"
          />
          {search ? <X size={18} color={colors.textFaint} onPress={() => setSearch("")} accessibilityLabel="Clear search" /> : null}
        </View>
      </HeroHeader>
      <OfflineBanner />
      <View style={styles.totals}>
        <Total label="Total disbursed" value={summary.data?.totalDisbursed} color={colors.success} />
        <Total label="Total repaid" value={summary.data?.totalRepaid} />
        <Total label="Total fees" value={summary.data?.totalFees} color={colors.warning} />
      </View>
      <View style={{ paddingTop: space.md, gap: space.sm }}>
        <FlatList horizontal data={TYPES} keyExtractor={(t) => t.label} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} renderItem={({ item }) => <Chip label={item.label} active={type === item.key} onPress={() => setType(item.key)} />} />
        <FlatList horizontal data={PERIODS} keyExtractor={(t) => t.label} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} renderItem={({ item }) => <Chip label={item.label} active={days === item.days} onPress={() => setDays(item.days)} />} />
      </View>
      {tx.isPending ? (
        <View style={{ padding: space.xl }}><ListSkeleton rows={6} /></View>
      ) : tx.isError ? (
        <ErrorState offline={isNetworkError(tx.error)} message={errorMessage(tx.error)} onRetry={() => tx.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.xxxl, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={tx.isRefetching && !tx.isFetchingNextPage} onRefresh={() => { void tx.refetch(); void summary.refetch(); }} colors={[colors.turquoise]} />}
          renderItem={({ item }) => <TransactionRow tx={item} onPress={() => router.push({ pathname: "/transactions/[id]", params: { id: item.id } })} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => tx.hasNextPage && !tx.isFetchingNextPage && tx.fetchNextPage()}
          ListFooterComponent={tx.isFetchingNextPage ? <ActivityIndicator color={colors.turquoise} style={{ margin: space.lg }} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              icon={ArrowLeftRight}
              title={filtered ? "No matching transactions" : "No transactions yet"}
              message={filtered ? "Try a different search or filter." : "Disbursements, repayments and fees appear here once they're recorded on your account."}
            />
          }
        />
      )}
    </View>
  );
}

function Total({ label, value, color = colors.text }: { label: string; value?: number; color?: string }) {
  return (
    <View style={styles.total}>
      <AppText variant="small" color={colors.textMuted} numberOfLines={1}>{label}</AppText>
      <AppText variant="bodyStrong" color={color} numberOfLines={1} adjustsFontSizeToFit>{value === undefined ? "—" : formatZMW(value, { decimals: 0 })}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  totals: { flexDirection: "row", gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.lg },
  total: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.md },
  search: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: space.lg, marginTop: space.lg, minHeight: 50 },
  searchInput: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.text, paddingVertical: 10 },
  chips: { gap: space.sm, paddingHorizontal: space.xl },
});
