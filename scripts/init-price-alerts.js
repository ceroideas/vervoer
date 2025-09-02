const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initPriceAlertsConfig() {
  try {
    console.log('🔧 Inicializando configuración del sistema de alertas de precios...');

    // Verificar si ya existe configuración
    const existingConfig = await prisma.priceAlertConfig.findFirst();
    
    if (existingConfig) {
      console.log('✅ Configuración ya existe, saltando inicialización');
      return;
    }

    // Crear configuración por defecto
    const defaultConfig = await prisma.priceAlertConfig.create({
      data: {
        maxPriceIncreasePercentage: 10.0,
        criticalPriceIncreasePercentage: 25.0,
        minDiscountPercentage: 15.0, // Descuento normal hasta 15%
        maxDiscountPercentage: 60.0, // Descuento anómalo hasta 60%
        enableAutomaticUpdates: false,
        enablePriceHistory: true
      }
    });

    console.log('✅ Configuración por defecto creada:', defaultConfig);
    console.log('📊 Configuración:');
    console.log('   - Aumento máximo sin alerta: 10%');
    console.log('   - Aumento crítico: 25%');
    console.log('   - Descuento normal: 0%-15%');
    console.log('   - Descuento anómalo: 15%-60%');
    console.log('   - Descuento crítico: >60%');
    console.log('   - Actualización automática: Desactivada');
    console.log('   - Historial de precios: Activado');

  } catch (error) {
    console.error('❌ Error inicializando configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initPriceAlertsConfig();
}

module.exports = { initPriceAlertsConfig };
