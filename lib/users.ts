import bcrypt from 'bcryptjs';
import { pool } from './db';

export interface User {
  id: string;
  email: string;
  password: string;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
}

// Convertir fila de BD a objeto User
function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    twoFactorSecret: row.two_factor_secret || undefined,
    twoFactorEnabled: row.two_factor_enabled || false,
  };
}

// Buscar usuario por email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return rowToUser(result.rows[0]);
}

// Buscar usuario por ID
export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return rowToUser(result.rows[0]);
}

// Crear nuevo usuario
export async function createUser(email: string, password: string): Promise<User> {
  // Verificar si el usuario ya existe
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('El usuario ya existe');
  }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = Date.now().toString();

  const result = await pool.query(
    `INSERT INTO users (id, email, password, two_factor_enabled)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, email, hashedPassword, false]
  );

  return rowToUser(result.rows[0]);
}

// Verificar contraseña
export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return await bcrypt.compare(password, user.password);
}

// Actualizar usuario
export async function updateUser(user: User): Promise<void> {
  await pool.query(
    `UPDATE users 
     SET email = $1, password = $2, two_factor_secret = $3, two_factor_enabled = $4, updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [
      user.email,
      user.password,
      user.twoFactorSecret || null,
      user.twoFactorEnabled,
      user.id,
    ]
  );
}

