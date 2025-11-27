import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';

/**
 * Endpoint de debug para verificar el estado de autenticación
 * Útil para diagnosticar problemas con cookies en producción
 */
export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    hasCookies: false,
    cookieNames: [],
    authToken: null,
    tokenValid: false,
    tokenPayload: null,
    headers: {},
  };

  try {
    // Obtener todas las cookies
    const cookies = request.cookies.getAll();
    debugInfo.hasCookies = cookies.length > 0;
    debugInfo.cookieNames = cookies.map(c => c.name);
    debugInfo.cookies = cookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0,
    }));

    // Intentar obtener el token
    const token = getAuthToken(request);
    debugInfo.authToken = token ? 'Present' : 'Missing';
    debugInfo.tokenLength = token?.length || 0;

    if (token) {
      const payload = verifyToken(token);
      debugInfo.tokenValid = !!payload;
      if (payload) {
        debugInfo.tokenPayload = {
          userId: payload.userId,
          email: payload.email,
          twoFactorVerified: payload.twoFactorVerified,
        };
      }
    }

    // Headers relevantes
    debugInfo.headers = {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    };

    // Variables de entorno relacionadas con cookies
    debugInfo.cookieConfig = {
      COOKIE_SECURE: process.env.COOKIE_SECURE || 'not set',
      COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'not set',
      COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    return NextResponse.json(debugInfo, {
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      },
    });
  } catch (error: any) {
    debugInfo.error = error.message;
    return NextResponse.json(debugInfo, { status: 500 });
  }
}

