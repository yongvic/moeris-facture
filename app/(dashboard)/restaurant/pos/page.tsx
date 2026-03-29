import { prisma } from "../../../../lib/prisma";
import PosClient from "./PosClient";

export default async function PosPage() {
  const [produits, clients] = await Promise.all([
    prisma.produit.findMany({
      where: { archive: false },
      orderBy: { categorie: "asc" },
      take: 30,
    }),
    prisma.client.findMany({
      where: { actif: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, prenom: true, nom: true },
    }),
  ]);

  const produitsData = produits.map((produit) => ({
    ...produit,
    prix: Number(produit.prix),
  }));

  return <PosClient produits={produitsData} clients={clients} />;
}
