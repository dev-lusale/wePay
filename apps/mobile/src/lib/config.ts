const raw = (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

/** Backend base URL, inlined at build time from EXPO_PUBLIC_API_URL (see eas.json). */
export const API_URL = raw;

export const SUPPORT_EMAIL = (process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "").trim();

/**
 * Release builds must talk to the backend over HTTPS. A misconfigured build
 * shows a configuration error instead of silently sending credentials in clear text.
 */
export function configProblem(): string | null {
  if (!raw) return "EXPO_PUBLIC_API_URL is not set for this build.";
  if (raw.includes("REPLACE-WITH")) return "EXPO_PUBLIC_API_URL still has the placeholder value in eas.json.";
  const localTesting = /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?$/.test(raw);
  if (!__DEV__ && !raw.startsWith("https://") && !localTesting) return "Release builds require an https:// API URL.";
  return null;
}
