'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
        if (data.twoFactorVerified) {
          router.push('/dashboard');
        } else if (data.user?.twoFactorEnabled) {
          router.push('/verify-2fa');
        } else {
          setUser(data.user);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
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
    <div className="container">
      <h1>Llave</h1>
      <h2>Sistema de Autenticación con 2FA</h2>
      <div style={{ marginTop: '32px' }}>
        <button onClick={() => router.push('/login')}>
          Iniciar Sesión
        </button>
        <div className="link">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </div>
      </div>
    </div>
  );
}

