import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const financeCookieName = "tpc_finance_access";

function financePin() {
  return process.env.FINANCE_PIN || "1234";
}

function financeSecret() {
  return process.env.FINANCE_PIN_SECRET || process.env.BASIC_AUTH_PASSWORD || "local-finance-pin";
}

function financeAccessToken() {
  return createHash("sha256").update(`${financePin()}:${financeSecret()}`).digest("hex");
}

export function isValidFinancePin(value?: string | null) {
  const suppliedPin = String(value ?? "").trim();
  const expectedPin = financePin();
  if (!/^\d{4}$/.test(suppliedPin) || !/^\d{4}$/.test(expectedPin)) return false;

  const supplied = Buffer.from(suppliedPin);
  const expected = Buffer.from(expectedPin);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function hasFinanceAccess() {
  return cookies().get(financeCookieName)?.value === financeAccessToken();
}

export function grantFinanceAccess() {
  cookies().set(financeCookieName, financeAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export function revokeFinanceAccess() {
  cookies().delete(financeCookieName);
}
