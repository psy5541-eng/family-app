#!/usr/bin/env node
/**
 * 체크무늬 배경 제거 + 스프라이트 분리 도구
 *
 * 사용법:
 *   node scripts/remove-checker.cjs <입력파일> [옵션]
 *
 * 옵션:
 *   --cols <N>       스프라이트 열 수 (기본: 1)
 *   --rows <N>       스프라이트 행 수 (기본: 1)
 *   --out <폴더>     출력 폴더 (기본: 입력파일 옆 {이름}_out/)
 *   --prefix <이름>  출력 파일 접두사 (기본: frame)
 *   --labels <a,b>   행별 라벨 (예: male,female)
 *   --trim           프레임별 trim 후 bottom-align
 *   --size <N>       출력 캔버스 크기 (--trim 사용 시, 기본: 자동)
 *   --align-to <파일> 기준 프레임의 offset JSON 파일로 정렬
 *   --pick-row <N>    특정 행만 추출 (1부터 시작)
 *   --pick-frames <a,b> 추출할 프레임 범위 (예: 2,5 → 2~5번 프레임)
 *   --merge           추출한 프레임을 가로로 합쳐서 1장 출력
 *   --resize <WxH>    이미지 전체를 WxH로 리사이즈 (비율 유지, nearest-neighbor)
 *                     체크무늬 제거/분할 없이 리사이즈만 수행
 *                     비율이 안 맞으면 투명 캔버스에 가운데 배치
 *
 * 예시:
 *   # 단일 이미지 체크무늬 제거
 *   node scripts/remove-checker.cjs asset_image/idle.jpg
 *
 *   # 4x2 스프라이트 시트 분리 (위: male, 아래: female)
 *   node scripts/remove-checker.cjs asset_image/run_base.png --cols 4 --rows 2 --labels male,female --trim --size 1385
 *
 *   # 의상 레이어 - base offset 기준 정렬
 *   node scripts/remove-checker.cjs asset_image/run_top.png --cols 4 --rows 2 --labels male,female --align-to out/offsets.json
 *
 *   # 16프레임 시트에서 2행의 3~6번 프레임만 뽑아서 가로 1장으로
 *   node scripts/remove-checker.cjs asset_image/sprite.png --cols 8 --rows 2 --pick-row 2 --pick-frames 3,6 --merge
 *
 *   # 이미지를 5504x1366으로 리사이즈 (비율 유지)
 *   node scripts/remove-checker.cjs asset_image/idle_f-merged2.png --resize 5504x1366
 */

const fs = require("fs");
const path = require("path");
const sharp = require(path.resolve(__dirname, "../crew-app/node_modules/sharp"));

// ── 체크무늬 감지 ──
function isCheckerColor(r, g, b) {
  const avg = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread < 20 && avg >= 170 && avg <= 260;
}

// ── Edge-connected flood fill로 체크무늬 제거 ──
function removeChecker(pixels, width, height) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const bg = new Uint8Array(total);
  const queue = [];

  const idx = (x, y) => y * width + x;
  const px = (x, y) => {
    const i = (y * width + x) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2]];
  };

  // Edge seed
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const [r, g, b] = px(x, y);
      if (isCheckerColor(r, g, b)) {
        const i = idx(x, y);
        if (!visited[i]) { visited[i] = 1; bg[i] = 1; queue.push(x, y); }
      }
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      const [r, g, b] = px(x, y);
      if (isCheckerColor(r, g, b)) {
        const i = idx(x, y);
        if (!visited[i]) { visited[i] = 1; bg[i] = 1; queue.push(x, y); }
      }
    }
  }

  // BFS flood fill
  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];
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

  // Fringe cleanup (1px around background)
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
      const avg = (r + g + b) / 3;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (spread < 15 && avg > 190) fringe.push(ni);
    }
  }
  for (const ni of fringe) bg[ni] = 1;

  // Set transparent
  for (let i = 0; i < total; i++) {
    if (bg[i]) {
      const p = i * 4;
      pixels[p] = pixels[p + 1] = pixels[p + 2] = pixels[p + 3] = 0;
    }
  }

  return pixels;
}

// ── Bounding box ──
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
  return { minX, maxX, minY, maxY, empty: maxX < minX };
}

// ── Parse CLI args ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { cols: 1, rows: 1, prefix: "frame", labels: null, trim: false, size: 0, alignTo: null, out: null, input: null, pickRow: 0, pickFrameStart: 1, pickFrameEnd: 0, merge: false, resize: null };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--cols": opts.cols = parseInt(args[++i]); break;
      case "--rows": opts.rows = parseInt(args[++i]); break;
      case "--out": opts.out = args[++i]; break;
      case "--prefix": opts.prefix = args[++i]; break;
      case "--labels": opts.labels = args[++i].split(","); break;
      case "--trim": opts.trim = true; break;
      case "--size": opts.size = parseInt(args[++i]); break;
      case "--align-to": opts.alignTo = args[++i]; break;
      case "--pick-row": opts.pickRow = parseInt(args[++i]); break;
      case "--pick-frames": {
        const parts = args[++i].split(",");
        opts.pickFrameStart = parseInt(parts[0]);
        opts.pickFrameEnd = parseInt(parts[1] || parts[0]);
        break;
      }
      case "--merge": opts.merge = true; break;
      case "--resize": {
        const parts = args[++i].split("x");
        opts.resize = { width: parseInt(parts[0]), height: parseInt(parts[1]) };
        break;
      }
      default:
        if (!args[i].startsWith("--")) opts.input = args[i];
    }
  }

  if (!opts.input) {
    console.log("사용법: node scripts/remove-checker.cjs <입력파일> [옵션]");
    console.log("  --cols N        스프라이트 열 수 (기본: 1)");
    console.log("  --rows N        행 수 (기본: 1)");
    console.log("  --out 폴더      출력 폴더");
    console.log("  --prefix 이름   출력 파일 접두사 (기본: frame)");
    console.log("  --labels a,b    행별 라벨 (예: male,female)");
    console.log("  --trim          프레임별 trim + bottom-align");
    console.log("  --size N        출력 캔버스 크기 (trim 시)");
    console.log("  --align-to 파일 base offset JSON으로 정렬");
    process.exit(1);
  }

  if (!opts.out) {
    const base = path.basename(opts.input, path.extname(opts.input));
    opts.out = path.join(path.dirname(opts.input), base + "_out");
  }

  return opts;
}

async function main() {
  const opts = parseArgs();
  const inputPath = path.resolve(opts.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`파일 없음: ${inputPath}`);
    process.exit(1);
  }

  console.log(`입력: ${inputPath}`);

  // ── Resize-only mode ──
  if (opts.resize) {
    const meta = await sharp(inputPath).metadata();
    const { width: tw, height: th } = opts.resize;
    console.log(`리사이즈: ${meta.width}x${meta.height} → ${tw}x${th} (비율 유지, nearest-neighbor)`);

    const outPath = inputPath.replace(/(\.\w+)$/, `_${tw}x${th}$1`);
    await sharp(inputPath)
      .resize(tw, th, { fit: "contain", kernel: "nearest", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);

    const stat = fs.statSync(outPath);
    console.log(`완료: ${path.basename(outPath)} (${(stat.size / 1024).toFixed(0)}KB)`);
    return;
  }

  console.log(`설정: ${opts.cols}x${opts.rows} 그리드, trim=${opts.trim}, size=${opts.size || "auto"}`);

  const img = sharp(inputPath);
  const meta = await img.metadata();
  console.log(`이미지 크기: ${meta.width}x${meta.height}`);

  const { data, info } = await img.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  const frameW = Math.floor(info.width / opts.cols);
  const frameH = Math.floor(info.height / opts.rows);
  console.log(`프레임 크기: ${frameW}x${frameH}`);

  fs.mkdirSync(opts.out, { recursive: true });

  // Load alignment offsets if provided
  let alignOffsets = null;
  if (opts.alignTo && fs.existsSync(opts.alignTo)) {
    alignOffsets = JSON.parse(fs.readFileSync(opts.alignTo, "utf8"));
    console.log(`정렬 기준: ${opts.alignTo}`);
  }

  // Determine row/col ranges
  const rowStart = opts.pickRow ? opts.pickRow - 1 : 0;
  const rowEnd = opts.pickRow ? opts.pickRow : opts.rows;
  const colStart = opts.pickFrameEnd ? opts.pickFrameStart - 1 : 0;
  const colEnd = opts.pickFrameEnd ? opts.pickFrameEnd : opts.cols;

  if (opts.pickRow) console.log(`행 선택: ${opts.pickRow}행, 프레임 ${colStart + 1}~${colEnd}`);

  // For --merge: collect processed frames
  const mergeFrames = [];

  // Offset storage for --trim mode (to save for layers later)
  const offsets = {};

  for (let row = rowStart; row < rowEnd; row++) {
    const rowLabel = opts.labels ? opts.labels[row] : (opts.rows > 1 ? `r${row + 1}` : "");
    if (!offsets[rowLabel]) offsets[rowLabel] = {};

    for (let col = colStart; col < colEnd; col++) {
      const frameNum = col + 1;
      const label = rowLabel ? `${rowLabel}-${frameNum}` : `${frameNum}`;

      // Extract frame
      const framePixels = Buffer.alloc(frameW * frameH * 4);
      for (let y = 0; y < frameH; y++) {
        const srcOff = ((row * frameH + y) * info.width + col * frameW) * 4;
        data.copy(framePixels, y * frameW * 4, srcOff, srcOff + frameW * 4);
      }

      // Remove checkerboard
      removeChecker(framePixels, frameW, frameH);

      const bb = getBBox(framePixels, frameW, frameH);
      if (bb.empty) { console.log(`  ${label}: 빈 프레임, 건너뜀`); continue; }

      const cw = bb.maxX - bb.minX + 1;
      const ch = bb.maxY - bb.minY + 1;

      let outPixels;
      let outSize;

      if (alignOffsets && alignOffsets[rowLabel] && alignOffsets[rowLabel][frameNum]) {
        // ── Layer mode: use base offsets ──
        const off = alignOffsets[rowLabel][frameNum];
        outSize = off.canvasSize;
        outPixels = Buffer.alloc(outSize * outSize * 4, 0);
        for (let y = 0; y < frameH; y++) {
          const dstY = off.offsetY + y;
          if (dstY < 0 || dstY >= outSize) continue;
          for (let x = 0; x < frameW; x++) {
            const dstX = off.offsetX + x;
            if (dstX < 0 || dstX >= outSize) continue;
            const si = (y * frameW + x) * 4;
            if (framePixels[si + 3] === 0) continue;
            const di = (dstY * outSize + dstX) * 4;
            outPixels[di] = framePixels[si];
            outPixels[di + 1] = framePixels[si + 1];
            outPixels[di + 2] = framePixels[si + 2];
            outPixels[di + 3] = framePixels[si + 3];
          }
        }
        console.log(`  ${label}: ${cw}x${ch} → ${outSize}x${outSize} (base 정렬)`);

      } else if (opts.trim) {
        // ── Trim + bottom-align ──
        outSize = opts.size || Math.max(cw, ch);
        const placeX = Math.round((outSize - cw) / 2);
        const placeY = outSize - ch; // bottom-align

        // Save offset for layer alignment
        offsets[rowLabel][frameNum] = {
          offsetX: placeX - bb.minX,
          offsetY: placeY - bb.minY,
          canvasSize: outSize,
        };

        outPixels = Buffer.alloc(outSize * outSize * 4, 0);
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            const si = ((bb.minY + y) * frameW + (bb.minX + x)) * 4;
            const dx = placeX + x, dy = placeY + y;
            if (dx >= 0 && dx < outSize && dy >= 0 && dy < outSize) {
              const di = (dy * outSize + dx) * 4;
              outPixels[di] = framePixels[si];
              outPixels[di + 1] = framePixels[si + 1];
              outPixels[di + 2] = framePixels[si + 2];
              outPixels[di + 3] = framePixels[si + 3];
            }
          }
        }
        console.log(`  ${label}: ${cw}x${ch} → ${outSize}x${outSize} (trim+bottom-align)`);

      } else {
        // ── Simple: just output at original frame size ──
        outSize = Math.max(frameW, frameH);
        outPixels = Buffer.alloc(outSize * outSize * 4, 0);
        const offX = Math.round((outSize - frameW) / 2);
        for (let y = 0; y < frameH; y++) {
          for (let x = 0; x < frameW; x++) {
            const si = (y * frameW + x) * 4;
            const di = (y * outSize + (offX + x)) * 4;
            outPixels[di] = framePixels[si];
            outPixels[di + 1] = framePixels[si + 1];
            outPixels[di + 2] = framePixels[si + 2];
            outPixels[di + 3] = framePixels[si + 3];
          }
        }
        console.log(`  ${label}: ${cw}x${ch} (원본 크기 유지 ${outSize}x${outSize})`);
      }

      // Collect for merge
      if (opts.merge) {
        mergeFrames.push({ pixels: outPixels, size: outSize, label });
      }

      // Save individual frame (skip if merge-only would be cleaner, but save anyway)
      if (!opts.merge) {
        const outName = `${opts.prefix}-${label}.png`;
        const outPath = path.join(opts.out, outName);
        await sharp(outPixels, { raw: { width: outSize, height: outSize, channels: 4 } })
          .png()
          .toFile(outPath);
        const stat = fs.statSync(outPath);
        console.log(`    → ${outName} (${(stat.size / 1024).toFixed(0)}KB)`);
      }
    }
  }

  // ── Merge: 가로로 합치기 ──
  if (opts.merge && mergeFrames.length > 0) {
    const fSize = mergeFrames[0].size;
    const totalW = fSize * mergeFrames.length;
    const mergedPixels = Buffer.alloc(totalW * fSize * 4, 0);

    for (let i = 0; i < mergeFrames.length; i++) {
      const frame = mergeFrames[i];
      for (let y = 0; y < frame.size; y++) {
        for (let x = 0; x < frame.size; x++) {
          const si = (y * frame.size + x) * 4;
          const di = (y * totalW + (i * fSize + x)) * 4;
          mergedPixels[di] = frame.pixels[si];
          mergedPixels[di + 1] = frame.pixels[si + 1];
          mergedPixels[di + 2] = frame.pixels[si + 2];
          mergedPixels[di + 3] = frame.pixels[si + 3];
        }
      }
    }

    const mergeName = `${opts.prefix}-merged.png`;
    const mergePath = path.join(opts.out, mergeName);
    await sharp(mergedPixels, { raw: { width: totalW, height: fSize, channels: 4 } })
      .png()
      .toFile(mergePath);
    const stat = fs.statSync(mergePath);
    console.log(`\n합친 이미지: ${mergeName} (${totalW}x${fSize}, ${(stat.size / 1024).toFixed(0)}KB)`);
  }

  // Save offsets JSON if trim mode
  if (opts.trim) {
    const offsetPath = path.join(opts.out, "offsets.json");
    fs.writeFileSync(offsetPath, JSON.stringify(offsets, null, 2));
    console.log(`\n오프셋 저장: ${offsetPath}`);
    console.log("의상 레이어 처리 시 --align-to 옵션으로 사용하세요.");
  }

  console.log(`\n완료! 출력: ${opts.out}`);
}

main().catch(console.error);
