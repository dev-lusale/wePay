import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import { CreditCard, Info, Lock, ShieldX, Snowflake, Sun } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Badge, Button, Card, Chip, EmptyState, ErrorState, KeyValue, Skeleton } from "@/components/ui";
import { useCard, useCardAction, useProfile, useRequestCard } from "@/lib/queries";
import { formatDate, formatZMW } from "@/lib/format";
import { errorMessage, isNetworkError } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { colors, font, gradient, radius, shadow, space } from "@/lib/theme";
import type { VirtualCard } from "@/lib/types";

export default function CardScreen() {
  const q = useCard();
  const profile = useProfile();
  const request = useRequestCard();
  const action = useCardAction();
  const [network, setNetwork] = useState<"VISA" | "MASTERCARD">("VISA");
  const holder = profile.data ? `${profile.data.firstName} ${profile.data.lastName}` : "";
  const card = q.data?.card ?? null;

  return (
    <Screen edgeTop={false} header={<TopBar title="Virtual card" />} refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      {q.isPending ? (
        <Skeleton height={210} r={radius.xl} />
      ) : q.isError ? (
        <ErrorState offline={isNetworkError(q.error)} message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : !card ? (
        <View style={{ gap: space.lg }}>
          <CardFace holder={holder} network={network} placeholder />
          <Card style={{ gap: space.sm }}>
            <AppText variant="h3">Get a WePay virtual card</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Shop online and pay subscriptions with a virtual {network === "VISA" ? "Visa" : "Mastercard"} linked to your WePay account. You can freeze it at any time from this screen.
            </AppText>
            <AppText variant="label" color={colors.textMuted} style={{ marginTop: space.sm }}>Card network</AppText>
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <Chip label="Visa" active={network === "VISA"} onPress={() => setNetwork("VISA")} />
              <Chip label="Mastercard" active={network === "MASTERCARD"} onPress={() => setNetwork("MASTERCARD")} />
            </View>
          </Card>
          {request.isError ? <AppText variant="caption" color={colors.danger}>{errorMessage(request.error)}</AppText> : null}
          <Button title="Request virtual card" icon={CreditCard} loading={request.isPending} onPress={() => request.mutate(network)} />
        </View>
      ) : (
        <Animated.View entering={FadeIn} style={{ gap: space.lg }}>
          <CardFace holder={holder} network={card.network} card={card} />
          <StatusNote card={card} />

          <View style={styles.actions}>
            <Button
              title={card.frozen ? "Unfreeze" : "Freeze"}
              icon={card.frozen ? Sun : Snowflake}
              variant={card.frozen ? "primary" : "secondary"}
              loading={action.isPending && action.variables?.action !== "cancel"}
              onPress={() => action.mutate({ id: card.id, action: card.frozen ? "unfreeze" : "freeze" })}
              style={{ flex: 1 }}
            />
            <Button
              title="Cancel card"
              icon={ShieldX}
              variant="danger"
              loading={action.isPending && action.variables?.action === "cancel"}
              onPress={() =>
                confirmAction("Cancel this card?", "The card will be permanently cancelled. You can request a new one later.", "Cancel card", () =>
                  action.mutate({ id: card.id, action: "cancel" })
                )
              }
              style={{ flex: 1 }}
            />
          </View>
          {action.isError ? <AppText variant="caption" color={colors.danger}>{errorMessage(action.error)}</AppText> : null}

          <View style={styles.tiles}>
            <View style={[styles.tile, { backgroundColor: colors.mintSoft }]}>
              <AppText variant="caption" color={colors.textMuted}>Money in</AppText>
              <AppText variant="h3" color={colors.success}>{formatZMW(0)}</AppText>
            </View>
            <View style={[styles.tile, { backgroundColor: colors.surfaceMuted }]}>
              <AppText variant="caption" color={colors.textMuted}>Money out</AppText>
              <AppText variant="h3">{formatZMW(0)}</AppText>
            </View>
          </View>

          <Card>
            <KeyValue label="Network" value={card.network === "VISA" ? "Visa" : "Mastercard"} />
            <KeyValue label="Requested" value={formatDate(card.createdAt)} />
            <KeyValue label="Card number" value={card.last4 ? `•••• ${card.last4}` : "Not issued yet"} />
            <KeyValue label="Expiry" value={card.expiryMonth && card.expiryYear ? `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}` : "—"} />
          </Card>

          <Card>
            <AppText variant="h3" style={{ marginBottom: space.sm }}>Card transactions</AppText>
            <EmptyState icon={CreditCard} title="No card transactions yet" message="Purchases and top-ups made with this card will appear here." />
          </Card>
        </Animated.View>
      )}
    </Screen>
  );
}

function StatusNote({ card }: { card: VirtualCard }) {
  if (card.status === "ACTIVE" && !card.frozen) return null;
  const frozen = card.frozen;
  return (
    <View style={[styles.note, { backgroundColor: frozen ? colors.infoSoft : colors.warningSoft }]}>
      {frozen ? <Lock size={18} color={colors.info} /> : <Info size={18} color={colors.warning} />}
      <AppText variant="small" color={frozen ? colors.info : colors.warning} style={{ flex: 1 }}>
        {frozen
          ? "This card is frozen. Unfreeze it when you want to use it again."
          : "Your card request has been received. Your card number and expiry date will appear here once the card is issued — until then it can't be used for payments."}
      </AppText>
    </View>
  );
}

function CardFace({ holder, network, card, placeholder }: { holder: string; network: string; card?: VirtualCard; placeholder?: boolean }) {
  const status = card ? (card.frozen ? "Frozen" : card.status === "ACTIVE" ? "Active" : "Requested") : null;
  const number = card?.last4 ? `••••  ••••  ••••  ${card.last4}` : "••••  ••••  ••••  ••••";
  return (
    <LinearGradient
      colors={card?.frozen ? ["#8A97A8", "#5D6B7E"] : placeholder ? [colors.navy2, colors.navy3] : gradient.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.face}
    >
      <View style={styles.ring} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <AppText variant="h3" color={placeholder ? colors.white : colors.navy}>We<AppText variant="h3" color={placeholder ? colors.mint : colors.white}>Pay</AppText></AppText>
        {status ? <Badge label={status} tone={card?.frozen ? "info" : card?.status === "ACTIVE" ? "success" : "warning"} /> : null}
      </View>
      <AppText style={[styles.number, { color: placeholder ? colors.white : colors.navy }]}>{number}</AppText>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View>
          <AppText variant="small" color={placeholder ? colors.onDarkMuted : colors.navy} style={{ opacity: 0.8 }}>Card holder</AppText>
          <AppText variant="label" color={placeholder ? colors.white : colors.navy} numberOfLines={1}>{holder.toUpperCase() || " "}</AppText>
        </View>
        <AppText style={{ fontFamily: font.bold, fontSize: 20, fontStyle: "italic", color: placeholder ? colors.white : colors.navy }}>
          {network === "MASTERCARD" ? "mastercard" : "VISA"}
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  face: { borderRadius: radius.xl, padding: space.xl, aspectRatio: 1.586, justifyContent: "space-between", overflow: "hidden", ...shadow.card },
  ring: { position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 30, borderColor: "rgba(255,255,255,0.18)" },
  number: { fontFamily: font.semibold, fontSize: 20, letterSpacing: 1.5 },
  note: { flexDirection: "row", gap: space.sm, padding: space.md, borderRadius: radius.md },
  actions: { flexDirection: "row", gap: space.md },
  tiles: { flexDirection: "row", gap: space.md },
  tile: { flex: 1, borderRadius: radius.lg, padding: space.lg, gap: 2 },
});
