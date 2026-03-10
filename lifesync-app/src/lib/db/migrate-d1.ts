/**
 * Cloudflare D1 원격 마이그레이션 스크립트
 *
 * 사용법:
 *   npx wrangler d1 migrations apply lifesync-db --remote
 *
 * 또는 이 스크립트로 REST API 직접 실행:
 *   npx tsx src/lib/db/migrate-d1.ts
 */
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error("❌ 환경변수를 설정해주세요: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN");
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), "src/lib/db/migrations");

async function runQuery(sql: string) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    }
  );

  const result = await response.json() as { success: boolean; errors?: unknown[] };

  if (!result.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(result.errors)}`);
  }

  return result;
}

async function migrate() {
  console.log("🚀 Cloudflare D1 마이그레이션 시작...\n");

  // migrations_log 테이블 생성 (없으면)
  await runQuery(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER
    )
  `);

  const sqlFiles = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    const filePath = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, "utf-8");

    // statement-breakpoint로 분리
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`📄 ${file} 적용 중...`);

    for (const statement of statements) {
      await runQuery(statement);
    }

    console.log(`✅ ${file} 완료`);
  }

  console.log("\n✨ 모든 마이그레이션 완료!");
}

migrate().catch((err) => {
  console.error("❌ 마이그레이션 실패:", err);
  process.exit(1);
});
