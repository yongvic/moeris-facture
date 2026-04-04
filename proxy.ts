import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/reset-password"];

const registrationEnabled = process.env.ALLOW_PUBLIC_REGISTRATION === "true";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/settings") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname === "/register" && !registrationEnabled) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const pathname = req.nextUrl.pathname;

        if (pathname.startsWith("/api/auth")) return true;
        if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
          return true;
        }
        if (pathname === "/register") {
          return registrationEnabled;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|api/password-reset|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
