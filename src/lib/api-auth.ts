import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/mobile-auth";

export interface AuthedUser {
  id: string;
  role: string;
  via: "mobile" | "web";
  sessionId?: string;
}

/**
 * Resolves the caller for an API route.
 *  - `Authorization: Bearer <token>` → mobile access token (no cookie fallback if it's invalid)
 *  - otherwise → existing NextAuth cookie session (web app, unchanged behaviour)
 *
 * Every data query must then filter by the returned `id`.
 */
export async function getRequestUser(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization");
  if (header) {
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return null;
    const principal = await verifyAccessToken(match[1].trim());
    return principal
      ? { id: principal.userId, role: principal.role, via: "mobile", sessionId: principal.sessionId }
      : null;
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role, via: "web" };
}

export function unauthorized() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function notFound(what = "Not found") {
  return NextResponse.json({ message: what }, { status: 404 });
}
