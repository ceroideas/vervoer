#!/bin/bash

echo "🚀 Iniciando build del proyecto Vervoer..."

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf out/
rm -rf .next/

# Instalar dependencias si es necesario
echo "📦 Verificando dependencias..."
npm install

# Construir el proyecto
echo "🔨 Construyendo proyecto..."
npm run build

# Verificar que se generaron los archivos necesarios
echo "✅ Verificando archivos generados..."
if [ -d "out" ]; then
    echo "✅ Carpeta 'out' creada exitosamente"
    
    # Verificar archivos importantes
    if [ -f "out/index.html" ]; then
        echo "✅ index.html generado"
    fi
    
    if [ -d "out/admin" ]; then
        echo "✅ Carpeta admin generada"
        if [ -f "out/admin/index.html" ]; then
            echo "✅ admin/index.html generado"
        fi
    fi
    
    echo ""
    echo "🎉 Build completado exitosamente!"
    echo "📁 Los archivos están en la carpeta 'out/'"
    echo ""
    echo "📋 Para subir a tu servidor:"
    echo "   1. Copia todo el contenido de la carpeta 'out/' a tu servidor web"
    echo "   2. Asegúrate de que el archivo .htaccess esté en la raíz"
    echo "   3. Configura tu servidor para manejar las rutas SPA"
    echo ""
    echo "🌐 Tu sitio estará disponible en: https://estamostrabajando.site/"
    
else
    echo "❌ Error: No se generó la carpeta 'out'"
    exit 1
fi 