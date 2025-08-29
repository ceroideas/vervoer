export interface ExtractedData {
  documentType: 'invoice' | 'delivery_note';
  documentNumber?: string;
  date?: string;
  supplier?: {
    name?: string;
    address?: string;
    taxId?: string;
  };
  items?: Array<{
    reference?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number; // Descuento en porcentaje o cantidad
    discountType?: 'percentage' | 'amount'; // Tipo de descuento
    totalPrice?: number;
  }>;
  totals?: {
    subtotal?: number;
    discount?: number; // Descuento total del documento
    tax?: number;
    total?: number;
  };
}

export interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'delivery_note';
  status: 'pending' | 'processing' | 'completed' | 'error';
  uploadedAt: Date;
  supplier?: string;
  total?: number;
  items?: number;
  ocrText?: string;
  extractedData?: ExtractedData;
  ocrData?: ExtractedData;
  gptData?: ExtractedData;
  processingMethod?: 'ocr' | 'gpt-vision';
}
