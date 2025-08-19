# Integración con Holded

## 🚀 Descripción

Esta integración permite sincronizar automáticamente los datos extraídos de facturas y albaranes con tu cuenta de Holded, creando proveedores y facturas de forma automática.

## 🔧 Configuración

### API Key de Holded

La API key ya está configurada en el código:
```
d2e52f08894f3322cdf43d4e58c0d909
```

### Endpoints de la API

- **Base URL**: `https://api.holded.com/api/v1`
- **Autenticación**: Header `key` con la API key

## 📋 Funcionalidades Implementadas

### ✅ **Gestión de Contactos**
- Obtener todos los contactos
- Buscar contactos por nombre o CIF/NIF
- Crear nuevos contactos
- Actualizar contactos existentes
- Sincronización automática de proveedores

### ✅ **Gestión de Facturas**
- Obtener todas las facturas
- Buscar facturas por número o proveedor
- Crear nuevas facturas
- Actualizar facturas existentes
- Creación automática desde datos extraídos

### ✅ **Gestión de Productos**
- Obtener todos los productos
- Buscar productos por nombre o SKU
- Crear nuevos productos
- Actualizar productos existentes

### ✅ **Integración Automática**
- Sincronización de proveedores extraídos
- Creación automática de facturas
- Validación de datos antes de sincronizar
- Manejo de errores y fallbacks

## 🎯 Uso en la Interfaz

### **1. Probar Conexión**
1. Ve a la página de documentos (`/admin/documents`)
2. Sube y procesa una factura
3. Haz clic en "Ver Datos"
4. En la sección "Integración con Holded", haz clic en "Probar Conexión"
5. Verifica que el estado muestre "Conectado"

### **2. Sincronizar Datos**
1. Una vez conectado, verás las estadísticas de tu cuenta Holded
2. Haz clic en "Sincronizar con Holded"
3. El sistema creará automáticamente:
   - El proveedor (si no existe)
   - La factura con todos los productos
4. Verás el resultado de la sincronización

## 🔄 Flujo de Sincronización

### **1. Sincronización de Proveedor**
```javascript
// Buscar proveedor existente
const existingContacts = await holdedClient.searchContacts(supplierName);

if (existingContacts.length > 0) {
  // Actualizar proveedor existente
  await holdedClient.updateContact(existingContact.id, supplierData);
} else {
  // Crear nuevo proveedor
  await holdedClient.createContact({
    ...supplierData,
    type: 'supplier'
  });
}
```

### **2. Creación de Factura**
```javascript
// Crear factura con datos extraídos
const invoice = await holdedClient.createInvoice({
  number: documentNumber,
  date: documentDate,
  contactId: supplier.id,
  contactName: supplier.name,
  items: extractedItems,
  subtotal: totals.subtotal,
  tax: totals.tax,
  total: totals.total,
  status: 'draft',
  currency: 'EUR'
});
```

## 📊 Endpoints de la API

### **GET /api/holded/test**
Prueba la conexión con Holded y obtiene estadísticas.

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Conexión con Holded exitosa",
  "data": {
    "contacts": 25,
    "invoices": 150,
    "products": 89,
    "sampleContacts": [...],
    "sampleInvoices": [...]
  }
}
```

### **POST /api/holded/sync**
Sincroniza datos extraídos con Holded.

**Request:**
```json
{
  "extractedData": {
    "documentNumber": "F-2024-001",
    "date": "15/01/2024",
    "supplier": {
      "name": "Distribuidora García S.L.",
      "taxId": "B12345678"
    },
    "items": [...],
    "totals": {...}
  }
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Datos sincronizados exitosamente con Holded",
  "data": {
    "supplier": {
      "id": "contact_123",
      "name": "Distribuidora García S.L.",
      "taxId": "B12345678"
    },
    "invoice": {
      "id": "invoice_456",
      "number": "F-2024-001",
      "status": "draft",
      "total": 1870.02
    }
  }
}
```

## 🛠️ Cliente Holded

### **Instancia Global**
```javascript
import { holdedClient } from '@/holded/client';

// Usar directamente
const contacts = await holdedClient.getContacts();
```

### **Métodos Principales**

#### **Contactos**
- `getContacts()` - Obtener todos los contactos
- `searchContacts(query)` - Buscar contactos
- `createContact(data)` - Crear contacto
- `updateContact(id, data)` - Actualizar contacto
- `syncSupplier(data)` - Sincronizar proveedor

#### **Facturas**
- `getInvoices()` - Obtener todas las facturas
- `searchInvoices(query)` - Buscar facturas
- `createInvoice(data)` - Crear factura
- `updateInvoice(id, data)` - Actualizar factura
- `createInvoiceFromExtractedData(data)` - Crear desde datos extraídos

#### **Productos**
- `getProducts()` - Obtener todos los productos
- `searchProducts(query)` - Buscar productos
- `createProduct(data)` - Crear producto
- `updateProduct(id, data)` - Actualizar producto

#### **Utilidades**
- `testConnection()` - Probar conexión
- `makeRequest(endpoint, options)` - Request genérico

## 🔍 Manejo de Errores

### **Errores Comunes**

1. **API Key inválida**
   ```
   Error: Holded API Error: 401 - Unauthorized
   ```

2. **Datos faltantes**
   ```
   Error: No se pudo sincronizar el proveedor
   ```

3. **Proveedor no encontrado**
   ```
   Error: No se pudo crear la factura en Holded
   ```

### **Logs de Debug**

El sistema registra logs detallados:
```
🧪 Probando conexión con Holded...
✅ Conexión con Holded exitosa
📊 Contactos: 25
📊 Facturas: 150
📊 Productos: 89

🔄 Iniciando sincronización con Holded...
👤 Sincronizando proveedor...
✅ Proveedor sincronizado: Distribuidora García S.L.
📄 Creando factura en Holded...
✅ Factura creada en Holded: F-2024-001
```

## 🚀 Próximas Mejoras

### **Planificadas**
- [ ] Sincronización bidireccional
- [ ] Validación de CIF/NIF españoles
- [ ] Mapeo de productos existentes
- [ ] Gestión de albaranes
- [ ] Exportación de datos
- [ ] Webhooks para actualizaciones

### **Optimizaciones**
- [ ] Cache de contactos
- [ ] Procesamiento en lote
- [ ] Rate limiting
- [ ] Retry automático en errores

## 📞 Soporte

### **Verificación de Problemas**

1. **Probar conexión básica:**
   ```bash
   curl -H "key: d2e52f08894f3322cdf43d4e58c0d909" \
        https://api.holded.com/api/v1/contacts
   ```

2. **Verificar logs del servidor:**
   ```bash
   # En la consola del navegador o logs del servidor
   console.log('Error conectando con Holded:', error);
   ```

3. **Comprobar datos extraídos:**
   ```javascript
   console.log('Datos a sincronizar:', extractedData);
   ```

### **Contacto**

Si tienes problemas con la integración:
1. Verifica que la API key sea válida
2. Confirma que tienes permisos en Holded
3. Revisa los logs para errores específicos
4. Prueba con datos de ejemplo

---

**¡La integración está lista para sincronizar tus facturas con Holded!** 🎉
