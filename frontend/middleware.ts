import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root URL visit: Check if user has chosen a locale before
  if (pathname === "/") {
    const savedLocale = request.cookies.get("NEXT_LOCALE")?.value;
    if (savedLocale && routing.locales.includes(savedLocale as any)) {
      return NextResponse.redirect(new URL(`/${savedLocale}`, request.url));
    }
    // Initial / first-time visit: default to 'uz'
    const response = NextResponse.redirect(new URL(`/uz`, request.url));
    response.cookies.set("NEXT_LOCALE", "uz", {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`, `logo_neww.png`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
