import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser, notFound, unauthorized } from "@/lib/api-auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({ action: z.enum(["freeze", "unfreeze", "cancel"]) });

/** Freeze/unfreeze or cancel the caller's own card. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  const card = await prisma.virtualCard.findFirst({ where: { id: params.id, userId: user.id } });
  if (!card || card.status === "CANCELLED") return notFound("Card not found");

  const { action } = parsed.data;
  const updated = await prisma.virtualCard.update({
    where: { id: card.id },
    data: action === "cancel" ? { status: "CANCELLED", frozen: true } : { frozen: action === "freeze" },
    select: { id: true, network: true, status: true, frozen: true, last4: true, expiryMonth: true, expiryYear: true, createdAt: true, updatedAt: true },
  });
  await audit(action === "freeze" ? "CARD_FROZEN" : action === "unfreeze" ? "CARD_UNFROZEN" : "CARD_CANCELLED", {
    userId: user.id,
    req,
    metadata: { cardId: card.id },
  });
  return NextResponse.json({ card: action === "cancel" ? null : updated });
}
