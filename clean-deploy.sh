#!/bin/bash

# 🧹 Script de Limpieza para Despliegue Fresco - Vervoer
# Este script limpia completamente el entorno para un nuevo despliegue

echo "🧹 Limpieza completa del entorno Vervoer"
echo "======================================="
echo ""
echo "⚠️  ¡ADVERTENCIA! Este script eliminará:"
echo "   - Todos los contenedores Docker"
echo "   - Todos los volúmenes de base de datos"
echo "   - La aplicación PM2"
echo "   - Archivos de construcción"
echo "   - Logs y archivos temporales"
echo ""

read -p "¿Estás seguro de que quieres continuar? Escribe 'LIMPIAR' para confirmar: " confirmation

if [ "$confirmation" != "LIMPIAR" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

echo ""
echo "🚀 Iniciando limpieza completa..."

# 1. Detener y eliminar aplicación PM2
echo "🛑 Deteniendo aplicación PM2..."
pm2 stop vervoer 2>/dev/null || true
pm2 delete vervoer 2>/dev/null || true
pm2 stop vervoer-dev 2>/dev/null || true
pm2 delete vervoer-dev 2>/dev/null || true
pm2 save
echo "✅ PM2 limpiado"

# 2. Detener y eliminar contenedores Docker
echo "🐳 Deteniendo contenedores Docker..."
docker-compose down -v 2>/dev/null || true
docker stop vervoer_postgres 2>/dev/null || true
docker stop vervoer_pgadmin 2>/dev/null || true
docker rm vervoer_postgres 2>/dev/null || true
docker rm vervoer_pgadmin 2>/dev/null || true
echo "✅ Contenedores Docker detenidos"

# 3. Eliminar volúmenes de base de datos
echo "🗄️  Eliminando volúmenes de base de datos..."
docker volume rm vervoer_postgres_data 2>/dev/null || true
docker volume prune -f
echo "✅ Volúmenes eliminados"

# 4. Eliminar redes Docker
echo "🌐 Eliminando redes Docker..."
docker network rm vervoer_vervoer_network 2>/dev/null || true
docker network prune -f
echo "✅ Redes eliminadas"

# 5. Limpiar archivos de construcción y dependencias
echo "📁 Limpiando archivos de construcción..."
rm -rf .next/
rm -rf out/
rm -rf node_modules/
rm -rf .prisma/
rm -f package-lock.json
echo "✅ Archivos de construcción eliminados"

# 6. Limpiar logs y archivos temporales
echo "📝 Limpiando logs y archivos temporales..."
rm -f *.log
rm -f vervoer_backup_*.sql
rm -rf .pm2/
echo "✅ Logs y archivos temporales eliminados"

# 7. Limpiar imágenes Docker no utilizadas
echo "🖼️  Limpiando imágenes Docker no utilizadas..."
docker image prune -f
docker system prune -f
echo "✅ Imágenes Docker limpiadas"

# 8. Verificar limpieza
echo ""
echo "🔍 Verificando limpieza..."

# Verificar que no hay contenedores corriendo
if docker ps | grep -q "vervoer"; then
    echo "⚠️  Advertencia: Algunos contenedores siguen corriendo"
    docker ps | grep "vervoer"
else
    echo "✅ No hay contenedores Vervoer corriendo"
fi

# Verificar que no hay volúmenes
if docker volume ls | grep -q "vervoer"; then
    echo "⚠️  Advertencia: Algunos volúmenes Vervoer siguen existiendo"
    docker volume ls | grep "vervoer"
else
    echo "✅ No hay volúmenes Vervoer"
fi

# Verificar que no hay redes
if docker network ls | grep -q "vervoer"; then
    echo "⚠️  Advertencia: Algunas redes Vervoer siguen existiendo"
    docker network ls | grep "vervoer"
else
    echo "✅ No hay redes Vervoer"
fi

# Verificar que no hay procesos PM2
if pm2 list | grep -q "vervoer"; then
    echo "⚠️  Advertencia: Algunos procesos PM2 siguen existiendo"
    pm2 list | grep "vervoer"
else
    echo "✅ No hay procesos PM2 de Vervoer"
fi

echo ""
echo "🎉 ¡Limpieza completada!"
echo ""
echo "📋 Para hacer un nuevo despliegue:"
echo "   1. Ejecuta: ./start.sh"
echo "   2. O ejecuta: ./db-manager.sh para gestión de BD"
echo ""
echo "🔧 Archivos que se recrearán automáticamente:"
echo "   - .env.local (configuración)"
echo "   - docker-compose.yml (PostgreSQL + PgAdmin)"
echo "   - init-db.sql (inicialización de BD)"
echo "   - node_modules/ (dependencias)"
echo "   - .next/ (aplicación construida)"
echo ""
echo "💡 Consejo: Revisa el archivo .env.local antes de ejecutar start.sh"
echo "   para configurar tus API keys y secretos."
