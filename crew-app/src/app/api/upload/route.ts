import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { uploadToR2, generateMediaKey } from "@/lib/r2";
import { isValidFileSize, isValidImageType, isValidVideoType } from "@/lib/utils/validation";

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 100;

type UploadedFile = {
  url: string;
  key: string;
  type: "image" | "video";
};

/**
 * 이미지 처리 (Sharp: 로컬 개발 전용)
 * Worker 환경에서는 Sharp 사용 불가 → 원본 그대로 업로드
 */
async function processImageIfPossible(
  arrayBuffer: ArrayBuffer,
  purpose: string
): Promise<{ buffer: Buffer | ArrayBuffer; contentType: string; ext: string }> {
  if (process.env.NODE_ENV === "development") {
    try {
      const { processFeedImage, processProfileImage } = await import("@/lib/utils/image");
      const processed =
        purpose === "profile"
          ? await processProfileImage(arrayBuffer)
          : await processFeedImage(arrayBuffer);
      return { buffer: processed.buffer, contentType: "image/webp", ext: "webp" };
    } catch {
      // Sharp 실패 시 원본 사용
    }
  }
  // 프로덕션 (Worker): 원본 그대로 업로드
  return { buffer: arrayBuffer, contentType: "image/jpeg", ext: "jpg" };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;
  const { user } = authResult;

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const purpose = (formData.get("purpose") as string) ?? "feed"; // "feed" | "profile"

  if (!files.length) {
    return Response.json(
      { success: false, error: "파일을 선택해주세요." },
      { status: 400 }
    );
  }

  // 피드: 최대 10장 이미지 또는 1개 영상
  if (purpose === "feed") {
    const images = files.filter((f) => isValidImageType(f.type));
    const videos = files.filter((f) => isValidVideoType(f.type));

    if (videos.length > 1) {
      return Response.json(
        { success: false, error: "영상은 최대 1개만 업로드 가능합니다." },
        { status: 400 }
      );
    }
    if (images.length > 10) {
      return Response.json(
        { success: false, error: "이미지는 최대 10장까지 업로드 가능합니다." },
        { status: 400 }
      );
    }
  }

  const uploaded: UploadedFile[] = [];

  for (const file of files) {
    const isImage = isValidImageType(file.type);
    const isVideo = isValidVideoType(file.type);

    if (!isImage && !isVideo) {
      return Response.json(
        { success: false, error: `지원하지 않는 파일 형식: ${file.type}` },
        { status: 400 }
      );
    }

    const maxMB = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (!isValidFileSize(file.size, maxMB)) {
      return Response.json(
        { success: false, error: `파일 크기는 최대 ${maxMB}MB까지 허용됩니다.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    if (isImage) {
      const { buffer, contentType, ext } = await processImageIfPossible(arrayBuffer, purpose);
      const key = generateMediaKey(
        purpose === "profile" ? "profiles" : "feeds",
        user.id,
        ext
      );
      const { url } = await uploadToR2(buffer, key, contentType);
      uploaded.push({ url, key, type: "image" });
    } else {
      // 영상: 그대로 업로드
      const key = generateMediaKey("feeds", user.id, "mp4");
      const { url } = await uploadToR2(arrayBuffer, key, file.type);
      uploaded.push({ url, key, type: "video" });
    }
  }

  return Response.json({
    success: true,
    data: { files: uploaded },
  });
}
