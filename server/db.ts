import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  retryDelay: 1000,
  maxRetries: 3
};

export const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Attempt to reconnect
  pool.connect().catch(connectErr => {
    console.error('Failed to reconnect to database:', connectErr);
  });
});

// Test connection on startup
pool.connect().catch(err => {
  console.error('Initial database connection failed:', err);
  process.exit(1);
});
export const db = drizzle({ client: pool, schema });
