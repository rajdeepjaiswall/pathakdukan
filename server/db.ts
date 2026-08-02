import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { mirrorQuery, recordMirrorFailure } from './mirror';

neonConfig.webSocketConstructor = ws;

const dbUrl = process.env.CUSTOM_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "No database URL found. Please set CUSTOM_DB_URL in your secrets.",
  );
}

export const pool = new Pool({ connectionString: dbUrl });

// Mirror pool used as fallback when primary is disabled/down
const mirrorPool = process.env.MIRROR_DATABASE_URL
  ? new Pool({ connectionString: process.env.MIRROR_DATABASE_URL })
  : null;

const ENDPOINT_DISABLED = 'endpoint has been disabled';

const WRITE_RE = /^\s*(INSERT|UPDATE|DELETE)\b/i;

const originalQuery = pool.query.bind(pool) as any;
(pool as any).query = function patchedQuery(...args: any[]) {
  let sqlText: string | undefined;
  let params: unknown[] | undefined;
  const first = args[0];
  if (typeof first === 'string') {
    sqlText = first;
    params = args[1];
  } else if (first && typeof first === 'object' && typeof first.text === 'string') {
    sqlText = first.text;
    params = first.values;
  }

  const isWrite = sqlText ? WRITE_RE.test(sqlText) : false;

  // Attempt the primary; on "endpoint disabled" fall back to mirror pool
  const primaryResult = (originalQuery(...args) as Promise<any>).catch(async (err: any) => {
    const msg: string = err?.message ?? '';
    if (mirrorPool && msg.includes(ENDPOINT_DISABLED)) {
      console.warn('[db] Primary disabled — falling back to mirror for query');
      return (mirrorPool as any).query(...args);
    }
    throw err;
  });

  // Replicate writes to mirror (only when primary is healthy; skip if we're
  // already reading/writing through the mirror as fallback)
  if (isWrite && sqlText) {
    const sqlForMirror = sqlText;
    const paramsForMirror = params ?? [];
    Promise.resolve(primaryResult)
      .then((res) => {
        // If the result came from the primary (not fallback), sync to mirror
        mirrorQuery(sqlForMirror, paramsForMirror).catch(() => {});
        return res;
      })
      .catch((err) => recordMirrorFailure(sqlForMirror, paramsForMirror, err));
  }

  return primaryResult;
};

export const db = drizzle({ client: pool, schema });
