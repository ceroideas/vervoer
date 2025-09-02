// Script para probar el sistema de alertas de precios
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPriceAlerts() {
  try {
    console.log('🧪 Creando datos de prueba para el sistema de alertas...');

    // Crear algunas alertas de prueba
    const testAlerts = [
      {
        productId: 'PROD001',
        productName: 'Laptop Dell XPS 13',
        productSku: 'DELL-XPS13-2024',
        oldPrice: 1200.00,
        newPrice: 1350.00,
        variationPercentage: 12.5,
        variationAmount: 150.00,
        documentNumber: 'FACT-2024-001',
        documentDate: new Date('2024-01-15'),
        supplierName: 'Tecnología Avanzada S.L.',
        alertType: 'PRICE_INCREASE',
        severity: 'MEDIUM',
        isProcessed: false,
        notes: 'Aumento de precio detectado en factura de proveedor'
      },
      {
        productId: 'PROD002',
        productName: 'Monitor Samsung 27"',
        productSku: 'SAMS-27-4K',
        oldPrice: 450.00,
        newPrice: 380.00,
        variationPercentage: -15.6,
        variationAmount: -70.00,
        documentNumber: 'FACT-2024-002',
        documentDate: new Date('2024-01-16'),
        supplierName: 'Electrónica Pro',
        alertType: 'PRICE_DECREASE',
        severity: 'LOW',
        isProcessed: false,
        notes: 'Descuento aplicado por volumen de compra'
      },
      {
        productId: 'PROD003',
        productName: 'Teclado Mecánico RGB',
        productSku: 'KB-MECH-RGB',
        oldPrice: 89.99,
        newPrice: 120.00,
        variationPercentage: 33.4,
        variationAmount: 30.01,
        documentNumber: 'FACT-2024-003',
        documentDate: new Date('2024-01-17'),
        supplierName: 'Gaming Supplies',
        alertType: 'PRICE_INCREASE',
        severity: 'HIGH',
        isProcessed: false,
        notes: 'Aumento crítico de precio - revisar con proveedor'
      },
      {
        productId: 'PROD004',
        productName: 'Mouse Inalámbrico',
        productSku: 'MOUSE-WIRELESS',
        oldPrice: 25.00,
        newPrice: 15.00,
        variationPercentage: -40.0,
        variationAmount: -10.00,
        documentNumber: 'FACT-2024-004',
        documentDate: new Date('2024-01-18'),
        supplierName: 'Accesorios Tech',
        alertType: 'DISCOUNT_ANOMALY',
        severity: 'MEDIUM',
        isProcessed: false,
        notes: 'Descuento anómalo detectado - verificar calidad del producto'
      }
    ];

    // Insertar alertas de prueba
    for (const alertData of testAlerts) {
      const alert = await prisma.priceVariation.create({
        data: alertData
      });
      console.log(`✅ Alert creada: ${alert.productName} - ${alert.alertType}`);
    }

    // Crear historial de precios de prueba
    const priceHistory = [
      {
        productId: 'PROD001',
        price: 1200.00,
        cost: 900.00,
        quantity: 1.0,
        totalAmount: 1200.00,
        documentNumber: 'FACT-2023-001',
        documentDate: new Date('2023-12-01'),
        supplierName: 'Tecnología Avanzada S.L.'
      },
      {
        productId: 'PROD001',
        price: 1350.00,
        cost: 1000.00,
        quantity: 1.0,
        totalAmount: 1350.00,
        documentNumber: 'FACT-2024-001',
        documentDate: new Date('2024-01-15'),
        supplierName: 'Tecnología Avanzada S.L.'
      }
    ];

    for (const historyData of priceHistory) {
      const history = await prisma.productPriceHistory.create({
        data: historyData
      });
      console.log(`📊 Historial creado: Producto ${history.productId} - ${history.price}€`);
    }

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('📋 Resumen:');
    console.log('   - 4 alertas de precio creadas');
    console.log('   - 2 entradas de historial creadas');
    console.log('   - Tipos de alerta: Aumento, Decrease, Anomalía');
    console.log('   - Severidades: Low, Medium, High');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestPriceAlerts();
}

module.exports = { createTestPriceAlerts };
