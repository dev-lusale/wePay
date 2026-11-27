import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter stored in Postgres so it works across serverless
 * instances (Vercel). One atomic upsert per check.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "windowStart")
    VALUES (${key}, 1, (NOW() AT TIME ZONE 'UTC'))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."windowStart" < (NOW() AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}::double precision)
        THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
      "windowStart" = CASE
        WHEN "rate_limit_buckets"."windowStart" < (NOW() AT TIME ZONE 'UTC') - make_interval(secs => ${windowSeconds}::double precision)
        THEN (NOW() AT TIME ZONE 'UTC') ELSE "rate_limit_buckets"."windowStart" END
    RETURNING "count", "windowStart"`;

  // Opportunistic cleanup of stale buckets (~1% of calls).
  if (Math.random() < 0.01) {
    prisma.$executeRaw`DELETE FROM "rate_limit_buckets" WHERE "windowStart" < (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'`.catch(
      () => undefined
    );
  }

  const count = Number(rows[0]?.count ?? 0);
  const allowed = count <= limit;
  return { allowed, remaining: Math.max(0, limit - count), retryAfter: windowSeconds };
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { message: "Too many attempts. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
