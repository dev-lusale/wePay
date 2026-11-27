/** Prisma Decimal fields arrive as strings; normalise everything to number. */
export const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
};

function group(intPart: string) {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Zambian Kwacha, e.g. K12,500.00 (same convention as the web app's en-ZM formatting). */
export function formatZMW(value: unknown, opts: { decimals?: number; sign?: boolean } = {}): string {
  const n = num(value);
  const decimals = opts.decimals ?? 2;
  const [i, d] = Math.abs(n).toFixed(decimals).split(".");
  const body = `K${group(i)}${decimals ? "." + d : ""}`;
  if (n < 0) return `-${body}`;
  return opts.sign && n > 0 ? `+${body}` : body;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)}, ${hh}:${mm}`;
}

export function monthLabel(yyyyMm: string): string {
  const m = parseInt(yyyyMm.slice(5, 7), 10);
  return MONTHS[m - 1] ?? yyyyMm;
}

export function initials(first?: string, last?: string) {
  return `${(first ?? "").charAt(0)}${(last ?? "").charAt(0)}`.toUpperCase() || "W";
}

/** Shows only the last 4 characters of identifiers like NRC / NAPSA numbers. */
export function mask(value?: string | null, visible = 4) {
  if (!value) return "—";
  if (value.length <= visible) return value;
  return "•".repeat(Math.min(6, value.length - visible)) + value.slice(-visible);
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function daysUntil(v: string | Date): number {
  const ms = new Date(v).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}
