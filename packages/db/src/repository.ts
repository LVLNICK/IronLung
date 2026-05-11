import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { fileURLToPath } from "node:url";
import { initialMigration, tableNames, type TableName } from "./schema";

export type Primitive = string | number | null;
export type Row = Record<string, Primitive>;
export type Snapshot = Record<TableName, Row[]>;

export interface IronLogDatabase {
  db: Database;
  exportBytes(): Uint8Array;
  snapshot(): Snapshot;
  replaceWithSnapshot(snapshot: Snapshot): void;
  upsert(table: TableName, row: Row): void;
  deleteById(table: TableName, id: string): void;
}

let sqlPromise: Promise<SqlJsStatic> | null = null;

export async function createIronLogDatabase(bytes?: Uint8Array): Promise<IronLogDatabase> {
  sqlPromise ??= initSqlJs({
    locateFile: (file) => {
      if (typeof window !== "undefined") return `https://sql.js.org/dist/${file}`;
      return fileURLToPath(new URL(`../../../node_modules/sql.js/dist/${file}`, import.meta.url));
    }
  });
  const SQL = await sqlPromise;
  const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  db.run(initialMigration);
  ensureDefaultSettings(db);

  return {
    db,
    exportBytes: () => db.export(),
    snapshot: () => snapshotDatabase(db),
    replaceWithSnapshot: (snapshot) => replaceDatabaseRows(db, snapshot),
    upsert: (table, row) => upsertRow(db, table, row),
    deleteById: (table, id) => {
      assertTable(table);
      db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    }
  };
}

export function snapshotDatabase(db: Database): Snapshot {
  const snapshot = {} as Snapshot;
  for (const table of tableNames) {
    const result = db.exec(`SELECT * FROM ${table}`);
    const columns = result[0]?.columns ?? [];
    const values = result[0]?.values ?? [];
    snapshot[table] = values.map((valueRow) =>
      Object.fromEntries(valueRow.map((value, index) => [columns[index], normalizeValue(value)]))
    );
  }
  return snapshot;
}

function replaceDatabaseRows(db: Database, snapshot: Snapshot): void {
  db.run("BEGIN TRANSACTION");
  try {
    for (const table of [...tableNames].reverse()) {
      db.run(`DELETE FROM ${table}`);
    }
    for (const table of tableNames) {
      for (const row of snapshot[table] ?? []) {
        upsertRow(db, table, row);
      }
    }
    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }
}

function upsertRow(db: Database, table: TableName, row: Row): void {
  assertTable(table);
  const keys = Object.keys(row);
  const placeholders = keys.map(() => "?").join(", ");
  const updates = keys.filter((key) => key !== "id").map((key) => `${key} = excluded.${key}`).join(", ");
  db.run(
    `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`,
    keys.map((key) => row[key])
  );
}

function ensureDefaultSettings(db: Database): void {
  const now = new Date().toISOString();
  db.run(
    `INSERT OR IGNORE INTO user_settings (id, unit_preference, theme, created_at, updated_at)
     VALUES ('local', 'lbs', 'dark', ?, ?)`,
    [now, now]
  );
}

function assertTable(table: TableName): void {
  if (!tableNames.includes(table)) {
    throw new Error(`Unknown table: ${table}`);
  }
}

function normalizeValue(value: unknown): Primitive {
  if (typeof value === "number" || typeof value === "string" || value === null) return value;
  return String(value);
}
