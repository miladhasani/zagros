import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { normalizeIranianMobile } from "@/lib/phone";
import { displayName } from "@/lib/user";

const credentialsSchema = z.object({
  phone: z
    .string()
    .transform((value) => normalizeIranianMobile(value) ?? "")
    .pipe(z.string().regex(/^09\d{9}$/)),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        phone: { label: "phone", type: "text" },
        password: { label: "password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ phone: parsed.data.phone }, { phones: { has: parsed.data.phone } }],
          },
        });
        if (!user || !user.isActive) return null;

        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: displayName(user),
          phone: user.phone,
          mustSetPassword: user.mustSetPassword,
          isSuperAdmin: user.isSuperAdmin,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.phone = user.phone;
        token.mustSetPassword = user.mustSetPassword;
        token.isSuperAdmin = user.isSuperAdmin;
        token.isAdmin = user.isAdmin;
        token.name = user.name;
      }
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: {
            mustSetPassword: true,
            isSuperAdmin: true,
            isAdmin: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
          },
        });
        if (fresh?.isActive) {
          token.mustSetPassword = fresh.mustSetPassword;
          token.isSuperAdmin = fresh.isSuperAdmin;
          token.isAdmin = fresh.isAdmin;
          token.name = displayName(fresh);
          token.phone = fresh.phone;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.id);
      session.user.phone = String(token.phone ?? "");
      session.user.mustSetPassword = Boolean(token.mustSetPassword);
      session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      session.user.isAdmin = Boolean(token.isAdmin);
      session.user.name = token.name ?? session.user.name;
      return session;
    },
  },
});
