/**
 * gallery-data.json → GALLERY_EXTRA JS 조각 생성
 * node scripts/generate-gallery-extra.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, "gallery-data.json"), "utf8"),
);

const CITY_ORDER = [
  "안동", "군산", "문경", "영덕", "울진", "삼척", "동해", "정선", "태백", "인제",
  "양양", "홍천", "단양", "충주", "제천", "공주", "보령", "태안", "서산", "부안",
  "고창", "순창", "보성", "구례", "하동", "합천", "거제", "통영", "남해", "완도",
  "진도", "고흥", "강진", "장흥", "담양", "무주", "임실", "익산", "포천", "양평",
  "파주", "강화도", "울릉도", "추자도", "섬진강", "순천만",
];

const lines = ["const GALLERY_EXTRA = {"];

for (const city of CITY_ORDER) {
  const items = data[city] || [];
  const paths = items.map((i) => i.wPath).filter(Boolean);
  if (!paths.length) {
    console.warn("WARN: no gallery for", city);
    continue;
  }
  lines.push(`  ${city}: [`);
  for (const p of paths.slice(0, 3)) {
    lines.push(`    W("${p}"),`);
  }
  lines.push("  ],");
}

lines.push("};");
lines.push("");

const out = path.join(__dirname, "gallery-extra.generated.js");
fs.writeFileSync(out, lines.join("\n"));
console.log("Wrote", out, "—", CITY_ORDER.filter((c) => (data[c] || []).length).length, "cities");
