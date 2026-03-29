import { withAuth } from "next-auth/middleware";

/**
 * Middleware d'authentification — protège toutes les routes du dashboard.
 * Les utilisateurs non connectés sont redirigés vers /login.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/chambres/:path*",
    "/reservations/:path*",
    "/factures/:path*",
    "/restaurant/:path*",
    "/activites/:path*",
    "/evenements/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
