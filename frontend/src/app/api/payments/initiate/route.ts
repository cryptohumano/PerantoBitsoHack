import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🚀 [API] Endpoint /api/payments/initiate llamado');
  
  try {
    const body = await request.json();
    console.log('📤 [API] Datos recibidos:', body);

    // Validar datos requeridos
    if (!body.method || !body.amount || !body.kiltAddress) {
      console.error('❌ [API] Datos faltantes:', body);
      return NextResponse.json(
        { success: false, message: 'Datos requeridos: method, amount, kiltAddress' },
        { status: 400 }
      );
    }

    // Llamar al backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📊 [API] Respuesta del backend:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [API] Error del backend:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Error del servidor' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API] Respuesta exitosa:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [API] Error interno:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 