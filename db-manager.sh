#!/bin/bash

# 🗄️  Script de Gestión de Base de Datos - Vervoer
# Este script facilita la gestión de la base de datos PostgreSQL y Prisma

echo "🗄️  Gestor de Base de Datos Vervoer"
echo "=================================="

# Función para mostrar el menú
show_menu() {
    echo ""
    echo "Selecciona una opción:"
    echo "1. 📊 Ver estado de la base de datos"
    echo "2. 🔧 Generar cliente de Prisma"
    echo "3. 🔄 Ejecutar migraciones"
    echo "4. 🌱 Sembrar datos iniciales"
    echo "5. 📋 Ver tablas de la base de datos"
    echo "6. 👥 Ver usuarios en la base de datos"
    echo "7. 📄 Ver documentos en la base de datos"
    echo "8. 🏪 Ver proveedores en la base de datos"
    echo "9. 📊 Ver estadísticas de la base de datos"
    echo "10. 🗑️  Resetear base de datos (¡CUIDADO!)"
    echo "11. 📝 Abrir PgAdmin en el navegador"
    echo "12. 🔍 Ver logs de PostgreSQL"
    echo "13. 🚀 Reiniciar servicios de base de datos"
    echo "14. 📤 Hacer backup de la base de datos"
    echo "15. 📥 Restaurar backup de la base de datos"
    echo "0. ❌ Salir"
    echo ""
    read -p "Opción: " choice
}

# Función para verificar si PostgreSQL está funcionando
check_postgres() {
    if ! docker ps | grep -q "vervoer_postgres"; then
        echo "❌ PostgreSQL no está funcionando. Iniciando..."
        docker-compose up -d postgres
        sleep 5
    fi
    
    if ! docker exec vervoer_postgres pg_isready -U vervoer_user -d vervoer_db; then
        echo "❌ Error: PostgreSQL no está funcionando correctamente"
        return 1
    fi
    return 0
}

# Función para ver estado de la base de datos
check_db_status() {
    echo "📊 Verificando estado de la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    echo "✅ PostgreSQL está funcionando"
    
    # Verificar conexión y tablas
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        SELECT 
            schemaname,
            tablename,
            tableowner
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
    "
    
    # Verificar tamaño de la base de datos
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        SELECT 
            pg_size_pretty(pg_database_size('vervoer_db')) as database_size;
    "
}

# Función para generar cliente de Prisma
generate_prisma() {
    echo "🔧 Generando cliente de Prisma..."
    npm run db:generate
    if [ $? -eq 0 ]; then
        echo "✅ Cliente de Prisma generado correctamente"
    else
        echo "❌ Error generando cliente de Prisma"
    fi
}

# Función para ejecutar migraciones
run_migrations() {
    echo "🔄 Ejecutando migraciones..."
    npm run db:push
    if [ $? -eq 0 ]; then
        echo "✅ Migraciones ejecutadas correctamente"
    else
        echo "❌ Error ejecutando migraciones"
    fi
}

# Función para sembrar datos
seed_data() {
    echo "🌱 Sembrando datos iniciales..."
    npm run db:seed
    if [ $? -eq 0 ]; then
        echo "✅ Datos sembrados correctamente"
    else
        echo "⚠️  Advertencia: Error sembrando datos (puede ser normal si ya existen)"
    fi
}

# Función para ver tablas
show_tables() {
    echo "📋 Mostrando tablas de la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        \dt+
    "
}

# Función para ver usuarios
show_users() {
    echo "👥 Mostrando usuarios en la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        SELECT 
            id,
            email,
            name,
            role,
            \"isActive\",
            \"createdAt\"
        FROM users
        ORDER BY \"createdAt\" DESC;
    "
}

# Función para ver documentos
show_documents() {
    echo "📄 Mostrando documentos en la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        SELECT 
            d.id,
            d.filename,
            d.\"documentType\",
            d.status,
            d.\"documentNumber\",
            d.\"totalAmount\",
            u.name as \"userName\",
            d.\"createdAt\"
        FROM documents d
        LEFT JOIN users u ON d.\"userId\" = u.id
        ORDER BY d.\"createdAt\" DESC
        LIMIT 20;
    "
}

# Función para ver proveedores
show_suppliers() {
    echo "🏪 Mostrando proveedores en la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        SELECT 
            id,
            name,
            \"taxId\",
            address,
            email,
            \"isActive\",
            \"createdAt\"
        FROM suppliers
        ORDER BY \"createdAt\" DESC;
    "
}

# Función para ver estadísticas
show_stats() {
    echo "📊 Mostrando estadísticas de la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    docker exec vervoer_postgres psql -U vervoer_user -d vervoer_db -c "
        SELECT 
            'Usuarios' as category,
            COUNT(*) as count
        FROM users
        UNION ALL
        SELECT 
            'Documentos' as category,
            COUNT(*) as count
        FROM documents
        UNION ALL
        SELECT 
            'Proveedores' as category,
            COUNT(*) as count
        FROM suppliers
        UNION ALL
        SELECT 
            'Productos' as category,
            COUNT(*) as count
        FROM products
        UNION ALL
        SELECT 
            'Variaciones de Precio' as category,
            COUNT(*) as count
        FROM price_variations;
    "
}

# Función para resetear base de datos
reset_database() {
    echo "⚠️  ¡ADVERTENCIA! Esta acción eliminará todos los datos."
    read -p "¿Estás seguro? Escribe 'SI' para confirmar: " confirmation
    
    if [ "$confirmation" = "SI" ]; then
        echo "🗑️  Reseteando base de datos..."
        npm run db:reset
        echo "✅ Base de datos reseteada"
    else
        echo "❌ Operación cancelada"
    fi
}

# Función para abrir PgAdmin
open_pgadmin() {
    echo "📝 Abriendo PgAdmin..."
    
    # Detectar el sistema operativo
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:5050
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:5050
    else
        echo "🌐 Abre tu navegador y ve a: http://localhost:5050"
        echo "📧 Email: admin@vervoer.com"
        echo "🔑 Contraseña: admin123"
    fi
}

# Función para ver logs
show_logs() {
    echo "🔍 Mostrando logs de PostgreSQL..."
    docker logs vervoer_postgres --tail 50
}

# Función para reiniciar servicios
restart_services() {
    echo "🚀 Reiniciando servicios de base de datos..."
    docker-compose restart postgres
    sleep 5
    echo "✅ Servicios reiniciados"
}

# Función para hacer backup
backup_database() {
    echo "📤 Haciendo backup de la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="vervoer_backup_$timestamp.sql"
    
    docker exec vervoer_postgres pg_dump -U vervoer_user -d vervoer_db > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup creado: $backup_file"
    else
        echo "❌ Error creando backup"
    fi
}

# Función para restaurar backup
restore_backup() {
    echo "📥 Restaurando backup de la base de datos..."
    
    if ! check_postgres; then
        return
    fi
    
    read -p "Nombre del archivo de backup: " backup_file
    
    if [ -f "$backup_file" ]; then
        echo "⚠️  ¡ADVERTENCIA! Esta acción sobrescribirá la base de datos actual."
        read -p "¿Estás seguro? Escribe 'SI' para confirmar: " confirmation
        
        if [ "$confirmation" = "SI" ]; then
            docker exec -i vervoer_postgres psql -U vervoer_user -d vervoer_db < "$backup_file"
            if [ $? -eq 0 ]; then
                echo "✅ Backup restaurado correctamente"
            else
                echo "❌ Error restaurando backup"
            fi
        else
            echo "❌ Operación cancelada"
        fi
    else
        echo "❌ Archivo de backup no encontrado: $backup_file"
    fi
}

# Bucle principal
while true; do
    show_menu
    
    case $choice in
        1) check_db_status ;;
        2) generate_prisma ;;
        3) run_migrations ;;
        4) seed_data ;;
        5) show_tables ;;
        6) show_users ;;
        7) show_documents ;;
        8) show_suppliers ;;
        9) show_stats ;;
        10) reset_database ;;
        11) open_pgadmin ;;
        12) show_logs ;;
        13) restart_services ;;
        14) backup_database ;;
        15) restore_backup ;;
        0) echo "👋 ¡Hasta luego!"; exit 0 ;;
        *) echo "❌ Opción inválida" ;;
    esac
    
    echo ""
    read -p "Presiona Enter para continuar..."
done
