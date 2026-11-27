import React, { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, KeyRound, Lock, Mail } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { FormInput } from "@/components/FormInput";
import { AppText, Button, EmptyState } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { colors, space } from "@/lib/theme";

const schema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address"),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: "Passwords do not match", path: ["confirm"] });
type Form = z.infer<typeof schema>;

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.email ?? "", code: "", newPassword: "", confirm: "" },
  });

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await api("/api/mobile/auth/reset-password", { body: { email: v.email, code: v.code, newPassword: v.newPassword }, auth: false });
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  if (done) {
    return (
      <Screen edgeTop={false} header={<TopBar title="" />}>
        <EmptyState icon={CheckCircle2} title="Password updated" message="For your security, you've been signed out on all devices. Sign in with your new password." action="Go to sign in" onAction={() => router.replace("/login")} />
      </Screen>
    );
  }

  return (
    <Screen keyboard edgeTop={false} header={<TopBar title="" />}>
      <AppText variant="h1">Reset password</AppText>
      <AppText color={colors.textMuted} style={{ marginTop: 4, marginBottom: space.xxl }}>Enter the code we emailed you and choose a new password. Codes expire after 15 minutes.</AppText>
      <View style={{ gap: space.lg }}>
        <FormInput control={control} name="email" label="Email" icon={Mail} keyboardType="email-address" autoCapitalize="none" />
        <FormInput control={control} name="code" label="6-digit code" icon={KeyRound} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" />
        <FormInput control={control} name="newPassword" label="New password" icon={Lock} secure autoComplete="new-password" hint="At least 8 characters, one uppercase letter and one number" />
        <FormInput control={control} name="confirm" label="Confirm new password" icon={Lock} secure autoComplete="new-password" />
        {error ? <AppText variant="caption" color={colors.danger} accessibilityRole="alert">{error}</AppText> : null}
        <Button title="Update password" onPress={onSubmit} loading={formState.isSubmitting} />
      </View>
    </Screen>
  );
}
