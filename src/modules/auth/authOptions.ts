import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { APP_CONFIG } from "@/src/config";
import type { UserRole } from "./rbac";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(APP_CONFIG.auth.googleClientId && APP_CONFIG.auth.googleClientSecret
      ? [
          GoogleProvider({
            clientId: APP_CONFIG.auth.googleClientId,
            clientSecret: APP_CONFIG.auth.googleClientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Campus Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        const email = credentials.email.toLowerCase();
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            return null;
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const allowedDomain = APP_CONFIG.auth.allowedEmailDomain;
        if (allowedDomain && allowedDomain !== "*") {
          const emailDomain = user.email.split("@")[1];
          if (emailDomain !== allowedDomain && !user.email.endsWith(`.${allowedDomain}`)) {
            return false;
          }
        }

        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split("@")[0],
                avatar: user.image,
                role: "STUDENT",
              },
            });
          }
        } catch {
          // If DB operation fails during OAuth callback
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role || "STUDENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: UserRole }).id = token.id as string;
        (session.user as { id?: string; role?: UserRole }).role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: APP_CONFIG.auth.nextAuthSecret,
};
