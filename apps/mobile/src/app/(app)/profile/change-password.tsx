import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Lock } from "lucide-react-native";
import { Screen, TopBar } from "@/components/Screen";
import { FormInput } from "@/components/FormInput";
import { AppText, Button, EmptyState } from "@/components/ui";
import { useChangePassword } from "@/lib/queries";
import { errorMessage } from "@/lib/api";
import { colors, space } from "@/lib/theme";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: "Passwords do not match", path: ["confirm"] })
  .refine((d) => d.newPassword !== d.currentPassword, { message: "Choose a different password", path: ["newPassword"] });
type Form = z.infer<typeof schema>;

export default function ChangePassword() {
  const router = useRouter();
  const change = useChangePassword();
  const [done, setDone] = useState<number | null>(null);
  const { control, handleSubmit } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirm: "" } });

  if (done !== null) {
    return (
      <Screen edgeTop={false} header={<TopBar title="Change password" />}>
        <EmptyState
          icon={CheckCircle2}
          title="Password changed"
          message={done > 0 ? `You're still signed in here. ${done} other device${done > 1 ? "s were" : " was"} signed out.` : "You're still signed in on this device."}
          action="Done"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen keyboard edgeTop={false} header={<TopBar title="Change password" />}>
      <AppText color={colors.textMuted} style={{ marginBottom: space.xl }}>
        For your security, other phones signed in to your account will be signed out.
      </AppText>
      <View style={{ gap: space.lg }}>
        <FormInput control={control} name="currentPassword" label="Current password" icon={Lock} secure autoComplete="password" />
        <FormInput control={control} name="newPassword" label="New password" icon={Lock} secure autoComplete="new-password" hint="At least 8 characters, one uppercase letter and one number" />
        <FormInput control={control} name="confirm" label="Confirm new password" icon={Lock} secure autoComplete="new-password" />
        {change.isError ? <AppText variant="caption" color={colors.danger} accessibilityRole="alert">{errorMessage(change.error)}</AppText> : null}
        <Button
          title="Change password"
          loading={change.isPending}
          onPress={handleSubmit((v) => change.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }, { onSuccess: (r) => setDone(r.otherSessionsRevoked) }))}
        />
      </View>
    </Screen>
  );
}
