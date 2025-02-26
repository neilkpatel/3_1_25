
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

class DatabasePool {
  private pool: Pool;
  private retryCount: number = 0;
  private maxRetries: number = 5;
  private baseDelay: number = 1000;

  constructor() {
    this.pool = new Pool(poolConfig);
    this.setupErrorHandler();
  }

  private setupErrorHandler() {
    this.pool.on('error', async (err) => {
      console.error('Database pool error:', err);
      if (err.code === '57P01') {
        await this.reconnect();
      }
    });
  }

  private async reconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    this.retryCount++;

    console.log(`Attempting reconnection in ${delay}ms...`);
    
    try {
      await this.pool.end();
      this.pool = new Pool(poolConfig);
      const client = await this.pool.connect();
      client.release();
      console.log('Successfully reconnected to database');
      this.retryCount = 0;
    } catch (error) {
      console.error('Reconnection failed:', error);
      setTimeout(() => this.reconnect(), delay);
    }
  }

  public getPool(): Pool {
    return this.pool;
  }
}

const databasePool = new DatabasePool();
export const pool = databasePool.getPool();
export const db = drizzle({ client: pool, schema });
