/**
 * Pexels API로 도시별 관광 사진 수집 → src/data/pexelsGallery.js
 *
 * 1. https://www.pexels.com/api/ 에서 무료 API 키 발급
 * 2. .env 에 PEXELS_API_KEY=... 추가
 * 3. node scripts/fetch-pexels-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "src/data/pexelsGallery.js");

const PER_CITY = 4;
const UA = "MyTravel/1.0 (pexels gallery fetch)";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** @type {Record<string, string[]>} */
const QUERIES = {
  안동: ["안동 하회마을", "Andong Hahoe Korea"],
  군산: ["군산", "Gunsan Korea coast"],
  문경: ["문경새재", "Mungyeong Korea"],
  영덕: ["영덕 바다", "Yeongdeok beach Korea"],
  울진: ["울진 바다", "Uljin coast Korea"],
  삼척: ["삼척 바다", "Samcheok beach Korea"],
  동해: ["동해 바다", "Donghae Korea coast"],
  정선: ["정선 아우라지", "Jeongseon Korea"],
  태백: ["태백산", "Taebaeksan Korea"],
  인제: ["인제 내린천", "인제 원대리 벚꽃", "Inje Naerinchon valley Korea", "백두대간 인제"],
  양양: ["양양 낙산사", "Yangyang beach Korea"],
  홍천: ["홍천", "Hongcheon Korea"],
  단양: ["단양 도담삼봉", "Danyang Korea"],
  충주: ["충주 호수", "Chungju Korea"],
  제천: ["제천 청풍호", "Jecheon Korea"],
  공주: ["공주 공산성", "Gongju Korea"],
  보령: ["보령 대천해수욕장", "Boryeong beach Korea"],
  태안: ["태안 바다", "Taean beach Korea"],
  서산: ["서산 해미읍성", "Seosan Korea"],
  부안: ["부안 내소사", "Buan Korea sunset"],
  고창: ["고창 바다", "Gochang Korea"],
  순창: ["순창", "Sunchang Korea"],
  보성: ["보성 녹차밭", "Boseong tea field Korea"],
  구례: ["구례 지리산", "Gurye Korea"],
  하동: ["하동 쌍계사", "Hadong Korea"],
  합천: ["합천 해인사", "Haeinsa Korea"],
  거제: ["거제 바다", "Geoje Korea"],
  통영: ["통영 한려수도", "Tongyeong Korea"],
  남해: ["남해 독일마을", "Namhae Korea"],
  완도: ["완도 바다", "Wando Korea"],
  진도: ["진도 바다", "Jindo bridge Korea"],
  고흥: ["고흥 바다", "Goheung Korea coast"],
  강진: ["강진 다도", "Gangjin Korea"],
  장흥: ["장흥", "Jangheung Korea"],
  담양: ["담양 죽녹원", "Damyang bamboo Korea"],
  무주: ["덕유산 설천", "무주 덕유산 눈", "Muju Deogyusan Korea", "무주 태권사지"],
  임실: ["임실", "Imsil Korea"],
  익산: ["익산 미륵사", "Iksan Korea"],
  포천: ["포천", "Pocheon Korea"],
  양평: ["양평", "Yangpyeong Korea"],
  파주: ["파주 헤이리", "Paju Heyri Korea"],
  강화도: ["강화도", "Ganghwa island Korea"],
  울릉도: ["울릉도", "Ulleungdo Korea"],
  추자도: ["추자도", "Chujado Korea"],
  섬진강: ["섬진강", "Seomjin river Korea"],
  순천만: ["순천만 갈대", "Suncheon bay Korea"],
};

const BAD_ALT =
  /portrait|selfie|headshot|food plate|restaurant interior|office|logo|icon|wedding dress|makeup|gym|fitness model/i;

function loadApiKey() {
  if (process.env.PEXELS_API_KEY) return process.env.PEXELS_API_KEY.trim();
  try {
    const raw = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (k === "PEXELS_API_KEY") return v;
    }
  } catch {
    /* no .env */
  }
  return "";
}

/** @type {Record<string, RegExp>} */
const CITY_ALT_BOOST = {
  무주: /무주|덕유|deogyu|muju|적상|hyangjeok/i,
  인제: /인제|inje|내린|naerin|백두|baekdu|원대|misiryeong|미시령/i,
};

function photoId(src) {
  const m = src?.match(/\/photos\/(\d+)\//);
  return m ? m[1] : src;
}

function scorePhoto(photo, city) {
  let s = 0;
  if (photo.width >= photo.height) s += 12;
  if (photo.width >= 2400) s += 6;
  if (photo.height >= 1200) s += 3;
  const alt = photo.alt || "";
  if (BAD_ALT.test(alt)) s -= 200;
  if (/korea|korean|beach|coast|mountain|island|sunset|sunrise|landscape|harbor|bridge|temple|bay|sea|ocean/i.test(alt)) {
    s += 4;
  }
  const boost = CITY_ALT_BOOST[city];
  if (boost?.test(alt)) s += 20;
  return s;
}

async function searchPexels(apiKey, query) {
  const params = new URLSearchParams({
    query,
    per_page: "20",
    orientation: "landscape",
    locale: "ko-KR",
  });
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey, "User-Agent": UA },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pexels ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.photos || [];
}

function pickPhotos(photos, city, globalUsed) {
  const sorted = [...photos].sort((a, b) => scorePhoto(b, city) - scorePhoto(a, city));
  const seen = new Set();
  const picked = [];
  for (const p of sorted) {
    const src = p.src?.large2x || p.src?.large || p.src?.original;
    const id = photoId(src);
    if (!src || seen.has(id) || globalUsed.has(id)) continue;
    seen.add(id);
    globalUsed.add(id);
    picked.push({
      src,
      page: p.url,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      alt: p.alt || "",
    });
    if (picked.length >= PER_CITY) break;
  }
  return picked;
}

async function fetchCity(apiKey, city, globalUsed) {
  const queries = QUERIES[city] || [`${city} 대한민국`, `${city} Korea travel`];
  const pool = [];
  for (const q of queries) {
    try {
      const photos = await searchPexels(apiKey, q);
      pool.push(...photos);
      await delay(350);
      if (pool.length >= 40) break;
    } catch (e) {
      console.warn(`  ⚠ "${q}": ${e.message}`);
    }
  }
  let picked = pickPhotos(pool, city, globalUsed);
  if (picked.length < PER_CITY) {
    for (const q of queries) {
      try {
        const more = await searchPexels(apiKey, `${q} landscape`);
        picked = pickPhotos([...pool, ...more], city, globalUsed);
        await delay(350);
        if (picked.length >= PER_CITY) break;
      } catch {
        /* skip */
      }
    }
  }
  return picked;
}

function loadExistingGallery() {
  try {
    const raw = fs.readFileSync(OUT, "utf8");
    const json = raw.replace(/^[\s\S]*?= /, "").replace(/;\s*$/, "");
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function collectUsedIds(gallery, skipCities = new Set()) {
  const used = new Set();
  for (const [city, entry] of Object.entries(gallery)) {
    if (skipCities.has(city)) continue;
    for (const p of entry.photos || []) {
      const id = photoId(p.src);
      if (id) used.add(id);
    }
  }
  return used;
}

function writeModule(gallery) {
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

async function main() {
  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error(
      "PEXELS_API_KEY가 없습니다.\n" +
        "  1. https://www.pexels.com/api/ 에서 키 발급\n" +
        "  2. .env 에 PEXELS_API_KEY=your_key 추가\n" +
        "  3. node scripts/fetch-pexels-images.mjs",
    );
    process.exit(1);
  }

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyCities = onlyArg
    ? onlyArg
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const cities = onlyCities?.length
    ? onlyCities.filter((c) => QUERIES[c])
    : Object.keys(QUERIES);

  const gallery = onlyCities?.length ? loadExistingGallery() : {};
  const skip = new Set(onlyCities || []);
  const globalUsed = onlyCities?.length
    ? collectUsedIds(gallery, skip)
    : new Set();
  let ok = 0;

  for (const city of cities) {
    if (gallery[city]?.photos) {
      for (const p of gallery[city].photos) {
        globalUsed.delete(photoId(p.src));
      }
      delete gallery[city];
    }
    process.stdout.write(`${city}… `);
    const photos = await fetchCity(apiKey, city, globalUsed);
    if (photos.length) {
      gallery[city] = { photos };
      ok++;
      console.log(`${photos.length}장`);
    } else {
      console.log("없음 (Wikimedia 폴백)");
    }
    await delay(400);
  }

  writeModule(gallery);
  console.log(`\n완료: ${ok}/${cities.length}곳 → ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
