# Solución para Problema de QR en EC2

## Problema
El código QR no aparece en la página de configuración 2FA cuando la aplicación está desplegada en EC2.

## Causas Identificadas

1. **Cookies no se envían correctamente**: En producción con HTTP, las cookies pueden no funcionar si están mal configuradas
2. **Headers CORS faltantes**: Pueden bloquear las peticiones
3. **Configuración de cookies incorrecta**: `secure: true` no funciona con HTTP

## Soluciones Implementadas

### 1. Configuración de Cookies Mejorada

Las cookies ahora se configuran correctamente para HTTP:

```env
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
```

### 2. Headers CORS Agregados

Se agregaron headers CORS en todos los endpoints de autenticación:
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Origin: *` (o el origen específico)

### 3. Lectura de Cookies Mejorada

El sistema ahora intenta leer cookies de múltiples formas:
- Desde cookies HTTP-only
- Desde header Authorization (fallback)

### 4. Logging para Debug

Se agregó logging en desarrollo para ayudar a diagnosticar problemas.

## Pasos para Aplicar en EC2

### 1. Actualizar Variables de Entorno

En tu archivo `.env` en EC2, asegúrate de tener:

```env
# ... otras variables ...

# Configuración de cookies (CRÍTICO para HTTP)
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
```

### 2. Reconstruir la Aplicación

```bash
cd ~/Llave  # o tu directorio del proyecto
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 3. Verificar Logs

```bash
docker-compose logs -f app
```

Busca mensajes como:
- "No token found. Cookies: ..." (si hay problemas)
- Errores de autenticación

### 4. Verificar Cookies en el Navegador

1. Abre la aplicación en el navegador
2. Abre DevTools (F12)
3. Ve a Application > Cookies
4. Verifica que exista la cookie `auth-token`
5. Verifica que tenga el valor correcto

### 5. Probar el Flujo Completo

1. Registra un nuevo usuario o inicia sesión
2. Deberías ser redirigido a `/setup-2fa`
3. El código QR debería aparecer automáticamente
4. Si ves "No autenticado", verifica las cookies en DevTools

## Verificación de Problemas

### Si aún no funciona:

1. **Verifica que las cookies se estén estableciendo**:
   - DevTools > Application > Cookies
   - Debe existir `auth-token` después de login/registro

2. **Verifica la respuesta del endpoint**:
   ```bash
   curl -v http://3.138.113.60:3000/api/auth/2fa/setup \
     -H "Cookie: auth-token=TU_TOKEN_AQUI"
   ```

3. **Revisa los logs del contenedor**:
   ```bash
   docker-compose logs app | grep -i "token\|cookie\|auth"
   ```

4. **Verifica que el Security Group permita el puerto 3000**

## Configuración Adicional para Nginx (Si usas)

Si estás usando Nginx como reverse proxy, asegúrate de pasar los headers correctamente:

```nginx
proxy_set_header Cookie $http_cookie;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cookie_path / "/; SameSite=Lax";
```

## Si Usas HTTPS

Cuando configures HTTPS (con Let's Encrypt o similar):

1. Cambia en `.env`:
   ```env
   COOKIE_SECURE=true
   ```

2. Reconstruye:
   ```bash
   docker-compose up --build -d
   ```

## Comandos de Debug

```bash
# Ver todas las cookies en el contenedor
docker-compose exec app sh -c "env | grep COOKIE"

# Probar conexión a la API
curl -v http://localhost:3000/api/auth/me \
  -H "Cookie: auth-token=test"

# Ver logs en tiempo real
docker-compose logs -f app
```

