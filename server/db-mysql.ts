import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema-mysql";

const dbUrl = process.env.CUSTOM_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "No database URL found. Please set CUSTOM_DB_URL or DATABASE_URL in your secrets.",
  );
}

// Create MySQL connection
export const connection = mysql.createConnection(dbUrl);
export const db = drizzle(connection, { schema, mode: 'default' });