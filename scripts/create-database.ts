import { config } from 'dotenv';
import { Pool } from 'pg';

// Cargar variables de entorno desde .env
config();

/**
 * Script para crear la base de datos si no existe
 * Se conecta a la BD 'postgres' por defecto para crear la nueva BD
 */
async function createDatabase() {
  const dbName = process.env.DB_NAME || 'llave_auth';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432');
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

  // Mostrar configuración (sin mostrar contraseña completa)
  console.log(`📋 Configuración de conexión:`);
  console.log(`   Host: ${dbHost}`);
  console.log(`   Puerto: ${dbPort}`);
  console.log(`   Base de datos: ${dbName}`);
  console.log(`   Usuario: ${dbUser}`);
  console.log(`   SSL: ${dbSsl ? 'Habilitado' : 'Deshabilitado'}`);

  // Conectar a la base de datos 'postgres' (por defecto) para crear la nueva BD
  const adminPool = new Pool({
    host: dbHost,
    port: dbPort,
    database: 'postgres', // Conectarse a postgres para crear otras BDs
    user: dbUser,
    password: dbPassword,
    ssl: dbSsl,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log(`🔍 Verificando si la base de datos '${dbName}' existe...`);

    // Verificar si la base de datos ya existe
    const checkResult = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ La base de datos '${dbName}' ya existe`);
      await adminPool.end();
      return;
    }

    console.log(`📦 Creando base de datos '${dbName}'...`);

    // Crear la base de datos
    // Nota: No podemos usar parámetros en CREATE DATABASE, así que debemos validar el nombre
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
      throw new Error(`Nombre de base de datos inválido: ${dbName}`);
    }

    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Base de datos '${dbName}' creada exitosamente`);

    await adminPool.end();
  } catch (error: any) {
    await adminPool.end();
    
    if (error.message.includes('already exists')) {
      console.log(`✅ La base de datos '${dbName}' ya existe`);
      return;
    }
    
    console.error(`❌ Error creando base de datos:`, error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

export { createDatabase };

