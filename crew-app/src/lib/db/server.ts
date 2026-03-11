/**
 * API Route에서 사용하는 DB 클라이언트
 * - 로컬 개발: Cloudflare D1 REST API (d1-http-adapter)
 * - Cloudflare Pages 프로덕션: D1 바인딩 (OpenNext)
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

let _devDb: ServerDb | null = null;

export function getServerDb(): ServerDb {
  // 로컬 개발: D1 REST API
  if (process.env.NODE_ENV === "development") {
    if (!_devDb) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createD1HttpBinding } = require("./d1-http-adapter");
      const d1 = createD1HttpBinding();
      _devDb = drizzleD1(d1 as Parameters<typeof drizzleD1>[0], { schema });
    }
    return _devDb;
  }

  // 프로덕션: Cloudflare D1 바인딩
  const env = getCloudflareEnv();
  if (env.DB) {
    return drizzleD1(env.DB as Parameters<typeof drizzleD1>[0], { schema });
  }

  throw new Error(
    "D1 database binding (DB) not found. Check Cloudflare Pages bindings settings."
  );
}

export { schema };
