import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// POST create a new claim
export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const body = await req.json();

    const response = await fetch(`${API_URL}/api/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ success: false, error: data.error || 'Error en el backend al crear el claim' }, { status: response.status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[CLAIMS_POST_API_ROUTE]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 