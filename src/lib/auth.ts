// Marqai — NextAuth configuration (Credentials provider, JWT sessions)
// ------------------------------------------------------------------
// In production this wires up to the Prisma User/SuperAdmin tables with
// bcrypt-hashed passwords. In the demo build (no DATABASE_URL or
// NEXTAUTH_SECRET) the auth screen still works via the in-memory
// resolveDemoLogin() fallback.
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db as prisma } from "@/lib/db";
import { resolveDemoLogin } from "@/lib/marqai/saas-seed";
import { getPlan } from "@/lib/marqai/saas";
import type { AuthPrincipal } from "@/lib/marqai/types";

const secret = process.env.NEXTAUTH_SECRET;

export function isNextAuthConfigured(): boolean {
  return !!secret && !!process.env.DATABASE_URL && !process.env.DATABASE_URL?.startsWith("file:");
}

export const authOptions: NextAuthOptions = {
  // JWT-based sessions so we don't need a session table.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 /* 7 days */ },
  secret: secret ?? "marqai-dev-insecure-secret-do-not-use-in-production",
  providers: [
    CredentialsProvider({
      name: "Marqai",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        // 1) Demo fallback (always available)
        const demoPrincipal = resolveDemoLogin(email, password);
        if (demoPrincipal) {
          return {
            id: demoPrincipal.userId,
            name: demoPrincipal.name,
            email: demoPrincipal.email,
            // Stash the whole principal in a custom claim.
            principal: demoPrincipal,
          } as any;
        }

        // 2) Production: check DB
        if (!isNextAuthConfigured()) return null;

        try {
          // Super admin?
          const sa = await prisma.superAdmin.findUnique({ where: { email } });
          if (sa && sa.passwordHash && bcrypt.compareSync(password, sa.passwordHash)) {
            const principal: AuthPrincipal = {
              kind: "super_admin",
              userId: sa.id,
              email: sa.email,
              name: sa.name,
            };
            return { id: sa.id, name: sa.name, email: sa.email, principal } as any;
          }

          // Org user
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              organization: { include: { subscription: true } },
              role: true,
            },
          });
          if (!user || !user.passwordHash) return null;
          if (!bcrypt.compareSync(password, user.passwordHash)) return null;

          const sub = user.organization?.subscription;
          const planSlug = (sub?.planId ?? "starter") as any;
          const plan = getPlan(planSlug);

          const principal: AuthPrincipal = {
            kind: "org_user",
            userId: user.id,
            email: user.email,
            name: user.name ?? user.email,
            organizationId: user.organizationId ?? undefined,
            organizationName: user.organization?.name,
            organizationSlug: user.organization?.slug,
            roleId: user.roleId ?? undefined,
            roleName: user.role?.name,
            roleColor: user.role?.color,
            permissions: user.role?.permissions ? JSON.parse(user.role.permissions) : {},
            planSlug,
            planName: plan.name,
            trialEndsAt: sub?.trialEndsAt?.toISOString(),
          };

          // Update lastLoginAt (fire-and-forget)
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {});

          return { id: user.id, name: user.name ?? user.email, email: user.email, principal } as any;
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in: persist principal into the JWT.
        const p = (user as any).principal as AuthPrincipal | undefined;
        if (p) {
          token.principal = p;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose principal on session.user
      if (token.principal) {
        (session as any).principal = token.principal as AuthPrincipal;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
