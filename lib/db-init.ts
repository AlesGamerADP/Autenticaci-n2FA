import { initializeDatabase } from './db';

let initialized = false;

export async function ensureDatabaseInitialized() {
  if (initialized) {
    return;
  }

  try {
    await initializeDatabase();
    initialized = true;
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error: any) {
    console.error('❌ Error inicializando base de datos:', error.message);
    
    // Si no hay variables de entorno configuradas, sugerir usar desarrollo local
    if (!process.env.DB_HOST || process.env.DB_HOST === 'localhost') {
      console.warn('⚠️  No se encontró configuración de base de datos');
      console.warn('💡 Opciones:');
      console.warn('   1. Configura variables de entorno (.env) para RDS');
      console.warn('   2. Usa PostgreSQL local: docker-compose -f docker-compose.dev.yml up postgres');
      console.warn('   3. O ejecuta la app en modo desarrollo local');
    }
    
    // Re-lanzar el error para que las rutas API puedan manejarlo
    throw error;
  }
}

// Inicializar automáticamente al importar el módulo
if (typeof window === 'undefined') {
  // Solo en el servidor
  ensureDatabaseInitialized().catch(console.error);
}

