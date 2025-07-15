import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// GET a specific CType by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ctypeId: string }> }
) {
  try {
    const token = getToken(req);
    const { ctypeId } = await params;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/api/ctypes/${ctypeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error al obtener el CType' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[CTYPE_BY_ID_GET_API_ROUTE]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 