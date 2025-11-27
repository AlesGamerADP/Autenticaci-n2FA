import { pool } from './db';

/**
 * Verifica la conexión a la base de datos
 * Útil para diagnosticar problemas de conexión
 */
export async function checkDatabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      return {
        success: true,
        message: 'Conexión exitosa a la base de datos',
        details: {
          currentTime: result.rows[0].current_time,
          postgresVersion: result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1],
        }
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Error de conexión a la base de datos',
      details: {
        error: error.message,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'llave_auth',
        user: process.env.DB_USER || 'postgres',
        ssl: process.env.DB_SSL === 'true',
      }
    };
  }
}

