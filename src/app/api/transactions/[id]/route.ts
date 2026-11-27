import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, notFound, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const tx = await prisma.transaction.findFirst({ where: { id: params.id, userId: user.id } });
  if (!tx) return notFound("Transaction not found");
  return NextResponse.json({ ...tx, amount: Number(tx.amount) });
}
