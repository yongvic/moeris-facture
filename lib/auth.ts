import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { rateLimit } from "./rate-limit";

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
        const email = credentials?.email ?? "unknown";

        console.log("[AUTH_DEBUG] Tentative de connexion pour:", email, "IP:", ip);

        if (!credentials?.email || !credentials.password) {
          console.log(
            "[AUTH_DEBUG] Email ou mot de passe manquant dans les credentials.",
            "IP:",
            ip
          );
          return null;
        }

        const key = `login:${ip}:${credentials.email}`;
        const limit = rateLimit(key, { max: 10, windowMs: 10 * 60 * 1000 });
        
        if (!limit.allowed) {
          console.log(
            "[AUTH_DEBUG] Rate limit atteint pour cette IP/Email.",
            "IP:",
            ip
          );
          return null;
        }
        
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          
          if (!user) {
            console.log("[AUTH_DEBUG] Utilisateur introuvable en base de données.");
            return null;
          }
          
          console.log("[AUTH_DEBUG] Utilisateur trouvé:", user.email, "Actif:", user.actif);
          
          if (!user.actif) {
            console.log("[AUTH_DEBUG] Compte utilisateur inactif.");
            return null;
          }
          
          const valid = await bcrypt.compare(credentials.password, user.password);
          
          if (!valid) {
            console.log("[AUTH_DEBUG] Mot de passe incorrect.");
            return null;
          }
          
          console.log("[AUTH_DEBUG] Connexion réussie pour:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: `${user.prenom} ${user.nom}`,
            role: user.role,
          };
        } catch (error) {
          console.error("[AUTH_DEBUG] Erreur critique lors de l'auth:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
};
