import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/db-check';

/**
 * Endpoint de health check que verifica la conexión a la base de datos
 */
export async function GET() {
  const dbCheck = await checkDatabaseConnection();
  
  if (dbCheck.success) {
    return NextResponse.json({
      status: 'healthy',
      database: dbCheck,
      timestamp: new Date().toISOString(),
    });
  } else {
    return NextResponse.json({
      status: 'unhealthy',
      database: dbCheck,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

