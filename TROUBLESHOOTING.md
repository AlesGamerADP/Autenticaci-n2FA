# 🔧 Solución de Problemas de Conexión a Base de Datos

## Error: "Connection terminated due to connection timeout"

Este error indica que la aplicación no puede conectarse a la base de datos. Sigue estos pasos para diagnosticar y resolver el problema.

## 🔍 Diagnóstico

### 1. Verificar Health Check

Primero, verifica el estado de la conexión:

```bash
curl http://localhost:3000/api/health
```

O abre en tu navegador: `http://localhost:3000/api/health`

Esto te mostrará:
- Si la conexión a la BD es exitosa
- Detalles de la configuración actual
- Información útil para diagnosticar

### 2. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env` tenga las siguientes variables:

```env
DB_HOST=tu-instancia.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=tu-contraseña
DB_SSL=true
JWT_SECRET=tu-secreto
```

**Para desarrollo local con PostgreSQL en Docker:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=dev-secret
```

## 🛠️ Soluciones por Escenario

### Escenario 1: Conectando a Amazon RDS

#### Problema: Timeout al conectar a RDS

**Causas comunes:**

1. **Security Group no permite tu IP**
   - Ve a AWS Console → RDS → Tu instancia → Security Groups
   - Asegúrate de que el Security Group permita conexiones desde tu IP
   - Puerto: `5432` (PostgreSQL)
   - Tipo: `PostgreSQL`

2. **Endpoint incorrecto**
   - Verifica que el `DB_HOST` sea el endpoint correcto de RDS
   - Formato: `tu-instancia.region.rds.amazonaws.com`
   - Encuéntralo en: AWS Console → RDS → Tu instancia → Connectivity & security

3. **Credenciales incorrectas**
   - Verifica usuario y contraseña
   - Asegúrate de que la base de datos exista

4. **SSL requerido**
   - RDS requiere SSL para conexiones externas
   - Asegúrate de que `DB_SSL=true` en tu `.env`

**Solución:**

```bash
# 1. Verifica tu IP pública
curl https://api.ipify.org

# 2. Agrega tu IP al Security Group de RDS
# En AWS Console → RDS → Security Groups → Inbound Rules

# 3. Verifica las variables de entorno
cat .env | grep DB_

# 4. Prueba la conexión
curl http://localhost:3000/api/health
```

### Escenario 2: Desarrollo Local

#### Problema: No hay base de datos local

**Solución: Usar PostgreSQL en Docker**

```bash
# Opción 1: Solo PostgreSQL
docker-compose -f docker-compose.dev.yml up postgres -d

# Opción 2: PostgreSQL + App
docker-compose -f docker-compose.dev.yml up --build
```

Luego configura tu `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

### Escenario 3: Verificar Conexión Manualmente

Puedes probar la conexión directamente usando `psql`:

```bash
# Para RDS
psql -h tu-instancia.region.rds.amazonaws.com -U postgres -d llave_auth

# Para local
psql -h localhost -U postgres -d llave_auth
```

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas correctamente
- [ ] Base de datos existe en RDS/PostgreSQL
- [ ] Usuario y contraseña son correctos
- [ ] Security Group permite tu IP (si usas RDS)
- [ ] `DB_SSL=true` para RDS, `DB_SSL=false` para local
- [ ] Puerto correcto (5432 por defecto)
- [ ] PostgreSQL está corriendo (si es local)

## 🧪 Pruebas Rápidas

### Test 1: Verificar conexión

```bash
npm run dev
# En otra terminal:
curl http://localhost:3000/api/health
```

### Test 2: Inicializar base de datos

```bash
npm run init-db
```

### Test 3: Verificar variables de entorno

```bash
# Windows PowerShell
Get-Content .env

# Linux/Mac
cat .env
```

## 💡 Mensajes de Error Comunes

### "Connection terminated unexpectedly"
- **Causa**: El servidor cerró la conexión
- **Solución**: Verifica que la BD esté corriendo y accesible

### "password authentication failed"
- **Causa**: Usuario o contraseña incorrectos
- **Solución**: Verifica `DB_USER` y `DB_PASSWORD`

### "database does not exist"
- **Causa**: La base de datos no existe
- **Solución**: Crea la BD en RDS o usa el nombre correcto

### "timeout"
- **Causa**: No se puede alcanzar el servidor
- **Solución**: Verifica `DB_HOST`, Security Groups, y que la BD esté accesible

## 🚀 Desarrollo Rápido

Si solo quieres probar la aplicación sin configurar RDS:

```bash
# 1. Inicia PostgreSQL local
docker-compose -f docker-compose.dev.yml up postgres -d

# 2. Espera unos segundos para que PostgreSQL inicie

# 3. Configura .env para local
echo "DB_HOST=localhost
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
JWT_SECRET=dev-secret" > .env

# 4. Inicializa la BD
npm run init-db

# 5. Inicia la app
npm run dev
```

## 📞 Obtener Ayuda

Si después de seguir estos pasos aún tienes problemas:

1. Revisa los logs: `npm run dev` mostrará errores detallados
2. Verifica el endpoint de health: `http://localhost:3000/api/health`
3. Prueba la conexión manualmente con `psql`
4. Verifica la configuración de AWS RDS en la consola

