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
  connectionTimeoutMillis: 2000,
  retryDelay: 1000,
  maxRetries: 3
};

export const pool = new Pool(poolConfig);

// Handle pool errors with retry logic
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Attempt to reconnect
  pool.connect().catch(connectErr => {
    console.error('Failed to reconnect to database:', connectErr);
  });
});

// Test connection on startup with retry
let connectionAttempts = 0;
const maxConnectionAttempts = 5;
const connectWithRetry = async () => {
    try {
        await pool.connect();
        console.log("Database connection successful!");
    } catch (error) {
        connectionAttempts++;
        if (connectionAttempts < maxConnectionAttempts) {
            console.error(`Database connection failed (attempt ${connectionAttempts}). Retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            await connectWithRetry();
        } else {
            console.error("Failed to connect to the database after multiple retries.");
            process.exit(1);
        }
    }
}

connectWithRetry();

export const db = drizzle({ client: pool, schema });