import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

/** Wire React Query to Android connectivity and app foreground events. */
export function setupNetworkManagers() {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false))
  );
  const sub = AppState.addEventListener("change", (s: AppStateStatus) => focusManager.setFocused(s === "active"));
  return () => sub.remove();
}

export function useIsOnline() {
  const [online, setOnline] = useState(onlineManager.isOnline());
  useEffect(() => onlineManager.subscribe(setOnline), []);
  return online;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      // Don't retry client errors (401/403/404/400); retry network & 5xx twice.
      retry: (count, err) => {
        if (err instanceof ApiError && err.status < 500) return false;
        return count < 2;
      },
      networkMode: "online",
    },
    mutations: { networkMode: "online", retry: false },
  },
});
