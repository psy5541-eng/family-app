#!/usr/bin/env node
/**
 * RunningCrew 캐릭터 에셋 파이프라인
 *
 * PixelLab에서 생성한 스프라이트시트를 분리해서
 * public/assets/character/ 구조에 맞게 배치합니다.
 *
 * ═══════════════════════════════════════════════
 *  사용법
 * ═══════════════════════════════════════════════
 *
 * 1) 베이스 캐릭터 (idle/run/walk 맨몸)
 *    node scripts/sprite-pipeline.cjs base <파일> --gender male --action idle
 *    node scripts/sprite-pipeline.cjs base <파일> --gender female --action run
 *
 * 2) 장비 레이어 (top/bottom/shoes/hair/hat)
 *    node scripts/sprite-pipeline.cjs layer <파일> --layer top --name tshirt --action idle
 *    node scripts/sprite-pipeline.cjs layer <파일> --layer shoes --name running --action run
 *
 * 3) 전체 일괄 처리 (assets-raw/ 폴더 기준)
 *    node scripts/sprite-pipeline.cjs batch
 *
 * ═══════════════════════════════════════════════
 *  옵션
 * ═══════════════════════════════════════════════
 *
 *   --cols <N>       스프라이트 열 수 (기본: 4)
 *   --rows <N>       스프라이트 행 수 (기본: 4)
 *   --pick-row <N>   특정 행만 사용 (1부터, 기본: 1)
 *   --pick-cols <a,b> 사용할 열 범위 (기본: 1,4)
 *   --frame-size <N> 프레임 크기 (기본: 자동계산)
 *   --dry-run        실제 파일 쓰기 없이 미리보기
 *
 * ═══════════════════════════════════════════════
 *  입력 형식
 * ═══════════════════════════════════════════════
 *
 * PixelLab 스프라이트시트: 256x256 (4x4 그리드, 64x64 프레임)
 * 또는 개별 64x64 이미지도 지원 (1x1 그리드로 처리)
 *
 * ═══════════════════════════════════════════════
 *  출력 구조 (public/assets/character/)
 * ═══════════════════════════════════════════════
 *
 * base/idle-male-{1-4}.png      ← 맨몸 베이스
 * base/idle-female-{1-4}.png
 * base/run-male-{1-4}.png
 * base/run-female-{1-4}.png
 * top/tshirt-idle-{1-4}.png     ← 장비 레이어
 * bottom/shorts-run-{1-4}.png
 * shoes/running-idle-{1-4}.png
 * hair/ponytail-idle-{1-4}.png
 * hat/cap-idle-{1-4}.png
 */

const fs = require("fs");
const path = require("path");
const sharp = require(path.resolve(__dirname, "../node_modules/sharp"));

const ASSET_OUT = path.resolve(__dirname, "../public/assets/character");
const ASSET_RAW = path.resolve(__dirname, "../assets-raw");

// ── CLI 파싱 ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    command: null,    // base | layer | batch
    input: null,      // 입력 파일 경로
    gender: null,     // male | female
    action: null,     // idle | run | walk
    layer: null,      // top | bottom | shoes | hair | hat
    name: null,       // 아이템명 (tshirt, shorts, running 등)
    cols: 4,
    rows: 4,
    pickRow: 1,
    pickColStart: 1,
    pickColEnd: 4,
    frameSize: 0,     // 0 = 자동
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "base":
      case "layer":
      case "batch":
      case "extract":
      case "extract-hair":
      case "transfer-outfit":
        opts.command = args[i];
        break;
      case "--gender": opts.gender = args[++i]; break;
      case "--action": opts.action = args[++i]; break;
      case "--layer": opts.layer = args[++i]; break;
      case "--name": opts.name = args[++i]; break;
      case "--base-file": opts.baseFile = args[++i]; break;
      case "--cols": opts.cols = parseInt(args[++i]); break;
      case "--rows": opts.rows = parseInt(args[++i]); break;
      case "--pick-row": opts.pickRow = parseInt(args[++i]); break;
      case "--pick-cols": {
        const parts = args[++i].split(",");
        opts.pickColStart = parseInt(parts[0]);
        opts.pickColEnd = parseInt(parts[1] || parts[0]);
        break;
      }
      case "--frame-size": opts.frameSize = parseInt(args[++i]); break;
      case "--threshold": opts.threshold = parseInt(args[++i]); break;
      case "--ymax": opts.ymax = parseFloat(args[++i]); break;
      case "--dry-run": opts.dryRun = true; break;
      default:
        if (!args[i].startsWith("--") && !opts.command) {
          opts.command = args[i];
        } else if (!args[i].startsWith("--")) {
          opts.input = args[i];
        }
    }
  }

  return opts;
}

// ── 스프라이트시트에서 프레임 추출 ──
async function extractFrames(inputPath, opts) {
  const meta = await sharp(inputPath).metadata();
  const frameW = opts.frameSize || Math.floor(meta.width / opts.cols);
  const frameH = opts.frameSize || Math.floor(meta.height / opts.rows);

  console.log(`  입력: ${path.basename(inputPath)} (${meta.width}x${meta.height})`);
  console.log(`  그리드: ${opts.cols}x${opts.rows}, 프레임: ${frameW}x${frameH}`);

  const { data, info } = await sharp(inputPath)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const row = opts.pickRow - 1;
  const frames = [];

  for (let col = opts.pickColStart - 1; col < opts.pickColEnd; col++) {
    const framePixels = Buffer.alloc(frameW * frameH * 4);
    for (let y = 0; y < frameH; y++) {
      const srcOff = ((row * frameH + y) * info.width + col * frameW) * 4;
      const dstOff = y * frameW * 4;
      data.copy(framePixels, dstOff, srcOff, srcOff + frameW * 4);
    }
    frames.push({ pixels: framePixels, width: frameW, height: frameH });
  }

  console.log(`  추출: ${frames.length}프레임 (행 ${opts.pickRow}, 열 ${opts.pickColStart}-${opts.pickColEnd})`);
  return frames;
}

// ── 프레임 저장 ──
async function saveFrames(frames, outDir, prefix, opts) {
  fs.mkdirSync(outDir, { recursive: true });

  const saved = [];
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const fileName = `${prefix}-${i + 1}.png`;
    const outPath = path.join(outDir, fileName);

    if (opts.dryRun) {
      console.log(`  [DRY] ${fileName} (${frame.width}x${frame.height})`);
    } else {
      await sharp(frame.pixels, {
        raw: { width: frame.width, height: frame.height, channels: 4 },
      })
        .png()
        .toFile(outPath);

      const stat = fs.statSync(outPath);
      console.log(`  → ${fileName} (${(stat.size / 1024).toFixed(1)}KB)`);
    }
    saved.push(outPath);
  }

  return saved;
}

// ── base 명령어: 맨몸 베이스 처리 ──
async function processBase(opts) {
  if (!opts.input || !opts.gender || !opts.action) {
    console.error("사용법: sprite-pipeline.cjs base <파일> --gender male|female --action idle|run|walk");
    process.exit(1);
  }

  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`파일 없음: ${inputPath}`);
    process.exit(1);
  }

  console.log(`\n[BASE] ${opts.gender} ${opts.action}`);

  const frames = await extractFrames(inputPath, opts);

  // base 폴더 결정: idle → base/, run → base/, walk → base/
  const outDir = path.join(ASSET_OUT, "base");
  const prefix = `${opts.action}-${opts.gender}`;

  await saveFrames(frames, outDir, prefix, opts);
  console.log(`  완료! → ${outDir}/`);
}

// ── layer 명령어: 장비 레이어 처리 ──
async function processLayer(opts) {
  if (!opts.input || !opts.layer || !opts.name || !opts.action) {
    console.error("사용법: sprite-pipeline.cjs layer <파일> --layer top|bottom|shoes|hair|hat --name <이름> --action idle|run|walk");
    process.exit(1);
  }

  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`파일 없음: ${inputPath}`);
    process.exit(1);
  }

  console.log(`\n[LAYER] ${opts.layer}/${opts.name} ${opts.action}`);

  const frames = await extractFrames(inputPath, opts);

  const outDir = path.join(ASSET_OUT, opts.layer);
  const prefix = `${opts.name}-${opts.action}`;

  await saveFrames(frames, outDir, prefix, opts);
  console.log(`  완료! → ${outDir}/`);
}

// ── batch 명령어: assets-raw/ 규칙 기반 일괄 처리 ──
async function processBatch(opts) {
  console.log("\n[BATCH] assets-raw/ 스캔 중...\n");

  // 규칙: assets-raw/{category}/ 아래 파일명 패턴으로 자동 판별
  // base/{gender}_{action}.png      → base 처리
  // {layer}/{name}_{action}.png     → layer 처리
  const categories = ["base", "top", "bottom", "shoes", "hair", "hat"];

  let processed = 0;

  for (const cat of categories) {
    const catDir = path.join(ASSET_RAW, cat);
    if (!fs.existsSync(catDir)) continue;

    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".png"));

    for (const file of files) {
      const inputPath = path.join(catDir, file);
      const basename = path.basename(file, ".png");

      // 파일명 파싱: {name}_{action} 또는 {gender}_{action}
      const parts = basename.split("_");
      if (parts.length < 2) {
        console.log(`  SKIP: ${file} (파일명 형식 불일치, {name}_{action} 필요)`);
        continue;
      }

      const name = parts.slice(0, -1).join("_");
      const action = parts[parts.length - 1];

      if (!["idle", "run", "walk"].includes(action)) {
        console.log(`  SKIP: ${file} (action="${action}" 미지원)`);
        continue;
      }

      if (cat === "base") {
        // base: name = gender
        if (!["male", "female"].includes(name)) {
          console.log(`  SKIP: ${file} (gender="${name}" 미지원)`);
          continue;
        }
        await processBase({ ...opts, input: inputPath, gender: name, action });
      } else {
        await processLayer({ ...opts, input: inputPath, layer: cat, name, action });
      }

      processed++;
    }
  }

  if (processed === 0) {
    console.log("처리할 파일이 없습니다.");
    console.log("\nassets-raw/ 폴더 구조:");
    console.log("  base/male_idle.png, female_run.png ...");
    console.log("  top/tshirt_idle.png, tanktop_run.png ...");
    console.log("  bottom/shorts_idle.png, leggings_run.png ...");
    console.log("  shoes/running_idle.png, trail_run.png ...");
    console.log("  hair/short_idle.png, ponytail_run.png ...");
    console.log("  hat/cap_idle.png, visor_run.png ...");
  } else {
    console.log(`\n총 ${processed}개 파일 처리 완료!`);
  }
}

// ── extract 명령어: 맨몸 vs 옷입은 비교로 옷 레이어 추출 ──
async function processExtract(opts) {
  if (!opts.input || !opts.gender) {
    console.error("사용법: sprite-pipeline.cjs extract <옷입은파일> --gender male|female [--base-file <맨몸파일>]");
    console.error("  맨몸 파일 미지정 시 assets-raw/{gender 첫글자}_idle.png 사용");
    process.exit(1);
  }

  const clothedPath = path.resolve(opts.input);
  if (!fs.existsSync(clothedPath)) {
    console.error(`파일 없음: ${clothedPath}`);
    process.exit(1);
  }

  // 맨몸 베이스 파일 결정
  const genderPrefix = opts.gender === "female" ? "f" : "m";
  const basePath = opts.baseFile
    ? path.resolve(opts.baseFile)
    : path.join(ASSET_RAW, `${genderPrefix}_idle.png`);

  if (!fs.existsSync(basePath)) {
    console.error(`맨몸 베이스 파일 없음: ${basePath}`);
    process.exit(1);
  }

  console.log(`\n[EXTRACT] ${opts.gender} 옷 레이어 추출`);
  console.log(`  맨몸: ${path.basename(basePath)}`);
  console.log(`  옷입은: ${path.basename(clothedPath)}`);

  // 두 스프라이트시트를 raw 픽셀로 로드
  const [nakedBuf, clothedBuf] = await Promise.all([
    sharp(basePath).raw().ensureAlpha().toBuffer({ resolveWithObject: true }),
    sharp(clothedPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true }),
  ]);

  if (nakedBuf.info.width !== clothedBuf.info.width || nakedBuf.info.height !== clothedBuf.info.height) {
    console.error(`크기 불일치: 맨몸(${nakedBuf.info.width}x${nakedBuf.info.height}) vs 옷(${clothedBuf.info.width}x${clothedBuf.info.height})`);
    process.exit(1);
  }

  const W = nakedBuf.info.width;
  const H = nakedBuf.info.height;
  const frameW = opts.frameSize || Math.floor(W / opts.cols);
  const frameH = opts.frameSize || Math.floor(H / opts.rows);

  console.log(`  그리드: ${opts.cols}x${opts.rows}, 프레임: ${frameW}x${frameH}`);

  // 옷 입은 이미지 배경색 감지 (좌상단 픽셀)
  const bgR = clothedBuf.data[0];
  const bgG = clothedBuf.data[1];
  const bgB = clothedBuf.data[2];
  const bgA = clothedBuf.data[3];
  const hasBg = bgA > 0;
  if (hasBg) {
    console.log(`  배경색 감지: rgb(${bgR},${bgG},${bgB}) → 자동 제거`);
  }

  // 배경색 판별 함수 (허용 오차 15)
  function isBgColor(r, g, b, a) {
    if (!hasBg) return a === 0;
    return Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 15 && a > 200;
  }

  // 프레임별로 diff 추출
  const row = opts.pickRow - 1;
  const numFrames = opts.pickColEnd - opts.pickColStart + 1;

  // Y좌표 기반 레이어 영역 (64x64 기준, 3등신 치비 캐릭터)
  // 비율로 지정하여 다른 프레임 크기에도 적용 가능
  const regions = {
    top:    { yStart: 0.42, yEnd: 0.67 },   // 상의: 목 아래(머리 완전 제외) ~ 허리
    bottom: { yStart: 0.58, yEnd: 0.78 },   // 하의: 허리 ~ 무릎
    shoes:  { yStart: 0.75, yEnd: 1.00 },   // 신발: 무릎 아래 ~ 바닥
  };

  const layers = ["top", "bottom", "shoes"];
  const results = {};

  for (const layer of layers) {
    results[layer] = [];
  }

  // 전체 diff도 저장 (디버그용)
  const fullDiffs = [];

  for (let col = opts.pickColStart - 1; col < opts.pickColEnd; col++) {
    // 전체 diff 프레임
    const diffPixels = Buffer.alloc(frameW * frameH * 4, 0);
    let diffCount = 0;

    for (let y = 0; y < frameH; y++) {
      for (let x = 0; x < frameW; x++) {
        const srcOff = ((row * frameH + y) * W + col * frameW + x) * 4;
        const dstOff = (y * frameW + x) * 4;

        const nR = nakedBuf.data[srcOff];
        const nG = nakedBuf.data[srcOff + 1];
        const nB = nakedBuf.data[srcOff + 2];
        const nA = nakedBuf.data[srcOff + 3];

        const cR = clothedBuf.data[srcOff];
        const cG = clothedBuf.data[srcOff + 1];
        const cB = clothedBuf.data[srcOff + 2];
        const cA = clothedBuf.data[srcOff + 3];

        // 옷 입은 쪽이 배경색이면 스킵 (배경 → 투명 처리)
        if (isBgColor(cR, cG, cB, cA)) continue;

        // 색상 차이가 있으면 옷 픽셀 (임계값 높여서 AI 생성 미세 차이 무시)
        const colorDiff = Math.abs(nR - cR) + Math.abs(nG - cG) + Math.abs(nB - cB) + Math.abs(nA - cA);
        if (colorDiff > 40) {
          diffPixels[dstOff] = cR;
          diffPixels[dstOff + 1] = cG;
          diffPixels[dstOff + 2] = cB;
          diffPixels[dstOff + 3] = cA;
          diffCount++;
        }
      }
    }

    fullDiffs.push({ pixels: diffPixels, width: frameW, height: frameH });

    // 레이어별로 분리
    for (const layer of layers) {
      const region = regions[layer];
      const yS = Math.floor(frameH * region.yStart);
      const yE = Math.floor(frameH * region.yEnd);
      const layerPixels = Buffer.alloc(frameW * frameH * 4, 0);

      for (let y = yS; y < yE; y++) {
        for (let x = 0; x < frameW; x++) {
          const off = (y * frameW + x) * 4;
          if (diffPixels[off + 3] > 0) {
            layerPixels[off] = diffPixels[off];
            layerPixels[off + 1] = diffPixels[off + 1];
            layerPixels[off + 2] = diffPixels[off + 2];
            layerPixels[off + 3] = diffPixels[off + 3];
          }
        }
      }

      results[layer].push({ pixels: layerPixels, width: frameW, height: frameH });
    }

    console.log(`  프레임 ${col + 1}: ${diffCount}px 차이`);
  }

  // 전체 diff 저장 (디버그)
  const debugDir = path.join(ASSET_RAW, "processed", `extract-${opts.gender}`);
  await saveFrames(fullDiffs, debugDir, `diff-${opts.gender}`, opts);
  console.log(`\n  [디버그] 전체 diff → ${debugDir}/`);

  // 레이어별 저장
  const itemName = opts.name || "default";
  for (const layer of layers) {
    const outDir = path.join(ASSET_OUT, layer);
    const prefix = `${itemName}-idle`;
    await saveFrames(results[layer], outDir, prefix, opts);
    console.log(`  [${layer}] → ${outDir}/${prefix}-{1-4}.png`);
  }

  console.log(`\n  추출 완료! 레이어 영역 (비율):`);
  console.log(`    top:    ${(regions.top.yStart * 100).toFixed(0)}% ~ ${(regions.top.yEnd * 100).toFixed(0)}%`);
  console.log(`    bottom: ${(regions.bottom.yStart * 100).toFixed(0)}% ~ ${(regions.bottom.yEnd * 100).toFixed(0)}%`);
  console.log(`    shoes:  ${(regions.shoes.yStart * 100).toFixed(0)}% ~ ${(regions.shoes.yEnd * 100).toFixed(0)}%`);
  console.log(`\n  영역 조정이 필요하면 스크립트의 regions 객체를 수정하세요.`);
}

// ── extract-hair 명령어: 대머리 vs 헤어 비교로 헤어만 추출 ──
async function processExtractHair(opts) {
  if (!opts.input || !opts.gender || !opts.action) {
    console.error("사용법: sprite-pipeline.cjs extract-hair <헤어있는파일> --gender male|female --action idle|run");
    console.error("  --base-file <맨몸파일>  (미지정 시 base/{action}-{gender}.png 사용)");
    console.error("  --name <이름>          (미지정 시 'default')");
    console.error("  --threshold <N>        (diff 임계값, 기본: 60)");
    console.error("  --ymax <0~1>           (Y영역 상한 비율, 기본: 0.55)");
    console.error("");
    console.error("예시:");
    console.error("  node scripts/sprite-pipeline.cjs extract-hair assets-raw/action/run-male2.png --gender male --action run");
    console.error("  node scripts/sprite-pipeline.cjs extract-hair hair-female.png --gender female --action idle --name ponytail --ymax 0.6");
    process.exit(1);
  }

  const hairedPath = path.resolve(opts.input);
  if (!fs.existsSync(hairedPath)) {
    console.error(`파일 없음: ${hairedPath}`);
    process.exit(1);
  }

  // 대머리 베이스 파일 결정
  const baldPath = opts.baseFile
    ? path.resolve(opts.baseFile)
    : path.join(ASSET_OUT, "base", `${opts.action}-${opts.gender}.png`);

  if (!fs.existsSync(baldPath)) {
    console.error(`대머리 베이스 파일 없음: ${baldPath}`);
    console.error(`  → base 명령어로 먼저 생성하거나 --base-file 으로 지정하세요`);
    process.exit(1);
  }

  const threshold = opts.threshold || 60;
  const yMaxRatio = opts.ymax || 0.55;
  const itemName = opts.name || "default";

  console.log(`\n[EXTRACT-HAIR] ${opts.gender} ${opts.action}`);
  console.log(`  대머리: ${path.basename(baldPath)}`);
  console.log(`  헤어: ${path.basename(hairedPath)}`);
  console.log(`  임계값: ${threshold}, Y상한: ${(yMaxRatio * 100).toFixed(0)}%`);

  const [baldBuf, hairedBuf] = await Promise.all([
    sharp(baldPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true }),
    sharp(hairedPath).raw().ensureAlpha().toBuffer({ resolveWithObject: true }),
  ]);

  if (baldBuf.info.width !== hairedBuf.info.width || baldBuf.info.height !== hairedBuf.info.height) {
    console.error(`크기 불일치: 대머리(${baldBuf.info.width}x${baldBuf.info.height}) vs 헤어(${hairedBuf.info.width}x${hairedBuf.info.height})`);
    process.exit(1);
  }

  const W = baldBuf.info.width;
  const H = baldBuf.info.height;
  const hairMaxY = Math.floor(H * yMaxRatio);

  const result = Buffer.alloc(W * H * 4, 0);
  let hairPixels = 0;

  for (let y = 0; y < H; y++) {
    if (y > hairMaxY) continue;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const bR = baldBuf.data[i], bG = baldBuf.data[i + 1], bB = baldBuf.data[i + 2], bA = baldBuf.data[i + 3];
      const hR = hairedBuf.data[i], hG = hairedBuf.data[i + 1], hB = hairedBuf.data[i + 2], hA = hairedBuf.data[i + 3];

      const diff = Math.abs(bR - hR) + Math.abs(bG - hG) + Math.abs(bB - hB) + Math.abs(bA - hA);
      if (diff > threshold) {
        result[i] = hR;
        result[i + 1] = hG;
        result[i + 2] = hB;
        result[i + 3] = hA;
        hairPixels++;
      }
    }
  }

  const outDir = path.join(ASSET_OUT, "hair");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = `${itemName}-${opts.action}-${opts.gender}.png`;
  const outPath = path.join(outDir, outFile);

  if (opts.dryRun) {
    console.log(`  [DRY] ${outFile} (${hairPixels}px 헤어)`);
  } else {
    await sharp(result, { raw: { width: W, height: H, channels: 4 } })
      .png()
      .toFile(outPath);
    const stat = fs.statSync(outPath);
    console.log(`  → ${outFile} (${(stat.size / 1024).toFixed(1)}KB, ${hairPixels}px 헤어)`);
  }

  console.log(`  완료! → ${outDir}/`);
}

// ── transfer-outfit 명령어: PixelLab API로 옷 입히기 + 추출 ──
async function processTransferOutfit(opts) {
  if (!opts.input || !opts.name) {
    console.error("사용법: sprite-pipeline.cjs transfer-outfit <옷참조이미지> --name <아이템명>");
    console.error("  예: node scripts/sprite-pipeline.cjs transfer-outfit assets-raw/test/123.png --name white-tshirt");
    console.error("");
    console.error("  4개 베이스(run-female, run-male, idle-female, idle-male)에 순차적으로 적용합니다.");
    console.error("  결과는 public/assets/character/top/{name}-{action}-{gender}.png 에 저장됩니다.");
    process.exit(1);
  }

  const refPath = path.resolve(opts.input);
  if (!fs.existsSync(refPath)) {
    console.error(`파일 없음: ${refPath}`);
    process.exit(1);
  }

  const API_KEY = process.env.PIXELLAB_API_KEY || "71dcbf1f-33d5-41f8-bcfd-b48c8cbcbfff";
  let refMeta = await sharp(refPath).metadata();
  let refBuf;
  // 참조 이미지 256px 이하로 자동 리사이즈
  if (refMeta.width > 256 || refMeta.height > 256) {
    console.log(`  참조 이미지 ${refMeta.width}x${refMeta.height} → 256px 리사이즈`);
    refBuf = await sharp(refPath).resize(256, 256, { fit: "inside" }).png().toBuffer();
    refMeta = await sharp(refBuf).metadata();
  } else {
    refBuf = fs.readFileSync(refPath);
  }

  const bases = [
    { path: path.join(ASSET_OUT, "base", "run-female.png"), action: "run", gender: "female" },
    { path: path.join(ASSET_OUT, "base", "run-male.png"), action: "run", gender: "male" },
    { path: path.join(ASSET_OUT, "base", "idle-female.png"), action: "idle", gender: "female" },
    { path: path.join(ASSET_OUT, "base", "idle-male.png"), action: "idle", gender: "male" },
  ];

  function isClothingColor(r, g, b) {
    // 피부색(warm peach tones)만 제외, 나머지는 전부 옷으로 판단
    const isSkin = r > 160 && g > 100 && b > 80 && (r - b) > 30;
    const isPinkSkin = r > 120 && r < 220 && g < 120 && b < 120 && (r - g) > 20 && (r - b) > 20;
    return !isSkin && !isPinkSkin;
  }

  for (const base of bases) {
    if (!fs.existsSync(base.path)) {
      console.log(`  SKIP: ${base.path} (파일 없음)`);
      continue;
    }
    // --gender 옵션으로 특정 성별만 처리
    if (opts.gender && base.gender !== opts.gender) {
      console.log(`  SKIP: ${base.action}-${base.gender} (--gender ${opts.gender})`);
      continue;
    }

    const label = `${base.action}-${base.gender}`;
    console.log(`\n[TRANSFER] ${label}`);

    // Step 1: API 호출
    const meta = await sharp(base.path).metadata();
    const fc = Math.round(meta.width / 64);
    const frames = [];
    for (let i = 0; i < fc; i++) {
      const f = await sharp(base.path).extract({ left: i * 64, top: 0, width: 64, height: 64 }).png().toBuffer();
      frames.push({ image: { type: "base64", base64: f.toString("base64"), format: "png" }, size: { width: 64, height: 64 } });
    }

    const resp = await fetch("https://api.pixellab.ai/v2/transfer-outfit-v2", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reference_image: { image: { type: "base64", base64: refBuf.toString("base64"), format: "png" }, size: { width: refMeta.width, height: refMeta.height } },
        frames,
        image_size: { width: 64, height: 64 },
      }),
    });
    const d = await resp.json();
    if (!d.background_job_id) {
      console.log(`  ERROR: ${JSON.stringify(d).substring(0, 200)}`);
      continue;
    }
    console.log(`  submitted: ${d.background_job_id}`);

    // Step 2: 폴링
    let transferBufs = null;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 10000));
      const pr = await fetch(`https://api.pixellab.ai/v2/background-jobs/${d.background_job_id}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      const pd = await pr.json();
      const prog = (pd.last_response?.progress || 0).toFixed(2);
      process.stdout.write(`  poll ${i + 1}: ${pd.status} ${prog}\r`);

      if (pd.status === "completed") {
        console.log(`  poll ${i + 1}: completed!          `);
        const imgs = pd.last_response.images || (pd.last_response.image ? [pd.last_response.image] : []);
        transferBufs = [];
        for (const img of imgs) {
          const raw = Buffer.from(img.base64, "base64");
          const png = img.type === "rgba_bytes"
            ? await sharp(raw, { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer()
            : raw;
          transferBufs.push(png);
        }
        break;
      }
      if (pd.status === "failed") {
        console.log(`  FAILED`);
        break;
      }
    }

    if (!transferBufs || transferBufs.length === 0) {
      console.log(`  결과 없음, 스킵`);
      continue;
    }

    // 전체 결과 저장 (test/)
    const testDir = path.join(ASSET_RAW, "test");
    fs.mkdirSync(testDir, { recursive: true });
    const transferSheet = await sharp({
      create: { width: transferBufs.length * 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite(transferBufs.map((b, i) => ({ input: b, left: i * 64, top: 0 }))).png().toBuffer();
    fs.writeFileSync(path.join(testDir, `transfer-${opts.name}-${label}.png`), transferSheet);

    // Step 3: 옷 추출 (base와 diff)
    const baseRaws = [];
    for (let i = 0; i < fc; i++) {
      baseRaws.push(await sharp(base.path).extract({ left: i * 64, top: 0, width: 64, height: 64 }).raw().toBuffer());
    }

    const extractedBufs = [];
    for (let fi = 0; fi < transferBufs.length; fi++) {
      const srcRaw = await sharp(transferBufs[fi]).raw().toBuffer();
      const baseRaw = baseRaws[fi] || baseRaws[0];

      let minY = 64, maxY = 0;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++)
        if (baseRaw[(y * 64 + x) * 4 + 3] > 128) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      const ch = maxY - minY;
      const sY = minY + Math.floor(ch * 0.42);
      const eY = minY + Math.floor(ch * 0.75);

      const extracted = Buffer.alloc(64 * 64 * 4, 0);
      for (let y = sY; y <= eY; y++) {
        for (let x = 0; x < 64; x++) {
          const idx = (y * 64 + x) * 4;
          const sa = srcRaw[idx + 3], ba = baseRaw[idx + 3];
          if (sa < 128 || ba < 128) continue;
          const sr = srcRaw[idx], sg = srcRaw[idx + 1], sb = srcRaw[idx + 2];
          const br = baseRaw[idx], bg = baseRaw[idx + 1], bb = baseRaw[idx + 2];
          const diff = Math.abs(sr - br) + Math.abs(sg - bg) + Math.abs(sb - bb);
          if (diff > 30 && isClothingColor(sr, sg, sb)) {
            extracted[idx] = sr; extracted[idx + 1] = sg; extracted[idx + 2] = sb; extracted[idx + 3] = sa;
          }
        }
      }
      extractedBufs.push(await sharp(extracted, { raw: { width: 64, height: 64, channels: 4 } }).png().toBuffer());
    }

    // Step 4: top/ 에 저장
    const outDir = path.join(ASSET_OUT, "top");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = `${opts.name}-${label}.png`;
    const combined = await sharp({
      create: { width: extractedBufs.length * 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite(extractedBufs.map((b, i) => ({ input: b, left: i * 64, top: 0 }))).png().toBuffer();
    fs.writeFileSync(path.join(outDir, outFile), combined);
    console.log(`  → top/${outFile}`);
  }

  console.log(`\n완료! public/assets/character/top/${opts.name}-*.png 생성됨`);
}

// ── 도움말 ──
function showHelp() {
  console.log(`
RunningCrew 캐릭터 에셋 파이프라인
===================================

사용법:
  node scripts/sprite-pipeline.cjs <명령> [옵션]

명령:
  base <파일>   맨몸 베이스 스프라이트 처리
    --gender male|female    성별 (필수)
    --action idle|run|walk  동작 (필수)

  layer <파일>  장비 레이어 스프라이트 처리
    --layer top|bottom|shoes|hair|hat  레이어 종류 (필수)
    --name <이름>                      아이템명 (필수, 예: tshirt)
    --action idle|run|walk             동작 (필수)

  batch         assets-raw/ 폴더 자동 일괄 처리

  transfer-outfit <옷이미지>  PixelLab API로 옷 입히기 + top 레이어 추출
    --name <이름>              아이템명 (필수, 예: white-tshirt)
    → 4개 베이스(run/idle × male/female) 순차 처리
    → top/{name}-{action}-{gender}.png 자동 생성

  extract-hair <파일>  대머리 vs 헤어 비교로 헤어만 추출
    --gender male|female    성별 (필수)
    --action idle|run|walk  동작 (필수)
    --name <이름>           아이템명 (기본: default)
    --base-file <파일>      대머리 베이스 (기본: base/{action}-{gender}.png)
    --threshold <N>         diff 임계값 (기본: 60)
    --ymax <0~1>            Y영역 상한 비율 (기본: 0.55)

공통 옵션:
  --cols <N>          열 수 (기본: 4)
  --rows <N>          행 수 (기본: 4)
  --pick-row <N>      사용할 행 (기본: 1)
  --pick-cols <a,b>   사용할 열 범위 (기본: 1,4)
  --frame-size <N>    프레임 크기 (기본: 자동)
  --dry-run           미리보기만

예시:
  # 남자 idle 스프라이트시트 → base/idle-male-{1-4}.png
  node scripts/sprite-pipeline.cjs base assets-raw/base/male_idle.png --gender male --action idle

  # 티셔츠 idle 레이어 → top/tshirt-idle-{1-4}.png
  node scripts/sprite-pipeline.cjs layer assets-raw/top/tshirt_idle.png --layer top --name tshirt --action idle

  # 전체 일괄 처리
  node scripts/sprite-pipeline.cjs batch

입력 파일 규격:
  256x256 PNG (4x4 그리드, 64x64 프레임) — PixelLab 기본
  개별 64x64 PNG도 지원 (--cols 1 --rows 1)

출력 구조:
  crew-app/public/assets/character/
  ├── base/  idle-male-{1-4}.png, run-female-{1-4}.png ...
  ├── top/   tshirt-idle-{1-4}.png ...
  ├── bottom/ shorts-run-{1-4}.png ...
  ├── shoes/ running-idle-{1-4}.png ...
  ├── hair/  ponytail-idle-{1-4}.png ...
  └── hat/   cap-idle-{1-4}.png ...
`);
}

// ── 메인 ──
async function main() {
  const opts = parseArgs();

  switch (opts.command) {
    case "base":
      await processBase(opts);
      break;
    case "layer":
      await processLayer(opts);
      break;
    case "batch":
      await processBatch(opts);
      break;
    case "extract":
      await processExtract(opts);
      break;
    case "extract-hair":
      await processExtractHair(opts);
      break;
    case "transfer-outfit":
      await processTransferOutfit(opts);
      break;
    default:
      showHelp();
  }
}

main().catch(console.error);
