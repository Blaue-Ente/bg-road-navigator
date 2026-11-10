import { Pool } from "pg";

export const BETTER_AUTH_TABLES = [
  "user",
  "session",
  "account",
  "verification",
] as const;

export function authTablesReady(present: Iterable<string>): boolean {
  const names = new Set(present);
  return BETTER_AUTH_TABLES.every((table) => names.has(table));
}

/** Cheap liveness probe. Does not use the shared application pool. */
export async function probeDatabase(
  connectionString: string,
  timeoutMs = 1500
): Promise<{ reachable: boolean; authTablesReady: boolean }> {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: timeoutMs,
    query_timeout: timeoutMs,
    max: 1,
  });
  try {
    await pool.query("select 1");
    const tables = await pool.query<{ table_name: string }>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public'
         and table_name = any($1::text[])`,
      [[...BETTER_AUTH_TABLES]]
    );
    return {
      reachable: true,
      authTablesReady: authTablesReady(tables.rows.map((row) => row.table_name)),
    };
  } catch {
    return { reachable: false, authTablesReady: false };
  } finally {
    await pool.end().catch(() => undefined);
  }
}
