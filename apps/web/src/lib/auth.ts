import NextAuth from "next-auth";
import type { NextAuthResult, Session } from "next-auth";
import GitHub from "next-auth/providers/github";

const PUBLIC_PATH_PREFIXES = [
  "/api/auth", // Auth.js endpoints must remain public
  "/favicon.ico",
];

const PUBLIC_PATHS: string[] = [
  // Add specific public routes here later (e.g. "/pricing", "/about")
];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (PUBLIC_PATHS.includes(pathname)) {
        return true;
      }

      if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
      }

      return !!auth;
    },
  },
}) as unknown as {
  handlers: NextAuthResult["handlers"];
  signIn: (provider?: string, options?: Record<string, unknown>) => Promise<void>;
  signOut: (options?: Record<string, unknown>) => Promise<void>;
  auth: () => Promise<Session | null>;
};
