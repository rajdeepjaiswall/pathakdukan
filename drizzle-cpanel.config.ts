import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema-mysql.ts",
  out: "./drizzle-mysql",
  dialect: "mysql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});