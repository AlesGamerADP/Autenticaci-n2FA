import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getUserById, updateUser } from '@/lib/users';
import { generateTwoFactorSecret, generateQRCode } from '@/lib/2fa';
import { getAuthToken } from '@/lib/auth';

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

    return NextResponse.json({
      secret: twoFactorSetup.secret,
      qrCodeUrl,
      alreadyConfigured: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al configurar 2FA' },
      { status: 500 }
    );
  }
}

