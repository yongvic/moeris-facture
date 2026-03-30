import bcrypt from "bcryptjs";
import { type PrismaClient, Role } from "@prisma/client";

export type AdminSyncInput = {
  email: string;
  password: string;
  nom?: string;
  prenom?: string;
};

export async function syncAdminUser(
  prisma: PrismaClient,
  input: AdminSyncInput
) {
  const { email, password, nom = "Banenga", prenom = "Admin" } = input;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL et ADMIN_PASSWORD sont requis pour initialiser l'admin."
    );
  }

  const hash = await bcrypt.hash(password, 12);

  return prisma.user.upsert({
    where: { email },
    update: {
      password: hash,
      nom,
      prenom,
      role: Role.ADMIN,
      actif: true,
    },
    create: {
      email,
      password: hash,
      nom,
      prenom,
      role: Role.ADMIN,
      actif: true,
    },
  });
}
