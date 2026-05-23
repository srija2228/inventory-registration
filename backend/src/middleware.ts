import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const frontendOrigin = process.env.FRONTEND_URL ?? "http://localhost:3000";

const corsHeaders = {
  "Access-Control-Allow-Origin": frontendOrigin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key, Authorization",
};

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS" && request.nextUrl.pathname.startsWith("/api")) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api")) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
