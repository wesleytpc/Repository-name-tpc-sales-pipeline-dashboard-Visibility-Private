import { createHash } from "crypto";
import { cookies } from "next/headers";

export const pipelineAuthCookieName = "tpc_pipeline_session";

export function getAllowedPipelineUsers() {
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

export function pipelineSessionToken(username: string) {
  return createHash("sha256").update(`${username}:${sessionSecret()}`).digest("hex");
}

export function validatePipelineLogin(username: string, password: string) {
  return getAllowedPipelineUsers().some((user) => user.username === username && user.password === password);
}

export function grantPipelineAccess(username: string) {
  cookies().set(pipelineAuthCookieName, pipelineSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 10,
    path: "/",
  });
}

export function revokePipelineAccess() {
  cookies().delete(pipelineAuthCookieName);
}
