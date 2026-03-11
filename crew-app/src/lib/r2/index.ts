/**
 * R2 스토리지 유틸리티
 * - 로컬 개발: S3 호환 API로 R2 직접 접근
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

// S3 클라이언트 (로컬 개발용 - R2 S3 호환 API)
function getS3Client() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { S3Client } = require("@aws-sdk/client-s3");
  return new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

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

  // 로컬 개발: S3 호환 API
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PutObjectCommand } = require("@aws-sdk/client-s3");
  const s3 = getS3Client();
  const body = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000",
  }));
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

  // 로컬: S3 호환 API
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    const s3 = getS3Client();
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    }));
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

  // 로컬: S3 호환 API
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const s3 = getS3Client();
    const res = await s3.send(new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: key,
    }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body) {
      chunks.push(chunk);
    }
    const buf = Buffer.concat(chunks);
    return {
      buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      contentType: res.ContentType ?? "application/octet-stream",
    };
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
