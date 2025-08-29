# 🚀 Guía de Despliegue - Sitio Estático Vervoer

## ✅ **Compilación Exitosa**

Tu sitio estático ha sido compilado exitosamente en la carpeta `out/`. 

## 📁 **Estructura del Sitio Estático**

```
out/
├── index.html              # Página principal
├── .htaccess              # Configuración Apache
├── favicon.ico            # Icono del sitio
├── admin/                 # Sección de administración
│   ├── index.html
│   ├── documents/
│   ├── holded/
│   ├── settings/
│   └── users/
├── login/                 # Página de login
│   └── index.html
├── api/                   # APIs (funcionan como estáticas)
│   ├── holded/
│   ├── ocr/
│   └── test/
└── _next/                 # Archivos estáticos de Next.js
    └── static/
        ├── css/
        └── js/
```

## 🌐 **Opciones de Despliegue**

### **1. Hosting Web Tradicional (Apache/Nginx)**

#### **Para Apache:**
1. **Subir archivos**: Copia TODO el contenido de la carpeta `out/` a la raíz de tu servidor web
2. **Configuración**: El archivo `.htaccess` ya está incluido y configurado
3. **Verificar**: Asegúrate de que `mod_rewrite` esté habilitado en Apache

#### **Para Nginx:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/html;
    index index.html;

    # Manejo de rutas para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configuración para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **2. Servicios de Hosting Gratuito**

#### **Netlify:**
1. **Crear cuenta** en [netlify.com](https://netlify.com)
2. **Drag & Drop**: Arrastra la carpeta `out/` al área de deploy
3. **Configurar dominio**: Asigna tu dominio personalizado

#### **Vercel:**
1. **Crear cuenta** en [vercel.com](https://vercel.com)
2. **Importar proyecto**: Conecta tu repositorio de GitHub
3. **Configurar build**: 
   - Build Command: `npm run build`
   - Output Directory: `out`

#### **GitHub Pages:**
1. **Crear repositorio** en GitHub
2. **Subir archivos**: Sube el contenido de `out/` a la rama `gh-pages`
3. **Configurar**: Activa GitHub Pages en la configuración del repositorio

### **3. CDN/Cloud Storage**

#### **AWS S3 + CloudFront:**
1. **Crear bucket** en S3
2. **Subir archivos**: Sube todo el contenido de `out/`
3. **Configurar CloudFront**: Para distribución global

#### **Google Cloud Storage:**
1. **Crear bucket** en GCS
2. **Subir archivos**: Sube el contenido de `out/`
3. **Configurar dominio**: Asigna tu dominio personalizado

## 🔧 **Configuración Post-Despliegue**

### **Variables de Entorno (si usas APIs externas):**
```env
# Configurar en tu hosting o en el servidor
OPENAI_API_KEY=tu_api_key_de_openai
HOLDED_API_KEY=d2e52f08894f3322cdf43d4e58c0d909
```

### **SSL/HTTPS:**
- **Let's Encrypt**: Para certificados gratuitos
- **Cloudflare**: Para SSL gratuito y CDN
- **Certbot**: Para configuración automática

## 📊 **Verificación del Despliegue**

### **URLs a Verificar:**
- ✅ `https://tu-dominio.com/` (página principal)
- ✅ `https://tu-dominio.com/admin/` (dashboard admin)
- ✅ `https://tu-dominio.com/admin/documents/` (documentos)
- ✅ `https://tu-dominio.com/admin/holded/` (integración Holded)
- ✅ `https://tu-dominio.com/admin/users/` (usuarios)
- ✅ `https://tu-dominio.com/login/` (login)

### **Funcionalidades a Probar:**
- ✅ Navegación entre páginas
- ✅ Formularios de login
- ✅ Interfaz de administración
- ✅ Integración con Holded (si está configurada)

## ⚠️ **Limitaciones del Sitio Estático**

### **Funcionalidades que NO funcionan:**
- ❌ Subida de archivos (requiere servidor)
- ❌ Procesamiento de OCR en tiempo real
- ❌ APIs dinámicas que requieren servidor
- ❌ Autenticación con sesiones del servidor

### **Funcionalidades que SÍ funcionan:**
- ✅ Interfaz de usuario completa
- ✅ Navegación entre páginas
- ✅ Formularios (con APIs externas)
- ✅ Integración con Holded (si las APIs están disponibles)
- ✅ Visualización de datos

## 🚀 **Comandos Útiles**

### **Para Recompilar:**
```bash
# Limpiar build anterior
rm -rf out/

# Recompilar
npm run build

# Verificar que se creó la carpeta out
ls -la out/
```

### **Para Servir Localmente (pruebas):**
```bash
# Con Python
cd out/
python -m http.server 8000

# Con Node.js
npx serve out/

# Con PHP
cd out/
php -S localhost:8000
```

## 📞 **Soporte**

### **Problemas Comunes:**

1. **Error 404 en rutas anidadas:**
   - Verifica que el `.htaccess` esté en la raíz
   - Confirma que `mod_rewrite` esté habilitado

2. **Archivos no se cargan:**
   - Verifica las rutas de los archivos estáticos
   - Confirma que los permisos sean correctos

3. **APIs no funcionan:**
   - Las APIs requieren un servidor Node.js
   - Considera usar servicios externos para las APIs

---

## 🎉 **¡Tu sitio estático está listo para producción!**

**Carpeta a subir**: `out/` (todo el contenido)

**Tamaño total**: ~100 MB (incluyendo dependencias)

**Compatibilidad**: Funciona en cualquier servidor web estático
