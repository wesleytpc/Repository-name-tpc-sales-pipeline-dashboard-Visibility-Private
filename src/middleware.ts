import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;
const pipelineAuthCookieName = "tpc_pipeline_session";

function getAllowedUsers() {
  const multiUserConfig = process.env.BASIC_AUTH_USERS;

  if (multiUserConfig) {
    return multiUserConfig
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separatorIndex = item.indexOf(":");
        return {
          username: item.slice(0, separatorIndex),
          password: item.slice(separatorIndex + 1),
        };
      })
      .filter((item) => item.username && item.password);
  }

  const username = process.env.BASIC_AUTH_USER;
  const password = process.env.BASIC_AUTH_PASSWORD;

  return username && password ? [{ username, password }] : [];
}

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.BASIC_AUTH_PASSWORD || "local-pipeline-session";
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hasValidSession(request: NextRequest) {
  const sessionToken = request.cookies.get(pipelineAuthCookieName)?.value;
  if (!sessionToken) return false;

  const allowedUsers = getAllowedUsers();
  for (const user of allowedUsers) {
    const expectedToken = await sha256(`${user.username}:${sessionSecret()}`);
    if (sessionToken === expectedToken) return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/login" ||
    pathname === "/logout" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const allowedUsers = getAllowedUsers();

  if (!allowedUsers.length) {
    return NextResponse.redirect(new URL("/login?error=not-configured", request.url));
  }

  if (await hasValidSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}
