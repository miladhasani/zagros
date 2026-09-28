import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.phone = String(token.phone ?? "");
        session.user.mustSetPassword = Boolean(token.mustSetPassword);
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
