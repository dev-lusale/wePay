export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return (req.headers.get("x-real-ip") ?? "unknown").slice(0, 64);
}

export function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent")?.slice(0, 255) ?? null;
}
