// Cliente para la API de Holded
// Documentación: https://developers.holded.com/

const HOLDED_API_BASE = 'https://api.holded.com/api/invoicing/v1';
const HOLDED_API_KEY = 'd2e52f08894f3322cdf43d4e58c0d909';

interface HoldedConfig {
  apiKey?: string;
  baseUrl?: string;
}

interface HoldedContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  type: 'customer' | 'supplier' | 'both';
}

interface HoldedInvoice {
  id: string;
  number?: string;
  date: string;
  contactId: string;
  contactName?: string;
  items?: HoldedInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
}

interface HoldedInvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tax: number;
}

interface HoldedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  sku?: string;
  category?: string;
}

export class HoldedClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: HoldedConfig = {}) {
    this.apiKey = config.apiKey || HOLDED_API_KEY;
    this.baseUrl = config.baseUrl || HOLDED_API_BASE;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    // URL de la petición
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'key': this.apiKey,
    };

    // Haciendo petición a Holded

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      // Respuesta de Holded

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error de Holded API: ${response.status} - ${errorText}`);
        throw new Error(`Holded API Error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      // Respuesta completa de Holded
      
      // Verificar si la respuesta es JSON válido
      let data;
      try {
        data = JSON.parse(responseText);
        // Datos parseados de Holded
        return data;
      } catch (parseError) {
        console.error(`❌ Error parseando JSON de Holded:`, parseError);
        console.error(`📄 Respuesta que causó el error:`, responseText);
        throw new Error(`Respuesta no válida de Holded: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error(`❌ Error en petición a Holded:`, error);
      throw error;
    }
  }

  // ===== CONTACTOS =====
  
  /**
   * Obtiene todos los contactos
   */
  async getContacts(): Promise<HoldedContact[]> {
    return this.makeRequest('/contacts');
  }

  /**
   * Obtiene un contacto específico por ID
   */
  async getContact(id: string): Promise<HoldedContact> {
    return this.makeRequest(`/contacts/${id}`);
  }

  /**
   * Crea un nuevo contacto
   */
  async createContact(contact: Partial<HoldedContact>): Promise<HoldedContact> {
    return this.makeRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  /**
   * Actualiza un contacto existente
   */
  async updateContact(id: string, contact: Partial<HoldedContact>): Promise<HoldedContact> {
    return this.makeRequest(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contact),
    });
  }

  /**
   * Busca contactos por nombre o CIF/NIF
   */
  async searchContacts(query: string): Promise<HoldedContact[]> {
    const contacts = await this.getContacts();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.taxId?.includes(query)
    );
  }

  // ===== DOCUMENTOS (FACTURAS Y ALBARANES) =====

  /**
   * Obtiene todos los documentos de un tipo específico
   */
  async getDocuments(docType: 'invoice' | 'waybill'): Promise<HoldedInvoice[]> {
    return this.makeRequest(`/documents/${docType}`);
  }

  /**
   * Obtiene todas las facturas
   */
  async getInvoices(): Promise<HoldedInvoice[]> {
    return this.getDocuments('invoice');
  }

  /**
   * Obtiene todos los albaranes
   */
  async getWaybills(): Promise<HoldedInvoice[]> {
    return this.getDocuments('waybill');
  }

  /**
   * Obtiene un documento específico por ID
   */
  async getDocument(docType: 'invoice' | 'waybill', id: string): Promise<HoldedInvoice> {
    return this.makeRequest(`/documents/${docType}/${id}`);
  }

  /**
   * Obtiene una factura específica por ID
   */
  async getInvoice(id: string): Promise<HoldedInvoice> {
    return this.getDocument('invoice', id);
  }

  /**
   * Obtiene un albarán específico por ID
   */
  async getWaybill(id: string): Promise<HoldedInvoice> {
    return this.getDocument('waybill', id);
  }

  /**
   * Crea un nuevo documento (factura o albarán)
   */
  async createDocument(docType: 'invoice' | 'waybill', document: any): Promise<HoldedInvoice> {
    return this.makeRequest(`/documents/${docType}`, {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  /**
   * Crea una nueva factura
   */
  async createInvoice(invoice: any): Promise<HoldedInvoice> {
    return this.createDocument('invoice', invoice);
  }

  /**
   * Crea un nuevo albarán
   */
  async createWaybill(waybill: any): Promise<HoldedInvoice> {
    return this.createDocument('waybill', waybill);
  }

  /**
   * Actualiza un documento existente
   */
  async updateDocument(docType: 'invoice' | 'waybill', id: string, document: any): Promise<HoldedInvoice> {
    return this.makeRequest(`/documents/${docType}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(document),
    });
  }

  /**
   * Actualiza una factura existente
   */
  async updateInvoice(id: string, invoice: any): Promise<HoldedInvoice> {
    return this.updateDocument('invoice', id, invoice);
  }

  /**
   * Actualiza un albarán existente
   */
  async updateWaybill(id: string, waybill: any): Promise<HoldedInvoice> {
    return this.updateDocument('waybill', id, waybill);
  }

  /**
   * Busca documentos por número o proveedor
   */
  async searchDocuments(docType: 'invoice' | 'waybill', query: string): Promise<HoldedInvoice[]> {
    const documents = await this.getDocuments(docType);
    return documents.filter(doc => 
      doc.number?.toLowerCase().includes(query.toLowerCase()) ||
      doc.contactName?.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Busca facturas por número o proveedor
   */
  async searchInvoices(query: string): Promise<HoldedInvoice[]> {
    return this.searchDocuments('invoice', query);
  }

  /**
   * Busca albaranes por número o proveedor
   */
  async searchWaybills(query: string): Promise<HoldedInvoice[]> {
    return this.searchDocuments('waybill', query);
  }

  // ===== PRODUCTOS =====

  /**
   * Obtiene todos los productos
   */
  async getProducts(): Promise<HoldedProduct[]> {
    return this.makeRequest('/products');
  }

  /**
   * Obtiene un producto específico por ID
   */
  async getProduct(id: string): Promise<HoldedProduct> {
    return this.makeRequest(`/products/${id}`);
  }

  /**
   * Crea un nuevo producto
   */
  async createProduct(product: Partial<HoldedProduct>): Promise<HoldedProduct> {
    return this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(id: string, product: Partial<HoldedProduct>): Promise<HoldedProduct> {
    return this.makeRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  /**
   * Elimina un producto
   */
  async deleteProduct(id: string): Promise<void> {
    return this.makeRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Busca productos por nombre o SKU
   */
  async searchProducts(query: string): Promise<HoldedProduct[]> {
    const products = await this.getProducts();
    return products.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ===== FUNCIONES DE INTEGRACIÓN =====

  /**
   * Sincroniza un proveedor extraído desde OCR/GPT con Holded
   */
  async syncSupplier(supplierData: {
    name: string;
    taxId?: string;
    address?: string;
    email?: string;
    phone?: string;
  }): Promise<HoldedContact | null> {
    try {
      // Buscar si ya existe el proveedor
      const existingContacts = await this.searchContacts(supplierData.name);
      
      if (existingContacts.length > 0) {
        // Actualizar el contacto existente
        const existing = existingContacts[0];
        return await this.updateContact(existing.id, {
          ...supplierData,
          type: 'supplier',
        });
      } else {
        // Crear nuevo contacto
        return await this.createContact({
          ...supplierData,
          type: 'supplier',
        });
      }
    } catch (error) {
      console.error('Error sincronizando proveedor con Holded:', error);
      return null;
    }
  }

  /**
   * Crea una factura en Holded desde los datos extraídos
   */
  async createInvoiceFromExtractedData(data: {
    documentNumber: string;
    date: string;
    supplier: {
      name: string;
      taxId?: string;
    };
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    totals: {
      subtotal: number;
      tax: number;
      total: number;
    };
  }): Promise<HoldedInvoice | null> {
    try {
      // Primero sincronizar el proveedor
      const supplier = await this.syncSupplier(data.supplier);
      
      if (!supplier) {
        throw new Error('No se pudo sincronizar el proveedor');
      }

      // Crear la factura
      const invoice = await this.createInvoice({
        number: data.documentNumber,
        date: data.date,
        contactId: supplier.id,
        contactName: supplier.name,
        items: data.items.map(item => ({
          id: '', // Holded generará el ID
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          tax: 0, // Se calculará automáticamente
        })),
        subtotal: data.totals.subtotal,
        tax: data.totals.tax,
        total: data.totals.total,
        status: 'draft',
        currency: 'EUR',
      });

      return invoice;
    } catch (error) {
      console.error('Error creando factura en Holded:', error);
      return null;
    }
  }

  /**
   * Obtiene el PDF de un documento específico
   */
  async getDocumentPdf(docType: string, id: string): Promise<any> {
    return this.makeRequest(`/documents/${docType}/${id}/pdf`);
  }

  /**
   * Elimina un documento específico
   */
  async deleteDocument(docType: string, id: string): Promise<any> {
    return this.makeRequest(`/documents/${docType}/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Verifica la conexión con Holded
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/contacts');
      return true;
    } catch (error) {
      console.error('Error conectando con Holded:', error);
      return false;
    }
  }
}

// Instancia global del cliente
export const holdedClient = new HoldedClient();
