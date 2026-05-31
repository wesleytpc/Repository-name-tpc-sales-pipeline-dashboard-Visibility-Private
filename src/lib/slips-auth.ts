import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const slipsCookieName = "tpc_slips_access";

function slipsPin() {
  return process.env.SLIPS_PIN || "4714";
}

function slipsSecret() {
  return process.env.SLIPS_PIN_SECRET || process.env.AUTH_SESSION_SECRET || "local-slips-pin";
}

function slipsAccessToken() {
  return createHash("sha256").update(`${slipsPin()}:${slipsSecret()}`).digest("hex");
}

export function isValidSlipsPin(value?: string | null) {
  const suppliedPin = String(value ?? "").trim();
  const expectedPin = slipsPin();
  if (!/^\d{4}$/.test(suppliedPin) || !/^\d{4}$/.test(expectedPin)) return false;

  const supplied = Buffer.from(suppliedPin);
  const expected = Buffer.from(expectedPin);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function hasSlipsAccess() {
  return cookies().get(slipsCookieName)?.value === slipsAccessToken();
}

export function grantSlipsAccess() {
  cookies().set(slipsCookieName, slipsAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });
}

export function revokeSlipsAccess() {
  cookies().delete(slipsCookieName);
}
