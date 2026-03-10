/**
 * API Route에서 사용하는 DB 클라이언트
 * - 로컬 개발: better-sqlite3 (local.db)
 * - Cloudflare Pages 프로덕션: D1 바인딩 (OpenNext)
 */
import { getDb, getLocalDb } from "./index";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schemaObj from "./schema";

export type ServerDb = ReturnType<typeof getLocalDb>;

type CloudflareEnv = {
  DB?: unknown;
};

function getCloudflareEnv(): CloudflareEnv {
  try {
    // OpenNext Cloudflare 컨텍스트
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    return getCloudflareContext().env as CloudflareEnv;
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
    return drizzleD1(env.DB as Parameters<typeof getDb>[0] as never, {
      schema: schemaObj,
    }) as unknown as ServerDb;
  }

  return getLocalDb();
}
