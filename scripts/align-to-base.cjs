#!/usr/bin/env node
/**
 * 해상도가 다른 스프라이트를 base 이미지에 맞춰 정렬/리사이즈
 *
 * 사용법:
 *   node scripts/align-to-base.cjs <base이미지> <소스이미지> [옵션]
 *
 * 옵션:
 *   --cols <N>    프레임 수 (기본: 4)
 *   --out <파일>  출력 파일명 (기본: 소스_aligned.png)
 *
 * 동작:
 *   1. base와 소스 각 프레임에서 체크무늬 제거 후 캐릭터 bbox 추출
 *   2. 소스 프레임을 base 캐릭터 높이에 맞춰 스케일링 (nearest-neighbor)
 *   3. bottom-align + center-x로 base와 동일 위치에 배치
 *   4. base와 동일 해상도의 merged 이미지 출력
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

  for (let i = 0; i < total; i++) {
    if (bg[i]) { const p = i * 4; pixels[p] = pixels[p+1] = pixels[p+2] = pixels[p+3] = 0; }
  }
}

function getBBox(pixels, w, h) {
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[(y * w + x) * 4 + 3] > 0) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1, empty: maxX < minX };
}

// 체크무늬 색상을 건너뛰고 bbox 찾기 (flood fill 없이 — 옷 색상 보호)
function getBBoxSkipChecker(pixels, w, h) {
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
      if (a < 10) continue;
      if (isCheckerColor(r, g, b)) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1, empty: maxX < minX };
}

function extractFrame(data, imgW, col, frameW, frameH) {
  const buf = Buffer.alloc(frameW * frameH * 4);
  for (let y = 0; y < frameH; y++) {
    const srcOff = (y * imgW + col * frameW) * 4;
    data.copy(buf, y * frameW * 4, srcOff, srcOff + frameW * 4);
  }
  return buf;
}

async function main() {
  const args = process.argv.slice(2);
  let basePath, srcPath, cols = 4, outPath;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cols") { cols = parseInt(args[++i]); }
    else if (args[i] === "--out") { outPath = args[++i]; }
    else if (!basePath) { basePath = args[i]; }
    else if (!srcPath) { srcPath = args[i]; }
  }

  if (!basePath || !srcPath) {
    console.log("사용법: node scripts/align-to-base.cjs <base이미지> <소스이미지> [--cols N] [--out 파일]");
    process.exit(1);
  }

  basePath = path.resolve(basePath);
  srcPath = path.resolve(srcPath);
  if (!outPath) outPath = srcPath.replace(/(\.\w+)$/, "_aligned$1");
  else outPath = path.resolve(outPath);

  // Load both images
  const baseImg = await sharp(basePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const srcImg = await sharp(srcPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const baseFW = baseImg.info.width / cols;
  const baseFH = baseImg.info.height;
  const srcFW = srcImg.info.width / cols;
  const srcFH = srcImg.info.height;

  console.log(`base: ${baseImg.info.width}x${baseImg.info.height} (프레임 ${baseFW}x${baseFH})`);
  console.log(`소스: ${srcImg.info.width}x${srcImg.info.height} (프레임 ${srcFW}x${srcFH})`);

  // Output: same size as base
  const outW = baseImg.info.width;
  const outH = baseImg.info.height;
  const outPixels = Buffer.alloc(outW * outH * 4, 0);

  for (let col = 0; col < cols; col++) {
    // Extract & clean base frame
    const baseFrame = extractFrame(baseImg.data, baseImg.info.width, col, baseFW, baseFH);
    removeChecker(baseFrame, baseFW, baseFH);
    const baseBB = getBBox(baseFrame, baseFW, baseFH);

    // Extract source frame — 체크무늬 제거 없이 bbox만 찾음 (옷 색상 보호)
    const srcFrame = extractFrame(srcImg.data, srcImg.info.width, col, srcFW, srcFH);
    // 체크무늬가 아닌 픽셀만으로 bbox 계산 (flood fill 없이)
    const srcBB = getBBoxSkipChecker(srcFrame, srcFW, srcFH);

    if (baseBB.empty || srcBB.empty) {
      console.log(`  frame ${col + 1}: 빈 프레임, 건너뜀`);
      continue;
    }

    // Scale factor: match character height
    const scale = baseBB.h / srcBB.h;
    const scaledW = Math.round(srcBB.w * scale);
    const scaledH = Math.round(srcBB.h * scale);

    console.log(`  frame ${col + 1}:`);
    console.log(`    base: ${baseBB.w}x${baseBB.h} at (${baseBB.minX},${baseBB.minY})-(${baseBB.maxX},${baseBB.maxY})`);
    console.log(`    src:  ${srcBB.w}x${srcBB.h} → scaled ${scaledW}x${scaledH} (scale=${scale.toFixed(4)})`);

    // Extract full source frame, flood fill로 배경 제거 (전체 프레임에서 실행하면
    // 가장자리→체크무늬만 따라가므로 캐릭터 내부 흰색은 보호됨)
    removeChecker(srcFrame, srcFW, srcFH);

    // 이제 크롭
    const srcCrop = Buffer.alloc(srcBB.w * srcBB.h * 4);
    for (let y = 0; y < srcBB.h; y++) {
      const srcOff = ((srcBB.minY + y) * srcFW + srcBB.minX) * 4;
      srcFrame.copy(srcCrop, y * srcBB.w * 4, srcOff, srcOff + srcBB.w * 4);
    }

    // Scale with sharp (nearest-neighbor)
    const scaledBuf = await sharp(srcCrop, { raw: { width: srcBB.w, height: srcBB.h, channels: 4 } })
      .resize(scaledW, scaledH, { kernel: "nearest" })
      .raw()
      .toBuffer();

    // Place on output: bottom-align to base feet, center-x to base center
    const baseCenterX = baseBB.minX + Math.round(baseBB.w / 2);
    const baseBottom = baseBB.maxY;

    const placeX = baseCenterX - Math.round(scaledW / 2);
    const placeY = baseBottom - scaledH + 1;

    console.log(`    배치: (${placeX}, ${placeY}) bottom=${baseBottom}`);

    // Copy scaled pixels to output
    const outFrameOffX = col * baseFW;
    for (let y = 0; y < scaledH; y++) {
      const dstY = placeY + y;
      if (dstY < 0 || dstY >= outH) continue;
      for (let x = 0; x < scaledW; x++) {
        const dstX = outFrameOffX + placeX + x;
        if (dstX < 0 || dstX >= outW) continue;
        const si = (y * scaledW + x) * 4;
        if (scaledBuf[si + 3] === 0) continue;
        const di = (dstY * outW + dstX) * 4;
        outPixels[di] = scaledBuf[si];
        outPixels[di + 1] = scaledBuf[si + 1];
        outPixels[di + 2] = scaledBuf[si + 2];
        outPixels[di + 3] = scaledBuf[si + 3];
      }
    }
  }

  await sharp(outPixels, { raw: { width: outW, height: outH, channels: 4 } })
    .png()
    .toFile(outPath);

  const stat = fs.statSync(outPath);
  console.log(`\n완료: ${path.basename(outPath)} (${outW}x${outH}, ${(stat.size / 1024).toFixed(0)}KB)`);
}

main().catch(console.error);
