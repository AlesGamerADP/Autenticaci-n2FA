# Llave - Sistema de Autenticación con 2FA

Aplicación web con autenticación de dos factores (2FA) usando Next.js, TypeScript y Google Authenticator.

## Características

- Registro de usuarios con contraseñas encriptadas
- Inicio de sesión seguro
- Autenticación de dos factores (2FA) con Google Authenticator
- Generación de códigos QR para configuración
- Verificación de códigos TOTP
- Dashboard protegido
- Interfaz minimalista y responsive

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- PostgreSQL (local o Amazon RDS)

## Instalación

1. Instala las dependencias:

```bash
npm install
```

2. Crea un archivo `.env` con las siguientes variables:

```env
DB_HOST=tu-instancia.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=tu-contraseña
DB_SSL=true
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
```

Para desarrollo local:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=dev-secret-key
```

3. Inicializa la base de datos:

```bash
npm run create-db
npm run init-db
```

## Uso

### Desarrollo

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre tu navegador en http://localhost:3000

### Producción

Construye la aplicación:

```bash
npm run build
npm start
```

## Flujo de Uso

### Registro

1. Ve a `/register` y crea una cuenta con email y contraseña
2. Después del registro, se te pedirá configurar 2FA
3. Escanea el código QR con Google Authenticator
4. Ingresa el código de 6 dígitos para habilitar 2FA

### Inicio de Sesión

1. Ve a `/login` e ingresa tus credenciales
2. Si tienes 2FA habilitado, se te pedirá el código de 6 dígitos
3. Después de verificar, accederás al dashboard

## Tecnologías Utilizadas

- Next.js 14 - Framework React
- TypeScript - Tipado estático
- PostgreSQL - Base de datos (compatible con Amazon RDS)
- Docker - Containerización
- bcryptjs - Encriptación de contraseñas
- speakeasy - Generación y verificación de códigos TOTP
- qrcode - Generación de códigos QR
- jsonwebtoken - Tokens JWT para autenticación

## Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── register/      # Endpoint de registro
│   │       ├── login/         # Endpoint de login
│   │       ├── 2fa/           # Endpoints de 2FA
│   │       ├── me/            # Obtener usuario actual
│   │       └── logout/        # Cerrar sesión
│   ├── register/              # Página de registro
│   ├── login/                 # Página de login
│   ├── setup-2fa/             # Configuración de 2FA
│   ├── verify-2fa/            # Verificación de código 2FA
│   └── dashboard/             # Dashboard protegido
├── lib/
│   ├── db.ts                  # Conexión a PostgreSQL/RDS
│   ├── users.ts               # Gestión de usuarios
│   ├── auth.ts                # Utilidades de autenticación
│   ├── 2fa.ts                 # Funciones de 2FA
│   └── jwt.ts                 # Manejo de tokens JWT
├── scripts/
│   ├── init-db.ts             # Script de inicialización de BD
│   └── create-database.ts     # Script para crear base de datos
├── Dockerfile                 # Dockerfile para producción
├── Dockerfile.dev             # Dockerfile para desarrollo
├── docker-compose.yml         # Docker Compose para producción/RDS
└── docker-compose.dev.yml     # Docker Compose para desarrollo local
```

## Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt
- Los tokens JWT se usan para autenticación
- Las cookies HTTP-only protegen los tokens
- Los códigos 2FA usan el estándar TOTP (RFC 6238)
- Validación de entrada en todos los endpoints

## Docker y RDS

### Configuración con RDS

1. Configura las variables de entorno en `.env` con tus credenciales de RDS

2. Inicializa la base de datos:

```bash
docker-compose --profile init up db-init
```

3. Ejecuta la aplicación:

```bash
docker-compose up --build
```

### Desarrollo Local con Docker

Para desarrollo local con PostgreSQL en Docker:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Esto creará:
- Un contenedor PostgreSQL local
- La aplicación en modo desarrollo

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run init-db` - Inicializa las tablas de la base de datos
- `npm run create-db` - Crea la base de datos si no existe

## Notas de Producción

- Cambia el `JWT_SECRET` en producción por un valor seguro
- Usa Amazon RDS o una base de datos PostgreSQL segura
- Configura HTTPS en producción
- Usa AWS Secrets Manager para credenciales
- Configura Security Groups correctamente en RDS para permitir solo tu IP
- Implementa rate limiting para prevenir ataques de fuerza bruta
- Habilita SSL para todas las conexiones a la base de datos

## Solución de Problemas

### Error de conexión a la base de datos

- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que el Security Group de RDS permita tu IP
- Verifica que la base de datos exista y las credenciales sean correctas
- Para RDS, asegúrate de que `DB_SSL=true`

### La base de datos no existe

Ejecuta:

```bash
npm run create-db
```

Esto creará la base de datos automáticamente.

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
