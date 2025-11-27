# Guía de Despliegue en EC2 - Solución QR

## Cambios Realizados para EC2

Se han realizado las siguientes correcciones para que el QR funcione en EC2:

1. **Configuración de cookies mejorada** - Funciona con HTTP
2. **Headers CORS agregados** - Permiten cookies en peticiones
3. **Lectura de cookies mejorada** - Múltiples métodos de lectura
4. **Logging mejorado** - Para diagnosticar problemas
5. **Manejo de errores mejorado** - Mensajes más claros

## Pasos para Desplegar en EC2

### 1. Conectarse a EC2

```bash
ssh -i Lab15.pem ubuntu@3.138.113.60
```

### 2. Subir el Código Actualizado

Desde tu máquina local:

```bash
# Comprimir el proyecto (excluyendo node_modules y .next)
tar --exclude='node_modules' --exclude='.next' --exclude='.git' \
    -czf llave-app.tar.gz .

# Subir a EC2
scp -i Lab15.pem llave-app.tar.gz ubuntu@3.138.113.60:~/

# En EC2, extraer
ssh -i Lab15.pem ubuntu@3.138.113.60
cd ~
tar -xzf llave-app.tar.gz -C ~/Llave
```

### 3. Configurar Variables de Entorno

```bash
cd ~/Llave
nano .env
```

Asegúrate de tener estas variables (CRÍTICO):

```env
# Base de datos
DB_HOST=pc04-test.c542k02icvkx.us-east-2.rds.amazonaws.com
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=tu-contraseña
DB_SSL=true

# JWT
JWT_SECRET=tu-secreto-super-seguro

# COOKIES - MUY IMPORTANTE PARA HTTP
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=
```

### 4. Reconstruir y Ejecutar

```bash
# Detener contenedores existentes
docker-compose down

# Reconstruir sin caché para asegurar cambios
docker-compose build --no-cache

# Inicializar BD si es necesario
docker-compose --profile init up db-init

# Iniciar aplicación
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### 5. Verificar Security Group

En AWS Console, verifica que el Security Group permita:
- Puerto 3000 desde 0.0.0.0/0 (o tu IP específica)

### 6. Probar la Aplicación

Accede desde tu navegador:

```
http://3.138.113.60:3000
```

## Verificación del QR

### Paso 1: Registrar/Login

1. Ve a `http://3.138.113.60:3000/register`
2. Crea una cuenta
3. Deberías ser redirigido a `/setup-2fa`

### Paso 2: Verificar Cookies

1. Abre DevTools (F12)
2. Ve a Application > Cookies > http://3.138.113.60:3000
3. Debe existir la cookie `auth-token`
4. Verifica que tenga un valor (no esté vacía)

### Paso 3: Verificar QR

1. En la página `/setup-2fa`
2. El código QR debería aparecer automáticamente
3. Si ves "No autenticado", verifica las cookies arriba

## Solución de Problemas

### Problema: "No autenticado" en setup-2fa

**Solución:**

1. Verifica cookies en DevTools
2. Si no existe `auth-token`, el problema es en login/registro
3. Verifica que `COOKIE_SECURE=false` en `.env`
4. Reconstruye: `docker-compose up --build -d`

### Problema: QR no aparece pero no hay error

**Solución:**

1. Abre DevTools > Console
2. Busca errores de JavaScript
3. Abre DevTools > Network
4. Busca la petición a `/api/auth/2fa/setup`
5. Verifica la respuesta (debe tener `qrCodeUrl`)

### Problema: Cookies no se establecen

**Solución:**

1. Verifica `.env` tiene `COOKIE_SECURE=false`
2. Verifica logs: `docker-compose logs app | grep -i cookie`
3. Prueba manualmente:
   ```bash
   curl -v http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   ```
4. Busca `Set-Cookie` en la respuesta

## Comandos de Debug

```bash
# Ver logs en tiempo real
docker-compose logs -f app

# Ver variables de entorno del contenedor
docker-compose exec app env | grep COOKIE

# Probar endpoint manualmente
docker-compose exec app sh -c "curl http://localhost:3000/api/health"

# Ver estado de contenedores
docker-compose ps

# Reiniciar solo la app
docker-compose restart app
```

## Checklist Final

- [ ] Variables de entorno configuradas correctamente
- [ ] `COOKIE_SECURE=false` en `.env`
- [ ] Security Group permite puerto 3000
- [ ] Contenedor está corriendo: `docker-compose ps`
- [ ] Cookies se establecen después de login/registro
- [ ] QR aparece en `/setup-2fa`

## Si Aún No Funciona

1. **Revisa logs completos**:
   ```bash
   docker-compose logs app > logs.txt
   cat logs.txt
   ```

2. **Verifica respuesta del API**:
   ```bash
   curl -v http://3.138.113.60:3000/api/auth/2fa/setup \
     --cookie "auth-token=TU_TOKEN"
   ```

3. **Revisa configuración de cookies**:
   ```bash
   docker-compose exec app env | grep COOKIE
   ```

4. **Prueba desde el navegador con DevTools abierto**:
   - Network tab para ver peticiones
   - Application tab para ver cookies
   - Console tab para ver errores

