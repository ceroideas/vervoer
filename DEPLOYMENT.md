# �� Guía de Despliegue - Vervoer

Esta guía te ayudará a desplegar Vervoer en un servidor Ubuntu.

## 📋 Requisitos del Servidor

- Ubuntu 20.04 LTS o superior
- Mínimo 2GB RAM
- Mínimo 20GB espacio en disco
- Acceso SSH con privilegios sudo

## 🔧 Configuración Inicial del Servidor

### 1. Ejecutar Script de Configuración

```bash
# Descargar y ejecutar el script de configuración
curl -fsSL https://raw.githubusercontent.com/tu-usuario/vervoer/main/server-setup.sh | bash
```

O si ya tienes el repositorio clonado:

```bash
chmod +x server-setup.sh
./server-setup.sh
```

### 2. Configuración Manual (Alternativa)

Si prefieres configurar manualmente:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2 tsx
```

## 📁 Configuración de la Aplicación

### 1. Clonar el Repositorio

```bash
cd /var/www
sudo git clone https://github.com/tu-usuario/vervoer.git
sudo chown -R $USER:$USER vervoer
cd vervoer
```

### 2. Configurar Variables de Entorno

```bash
# Crear archivo .env
cat > .env <<EOF
# Database
DATABASE_URL="postgresql://vervoer_user:vervoer_password@localhost:5432/vervoer_db"

# JWT
JWT_SECRET="tu_jwt_secret_super_seguro_aqui_cambialo_en_produccion"

# Holded API
HOLDED_API_KEY="tu_holded_api_key_aqui"

# OpenAI API
OPENAI_API_KEY="tu_openai_api_key_aqui"

# Environment
NODE_ENV=production
EOF
```

### 3. Configurar Base de Datos

```bash
# Crear usuario y base de datos PostgreSQL
sudo -u postgres psql -c "CREATE USER vervoer_user WITH PASSWORD 'vervoer_password';"
sudo -u postgres psql -c "CREATE DATABASE vervoer_db OWNER vervoer_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vervoer_db TO vervoer_user;"
```

### 4. Instalar y Configurar la Aplicación

```bash
# Instalar dependencias
npm install

# Configurar la aplicación (base de datos, usuarios, etc.)
npm run server:setup
```

## 🌐 Configuración de Nginx

### 1. Configurar Dominio

Editar `/etc/nginx/sites-available/vervoer`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Habilitar el Sitio

```bash
sudo ln -sf /etc/nginx/sites-available/vervoer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 🚀 Iniciar la Aplicación

### Opción 1: Con PM2 (Recomendado)

```bash
# Iniciar con PM2
pm2 start npm --name "vervoer" -- start

# Configurar para iniciar automáticamente
pm2 startup
pm2 save
```

### Opción 2: Con Systemd

```bash
# Iniciar el servicio
sudo systemctl start vervoer
sudo systemctl enable vervoer
```

## 📝 Comandos Útiles

### Gestión de la Aplicación

```bash
# Ver estado
pm2 status
sudo systemctl status vervoer

# Ver logs
pm2 logs vervoer
sudo journalctl -u vervoer -f

# Reiniciar
pm2 restart vervoer
sudo systemctl restart vervoer

# Detener
pm2 stop vervoer
sudo systemctl stop vervoer
```

### Gestión de la Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar migraciones
npm run db:deploy

# Ejecutar seeds
npm run db:seed

# Abrir Prisma Studio (solo desarrollo)
npm run db:studio
```

### Despliegue de Actualizaciones

```bash
# Obtener cambios
git pull origin main

# Instalar dependencias
npm install

# Aplicar migraciones
npm run server:migrate

# Reiniciar aplicación
pm2 restart vervoer
```

## 🔒 Configuración de Seguridad

### 1. Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 2. SSL/HTTPS (Opcional)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 3. Cambiar Contraseñas por Defecto

```bash
# Cambiar contraseña de PostgreSQL
sudo -u postgres psql -c "ALTER USER vervoer_user PASSWORD 'nueva_contraseña_segura';"

# Actualizar DATABASE_URL en .env
# Cambiar JWT_SECRET en .env
```

## 🐛 Solución de Problemas

### Verificar Estado de Servicios

```bash
# Verificar servicios
sudo systemctl status postgresql
sudo systemctl status nginx
pm2 status

# Verificar puertos
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :5432
sudo netstat -tlnp | grep :80
```

### Logs de Errores

```bash
# Logs de la aplicación
pm2 logs vervoer --lines 50

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Problemas Comunes

1. **Error de conexión a la base de datos**
   - Verificar que PostgreSQL esté corriendo
   - Verificar DATABASE_URL en .env
   - Verificar permisos del usuario

2. **Error 502 Bad Gateway**
   - Verificar que la aplicación esté corriendo en puerto 3000
   - Verificar configuración de Nginx
   - Revisar logs de Nginx

3. **Error de permisos**
   - Verificar propietario de archivos: `sudo chown -R $USER:$USER /var/www/vervoer`
   - Verificar permisos de directorios: `chmod 755 /var/www/vervoer`

## 📊 Monitoreo

### PM2 Dashboard

```bash
# Abrir dashboard de PM2
pm2 monit
```

### Logs en Tiempo Real

```bash
# Ver logs de todos los servicios
pm2 logs --lines 100
```

## 🔄 Actualizaciones

### Script de Actualización Automática

```bash
#!/bin/bash
cd /var/www/vervoer
git pull origin main
npm install
npm run server:migrate
pm2 restart vervoer
echo "Actualización completada"
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de error
2. Verifica la configuración de variables de entorno
3. Asegúrate de que todos los servicios estén corriendo
4. Consulta la documentación de Prisma y Next.js

---

**¡Tu aplicación Vervoer está lista para usar!** 🎉 