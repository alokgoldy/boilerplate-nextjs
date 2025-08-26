import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


// Simple gate: require sb-access-token cookie for /dashboard
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/dashboard')) {
    const hasToken = req.cookies.get('sb-access-token')?.value;
    if (!hasToken) {
      const url = new URL('/sign-in', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}


export const config = { matcher: ['/dashboard/:path*'] };