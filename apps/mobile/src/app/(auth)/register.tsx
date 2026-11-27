import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useForm, useFormState, type Control } from "react-hook-form";
import { z } from "zod";
import { Briefcase, Check, CreditCard, Hash, IdCard, Lock, Mail, Phone, User, Wallet } from "lucide-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Screen, TopBar } from "@/components/Screen";
import { FormInput } from "@/components/FormInput";
import { AppText, Button } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius, space } from "@/lib/theme";

// Same fields and rules as the web registration form (src/app/register/page.tsx).
const step1 = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(10, "Please enter a valid phone number"),
  nrcNumber: z.string().trim().min(6, "Please enter a valid NRC number"),
});
const step2 = z.object({
  employerName: z.string().trim().min(2, "Employer name is required"),
  napsaNumber: z.string().trim().min(6, "Please enter a valid NAPSA number"),
  monthlySalary: z.number({ invalid_type_error: "Enter your monthly salary" }).min(1000, "Monthly salary must be at least ZMW 1,000"),
});
const step3 = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((v) => v === true, { message: "You must agree to the terms and conditions" }),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

const schemas = [step1, step2, step3] as const;
const STEPS = ["Personal", "Employment", "Security"];

type Form = z.infer<typeof step1> & z.infer<typeof step2> & { password: string; confirmPassword: string; agreeToTerms: boolean };

const FIELDS: (keyof Form)[][] = [
  ["firstName", "lastName", "email", "phone", "nrcNumber"],
  ["employerName", "napsaNumber", "monthlySalary"],
  ["password", "confirmPassword", "agreeToTerms"],
];

export default function Register() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { control, getValues, setError, clearErrors, watch, setValue } = useForm<Form>({
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", nrcNumber: "", employerName: "", napsaNumber: "", password: "", confirmPassword: "", agreeToTerms: false },
  });
  const agree = watch("agreeToTerms");

  function validateStep(i: number) {
    clearErrors();
    const values = getValues();
    const picked = Object.fromEntries(FIELDS[i].map((k) => [k, values[k]]));
    const r = schemas[i].safeParse(picked);
    if (r.success) return true;
    r.error.errors.forEach((er) => setError(er.path[0] as keyof Form, { message: er.message }));
    return false;
  }

  async function next() {
    setServerError(null);
    if (!validateStep(step)) return;
    if (step < 2) return setStep(step + 1);
    const v = getValues();
    setSubmitting(true);
    try {
      await api("/api/auth/register", {
        auth: false,
        body: {
          firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim(), phone: v.phone.trim(),
          nrcNumber: v.nrcNumber.trim(), employerName: v.employerName.trim(), napsaNumber: v.napsaNumber.trim(),
          monthlySalary: v.monthlySalary, password: v.password,
        },
      });
      await signIn(v.email.trim(), v.password);
    } catch (e) {
      setServerError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen keyboard edgeTop={false} header={<TopBar title="Create account" onBack={() => (step > 0 ? setStep(step - 1) : router.back())} />}>
      <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.xl }}>
        {STEPS.map((s, i) => (
          <View key={s} style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i <= step ? colors.mint : colors.border }} />
            <AppText variant="small" color={i === step ? colors.navy : colors.textFaint}>{`${i + 1}. ${s}`}</AppText>
          </View>
        ))}
      </View>

      <Animated.View key={step} entering={FadeInRight.duration(250)} style={{ gap: space.lg }}>
        {step === 0 && (
          <>
            <AppText variant="h2">Tell us about you</AppText>
            <FormInput control={control} name="firstName" label="First name" icon={User} autoComplete="given-name" placeholder="Bwalya" />
            <FormInput control={control} name="lastName" label="Last name" icon={User} autoComplete="family-name" placeholder="Mwansa" />
            <FormInput control={control} name="email" label="Email" icon={Mail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
            <FormInput control={control} name="phone" label="Phone number" icon={Phone} keyboardType="phone-pad" autoComplete="tel" placeholder="0971234567" />
            <FormInput control={control} name="nrcNumber" label="NRC number" icon={IdCard} autoCapitalize="characters" placeholder="123456/78/1" />
          </>
        )}
        {step === 1 && (
          <>
            <AppText variant="h2">Your employment</AppText>
            <AppText variant="caption" color={colors.textMuted}>WePay loans are salary-backed. Your limit is based on the salary you declare, and your employment details will be verified.</AppText>
            <FormInput control={control} name="employerName" label="Employer" icon={Briefcase} placeholder="Company name" />
            <FormInput control={control} name="napsaNumber" label="NAPSA number" icon={Hash} autoCapitalize="characters" placeholder="NAPSA membership number" />
            <FormInput
              control={control}
              name="monthlySalary"
              label="Net monthly salary (ZMW)"
              icon={Wallet}
              keyboardType="decimal-pad"
              placeholder="e.g. 8500"
              parse={(t) => (t.trim() === "" ? undefined : Number(t.replace(/[^0-9.]/g, "")))}
              format={(v) => (v === undefined || v === null || Number.isNaN(v) ? "" : String(v))}
            />
          </>
        )}
        {step === 2 && (
          <>
            <AppText variant="h2">Secure your account</AppText>
            <FormInput control={control} name="password" label="Password" icon={Lock} secure autoComplete="new-password" hint="At least 8 characters, one uppercase letter and one number" />
            <FormInput control={control} name="confirmPassword" label="Confirm password" icon={Lock} secure autoComplete="new-password" />
            <Pressable
              onPress={() => setValue("agreeToTerms", !agree, { shouldValidate: false })}
              style={{ flexDirection: "row", gap: space.md, alignItems: "center", minHeight: 48 }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agree }}
            >
              <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: agree ? colors.mint : colors.border, backgroundColor: agree ? colors.mint : colors.white, alignItems: "center", justifyContent: "center" }}>
                {agree ? <Check size={16} color={colors.navy} strokeWidth={3} /> : null}
              </View>
              <AppText variant="caption" style={{ flex: 1 }}>I agree to WePay's terms and conditions and privacy policy.</AppText>
            </Pressable>
            <ErrorText control={control} />
          </>
        )}
      </Animated.View>

      {serverError ? <AppText variant="caption" color={colors.danger} style={{ marginTop: space.lg }} accessibilityRole="alert">{serverError}</AppText> : null}
      <Button title={step < 2 ? "Continue" : "Create account"} icon={step === 2 ? CreditCard : undefined} onPress={next} loading={submitting} style={{ marginTop: space.xxl }} />
    </Screen>
  );
}

function ErrorText({ control }: { control: Control<Form> }) {
  const { errors } = useFormState({ control, name: "agreeToTerms" });
  return errors.agreeToTerms?.message ? (
    <View style={{ backgroundColor: colors.dangerSoft, padding: space.sm, borderRadius: radius.sm }}>
      <AppText variant="small" color={colors.danger}>{errors.agreeToTerms.message}</AppText>
    </View>
  ) : null;
}
