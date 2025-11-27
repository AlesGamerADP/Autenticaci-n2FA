'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const response = await fetch('/api/auth/debug', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: 'Error al cargar información de debug' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Cargando información de debug...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1>Debug de Autenticación</h1>
      <h2>Información de estado de cookies y autenticación</h2>

      <div style={{ marginTop: '24px' }}>
        <button onClick={loadDebugInfo} style={{ marginBottom: '20px' }}>
          Actualizar Información
        </button>

        <div className="dashboard-content">
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Estado de Cookies</h3>
          <div className="info-item">
            <span className="info-label">Cookies encontradas:</span>
            <span className="info-value">{debugInfo?.hasCookies ? 'Sí' : 'No'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Nombres de cookies:</span>
            <span className="info-value">
              {debugInfo?.cookieNames?.length > 0 
                ? debugInfo.cookieNames.join(', ') 
                : 'Ninguna'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Token de autenticación:</span>
            <span className="info-value">{debugInfo?.authToken || 'No encontrado'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Token válido:</span>
            <span className="info-value">
              <span className={`status-badge ${debugInfo?.tokenValid ? 'status-enabled' : 'status-disabled'}`}>
                {debugInfo?.tokenValid ? 'Sí' : 'No'}
              </span>
            </span>
          </div>

          {debugInfo?.tokenPayload && (
            <>
              <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>Información del Token</h3>
              <div className="info-item">
                <span className="info-label">User ID:</span>
                <span className="info-value">{debugInfo.tokenPayload.userId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{debugInfo.tokenPayload.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">2FA Verificado:</span>
                <span className="info-value">
                  <span className={`status-badge ${debugInfo.tokenPayload.twoFactorVerified ? 'status-enabled' : 'status-disabled'}`}>
                    {debugInfo.tokenPayload.twoFactorVerified ? 'Sí' : 'No'}
                  </span>
                </span>
              </div>
            </>
          )}

          <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>Configuración de Cookies</h3>
          <div className="info-item">
            <span className="info-label">COOKIE_SECURE:</span>
            <span className="info-value">{debugInfo?.cookieConfig?.COOKIE_SECURE || 'No configurado'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">COOKIE_SAME_SITE:</span>
            <span className="info-value">{debugInfo?.cookieConfig?.COOKIE_SAME_SITE || 'No configurado'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">COOKIE_DOMAIN:</span>
            <span className="info-value">{debugInfo?.cookieConfig?.COOKIE_DOMAIN || 'No configurado'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">NODE_ENV:</span>
            <span className="info-value">{debugInfo?.cookieConfig?.NODE_ENV || 'No configurado'}</span>
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '16px', fontSize: '18px' }}>Headers</h3>
          <div className="info-item">
            <span className="info-label">Origin:</span>
            <span className="info-value">{debugInfo?.headers?.origin || 'No disponible'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Referer:</span>
            <span className="info-value">{debugInfo?.headers?.referer || 'No disponible'}</span>
          </div>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', fontSize: '13px' }}>
          <strong>Instrucciones:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Si "Token válido" es "No", las cookies no se están estableciendo correctamente</li>
            <li>Verifica que COOKIE_SECURE sea "false" si usas HTTP</li>
            <li>Si no hay cookies, intenta hacer login/registro nuevamente</li>
            <li>Revisa la consola del navegador (F12) para más detalles</li>
          </ul>
        </div>

        <div className="link" style={{ marginTop: '24px' }}>
          <a href="/login">Ir a Login</a> | <a href="/register">Ir a Registro</a> | <a href="/">Inicio</a>
        </div>
      </div>
    </div>
  );
}

