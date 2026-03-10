/**
 * R2 스토리지 유틸리티
 * - 로컬 개발: .uploads/ 디스크 저장
 * - 프로덕션 (Cloudflare Pages): R2 바인딩 직접 사용
 */

type UploadResult = {
  url: string;
  key: string;
};

type R2Bucket = {
  put: (key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } } | null>;
};

type CloudflareEnv = {
  R2?: R2Bucket;
};

function getCloudflareR2(): R2Bucket | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as CloudflareEnv;
    return env.R2 ?? null;
  } catch {
    return null;
  }
}

/**
 * 파일을 R2에 업로드
 */
export async function uploadToR2(
  buffer: Buffer | ArrayBuffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  // 프로덕션: Cloudflare R2 바인딩
  if (process.env.NODE_ENV !== "development") {
    const r2 = getCloudflareR2();
    if (r2) {
      const ab = buffer instanceof ArrayBuffer
        ? buffer
        : new Uint8Array(buffer).buffer as ArrayBuffer;
      await r2.put(key, ab, {
        httpMetadata: {
          contentType,
          cacheControl: "public, max-age=31536000",
        },
      });
      // R2 파일은 API를 통해 서빙
      return { url: `/api/media/${key}`, key };
    }
    throw new Error("R2 binding not found. Check Cloudflare Pages bindings settings.");
  }

  // 로컬 개발: 디스크에 저장
  console.warn("[R2] 로컬 개발 모드 - .uploads/ 저장");
  const fs = await import("fs/promises");
  const path = await import("path");
  const uploadDir = path.join(process.cwd(), ".uploads", path.dirname(key));
  await fs.mkdir(uploadDir, { recursive: true });
  const buf = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
  await fs.writeFile(path.join(process.cwd(), ".uploads", key), buf);
  return { url: `/api/media/${key}`, key };
}

/**
 * R2에서 파일 삭제
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    const r2 = getCloudflareR2();
    if (r2) {
      await r2.delete(key);
      return;
    }
    console.warn("[R2] R2 binding not found, skip delete");
    return;
  }

  // 로컬: 파일 삭제
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    await fs.unlink(path.join(process.cwd(), ".uploads", key));
  } catch {
    // 파일 없으면 무시
  }
}

/**
 * R2에서 파일 읽기 (미디어 서빙용)
 */
export async function getFromR2(key: string): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  if (process.env.NODE_ENV !== "development") {
    const r2 = getCloudflareR2();
    if (r2) {
      const obj = await r2.get(key);
      if (!obj) return null;
      return {
        buffer: await obj.arrayBuffer(),
        contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
      };
    }
    return null;
  }

  // 로컬
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), ".uploads", key);
    const data = await fs.readFile(filePath);
    const ext = path.extname(key).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".png": "image/png", ".gif": "image/gif", ".mp4": "video/mp4",
    };
    return { buffer: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), contentType: mimeMap[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/**
 * 미디어 파일 키 생성
 */
export function generateMediaKey(
  prefix: "feeds" | "profiles",
  id: string,
  ext: string = "webp"
): string {
  const uuid = crypto.randomUUID();
  return `${prefix}/${id}/${uuid}.${ext}`;
}
