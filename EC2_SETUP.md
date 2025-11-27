# Configuración de Instancia EC2

**IMPORTANTE**: Para solucionar el problema del QR que no aparece, consulta también `EC2_QR_FIX.md` y `DEPLOY_EC2.md`

## Información de la Instancia

- **ID de Instancia**: i-04d137ddf629d9105
- **IP Pública**: 3.138.113.60
- **IP Privada**: 10.0.1.239
- **DNS Público**: ec2-3-138-113-60.us-east-2.compute.amazonaws.com
- **Región**: us-east-2 (Ohio)
- **Tipo**: t3.micro
- **Sistema Operativo**: Ubuntu 18.04
- **VPC**: vpc-0d68cd3f5f1d78d09
- **Subnet**: subnet-06b09d55c47821e71 (Public-Subnet-Ubuntu)

## Acceso SSH

Para conectarte a la instancia:

```bash
ssh -i Lab15.pem ubuntu@3.138.113.60
```

O usando el DNS:

```bash
ssh -i Lab15.pem ubuntu@ec2-3-138-113-60.us-east-2.compute.amazonaws.com
```

## Configuración de Security Group

Asegúrate de que el Security Group de tu instancia permita:

1. **Puerto 22 (SSH)**: Para acceso remoto
   - Tipo: SSH
   - Puerto: 22
   - Origen: Tu IP o 0.0.0.0/0 (solo para desarrollo)

2. **Puerto 3000 (Aplicación)**: Para acceder a la aplicación
   - Tipo: Custom TCP
   - Puerto: 3000
   - Origen: 0.0.0.0/0 (o tu IP específica)

3. **Puerto 5432 (PostgreSQL)**: Solo si usas PostgreSQL local
   - Tipo: PostgreSQL
   - Puerto: 5432
   - Origen: Tu IP o el Security Group de RDS

## Configuración de Variables de Entorno

Crea un archivo `.env` en el servidor con:

```env
# Base de Datos RDS
DB_HOST=tu-instancia-rds.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=llave_auth
DB_USER=postgres
DB_PASSWORD=tu-contraseña-segura
DB_SSL=true

# JWT Secret
JWT_SECRET=tu-secreto-super-seguro-generar-aleatorio

# Configuración de Cookies (IMPORTANTE para HTTP)
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=

# Entorno
NODE_ENV=production
```

## Pasos de Instalación en EC2

### 1. Conectarse a la instancia

```bash
ssh -i Lab15.pem ubuntu@3.138.113.60
```

### 2. Instalar Docker y Docker Compose

```bash
# Actualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sesión para aplicar cambios de grupo
exit
# Reconectar después
```

### 3. Clonar o subir el proyecto

```bash
# Opción 1: Si tienes el código en Git
git clone tu-repositorio.git
cd tu-repositorio

# Opción 2: Subir archivos con SCP
# Desde tu máquina local:
# scp -i Lab15.pem -r ./Llave ubuntu@3.138.113.60:~/
```

### 4. Configurar variables de entorno

```bash
cd ~/Llave  # o el nombre de tu directorio
nano .env
# Pegar las variables de entorno configuradas arriba
# Guardar con Ctrl+X, luego Y, luego Enter
```

### 5. Inicializar la base de datos

```bash
docker-compose --profile init up db-init
```

### 6. Construir y ejecutar la aplicación

```bash
docker-compose up --build -d
```

### 7. Verificar que esté funcionando

```bash
# Ver logs
docker-compose logs -f app

# Verificar que el contenedor esté corriendo
docker-compose ps

# Probar la aplicación
curl http://localhost:3000/api/health
```

## Acceso a la Aplicación

Una vez configurada, accede a la aplicación desde tu navegador:

```
http://3.138.113.60:3000
```

O usando el DNS:

```
http://ec2-3-138-113-60.us-east-2.compute.amazonaws.com:3000
```

## Configuración con Nginx (Opcional - Para producción)

Si quieres usar un dominio y HTTPS:

### 1. Instalar Nginx

```bash
sudo apt install -y nginx
```

### 2. Configurar reverse proxy

```bash
sudo nano /etc/nginx/sites-available/llave-auth
```

Contenido:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;  # O la IP pública

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Habilitar el sitio

```bash
sudo ln -s /etc/nginx/sites-available/llave-auth /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Si usas HTTPS, actualizar .env

```env
COOKIE_SECURE=true
```

## Comandos Útiles

```bash
# Ver logs de la aplicación
docker-compose logs -f app

# Reiniciar la aplicación
docker-compose restart app

# Detener la aplicación
docker-compose down

# Reconstruir después de cambios
docker-compose up --build -d

# Ver estado de contenedores
docker-compose ps

# Acceder al contenedor
docker-compose exec app sh
```

## Solución de Problemas

### La aplicación no responde

1. Verificar que el Security Group permita el puerto 3000
2. Verificar que Docker esté corriendo: `sudo systemctl status docker`
3. Ver logs: `docker-compose logs app`

### Error de conexión a RDS

1. Verificar que el Security Group de RDS permita la IP privada de EC2: `10.0.1.239`
2. Verificar variables de entorno en `.env`
3. Probar conexión: `docker-compose exec app sh -c "psql -h $DB_HOST -U $DB_USER -d $DB_NAME"`

### Cookies no funcionan

1. Verificar que `COOKIE_SECURE=false` si usas HTTP
2. Verificar que `COOKIE_SAME_SITE=lax`
3. En el navegador, abrir DevTools > Application > Cookies y verificar que la cookie se esté estableciendo

## Seguridad

- Cambia el `JWT_SECRET` por un valor aleatorio seguro
- Usa HTTPS en producción (con Let's Encrypt)
- Configura `COOKIE_SECURE=true` cuando uses HTTPS
- Limita el acceso SSH solo a tu IP
- Usa AWS Secrets Manager para credenciales en producción

