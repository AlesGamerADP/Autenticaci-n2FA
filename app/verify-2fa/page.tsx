'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, enable: false }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Código inválido');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Verificación 2FA</h1>
      <h2>Ingresa el código de tu autenticador</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code">Código de 6 dígitos</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            placeholder="000000"
            maxLength={6}
            pattern="[0-9]{6}"
            autoFocus
            style={{ 
              fontSize: '28px', 
              textAlign: 'center', 
              letterSpacing: '12px',
              fontFamily: 'monospace',
              fontWeight: '500'
            }}
          />
        </div>

        <button type="submit" disabled={loading || code.length !== 6}>
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>

      <div className="link">
        <a href="/login">Volver al login</a>
      </div>
    </div>
  );
}

