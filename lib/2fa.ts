import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
}

// Generar secreto para 2FA
export function generateTwoFactorSecret(email: string): TwoFactorSetup {
  const secret = speakeasy.generateSecret({
    name: `Llave Auth (${email})`,
    issuer: 'Llave Authentication',
  });

  return {
    secret: secret.base32!,
    qrCodeUrl: secret.otpauth_url!,
  };
}

// Generar URL del código QR como imagen base64
export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error('Error al generar código QR');
  }
}

// Verificar código 2FA
export function verifyTwoFactorCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Permite un margen de 2 períodos (60 segundos cada uno)
  });
}

