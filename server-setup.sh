#!/bin/bash

# 🚀 Script de Configuración del Servidor - Vervoer
# Este script configura un servidor Ubuntu para ejecutar Vervoer

set -e  # Salir si hay algún error

echo "🚀 Configurando servidor Ubuntu para Vervoer..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Actualizar el sistema
print_status "Actualizando el sistema..."
sudo apt update && sudo apt upgrade -y
print_success "Sistema actualizado"

# Instalar dependencias del sistema
print_status "Instalando dependencias del sistema..."
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release
print_success "Dependencias del sistema instaladas"

# Instalar Node.js 18.x
print_status "Instalando Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
print_success "Node.js instalado: $(node --version)"

# Instalar npm global packages
print_status "Instalando paquetes globales de npm..."
sudo npm install -g pm2 tsx
print_success "Paquetes globales instalados"

# Instalar PostgreSQL
print_status "Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
print_success "PostgreSQL instalado"

# Configurar PostgreSQL
print_status "Configurando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario y base de datos
sudo -u postgres psql -c "CREATE USER vervoer_user WITH PASSWORD 'vervoer_password';"
sudo -u postgres psql -c "CREATE DATABASE vervoer_db OWNER vervoer_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vervoer_db TO vervoer_user;"
sudo -u postgres psql -c "ALTER USER vervoer_user CREATEDB;"

# Configurar PostgreSQL para conexiones locales
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
print_success "PostgreSQL configurado"

# Instalar Nginx
print_status "Instalando Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx instalado"

# Configurar firewall
print_status "Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw --force enable
print_success "Firewall configurado"

# Crear directorio de la aplicación
print_status "Creando directorio de la aplicación..."
sudo mkdir -p /var/www/vervoer
sudo chown $USER:$USER /var/www/vervoer
print_success "Directorio de la aplicación creado"

# Crear archivo de configuración de Nginx
print_status "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/vervoer > /dev/null <<EOF
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/vervoer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
print_success "Nginx configurado"

# Crear script de inicio del sistema
print_status "Creando script de inicio del sistema..."
sudo tee /etc/systemd/system/vervoer.service > /dev/null <<EOF
[Unit]
Description=Vervoer Application
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=/var/www/vervoer
Environment=NODE_ENV=production
ExecStart=/usr/bin/pm2 start npm --name "vervoer" -- start
ExecReload=/usr/bin/pm2 reload vervoer
ExecStop=/usr/bin/pm2 stop vervoer
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable vervoer.service
print_success "Script de inicio del sistema creado"

# Crear archivo de configuración de entorno
print_status "Creando archivo de configuración de entorno..."
cat > /var/www/vervoer/.env <<EOF
# Database
DATABASE_URL="postgresql://vervoer_user:vervoer_password@localhost:5432/vervoer_db"

# JWT
JWT_SECRET="tu_jwt_secret_super_seguro_aqui_cambialo_en_produccion"

# Holded API
HOLDED_API_KEY="tu_holded_api_key_aqui"

# OpenAI API
OPENAI_API_KEY="tu_openai_api_key_aqui"

# Environment
NODE_ENV=production
EOF

print_warning "IMPORTANTE: Edita el archivo /var/www/vervoer/.env con tus API keys reales"

# Crear script de despliegue
cat > /var/www/vervoer/deploy.sh <<'EOF'
#!/bin/bash

echo "🚀 Desplegando Vervoer..."

# Ir al directorio de la aplicación
cd /var/www/vervoer

# Obtener los últimos cambios
git pull origin main

# Instalar dependencias
npm install --production

# Generar Prisma client
npm run db:generate

# Ejecutar migraciones
npm run db:deploy

# Reiniciar la aplicación
sudo systemctl restart vervoer

echo "✅ Despliegue completado"
EOF

chmod +x /var/www/vervoer/deploy.sh

# Crear script de configuración inicial
cat > /var/www/vervoer/setup.sh <<'EOF'
#!/bin/bash

echo "🚀 Configurando Vervoer..."

# Ir al directorio de la aplicación
cd /var/www/vervoer

# Instalar dependencias
npm install

# Configurar base de datos
npm run db:setup

# Iniciar la aplicación
sudo systemctl start vervoer

echo "✅ Configuración completada"
EOF

chmod +x /var/www/vervoer/setup.sh

print_success "Scripts de despliegue creados"

# Mostrar resumen
echo ""
print_success "🎉 Configuración del servidor completada!"
echo ""
echo "📋 Resumen de la configuración:"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"
echo "   - PostgreSQL: Instalado y configurado"
echo "   - Nginx: Instalado y configurado"
echo "   - PM2: Instalado"
echo "   - Firewall: Configurado"
echo ""
echo "📁 Directorio de la aplicación: /var/www/vervoer"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Clona tu repositorio en /var/www/vervoer"
echo "   2. Edita el archivo .env con tus API keys"
echo "   3. Ejecuta: cd /var/www/vervoer && ./setup.sh"
echo ""
echo "📝 Comandos útiles:"
echo "   - Ver estado: sudo systemctl status vervoer"
echo "   - Ver logs: sudo journalctl -u vervoer -f"
echo "   - Reiniciar: sudo systemctl restart vervoer"
echo "   - Desplegar: cd /var/www/vervoer && ./deploy.sh"
echo ""
print_warning "⚠️  Recuerda cambiar las contraseñas por defecto en producción"
