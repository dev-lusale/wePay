// Test stub: the API tests run route handlers outside a Next.js request, where
// NextAuth's cookie lookup can't run. With no Authorization header, the
// handlers therefore see "no web session" — i.e. an anonymous caller.
export async function getServerSession() {
  return null;
}
export default function NextAuth() {
  throw new Error("NextAuth handler is not used in API tests");
}
export type NextAuthOptions = Record<string, unknown>;
