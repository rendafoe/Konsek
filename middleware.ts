import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and all API routes (API routes handle their own auth)
  const publicPaths = ["/landing", "/api/", "/_next", "/favicon", "/esko", "/items"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  // Allow static files
  const isStatic = pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|webp)$/);

  if (isPublic || isStatic) {
    return NextResponse.next();
  }

  // Check for NextAuth session token cookie
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("next-auth.session-token");

  if (!sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/landing";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png).*)"],
};
