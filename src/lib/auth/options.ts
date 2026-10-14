import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { APP_CONFIG } from "@/src/config";
import { validateEmailDomain, determineInitialRole } from "./domain-guard";
import type { UserRole } from "@/src/modules/auth/rbac";
import { verifyPassword } from "./password";

const isProductionHttps =
  process.env.NODE_ENV === "production" &&
  Boolean(process.env.NEXTAUTH_URL?.startsWith("https://")) &&
  !process.env.NEXTAUTH_URL?.includes("localhost");

export const authOptions: NextAuthOptions = {
  useSecureCookies: isProductionHttps,
  providers: [
    ...(APP_CONFIG.auth.googleClientId && APP_CONFIG.auth.googleClientSecret
      ? [
          GoogleProvider({
            clientId: APP_CONFIG.auth.googleClientId,
            clientSecret: APP_CONFIG.auth.googleClientSecret,
            authorization: {
              params: {
                prompt: "select_account",
                ...(APP_CONFIG.auth.allowedEmailDomain && APP_CONFIG.auth.allowedEmailDomain !== "*"
                  ? { hd: APP_CONFIG.auth.allowedEmailDomain }
                  : {}),
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "Campus Credentials / E2E Mock",
      credentials: {
        email: { label: "Campus Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.toLowerCase().trim();

        // 1. Validate email domain
        if (!validateEmailDomain(email)) {
          return null;
        }

        try {
          let user = await prisma.user.findUnique({ where: { email } });

          // Support for E2E / Test auto-provisioning
          if (!user && (process.env.E2E_AUTH === "true" || process.env.NODE_ENV === "test")) {
            const initialRole = determineInitialRole(email);
            user = await prisma.user.create({
              data: {
                email,
                name: email.split("@")[0].replace(".", " ").toUpperCase(),
                role: initialRole,
              },
            });
          }

          if (!user) return null;

          // Reject deactivated accounts
          const activeStatus = (user as unknown as { isActive?: boolean }).isActive;
          if (activeStatus === false) {
            throw new Error("ACCOUNT_DEACTIVATED");
          }

          // If user has a passwordHash set, verify password
          if (user.passwordHash) {
            if (!credentials.password || !verifyPassword(credentials.password, user.passwordHash)) {
              throw new Error("INVALID_PASSWORD");
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: Boolean(activeStatus ?? true),
          };
        } catch (err: unknown) {
          if (err instanceof Error && err.message === "ACCOUNT_DEACTIVATED") {
            throw err;
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      const email = user.email.toLowerCase().trim();

      // 1. Strict Server-Side College Domain Enforcement
      if (!validateEmailDomain(email)) {
        console.warn(`[Auth] Sign-in rejected: domain mismatch for ${email}`);
        return false;
      }

      // 2. Reject unverified OAuth emails if metadata is supplied
      if (profile && typeof profile === "object" && "email_verified" in profile) {
        if ((profile as { email_verified?: boolean }).email_verified === false) {
          console.warn(`[Auth] Sign-in rejected: unverified email ${email}`);
          return false;
        }
      }

      try {
        let existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Check if deactivated
          const activeStatus = (existingUser as unknown as { isActive?: boolean }).isActive;
          if (activeStatus === false) {
            console.warn(`[Auth] Sign-in rejected: deactivated account ${email}`);
            return false;
          }
          const updateData: { name?: string; avatar?: string } = {};
          if (user.name && (existingUser.name === "Campus User" || !existingUser.name || existingUser.name.trim() === "")) {
            updateData.name = user.name;
          }
          if (user.image && !existingUser.avatar) {
            updateData.avatar = user.image;
          }
          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: updateData,
            });
          }
        } else {
          // 3. First-login bootstrap rule
          const initialRole = determineInitialRole(email);
          const cleanName =
            user.name ||
            email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          existingUser = await prisma.user.create({
            data: {
              email,
              name: cleanName,
              avatar: user.image,
              role: initialRole,
              department: "General",
            },
          });
          console.log(`[Auth] First-login created user ${email} with role ${initialRole}`);
        }
      } catch (dbErr) {
        console.error("[Auth] Database error during signIn callback:", dbErr);
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role || "STUDENT";
        token.isActive = (user as { isActive?: boolean }).isActive !== false;
        if (user.name) token.name = user.name;
        if (user.image) token.picture = user.image;
      }

      // Re-fetch role & active status from database to prevent stale token lag
      if (token.email) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true, department: true, name: true, avatar: true },
          });

          if (freshUser) {
            token.id = freshUser.id;
            token.role = freshUser.role as UserRole;
            token.department = freshUser.department;
            if (freshUser.name && freshUser.name !== "Campus User") {
              token.name = freshUser.name;
            }
            if (freshUser.avatar) {
              token.picture = freshUser.avatar;
            }
          }
        } catch {
          // Fallback to existing token values if DB query is temporarily unreachable
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as UserRole) || "STUDENT";
        session.user.isActive = token.isActive !== false;
        session.user.department = (token.department as string | null) || null;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: APP_CONFIG.auth.nextAuthSecret || "m1-auth-default-secret-string-replace-in-production",
};
