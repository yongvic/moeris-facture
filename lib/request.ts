export function getRequestIp(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded ?? request.headers.get("x-real-ip") ?? "unknown";
}

export function getBaseUrl(request: Request) {
  // Explicit override always wins (set this in Vercel env vars for your custom domain)
  const envUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  // Vercel automatically sets VERCEL_URL with the deployment hostname (no protocol)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  // Fallback: derive from the incoming request
  const origin = request.headers.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
