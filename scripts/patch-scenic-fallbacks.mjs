/**
 * scenic-gallery.json 빈 도시·잘못된 사진 보정 (1280px)
 * node scripts/patch-scenic-fallbacks.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENIC = path.join(__dirname, "scenic-gallery.json");
const LEGACY = path.join(__dirname, "gallery-data.json");

const PX = 1280;

function upscale(wPath) {
  if (!wPath) return null;
  return wPath.replace(/\/\d+px-/, `/${PX}px-`);
}

function fromLegacy(city, pick = (items) => items) {
  const items = JSON.parse(fs.readFileSync(LEGACY, "utf8"))[city] || [];
  return pick(items)
    .map((i) => upscale(i.wPath))
    .filter(Boolean)
    .map((wPath) => ({
      file: decodeURIComponent(wPath.split("/").pop().replace(/^\d+px-/, "")),
      wPath,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${wPath}`,
    }));
}

const data = JSON.parse(fs.readFileSync(SCENIC, "utf8"));

/** 빈 도시 — gallery-data에서 관광 사진만 선별 */
const EMPTY_FIX = {
  문경: () => {
    const gate = {
      file: "Saejae_third_gate_backside.jpg",
      wPath: `d/d2/Saejae_third_gate_backside.jpg/${PX}px-Saejae_third_gate_backside.jpg`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Saejae_third_gate_backside.jpg/${PX}px-Saejae_third_gate_backside.jpg`,
    };
    return [
      gate,
      ...fromLegacy("문경", (a) => a.filter((x) => !/grave/i.test(x.file))),
    ];
  },
  영덕: () => fromLegacy("영덕"),
  울진: () =>
    fromLegacy("울진", (a) => a.filter((x) => !/Typhoon/i.test(x.file))),
  동해: () =>
    [
      {
        file: "Samhwasa_and_murung_velley.jpg",
        wPath: `5/59/Samhwasa_and_murung_velley.jpg/${PX}px-Samhwasa_and_murung_velley.jpg`,
        thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Samhwasa_and_murung_velley.jpg/${PX}px-Samhwasa_and_murung_velley.jpg`,
      },
      ...fromLegacy("동해", (a) =>
        a.filter((x) => /Samhwasa/i.test(x.file)),
      ),
    ],
  정선: () => [
    {
      file: "Korea_Jeongseon_Traditional_Market_Train_26.jpg",
      wPath: `7/76/Korea_Jeongseon_Traditional_Market_Train_26_%2814202094128%29.jpg/${PX}px-Korea_Jeongseon_Traditional_Market_Train_26_%2814202094128%29.jpg`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Korea_Jeongseon_Traditional_Market_Train_26_%2814202094128%29.jpg/${PX}px-Korea_Jeongseon_Traditional_Market_Train_26_%2814202094128%29.jpg`,
    },
    ...fromLegacy("정선", (a) =>
      a.filter((x) => !/octopus|pancake/i.test(x.file)),
    ),
  ],
  단양: () => fromLegacy("단양"),
  태안: () => fromLegacy("태안"),
  서산: () =>
    fromLegacy("서산", (a) =>
      a.filter((x) => !/montage|nest/i.test(x.file)),
    ),
  순창: () =>
    fromLegacy("순창", (a) =>
      a.filter((x) => !/Artifact/i.test(x.file)),
    ),
  구례: () => fromLegacy("구례"),
  하동: () =>
    fromLegacy("하동", (a) =>
      a.filter(
        (x) =>
          !/Electric|Station/i.test(x.file) &&
          /Hadong|tea|Ssanggye|Hwagae/i.test(x.file),
      ),
    ).length
      ? fromLegacy("하동", (a) =>
          a.filter((x) => !/Electric|Station/i.test(x.file)),
        )
      : fromLegacy("하동", (a) => a.slice(0, 1)),
  강진: () =>
    [
      "3/3b/KORAIL_Gangjin_Gun_33_%2817095832698%29.jpg",
      "2/29/KORAIL_Gangjin_Gun_59_%2817096046600%29.jpg",
      "a/ab/KORAIL_Gangjin_Gun_25_%2816661149474%29.jpg",
    ].map((base) => {
      const file = decodeURIComponent(base.split("/").pop());
      const wPath = `${base}/${PX}px-${file}`;
      return {
        file,
        wPath,
        thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${wPath}`,
      };
    }),
  임실: () => [
    {
      file: "Imsil_Hyanggyo.jpg",
      wPath: `b/b0/Imsil_Hyanggyo.jpg/${PX}px-Imsil_Hyanggyo.jpg`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Imsil_Hyanggyo.jpg/${PX}px-Imsil_Hyanggyo.jpg`,
    },
  ],
};

/** 잘못 수집된 도시 전면 교체 */
const REPLACE = {
  태백: () => [
    {
      file: "Taebaeksan_main_peaks_from_Munsubong.jpg",
      wPath: `4/4b/Taebaeksan_main_peaks_from_Munsubong.jpg/${PX}px-Taebaeksan_main_peaks_from_Munsubong.jpg`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Taebaeksan_main_peaks_from_Munsubong.jpg/${PX}px-Taebaeksan_main_peaks_from_Munsubong.jpg`,
    },
    ...fromLegacy("태백", (a) =>
      a.filter((x) => /Taebaek|Mountain|Festival/i.test(x.file)),
    ),
  ],
  홍천: () => [
    {
      file: "Hongcheon_IMG_2530.JPG",
      wPath: `f/f9/Hongcheon_IMG_2530.JPG/${PX}px-Hongcheon_IMG_2530.JPG`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hongcheon_IMG_2530.JPG/${PX}px-Hongcheon_IMG_2530.JPG`,
    },
  ],
  충주: () =>
    fromLegacy("충주", (a) =>
      a.filter((x) => !/Jecheon|City_Hall/i.test(x.file)),
    ),
  제천: () => fromLegacy("제천"),
  익산: () => [
    {
      file: "Mireuksa,_Iksan_2015.jpg",
      wPath: `7/71/Mireuksa%2C_Iksan_2015.jpg/${PX}px-Mireuksa%2C_Iksan_2015.jpg`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Mireuksa%2C_Iksan_2015.jpg/${PX}px-Mireuksa%2C_Iksan_2015.jpg`,
    },
  ],
  추자도: () => fromLegacy("추자도"),
  강화도: () => fromLegacy("강화도"),
  울릉도: () => fromLegacy("울릉도"),
  섬진강: () => [
    {
      file: "Seomjingang_MS3672.JPG",
      wPath: `1/16/Seomjingang_MS3672.JPG/${PX}px-Seomjingang_MS3672.JPG`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Seomjingang_MS3672.JPG/${PX}px-Seomjingang_MS3672.JPG`,
    },
  ],
  안동: () => [
    {
      file: "Hahoe aerial.jpg",
      wPath: `1/1f/A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg/${PX}px-A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg`,
      thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg/${PX}px-A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg`,
    },
    ...(data.안동 || []).filter((x) => /Hahoe|Folk/i.test(x.file)),
  ],
};

for (const [city, fn] of Object.entries(EMPTY_FIX)) {
  const items = fn().slice(0, 4);
  if (items.length) data[city] = items;
}

for (const [city, fn] of Object.entries(REPLACE)) {
  const items = fn().slice(0, 4);
  if (items.length) data[city] = items;
}

// 삼척·진도·고흥 보강
if ((data.삼척?.length || 0) < 3) {
  data.삼척 = [
    ...data.삼척,
    ...fromLegacy("삼척", (a) =>
      a.filter((x) => /Beach|scenery|Neowajip/i.test(x.file)),
    ),
  ].slice(0, 4);
}
if ((data.진도?.length || 0) < 3) {
  data.진도 = fromLegacy("진도").slice(0, 4);
}
if ((data.고흥?.length || 0) < 3) {
  data.고흥 = fromLegacy("고흥", (a) =>
    a.filter((x) => !/Bus|Office/i.test(x.file)),
  ).slice(0, 4);
}

fs.writeFileSync(SCENIC, JSON.stringify(data, null, 2));
console.log("Patched scenic-gallery.json");
