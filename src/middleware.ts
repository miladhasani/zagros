import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPanel = pathname.startsWith("/panel");
  const isLogin = pathname === "/login";

  if (isPanel && !req.auth) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (isLogin && req.auth && !req.auth.user.mustSetPassword) {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
});

export const config = {
  matcher: ["/panel", "/panel/:path*", "/login", "/login/:path*"],
};
