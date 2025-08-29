# 🚀 Guía de Despliegue - Vervoer en Servidor

## ✅ **Configuración Lista**

Tu proyecto está configurado para desplegarse en un servidor con Node.js y Nginx.

## 📋 **Requisitos del Servidor**

### **Software Necesario:**
- **Node.js** (versión 18 o superior)
- **npm** (incluido con Node.js)
- **PM2** (se instala automáticamente)
- **Nginx** (servidor web)
- **Git** (para clonar el repositorio)

### **Comandos de Instalación (Ubuntu/Debian):**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install nginx -y

# Instalar Git
sudo apt install git -y

# Verificar instalaciones
node --version
npm --version
nginx -v
```

## 🚀 **Pasos de Despliegue**

### **1. Preparar el Servidor**

```bash
# Crear directorio para la aplicación
sudo mkdir -p /var/www/vervoer
sudo chown $USER:$USER /var/www/vervoer
cd /var/www/vervoer
```

### **2. Subir Archivos**

#### **Opción A: Git (Recomendado)**
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/vervoer.git .
```

#### **Opción B: Subida Manual**
1. **Comprimir** tu proyecto localmente
2. **Subir** el archivo ZIP al servidor
3. **Descomprimir** en `/var/www/vervoer`

### **3. Instalar Dependencias**

```bash
# Instalar dependencias
npm install

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### **4. Configurar Variables de Entorno**

```bash
# Crear archivo .env.local
nano .env.local
```

**Contenido del archivo `.env.local`:**
```env
# Configuración de Vervoer
HOLDED_API_KEY=d2e52f08894f3322cdf43d4e58c0d909
OPENAI_API_KEY=tu-openai-api-key-aqui
NODE_ENV=production
```

### **5. Compilar la Aplicación**

```bash
# Compilar para producción
npm run build
```

### **6. Configurar Nginx**

```bash
# Copiar configuración de Nginx
sudo cp nginx.conf /etc/nginx/sites-available/vervoer

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/vervoer /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### **7. Iniciar la Aplicación**

```bash
# Dar permisos de ejecución al script
chmod +x start.sh

# Ejecutar script de inicio
./start.sh
```

## 🔧 **Configuración del Dominio**

### **1. Configurar DNS**

En tu proveedor de dominios, apunta `estamostrabajando.site` a la IP de tu servidor:

```
Tipo: A
Nombre: @
Valor: [IP-DE-TU-SERVIDOR]
TTL: 3600
```

### **2. Verificar Nginx**

La configuración de Nginx ya está preparada para tu dominio. Verifica que esté funcionando:

```bash
# Verificar estado de Nginx
sudo systemctl status nginx

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

## 📊 **Monitoreo y Gestión**

### **Comandos PM2 Útiles:**

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs vervoer

# Reiniciar aplicación
pm2 restart vervoer

# Detener aplicación
pm2 stop vervoer

# Iniciar aplicación
pm2 start vervoer

# Ver monitoreo
pm2 monit

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### **Comandos Nginx Útiles:**

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo nginx -s reload

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔒 **Configuración de SSL (HTTPS)**

### **1. Instalar Certbot**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### **2. Obtener Certificado SSL**

```bash
# Obtener certificado
sudo certbot --nginx -d estamostrabajando.site -d www.estamostrabajando.site

# Renovar automáticamente
sudo crontab -e
# Agregar esta línea:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### **3. Verificar HTTPS**

Después de obtener el certificado, tu sitio estará disponible en:
- `https://estamostrabajando.site`

## 🔄 **Actualizaciones**

### **Para Actualizar la Aplicación:**

```bash
# Entrar al directorio
cd /var/www/vervoer

# Obtener cambios (si usas Git)
git pull origin main

# Instalar nuevas dependencias
npm install

# Recompilar
npm run build

# Reiniciar aplicación
pm2 restart vervoer
```

### **Para Actualizar Nginx:**

```bash
# Editar configuración
sudo nano /etc/nginx/sites-available/vervoer

# Verificar configuración
sudo nginx -t

# Recargar
sudo nginx -s reload
```

## 🚨 **Solución de Problemas**

### **Problemas Comunes:**

1. **Aplicación no inicia:**
   ```bash
   # Ver logs de PM2
   pm2 logs vervoer
   
   # Verificar puerto
   sudo netstat -tlnp | grep :3000
   ```

2. **Nginx no funciona:**
   ```bash
   # Verificar configuración
   sudo nginx -t
   
   # Ver logs
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Dominio no resuelve:**
   ```bash
   # Verificar DNS
   nslookup estamostrabajando.site
   
   # Verificar firewall
   sudo ufw status
   ```

4. **Puerto 3000 bloqueado:**
   ```bash
   # Abrir puerto en firewall
   sudo ufw allow 3000
   ```

### **Logs Importantes:**

```bash
# Logs de la aplicación
pm2 logs vervoer

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs del sistema
sudo journalctl -u nginx
sudo journalctl -u pm2-root
```

## 📁 **Estructura de Archivos**

```
/var/www/vervoer/
├── .next/                 # Build de producción
├── node_modules/          # Dependencias
├── src/                   # Código fuente
├── public/                # Archivos públicos
├── package.json           # Configuración del proyecto
├── ecosystem.config.js    # Configuración PM2
├── nginx.conf            # Configuración Nginx
├── start.sh              # Script de inicio
└── .env.local            # Variables de entorno
```

## 🎯 **Verificación Final**

### **URLs a Verificar:**
- ✅ `http://estamostrabajando.site` (HTTP)
- ✅ `https://estamostrabajando.site` (HTTPS, después de SSL)
- ✅ `http://localhost:3000` (Directo al servidor)

### **Funcionalidades a Probar:**
- ✅ Navegación entre páginas
- ✅ Subida de archivos
- ✅ Procesamiento OCR
- ✅ Integración con Holded
- ✅ APIs funcionando

---

## 🎉 **¡Tu aplicación está lista para producción!**

**Dominio:** `estamostrabajando.site`

**Puerto:** 3000 (interno, no visible al usuario)

**Acceso:** Directo sin puerto en la URL
