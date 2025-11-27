import { serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'auth-token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export function setAuthCookie(response: NextResponse, token: string) {
  const cookie = serialize(COOKIE_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  response.headers.set('Set-Cookie', cookie);
}

export function getAuthToken(request: NextRequest): string | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  return cookie?.value || null;
}

export function clearAuthCookie(response: NextResponse) {
  const cookie = serialize(COOKIE_NAME, '', {
    maxAge: -1,
    path: '/',
  });

  response.headers.set('Set-Cookie', cookie);
}

