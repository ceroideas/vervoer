"use client"
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Brain,
  Trash2
} from 'lucide-react'
import Tesseract from 'tesseract.js'
import { InvoiceDataDisplay } from '@/components/InvoiceDataDisplay'
import { HoldedIntegration } from '@/components/HoldedIntegration'
import { HoldedProductsSummary } from '@/components/HoldedProductsSummary'
import { CreateProductModal } from '@/components/CreateProductModal'
import { InvoiceProductsModal } from '@/components/InvoiceProductsModal'
import { DocumentDetailsModal } from '@/components/DocumentDetailsModal'
import { useAuth } from '@/contexts/AuthContext'
import { DocumentWithRelations } from '@/types/database'
import { processImageFile } from '@/utils/imageConverter'

// Importación dinámica de pdfjs para evitar problemas de SSR
let pdfjsLib: any = null;

// Función para inicializar pdfjsLib
const initPdfJs = async () => {
  if (typeof window !== 'undefined' && !pdfjsLib) {
    try {
      const module = await import('pdfjs-dist');
      pdfjsLib = module;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    } catch (error) {
      console.error('Error cargando PDF.js:', error);
    }
  }
  return pdfjsLib;
};

// Inicializar cuando el componente se monta
if (typeof window !== 'undefined') {
  initPdfJs();
}

import { Document, ExtractedData } from '@/types/invoice'

function extractDataFromText(text: string): ExtractedData {
  // Normalización ligera de espacios no separables
  const normalizedText = text.replace(/\u00A0/g, ' ')
  const lines = normalizedText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  // Helpers para números en formato español
  const parseEuro = (raw: string): number | undefined => {
    let s = raw.replace(/[€$\s]/g, '')
    const sign = s.startsWith('-') ? -1 : 1
    s = s.replace(/^[-+]/, '')
    if (/,/.test(s) && /\./.test(s)) {
      // 1.234,56 -> 1234.56
      s = s.replace(/\./g, '').replace(',', '.')
    } else if (/,/.test(s)) {
      // 300,00 -> 300.00
      s = s.replace(',', '.')
    }
    const num = Number(s)
    return Number.isFinite(num) ? sign * num : undefined
  }
  // Importes tipo: 1.234,56 | 300,00 | -300,00 | € 300,00
  const amountRegex = /[€$]?\s*[+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|[€$]?\s*[+-]?\d+(?:[.,]\d{2})/g

  const extracted: ExtractedData = {
    documentType: normalizedText.toLowerCase().includes('factura') ? 'invoice' : 'delivery_note',
    items: [],
    totals: {}
  }

  // Número de documento
  const documentNumberMatch = normalizedText.match(/(?:FACTURA|ALBARÁN|ALBARAN)\s*(?:Nº?|NÚMERO?|NUMERO?)?\s*:?\s*([A-Z0-9\-_\/]+)/i)
  if (documentNumberMatch) {
    extracted.documentNumber = documentNumberMatch[1]
  }

  // Fecha (dd/mm/yyyy o variantes)
  const dateMatch = normalizedText.match(/(?:FECHA|DATE)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  if (dateMatch) {
    extracted.date = dateMatch[1]
  }

  // Proveedor (heurística básica)
  const supplierKeywords = ['PROVEEDOR', 'EMISOR', 'VENDEDOR', 'EMPRESA', 'COMPAÑÍA', 'COMPAÑIA']
  for (const keyword of supplierKeywords) {
    const supplierMatch = normalizedText.match(new RegExp(`${keyword}\\s*:?\\s*([^\\n]+)`, 'i'))
    if (supplierMatch) {
      extracted.supplier = { name: supplierMatch[1].trim() }
      break
    }
  }

  // Líneas candidatas a ítems
  const itemLines = lines.filter(line => {
    const hasNumbers = /\d+/.test(line)
    const hasPrice = amountRegex.test(line)
    const isNotHeader = !line.match(/^(FACTURA|ALBARÁN|ALBARAN|TOTAL|SUBTOTAL|IVA)/i)
    return hasNumbers && (hasPrice || isNotHeader) && line.length > 10
  })

  for (const line of itemLines.slice(0, 50)) {
    const item: any = {}

    // Cantidad (x, ud, uds, pcs)
    const quantityMatch = line.match(/(\d+(?:[,.]\d+)?)\s*(?:x|un|ud|uds?|pcs?)/i)
    if (quantityMatch) {
      item.quantity = parseFloat(quantityMatch[1].replace(',', '.'))
    }

    // Detectar descuentos (% o €)
    const discountMatch = line.match(/(?:descuento|dto\.?|discount)\s*:?\s*([+-]?\d+(?:[,.]\d+)?)\s*(%|€|euros?)?/i)
    if (discountMatch) {
      const discountValue = parseFloat(discountMatch[1].replace(',', '.'))
      const discountUnit = discountMatch[2]
      if (discountUnit === '%') {
        item.discount = discountValue
        item.discountType = 'percentage'
      } else {
        item.discount = discountValue
        item.discountType = 'amount'
      }
    }

    // Importes: usar el último como total de la línea; el primero como unitario si existe
    const amounts = Array.from(line.matchAll(amountRegex)).map(m => m[0])
    if (amounts.length >= 1) {
      const last = amounts[amounts.length - 1]
      const parsedTotal = parseEuro(last)
      if (parsedTotal !== undefined) item.totalPrice = parsedTotal
      if (amounts.length >= 2) {
        const first = amounts[0]
        const parsedUnit = parseEuro(first)
        if (parsedUnit !== undefined) item.unitPrice = parsedUnit
      }
    }

    // Descripción depurada
    const description = line
      .replace(amountRegex, '')
      .replace(/\d+(?:[,.]\d+)?\s*(?:x|un|ud|uds?|pcs?)/i, '')
      .replace(/^\s*[-_]\s*/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    if (description.length > 3) item.description = description

    // Referencia (heurística básica)
    const referenceMatch = line.match(/([A-Z0-9]{3,10})/)
    if (referenceMatch) item.reference = referenceMatch[1]

    if (item.description || item.quantity || item.unitPrice || item.totalPrice) {
      extracted.items?.push(item)
    }
  }

  // Totales documento (evitar confusión con líneas)
  const totalMatch = normalizedText.match(/TOTAL\s*:?\s*[€$]?\s*([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|[+-]?\d+(?:[.,]\d{2}))/i)
  if (totalMatch) {
    const v = parseEuro(totalMatch[1])
    if (v !== undefined) extracted.totals!.total = v
  }
  const subtotalMatch = normalizedText.match(/SUBTOTAL\s*:?\s*[€$]?\s*([+-]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|[+-]?\d+(?:[.,]\d{2}))/i)
  if (subtotalMatch) {
    const v = parseEuro(subtotalMatch[1])
    if (v !== undefined) extracted.totals!.subtotal = v
  }

  // "Imp. Línea" explícito
  for (const line of lines) {
    if (/imp\.?\s*lin(é|e)a/i.test(line) || /importe\s+línea/i.test(line)) {
      const m = line.match(amountRegex)
      if (m && m.length) {
        const v = parseEuro(m[m.length - 1])
        if (v !== undefined) extracted.items?.push({ totalPrice: v })
      }
    }
  }

  return extracted
}

// Worker OCR reutilizable con modelos "best" y parámetros para mejorar precisión
let ocrWorkerPromise: Promise<any> | null = null
async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const worker = await Tesseract.createWorker('spa', {
        // Usar modelos rápidos para mejor equilibrio velocidad/precisión
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast'
      } as any)
      await (worker as any).setParameters({
        // PSM AUTO (3): Tesseract decide bloques/columnas
        tessedit_pageseg_mode: String(Tesseract.PSM.AUTO),
        // DPI virtual adecuado
        user_defined_dpi: '300',
        // Reducir confusiones comunes en facturas
        tessedit_char_blacklist: '¡¿'
      })
      return worker
    })()
  }
  return ocrWorkerPromise
}

// Mejora simple de imagen: escala de grises + ligero ajuste de contraste (suavizado)
function enhanceCanvasForOcr(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
  if (!ctx) return
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  const contrast = 1.08 // contraste más suave
  const intercept = 128 * (1 - contrast)
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    // escala de grises perceptual
    let v = 0.299 * r + 0.587 * g + 0.114 * b
    // aplicar contraste
    v = contrast * v + intercept
    v = v < 0 ? 0 : v > 255 ? 255 : v
    d[i] = d[i + 1] = d[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
}

async function ocrImageFile(file: File): Promise<{ text: string, extractedData: ExtractedData }> {
  const worker = await getOcrWorker()
  const { data: { text } } = await worker.recognize(file)
  return { text, extractedData: extractDataFromText(text) }
}

async function ocrPdfFile(file: File): Promise<{ text: string, extractedData: ExtractedData }> {
  const pdfLib = await initPdfJs();
  if (!pdfLib) {
    throw new Error('PDF.js no está disponible');
  }
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d') as CanvasRenderingContext2D
          canvas.width = viewport.width
          canvas.height = viewport.height
    await page.render({ canvasContext: context, viewport }).promise
          enhanceCanvasForOcr(canvas)
          const dataUrl = canvas.toDataURL('image/png')
    const worker = await getOcrWorker()
    const { data: { text } } = await worker.recognize(dataUrl)
    fullText += text + '\n'
  }
  return { text: fullText, extractedData: extractDataFromText(fullText) }
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentWithRelations[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ocrProgress, setOcrProgress] = useState<{ [docId: string]: string }>({})
  const [processingMethod, setProcessingMethod] = useState<'ocr' | 'gpt-vision'>('gpt-vision')
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithRelations | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar documentos desde la base de datos
  const loadDocumentsFromDatabase = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/documents', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setDocuments(data.data.documents)
        } else {
          console.error('Error cargando documentos:', data.error)
        }
      } else {
        console.error('Error en la respuesta:', response.statusText)
      }
    } catch (error) {
      console.error('Error cargando documentos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminar documento de la base de datos
  const deleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Recargar documentos después de eliminar
        await loadDocumentsFromDatabase()
      } else {
        console.error('Error eliminando documento:', response.statusText)
      }
    } catch (error) {
      console.error('Error eliminando documento:', error)
    }
  }

  // Cargar documentos al montar el componente
  useEffect(() => {
    if (user) {
      loadDocumentsFromDatabase()
    }
  }, [user])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Función para procesar con GPT-4o mini y guardar en base de datos
  const processWithGPT4Vision = async (file: File): Promise<{ extractedData: ExtractedData, ocrData?: ExtractedData, gptData?: ExtractedData }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/ocr/process', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Error en procesamiento: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Error procesando documento')
    }
    
    return {
      extractedData: result.data.extractedData,
      gptData: result.data.extractedData
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !user) return
    
    setIsUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i]
        
        try {
          // Procesar archivo (convertir HEIC a JPEG si es necesario)
          try {
            file = await processImageFile(file);
            console.log('✅ Archivo procesado:', file.name, file.type);
          } catch (conversionError) {
            console.error('❌ Error procesando archivo HEIC:', conversionError);
            console.error(`⚠️ Saltando archivo ${file.name} - formato no compatible`);
            continue;
          }

          if (processingMethod === 'gpt-vision') {
            // Procesar con GPT-4o mini y guardar en base de datos
            const result = await processWithGPT4Vision(file)
          } else {
            // Procesar solo con OCR tradicional en el cliente
            
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            let ocrText = ''
            
            if (isPdf) {
              const pdfLib = await initPdfJs();
              if (!pdfLib) {
                throw new Error('PDF.js no está disponible');
              }
              const arrayBuffer = await file.arrayBuffer()
              const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise
              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum)
                const viewport = page.getViewport({ scale: 2 })
                const canvas = document.createElement('canvas')
                const context = canvas.getContext('2d') as CanvasRenderingContext2D
                canvas.width = viewport.width
                canvas.height = viewport.height
                await page.render({ canvasContext: context, viewport }).promise
                enhanceCanvasForOcr(canvas)
                const dataUrl = canvas.toDataURL('image/png')
                const worker = await getOcrWorker()
                const { data: { text } } = await worker.recognize(dataUrl)
                ocrText += `\n--- Página ${pageNum} ---\n` + text
              }
            } else {
              const worker = await getOcrWorker()
              const { data: { text } } = await worker.recognize(file)
              ocrText = text
            }
            
            // Extraer datos del texto OCR
            const extractedData = extractDataFromText(ocrText)
            
            // Guardar en base de datos usando la API
            const formData = new FormData()
            formData.append('file', file)
            formData.append('ocrText', ocrText)
            formData.append('extractedData', JSON.stringify(extractedData))
            
            const response = await fetch('/api/documents', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({
                filename: file.name,
                originalText: ocrText,
                extractedData: extractedData,
                documentType: file.name.toLowerCase().includes('factura') ? 'INVOICE' : 'DELIVERY_NOTE',
                fileSize: file.size,
                fileType: file.type
              })
            })
            
            if (!response.ok) {
              throw new Error(`Error guardando documento: ${response.statusText}`)
            }
            
            const result = await response.json()
          }
          
          // Recargar documentos después de procesar
          await loadDocumentsFromDatabase()
          
          // Resetear el input de archivo
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          
        } catch (error) {
          console.error('Error procesando documento:', error)
          // Mostrar error al usuario
          alert(`Error procesando ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
      }
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'PROCESSED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'SYNCED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'PROCESSED':
        return 'Completado'
      case 'ERROR':
        return 'Error'
      case 'SYNCED':
        return 'Sincronizado'
      default:
        return 'Desconocido'
    }
  }

  const getDocumentTypeText = (type: string) => {
    return type === 'INVOICE' ? 'Factura' : 'Albarán'
  }

  // Función para mapear DocumentWithRelations a Document (para el modal)
  const mapDocumentForModal = (doc: DocumentWithRelations) => {
    return {
      id: doc.id,
      name: doc.filename,
      type: (doc.documentType === 'INVOICE' ? 'invoice' : 'delivery_note') as 'invoice' | 'delivery_note',
      status: (doc.status === 'PENDING' ? 'pending' : 
              doc.status === 'PROCESSED' ? 'completed' : 
              doc.status === 'ERROR' ? 'error' : 'pending') as 'pending' | 'processing' | 'completed' | 'error',
      uploadedAt: doc.createdAt,
      supplier: doc.supplier?.name,
      total: doc.totalAmount,
      items: doc.items?.length,
      ocrText: doc.originalText,
      extractedData: doc.extractedData as any,
      ocrData: doc.extractedData as any,
      gptData: doc.extractedData as any,
      processingMethod: 'gpt-vision' as const
    }
  }

  if (!user) {
    return (
      <AdminLayout title="Gestión de Documentos">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Debes iniciar sesión para ver los documentos</p>
            <Button onClick={() => window.location.href = '/login'}>
              Ir al Login
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Gestión de Documentos">
      
      <div className="grid gap-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{documents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {documents.filter(d => d.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sincronizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {documents.filter(d => d.status === 'SYNCED').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.status === 'PROCESSED').length}
          </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Resumen de productos de Holded */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Subida de archivos */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Documentos</CardTitle>
            <CardDescription>
              Sube facturas y albaranes para procesamiento automático con IA avanzada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selección de método de procesamiento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Procesamiento:</label>
              <div className="flex gap-2">
                <Button
                  variant={processingMethod === 'ocr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProcessingMethod('ocr')}
                  disabled={isUploading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  OCR Tradicional
                </Button>
                <Button
                  variant={processingMethod === 'gpt-vision' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProcessingMethod('gpt-vision')}
                  disabled={isUploading}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  GPT-4o-Mini
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {processingMethod === 'ocr' && 'OCR tradicional: Rápido, sin costos adicionales'}
                {processingMethod === 'gpt-vision' && 'GPT-4o mini: Máxima precisión, requiere API key'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1"
              />
              <Button disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Procesando...' : 'Subir'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Formatos soportados: PDF, JPG, JPEG, PNG
            </p>
          </CardContent>
        </Card>
        {/* Filtros */}
          <Card>
            <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="PENDING">Pendientes</option>
                <option value="PROCESSED">Completados</option>
                <option value="ERROR">Errores</option>
                <option value="SYNCED">Sincronizados</option>
              </select>
              </div>
            </CardContent>
          </Card>
        {/* Lista de documentos */}
          <Card>
            <CardHeader>
            <CardTitle>Documentos Recientes</CardTitle>
              <CardDescription>
              Historial de documentos procesados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Cargando documentos...</p>
                </div>
              ) : (
                <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        <span className="text-sm font-medium">{getStatusText(doc.status)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {getDocumentTypeText(doc.documentType)} • {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        {doc.supplier && (
                          <p className="text-sm font-medium">{doc.supplier.name}</p>
                        )}
                        {doc.totalAmount && (
                          <p className="text-sm text-muted-foreground">
                            {doc.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                          </p>
                        )}
                        {doc.items && doc.items.length > 0 && (
                          <p className="text-xs text-muted-foreground">{doc.items.length} productos</p>
                        )}
                      </div>
                      {doc.status === 'PROCESSED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc)
                            setIsModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Datos
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
                            deleteDocument(doc.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredDocuments.length === 0 && !isLoading && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No hay documentos para mostrar</p>
                  </div>
                )}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
          
          {/* Panel lateral con productos de Holded */}
          <div className="lg:col-span-1">
            <HoldedProductsSummary />
          </div>
        </div>
      </div>

      {/* Modal de detalles del documento */}
      <DocumentDetailsModal
        document={selectedDocument ? mapDocumentForModal(selectedDocument) : null}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDocument(null)
        }}
      />
    </AdminLayout>
  )
} 

