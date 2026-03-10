/**
 * API Route에서 사용하는 DB 클라이언트
 * - 로컬 개발: better-sqlite3 (local.db)
 * - Cloudflare Pages 프로덕션: D1 바인딩 (OpenNext)
 *
 * 주의: better-sqlite3는 네이티브 모듈이므로 프로덕션(Worker)에서
 * static import하면 번들에 포함되어 에러 발생.
 * 개발 환경에서만 dynamic require로 로드한다.
 */
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

type CloudflareEnv = {
  DB?: unknown;
};

function getCloudflareEnv(): CloudflareEnv {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    return getCloudflareContext().env as CloudflareEnv;
  } catch {
    return {};
  }
}

export type ServerDb = ReturnType<typeof drizzleD1<typeof schema>>;

export function getServerDb(): ServerDb {
  // 로컬 개발: better-sqlite3 (dynamic require로 번들 제외)
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const sqlite = new Database("./local.db");
    return drizzle(sqlite, { schema });
  }

  // 프로덕션: Cloudflare D1
  const env = getCloudflareEnv();
  if (env.DB) {
    return drizzleD1(env.DB as Parameters<typeof drizzleD1>[0], { schema });
  }

  throw new Error(
    "D1 database binding (DB) not found. Check Cloudflare Pages bindings settings."
  );
}

export { schema };
