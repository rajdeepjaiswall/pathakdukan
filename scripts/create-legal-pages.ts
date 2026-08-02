import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS legal_pages (
      id serial PRIMARY KEY,
      page_type text NOT NULL,
      level integer NOT NULL DEFAULT 2,
      title text NOT NULL,
      content text,
      list_items text[] DEFAULT '{}',
      highlight boolean DEFAULT false,
      display_order integer DEFAULT 0,
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now(),
      updated_at timestamp DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS legal_pages_page_type_idx ON legal_pages(page_type, display_order)
  `);
  console.log('legal_pages table ready');
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
