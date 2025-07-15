import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// GET available CTypes for the current user
export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/ctypes/available`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error al obtener los CTypes disponibles' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[CTYPES_AVAILABLE_GET_API_ROUTE]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 