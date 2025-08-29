# 🗄️ Configuración de Base de Datos PostgreSQL - Vervoer

## 📋 Requisitos Previos

### 1. **PostgreSQL Instalado**
- **Windows**: Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt install postgresql postgresql-contrib`

### 2. **Node.js y npm**
- Node.js 18+ instalado
- npm o yarn

## 🚀 Configuración Paso a Paso

### **Paso 1: Crear Base de Datos**

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE vervoer_db;

# Crear usuario (opcional)
CREATE USER vervoer_user WITH PASSWORD 'tu_contraseña_segura';

# Dar permisos
GRANT ALL PRIVILEGES ON DATABASE vervoer_db TO vervoer_user;

# Salir
\q
```

### **Paso 2: Configurar Variables de Entorno**

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Configuración de la base de datos PostgreSQL
DATABASE_URL="postgresql://vervoer_user:tu_contraseña_segura@localhost:5432/vervoer_db"

# Configuración de JWT
JWT_SECRET="tu-secret-key-muy-seguro-aqui-cambiar-en-produccion"

# API Keys
HOLDED_API_KEY="d2e52f08894f3322cdf43d4e58c0d909"
OPENAI_API_KEY="tu-openai-api-key-aqui"

# Configuración de la aplicación
NODE_ENV="development"
NEXT_PUBLIC_APP_NAME="Vervoer"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Paso 3: Generar Cliente Prisma**

```bash
npm run db:generate
```

### **Paso 4: Crear Tablas en Base de Datos**

```bash
# Opción A: Push directo (desarrollo)
npm run db:push

# Opción B: Migración (producción)
npm run db:migrate
```

### **Paso 5: Inicializar Datos**

```bash
npm run db:seed
```

## 🔐 Credenciales de Acceso

Después de ejecutar el script de inicialización, tendrás estos usuarios:

### **Administrador**
- **Email**: `admin@vervoer.com`
- **Contraseña**: `admin123`
- **Rol**: `ADMIN`

### **Usuario Normal**
- **Email**: `usuario@vervoer.com`
- **Contraseña**: `usuario123`
- **Rol**: `USER`

### **Visualizador**
- **Email**: `viewer@vervoer.com`
- **Contraseña**: `viewer123`
- **Rol**: `VIEWER`

## 🛠️ Comandos Útiles

### **Desarrollo**
```bash
# Generar cliente Prisma
npm run db:generate

# Sincronizar esquema con base de datos
npm run db:push

# Abrir Prisma Studio (interfaz visual)
npm run db:studio

# Ejecutar seed de datos
npm run db:seed
```

### **Producción**
```bash
# Crear migración
npm run db:migrate

# Aplicar migraciones
npx prisma migrate deploy

# Generar cliente para producción
npx prisma generate
```

## 📊 Estructura de la Base de Datos

### **Tablas Principales**

1. **users** - Usuarios del sistema
2. **documents** - Documentos procesados (facturas/albaranes)
3. **suppliers** - Proveedores
4. **document_items** - Items de cada documento
5. **products** - Productos (sincronizados con Holded)
6. **user_sessions** - Sesiones de usuario

### **Relaciones**
- Un usuario puede tener muchos documentos
- Un documento pertenece a un proveedor
- Un documento tiene muchos items
- Los items pueden estar relacionados con productos

## 🔧 Solución de Problemas

### **Error de Conexión**
```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U postgres -d vervoer_db
```

### **Error de Permisos**
```bash
# Dar permisos completos al usuario
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vervoer_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vervoer_user;
```

### **Resetear Base de Datos**
```bash
# Eliminar y recrear base de datos
DROP DATABASE vervoer_db;
CREATE DATABASE vervoer_db;

# Volver a ejecutar setup
npm run db:push
npm run db:seed
```

## 🚀 Despliegue en Producción

### **Variables de Entorno de Producción**
```env
DATABASE_URL="postgresql://usuario:contraseña@servidor:5432/vervoer_db"
JWT_SECRET="secret-muy-seguro-y-único"
NODE_ENV="production"
```

### **Migración de Datos**
```bash
# Crear migración
npx prisma migrate dev --name init

# Aplicar en producción
npx prisma migrate deploy
```

## 📈 Monitoreo

### **Prisma Studio**
```bash
npm run db:studio
```
Accede a `http://localhost:5555` para ver y editar datos visualmente.

### **Logs de Base de Datos**
```bash
# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔒 Seguridad

### **Recomendaciones**
1. Cambiar contraseñas por defecto
2. Usar JWT_SECRET único y seguro
3. Configurar SSL en producción
4. Limitar acceso a la base de datos
5. Hacer backups regulares

### **Backup**
```bash
# Crear backup
pg_dump -U postgres vervoer_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres vervoer_db < backup_20241201.sql
```

---

**¡Tu base de datos está lista! 🎉**

Ahora puedes ejecutar `npm run dev` y acceder al sistema con las credenciales proporcionadas.
