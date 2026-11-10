import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

export class DatabaseUnavailableError extends Error {
  constructor(message = "DATABASE_URL is not set") {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export class MigrationRequiredError extends Error {
  constructor() {
    super("Database migration has not been applied");
    this.name = "MigrationRequiredError";
  }
}

let pool: Pool | null = null;
let database: NodePgDatabase<typeof schema> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!isDatabaseConfigured()) throw new DatabaseUnavailableError();
  if (!database) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    database = drizzle(pool, { schema });
  }
  return database;
}

export function normalizeDbError(error: unknown): Error {
  if (error instanceof DatabaseUnavailableError) return error;
  if (error instanceof MigrationRequiredError) return error;
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code)
      : "";
  if (code === "42P01" || code === "42704") return new MigrationRequiredError();
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return new DatabaseUnavailableError("Database connection failed");
  }
  return error instanceof Error ? error : new Error("Database error");
}
