/**
 * Wikimedia에서 도시별 관광 풍경 사진 4장 수집 → scenic-gallery.json 생성
 * node scripts/rebuild-scenic-images.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "scenic-gallery.json");
const THUMB_PX = 1280;

const UA = "MyTravelGalleryBot/1.0 (scenic rebuild)";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** 수동 큐레이션 (군산·무주·인제 등) */
const MANUAL = {
  군산: [
    "0/0d/Korea_Seonyudo_Summer_20140805_18_%2814862141903%29.jpg/1280px-Korea_Seonyudo_Summer_20140805_18_%2814862141903%29.jpg",
    "1/1b/Korea_Seonyudo_Summer_20140805_10_%2814862140773%29.jpg/1280px-Korea_Seonyudo_Summer_20140805_10_%2814862140773%29.jpg",
    "3/38/Korea_Seonyudo_Summer_20140805_08_%2814841920672%29.jpg/1280px-Korea_Seonyudo_Summer_20140805_08_%2814841920672%29.jpg",
    "5/54/Seonyu_island.JPG/1280px-Seonyu_island.JPG",
  ],
  무주: [
    "a/a1/Deogyusan_from_Hyangjeok_Peak.jpg/1280px-Deogyusan_from_Hyangjeok_Peak.jpg",
    "6/67/Korea-Snow_in_Mt._Deogyu-Stairway-01.jpg/1280px-Korea-Snow_in_Mt._Deogyu-Stairway-01.jpg",
    "f/f2/MJGeopark-Pahoe.jpg/1280px-MJGeopark-Pahoe.jpg",
    "e/ea/MJGeopark-SushimdaeTuff.jpg/1280px-MJGeopark-SushimdaeTuff.jpg",
  ],
  인제: [
    "9/9d/Gangwon-do_gombaeryeong.jpg/1280px-Gangwon-do_gombaeryeong.jpg",
    "a/a1/Gombaeryeong.jpg/1280px-Gombaeryeong.jpg",
    "0/0b/20150629_At_the_Top_of_Misiryeong_Ridge.jpg/1280px-20150629_At_the_Top_of_Misiryeong_Ridge.jpg",
  ],
};

const KO_WIKI = {
  안동: "안동시",
  군산: "군산시",
  문경: "문경시",
  영덕: "영덕군",
  울진: "울진군",
  삼척: "삼척시",
  동해: "동해시",
  정선: "정선군",
  태백: "태백시",
  인제: "인제군",
  양양: "양양군",
  홍천: "홍천군",
  단양: "단양군",
  충주: "충주시",
  제천: "제천시",
  공주: "공주시",
  보령: "보령시",
  태안: "태안군",
  서산: "서산시",
  부안: "부안군",
  고창: "고창군",
  순창: "순창군",
  보성: "보성군",
  구례: "구례군",
  하동: "하동군",
  합천: "합천군",
  거제: "거제시",
  통영: "통영시",
  남해: "남해군",
  완도: "완도군",
  진도: "진도군",
  고흥: "고흥군",
  강진: "강진군",
  장흥: "장흥군",
  담양: "담양군",
  무주: "무주군",
  임실: "임실군",
  익산: "익산시",
  포천: "포천시",
  양평: "양평군",
  파주: "파주시",
  강화도: "강화군",
  울릉도: "울릉군",
  추자도: "추자도",
  섬진강: "구례군",
  순천만: "순천시",
};

const SCENIC_QUERIES = {
  안동: ["Hahoe Folk Village Korea", "Korea-Andong"],
  군산: ["Seonyudo Gunsan Korea", "Gunsan port Korea"],
  문경: ["Mungyeong Saejae Korea", "Korea-Mungyeong mountain"],
  영덕: ["Yeongdeok beach Korea", "Ganggu port Yeongdeok"],
  울진: ["Uljin coast Korea", "Korea-Uljin beach"],
  삼척: ["Samcheok beach cave Korea", "Korea-Samcheok"],
  동해: ["Samhwasa Donghae Korea", "Mureung valley Donghae"],
  정선: ["Jeongseon Auraji Korea", "Korea-Jeongseon mountain"],
  태백: ["Taebaek mountain Korea", "Korea-Taebaek"],
  인제: ["Inje Misiryeong Korea", "Baekdamsa Korea"],
  양양: ["Naksan Temple Yangyang", "Yangyang beach Korea"],
  홍천: ["Hongcheon river valley Korea", "Korea-Hongcheon"],
  단양: ["Dodamsambong Danyang Korea", "Korea-Danyang"],
  충주: ["Chungjuho Lake Korea", "Korea-Chungju"],
  제천: ["Cheongpung Lake Jecheon", "Korea-Jecheon"],
  공주: ["Gongsanseong Gongju Korea", "Korea-Gongju"],
  보령: ["Daecheon beach Boryeong", "Korea-Boryeong"],
  태안: ["Taean coast Anmyeon Korea", "Korea-Taean"],
  서산: ["Seosan sunset coast Korea", "Ganwolam Seosan"],
  부안: ["Naesosa Buan sunset Korea", "Korea-Buan"],
  고창: ["Gochang dolmen Korea", "Korea-Gochang"],
  순창: ["Seonunsa temple Soonchang", "Korea-Soonchang"],
  보성: ["Boseong green tea field Korea", "Korea-Boseong"],
  구례: ["Hwaeomsa Gurye Korea", "Jirisan Gurye"],
  하동: ["Hadong tea plantation Korea", "Ssanggyesa Hadong"],
  합천: ["Haeinsa temple Hapcheon", "Korea-Hapcheon"],
  거제: ["Geoje island coast Korea", "Korea-Geoje"],
  통영: ["Tongyeong harbor Korea", "Korea-Tongyeong"],
  남해: ["Namhae German village Korea", "Namhae bridge"],
  완도: ["Wando bridge Korea", "Korea-Wando"],
  진도: ["Jindo bridge Korea", "Korea-Jindo"],
  고흥: ["Goheung Narado beach Korea", "Korea-Goheung"],
  강진: ["Baengnyeonsa Gangjin", "Gauhdo Island Gangjin"],
  장흥: ["Borimsa Jangheung Korea", "Korea-Jangheung"],
  담양: ["Damyang bamboo forest Korea", "Korea-Damyang"],
  무주: ["Deogyusan Korea", "Muju mountain Korea"],
  임실: ["Imsil cheese village Korea", "Korea-Imsil"],
  익산: ["Mireuksa Iksan Korea", "Korea-Iksan"],
  포천: ["Pocheon Art Valley Korea", "Korea-Pocheon"],
  양평: ["Yangpyeong Han river Korea", "Korea-Yangpyeong"],
  파주: ["Imjingak Paju Korea", "Heyri Art Valley Paju"],
  강화도: ["Ganghwa dolmen Korea", "Ganghwa fortress"],
  울릉도: ["Ulleung island Korea", "Ulleungdo scenery"],
  추자도: ["Chujado island Korea", "Chujado"],
  섬진강: ["Seomjingang river Korea", "Korea-Gurye river"],
  순천만: ["Suncheon bay reed Korea", "Suncheon wetland"],
};

const BAD =
  /office|_Office|gun_office|cityhall|City_Hall|assembly|courthouse|montage|elementary|fried|chicken|octopus|pancake|Typhoon|ballot|election|post.?office|_Station|Univ\.|Speedium|tunnel|Tunnel|Expwy|Magpie|dog|puppy|bus\.|_Bus|Korail|KOCIS|panel|nest|grave|mud.?festival|Samsung|Hotel|Electric_Power|County_\d|county_\d|gun_County|Imsilgun|profile pic|paris france|Information System|Persicaria|jangdok|pottery|Doenjang/i;

const GOOD =
  /Korea-|Korea_|beach|mountain|lake|temple|island|bridge|sunset|panorama|valley|forest|scenery|coast|bay|waterfall|peak|village|bamboo|tea|reed|harbor|port|sea|river|folk|fortress|dolmen|wetland|field|snow|spring|aerial|view|landscape|National/i;

function scoreFile(name) {
  if (!/\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i.test(name)) return -99;
  if (BAD.test(name)) return -99;
  let s = 0;
  if (GOOD.test(name)) s += 4;
  if (/^Korea-/i.test(name)) s += 3;
  if (/Panorama|panorama|View_of|from_above|aerial/i.test(name)) s += 2;
  if (/Festival|Mud/i.test(name) && !/beach/i.test(name)) s -= 2;
  return s;
}

async function api(url, retries = 6) {
  for (let i = 0; i < retries; i += 1) {
    await delay(2200 + i * 1200);
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    const text = await r.text();
    if (text.startsWith("You are making") || r.status === 429) {
      console.warn("rate limit, retry", i + 1);
      continue;
    }
    try {
      return JSON.parse(text);
    } catch {
      console.warn("bad json", text.slice(0, 80));
    }
  }
  throw new Error("API failed");
}

async function commonsSearch(q) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=15&format=json`;
  const j = await api(u);
  return (j.query?.search || []).map((s) => s.title.replace(/^File:/, ""));
}

async function wikiPageImage(koTitle) {
  const u = `https://ko.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(koTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=${THUMB_PX}&format=json`;
  const j = await api(u);
  const page = Object.values(j.query?.pages || {})[0];
  const src = page?.thumbnail?.source;
  if (!src?.includes("/thumb/")) return null;
  const m = src.match(/\/thumb\/(.+)$/);
  return m ? m[1].replace(`${THUMB_PX}px-`, `${THUMB_PX}px-`) : null;
}

async function resolveFiles(filenames) {
  if (!filenames.length) return {};
  const titles = filenames.map((f) => "File:" + f).join("|");
  const u = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|size&iiurlwidth=${THUMB_PX}&format=json`;
  const j = await api(u);
  const out = {};
  for (const p of Object.values(j.query?.pages || {})) {
    if (!p.title || !p.imageinfo?.[0]) continue;
    const name = p.title.replace(/^File:/, "");
    const info = p.imageinfo[0];
    const thumb = info.thumburl || "";
    const m = thumb.match(/\/thumb\/(.+)$/);
    if (!m) continue;
    let wPath = m[1];
    if (!wPath.includes(`${THUMB_PX}px-`)) {
      wPath = wPath.replace(/\d+px-/, `${THUMB_PX}px-`);
    }
    out[name] = {
      wPath,
      width: info.width || 0,
      height: info.height || 0,
      score: scoreFile(name),
    };
  }
  return out;
}

function pathsToEntries(wPaths) {
  return wPaths.map((wPath) => ({
    file: wPath.split("/").pop()?.replace(/^\d+px-/, "") || wPath,
    wPath,
    thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${wPath}`,
  }));
}

const CITY_ORDER = Object.keys(SCENIC_QUERIES);
const result = {};

for (const city of CITY_ORDER) {
  if (MANUAL[city]) {
    result[city] = pathsToEntries(MANUAL[city].slice(0, 4));
    console.log(city, "manual", result[city].length);
    continue;
  }

  const candidates = new Set();
  const ko = KO_WIKI[city];
  if (ko) {
    try {
      const wp = await wikiPageImage(ko);
      if (wp) {
        const fn = decodeURIComponent(wp.split("/").pop().replace(/^\d+px-/, ""));
        candidates.add(fn);
      }
    } catch (e) {
      console.warn(city, "wiki", e.message);
    }
  }

  for (const q of SCENIC_QUERIES[city] || []) {
    try {
      for (const f of await commonsSearch(q)) {
        if (scoreFile(f) >= 0) candidates.add(f);
      }
    } catch (e) {
      console.warn(city, q, e.message);
    }
    if (candidates.size >= 24) break;
  }

  const scored = [];
  const files = [...candidates].sort(
    (a, b) => scoreFile(b) - scoreFile(a),
  );
  for (let i = 0; i < files.length; i += 8) {
    const batch = files.slice(i, i + 8);
    try {
      const resolved = await resolveFiles(batch);
      for (const [name, meta] of Object.entries(resolved)) {
        if (meta.score < 1) continue;
        if (meta.width < 900) continue;
        scored.push({ name, ...meta });
      }
    } catch (e) {
      console.warn(city, "resolve", e.message);
    }
    if (scored.length >= 8) break;
  }

  scored.sort((a, b) => b.score - a.score || b.width - a.width);
  const seen = new Set();
  const picked = [];
  for (const item of scored) {
    if (seen.has(item.wPath)) continue;
    seen.add(item.wPath);
    picked.push(item);
    if (picked.length >= 4) break;
  }

  result[city] = pathsToEntries(picked.map((p) => p.wPath));
  console.log(
    city,
    result[city].length,
    result[city].map((x) => x.file.slice(0, 42)).join(" | ") || "(empty)",
  );
  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
}

console.log("\nWrote", OUT);
