import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, Image, StyleSheet, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fingerprint } from "lucide-react-native";
import { secureStorage } from "./secure-storage";
import { AppText, Button } from "@/components/ui";
import { colors, space } from "./theme";

/**
 * Optional biometric lock (fingerprint / face / device PIN fallback).
 * Device-level protection on top of the server session: when enabled, the app
 * asks for biometrics on launch and after it has been in the background for
 * more than LOCK_AFTER_MS. The setting is stored per device.
 */
const KEY = "wepay.biometricLock";
const LOCK_AFTER_MS = 30_000;

interface AppLockValue {
  supported: boolean;
  enabled: boolean;
  setEnabled(on: boolean): Promise<{ ok: boolean; message?: string }>;
}

const Ctx = createContext<AppLockValue>({ supported: false, enabled: false, setEnabled: async () => ({ ok: false }) });

async function authenticate(prompt: string) {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: "Cancel",
    disableDeviceFallback: false, // allow device PIN/pattern if biometrics fail
  });
  return r.success;
}

export function AppLockProvider({ children, onSignOut }: { children: React.ReactNode; onSignOut: () => void }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = hw && (await LocalAuthentication.isEnrolledAsync());
        setSupported(Boolean(enrolled));
        const on = (await secureStorage.get(KEY)) === "1" && Boolean(enrolled);
        setEnabledState(on);
        setLocked(on);
        if (on && (await authenticate("Unlock WePay"))) setLocked(false);
      } catch {
        setSupported(false);
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background") backgroundAt.current = Date.now();
      if (s === "active" && enabled && backgroundAt.current && Date.now() - backgroundAt.current > LOCK_AFTER_MS) {
        setLocked(true);
        authenticate("Unlock WePay").then((ok) => ok && setLocked(false));
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const setEnabled = useCallback(async (on: boolean) => {
    if (on) {
      if (!supported) return { ok: false, message: "Set up a fingerprint or face unlock in your phone settings first." };
      if (!(await authenticate("Confirm to turn on app lock"))) return { ok: false, message: "Not confirmed" };
      await secureStorage.set(KEY, "1");
    } else {
      await secureStorage.remove(KEY);
    }
    setEnabledState(on);
    return { ok: true };
  }, [supported]);

  const unlock = useCallback(async () => {
    if (await authenticate("Unlock WePay")) setLocked(false);
  }, []);

  return (
    <Ctx.Provider value={{ supported, enabled, setEnabled }}>
      {children}
      {locked ? <LockScreen onUnlock={unlock} onSignOut={onSignOut} /> : null}
    </Ctx.Provider>
  );
}

export const useAppLock = () => useContext(Ctx);

function LockScreen({ onUnlock, onSignOut }: { onUnlock: () => void; onSignOut: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[StyleSheet.absoluteFill, styles.lock, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + space.xxl }]} accessibilityViewIsModal>
      <Image source={require("../../assets/logo-mark.png")} style={{ width: 72, height: 72 }} />
      <AppText variant="h1" color={colors.white} style={{ marginTop: space.lg }}>WePay is locked</AppText>
      <AppText color={colors.onDarkMuted} style={{ textAlign: "center" }}>Use your fingerprint, face or phone PIN to continue.</AppText>
      <View style={{ flex: 1 }} />
      <Button title="Unlock" icon={Fingerprint} onPress={onUnlock} style={{ alignSelf: "stretch" }} />
      <Button title="Sign out instead" variant="onDark" onPress={onSignOut} style={{ alignSelf: "stretch", marginTop: space.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  lock: { backgroundColor: colors.navy, alignItems: "center", paddingHorizontal: space.xxl, gap: space.sm, zIndex: 100 },
});
