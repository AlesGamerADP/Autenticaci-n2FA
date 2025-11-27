import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

// Endpoint para inicializar la base de datos
export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos inicializada correctamente' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al inicializar base de datos' },
      { status: 500 }
    );
  }
}

