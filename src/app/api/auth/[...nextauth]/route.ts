import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Tell Next.js this route is always dynamic — never statically analysed at build time
export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
