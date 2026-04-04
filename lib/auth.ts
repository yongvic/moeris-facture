import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit } from "./rate-limit";
import { createAuditLog } from "./audit";

function getHeader(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | undefined,
  key: string
) {
  if (!headers) return undefined;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(key) ?? undefined;
  }
  const normalizedKey = key.toLowerCase();
  const value = (headers as Record<string, string | string[] | undefined>)[normalizedKey];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        const forwarded = getHeader(req?.headers, "x-forwarded-for")
          ?.split(",")[0]
          ?.trim();
        const realIp = getHeader(req?.headers, "x-real-ip");
        const ip = forwarded ?? realIp ?? "unknown";

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const key = `login:${ip}:${email}`;
        const limit = rateLimit(key, { max: 10, windowMs: 10 * 60 * 1000 });

        if (!limit.allowed) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            return null;
          }

          if (!user.actif) {
            return null;
          }

          const valid = await bcrypt.compare(password, user.password);

          if (!valid) {
            return null;
          }
          await createAuditLog({
            actorId: user.id,
            action: "AUTH_LOGIN_SUCCESS",
            entityType: "User",
            entityId: user.id,
            details: { ip },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH_ERROR]", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};
