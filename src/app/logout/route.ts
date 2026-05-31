import { NextResponse, type NextRequest } from "next/server";
import { financeCookieName } from "@/lib/finance-auth";
import { pipelineAuthCookieName } from "@/lib/pipeline-auth";
import { slipsCookieName } from "@/lib/slips-auth";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?loggedOut=1", request.url));
  response.cookies.delete(pipelineAuthCookieName);
  response.cookies.delete(financeCookieName);
  response.cookies.delete(slipsCookieName);
  return response;
}
