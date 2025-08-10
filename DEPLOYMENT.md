# Guía de Despliegue - Vervoer

## Problema Resuelto

Este proyecto usa Next.js con `output: 'export'` para generar un sitio estático. Los problemas de navegación (404 en rutas como `/admin/users`) se han solucionado con las siguientes configuraciones.

## Configuración del Proyecto

### 1. next.config.ts
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,  // Importante para rutas estáticas
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
```

### 2. Rutas con trailing slash
Todas las rutas en el AdminLayout ahora terminan con `/`:
- `/admin/` (en lugar de `/admin`)
- `/admin/users/` (en lugar de `/admin/users`)
- `/admin/documents/` (en lugar de `/admin/documents`)
- `/admin/settings/` (en lugar de `/admin/settings`)

## Despliegue

### Opción 1: Apache (.htaccess)
El archivo `.htaccess` ya está configurado en `public/.htaccess` y se copiará automáticamente a la carpeta `out/`.

### Opción 2: Nginx
Usa la configuración de ejemplo en `nginx.conf`.

### Pasos para el despliegue:

1. **Construir el proyecto:**
   ```bash
   npm run build
   ```

2. **Verificar la carpeta `out/`:**
   - Debe contener `index.html`
   - Debe contener `admin/index.html`
   - Debe contener `.htaccess`

3. **Subir archivos al servidor:**
   - Copia TODO el contenido de la carpeta `out/` a la raíz de tu servidor web
   - Asegúrate de que el archivo `.htaccess` esté en la raíz

4. **Configurar el servidor:**
   - Para Apache: El `.htaccess` se aplicará automáticamente
   - Para Nginx: Usa la configuración de `nginx.conf`

## Verificación

Después del despliegue, verifica que funcionen estas URLs:
- ✅ `https://estamostrabajando.site/` (página principal)
- ✅ `https://estamostrabajando.site/admin/` (dashboard admin)
- ✅ `https://estamostrabajando.site/admin/users/` (usuarios)
- ✅ `https://estamostrabajando.site/admin/documents/` (documentos)
- ✅ `https://estamostrabajando.site/admin/settings/` (configuración)

## Solución de Problemas

### Error 404 en rutas anidadas
- Verifica que el `.htaccess` esté en la raíz del servidor
- Asegúrate de que Apache tenga habilitado `mod_rewrite`
- Para Nginx, verifica que la configuración incluya `try_files`

### Error 403
- Verifica los permisos de archivos en el servidor
- Asegúrate de que el servidor web tenga acceso de lectura a todos los archivos

### Navegación no funciona
- Verifica que las rutas terminen con `/`
- Asegúrate de que el JavaScript se esté cargando correctamente
- Revisa la consola del navegador para errores

## Estructura de Archivos Esperada

```
out/
├── index.html
├── .htaccess
├── admin/
│   ├── index.html
│   ├── users/
│   │   └── index.html
│   ├── documents/
│   │   └── index.html
│   └── settings/
│       └── index.html
└── _next/
    └── static/
        ├── css/
        └── js/
```

## Notas Importantes

- **No uses `npm start`** después del build, ya que este comando es para desarrollo
- El sitio es completamente estático, no necesita Node.js en producción
- Todas las rutas deben terminar con `/` para compatibilidad con export estático
- El archivo `.htaccess` es crucial para el funcionamiento de las rutas 