/**
 * API Route에서 사용하는 DB 클라이언트
 * - 로컬 개발: better-sqlite3 (local.db)
 * - Cloudflare Pages 프로덕션: D1 바인딩
 */
import { getDb, getLocalDb } from "./index";
import type { schema } from "./index";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schemaObj from "./schema";

export type ServerDb = ReturnType<typeof getLocalDb>;

type CloudflareEnv = {
  DB?: unknown;
};

function getCloudflareEnv(): CloudflareEnv {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    return getRequestContext().env as CloudflareEnv;
  } catch {
    return {};
  }
}

export function getServerDb(): ServerDb {
  if (process.env.NODE_ENV === "development") {
    return getLocalDb();
  }

  const env = getCloudflareEnv();
  if (env.DB) {
    // D1 바인딩을 BetterSQLite3 호환 타입으로 캐스팅
    return drizzleD1(env.DB as Parameters<typeof getDb>[0] as never, {
      schema: schemaObj,
    }) as unknown as ServerDb;
  }

  return getLocalDb();
}
