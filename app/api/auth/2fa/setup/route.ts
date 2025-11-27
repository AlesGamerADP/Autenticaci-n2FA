import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getUserById, updateUser } from '@/lib/users';
import { generateTwoFactorSecret, generateQRCode } from '@/lib/2fa';
import { getAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener el token de múltiples formas
    let token = getAuthToken(request);
    
    // Si no se encuentra en cookies, intentar desde el header Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // Log para debug en producción
      console.log('No token found. Cookies:', request.cookies.getAll());
      return NextResponse.json(
        { 
          error: 'No autenticado',
          message: 'Por favor inicia sesión primero',
          debug: process.env.NODE_ENV === 'development' ? {
            cookies: Array.from(request.cookies.getAll()).map(c => c.name),
            hasCookie: request.cookies.has('auth-token')
          } : undefined
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si ya tiene 2FA configurado, devolver el secreto existente
    if (user.twoFactorSecret) {
      const qrCodeUrl = await generateQRCode(
        `otpauth://totp/Llave%20Authentication:${user.email}?secret=${user.twoFactorSecret}&issuer=Llave%20Authentication`
      );
      return NextResponse.json({
        secret: user.twoFactorSecret,
        qrCodeUrl,
        alreadyConfigured: true,
      });
    }

    // Generar nuevo secreto
    const twoFactorSetup = generateTwoFactorSecret(user.email);
    const qrCodeUrl = await generateQRCode(twoFactorSetup.qrCodeUrl);

    // Guardar el secreto temporalmente (sin habilitar aún)
    user.twoFactorSecret = twoFactorSetup.secret;
    await updateUser(user);

    const response = NextResponse.json({
      secret: twoFactorSetup.secret,
      qrCodeUrl,
      alreadyConfigured: false,
    });

    // Asegurar que los headers permitan cookies
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    
    return response;
  } catch (error: any) {
    console.error('Error en setup 2FA:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al configurar 2FA',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

