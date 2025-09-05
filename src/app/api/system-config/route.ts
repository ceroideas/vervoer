import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function GET() {
  try {
    // Debug: Log de variables de entorno
    console.log('🔍 Variables de entorno disponibles:')
    console.log('HOLDED_API_KEY:', process.env.HOLDED_API_KEY ? '***' + process.env.HOLDED_API_KEY.slice(-4) : 'No definida')
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***' + process.env.OPENAI_API_KEY.slice(-4) : 'No definida')

    // Obtener configuración desde variables de entorno
    // Si no están disponibles, usar valores de ejemplo para demostración
    const config = {
      holdedApiKey: process.env.HOLDED_API_KEY || 'd2e52f08894f3322cdf43d4e58c0d909',
      holdedBaseUrl: 'https://api.holded.com/api/v1',
      openaiApiKey: process.env.OPENAI_API_KEY || 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    }
    
    console.log('📋 Configuración enviada:', {
      holdedApiKey: config.holdedApiKey ? '***' + config.holdedApiKey.slice(-4) : 'Vacía',
      holdedBaseUrl: config.holdedBaseUrl,
      openaiApiKey: config.openaiApiKey ? '***' + config.openaiApiKey.slice(-4) : 'Vacía'
    })
    
    return NextResponse.json({ 
      success: true, 
      data: config
    })
  } catch (error) {
    console.error('Error obteniendo configuración del sistema:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
