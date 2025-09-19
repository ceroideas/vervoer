import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { HoldedClient } from '@/holded/client'

// GET - Obtener albaranes de Holded
export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const holded = new HoldedClient()
    const waybills = await holded.getWaybills()

    return NextResponse.json({
      success: true,
      waybills: waybills
    })
  } catch (error) {
    console.error('Error obteniendo albaranes de Holded:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener albaranes'
    }, { status: 500 })
  }
}

// POST - Crear nuevo albarán en Holded
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      contactId, 
      contactName,
      date, 
      currency, 
      notes, 
      items,
      invoiceNum, // El frontend envía invoiceNum para ambos tipos
      applyContactDefaults = true,
      approveDoc = true // Siempre aprobar documentos
    } = body

    // Validar datos requeridos
    if (!contactId || !date || !items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos'
      }, { status: 400 })
    }

    const holded = new HoldedClient()
    
    // Calcular fecha correctamente para albaranes según documentación oficial
    const issueDate = new Date(date)
    
    // Validar que la fecha sea válida
    if (isNaN(issueDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Fecha inválida proporcionada'
      }, { status: 400 })
    }
    
    // Ajustar la hora a las 12:00 para evitar problemas con medianoche
    issueDate.setHours(12, 0, 0, 0)
    
    // Holded espera timestamps en SEGUNDOS (Unix timestamp)
    const dateTimestamp = Math.floor(issueDate.getTime() / 1000)
    
    console.log('📅 Fechas del albarán:')
    console.log('  - Fecha original:', date)
    console.log('  - Fecha parseada:', issueDate.toISOString())
    console.log('  - Timestamp (segundos):', dateTimestamp)
    console.log('  - Timestamp (milisegundos):', issueDate.getTime())
    
    // Verificar si el contacto existe y obtener su nombre
    console.log('🔍 Verificando contacto en Holded...')
    let resolvedContactName = ''
    try {
      const contact = await holded.getContact(contactId)
      resolvedContactName = contact.name
      console.log('✅ Contacto encontrado:', resolvedContactName)
    } catch (contactError) {
      console.error('❌ Error verificando contacto:', contactError)
      return NextResponse.json({
        success: false,
        error: 'Contacto no encontrado en Holded'
      }, { status: 400 })
    }
    
    // Crear el albarán en Holded usando la estructura exacta de la documentación oficial
    const waybillData = {
      applyContactDefaults: applyContactDefaults || true,
      contactId,
      contactName: resolvedContactName,
      desc: notes || '',
      date: dateTimestamp, // Timestamp en segundos (Unix timestamp)
      notes: notes || '',
      currency: currency || 'EUR',
      invoiceNum: invoiceNum || '', // Usar invoiceNum para el número de albarán
      approveDoc: true, // Siempre aprobar documentos automáticamente
      items: items.map((item: any) => ({
        name: item.description,
        desc: item.description,
        units: item.quantity,
        subtotal: item.price, // Precio unitario, Holded calculará el total (units * subtotal)
        discount: 0,
        tax: item.tax || 21,
        taxes: [`${item.tax || 21}`],
        supplied: '1' // 1 = suministrado para albaranes
      }))
    }

    console.log('📄 Datos del albarán a enviar a Holded:', JSON.stringify(waybillData, null, 2))

    const newWaybill = await holded.createWaybill(waybillData)

    return NextResponse.json({
      success: true,
      waybill: newWaybill,
      message: 'Albarán creado exitosamente'
    })
  } catch (error) {
    console.error('Error creando albarán en Holded:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al crear el albarán'
    }, { status: 500 })
  }
}
