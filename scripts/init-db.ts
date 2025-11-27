import { config } from 'dotenv';
import { initializeDatabase } from '../lib/db';

// Cargar variables de entorno desde .env
config();

async function main() {
  try {
    console.log('Inicializando base de datos...');
    await initializeDatabase();
    console.log('Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    process.exit(1);
  }
}

main();

