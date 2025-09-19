"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateInvoiceModalProps {
  onInvoiceCreated: () => void
  docType?: 'invoice' | 'waybill'
  prefillData?: {
    contactName?: string
    date?: string
    documentNum?: string
    notes?: string
    items?: Array<{
      description: string
      quantity: number
      price: number
      tax: number
    }>
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface InvoiceItem {
  description: string
  quantity: number
  price: number
  tax: number
}

export function CreateInvoiceModal({ onInvoiceCreated, docType = 'invoice', prefillData, open: externalOpen, onOpenChange: externalOnOpenChange }: CreateInvoiceModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Usar estado externo si se proporciona, sino usar estado interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    contactId: '',
    date: prefillData?.date || new Date().toISOString().split('T')[0],
    currency: 'EUR',
    notes: prefillData?.notes || '',
    documentNum: prefillData?.documentNum || ''
  })
  const [items, setItems] = useState<InvoiceItem[]>(
    prefillData?.items && prefillData.items.length > 0 
      ? prefillData.items 
      : [{ description: '', quantity: 1, price: 0, tax: 21 }]
  )

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/holded/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error cargando contactos:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/holded/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      loadContacts()
      loadProducts()
      
      // Si hay datos pre-rellenados, buscar el contacto automáticamente
      if (prefillData?.contactName) {
        setTimeout(() => {
          const matchingContact = contacts.find(contact => 
            contact.name.toLowerCase().includes(prefillData.contactName!.toLowerCase())
          )
          if (matchingContact) {
            setFormData(prev => ({ ...prev, contactId: matchingContact.id }))
          }
        }, 1000) // Esperar a que se carguen los contactos
      }
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0, tax: 21 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const calculateTax = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price * item.tax / 100), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.contactId) {
      toast.error('Selecciona un contacto')
      return
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.price < 0)) {
      toast.error('Completa todos los campos de los items')
      return
    }

    setIsLoading(true)

    try {
      // Convertir fecha a timestamp para Holded
      const dateTimestamp = new Date(formData.date).getTime()
      
      // Validar que la fecha sea válida
      if (isNaN(dateTimestamp)) {
        toast.error('Fecha inválida proporcionada')
        return
      }
      
      console.log('📅 Fecha convertida a timestamp:')
      console.log('  - date:', formData.date, '-> timestamp:', dateTimestamp)
      
      const documentData = {
        contactId: formData.contactId,
        date: dateTimestamp,
        currency: formData.currency,
        notes: formData.notes,
        docType: docType,
        invoiceNum: formData.documentNum,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax
        }))
      }

      const endpoint = docType === 'invoice' ? '/api/holded/invoices' : '/api/holded/waybills'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(documentData)
      })

      if (response.ok) {
        const successMessage = docType === 'invoice' ? 'Factura creada exitosamente' : 'Albarán creado exitosamente'
        toast.success(successMessage)
        setOpen(false)
        setFormData({
          contactId: '',
          date: new Date().toISOString().split('T')[0],
          currency: 'EUR',
          notes: '',
          documentNum: ''
        })
        setItems([{ description: '', quantity: 1, price: 0, tax: 21 }])
        onInvoiceCreated()
      } else {
        const error = await response.json()
        const errorMessage = docType === 'invoice' ? 'Error al crear la factura' : 'Error al crear el albarán'
        toast.error(error.message || errorMessage)
      }
    } catch (error) {
      console.error('Error creando documento:', error)
      const errorMessage = docType === 'invoice' ? 'Error al crear la factura' : 'Error al crear el albarán'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar contactos y productos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadContacts()
      loadProducts()
    }
  }, [open])

  // Actualizar el estado cuando prefillData cambie
  useEffect(() => {
    if (prefillData) {
      console.log('🔍 Datos pre-rellenados recibidos:', prefillData);
      
      setFormData(prev => ({
        ...prev,
        date: prefillData.date || prev.date,
        notes: prefillData.notes || prev.notes,
        documentNum: prefillData.documentNum || prev.documentNum
      }))
      
      if (prefillData.items && prefillData.items.length > 0) {
        setItems(prefillData.items)
      }
      
      console.log('✅ Estado actualizado con datos pre-rellenados');
    }
  }, [prefillData])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!prefillData && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo {docType === 'invoice' ? 'Factura' : 'Albarán'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Crear {docType === 'invoice' ? 'Nueva Factura' : 'Nuevo Albarán'}
          </DialogTitle>
          <DialogDescription>
            Crea {docType === 'invoice' ? 'una nueva factura' : 'un nuevo albarán'} en Holded con los datos del contacto y productos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactId">Contacto *</Label>
              <Select value={formData.contactId} onValueChange={(value) => setFormData({...formData, contactId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un contacto" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.type === 'supplier' ? 'Proveedor' : contact.type === 'customer' ? 'Cliente' : 'Ambos'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
            
            
            <div className="space-y-2">
              <Label htmlFor="documentNum">Número de {docType === 'invoice' ? 'factura' : 'albarán'}</Label>
              <Input
                id="documentNum"
                value={formData.documentNum}
                onChange={(e) => setFormData({...formData, documentNum: e.target.value})}
                placeholder={`Número del ${docType === 'invoice' ? 'factura' : 'albarán'}`}
              />
            </div>
          </div>

          {/* Items de la factura */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items de la factura</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Item
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 border rounded-lg">
                  <div className="md:col-span-2">
                    <Label htmlFor={`description-${index}`}>Descripción</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción del producto/servicio"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Cantidad</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`price-${index}`}>Precio</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`tax-${index}`}>IVA %</Label>
                    <Input
                      id={`tax-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      value={item.tax}
                      onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{calculateSubtotal().toFixed(2)} {formData.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA:</span>
              <span>{calculateTax().toFixed(2)} {formData.currency}</span>
            </div>
            <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{calculateTotal().toFixed(2)} {formData.currency}</span>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Notas adicionales para la factura..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear {docType === 'invoice' ? 'Factura' : 'Albarán'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
