"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, User, Building } from 'lucide-react'
import { toast } from 'sonner'

interface CreateContactModalProps {
  onContactCreated?: () => void
}

export function CreateContactModal({ onContactCreated }: CreateContactModalProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Información básica
    CustomId: 'CONT001',
    name: 'Empresa Ejemplo S.L.',
    code: 'EMP001',
    email: 'contacto@empresaejemplo.com',
    mobile: '+34 600 123 456',
    phone: '+34 91 123 45 67',
    type: 'client',
    isperson: false,
    
    // Información bancaria
    iban: 'ES91 2100 0418 4502 0005 1332',
    swift: 'CAIXESBBXXX',
    sepaRef: 'SEPA123456',
    
    // Dirección de facturación
    billAddress: {
      address: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      province: 'Madrid',
      country: 'España'
    },
    
    // Configuración por defecto
    defaults: {
      dueDays: 30,
      salesTax: 21,
      paymentMethod: 'transfer',
      currency: 'EUR',
      language: 'es',
      discount: 0
    },
    
    // Información adicional
    tags: ['cliente', 'nuevo'],
    note: 'Cliente de ejemplo para pruebas',
    
    // Persona de contacto
    contactPersons: [{
      name: 'Juan Pérez',
      phone: '+34 600 123 456',
      email: 'juan.perez@empresaejemplo.com'
    }]
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({
      ...prev,
      tags: tags
    }))
  }

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      billAddress: {
        ...prev.billAddress,
        [field]: value
      }
    }))
  }

  const handleDefaultsChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        [field]: value
      }
    }))
  }

  const handleContactPersonChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactPersons: prev.contactPersons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const contactData = {
        CustomId: formData.CustomId,
        name: formData.name,
        code: formData.code,
        email: formData.email,
        mobile: formData.mobile,
        phone: formData.phone,
        type: formData.type,
        isperson: formData.isperson,
        iban: formData.iban,
        swift: formData.swift,
        sepaRef: formData.sepaRef,
        billAddress: formData.billAddress,
        // defaults: formData.defaults,
        tags: formData.tags,
        note: formData.note,
        contactPersons: formData.contactPersons
      }

      const response = await fetch('/api/holded/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Contacto creado exitosamente en Holded')
        setOpen(false)
        onContactCreated?.()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creando contacto:', error)
      toast.error('Error al crear el contacto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Contacto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Contacto en Holded</DialogTitle>
          <DialogDescription>
            Completa los campos para crear un nuevo contacto en Holded. Los campos están precargados con datos de ejemplo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="CustomId">ID Personalizado</Label>
                <Input
                  id="CustomId"
                  value={formData.CustomId}
                  onChange={(e) => handleInputChange('CustomId', e.target.value)}
                  placeholder="CONT001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="EMP001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nombre del contacto"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Móvil</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="+34 600 123 456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+34 91 123 45 67"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="client">Cliente</option>
                  <option value="supplier">Proveedor</option>
                  <option value="both">Cliente y Proveedor</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isperson}
                    onChange={(e) => handleInputChange('isperson', e.target.checked)}
                    className="rounded"
                  />
                  Es persona física
                </Label>
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Bancaria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  placeholder="ES91 2100 0418 4502 0005 1332"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="swift">SWIFT/BIC</Label>
                <Input
                  id="swift"
                  value={formData.swift}
                  onChange={(e) => handleInputChange('swift', e.target.value)}
                  placeholder="CAIXESBBXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sepaRef">Referencia SEPA</Label>
                <Input
                  id="sepaRef"
                  value={formData.sepaRef}
                  onChange={(e) => handleInputChange('sepaRef', e.target.value)}
                  placeholder="SEPA123456"
                />
              </div>
            </div>
          </div>

          {/* Dirección de Facturación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Dirección de Facturación
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="billAddress">Dirección</Label>
              <Input
                id="billAddress"
                value={formData.billAddress.address}
                onChange={(e) => handleAddressChange('address', e.target.value)}
                placeholder="Calle Mayor 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billCity">Ciudad</Label>
                <Input
                  id="billCity"
                  value={formData.billAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="Madrid"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billPostalCode">Código Postal</Label>
                <Input
                  id="billPostalCode"
                  value={formData.billAddress.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="28001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billProvince">Provincia</Label>
                <Input
                  id="billProvince"
                  value={formData.billAddress.province}
                  onChange={(e) => handleAddressChange('province', e.target.value)}
                  placeholder="Madrid"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billCountry">País</Label>
                <Input
                  id="billCountry"
                  value={formData.billAddress.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="España"
                />
              </div>
            </div>
          </div>

          {/* Configuración por Defecto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuración por Defecto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDays">Días de Pago</Label>
                <Input
                  id="dueDays"
                  type="number"
                  value={formData.defaults.dueDays}
                  onChange={(e) => handleDefaultsChange('dueDays', parseInt(e.target.value))}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesTax">Impuesto de Ventas (%)</Label>
                <Input
                  id="salesTax"
                  type="number"
                  value={formData.defaults.salesTax}
                  onChange={(e) => handleDefaultsChange('salesTax', parseInt(e.target.value))}
                  placeholder="21"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Descuento (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.defaults.discount}
                  onChange={(e) => handleDefaultsChange('discount', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <select
                  id="paymentMethod"
                  value={formData.defaults.paymentMethod}
                  onChange={(e) => handleDefaultsChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="transfer">Transferencia</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="check">Cheque</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <select
                  id="currency"
                  value={formData.defaults.currency}
                  onChange={(e) => handleDefaultsChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Persona de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Persona de Contacto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nombre</Label>
                <Input
                  id="contactName"
                  value={formData.contactPersons[0].name}
                  onChange={(e) => handleContactPersonChange(0, 'name', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Teléfono</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPersons[0].phone}
                  onChange={(e) => handleContactPersonChange(0, 'phone', e.target.value)}
                  placeholder="+34 600 123 456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactPersons[0].email}
                  onChange={(e) => handleContactPersonChange(0, 'email', e.target.value)}
                  placeholder="juan.perez@empresaejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información Adicional</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="cliente, nuevo, importante"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Notas</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="Notas adicionales sobre el contacto"
                rows={3}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Contacto
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
