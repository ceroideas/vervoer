# Vervoer - Sistema de Gestión Documental

## 📋 Descripción del Proyecto

Vervoer es un sistema de gestión documental desarrollado con **Next.js 15** y **React** que permite automatizar el procesamiento de facturas y albaranes mediante OCR y integración con APIs externas.

## 🎯 Objetivos del Proyecto

- **Automatizar el registro** de albaranes y facturas
- **Eliminar errores** derivados de la introducción manual
- **Automatizar la actualización** de precios y referencias de producto
- **Detectar automáticamente** sobreprecios y controlar el coste de compra
- **Mantener el stock actualizado** en tiempo real

## 🚀 Estado Actual del Sistema

### ✅ **Funcionalidades Implementadas**

1. **Sistema de Autenticación**
   - Login con credenciales
   - Protección de rutas
   - Contexto de autenticación

2. **Panel de Administración**
   - Dashboard básico
   - Interfaz de usuario moderna
   - Navegación responsive

3. **Estructura Base**
   - Componentes UI reutilizables
   - Layout administrativo
   - Sistema de rutas

### 🔄 **Funcionalidades Pendientes**

1. **Sistema OCR**
   - Procesamiento de documentos
   - Extracción de texto
   - Análisis de datos estructurados

2. **Integración Holded**
   - API de productos
   - API de proveedores
   - API de facturas/albaranes

3. **Gestión de Documentos**
   - Subida de archivos
   - Procesamiento automático
   - Revisión manual

4. **Base de Datos**
   - Persistencia de datos
   - Gestión de usuarios
   - Historial de documentos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Autenticación**: Context API (simulado)
- **OCR**: Tesseract.js (pendiente)
- **APIs**: Holded API (pendiente)

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd vervoer
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🔐 Acceso al Sistema

### Credenciales de Prueba

- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Rutas Principales

- **Login**: `/login`
- **Dashboard**: `/admin`
- **Página Principal**: `/`

## 📁 Estructura del Proyecto

```
vervoer/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx          # Dashboard principal
│   │   ├── login/
│   │   │   └── page.tsx          # Página de login
│   │   ├── api/                  # APIs (pendientes)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminLayout.tsx   # Layout administrativo
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx # Protección de rutas
│   │   └── ui/                   # Componentes UI
│   ├── contexts/
│   │   └── AuthContext.tsx       # Contexto de autenticación
│   └── utils/
│       └── cn.ts                 # Utilidades CSS
├── public/                       # Archivos estáticos
└── package.json
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env.local`:

```env
# Configuración de la aplicación
NEXT_PUBLIC_APP_NAME=Vervoer
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API Keys (pendientes)
HOLDED_API_KEY=your_holded_api_key
HOLDED_BASE_URL=https://api.holded.com/api/v1
```

## 🚀 Próximos Pasos

### Fase 1: Sistema OCR
- [ ] Implementar Tesseract.js
- [ ] Crear API de procesamiento OCR
- [ ] Desarrollar interfaz de subida de archivos
- [ ] Extracción de datos estructurados

### Fase 2: Integración Holded
- [ ] Configurar API de Holded
- [ ] Implementar gestión de productos
- [ ] Implementar gestión de proveedores
- [ ] Crear documentos en Holded

### Fase 3: Base de Datos
- [ ] Configurar base de datos
- [ ] Implementar persistencia
- [ ] Gestión de usuarios
- [ ] Historial de documentos

### Fase 4: Funcionalidades Avanzadas
- [ ] Alertas de precios
- [ ] Gestión de stock
- [ ] Reportes y estadísticas
- [ ] Notificaciones

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de dependencias**
   ```bash
   npm install
   npm run dev
   ```

2. **Error de puerto ocupado**
   ```bash
   # Cambiar puerto en package.json
   "dev": "next dev -p 3001"
   ```

3. **Error de TypeScript**
   ```bash
   npm run build
   ```

## 📝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto:

- **Email**: soporte@vervoer.com
- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]

---

**Desarrollado con ❤️ para Vervoer**
