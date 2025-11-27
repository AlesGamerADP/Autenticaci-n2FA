'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorVerified, setTwoFactorVerified] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.twoFactorVerified && data.user?.twoFactorEnabled) {
          router.push('/verify-2fa');
          return;
        }
        setUser(data.user);
        setTwoFactorVerified(data.twoFactorVerified);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
      router.push('/');
    } catch (error) {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bienvenido a tu panel</p>
        </div>
        <button onClick={handleLogout} className="btn-outline" style={{ width: 'auto', padding: '10px 20px' }}>
          Cerrar Sesión
        </button>
      </div>

      <div className="dashboard-content">
        <div className="info-item">
          <span className="info-label">Email:</span>
          <span className="info-value">{user?.email}</span>
        </div>
        <div className="info-item">
          <span className="info-label">ID de Usuario:</span>
          <span className="info-value">{user?.id}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Estado 2FA:</span>
          <span className="info-value">
            <span className={`status-badge ${user?.twoFactorEnabled ? 'status-enabled' : 'status-disabled'}`}>
              {user?.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">2FA Verificado:</span>
          <span className="info-value">
            <span className={`status-badge ${twoFactorVerified ? 'status-enabled' : 'status-disabled'}`}>
              {twoFactorVerified ? 'Sí' : 'No'}
            </span>
          </span>
        </div>
      </div>

      {!user?.twoFactorEnabled && (
        <div>
          <button onClick={() => router.push('/setup-2fa')}>
            Configurar Autenticación de 2 Factores
          </button>
        </div>
      )}

      {user?.twoFactorEnabled && (
        <div className="success" style={{ marginTop: '20px' }}>
          Tu cuenta está protegida con autenticación de dos factores. 
          Cada vez que inicies sesión, necesitarás ingresar el código de tu autenticador.
        </div>
      )}
    </div>
  );
}

