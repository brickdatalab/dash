import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PREFIXES = ["/login", "/api/auth/", "/_next/", "/favicon"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (PUBLIC_PREFIXES.some((p) => path.startsWith(p))) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie) return NextResponse.redirect(new URL("/login", req.url));

  const sess = await verifySession(cookie);
  if (!sess) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
