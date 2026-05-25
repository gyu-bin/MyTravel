/**
 * scenic-gallery.json → destinationImages.js IMAGES·GALLERY_EXTRA 반영
 * node scripts/apply-scenic-gallery.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "scenic-gallery.json");
const TARGET = path.join(__dirname, "../src/data/destinationImages.js");

const CITY_ORDER = [
  "안동", "군산", "문경", "영덕", "울진", "삼척", "동해", "정선", "태백", "인제",
  "양양", "홍천", "단양", "충주", "제천", "공주", "보령", "태안", "서산", "부안",
  "고창", "순창", "보성", "구례", "하동", "합천", "거제", "통영", "남해", "완도",
  "진도", "고흥", "강진", "장흥", "담양", "무주", "임실", "익산", "포천", "양평",
  "파주", "강화도", "울릉도", "추자도", "섬진강", "순천만",
];

/** thumb 없는 원본만 있는 파일 */
const FULL_URL = {
  무주: [
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/%EB%8D%95%EC%9C%A0%EC%82%B0_%28Deogyusan%29_snow_trees.jpg",
  ],
  보령: [
    "https://upload.wikimedia.org/wikipedia/commons/d/d8/Korea-Boryeong-Daecheon_Beach-01.jpg",
  ],
  임실: ["https://upload.wikimedia.org/wikipedia/commons/b/b0/Imsil_Hyanggyo.jpg"],
  강화도: ["https://upload.wikimedia.org/wikipedia/commons/0/07/Ganghwa1.jpg"],
  울릉도: [
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Ulleung_island_from_above.jpg",
  ],
};

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));

function urlExpr(wPath) {
  return `W("${wPath}")`;
}

const imagesLines = ["const IMAGES = {"];
const galleryLines = ["const GALLERY_EXTRA = {"];

for (const city of CITY_ORDER) {
  const items = data[city] || [];
  const paths = items.map((i) => i.wPath).filter(Boolean);
  const fullExtras = FULL_URL[city] || [];

  if (!paths.length && !fullExtras.length) {
    console.warn("skip empty", city);
    continue;
  }

  const main = paths[0]
    ? urlExpr(paths[0])
    : JSON.stringify(fullExtras[0]);
  imagesLines.push(`  ${city}: ${main},`);

  const extras = [
    ...paths.slice(1),
    ...fullExtras.filter((u) => u !== paths[0] && !fullExtras[0]?.includes(paths[0]?.split("/").pop())),
  ].slice(0, 4);

  const uniqueExtras = [...new Set(extras)].filter(
    (ex) => ex !== main && !String(main).includes(ex.split("/").pop()?.slice(0, 20) || ""),
  );
  if (uniqueExtras.length) {
    galleryLines.push(`  ${city}: [`);
    for (const ex of uniqueExtras) {
      if (ex.startsWith("http")) {
        galleryLines.push(`    ${JSON.stringify(ex)},`);
      } else {
        galleryLines.push(`    ${urlExpr(ex)},`);
      }
    }
    galleryLines.push("  ],");
  }
}

imagesLines.push("};");
galleryLines.push("};");

const src = fs.readFileSync(TARGET, "utf8");

const fileHeader = `/**
 * 여행지별 사진 — 위키백과·위키미디어(한국 관광 풍경) 썸네일 1280px
 * 출처: Wikimedia Commons (CC, 파일별 라이선스 참조)
 * 갱신: node scripts/rebuild-scenic-images.mjs && node scripts/patch-scenic-fallbacks.mjs && node scripts/apply-scenic-gallery.mjs
 */

const W = (path) =>
  \`https://upload.wikimedia.org/wikipedia/commons/thumb/\${path}\`;

`;

const tailStart = src.indexOf("const FALLBACK");
const tail = src.slice(tailStart);

const newSrc =
  fileHeader + imagesLines.join("\n") + "\n\n" + galleryLines.join("\n") + "\n\n" + tail;

fs.writeFileSync(TARGET, newSrc);
console.log("Updated", TARGET);
