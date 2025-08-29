# 🚀 Guía de Despliegue Manual - Vervoer

## 📋 Requisitos del Servidor

### **Sistema Operativo:**
- Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- Windows Server 2019+

### **Software Requerido:**
- Node.js 18.x o superior
- npm 9.x o superior
- PM2 (para gestión de procesos)

## 🔧 Instalación en el Servidor

### **1. Instalar Node.js:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar instalación
node --version
npm --version
```

### **2. Instalar PM2:**
```bash
npm install -g pm2
```

### **3. Subir Archivos:**
```bash
# Crear directorio de la aplicación
mkdir -p /var/www/vervoer
cd /var/www/vervoer

# Subir todos los archivos del proyecto
# (puedes usar scp, rsync, o subir por FTP)
```

### **4. Instalar Dependencias:**
```bash
cd /var/www/vervoer
npm install --production
```

## ⚙️ Configuración

### **1. Variables de Entorno:**
Crear archivo `.env.local` en la raíz del proyecto:
```env
# API Keys
OPENAI_API_KEY=tu_api_key_de_openai
HOLDED_API_KEY=d2e52f08894f3322cdf43d4e58c0d909

# NextAuth
NEXTAUTH_SECRET=tu_secret_muy_seguro_aqui
NEXTAUTH_URL=https://tu-dominio.com

# Configuración del servidor
PORT=3000
NODE_ENV=production
```

### **2. Configurar Nginx (Recomendado):**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

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

## 🚀 Iniciar la Aplicación

### **Opción 1: Con PM2 (Recomendado):**
```bash
cd /var/www/vervoer
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### **Opción 2: Directamente con npm:**
```bash
cd /var/www/vervoer
npm start
```

### **Opción 3: Con Node directamente:**
```bash
cd /var/www/vervoer
node server.js
```

## 📊 Gestión de la Aplicación

### **Comandos PM2 Útiles:**
```bash
# Ver estado de la aplicación
pm2 status

# Ver logs
pm2 logs vervoer

# Reiniciar aplicación
pm2 restart vervoer

# Detener aplicación
pm2 stop vervoer

# Eliminar aplicación
pm2 delete vervoer
```

### **Monitoreo:**
```bash
# Dashboard de PM2
pm2 monit

# Ver uso de recursos
pm2 show vervoer
```

## 🔒 Seguridad

### **1. Firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### **2. SSL/HTTPS:**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com
```

## 📁 Estructura de Archivos

```
/var/www/vervoer/
├── .next/                 # Build de producción
├── node_modules/          # Dependencias
├── public/               # Archivos estáticos
├── src/                  # Código fuente
├── .env.local           # Variables de entorno
├── ecosystem.config.js   # Configuración PM2
├── package.json         # Dependencias
└── next.config.js       # Configuración Next.js
```

## 🔧 Troubleshooting

### **Problemas Comunes:**

1. **Error de puerto en uso:**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **Error de permisos:**
   ```bash
   sudo chown -R www-data:www-data /var/www/vervoer
   sudo chmod -R 755 /var/www/vervoer
   ```

3. **Error de memoria:**
   ```bash
   # Aumentar memoria para Node.js
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

4. **Logs de errores:**
   ```bash
   pm2 logs vervoer --lines 100
   tail -f /var/log/nginx/error.log
   ```

## 📞 Soporte

Si tienes problemas durante el despliegue:
1. Revisa los logs: `pm2 logs vervoer`
2. Verifica las variables de entorno
3. Confirma que Node.js 18+ está instalado
4. Verifica que el puerto 3000 esté disponible

---

**¡Tu aplicación Vervoer está lista para producción! 🎉** 