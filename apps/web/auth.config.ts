import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  basePath: "/api/auth",
  pages: {
    signIn: "/landing",
  },
  providers: [], // Providers are added in auth.ts to avoid Edge Runtime issues with Prisma
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.firm = (user as { firm?: string }).firm;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { firm?: string }).firm = token.firm as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
