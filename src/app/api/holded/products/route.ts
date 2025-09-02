import { NextRequest, NextResponse } from 'next/server';
import { holdedClient } from '@/holded/client';



export async function GET(req: NextRequest) {
  try {
    // Obteniendo productos de Holded
    
    const products = await holdedClient.getProducts();
    
          // Productos obtenidos
    
    return NextResponse.json({
      success: true,
      products: products,
      count: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos de Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo productos de Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
          // Creando nuevo producto en Holded
    
    const body = await req.json();
    const { name, description, price, cost, sku, category } = body;

    // Validar campos requeridos
    if (!name || !price) {
      return NextResponse.json({
        success: false,
        error: 'Nombre y precio son campos requeridos',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Preparar datos del producto según la documentación oficial de Holded
    const productData = {
      kind: 'simple', // Campo obligatorio según Holded
      name,
      desc: description || '', // Campo 'desc' según documentación
      price: parseFloat(price),
      tax: 0, // Impuesto por defecto
      cost: cost ? parseFloat(cost) : 0,
      calculatecost: cost ? parseFloat(cost) : 0, // Campo adicional según documentación
      purchasePrice: cost ? parseFloat(cost) : 0, // Campo adicional según documentación
      tags: [], // Array de strings según documentación
      barcode: '', // Código de barras
      sku: sku || '',
      weight: 0, // Peso
      stock: 0, // Stock inicial
    };

          // Datos del producto a crear

    const newProduct = await holdedClient.createProduct(productData);
    
          // Producto creado en Holded
    
    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Producto creado exitosamente en Holded',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error creando producto en Holded:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error creando producto en Holded',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
