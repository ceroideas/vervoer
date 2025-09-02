const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanTestData() {
  try {
    console.log('🧹 Limpiando datos de prueba del sistema de alertas...');

    // Eliminar alertas de prueba (productos con IDs ficticios)
    const deletedAlerts = await prisma.priceVariation.deleteMany({
      where: {
        productId: {
          in: ['PROD001', 'PROD002', 'PROD003', 'PROD004']
        }
      }
    });

    console.log(`✅ ${deletedAlerts.count} alertas de prueba eliminadas`);

    // Eliminar historial de precios de prueba
    const deletedHistory = await prisma.productPriceHistory.deleteMany({
      where: {
        productId: {
          in: ['PROD001', 'PROD002', 'PROD003', 'PROD004']
        }
      }
    });

    console.log(`✅ ${deletedHistory.count} entradas de historial eliminadas`);

    console.log('\n🎉 Datos de prueba limpiados exitosamente!');
    console.log('📋 El sistema está listo para datos reales');

  } catch (error) {
    console.error('❌ Error limpiando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanTestData();
}

module.exports = { cleanTestData };
