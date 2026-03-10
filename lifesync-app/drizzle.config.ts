import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "sqlite",
  // 로컬 개발: better-sqlite3
  // 프로덕션 마이그레이션: wrangler d1 migrations apply
  dbCredentials: {
    url: "./local.db",
  },
} satisfies Config;
