import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.CLOUDFLARE_R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "lifesync-media";

function getR2Client(): S3Client {
  if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
    throw new Error("R2 환경변수가 설정되지 않았습니다. .env.local을 확인하세요.");
  }

  return new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });
}

type UploadResult = {
  url: string;
  key: string;
};

/**
 * 파일을 R2에 업로드
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<UploadResult> {
  // 로컬 개발: R2 미설정 시 로컬 디스크에 저장
  if (!R2_ENDPOINT || R2_ENDPOINT.includes("your-account-id")) {
    console.warn("[R2] 실제 R2 미연동 - 로컬 저장");
    const fs = await import("fs/promises");
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), ".uploads", path.dirname(key));
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(process.cwd(), ".uploads", key), buffer);
    return {
      url: `/api/media/${key}`,
      key,
    };
  }

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000", // 1년 캐시
    })
  );

  // Public URL (R2 커스텀 도메인 또는 공개 엔드포인트 필요)
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? R2_ENDPOINT;
  const url = `${publicBase}/${R2_BUCKET}/${key}`;

  return { url, key };
}

/**
 * R2에서 파일 삭제
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!R2_ENDPOINT || R2_ENDPOINT.includes("your-account-id")) {
    console.warn("[R2] 실제 R2 미연동 - 삭제 스킵");
    return;
  }

  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

/**
 * 미디어 파일 키 생성
 * 예: feeds/{feedId}/{uuid}.webp
 */
export function generateMediaKey(
  prefix: "feeds" | "profiles",
  id: string,
  ext: string = "webp"
): string {
  const uuid = crypto.randomUUID();
  return `${prefix}/${id}/${uuid}.${ext}`;
}
