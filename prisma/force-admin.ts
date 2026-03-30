import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { syncAdminUser } from "./admin-sync";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const email = "banenga26@gmail.com";
  const password = "Colasucre2006";

  console.log("--- Force Reset Admin ---");

  const user = await syncAdminUser(prisma, {
    email,
    password,
    nom: "Banenga",
    prenom: "Admin",
  });

  console.log("Utilisateur Admin synchronisé avec succès !");
  console.log("Email:", user.email);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
