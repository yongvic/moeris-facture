import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Résidence Moeris",
    short_name: "Moeris",
    description:
      "Plateforme de gestion hôtelière multiservice pour la Résidence Moeris.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6efe4",
    theme_color: "#b88d0e",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/logo_typo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
