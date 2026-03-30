export function getRequestIp(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwarded ?? request.headers.get("x-real-ip") ?? "unknown";
}

export function getBaseUrl(request: Request) {
  const envUrl = process.env.APP_URL ?? process.env.NEXTAUTH_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
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
