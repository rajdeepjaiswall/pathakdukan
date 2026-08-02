import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const MIRROR_URL = process.env.MIRROR_DATABASE_URL;

let mirrorPool: Pool | null = null;
if (MIRROR_URL) {
  mirrorPool = new Pool({ connectionString: MIRROR_URL });
  console.log('[mirror] Mirror database is enabled');
} else {
  console.warn('[mirror] MIRROR_DATABASE_URL not set - mirror is disabled');
}

const failuresPool = new Pool({
  connectionString: process.env.CUSTOM_DB_URL || process.env.DATABASE_URL,
});

interface MirrorStats {
  totalWrites: number;
  successfulWrites: number;
  failedWrites: number;
  pendingRetries: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastFailureMessage: string | null;
}

const stats: MirrorStats = {
  totalWrites: 0,
  successfulWrites: 0,
  failedWrites: 0,
  pendingRetries: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastFailureMessage: null,
};

export function getMirrorStats(): MirrorStats & { enabled: boolean } {
  return { ...stats, enabled: !!mirrorPool };
}

const FAILURES_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS mirror_failures (
    id SERIAL PRIMARY KEY,
    sql TEXT NOT NULL,
    params JSONB NOT NULL,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_retry_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
  );
`;
const FAILURES_INDEX_DDL = `
  CREATE INDEX IF NOT EXISTS mirror_failures_unresolved_idx
    ON mirror_failures (created_at) WHERE resolved_at IS NULL;
`;

let failuresTableReady: Promise<void> | null = null;
function ensureFailuresTable(): Promise<void> {
  if (!failuresTableReady) {
    failuresTableReady = (async () => {
      try {
        await failuresPool.query(FAILURES_TABLE_DDL);
        await failuresPool.query(FAILURES_INDEX_DDL);
        // Also mirror this DDL to keep schemas aligned
        if (mirrorPool) {
          try {
            await mirrorPool.query(FAILURES_TABLE_DDL);
            await mirrorPool.query(FAILURES_INDEX_DDL);
          } catch {}
        }
      } catch (err) {
        console.error('[mirror] Could not create mirror_failures table:', err);
        failuresTableReady = null;
        throw err;
      }
    })();
  }
  return failuresTableReady;
}
ensureFailuresTable().catch(() => {});

const SKIP_TABLE_RE = /\bmirror_failures\b/i;

export async function mirrorQuery(sql: string, params: unknown[]): Promise<void> {
  if (!mirrorPool) return;
  if (SKIP_TABLE_RE.test(sql)) return;
  stats.totalWrites++;
  try {
    await mirrorPool.query(sql, params as any[]);
    stats.successfulWrites++;
    stats.lastSuccessAt = new Date();
  } catch (err: any) {
    stats.failedWrites++;
    stats.lastFailureAt = new Date();
    stats.lastFailureMessage = err?.message ?? String(err);
    throw err;
  }
}

export async function recordMirrorFailure(
  sql: string,
  params: unknown[],
  err: any,
): Promise<void> {
  if (SKIP_TABLE_RE.test(sql)) return;
  const message = err?.message ?? String(err);
  console.error(`[mirror] write failed:`, message, '| sql:', sql.slice(0, 120));
  try {
    await ensureFailuresTable();
    await failuresPool.query(
      `INSERT INTO mirror_failures (sql, params, error_message)
       VALUES ($1, $2, $3)`,
      [sql, JSON.stringify(params), message],
    );
    stats.pendingRetries++;
  } catch (logErr) {
    console.error('[mirror] Failed to record mirror failure:', logErr);
  }
}

export async function retryMirrorFailures(maxItems = 50): Promise<{
  attempted: number;
  succeeded: number;
  stillFailing: number;
}> {
  if (!mirrorPool) return { attempted: 0, succeeded: 0, stillFailing: 0 };
  await ensureFailuresTable();

  const { rows } = await failuresPool.query<{
    id: number;
    sql: string;
    params: unknown[];
  }>(
    `SELECT id, sql, params
       FROM mirror_failures
      WHERE resolved_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1`,
    [maxItems],
  );

  let succeeded = 0;
  let stillFailing = 0;
  for (const row of rows) {
    try {
      await mirrorPool.query(row.sql, row.params as any[]);
      await failuresPool.query(
        `UPDATE mirror_failures
            SET resolved_at = now(),
                last_retry_at = now(),
                retry_count = retry_count + 1
          WHERE id = $1`,
        [row.id],
      );
      succeeded++;
      stats.pendingRetries = Math.max(0, stats.pendingRetries - 1);
    } catch (err: any) {
      await failuresPool.query(
        `UPDATE mirror_failures
            SET last_retry_at = now(),
                retry_count = retry_count + 1,
                error_message = $2
          WHERE id = $1`,
        [row.id, err?.message ?? String(err)],
      );
      stillFailing++;
    }
  }
  return { attempted: rows.length, succeeded, stillFailing };
}

const MIRROR_HEALTH_TABLES = [
  'users',
  'products',
  'orders',
  'order_items',
  'cart_items',
  'addresses',
  'reviews',
  'wishlist_items',
  'phonepe_transactions',
];

export async function getMirrorHealth(): Promise<{
  enabled: boolean;
  stats: MirrorStats;
  pendingFailures: number;
  oldestPendingAt: string | null;
  primaryRowCounts: Record<string, number>;
  mirrorRowCounts: Record<string, number>;
  inSync: boolean;
}> {
  const enabled = !!mirrorPool;
  let pendingFailures = 0;
  let oldestPendingAt: string | null = null;
  const primaryRowCounts: Record<string, number> = {};
  const mirrorRowCounts: Record<string, number> = {};

  try {
    await ensureFailuresTable();
    const pendRes = await failuresPool.query<{ count: string; oldest: Date | null }>(
      `SELECT COUNT(*)::text AS count, MIN(created_at) AS oldest
         FROM mirror_failures WHERE resolved_at IS NULL`,
    );
    pendingFailures = parseInt(pendRes.rows[0]?.count ?? '0', 10);
    oldestPendingAt = pendRes.rows[0]?.oldest
      ? new Date(pendRes.rows[0].oldest).toISOString()
      : null;
  } catch {}

  if (mirrorPool) {
    for (const tbl of MIRROR_HEALTH_TABLES) {
      try {
        const [p, m] = await Promise.all([
          failuresPool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "${tbl}"`),
          mirrorPool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "${tbl}"`),
        ]);
        primaryRowCounts[tbl] = parseInt(p.rows[0]?.count ?? '0', 10);
        mirrorRowCounts[tbl] = parseInt(m.rows[0]?.count ?? '0', 10);
      } catch {}
    }
  }

  const inSync =
    enabled &&
    pendingFailures === 0 &&
    Object.keys(primaryRowCounts).every(
      (k) => primaryRowCounts[k] === mirrorRowCounts[k],
    );

  return {
    enabled,
    stats: { ...stats },
    pendingFailures,
    oldestPendingAt,
    primaryRowCounts,
    mirrorRowCounts,
    inSync,
  };
}

if (mirrorPool) {
  const RETRY_INTERVAL_MS = 5 * 60 * 1000;
  setInterval(() => {
    retryMirrorFailures(50)
      .then((res) => {
        if (res.attempted > 0) {
          console.log(
            `[mirror] retry batch: attempted=${res.attempted} succeeded=${res.succeeded} stillFailing=${res.stillFailing}`,
          );
        }
      })
      .catch((err) => {
        console.error('[mirror] retry batch error:', err);
      });
  }, RETRY_INTERVAL_MS);
}
