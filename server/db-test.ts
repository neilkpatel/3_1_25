
import { db } from "./db";
import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT 1`);
    console.log("Database connection successful!");
    return result;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

testConnection();
