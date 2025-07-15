import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
    }

    const data = await apiClient.get('/api/notifications/unread-count', {
      'Authorization': `Bearer ${token}`
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
} 