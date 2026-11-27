import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const q = z.object({
  q: z.string().trim().max(100).optional(),
  type: z.enum(["DISBURSEMENT", "REPAYMENT", "FEE"]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  before: z.coerce.date().optional(), // cursor: createdAt of the last item already shown
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Transaction history for the caller only. With no query params this behaves
 * exactly as before (latest 50), so the web dashboard is unaffected.
 */
export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return unauthorized();

  const parsed = q.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ message: "Invalid filters" }, { status: 400 });
  const f = parsed.data;

  const createdAt: Prisma.DateTimeFilter = {};
  if (f.from) createdAt.gte = f.from;
  if (f.to) createdAt.lte = f.to;
  if (f.before) createdAt.lt = f.before;

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...(f.type ? { type: f.type } : {}),
      ...(f.q ? { description: { contains: f.q, mode: "insensitive" } } : {}),
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: f.limit ?? 50,
  });

  return NextResponse.json(transactions);
}
