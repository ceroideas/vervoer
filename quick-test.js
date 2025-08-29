// Script de prueba rápida
// Ejecutar en la consola del navegador en la página de documentos

console.log('🚀 === PRUEBA RÁPIDA INICIADA ===');

// 1. Limpiar localStorage
localStorage.removeItem('vervoer_documents');
console.log('🧹 localStorage limpiado');

// 2. Verificar que está vacío
const emptyDocs = localStorage.getItem('vervoer_documents');
console.log('📦 localStorage vacío:', emptyDocs);

// 3. Crear documento de prueba simple
const testDoc = {
  id: "test-001",
  name: "test.pdf",
  type: "invoice",
  status: "completed",
  uploadedAt: new Date().toISOString(),
  supplier: "Test Supplier",
  total: 100,
  items: 2,
  processingMethod: "gpt-vision",
  extractedData: {
    documentType: "invoice",
    supplier: { name: "Test Supplier" },
    documentNumber: "TEST-001",
    date: "01/01/2025",
    items: [
      {
        reference: "REF001",
        description: "Test Product",
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100
      }
    ],
    totals: {
      subtotal: 100,
      total: 100
    }
  }
};

// 4. Guardar en localStorage
localStorage.setItem('vervoer_documents', JSON.stringify([testDoc]));
console.log('✅ Documento guardado');

// 5. Verificar que se guardó
const savedDocs = JSON.parse(localStorage.getItem('vervoer_documents') || '[]');
console.log('📊 Documentos guardados:', savedDocs);
console.log('📈 Número de documentos:', savedDocs.length);

console.log('🎉 === PRUEBA RÁPIDA COMPLETADA ===');
console.log('🔄 Recarga la página para ver el documento de prueba');
