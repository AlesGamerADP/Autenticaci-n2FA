'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Setup2FAPage() {
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true);

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      // Primero verificar el estado de autenticación (debug)
      const debugResponse = await fetch('/api/auth/debug', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Debug auth:', debugData);
        
        // Si no hay token, el problema es de autenticación
        if (!debugData.tokenValid) {
          setError(`No autenticado. Cookies encontradas: ${debugData.cookieNames.join(', ') || 'ninguna'}. Por favor inicia sesión nuevamente.`);
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          setLoadingSetup(false);
          return;
        }
      }

      // Si hay token válido, intentar cargar el QR
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'GET',
        credentials: 'include', // Incluir cookies
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // No cachear en producción
      });
      
      const data = await response.json();

      if (response.ok) {
        if (data.qrCodeUrl) {
          setQrCodeUrl(data.qrCodeUrl);
          setSecret(data.secret);
        } else {
          setError('No se pudo generar el código QR. Por favor intenta de nuevo.');
        }
      } else {
        const errorMsg = data.error || data.message || 'Error al cargar configuración 2FA';
        setError(errorMsg);
        
        // Si no está autenticado, redirigir al login
        if (response.status === 401) {
          setError(`${errorMsg}. Redirigiendo al login...`);
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Error loading QR code:', error);
      setError('Error de conexión. Por favor verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        credentials: 'include', // Incluir cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, enable: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('2FA habilitado correctamente. Redirigiendo...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Código inválido');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="container">
        <p className="loading">Cargando configuración 2FA...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Configurar 2FA</h1>
      <h2>Escanea el código QR con Google Authenticator</h2>

      {error && (
        <div className="error">
          {error}
          {error.includes('No autenticado') && (
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              Por favor inicia sesión primero.
            </div>
          )}
        </div>
      )}
      {success && <div className="success">{success}</div>}

      {!error && qrCodeUrl && (
        <div className="qr-code">
          <img src={qrCodeUrl} alt="QR Code para 2FA" />
        </div>
      )}

      {secret && (
        <div style={{ marginBottom: '24px' }}>
          <label style={{ marginBottom: '8px', display: 'block', fontSize: '13px', color: '#6b7280' }}>
            Secreto (si no puedes escanear):
          </label>
          <div className="secret-display">
            {secret}
          </div>
        </div>
      )}

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label htmlFor="code">Código de verificación</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="000000"
            maxLength={6}
            pattern="[0-9]{6}"
          />
        </div>

        <button type="submit" disabled={loading || code.length !== 6}>
          {loading ? 'Verificando...' : 'Habilitar 2FA'}
        </button>
      </form>

      <div className="link">
        <a href="/dashboard">Omitir por ahora</a>
      </div>
    </div>
  );
}

