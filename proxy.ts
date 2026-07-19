import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('chess-auth');
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (authCookie?.value === process.env.AUTH_SECRET) {
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/engine).*)'],
};
