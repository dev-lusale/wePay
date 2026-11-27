import React, { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import { AppText } from "./ui";
import { colors, font, radius, space } from "@/lib/theme";

type Props<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  secure?: boolean;
  /** Convert the text before storing in the form (e.g. to number). */
  parse?: (text: string) => unknown;
  format?: (value: unknown) => string;
} & Omit<TextInputProps, "value" | "onChangeText" | "secureTextEntry">;

export function FormInput<T extends FieldValues>({ control, name, label, hint, icon: Icon, secure, parse, format, ...rest }: Props<T>) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={{ gap: 6 }}>
          <AppText variant="label" color={colors.textMuted}>
            {label}
          </AppText>
          <View
            style={[
              styles.box,
              focused && { borderColor: colors.turquoise, backgroundColor: colors.white },
              error && { borderColor: colors.danger },
            ]}
          >
            {Icon ? <Icon size={18} color={colors.textFaint} /> : null}
            <TextInput
              {...rest}
              value={format ? format(value) : value == null ? "" : String(value)}
              onChangeText={(t) => onChange(parse ? parse(t) : t)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                onBlur();
              }}
              secureTextEntry={hidden}
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              accessibilityLabel={label}
              accessibilityHint={error?.message ?? hint}
            />
            {secure ? (
              <Pressable onPress={() => setHidden((h) => !h)} hitSlop={12} accessibilityRole="button" accessibilityLabel={hidden ? "Show password" : "Hide password"}>
                {hidden ? <Eye size={18} color={colors.textMuted} /> : <EyeOff size={18} color={colors.textMuted} />}
              </Pressable>
            ) : null}
          </View>
          {error?.message ? (
            <AppText variant="small" color={colors.danger}>
              {error.message}
            </AppText>
          ) : hint ? (
            <AppText variant="small" color={colors.textFaint}>
              {hint}
            </AppText>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  input: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.text, paddingVertical: 12 },
});
