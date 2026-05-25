/**
 * Wikimedia Commons에서 여행지별 갤러리 URL 수집
 * node scripts/fetch-gallery.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "gallery-data.json");

const CITIES = {
  안동: ["Hahoe Folk Village Korea", "Andong Korea temple"],
  군산: ["Seonyudo Gunsan Korea", "Gunsan islands coastal Korea"],
  문경: ["Mungyeong Saejae Korea", "Korea-Mungyeong"],
  영덕: ["Yeongdeok beach Korea", "Ganggu port Yeongdeok"],
  울진: ["Uljin Korea coast", "Korea-Uljin"],
  삼척: ["Samcheok cave beach", "Korea-Samcheok"],
  동해: ["Donghae Samhwasa", "Korea-Donghae"],
  정선: ["Jeongseon rail bike", "Korea-Jeongseon"],
  태백: ["Taebaek mountain Korea", "Korea-Taebaek"],
  인제: ["Inje Misiryeong Gombaeryeong", "Baekdamsa Korea"],
  양양: ["Naksan Temple Yangyang", "Korea-Yangyang"],
  홍천: ["Hongcheon river Korea", "Korea-Hongcheon"],
  단양: ["Dodamsambong Danyang", "Korea-Danyang"],
  충주: ["Chungjuho Lake", "Korea-Chungju"],
  제천: ["Cheongpung Jecheon", "Korea-Jecheon"],
  공주: ["Gongsanseong Gongju", "Korea-Gongju"],
  보령: ["Daecheon beach Boryeong", "Korea-Boryeong"],
  태안: ["Taean coast Korea", "Korea-Taean"],
  서산: ["Seosan bird Korea", "Korea-Seosan"],
  부안: ["Naesosa Buan", "Korea-Buan"],
  고창: ["Gochang dolmen Korea", "Korea-Gochang"],
  순창: ["Seonunsa Soonchang", "Korea-Soonchang"],
  보성: ["Boseong green tea", "Korea-Boseong"],
  구례: ["Gurye Jirisan", "Korea-Gurye"],
  하동: ["Hadong tea temple", "Korea-Hadong"],
  합천: ["Haeinsa temple", "Korea-Hapcheon"],
  거제: ["Geoje island Korea", "Korea-Geoje"],
  통영: ["Tongyeong harbor", "Korea-Tongyeong"],
  남해: ["Namhae German village", "Korea-Namhae"],
  완도: ["Wando bridge Korea", "Korea-Wando"],
  진도: ["Jindo bridge Korea", "Korea-Jindo"],
  고흥: ["Goheung peninsula", "Korea-Goheung"],
  강진: ["Baengnyeonsa Gangjin", "Gauhdo Island Gangjin", "Korea-Gangjin"],
  장흥: ["Jangheung Korea", "Korea-Jangheung"],
  담양: ["Damyang bamboo forest", "Korea-Damyang"],
  무주: ["Deogyusan Korea mountain", "Muju county landscape"],
  임실: ["Imsil cheese Korea", "Korea-Imsil"],
  익산: ["Mireuksa Iksan", "Korea-Iksan"],
  포천: ["Pocheon Art Valley", "Korea-Pocheon"],
  양평: ["Yangpyeong river", "Korea-Yangpyeong"],
  파주: ["Imjingak Paju", "Korea-Paju"],
  강화도: ["Ganghwa island fortress", "Korea-Ganghwa"],
  울릉도: ["Ulleung island Korea", "Ulleungdo"],
  추자도: ["Chujado island", "Chujado"],
  섬진강: ["Seomjingang river", "Gurye Seomjin"],
  순천만: ["Suncheon bay reed", "Suncheon wetland"],
};

const UA = "MyTravelGalleryBot/1.0";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url, retries = 5) {
  for (let i = 0; i < retries; i += 1) {
    await delay(2500 + i * 1500);
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    const text = await r.text();
    if (text.startsWith("You are making")) {
      console.warn("rate limit, retry", i + 1);
      continue;
    }
    try {
      return JSON.parse(text);
    } catch {
      console.warn("bad json", text.slice(0, 60));
    }
  }
  throw new Error("API failed: " + url.slice(0, 80));
}

async function commonsSearch(q) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=12&format=json`;
  const j = await api(u);
  return (j.query?.search || [])
    .map((s) => s.title.replace(/^File:/, ""))
    .filter(
      (f) =>
        !/\.svg$/i.test(f) &&
        !/flag|logo|emblem|map|icon|coat|USAF|photo \d/i.test(f) &&
        !/ballot|election|post.?office|_Station|Univ\.|Speedium|gun.?office|tunnel|Tunnel|Magpie|Expwy|dog|puppy/i.test(
          f,
        ) &&
        /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(f),
    );
}

async function getThumbsBatch(filenames) {
  if (!filenames.length) return {};
  const titles = filenames.map((f) => "File:" + f).join("|");
  const u = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url&iiurlwidth=960&format=json`;
  const j = await api(u);
  const out = {};
  for (const p of Object.values(j.query?.pages || {})) {
    const info = p.imageinfo?.[0];
    if (info?.thumburl && p.title) {
      const name = p.title.replace(/^File:/, "");
      out[name] = info.thumburl;
    }
  }
  return out;
}

function thumbToWPath(thumbUrl) {
  const m = thumbUrl.match(/\/commons\/thumb\/(.+\/)(\d+px-[^/]+)$/);
  return m ? `${m[1]}${m[2]}` : null;
}

let result = {};
if (fs.existsSync(OUT)) {
  result = JSON.parse(fs.readFileSync(OUT, "utf8"));
}

const usedGlobally = new Set(
  Object.values(result).flatMap((arr) => arr.map((x) => x.thumb)),
);

for (const [city, queries] of Object.entries(CITIES)) {
  if (result[city]?.length >= 3) {
    console.log(city, "skip (done)");
    continue;
  }

  const fileCandidates = [];
  for (const q of queries) {
    if (fileCandidates.length >= 14) break;
    try {
      const files = await commonsSearch(q);
      for (const f of files) {
        if (!fileCandidates.includes(f)) fileCandidates.push(f);
      }
    } catch (e) {
      console.warn(city, q, e.message);
    }
  }

  let thumbs = {};
  try {
    thumbs = await getThumbsBatch(fileCandidates.slice(0, 20));
  } catch (e) {
    console.warn(city, "batch fail", e.message);
  }

  const found = result[city] || [];
  const have = new Set(found.map((x) => x.thumb));

  for (const [file, thumb] of Object.entries(thumbs)) {
    if (found.length >= 3) break;
    if (have.has(thumb) || usedGlobally.has(thumb)) continue;
    const wPath = thumbToWPath(thumb);
    if (!wPath) continue;
    found.push({ file, thumb, wPath });
    have.add(thumb);
    usedGlobally.add(thumb);
  }

  result[city] = found;
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(
    city,
    found.length,
    found.map((f) => f.file.slice(0, 36)).join(" | "),
  );
}

console.log("\nDone:", OUT);
