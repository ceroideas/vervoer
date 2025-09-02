import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  console.log('🧪 === TEST ENDPOINT ===')
  console.log('📅 Timestamp:', new Date().toISOString())
  console.log('🌐 URL completa:', req.url)
  console.log('📋 Headers completos:', Object.fromEntries(req.headers.entries()))
  
  return NextResponse.json({
    success: true,
    message: 'Test endpoint funcionando',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  console.log('🧪 API de prueba POST llamada')
  return NextResponse.json({ 
    message: 'POST funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}
