/**
 * Sharp를 사용한 이미지 처리 유틸리티
 * - server-side only (Node.js 환경)
 */

type ProcessImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
};

type ProcessedImage = {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  mimeType: "image/webp";
};

/**
 * 이미지를 WebP로 변환하고 리사이즈
 * - 피드 이미지: 최대 1080px, 품질 85%
 * - 프로필 이미지: 최대 500px, 품질 80%
 */
export async function processImage(
  input: Buffer | ArrayBuffer,
  options: ProcessImageOptions = {}
): Promise<ProcessedImage> {
  const sharp = (await import("sharp")).default;

  const { maxWidth = 1080, maxHeight = 1080, quality = 85 } = options;

  const inputBuffer = input instanceof ArrayBuffer ? Buffer.from(input) : input;

  const { data, info } = await sharp(inputBuffer)
    .rotate() // EXIF orientation 자동 보정
    .resize(maxWidth, maxHeight, {
      fit: "inside",       // 비율 유지하며 박스 안에 맞춤
      withoutEnlargement: true, // 원본보다 크게 확대 안 함
    })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    size: info.size,
    mimeType: "image/webp",
  };
}

/**
 * 프로필 이미지 전용 처리 (500x500, 품질 80%)
 */
export async function processProfileImage(input: Buffer | ArrayBuffer): Promise<ProcessedImage> {
  return processImage(input, { maxWidth: 500, maxHeight: 500, quality: 80 });
}

/**
 * 피드 이미지 전용 처리 (1080px, 품질 85%)
 */
export async function processFeedImage(input: Buffer | ArrayBuffer): Promise<ProcessedImage> {
  return processImage(input, { maxWidth: 1080, maxHeight: 1080, quality: 85 });
}
