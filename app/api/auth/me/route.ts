import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/lib/users';

export async function GET(request: NextRequest) {
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

    const user = await getUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      twoFactorVerified: payload.twoFactorVerified || false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

