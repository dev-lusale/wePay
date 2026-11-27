import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const cardSelect = {
  id: true,
  network: true,
  status: true,
  frozen: true,
  last4: true,
  expiryMonth: true,
  expiryYear: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** The caller's virtual card (or null). Never returns full PAN/CVV — WePay doesn't hold them. */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const card = await prisma.virtualCard.findUnique({ where: { userId: user.id }, select: cardSelect });
  return NextResponse.json({
    card: card && card.status !== "CANCELLED" ? card : null,
    issuerConnected: false, // flips to true once a licensed card issuer is integrated
  });
}

const requestSchema = z.object({ network: z.enum(["VISA", "MASTERCARD"]).default("VISA") });

/** Request a virtual card. Creates a REQUESTED record; issuance happens with the card partner. */
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const parsed = requestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ message: "Choose VISA or Mastercard" }, { status: 400 });

  const existing = await prisma.virtualCard.findUnique({ where: { userId: user.id } });
  if (existing && existing.status !== "CANCELLED") {
    return NextResponse.json({ message: "You already have a card request or card" }, { status: 400 });
  }
  const data = { network: parsed.data.network, status: "REQUESTED" as const, frozen: false, last4: null, expiryMonth: null, expiryYear: null };
  const card = existing
    ? await prisma.virtualCard.update({ where: { id: existing.id }, data, select: cardSelect })
    : await prisma.virtualCard.create({ data: { ...data, userId: user.id }, select: cardSelect });
  await audit("CARD_REQUESTED", { userId: user.id, req, metadata: { cardId: card.id, network: card.network } });
  return NextResponse.json({ card }, { status: 201 });
}
