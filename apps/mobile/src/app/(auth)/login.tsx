import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Mail } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { FormInput } from "@/components/FormInput";
import { AppText, Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { errorMessage } from "@/lib/api";
import { colors, space } from "@/lib/theme";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      await signIn(v.email, v.password);
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  return (
    <Screen keyboard edgeTop={false} header={<TopBar title="" />}>
      <AppText variant="h1">Welcome back</AppText>
      <AppText color={colors.textMuted} style={{ marginTop: 4, marginBottom: space.xxl }}>
        Sign in with the email and password you registered with.
      </AppText>
      <View style={{ gap: space.lg }}>
        <FormInput control={control} name="email" label="Email" icon={Mail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" returnKeyType="next" />
        <FormInput control={control} name="password" label="Password" icon={Lock} secure autoComplete="password" textContentType="password" placeholder="Your password" returnKeyType="go" onSubmitEditing={() => onSubmit()} />
        <Pressable onPress={() => router.push("/forgot-password")} hitSlop={10} style={{ alignSelf: "flex-end" }} accessibilityRole="link">
          <AppText variant="label" color={colors.turquoise}>Forgot password?</AppText>
        </Pressable>
        {serverError ? <AppText variant="caption" color={colors.danger} accessibilityRole="alert">{serverError}</AppText> : null}
        <Button title="Sign in" onPress={onSubmit} loading={formState.isSubmitting} />
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: space.sm }}>
          <AppText variant="caption" color={colors.textMuted}>New to WePay?</AppText>
          <Pressable onPress={() => router.replace("/register")} hitSlop={10} accessibilityRole="link">
            <AppText variant="label" color={colors.turquoise}>Create an account</AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
