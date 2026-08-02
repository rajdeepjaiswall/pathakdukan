import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Add CORS headers - simplified for cloud deployment
app.use((req, res, next) => {
  // Allow CORS for development and production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://*.replit.app',
    'https://*.replit.co',
    'https://*.replit.dev'
  ];

  const origin = req.headers.origin;
  if (origin && (allowedOrigins.some(allowed =>
    allowed.includes('*') ? origin.includes(allowed.replace('*.', '')) : origin === allowed
  ) || process.env.NODE_ENV === 'development')) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add health check endpoint for Cloud Run (before routes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Daily background job: permanently purge soft-deleted users past their 30-day recovery window
async function startAccountPurgeJob() {
  const { storage } = await import('./storage');
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const runOnce = async () => {
    try {
      const purged = await storage.purgeExpiredDeletedUsers();
      if (purged > 0) {
        log(`[purge-job] Permanently removed ${purged} expired deleted account(s).`);
      }
    } catch (err: any) {
      console.error('[purge-job] Failed:', err?.message || err);
    }
  };
  // Run once 30s after boot, then every 24h
  setTimeout(runOnce, 30 * 1000);
  setInterval(runOnce, ONE_DAY_MS);
}

async function runStartupMigrations() {
  const { pool } = await import('./db');
  const migrations = [
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_variants jsonb DEFAULT '[]'::jsonb`,
    `ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected_weight text`,
    `ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_price numeric(10,2)`,
    `ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_weight text`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS handling_charge numeric(10,2) DEFAULT '0.00'`,
    `CREATE TABLE IF NOT EXISTS charges_settings (
      id serial PRIMARY KEY,
      delivery_enabled boolean NOT NULL DEFAULT false,
      delivery_free_threshold_enabled boolean NOT NULL DEFAULT false,
      delivery_free_threshold numeric(10,2) NOT NULL DEFAULT '0',
      delivery_percentage_enabled boolean NOT NULL DEFAULT false,
      delivery_percentage numeric(5,2) NOT NULL DEFAULT '0',
      delivery_fixed_enabled boolean NOT NULL DEFAULT false,
      delivery_fixed_charge numeric(10,2) NOT NULL DEFAULT '0',
      handling_enabled boolean NOT NULL DEFAULT false,
      handling_free_threshold_enabled boolean NOT NULL DEFAULT false,
      handling_free_threshold numeric(10,2) NOT NULL DEFAULT '0',
      handling_percentage_enabled boolean NOT NULL DEFAULT false,
      handling_percentage numeric(5,2) NOT NULL DEFAULT '0',
      handling_fixed_enabled boolean NOT NULL DEFAULT false,
      handling_fixed_charge numeric(10,2) NOT NULL DEFAULT '0',
      updated_at timestamp DEFAULT now()
    )`,
  ];
  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (err: any) {
      console.error('[migration] Failed:', sql, err?.message);
    }
  }
  log('[migration] Startup column migrations complete');
}

(async () => {
  await runStartupMigrations();
  const server = await registerRoutes(app);
  startAccountPurgeJob();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Unhandled error:", err);
    res.status(status).json({ message });
  });

  // Setup Vite in development, serve static files in production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment port for Cloud Run compatibility, fallback to 5000
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const host = "0.0.0.0"; // Always use 0.0.0.0 for Cloud Run compatibility
  
  server.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
