import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create database connection
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema });
