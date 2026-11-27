import { secureStorage } from "./secure-storage";
import { API_URL } from "./config";
import type { TokenResponse } from "./types";

/**
 * HTTP client for the WePay backend.
 *  - Access token lives only in memory.
 *  - Refresh token lives in the Android Keystore-backed SecureStore.
 *  - A 401 triggers one (shared) refresh attempt, then the request is retried once.
 *  - If refresh fails, listeners are told the session ended.
 */

const REFRESH_KEY = "wepay.refreshToken";
const TIMEOUT_MS = 30_000; // slow mobile networks + serverless cold starts

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
const sessionEndedListeners = new Set<() => void>();

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}
export class NetworkError extends Error {
  constructor(public detail?: string) {
    super("We couldn't reach WePay. Check your mobile data or Wi-Fi and try again.");
  }
}

export const isNetworkError = (e: unknown) => e instanceof NetworkError;

export function onSessionEnded(fn: () => void) {
  sessionEndedListeners.add(fn);
  return () => sessionEndedListeners.delete(fn);
}

export async function saveTokens(t: Pick<TokenResponse, "accessToken" | "refreshToken">) {
  accessToken = t.accessToken;
  await secureStorage.set(REFRESH_KEY, t.refreshToken);
}

export async function getStoredRefreshToken() {
  return secureStorage.get(REFRESH_KEY);
}

export async function clearTokens() {
  accessToken = null;
  await secureStorage.remove(REFRESH_KEY);
}

export function hasAccessToken() {
  return accessToken !== null;
}

async function rawFetch(path: string, init: RequestInit & { auth?: boolean } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (init.auth !== false && accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const attempt = () => fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
  try {
    try {
      return await attempt();
    } catch (first) {
      // One quick retry: mobile radios often drop the first request after waking up.
      if (controller.signal.aborted) throw first;
      await new Promise((r) => setTimeout(r, 800));
      return await attempt();
    }
  } catch (e) {
    const aborted = controller.signal.aborted;
    throw new NetworkError(aborted ? "timeout" : e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Exchanges the stored refresh token for new tokens. Concurrent callers share
 * one request, because the server rotates the token and a second use of the
 * old one would be treated as theft.
 * Returns false when the session is over; throws NetworkError when offline.
 */
export function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const rt = await getStoredRefreshToken();
    if (!rt) return false;
    const res = await rawFetch("/api/mobile/auth/refresh", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (res.ok) {
      await saveTokens((await res.json()) as TokenResponse);
      return true;
    }
    if (res.status === 401) {
      await clearTokens();
      return false;
    }
    throw new ApiError(res.status, "Couldn't restore your session. Please try again.");
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg =
      (body as { message?: string } | null)?.message ??
      (res.status >= 500 ? "Something went wrong on our side. Please try again." : "Request failed");
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
}

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const req = {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    auth: init.auth,
  };
  if (init.auth !== false && !accessToken && (await getStoredRefreshToken())) {
    await refreshSession();
  }
  let res = await rawFetch(path, req);
  if (res.status === 401 && init.auth !== false) {
    const ok = await refreshSession();
    if (!ok) {
      sessionEndedListeners.forEach((fn) => fn());
      throw new ApiError(401, "Your session has ended. Please sign in again.");
    }
    res = await rawFetch(path, req);
  }
  return parse<T>(res);
}

export function errorMessage(e: unknown): string {
  // The detail helps support diagnose carrier/DNS/TLS problems from a screenshot.
  if (e instanceof NetworkError) return e.detail ? `${e.message} (${e.detail})` : e.message;
  if (e instanceof ApiError) return e.message;
  return "Something went wrong. Please try again.";
}
