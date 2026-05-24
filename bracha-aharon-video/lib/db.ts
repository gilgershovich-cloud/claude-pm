import { Pool } from "pg";

// Lead captured from the landing-page contact form.
export interface LeadInput {
  name: string;
  phone: string;
  email?: string | null;
  eventType?: string | null;
  message?: string | null;
  locale?: string | null;
}

export interface Lead extends LeadInput {
  id: string;
  createdAt: string;
}

// Vercel's Postgres/Neon integration injects the connection string under one of
// several names depending on the integration version. Prefer pooled URLs.
function getConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getConnectionString());
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function useSsl(connectionString: string): boolean {
  const flag = process.env.DATABASE_SSL;
  if (flag === "true") return true;
  if (flag === "false") return false;
  // Hosted providers (Neon, Vercel Postgres, Supabase) require TLS; local does not.
  return !/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);
}

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  pool = new Pool({
    connectionString,
    ssl: useSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  return pool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS leads (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    phone       text NOT NULL,
    email       text,
    event_type  text,
    message     text,
    locale      text,
    source      text NOT NULL DEFAULT 'landing',
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
`;

// Ensure the table exists. Runs at most once per process.
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((err) => {
        // Reset so a later request can retry schema creation.
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

export async function insertLead(input: LeadInput): Promise<Lead> {
  await ensureSchema();
  const { rows } = await getPool().query(
    `INSERT INTO leads (name, phone, email, event_type, message, locale)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, phone, email, event_type AS "eventType",
               message, locale, created_at AS "createdAt"`,
    [
      input.name,
      input.phone,
      input.email ?? null,
      input.eventType ?? null,
      input.message ?? null,
      input.locale ?? null,
    ],
  );
  return rows[0] as Lead;
}
