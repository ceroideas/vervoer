import { NextRequest, NextResponse } from 'next/server';



export async function GET(req: NextRequest) {
  console.log('🧪 API de prueba GET llamada')
  return NextResponse.json({ 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  console.log('🧪 API de prueba POST llamada')
  return NextResponse.json({ 
    message: 'POST funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}
