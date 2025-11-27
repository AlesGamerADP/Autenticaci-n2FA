import { serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'auth-token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

// Determinar si usar cookies seguras (solo si HTTPS está habilitado)
// Por defecto false para HTTP, true solo si explícitamente se configura
const useSecureCookies = process.env.COOKIE_SECURE === 'true';

// Determinar sameSite según el entorno
const getSameSite = (): 'lax' | 'strict' | 'none' => {
  if (process.env.COOKIE_SAME_SITE) {
    const value = process.env.COOKIE_SAME_SITE.toLowerCase();
    if (value === 'strict' || value === 'none') {
      return value as 'lax' | 'strict' | 'none';
    }
  }
  return 'lax';
};

export function setAuthCookie(response: NextResponse, token: string) {
  const cookieOptions: any = {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: getSameSite(),
    path: '/',
  };

  // Agregar dominio si está configurado (útil para subdominios)
  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  const cookie = serialize(COOKIE_NAME, token, cookieOptions);
  response.headers.set('Set-Cookie', cookie);
  
  // Log en desarrollo para debug
  if (process.env.NODE_ENV === 'development') {
    console.log('Cookie establecida:', {
      name: COOKIE_NAME,
      secure: useSecureCookies,
      sameSite: getSameSite(),
      domain: process.env.COOKIE_DOMAIN || 'no domain',
    });
  }
}

export function getAuthToken(request: NextRequest): string | null {
  try {
    // Intentar obtener de cookies
    const cookie = request.cookies.get(COOKIE_NAME);
    if (cookie?.value) {
      return cookie.value;
    }

    // Si no está en cookies, intentar desde headers (fallback)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
}

export function clearAuthCookie(response: NextResponse) {
  const cookieOptions: any = {
    maxAge: -1,
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    cookieOptions.domain = process.env.COOKIE_DOMAIN;
  }

  const cookie = serialize(COOKIE_NAME, '', cookieOptions);
  response.headers.set('Set-Cookie', cookie);
}

