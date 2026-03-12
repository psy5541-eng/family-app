#!/usr/bin/env node
/**
 * 맨몸 base 이미지와 옷 입은 이미지를 비교해서 옷(clothing) 레이어만 추출
 *
 * 사용법:
 *   node scripts/extract-clothing.cjs <base맨몸> <옷입은이미지> [옵션]
 *
 * 옵션:
 *   --cols <N>       프레임 수 (기본: 4)
 *   --out <파일>     출력 파일명 (기본: 소스_clothing.png)
 *   --threshold <N>  색상 차이 임계값 (기본: 30) — 이 이상 차이나면 옷으로 판단
 *
 * 동작:
 *   1. 두 이미지에서 체크무늬 배경 제거
 *   2. 프레임별로 픽셀 비교
 *   3. base에 없거나 색이 다른 픽셀 → 옷 레이어로 추출
 */

const fs = require("fs");
const path = require("path");
const sharp = require(path.resolve(__dirname, "../crew-app/node_modules/sharp"));

function isCheckerColor(r, g, b) {
  const avg = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread < 20 && avg >= 170 && avg <= 260;
}

function removeChecker(pixels, width, height) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const bg = new Uint8Array(total);
  const queue = [];
  const idx = (x, y) => y * width + x;
  const px = (x, y) => { const i = (y * width + x) * 4; return [pixels[i], pixels[i+1], pixels[i+2]]; };

  // Seed from edges
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const [r, g, b] = px(x, y);
      if (isCheckerColor(r, g, b)) { const i = idx(x, y); if (!visited[i]) { visited[i] = 1; bg[i] = 1; queue.push(x, y); } }
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      const [r, g, b] = px(x, y);
      if (isCheckerColor(r, g, b)) { const i = idx(x, y); if (!visited[i]) { visited[i] = 1; bg[i] = 1; queue.push(x, y); } }
    }
  }

  // BFS flood fill
  const dx = [1, -1, 0, 0], dy = [0, 0, 1, -1];
  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++], cy = queue[head++];
    for (let d = 0; d < 4; d++) {
      const nx = cx + dx[d], ny = cy + dy[d];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = idx(nx, ny);
      if (visited[ni]) continue;
      visited[ni] = 1;
      const [r, g, b] = px(nx, ny);
      if (isCheckerColor(r, g, b)) { bg[ni] = 1; queue.push(nx, ny); }
    }
  }

  // Fringe cleanup
  const fringe = [];
  for (let i = 0; i < total; i++) {
    if (!bg[i]) continue;
    const x = i % width, y = (i - x) / width;
    for (let d = 0; d < 4; d++) {
      const nx = x + dx[d], ny = y + dy[d];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = idx(nx, ny);
      if (bg[ni]) continue;
      const [r, g, b] = px(nx, ny);
      const avg = (r + g + b) / 3, spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (spread < 15 && avg > 190) fringe.push(ni);
    }
  }
  for (const ni of fringe) bg[ni] = 1;

  // Clear background pixels
  for (let i = 0; i < total; i++) {
    if (bg[i]) { const p = i * 4; pixels[p] = pixels[p+1] = pixels[p+2] = pixels[p+3] = 0; }
  }
}

function colorDist(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

async function main() {
  const args = process.argv.slice(2);
  let basePath, srcPath, cols = 4, outPath, threshold = 30;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cols") { cols = parseInt(args[++i]); }
    else if (args[i] === "--out") { outPath = args[++i]; }
    else if (args[i] === "--threshold") { threshold = parseInt(args[++i]); }
    else if (!basePath) { basePath = args[i]; }
    else if (!srcPath) { srcPath = args[i]; }
  }

  if (!basePath || !srcPath) {
    console.log("사용법: node scripts/extract-clothing.cjs <base맨몸> <옷입은이미지> [--cols N] [--out 파일] [--threshold N]");
    process.exit(1);
  }

  basePath = path.resolve(basePath);
  srcPath = path.resolve(srcPath);
  if (!outPath) outPath = srcPath.replace(/(\.\w+)$/, "_clothing$1");
  else outPath = path.resolve(outPath);

  // Load both images
  const baseImg = await sharp(basePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const srcImg = await sharp(srcPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  if (baseImg.info.width !== srcImg.info.width || baseImg.info.height !== srcImg.info.height) {
    console.error(`해상도가 다릅니다! base: ${baseImg.info.width}x${baseImg.info.height}, src: ${srcImg.info.width}x${srcImg.info.height}`);
    process.exit(1);
  }

  const W = baseImg.info.width;
  const H = baseImg.info.height;
  const frameW = W / cols;
  const frameH = H;

  console.log(`이미지: ${W}x${H} (프레임 ${frameW}x${frameH}, ${cols}프레임)`);
  console.log(`임계값: ${threshold}`);

  // Copy pixel data to mutable buffers
  const basePixels = Buffer.from(baseImg.data);
  const srcPixels = Buffer.from(srcImg.data);

  // Remove checker from both (full image at once)
  console.log("체크무늬 제거 중...");
  removeChecker(basePixels, W, H);
  removeChecker(srcPixels, W, H);

  // Output: clothing layer (transparent where same as base)
  const outPixels = Buffer.alloc(W * H * 4, 0);

  let totalClothing = 0;
  let totalSameAsBg = 0;

  for (let col = 0; col < cols; col++) {
    let clothingPixels = 0;
    const offX = col * frameW;

    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < frameW; x++) {
        const gi = (y * W + (offX + x)) * 4; // global index

        const sr = srcPixels[gi], sg = srcPixels[gi+1], sb = srcPixels[gi+2], sa = srcPixels[gi+3];
        const br = basePixels[gi], bg2 = basePixels[gi+1], bb = basePixels[gi+2], ba = basePixels[gi+3];

        // 소스에 픽셀이 없으면 스킵
        if (sa === 0) continue;

        // base에 픽셀이 없는데 소스에 있으면 → 옷 (캐릭터 밖으로 나오는 옷)
        if (ba === 0) {
          outPixels[gi] = sr;
          outPixels[gi+1] = sg;
          outPixels[gi+2] = sb;
          outPixels[gi+3] = sa;
          clothingPixels++;
          continue;
        }

        // 둘 다 있으면 색상 차이 비교
        const dist = colorDist(sr, sg, sb, br, bg2, bb);
        if (dist > threshold) {
          // 색이 다름 → 옷으로 덮인 부분
          outPixels[gi] = sr;
          outPixels[gi+1] = sg;
          outPixels[gi+2] = sb;
          outPixels[gi+3] = sa;
          clothingPixels++;
        } else {
          totalSameAsBg++;
        }
      }
    }

    totalClothing += clothingPixels;
    console.log(`  frame ${col + 1}: 옷 픽셀 ${clothingPixels}개`);
  }

  console.log(`\n총 옷 픽셀: ${totalClothing}, base와 동일: ${totalSameAsBg}`);

  await sharp(outPixels, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(outPath);

  const stat = fs.statSync(outPath);
  console.log(`완료: ${path.basename(outPath)} (${W}x${H}, ${(stat.size / 1024).toFixed(0)}KB)`);
}

main().catch(console.error);
