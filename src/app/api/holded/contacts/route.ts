import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';



export async function GET(req: NextRequest) {
  try {
    console.log('👥 Obteniendo contactos de Holded...');
    
    const contacts = await holdedClient.getContacts();
    
    console.log(`✅ Contactos obtenidos: ${contacts.length}`);
    
    return NextResponse.json({
      success: true,
      contacts: contacts,
      count: contacts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo contactos de Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo contactos de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json();
    
    console.log('👥 Creando contacto en Holded:', contactData);
    
    const response = await fetch(`https://api.holded.com/api/invoicing/v1/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'key': holdedClient['apiKey'],
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error de Holded API:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error de Holded API: ${response.status} - ${errorText}` 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ Contacto creado exitosamente:', result);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Contacto creado exitosamente en Holded',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error creando contacto:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear el contacto',
        details: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
