import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { HoldedClient } from '@/holded/client';

// PATCH - Actualizar status de documento en Holded
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docType: string; id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { docType, id } = await params;
    const body = await req.json();
    const { approveDoc } = body;

    // Validar tipo de documento
    if (!['invoice', 'waybill'].includes(docType)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de documento inválido. Debe ser "invoice" o "waybill"',
      }, { status: 400 });
    }

    // Validar parámetros
    if (typeof approveDoc !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'El campo approveDoc debe ser un booleano',
      }, { status: 400 });
    }

    const holded = new HoldedClient();

    // Obtener el documento actual para preservar sus datos
    const currentDoc = await holded.getDocument(docType as 'invoice' | 'waybill', id);
    
    // Actualizar el documento con el nuevo status
    const updateData = {
      ...currentDoc,
      approveDoc: approveDoc
    };

    console.log(`📄 Actualizando status de ${docType} ${id}:`, { approveDoc });

    const updatedDoc = await holded.updateDocument(docType as 'invoice' | 'waybill', id, updateData);

    return NextResponse.json({
      success: true,
      document: updatedDoc,
      message: `Status del ${docType === 'invoice' ? 'factura' : 'albarán'} actualizado exitosamente`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error actualizando status del documento:`, error);
    
    return NextResponse.json({
      success: false,
      error: 'Error actualizando status del documento',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
