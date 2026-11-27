import React from "react";
import { View } from "react-native";
import { Screen, TopBar } from "@/components/Screen";
import { AppText, Card } from "@/components/ui";
import { colors, space } from "@/lib/theme";

// Describes what this app actually does with data. It is not a substitute for
// WePay's formal privacy policy, which should be reviewed by a lawyer.
const SECTIONS = [
  { t: "What we collect", b: "The details you give at registration: name, email, phone number, NRC number, employer, NAPSA number and declared monthly salary, plus your loan applications and the transactions recorded on your account." },
  { t: "Why we use it", b: "To assess and manage salary-backed loan applications, calculate repayments, verify your employment and keep your account secure." },
  { t: "How it's protected", b: "Data travels over encrypted HTTPS. Passwords are stored only as one-way hashes. On this phone, your sign-in is kept in Android's secure keystore, never in plain storage. Each request is checked on our servers so you can only ever see your own records." },
  { t: "Security records", b: "We keep a log of security-related events (sign-ins, password resets, loan applications) with the device's IP address, to protect your account from misuse." },
  { t: "Your choices", b: "You can see every device signed in to your account and remove any of them from Profile → Security. To correct or delete your information, contact WePay support." },
];

export default function Privacy() {
  return (
    <Screen edgeTop={false} header={<TopBar title="Privacy" />}>
      <View style={{ gap: space.md }}>
        {SECTIONS.map((s) => (
          <Card key={s.t}>
            <AppText variant="h3">{s.t}</AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 4 }}>{s.b}</AppText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
