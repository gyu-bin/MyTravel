import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "gallery-data.json");
const data = JSON.parse(fs.readFileSync(OUT, "utf8"));

function entry(file, wPath) {
  const thumb = `https://upload.wikimedia.org/wikipedia/commons/thumb/${wPath}`;
  return { file, thumb, wPath };
}

data.영덕 = [
  entry(
    "Korea-Yeongdeok County-Mountain-01.jpg",
    "7/7e/Korea-Yeongdeok_County-Mountain-01.jpg/960px-Korea-Yeongdeok_County-Mountain-01.jpg",
  ),
  entry(
    "영덕 대게.jpg",
    "5/5b/%EC%98%81%EB%8D%95_%EB%8C%80%EA%B2%8C.jpg/960px-%EC%98%81%EB%8D%95_%EB%8C%80%EA%B2%8C.jpg",
  ),
  entry(
    "Korea-Samcheok-Beach-01.jpg",
    "5/56/Korea-Samcheok-Beach-01.jpg/960px-Korea-Samcheok-Beach-01.jpg",
  ),
];

data.순창 = [
  entry(
    "Seonunsa Temple, South Korea.jpg",
    "1/17/Seonunsa_Temple%2C_South_Korea.jpg/960px-Seonunsa_Temple%2C_South_Korea.jpg",
  ),
  entry(
    "Seonunsa Temple Guardian, South Korea.jpg",
    "e/e2/Seonunsa_Temple_Guardian%2C_South_Korea.jpg/960px-Seonunsa_Temple_Guardian%2C_South_Korea.jpg",
  ),
  entry(
    "The Artifact Site of Mrs. Seol and Shin Gyeong-jun.JPG",
    "a/a8/The_Artifact_Site_of_Mrs._Seol_and_Shin_Gyeong-jun.JPG/960px-The_Artifact_Site_of_Mrs._Seol_and_Shin_Gyeong-jun.JPG",
  ),
];

data.추자도 = [
  entry(
    "Jeju Olle Route 18-1.jpg",
    "e/e5/Jeju_Olle_Route_18-1.jpg/960px-Jeju_Olle_Route_18-1.jpg",
  ),
  entry(
    "Jejuolle route 18-2.jpg",
    "5/50/Jejuolle_route_18-2.jpg/960px-Jejuolle_route_18-2.jpg",
  ),
  entry(
    "Ulleung island from above.jpg",
    "6/6d/Ulleung_island_from_above.jpg/960px-Ulleung_island_from_above.jpg",
  ),
];

data.울진 = [
  entry(
    "Korea Route7 01 (16696038086).jpg",
    "e/e4/Korea_Route7_01_%2816696038086%29.jpg/960px-Korea_Route7_01_%2816696038086%29.jpg",
  ),
  entry(
    "Korea Route7 02 (16514656327).jpg",
    "d/d8/Korea_Route7_02_%2816514656327%29.jpg/960px-Korea_Route7_02_%2816514656327%29.jpg",
  ),
  entry(
    "Typhoon Saomai (2000) in Uljin (3).jpg",
    "f/fb/Typhoon_Saomai_%282000%29_in_Uljin_%283%29.jpg/960px-Typhoon_Saomai_%282000%29_in_Uljin_%283%29.jpg",
  ),
];

data.인제 = [
  entry(
    "Inje Univ. Station.jpg",
    "3/32/Inje_Univ._Station.jpg/960px-Inje_Univ._Station.jpg",
  ),
  entry(
    "Inje Speedium Racing Team.JPG",
    "b/b8/Inje_Speedium_Racing_Team.JPG/960px-Inje_Speedium_Racing_Team.JPG",
  ),
  entry(
    "Baek Inje House backyard.jpg",
    "1/17/Baek_Inje_House_backyard.jpg/960px-Baek_Inje_House_backyard.jpg",
  ),
];

fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
console.log("patched 영덕 순창 추자도 울진 인제");
