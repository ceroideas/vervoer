# 🚀 Guía de Despliegue - Vervoer

Esta guía te ayudará a desplegar Vervoer en un servidor desde un archivo ZIP y configurar la base de datos PostgreSQL.

## 📋 Requisitos Previos

- **Sistema Operativo**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Almacenamiento**: Mínimo 10GB de espacio libre
- **Puertos**: 3000 (aplicación), 5432 (PostgreSQL), 5050 (PgAdmin)

## 🗜️ Despliegue desde ZIP

### 1. Subir y extraer el archivo

```bash
# Subir el archivo ZIP al servidor
scp vervoer.zip usuario@tu-servidor:/ruta/destino/

# Conectar al servidor
ssh usuario@tu-servidor

# Navegar al directorio
cd /ruta/destino/

# Extraer el archivo
unzip vervoer.zip

# Entrar al directorio
cd vervoer/
```

### 2. Configurar permisos

```bash
# Hacer ejecutables los scripts
chmod +x start.sh db-manager.sh

# Dar permisos de escritura
chmod 755 .
```

### 3. Instalar dependencias del sistema

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Reiniciar sesión para aplicar cambios de grupo
exit
# Reconectar al servidor
ssh usuario@tu-servidor
cd /ruta/destino/vervoer/
```

## 🚀 Despliegue Automático

### Ejecutar el script de inicio

```bash
# Ejecutar el script de despliegue
./start.sh
```

El script automáticamente:
- ✅ Verifica e instala dependencias
- 🐘 Configura PostgreSQL con Docker
- 🔧 Genera el cliente de Prisma
- 🔄 Ejecuta migraciones de base de datos
- 🌱 Sembra datos iniciales
- 🏗️ Construye la aplicación
- 🚀 Inicia la aplicación con PM2

## 🗄️ Gestión de Base de Datos

### Script de gestión

```bash
# Ejecutar el gestor de base de datos
./db-manager.sh
```

**Opciones disponibles:**
1. 📊 Ver estado de la base de datos
2. 🔧 Generar cliente de Prisma
3. 🔄 Ejecutar migraciones
4. 🌱 Sembrar datos iniciales
5. 📋 Ver tablas de la base de datos
6. 👥 Ver usuarios en la base de datos
7. 📄 Ver documentos en la base de datos
8. 🏪 Ver proveedores en la base de datos
9. 📊 Ver estadísticas de la base de datos
10. 🗑️ Resetear base de datos (¡CUIDADO!)
11. 📝 Abrir PgAdmin en el navegador
12. 🔍 Ver logs de PostgreSQL
13. 🚀 Reiniciar servicios de base de datos
14. 📤 Hacer backup de la base de datos
15. 📥 Restaurar backup de la base de datos

### Comandos manuales de base de datos

```bash
# Ver logs de PostgreSQL
docker logs vervoer_postgres

# Conectar a PostgreSQL
docker exec -it vervoer_postgres psql -U vervoer_user -d vervoer_db

# Reiniciar PostgreSQL
docker-compose restart postgres

# Parar PostgreSQL
docker-compose stop postgres

# Iniciar PostgreSQL
docker-compose up -d postgres
```

## 🔧 Configuración Manual

### Variables de entorno (.env.local)

```bash
# Editar configuración
nano .env.local
```

**Configuración requerida:**
```env
# API Keys
HOLDED_API_KEY=tu-holded-api-key
OPENAI_API_KEY=tu-openai-api-key

# Base de datos
DATABASE_URL="postgresql://vervoer_user:vervoer_password@localhost:5432/vervoer_db"

# JWT
JWT_SECRET=tu-jwt-secret-super-seguro

# Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### Docker Compose

El archivo `docker-compose.yml` se crea automáticamente con:
- **PostgreSQL 15**: Base de datos principal
- **PgAdmin 4**: Interfaz web para gestión de BD

**Acceso a PgAdmin:**
- URL: http://tu-servidor:5050
- Email: admin@vervoer.com
- Contraseña: admin123

## 📊 Monitoreo y Mantenimiento

### PM2 (Gestión de procesos)

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs
pm2 logs vervoer

# Reiniciar aplicación
pm2 restart vervoer

# Detener aplicación
pm2 stop vervoer

# Monitoreo en tiempo real
pm2 monit
```

### Logs del sistema

```bash
# Logs de la aplicación
pm2 logs vervoer --lines 100

# Logs de PostgreSQL
docker logs vervoer_postgres --tail 100

# Logs del sistema
sudo journalctl -u docker.service -f
```

## 🔄 Actualizaciones

### Actualizar la aplicación

```bash
# Detener la aplicación
pm2 stop vervoer

# Hacer backup de la base de datos
./db-manager.sh
# Seleccionar opción 14 (Backup)

# Extraer nueva versión
unzip nueva-version.zip
cd nueva-version/

# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:push

# Construir aplicación
npm run build

# Iniciar aplicación
pm2 start npm --name "vervoer" -- start
```

## 🚨 Solución de Problemas

### Problemas comunes

**1. Puerto 3000 ocupado**
```bash
# Ver qué está usando el puerto
sudo netstat -tlnp | grep :3000

# Matar proceso
sudo kill -9 PID
```

**2. PostgreSQL no inicia**
```bash
# Ver logs de Docker
docker-compose logs postgres

# Verificar estado del contenedor
docker ps -a

# Reiniciar contenedor
docker-compose restart postgres
```

**3. Error de permisos**
```bash
# Dar permisos al directorio
sudo chown -R $USER:$USER .

# Dar permisos de ejecución
chmod +x *.sh
```

**4. Error de memoria**
```bash
# Ver uso de memoria
free -h

# Ver procesos que consumen más memoria
ps aux --sort=-%mem | head -10
```

### Logs de error

```bash
# Logs de la aplicación
pm2 logs vervoer --err

# Logs de PostgreSQL
docker logs vervoer_postgres 2>&1 | grep ERROR

# Logs del sistema
sudo dmesg | grep -i error
```

## 📱 Acceso a la Aplicación

### URLs de acceso

- **Aplicación**: http://tu-servidor:3000
- **PgAdmin**: http://tu-servidor:5050
- **API**: http://tu-servidor:3000/api

### Usuario por defecto

- **Email**: admin@vervoer.com
- **Contraseña**: admin123
- **Rol**: ADMIN

## 🔒 Seguridad

### Cambiar contraseñas por defecto

```bash
# Conectar a PostgreSQL
docker exec -it vervoer_postgres psql -U vervoer_user -d vervoer_db

# Cambiar contraseña de usuario admin
UPDATE users SET password = crypt('nueva-contraseña', gen_salt('bf')) WHERE email = 'admin@vervoer.com';

# Cambiar contraseña de PgAdmin (editar docker-compose.yml)
nano docker-compose.yml
# Cambiar PGADMIN_DEFAULT_PASSWORD
```

### Firewall

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3000
sudo ufw allow 5432
sudo ufw allow 5050
sudo ufw status
```

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. ✅ Verifica los logs con `./db-manager.sh`
2. 🔍 Revisa la configuración en `.env.local`
3. 🐘 Verifica que PostgreSQL esté funcionando
4. 📝 Consulta los logs de PM2 y Docker
5. 🔄 Intenta reiniciar los servicios

---

**¡Vervoer está listo para procesar documentos! 🎉**
