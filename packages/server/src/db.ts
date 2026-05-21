import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, '..');

const dataDir = path.join(serverRoot, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'erp.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export function runMigrations(): void {
  const migrationsFolder = path.join(serverRoot, 'drizzle');
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`找不到資料庫遷移檔（${migrationsFolder}），請先執行 pnpm db:generate`);
  }
  migrate(db, { migrationsFolder });
}
