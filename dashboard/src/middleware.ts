import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();
  
  // Add timing header
  response.headers.set("X-Response-Time", `${Date.now() - start}ms`);
  
  // Log to console for debugging (middleware can't write files directly)
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);
  
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
