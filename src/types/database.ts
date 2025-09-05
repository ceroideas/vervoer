import { User, Document, Supplier, DocumentItem, Product, UserSession, UserRole, DocumentStatus, DocumentType } from '@prisma/client'

// Tipos de usuario
export type UserWithDocuments = User & {
  documents: Document[]
}

export type UserWithoutPassword = Omit<User, 'password'>

// Tipos de documento
export type DocumentWithRelations = Document & {
  supplier: Supplier | null
  items: DocumentItem[]
  processedBy: User
}

export type DocumentWithItems = Document & {
  items: DocumentItem[]
}

// Tipos de proveedor
export type SupplierWithDocuments = Supplier & {
  documents: Document[]
}

// Tipos de producto
export type ProductWithItems = Product & {
  items: DocumentItem[]
}

// Tipos para datos extraídos del OCR
export interface ExtractedData {
  supplier?: {
    name: string
    taxId?: string
    address?: string
  }
  documentNumber?: string
  date?: string
  items: Array<{
    reference?: string
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  totals: {
    subtotal: number
    tax: number
    total: number
  }
  // Firma de índice para compatibilidad con Prisma JSON
  [key: string]: any
}

// Tipos para autenticación
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface AuthResponse {
  user: UserWithoutPassword
  token: string
}

// Tipos para creación de documentos
export interface CreateDocumentData {
  filename: string
  originalText: string
  extractedData: ExtractedData
  documentType: DocumentType
  userId: string
  fileSize?: number
  fileType?: string
  processingTime?: number
}

// Tipos para filtros de búsqueda
export interface DocumentFilters {
  status?: DocumentStatus
  documentType?: DocumentType
  supplierId?: string
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface SupplierFilters {
  isActive?: boolean
  search?: string
}

// Tipos para estadísticas
export interface DashboardStats {
  totalDocuments: number
  processedDocuments: number
  pendingDocuments: number
  totalSuppliers: number
  totalProducts: number
  documentsThisMonth: number
  totalAmount: number
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
