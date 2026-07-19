import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === process.env.AUTH_SECRET) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('chess-auth', process.env.AUTH_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid' }, { status: 401 });
}
