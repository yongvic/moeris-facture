/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const args = process.argv.slice(2);
const email =
  args[0] || process.env.TEST_EMAIL || process.env.ADMIN_EMAIL || "";
const password =
  args[1] || process.env.TEST_PASSWORD || process.env.ADMIN_PASSWORD || "";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL manquant dans l'environnement.");
  process.exit(1);
}

if (!email || !password) {
  console.error(
    "❌ Email/Mot de passe manquant. Usage: node test-db-auth.js <email> <password>"
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["error"],
});

function isNetworkBlockedError(error) {
  return (
    error &&
    error.code === "EACCES" &&
    (typeof error.message !== "string" || error.message.length > 0)
  );
}

function printAuthTestError(error) {
  if (isNetworkBlockedError(error)) {
    console.error(
      "💥 Prisma remonte EACCES pendant l'accès à DATABASE_URL."
    );
    console.error(
      "   Dans ce contexte, ce n'est pas un échec de mot de passe mais un blocage réseau/permissions."
    );
    console.error(
      "   Vérifie l'accès TCP/SSL au host de la base depuis ce terminal."
    );
    return;
  }

  console.error("💥 Erreur technique:", error);
}

async function test() {
  console.log("--- TEST DE CONNEXION DIRECT ---");
  console.log("Email testé:", email);
  console.log("Mot de passe testé: [masqué]");

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ Erreur: Utilisateur introuvable dans la base de données.");
      return;
    }

    console.log("✅ Utilisateur trouvé !");
    console.log("Statut actif:", user.actif);
    console.log("Role:", user.role);
    console.log("Hash en base (préfixe):", user.password?.slice(0, 12) + "...");

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      console.log("✨ SUCCÈS: Le mot de passe correspond au hash !");
    } else {
      console.log("❌ ÉCHEC: Le mot de passe ne correspond PAS au hash.");
      const newHash = await bcrypt.hash(password, 12);
      console.log("Exemple de nouveau hash (préfixe):", newHash.slice(0, 12) + "...");
    }
  } catch (error) {
    printAuthTestError(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
