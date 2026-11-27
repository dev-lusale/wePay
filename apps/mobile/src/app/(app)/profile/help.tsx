import React, { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ChevronDown, Mail } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Button, Card } from "@/components/ui";
import { useLoanQuote } from "@/lib/queries";
import { formatZMW } from "@/lib/format";
import { SUPPORT_EMAIL } from "@/lib/config";
import { colors, space } from "@/lib/theme";

export default function Help() {
  const rules = useLoanQuote().data?.rules;
  const faqs = [
    { q: "How much can I borrow?", a: rules ? `Between ${formatZMW(rules.minAmount, { decimals: 0 })} and ${formatZMW(rules.maxAmount, { decimals: 0 })}, up to ${rules.salaryMultiple}× your declared monthly salary.` : "Up to 3× your declared monthly salary." },
    { q: "What does a loan cost?", a: rules ? `Interest is ${rules.annualInterestRate}% per year, repaid in equal monthly instalments over ${rules.minTermMonths}–${rules.maxTermMonths} months. ${rules.fees.length ? "" : "No additional fees currently apply."} You'll see the exact monthly repayment and total cost before you apply.` : "You'll see the exact monthly repayment and total cost before you apply." },
    { q: "Is my loan approved when I apply?", a: "No. Submitting creates an application with status \"Pending review\". The status changes in the app once WePay makes a decision." },
    { q: "Can I have more than one loan?", a: "No. You can have one open application or active loan at a time." },
    { q: "Why can't I see a repayment schedule?", a: "The official schedule is issued when your loan is disbursed. Before that, the loan screen shows a clearly-labelled estimate based on your loan's terms." },
    { q: "I forgot my password", a: "Use \"Forgot password\" on the sign-in screen. We'll email you a 6-digit code that expires after 15 minutes." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen edgeTop={false} header={<TopBar title="Help centre" />}>
      <View style={{ gap: space.sm }}>
        {faqs.map((f, i) => (
          <Card key={f.q} padded={false}>
            <Pressable onPress={() => setOpen(open === i ? null : i)} style={{ padding: space.lg, flexDirection: "row", alignItems: "center", gap: space.md }} accessibilityRole="button" accessibilityState={{ expanded: open === i }}>
              <AppText variant="bodyStrong" style={{ flex: 1 }}>{f.q}</AppText>
              <ChevronDown size={18} color={colors.textMuted} style={{ transform: [{ rotate: open === i ? "180deg" : "0deg" }] }} />
            </Pressable>
            {open === i && (
              <Animated.View entering={FadeIn} style={{ paddingHorizontal: space.lg, paddingBottom: space.lg }}>
                <AppText variant="caption" color={colors.textMuted}>{f.a}</AppText>
              </Animated.View>
            )}
          </Card>
        ))}
      </View>
      {SUPPORT_EMAIL ? (
        <Button title="Email WePay support" icon={Mail} variant="dark" style={{ marginTop: space.xxl }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=WePay%20app%20support`)} />
      ) : null}
    </Screen>
  );
}
