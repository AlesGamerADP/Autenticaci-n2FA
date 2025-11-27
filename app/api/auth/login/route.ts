import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/users';
import { generateToken } from '@/lib/jwt';
import { setAuthCookie } from '@/lib/auth';
import { ensureDatabaseInitialized } from '@/lib/db-init';

export async function POST(request: NextRequest) {
  try {
    // Asegurar que la BD esté inicializada
    try {
      await ensureDatabaseInitialized();
    } catch (dbError: any) {
      return NextResponse.json(
        { 
          error: 'Error de conexión a la base de datos',
          message: 'No se pudo conectar a la base de datos. Verifica la configuración.',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      );
    }
    
    try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(user, password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Si el usuario tiene 2FA habilitado, requerir verificación
    if (user.twoFactorEnabled) {
      const token = generateToken({
        userId: user.id,
        email: user.email,
        twoFactorVerified: false,
      });

      const response = NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Se requiere verificación de 2FA',
      });

      setAuthCookie(response, token);
      
      // Headers adicionales para asegurar que las cookies funcionen
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
      
      return response;
    }

    // Si no tiene 2FA, login completo
    const token = generateToken({
      userId: user.id,
      email: user.email,
      twoFactorVerified: true,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    setAuthCookie(response, token);
    
    // Headers adicionales para asegurar que las cookies funcionen
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
    
    return response;
    } catch (authError: any) {
      // Error de autenticación
      return NextResponse.json(
        { error: authError.message || 'Error al iniciar sesión' },
        { status: authError.message?.includes('Credenciales') ? 401 : 500 }
      );
    }
  } catch (error: any) {
    // Error general
    return NextResponse.json(
      { error: error.message || 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

