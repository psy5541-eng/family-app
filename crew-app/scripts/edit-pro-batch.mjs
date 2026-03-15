import sharp from "sharp";
import fs from "fs";

const API_KEY = "71dcbf1f-33d5-41f8-bcfd-b48c8cbcbfff";

async function editWithRef(basePath, refPath, outPath) {
  let refBuf = fs.readFileSync(refPath);
  let refMeta = await sharp(refBuf).metadata();
  if (refMeta.width > 256 || refMeta.height > 256) {
    refBuf = await sharp(refBuf).resize(256, 256, { fit: "inside" }).png().toBuffer();
    refMeta = await sharp(refBuf).metadata();
  }

  const fc = Math.round((await sharp(basePath).metadata()).width / 64);
  const editImages = [];
  for (let i = 0; i < fc; i++) {
    const f = await sharp(basePath).extract({ left: i * 64, top: 0, width: 64, height: 64 }).png().toBuffer();
    editImages.push({ image: { type: "base64", base64: f.toString("base64"), format: "png" }, width: 64, height: 64 });
  }

  const resp = await fetch("https://api.pixellab.ai/v2/edit-images-v2", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "edit_with_reference",
      edit_images: editImages,
      image_size: { width: 64, height: 64 },
      reference_image: { image: { type: "base64", base64: refBuf.toString("base64"), format: "png" }, width: refMeta.width, height: refMeta.height },
      no_background: true,
    }),
  });
  const d = await resp.json();
  if (!d.background_job_id) { console.log(`  ERROR: ${JSON.stringify(d).substring(0, 200)}`); return false; }
  console.log(`  submitted: ${d.background_job_id}`);

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
      const imgs = pd.last_response.images || [pd.last_response.image];
      const bufs = [];
      for (const img of imgs) {
        const raw = Buffer.from(img.base64, "base64");
        bufs.push(img.type === "rgba_bytes" ? await sharp(raw, { raw: { width: img.width, height: img.height, channels: 4 } }).png().toBuffer() : raw);
      }
      const combined = await sharp({ create: { width: bufs.length * 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite(bufs.map((b, i) => ({ input: b, left: i * 64, top: 0 }))).png().toBuffer();
      fs.writeFileSync(outPath, combined);
      return true;
    }
    if (pd.status === "failed") { console.log("  FAILED"); return false; }
  }
  console.log("  TIMEOUT");
  return false;
}

const jobs = [
  // 이미 완료된 건 스킵
  // f_t run-female → edit-pro-ft-result.png (완료)
  // m_t run-male → edit-pro-mt-result.png (완료)

  // 바지
  { base: "public/assets/character/base/run-male.png", ref: "assets-raw/test/m_s.png", out: "assets-raw/test/edit-pro-ms-run-male.png", label: "m_s run-male" },
  { base: "public/assets/character/base/run-female.png", ref: "assets-raw/test/f_s.png", out: "assets-raw/test/edit-pro-fs-run-female.png", label: "f_s run-female" },

  // idle도
  { base: "public/assets/character/base/idle-male.png", ref: "assets-raw/test/m_t.png", out: "assets-raw/test/edit-pro-mt-idle-male.png", label: "m_t idle-male" },
  { base: "public/assets/character/base/idle-female.png", ref: "assets-raw/test/f_t.png", out: "assets-raw/test/edit-pro-ft-idle-female.png", label: "f_t idle-female" },
  { base: "public/assets/character/base/idle-male.png", ref: "assets-raw/test/m_s.png", out: "assets-raw/test/edit-pro-ms-idle-male.png", label: "m_s idle-male" },
  { base: "public/assets/character/base/idle-female.png", ref: "assets-raw/test/f_s.png", out: "assets-raw/test/edit-pro-fs-idle-female.png", label: "f_s idle-female" },
];

async function main() {
  for (const job of jobs) {
    console.log(`\n[${job.label}]`);
    const ok = await editWithRef(job.base, job.ref, job.out);
    if (!ok) console.log("  → 실패, 다음으로");
  }
  console.log("\nALL DONE!");
}

main().catch(console.error);
