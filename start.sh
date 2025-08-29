#!/bin/bash

# 🚀 Script de Inicio - Vervoer
# Este script inicia la aplicación en modo desarrollo

echo "🚀 Iniciando Vervoer en modo desarrollo..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Verificar si existe el archivo .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  Archivo .env.local no encontrado"
    echo "📝 Creando archivo .env.local con configuración básica..."
    cat > .env.local << EOF
# Configuración de Vervoer
HOLDED_API_KEY=d2e52f08894f3322cdf43d4e58c0d909
OPENAI_API_KEY=tu-openai-api-key-aqui
NODE_ENV=development
EOF
    echo "✅ Archivo .env.local creado"
    echo "⚠️  IMPORTANTE: Edita el archivo .env.local con tus API keys reales"
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias"
        exit 1
    fi
    echo "✅ Dependencias instaladas"
fi

# Detener procesos PM2 existentes
echo "🛑 Deteniendo procesos PM2 existentes..."
pm2 stop vervoer-dev 2>/dev/null || true
pm2 delete vervoer-dev 2>/dev/null || true
pm2 stop vervoer 2>/dev/null || true
pm2 delete vervoer 2>/dev/null || true

# Iniciar la aplicación con PM2 en modo desarrollo
echo "🚀 Iniciando aplicación con PM2 en modo desarrollo..."
pm2 start npm --name "vervoer-dev" -- run dev

# Verificar que la aplicación esté corriendo
sleep 5
if pm2 list | grep -q "vervoer-dev.*online"; then
    echo "✅ Aplicación iniciada correctamente en modo desarrollo"
    echo "📊 Estado de PM2:"
    pm2 list
    echo ""
    echo "🌐 La aplicación está disponible en:"
    echo "   - Local: http://localhost:3000"
    echo "   - Dominio: https://estamostrabajando.site"
    echo ""
    echo "📝 Comandos útiles:"
    echo "   - Ver logs: pm2 logs vervoer-dev"
    echo "   - Reiniciar: pm2 restart vervoer-dev"
    echo "   - Detener: pm2 stop vervoer-dev"
    echo "   - Estado: pm2 status"
    echo "   - Monitoreo: pm2 monit"
    echo ""
    echo "🔄 Modo desarrollo activo - Los cambios se recargan automáticamente"
else
    echo "❌ Error al iniciar la aplicación"
    pm2 logs vervoer-dev --lines 10
    exit 1
fi
