// Script para agregar un documento de prueba al localStorage
// Ejecutar en la consola del navegador en la página de documentos

const testDocument = {
  id: "test-document-001",
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

// Obtener documentos existentes
const existingDocuments = JSON.parse(localStorage.getItem('vervoer_documents') || '[]');

// Agregar el documento de prueba
const updatedDocuments = [testDocument, ...existingDocuments];

// Guardar en localStorage
localStorage.setItem('vervoer_documents', JSON.stringify(updatedDocuments));

console.log('✅ Documento de prueba agregado al localStorage');
console.log('📊 Documentos totales:', updatedDocuments.length);
console.log('📄 Documento de prueba:', testDocument);

// Recargar la página para ver los cambios
// window.location.reload();
