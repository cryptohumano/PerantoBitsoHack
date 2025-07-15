import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/admin/users`;
    console.log('Fetching from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text();
        console.error('Response text:', text);
        errorData = { error: `HTTP ${response.status}: ${text.substring(0, 200)}` };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 