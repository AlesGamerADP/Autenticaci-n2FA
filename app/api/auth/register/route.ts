import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/users';
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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      twoFactorVerified: false,
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
    } catch (userError: any) {
      // Error al crear usuario (duplicado, etc.)
      return NextResponse.json(
        { error: userError.message || 'Error al registrar usuario' },
        { status: 400 }
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

