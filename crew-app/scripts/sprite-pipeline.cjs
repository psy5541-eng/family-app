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
    default:
      showHelp();
  }
}

main().catch(console.error);
