import { Pool } from 'pg';

// Función para crear un pool de conexiones
function createPool(database?: string) {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: database || process.env.DB_NAME || 'llave_auth',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Aumentado a 10 segundos
    query_timeout: 30000, // Timeout para queries
    statement_timeout: 30000, // Timeout para statements
  });
}

// Pool principal para la aplicación
const pool = createPool();

// Variable para evitar múltiples intentos concurrentes
let dbCreationInProgress = false;
let dbCreationPromise: Promise<void> | null = null;

// Crear la base de datos si no existe
async function ensureDatabaseExists() {
  // Si ya hay una creación en progreso, esperar a que termine
  if (dbCreationInProgress && dbCreationPromise) {
    return dbCreationPromise;
  }

  // Si la BD ya fue verificada, no hacer nada
  if (!dbCreationInProgress) {
    dbCreationInProgress = true;
    dbCreationPromise = (async () => {
      const dbName = process.env.DB_NAME || 'llave_auth';
      const adminPool = createPool('postgres'); // Conectar a postgres para crear otras BDs
      
      try {
        // Verificar si la base de datos existe
        const checkResult = await adminPool.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [dbName]
        );

        if (checkResult.rows.length === 0) {
          console.log(`📦 La base de datos '${dbName}' no existe. Creándola...`);
          
          // Validar nombre de BD (seguridad)
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
            throw new Error(`Nombre de base de datos inválido: ${dbName}`);
          }

          try {
            await adminPool.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Base de datos '${dbName}' creada exitosamente`);
          } catch (createError: any) {
            // Si ya existe (puede pasar en ejecuciones concurrentes), está bien
            if (createError.message.includes('already exists') || 
                createError.code === '42P04') {
              console.log(`✅ La base de datos '${dbName}' ya existe (creada por otro proceso)`);
            } else {
              throw createError;
            }
          }
        } else {
          console.log(`✅ La base de datos '${dbName}' ya existe`);
        }
      } catch (error: any) {
        // Ignorar errores de "ya existe" o de tipos duplicados (pueden ocurrir en ejecuciones concurrentes)
        if (error.message.includes('already exists') || 
            error.code === '42P04' ||
            error.message.includes('duplicate key') ||
            error.message.includes('pg_type_typname_nsp_index')) {
          console.log(`✅ La base de datos '${dbName}' ya existe o está siendo creada`);
          // No lanzar el error, solo continuar
        } else {
          console.error(`❌ Error verificando/creando base de datos:`, error.message);
          // No lanzar el error para evitar bloquear la aplicación
          // La BD puede ya existir y funcionar
        }
      } finally {
        await adminPool.end();
        dbCreationInProgress = false;
        dbCreationPromise = null;
      }
    })();
  }

  return dbCreationPromise!;
}

// Variable para evitar múltiples inicializaciones concurrentes
let initializationInProgress = false;
let initializationPromise: Promise<void> | null = null;

// Inicializar la tabla de usuarios si no existe
export async function initializeDatabase() {
  // Si ya hay una inicialización en progreso, esperar a que termine
  if (initializationInProgress && initializationPromise) {
    return initializationPromise;
  }

  if (!initializationInProgress) {
    initializationInProgress = true;
    initializationPromise = (async () => {
      let client;
      try {
        // Primero asegurar que la base de datos existe (sin bloquear si falla)
        try {
          await ensureDatabaseExists();
        } catch (dbError: any) {
          // Ignorar errores de creación de BD (puede que ya exista)
          if (!dbError.message.includes('already exists') && 
              !dbError.message.includes('duplicate key')) {
            console.warn('⚠️  Advertencia al verificar BD:', dbError.message);
          }
        }
        
        // Esperar un momento para que la BD esté lista si se acaba de crear
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Intentar conectar con timeout
        client = await Promise.race([
          pool.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout al conectar a la base de datos')), 10000)
          )
        ]) as any;
        
        // Verificar conexión
        await client.query('SELECT NOW()');
        
        // Crear tabla con manejo de errores de concurrencia
        try {
          await client.query(`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(255) PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL,
              two_factor_secret VARCHAR(255),
              two_factor_enabled BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
        } catch (tableError: any) {
          // Ignorar errores de "ya existe" o de tipos duplicados
          if (!tableError.message.includes('already exists') &&
              !tableError.message.includes('duplicate key') &&
              !tableError.message.includes('pg_type_typname_nsp_index')) {
            throw tableError;
          }
        }
        
        // Crear índice con manejo de errores
        try {
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
          `);
        } catch (indexError: any) {
          // Ignorar errores de índice ya existente
          if (!indexError.message.includes('already exists') &&
              !indexError.message.includes('duplicate key')) {
            throw indexError;
          }
        }
        
        console.log('✅ Tabla de usuarios creada/verificada correctamente');
      } catch (error: any) {
        const errorMessage = error.message || 'Error desconocido';
        
        // Ignorar errores de tipos duplicados (pueden ocurrir en ejecuciones concurrentes)
        if (errorMessage.includes('duplicate key') && 
            errorMessage.includes('pg_type_typname_nsp_index')) {
          console.log('✅ Base de datos ya inicializada (ignorando error de concurrencia)');
          return; // No lanzar error, la BD ya está lista
        }
        
        console.error('❌ Error inicializando base de datos:', errorMessage);
        
        // Mensajes más descriptivos
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          console.error('💡 Verifica:');
          console.error('   - Que el host de la BD sea correcto:', process.env.DB_HOST || 'localhost');
          console.error('   - Que el Security Group de RDS permita tu IP');
          console.error('   - Que las credenciales sean correctas');
          console.error('   - Que la base de datos esté accesible');
        } else if (errorMessage.includes('ECONNREFUSED')) {
          console.error('💡 No se puede conectar al servidor de base de datos');
          console.error('   Verifica que PostgreSQL esté corriendo o que RDS esté accesible');
        } else if (errorMessage.includes('password authentication')) {
          console.error('💡 Error de autenticación');
          console.error('   Verifica usuario y contraseña en las variables de entorno');
        } else if (errorMessage.includes('does not exist')) {
          console.error('💡 La base de datos no existe');
          console.error('   La aplicación intentará crearla automáticamente en el próximo intento');
        }
        
        throw error;
      } finally {
        if (client) {
          client.release();
        }
        initializationInProgress = false;
        initializationPromise = null;
      }
    })();
  }

  return initializationPromise!;
}

export { pool };

