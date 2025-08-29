// Script de debug completo para verificar el estado del sistema
// Ejecutar en la consola del navegador en la página de documentos

console.log('🔍 === DEBUG SCRIPT INICIADO ===');

// 1. Verificar localStorage actual
console.log('📦 Verificando localStorage...');
const storedDocuments = localStorage.getItem('vervoer_documents');
console.log('📄 Documentos almacenados:', storedDocuments);

if (storedDocuments) {
  const parsed = JSON.parse(storedDocuments);
  console.log('📊 Documentos parseados:', parsed);
  console.log('📈 Número de documentos:', parsed.length);
  
  if (parsed.length > 0) {
    console.log('📋 Primer documento:', parsed[0]);
    console.log('🔍 Estado del primer documento:', parsed[0].status);
    console.log('📄 Datos extraídos del primer documento:', parsed[0].extractedData);
  }
}

// 2. Crear documento de prueba con estructura completa
const testDocument = {
  id: "test-document-002",
  name: "Factura_VEHICULOS_IND_NORIBERICA_5459821.pdf",
  type: "invoice",
  status: "completed",
  uploadedAt: new Date().toISOString(),
  supplier: "VEHICULOS IND.NORIBERICA, S.L.",
  total: 756.93,
  items: 5,
  processingMethod: "gpt-vision",
  extractedData: {
    documentType: "invoice",
    supplier: {
      name: "VEHICULOS IND.NORIBERICA, S.L.",
      address: "ARROYO DE LOS PRADOS, 1 POL.IND.LAS ARENAS 28320 PINTO MADRID",
      taxId: null
    },
    documentNumber: "5459821",
    date: "03/07/2025",
    items: [
      {
        reference: "SC 0000800617",
        description: "ESPARAGO",
        quantity: 4,
        unitPrice: 7,
        discount: 10,
        discountType: "percentage",
        totalPrice: 25.2
      },
      {
        reference: "SC 00019222517",
        description: "TORNILLO DE BRI",
        quantity: 4,
        unitPrice: 18.78,
        discount: 10,
        discountType: "percentage",
        totalPrice: 67.61
      },
      {
        reference: "SC 00019489664",
        description: "TUBO DE PURGA D",
        quantity: 1,
        unitPrice: 160.2,
        discount: 10,
        discountType: "percentage",
        totalPrice: 144.18
      },
      {
        reference: "SC 00018638382",
        description: "ABRAZADERA EN V",
        quantity: 1,
        unitPrice: 56.63,
        discount: 10,
        discountType: "percentage",
        totalPrice: 50.97
      },
      {
        reference: "SC 0001834585",
        description: "TUBO DE ESCAPE",
        quantity: 1,
        unitPrice: 521.08,
        discount: 10,
        discountType: "percentage",
        totalPrice: 468.97
      }
    ],
    totals: {
      subtotal: 756.93,
      discount: 0,
      tax: 0,
      total: 756.93
    }
  },
  gptData: {
    documentType: "invoice",
    supplier: {
      name: "VEHICULOS IND.NORIBERICA, S.L.",
      address: "ARROYO DE LOS PRADOS, 1 POL.IND.LAS ARENAS 28320 PINTO MADRID",
      taxId: null
    },
    documentNumber: "5459821",
    date: "03/07/2025",
    items: [
      {
        reference: "SC 0000800617",
        description: "ESPARAGO",
        quantity: 4,
        unitPrice: 7,
        discount: 10,
        discountType: "percentage",
        totalPrice: 25.2
      },
      {
        reference: "SC 00019222517",
        description: "TORNILLO DE BRI",
        quantity: 4,
        unitPrice: 18.78,
        discount: 10,
        discountType: "percentage",
        totalPrice: 67.61
      },
      {
        reference: "SC 00019489664",
        description: "TUBO DE PURGA D",
        quantity: 1,
        unitPrice: 160.2,
        discount: 10,
        discountType: "percentage",
        totalPrice: 144.18
      },
      {
        reference: "SC 00018638382",
        description: "ABRAZADERA EN V",
        quantity: 1,
        unitPrice: 56.63,
        discount: 10,
        discountType: "percentage",
        totalPrice: 50.97
      },
      {
        reference: "SC 0001834585",
        description: "TUBO DE ESCAPE",
        quantity: 1,
        unitPrice: 521.08,
        discount: 10,
        discountType: "percentage",
        totalPrice: 468.97
      }
    ],
    totals: {
      subtotal: 756.93,
      discount: 0,
      tax: 0,
      total: 756.93
    }
  }
};

// 3. Limpiar localStorage y agregar solo el documento de prueba
console.log('🧹 Limpiando localStorage...');
localStorage.removeItem('vervoer_documents');

console.log('📝 Agregando documento de prueba...');
localStorage.setItem('vervoer_documents', JSON.stringify([testDocument]));

// 4. Verificar que se guardó correctamente
console.log('✅ Verificando documento guardado...');
const savedDocuments = JSON.parse(localStorage.getItem('vervoer_documents') || '[]');
console.log('📊 Documentos guardados:', savedDocuments);
console.log('📈 Número de documentos:', savedDocuments.length);

// 5. Simular el estado del componente React
console.log('🎭 Simulando estado del componente...');
const mockDocuments = savedDocuments.map((doc: any) => ({
  ...doc,
  uploadedAt: new Date(doc.uploadedAt)
}));

console.log('📋 Estado simulado:', mockDocuments);

// 6. Verificar que el documento tiene todos los campos necesarios
const doc = mockDocuments[0];
console.log('🔍 Verificación del documento:');
console.log('- ID:', doc.id);
console.log('- Nombre:', doc.name);
console.log('- Estado:', doc.status);
console.log('- Proveedor:', doc.supplier);
console.log('- Total:', doc.total);
console.log('- Items:', doc.items);
console.log('- Datos extraídos:', doc.extractedData ? '✅ Presente' : '❌ Ausente');
console.log('- Datos GPT:', doc.gptData ? '✅ Presente' : '❌ Ausente');

if (doc.extractedData) {
  console.log('📄 Detalles de datos extraídos:');
  console.log('- Tipo de documento:', doc.extractedData.documentType);
  console.log('- Número de documento:', doc.extractedData.documentNumber);
  console.log('- Fecha:', doc.extractedData.date);
  console.log('- Proveedor:', doc.extractedData.supplier?.name);
  console.log('- Número de items:', doc.extractedData.items?.length);
  console.log('- Total:', doc.extractedData.totals?.total);
}

console.log('🎉 === DEBUG SCRIPT COMPLETADO ===');
console.log('🔄 Recarga la página para ver los cambios');
