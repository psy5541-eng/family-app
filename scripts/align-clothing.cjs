#!/usr/bin/env node
/**
 * 옷 레이어를 base 캐릭터에 맞춰 정렬/리사이즈
 *
 * 사용법:
 *   node scripts/align-clothing.cjs <base맨몸> <옷입은캐릭터> <옷레이어> [옵션]
 *
 * 인자:
 *   base맨몸       - base 맨몸 스프라이트 (5504x1366 등)
 *   옷입은캐릭터    - 옷 레이어와 같은 해상도의 전체 캐릭터 (스케일 기준)
 *   옷레이어        - 옷만 있는 이미지 (체크무늬 배경)
 *
 * 옵션:
 *   --cols <N>      프레임 수 (기본: 4)
 *   --out <폴더>    출력 폴더 (기본: 옷레이어_aligned/)
 *   --prefix <이름> 출력 파일 접두사 (기본: layer)
 *
 * 동작:
 *   1. base와 옷입은캐릭터에서 프레임별 캐릭터 bbox 추출
 *   2. 스케일 비율 계산 (base char height / source char height)
 *   3. 옷 레이어의 각 프레임을 스케일+오프셋 적용하여 base 프레임에 배치
 *   4. 개별 프레임 PNG 출력
 */

const fs = require("fs");
const path = require("path");
const sharp = require(path.resolve(__dirname, "../crew-app/node_modules/sharp"));

// 체크무늬 색상 감지: 코너 샘플링으로 자동 감지
let checkerAvgLow = 170, checkerAvgHigh = 260;

function detectCheckerRange(pixels, width, height) {
  // 4개 코너 50x50 영역 샘플링하여 체크 색상 범위 감지
  const avgs = [];
  const sz = 50;
  const corners = [
    [0, 0],
    [width - sz, 0],
    [0, height - sz],
    [width - sz, height - sz],
  ];
  for (const [cx, cy] of corners) {
    for (let y = Math.max(0, cy); y < Math.min(height, cy + sz); y++) {
      for (let x = Math.max(0, cx); x < Math.min(width, cx + sz); x++) {
        const i = (y * width + x) * 4;
        const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
        if (a === 0) continue; // 투명 스킵
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        if (spread < 30) {
          avgs.push((r + g + b) / 3);
        }
      }
    }
  }
  if (avgs.length > 100) {
    avgs.sort((a, b) => a - b);
    checkerAvgLow = Math.floor(avgs[0]) - 15;
    checkerAvgHigh = Math.ceil(avgs[avgs.length - 1]) + 15;
    console.log(`  체크무늬 감지: avg 범위 ${checkerAvgLow}~${checkerAvgHigh}`);
  }
}

function isCheckerColor(r, g, b) {
  const avg = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread < 25 && avg >= checkerAvgLow && avg <= checkerAvgHigh;
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
  let basePath, refPath, clothingPath, cols = 4, outDir, prefix = "layer";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--cols") { cols = parseInt(args[++i]); }
    else if (args[i] === "--out") { outDir = args[++i]; }
    else if (args[i] === "--prefix") { prefix = args[++i]; }
    else if (!basePath) { basePath = args[i]; }
    else if (!refPath) { refPath = args[i]; }
    else if (!clothingPath) { clothingPath = args[i]; }
  }

  if (!basePath || !refPath || !clothingPath) {
    console.log("사용법: node scripts/align-clothing.cjs <base맨몸> <옷입은캐릭터(같은해상도)> <옷레이어> [--cols N] [--out 폴더] [--prefix 이름]");
    process.exit(1);
  }

  basePath = path.resolve(basePath);
  refPath = path.resolve(refPath);
  clothingPath = path.resolve(clothingPath);
  if (!outDir) outDir = clothingPath.replace(/(\.\w+)$/, "_aligned");
  else outDir = path.resolve(outDir);

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Load images
  const baseImg = await sharp(basePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const refImg = await sharp(refPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const clothImg = await sharp(clothingPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  // Verify ref and clothing have same dimensions
  if (refImg.info.width !== clothImg.info.width || refImg.info.height !== clothImg.info.height) {
    console.error(`옷입은캐릭터와 옷레이어 해상도가 다릅니다!`);
    console.error(`  ref: ${refImg.info.width}x${refImg.info.height}`);
    console.error(`  clothing: ${clothImg.info.width}x${clothImg.info.height}`);
    process.exit(1);
  }

  const baseFW = baseImg.info.width / cols;
  const baseFH = baseImg.info.height;
  const srcFW = refImg.info.width / cols;
  const srcFH = refImg.info.height;

  console.log(`base:     ${baseImg.info.width}x${baseImg.info.height} (프레임 ${baseFW}x${baseFH})`);
  console.log(`ref:      ${refImg.info.width}x${refImg.info.height} (프레임 ${srcFW}x${srcFH})`);
  console.log(`clothing: ${clothImg.info.width}x${clothImg.info.height}`);
  console.log(`출력:     ${outDir}/`);
  console.log();

  // 각 이미지별 체크무늬 색상 범위 감지
  console.log("체크무늬 범위 감지:");
  console.log("  base:");
  detectCheckerRange(baseImg.data, baseImg.info.width, baseImg.info.height);
  const baseCkLow = checkerAvgLow, baseCkHigh = checkerAvgHigh;

  console.log("  ref:");
  detectCheckerRange(refImg.data, refImg.info.width, refImg.info.height);
  const refCkLow = checkerAvgLow, refCkHigh = checkerAvgHigh;

  console.log("  clothing:");
  detectCheckerRange(clothImg.data, clothImg.info.width, clothImg.info.height);
  const clothCkLow = checkerAvgLow, clothCkHigh = checkerAvgHigh;
  console.log();

  // 프레임 1 기준으로 ref/base 중심점 고정 (프레임간 흔들림 방지)
  checkerAvgLow = baseCkLow; checkerAvgHigh = baseCkHigh;
  const baseFrame0 = extractFrame(baseImg.data, baseImg.info.width, 0, baseFW, baseFH);
  removeChecker(baseFrame0, baseFW, baseFH);
  const baseBB0 = getBBox(baseFrame0, baseFW, baseFH);

  checkerAvgLow = refCkLow; checkerAvgHigh = refCkHigh;
  const refFrame0 = extractFrame(refImg.data, refImg.info.width, 0, srcFW, srcFH);
  const refBB0 = getBBoxSkipChecker(refFrame0, srcFW, srcFH);

  if (baseBB0.empty || refBB0.empty) {
    console.error("frame 1 기준점을 찾을 수 없습니다!");
    process.exit(1);
  }

  const fixedScale = baseBB0.h / refBB0.h;
  const fixedRefCenterX = refBB0.minX + refBB0.w / 2;
  const fixedRefBottom = refBB0.maxY;
  const fixedBaseCenterX = baseBB0.minX + baseBB0.w / 2;
  const fixedBaseBottom = baseBB0.maxY;

  console.log(`고정 기준점 (frame 1):`);
  console.log(`  base: center=${fixedBaseCenterX.toFixed(1)}, bottom=${fixedBaseBottom}`);
  console.log(`  ref:  center=${fixedRefCenterX.toFixed(1)}, bottom=${fixedRefBottom}`);
  console.log(`  scale: ${fixedScale.toFixed(4)}`);
  console.log();

  for (let col = 0; col < cols; col++) {

    // 4. Clothing frame: clothing 체크 범위로 제거
    checkerAvgLow = clothCkLow; checkerAvgHigh = clothCkHigh;
    const clothFrame = extractFrame(clothImg.data, clothImg.info.width, col, srcFW, srcFH);
    removeChecker(clothFrame, srcFW, srcFH);
    const clothBB = getBBox(clothFrame, srcFW, srcFH);

    if (clothBB.empty) {
      console.log(`  frame ${col + 1}: 옷 없음, 건너뜀`);
      continue;
    }

    console.log(`  frame ${col + 1}:`);
    console.log(`    clothing:   ${clothBB.w}x${clothBB.h} at (${clothBB.minX},${clothBB.minY})`);

    // Output frame: same as base frame size
    const outPixels = Buffer.alloc(baseFW * baseFH * 4, 0);

    let placed = 0;
    for (let sy = 0; sy < srcFH; sy++) {
      for (let sx = 0; sx < srcFW; sx++) {
        const si = (sy * srcFW + sx) * 4;
        if (clothFrame[si + 3] === 0) continue;

        // Position relative to fixed ref character bottom-center
        const relX = sx - fixedRefCenterX;
        const relY = sy - fixedRefBottom;

        // Map to fixed base coordinate
        const tx = Math.round(fixedBaseCenterX + relX * fixedScale);
        const ty = Math.round(fixedBaseBottom + relY * fixedScale);

        if (tx < 0 || tx >= baseFW || ty < 0 || ty >= baseFH) continue;

        const di = (ty * baseFW + tx) * 4;
        outPixels[di] = clothFrame[si];
        outPixels[di + 1] = clothFrame[si + 1];
        outPixels[di + 2] = clothFrame[si + 2];
        outPixels[di + 3] = clothFrame[si + 3];
        placed++;
      }
    }

    const outFile = path.join(outDir, `${prefix}-${col + 1}.png`);
    await sharp(outPixels, { raw: { width: baseFW, height: baseFH, channels: 4 } })
      .png()
      .toFile(outFile);

    const stat = fs.statSync(outFile);
    console.log(`    → ${path.basename(outFile)} (${baseFW}x${baseFH}, ${(stat.size/1024).toFixed(0)}KB, ${placed}px)`);
  }

  console.log("\n완료!");
}

main().catch(console.error);
