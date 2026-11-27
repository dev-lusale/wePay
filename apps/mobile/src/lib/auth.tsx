import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as Device from "expo-device";
import { useQueryClient } from "@tanstack/react-query";
import {
  api,
  clearTokens,
  getStoredRefreshToken,
  isNetworkError,
  onSessionEnded,
  refreshSession,
  saveTokens,
} from "./api";
import type { LoginResponse } from "./types";

type Status = "loading" | "signedOut" | "signedIn";

interface AuthContextValue {
  status: Status;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const queryClient = useQueryClient();

  // Restore the session on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rt = await getStoredRefreshToken();
        if (!rt) return !cancelled && setStatus("signedOut");
        const ok = await refreshSession();
        if (!cancelled) setStatus(ok ? "signedIn" : "signedOut");
      } catch (e) {
        // Offline at launch with a stored session: let the user in; screens show
        // offline states and refetch automatically when the network returns.
        if (!cancelled) setStatus(isNetworkError(e) ? "signedIn" : "signedOut");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Server says the session is gone (revoked, expired, password reset elsewhere).
  useEffect(() => {
    const unsubscribe = onSessionEnded(() => {
      clearTokens().finally(() => {
        queryClient.clear();
        setStatus("signedOut");
      });
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const deviceName = [Device.manufacturer, Device.modelName].filter(Boolean).join(" ") || "Android device";
      const res = await api<LoginResponse>("/api/mobile/auth/login", {
        body: { email: email.trim(), password, deviceName },
        auth: false,
      });
      queryClient.clear(); // never show a previous account's cached data
      await saveTokens(res);
      setStatus("signedIn");
    },
    [queryClient]
  );

  const signOut = useCallback(async () => {
    const rt = await getStoredRefreshToken();
    if (rt) {
      // Best effort: revoke on the server. Local sign-out happens regardless.
      api("/api/mobile/auth/logout", { body: { refreshToken: rt }, auth: false }).catch(() => undefined);
    }
    await clearTokens();
    queryClient.clear();
    setStatus("signedOut");
  }, [queryClient]);

  const value = useMemo(() => ({ status, signIn, signOut }), [status, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
