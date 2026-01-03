import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ROUTES } from '@/lib/shared/constants/routeres';

const AUTH_COOKIE = 'lmsAccessToken';
const PUBLIC_PATHS = [ROUTES.LOGIN, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_COOKIE)?.value;
  const isPublic = isPublicPath(pathname);

  if (!accessToken && !isPublic) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (accessToken && isPublic) {
    const homeUrl = new URL(ROUTES.HOME, request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export default middleware;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
