import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Protection par rôle pour la zone Admin/Paramètres
    if (pathname.startsWith("/settings") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const pathname = req.nextUrl.pathname;
        
        // Routes API d'auth et de login toujours autorisées
        if (pathname.startsWith("/api/auth")) return true;
        if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/reset-password")) return true;
        
        // Toutes les autres routes nécessitent un token
        return !!token;
      },
    },
  }
);

export const config = {
  // Pattern standard pour ignorer les assets statiques et Next.js
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)"],
};
