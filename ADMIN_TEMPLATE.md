# Plantilla Administrativa - Vervoer

## Descripción

Esta plantilla administrativa proporciona una interfaz moderna y funcional para gestionar el sistema Vervoer. Incluye un dashboard completo, gestión de usuarios, configuración del sistema y más.

## Características

### 🎨 Diseño Moderno
- Interfaz limpia y profesional
- Diseño responsive (móvil y desktop)
- Tema claro con soporte para modo oscuro
- Iconos de Lucide React
- Componentes reutilizables

### 📊 Dashboard
- Estadísticas en tiempo real
- Gráficos de métricas importantes
- Actividad reciente de usuarios
- Acciones rápidas
- Cards informativas

### 👥 Gestión de Usuarios
- Lista completa de usuarios
- Filtros y búsqueda
- Estados de usuario (Activo/Inactivo)
- Roles de usuario
- Acciones de edición y eliminación

### 📄 Procesamiento de Documentos
- OCR para imágenes y PDFs
- Historial de documentos procesados
- Descarga de texto extraído
- Copia al portapapeles
- Gestión de archivos

### ⚙️ Configuración del Sistema
- Configuración general
- Configuración de seguridad
- Configuración de notificaciones
- Configuración de base de datos
- Personalización de apariencia

## Estructura de Archivos

```
src/
├── components/
│   ├── admin/
│   │   └── AdminLayout.tsx          # Layout principal administrativo
│   └── ui/
│       ├── button.tsx               # Componente Button
│       └── card.tsx                 # Componentes Card
├── app/
│   ├── page.tsx                     # Página principal (landing)
│   └── admin/
│       ├── page.tsx                 # Dashboard principal
│       ├── users/
│       │   └── page.tsx             # Gestión de usuarios
│       ├── documents/
│       │   └── page.tsx             # Procesamiento OCR
│       └── settings/
│           └── page.tsx             # Configuración del sistema
└── utils/
    └── cn.ts                        # Utilidad para clases CSS
```

## Páginas Disponibles

### 1. Dashboard (`/admin`)
- Estadísticas del sistema
- Métricas de rendimiento
- Actividad reciente
- Acciones rápidas

### 2. Gestión de Usuarios (`/admin/users`)
- Lista de usuarios
- Filtros y búsqueda
- Gestión de roles
- Estados de usuario

### 3. Documentos (`/admin/documents`)
- Procesamiento OCR de imágenes y PDFs
- Historial de documentos procesados
- Descarga y copia de texto extraído
- Gestión de archivos procesados

### 4. Configuración (`/admin/settings`)
- Configuración general
- Seguridad
- Notificaciones
- Base de datos
- Apariencia

## Componentes Principales

### AdminLayout
El componente principal que proporciona:
- Sidebar de navegación
- Header con búsqueda y notificaciones
- Área de contenido principal
- Diseño responsive

### Componentes UI
- **Button**: Botones con diferentes variantes y tamaños
- **Card**: Contenedores para organizar contenido
- **Input**: Campos de entrada estilizados

## Tecnologías Utilizadas

- **Next.js 15**: Framework de React
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Framework de CSS
- **Lucide React**: Iconos modernos
- **clsx & tailwind-merge**: Utilidades para clases CSS

## Instalación y Uso

1. Las dependencias ya están instaladas en el proyecto
2. Las páginas están disponibles en las rutas `/admin/*`
3. El layout se aplica automáticamente a todas las páginas administrativas

## Personalización

### Colores
Los colores se pueden personalizar en `tailwind.config.js` y `globals.css`

### Navegación
Modifica el array `sidebarItems` en `AdminLayout.tsx` para cambiar los elementos del menú

### Componentes
Todos los componentes UI están en `src/components/ui/` y pueden ser extendidos según necesidades

## Próximos Pasos

1. **Autenticación**: Implementar sistema de login/logout
2. **Base de Datos**: Conectar con API real
3. **Formularios**: Añadir validación y manejo de estado
4. **Notificaciones**: Sistema de alertas en tiempo real
5. **Reportes**: Generación de reportes y exportación
6. **Auditoría**: Logs de actividad del sistema

## Contribución

Para añadir nuevas funcionalidades:
1. Crear nuevos componentes en `src/components/`
2. Añadir páginas en `src/app/admin/`
3. Actualizar la navegación en `AdminLayout.tsx`
4. Documentar cambios en este archivo 