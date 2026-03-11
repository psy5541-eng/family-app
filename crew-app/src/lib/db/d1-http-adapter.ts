/**
 * Cloudflare D1 REST API 어댑터
 * - 로컬 개발에서도 실제 D1 데이터베이스를 사용할 수 있도록
 * - D1 바인딩 인터페이스를 HTTP API로 에뮬레이트
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? "";
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID ?? "";

const D1_API_BASE = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}`;

type D1Result = {
  results: Record<string, unknown>[];
  meta: { changes: number; last_row_id: number; rows_read: number; rows_written: number };
  success: boolean;
};

async function executeQuery(sql: string, params: unknown[] = []): Promise<D1Result> {
  const res = await fetch(`${D1_API_BASE}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  const json = await res.json() as { result: D1Result[]; success: boolean; errors: { message: string }[] };

  if (!json.success || !json.result?.[0]) {
    const errMsg = json.errors?.[0]?.message ?? "D1 query failed";
    throw new Error(errMsg);
  }

  return json.result[0];
}

/**
 * D1 바인딩 호환 객체 생성
 * drizzle-orm/d1에 그대로 전달 가능
 */
export function createD1HttpBinding() {
  return {
    prepare(sql: string) {
      let boundParams: unknown[] = [];

      const stmt = {
        bind(...values: unknown[]) {
          boundParams = values;
          return stmt;
        },
        async all() {
          const result = await executeQuery(sql, boundParams);
          return { results: result.results };
        },
        async first(colName?: string) {
          const result = await executeQuery(sql, boundParams);
          const row = result.results[0] ?? null;
          if (colName && row) return (row as Record<string, unknown>)[colName];
          return row;
        },
        async run() {
          const result = await executeQuery(sql, boundParams);
          return { meta: result.meta };
        },
        async raw() {
          const result = await executeQuery(sql, boundParams);
          return result.results.map((row) => Object.values(row));
        },
      };

      return stmt;
    },
    async exec(sql: string) {
      return executeQuery(sql);
    },
    async batch(statements: { sql: string; params?: unknown[] }[]) {
      const results = [];
      for (const stmt of statements) {
        results.push(await executeQuery(stmt.sql, stmt.params ?? []));
      }
      return results;
    },
  };
}
