import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

// Cloudflare D1 바인딩 타입 (프로덕션)
type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      all: () => Promise<{ results: unknown[] }>;
      first: () => Promise<unknown>;
      run: () => Promise<{ meta: unknown }>;
    };
  };
  exec: (query: string) => Promise<unknown>;
  batch: (statements: unknown[]) => Promise<unknown[]>;
};

declare global {
  // wrangler 바인딩 (Cloudflare Pages 프로덕션 환경)
  // eslint-disable-next-line no-var
  var __D1_BINDING__: D1Database | undefined;
}

/**
 * DB 클라이언트 팩토리
 * - 로컬 개발: better-sqlite3 (local.db)
 * - 프로덕션 (Cloudflare Pages): D1 바인딩
 */
export function getDb(d1Binding?: D1Database) {
  // 프로덕션: Cloudflare D1 바인딩
  if (d1Binding) {
    return drizzleD1(d1Binding, { schema });
  }

  // 로컬 개발: better-sqlite3
  if (process.env.NODE_ENV === "development" || !d1Binding) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const sqlite = new Database("./local.db");
    return drizzleBetterSqlite(sqlite, { schema });
  }

  throw new Error("DB binding not available");
}

// 로컬 개발용 싱글톤 (API Route에서 간편하게 사용)
let _localDb: ReturnType<typeof drizzleBetterSqlite<typeof schema>> | null = null;

export function getLocalDb() {
  if (!_localDb) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const sqlite = new Database("./local.db");
    _localDb = drizzleBetterSqlite(sqlite, { schema });
  }
  return _localDb;
}

export type DbClient = ReturnType<typeof getDb>;
export { schema };
