import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, setAuthCookie } from '@/lib/auth';
import { verifyToken, generateToken } from '@/lib/jwt';
import { getUserById, updateUser } from '@/lib/users';
import { verifyTwoFactorCode } from '@/lib/2fa';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
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

    const { code, enable } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Código 2FA requerido' },
        { status: 400 }
      );
    }

    const user = await getUserById(payload.userId);
    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA no configurado' },
        { status: 400 }
      );
    }

    // Verificar código
    const isValid = verifyTwoFactorCode(user.twoFactorSecret, code);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Código 2FA inválido' },
        { status: 401 }
      );
    }

    // Si se está habilitando 2FA por primera vez
    if (enable && !user.twoFactorEnabled) {
      user.twoFactorEnabled = true;
      await updateUser(user);
    }

    // Generar nuevo token con 2FA verificado
    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      twoFactorVerified: true,
    });

    const response = NextResponse.json({
      success: true,
      message: enable ? '2FA habilitado correctamente' : '2FA verificado correctamente',
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    // Actualizar cookie con nuevo token
    setAuthCookie(response, newToken);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al verificar 2FA' },
      { status: 500 }
    );
  }
}

