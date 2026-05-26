/**
 * pexelsGallery.js 도시 간 중복 사진 제거 (부족분은 Wikimedia 폴백)
 * node scripts/dedupe-pexels-gallery.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/data/pexelsGallery.js");

function photoId(src) {
  const m = src?.match(/\/photos\/(\d+)\//);
  return m ? m[1] : src;
}

function loadGallery() {
  const raw = fs.readFileSync(OUT, "utf8");
  const json = raw.replace(/^[\s\S]*?= /, "").replace(/;\s*$/, "");
  return JSON.parse(json);
}

function writeGallery(gallery) {
  const lines = [
    "/**",
    " * Pexels 관광 사진 (자동 생성)",
    " * 갱신: node scripts/fetch-pexels-images.mjs",
    " * 라이선스: https://www.pexels.com/license/",
    " */",
    "",
    "/** @type {Record<string, { photos: { src: string, page: string, photographer: string, photographerUrl: string, alt?: string }[] }>} */",
    "export const PEXELS_GALLERY = " + JSON.stringify(gallery, null, 2) + ";",
    "",
  ];
  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
}

const gallery = loadGallery();
const used = new Set();
let removed = 0;
const emptied = [];

for (const [city, entry] of Object.entries(gallery)) {
  const kept = [];
  for (const p of entry.photos || []) {
    const id = photoId(p.src);
    if (!id || used.has(id)) {
      removed++;
      continue;
    }
    used.add(id);
    kept.push(p);
  }
  if (kept.length) {
    gallery[city] = { photos: kept };
  } else {
    delete gallery[city];
    emptied.push(city);
  }
}

writeGallery(gallery);
console.log(`중복 제거: ${removed}장 삭제`);
if (emptied.length) {
  console.log(`Pexels 비움 → Wikimedia 폴백: ${emptied.join(", ")}`);
  console.log("보충: node scripts/fetch-pexels-images.mjs --only=" + emptied.join(","));
}
