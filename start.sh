#!/bin/bash

# 🚀 Script de Inicio - Vervoer
# Este script inicia la aplicación y configura la base de datos PostgreSQL

echo "🚀 Iniciando Vervoer con configuración completa..."

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

# Verificar si Docker está instalado para PostgreSQL
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Instalando Docker..."
    # Instalar Docker en Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        echo "✅ Docker instalado. Por favor, reinicia la sesión y ejecuta el script nuevamente."
        exit 1
    else
        echo "❌ No se pudo instalar Docker automáticamente. Instálalo manualmente."
        exit 1
    fi
fi

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Crear archivo .env.local si no existe
if [ ! -f ".env.local" ]; then
    echo "📝 Creando archivo .env.local con configuración básica..."
    cat > .env.local << EOF
# Configuración de Vervoer
HOLDED_API_KEY=d2e52f08894f3322cdf43d4e58c0d909
OPENAI_API_KEY=tu-openai-api-key-aqui
NODE_ENV=production

# Configuración de Base de Datos PostgreSQL
DATABASE_URL="postgresql://vervoer_user:vervoer_password@localhost:5432/vervoer_db"

# Configuración de JWT
JWT_SECRET=tu-jwt-secret-super-seguro-aqui-cambiar-en-produccion

# Configuración del servidor
PORT=3000
HOST=0.0.0.0
EOF
    echo "✅ Archivo .env.local creado"
    echo "⚠️  IMPORTANTE: Edita el archivo .env.local con tus API keys reales"
fi

# Crear docker-compose.yml para PostgreSQL si no existe
if [ ! -f "docker-compose.yml" ]; then
    echo "🐘 Creando docker-compose.yml para PostgreSQL..."
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: vervoer_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: vervoer_db
      POSTGRES_USER: vervoer_user
      POSTGRES_PASSWORD: vervoer_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    networks:
      - vervoer_network

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: vervoer_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@vervoer.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - vervoer_network

volumes:
  postgres_data:

networks:
  vervoer_network:
    driver: bridge
EOF
    echo "✅ docker-compose.yml creado"
fi

# Crear script de inicialización de base de datos si no existe
if [ ! -f "init-db.sql" ]; then
    echo "📊 Creando script de inicialización de base de datos..."
    cat > init-db.sql << EOF
-- Script de inicialización de la base de datos Vervoer
-- Este script se ejecuta automáticamente al crear el contenedor

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear usuario admin por defecto si no existe
INSERT INTO users (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
    'admin_user',
    'admin@vervoer.com',
    'Administrador',
    '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8K8VQGi', -- password: admin123
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Crear configuración de alertas de precios por defecto
INSERT INTO price_alert_config (id, "maxPriceIncreasePercentage", "minDiscountPercentage", "maxDiscountPercentage", "criticalPriceIncreasePercentage", "enableAutomaticUpdates", "enablePriceHistory", "createdAt", "updatedAt")
VALUES (
    'default_config',
    10.0,
    15.0,
    60.0,
    25.0,
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents("userId");
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_supplier_id ON documents("supplierId");
CREATE INDEX IF NOT EXISTS idx_document_items_document_id ON document_items("documentId");
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions("userId");
CREATE INDEX IF NOT EXISTS idx_price_variations_product_id ON price_variations("productId");
CREATE INDEX IF NOT EXISTS idx_price_variations_created_at ON price_variations("createdAt");

-- Crear vistas útiles
CREATE OR REPLACE VIEW documents_summary AS
SELECT 
    d.id,
    d.filename,
    d."documentType",
    d.status,
    d."documentNumber",
    d."documentDate",
    d."totalAmount",
    u.name as "userName",
    s.name as "supplierName",
    d."createdAt"
FROM documents d
LEFT JOIN users u ON d."userId" = u.id
LEFT JOIN suppliers s ON d."supplierId" = s.id;

CREATE OR REPLACE VIEW price_variations_summary AS
SELECT 
    pv.id,
    pv."productName",
    pv."supplierName",
    pv."oldPrice",
    pv."newPrice",
    pv."variationPercentage",
    pv."alertType",
    pv.severity,
    pv."documentNumber",
    pv."documentDate",
    pv."isProcessed"
FROM price_variations pv
ORDER BY pv."createdAt" DESC;
EOF
    echo "✅ Script de inicialización de base de datos creado"
fi

# Iniciar PostgreSQL con Docker
echo "🐘 Iniciando PostgreSQL con Docker..."
docker-compose up -d postgres

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 10

# Verificar que PostgreSQL esté funcionando
if ! docker exec vervoer_postgres pg_isready -U vervoer_user -d vervoer_db; then
    echo "❌ Error: PostgreSQL no está funcionando correctamente"
    docker-compose logs postgres
    exit 1
fi

echo "✅ PostgreSQL está funcionando correctamente"

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

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo "❌ Error generando cliente de Prisma"
    exit 1
fi

# Ejecutar migraciones de base de datos
echo "🔄 Ejecutando migraciones de base de datos..."
npm run db:push
if [ $? -ne 0 ]; then
    echo "❌ Error ejecutando migraciones"
    exit 1
fi

# Sembrar datos iniciales si es necesario
echo "🌱 Sembrando datos iniciales..."
npm run db:seed
if [ $? -ne 0 ]; then
    echo "⚠️  Advertencia: Error sembrando datos iniciales (puede ser normal si ya existen)"
fi

# Detener procesos PM2 existentes
echo "🛑 Deteniendo procesos PM2 existentes..."
pm2 stop vervoer 2>/dev/null || true
pm2 delete vervoer 2>/dev/null || true

# Construir la aplicación para producción
echo "🏗️  Construyendo aplicación para producción..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error construyendo la aplicación"
    exit 1
fi

# Iniciar la aplicación con PM2 en modo producción
echo "🚀 Iniciando aplicación con PM2 en modo producción..."
pm2 start npm --name "vervoer" -- start

# Verificar que la aplicación esté corriendo
sleep 5
if pm2 list | grep -q "vervoer.*online"; then
    echo "✅ Aplicación iniciada correctamente en modo producción"
    echo ""
    echo "📊 Estado de PM2:"
    pm2 list
    echo ""
    echo "🌐 La aplicación está disponible en:"
    echo "   - Local: http://localhost:3000"
    echo "   - Dominio: https://estamostrabajando.site"
    echo ""
    echo "🗄️  Base de datos PostgreSQL:"
    echo "   - Host: localhost:5432"
    echo "   - Base de datos: vervoer_db"
    echo "   - Usuario: vervoer_user"
    echo "   - Contraseña: vervoer_password"
    echo ""
    echo "🔧 PgAdmin (interfaz web):"
    echo "   - URL: http://localhost:5050"
    echo "   - Email: admin@vervoer.com"
    echo "   - Contraseña: admin123"
    echo ""
    echo "📝 Comandos útiles:"
    echo "   - Ver logs: pm2 logs vervoer"
    echo "   - Reiniciar: pm2 restart vervoer"
    echo "   - Detener: pm2 stop vervoer"
    echo "   - Estado: pm2 status"
    echo "   - Monitoreo: pm2 monit"
    echo ""
    echo "🗄️  Comandos de base de datos:"
    echo "   - Ver logs PostgreSQL: docker logs vervoer_postgres"
    echo "   - Conectar a PostgreSQL: docker exec -it vervoer_postgres psql -U vervoer_user -d vervoer_db"
    echo "   - Reiniciar PostgreSQL: docker-compose restart postgres"
    echo "   - Parar PostgreSQL: docker-compose stop postgres"
    echo ""
    echo "✅ Vervoer está funcionando correctamente en modo producción"
else
    echo "❌ Error al iniciar la aplicación"
    pm2 logs vervoer --lines 10
    exit 1
fi
