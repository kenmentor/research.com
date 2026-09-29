import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { z } from "zod";
import { syncUserByEmail } from "./lib/auth-user";

const providers: Provider[] = [];

// Google OAuth — active once GOOGLE_CLIENT_ID/SECRET are set (Phase 3).
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google);
}

// Email magic link via Resend — active once RESEND_API_KEY is set.
if (process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      from: process.env.EMAIL_FROM ?? "Researcher <onboarding@resend.dev>",
    }),
  );
}

// Dev-only convenience: sign in with any email, no password.
// NEVER enabled in production (see condition below).
if (process.env.NODE_ENV !== "production") {
  providers.push(
    Credentials({
      name: "Dev login",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      authorize: async (raw) => {
        const parsed = z
          .object({ email: z.string().email(), name: z.string().optional() })
          .safeParse(raw);
        if (!parsed.success) return null;
        const dbUser = await syncUserByEmail(parsed.data.email, parsed.data.name);
        return {
          id: String(dbUser._id),
          email: dbUser.email,
          name: dbUser.name ?? parsed.data.name,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required for non-localhost hosts (staging/preview) behind proxies.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      // Credentials already synced in authorize() — just carry the id.
      if (user?.id && !token.uid) {
        token.uid = String(user.id);
        return token;
      }
      // OAuth / magic-link first login: sync exactly once.
      if (user?.email && !token.uid) {
        const dbUser = await syncUserByEmail(
          user.email,
          user.name ?? undefined,
          user.image ?? undefined,
        );
        token.uid = String(dbUser._id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) session.user.id = token.uid;
      return session;
    },
  },
});
