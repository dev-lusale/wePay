import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { FormInput } from "@/components/FormInput";
import { AppText, Button } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { colors, space } from "@/lib/theme";

const schema = z.object({ email: z.string().trim().email("Please enter a valid email address") });

export default function ForgotPassword() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await api("/api/mobile/auth/forgot-password", { body: { email }, auth: false });
      router.push({ pathname: "/reset-password", params: { email } });
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <Screen keyboard edgeTop={false} header={<TopBar title="" />}>
      <AppText variant="h1">Forgot password</AppText>
      <AppText color={colors.textMuted} style={{ marginTop: 4, marginBottom: space.xxl }}>
        Enter your account email. If it's registered, we'll email you a 6-digit code to reset your password.
      </AppText>
      <View style={{ gap: space.lg }}>
        <FormInput control={control} name="email" label="Email" icon={Mail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        {error ? <AppText variant="caption" color={colors.danger} accessibilityRole="alert">{error}</AppText> : null}
        <Button title="Send reset code" onPress={onSubmit} loading={formState.isSubmitting} />
        <Button title="I already have a code" variant="ghost" onPress={() => router.push("/reset-password")} />
      </View>
    </Screen>
  );
}
