/**
 * 여행지별 사진 — 위키백과·위키미디어(한국 관광 풍경) 썸네일 1280px
 * 출처: Wikimedia Commons (CC, 파일별 라이선스 참조)
 * 갱신: node scripts/rebuild-scenic-images.mjs && node scripts/patch-scenic-fallbacks.mjs && node scripts/apply-scenic-gallery.mjs
 */

const W = (path) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}`;

const IMAGES = {
  안동: W("1/1f/A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg/1280px-A_bird%27s_eye_view_of_the_Hahoe_Folk_Village_%284458648859%29.jpg"),
  군산: W("0/0d/Korea_Seonyudo_Summer_20140805_18_%2814862141903%29.jpg/1280px-Korea_Seonyudo_Summer_20140805_18_%2814862141903%29.jpg"),
  문경: W("d/d2/Saejae_third_gate_backside.jpg/1280px-Saejae_third_gate_backside.jpg"),
  영덕: W("7/7e/Korea-Yeongdeok_County-Mountain-01.jpg/1280px-Korea-Yeongdeok_County-Mountain-01.jpg"),
  울진: W("e/e4/Korea_Route7_01_%2816696038086%29.jpg/1280px-Korea_Route7_01_%2816696038086%29.jpg"),
  삼척: W("6/6b/Korea-Samcheok-Rural_scenery_in_spring-01.jpg/1280px-Korea-Samcheok-Rural_scenery_in_spring-01.jpg"),
  동해: W("5/59/Samhwasa_and_murung_velley.jpg/1280px-Samhwasa_and_murung_velley.jpg"),
  정선: W("7/76/Korea_Jeongseon_Traditional_Market_Train_26_%2814202094128%29.jpg/1280px-Korea_Jeongseon_Traditional_Market_Train_26_%2814202094128%29.jpg"),
  태백: W("4/4b/Taebaeksan_main_peaks_from_Munsubong.jpg/1280px-Taebaeksan_main_peaks_from_Munsubong.jpg"),
  인제: W("9/9d/Gangwon-do_gombaeryeong.jpg/1280px-Gangwon-do_gombaeryeong.jpg"),
  양양: W("5/5c/Gangwon_coast.JPG/1280px-Gangwon_coast.JPG"),
  홍천: W("f/f9/Hongcheon_IMG_2530.JPG/1280px-Hongcheon_IMG_2530.JPG"),
  단양: W("f/ff/Korea-Danyang-Dodamsambong_3087-07.JPG/1280px-Korea-Danyang-Dodamsambong_3087-07.JPG"),
  충주: W("5/5a/Korea-Chungju-Mountain-01.jpg/1280px-Korea-Chungju-Mountain-01.jpg"),
  제천: W("1/1d/Korea-Jecheon-Cheongpung_Cultural_Properties_Center_Dohwa-ri_House_3245-07.JPG/1280px-Korea-Jecheon-Cheongpung_Cultural_Properties_Center_Dohwa-ri_House_3245-07.JPG"),
  공주: W("6/6b/Korea-Gongju-Gongsanseong-01.jpg/1280px-Korea-Gongju-Gongsanseong-01.jpg"),
  보령: W("b/b8/Korea-Boreyong-Daecheon_Beach-09.jpg/1280px-Korea-Boreyong-Daecheon_Beach-09.jpg"),
  태안: W("4/44/Standing_Buddha_Triad_Carved_on_the_Rock_in_Donmun-ri%2C_Taean_03.JPG/1280px-Standing_Buddha_Triad_Carved_on_the_Rock_in_Donmun-ri%2C_Taean_03.JPG"),
  서산: W("0/01/%EC%84%9C%EC%82%B0%EC%8B%9C_%EC%A0%84%EA%B2%BD.jpg/1280px-%EC%84%9C%EC%82%B0%EC%8B%9C_%EC%A0%84%EA%B2%BD.jpg"),
  부안: W("e/e5/Korea-Buan_County-Sunset_from_Naesosa-01.jpg/1280px-Korea-Buan_County-Sunset_from_Naesosa-01.jpg"),
  고창: W("8/84/Korea-Hwasun_Dolmen_sites02.jpg/1280px-Korea-Hwasun_Dolmen_sites02.jpg"),
  순창: W("1/17/Seonunsa_Temple%2C_South_Korea.jpg/1280px-Seonunsa_Temple%2C_South_Korea.jpg"),
  보성: W("b/b7/Korea-Boseong-Green.tea-04.jpg/1280px-Korea-Boseong-Green.tea-04.jpg"),
  구례: W("d/d2/Korea-Gurye-Hwaeomsa_4982-06.JPG/1280px-Korea-Gurye-Hwaeomsa_4982-06.JPG"),
  하동: W("f/f7/Korea-Hadong-Hwagae.jangteo-Market-01.jpg/1280px-Korea-Hadong-Hwagae.jangteo-Market-01.jpg"),
  합천: W("9/92/Haeinsa_Temple_11.jpg/1280px-Haeinsa_Temple_11.jpg"),
  거제: W("1/12/Korea-Geoje-Gohyeon_Castle-02.jpg/1280px-Korea-Geoje-Gohyeon_Castle-02.jpg"),
  통영: W("d/d9/Korea-Tongyeong-Cityscape-01.jpg/1280px-Korea-Tongyeong-Cityscape-01.jpg"),
  남해: W("9/95/Korea-Namhae-German_Village-Bossam-01.jpg/1280px-Korea-Namhae-German_Village-Bossam-01.jpg"),
  완도: W("1/1e/Sinji_Bridge.JPG/1280px-Sinji_Bridge.JPG"),
  진도: W("8/8d/Jindo_Bridge.jpg/1280px-Jindo_Bridge.jpg"),
  고흥: W("9/91/Korea_-_Goheung-gun_-_Narado_Beach_panorama.jpg/1280px-Korea_-_Goheung-gun_-_Narado_Beach_panorama.jpg"),
  강진: W("3/3b/KORAIL_Gangjin_Gun_33_%2817095832698%29.jpg/1280px-KORAIL_Gangjin_Gun_33_%2817095832698%29.jpg"),
  장흥: W("5/51/Korea-Jangheung-Jeungsanji-01.jpg/1280px-Korea-Jangheung-Jeungsanji-01.jpg"),
  담양: W("7/7d/Korea-Damyang-Yeongsan_River_at_Sunset-01.jpg/1280px-Korea-Damyang-Yeongsan_River_at_Sunset-01.jpg"),
  무주: W("a/a1/Deogyusan_from_Hyangjeok_Peak.jpg/1280px-Deogyusan_from_Hyangjeok_Peak.jpg"),
  임실: W("b/b0/Imsil_Hyanggyo.jpg/1280px-Imsil_Hyanggyo.jpg"),
  익산: W("7/71/Mireuksa%2C_Iksan_2015.jpg/1280px-Mireuksa%2C_Iksan_2015.jpg"),
  포천: W("4/46/Korea-Pocheon-Herb_Island-Sunflower_an_others-01.jpg/1280px-Korea-Pocheon-Herb_Island-Sunflower_an_others-01.jpg"),
  양평: W("4/42/Jungang_Line_Yangsu_Bridge_and_Old_Jungang_Line_Bukhan_River_Bridge.JPG/1280px-Jungang_Line_Yangsu_Bridge_and_Old_Jungang_Line_Bukhan_River_Bridge.JPG"),
  파주: W("6/67/Heyri_Artvalley_12_%2831970591991%29.jpg/1280px-Heyri_Artvalley_12_%2831970591991%29.jpg"),
  강화도: W("8/89/Jonghae-ru%2C_the_gate_of_Jeongjogsanseong_at_Ganghwa-do.jpg/1280px-Jonghae-ru%2C_the_gate_of_Jeongjogsanseong_at_Ganghwa-do.jpg"),
  울릉도: W("8/8c/Ulleung-30km.jpg/1280px-Ulleung-30km.jpg"),
  추자도: W("e/e5/Jeju_Olle_Route_18-1.jpg/1280px-Jeju_Olle_Route_18-1.jpg"),
  섬진강: W("1/16/Seomjingang_MS3672.JPG/1280px-Seomjingang_MS3672.JPG"),
  순천만: W("6/68/Panorama_of_Reed_fields_in_Suncheon_bay.jpg/1280px-Panorama_of_Reed_fields_in_Suncheon_bay.jpg"),
};

const GALLERY_EXTRA = {
  안동: [
    W("5/56/Korea-Andong-Hahoe_Folk_Village-22.jpg/1280px-Korea-Andong-Hahoe_Folk_Village-22.jpg"),
    W("5/5d/Hahoe_Folk_Village_05.jpg/1280px-Hahoe_Folk_Village_05.jpg"),
  ],
  군산: [
    W("1/1b/Korea_Seonyudo_Summer_20140805_10_%2814862140773%29.jpg/1280px-Korea_Seonyudo_Summer_20140805_10_%2814862140773%29.jpg"),
    W("3/38/Korea_Seonyudo_Summer_20140805_08_%2814841920672%29.jpg/1280px-Korea_Seonyudo_Summer_20140805_08_%2814841920672%29.jpg"),
    W("5/54/Seonyu_island.JPG/1280px-Seonyu_island.JPG"),
  ],
  문경: [
    W("3/38/Mungyeong_birches_2.jpg/1280px-Mungyeong_birches_2.jpg"),
    W("4/45/Saejae_Bubong.jpg/1280px-Saejae_Bubong.jpg"),
  ],
  영덕: [
    W("5/5b/%EC%98%81%EB%8D%95_%EB%8C%80%EA%B2%8C.jpg/1280px-%EC%98%81%EB%8D%95_%EB%8C%80%EA%B2%8C.jpg"),
    W("5/56/Korea-Samcheok-Beach-01.jpg/1280px-Korea-Samcheok-Beach-01.jpg"),
  ],
  울진: [
    W("d/d8/Korea_Route7_02_%2816514656327%29.jpg/1280px-Korea_Route7_02_%2816514656327%29.jpg"),
  ],
  삼척: [
    W("5/56/Korea-Samcheok-Beach-01.jpg/1280px-Korea-Samcheok-Beach-01.jpg"),
    W("6/6b/Korea-Samcheok-Rural_scenery_in_spring-01.jpg/1280px-Korea-Samcheok-Rural_scenery_in_spring-01.jpg"),
  ],
  동해: [
    W("6/60/Samhwasa_%282%29.jpg/1280px-Samhwasa_%282%29.jpg"),
  ],
  태백: [
    W("1/18/Korail_Taebaek_Triangle_Line2.jpg/1280px-Korail_Taebaek_Triangle_Line2.jpg"),
    W("f/fe/Town_at_the_Foot_of_the_Mountain.jpg/1280px-Town_at_the_Foot_of_the_Mountain.jpg"),
    W("5/5e/Taebaek_Winter_Festival.jpg/1280px-Taebaek_Winter_Festival.jpg"),
  ],
  인제: [
    W("a/a1/Gombaeryeong.jpg/1280px-Gombaeryeong.jpg"),
    W("0/0b/20150629_At_the_Top_of_Misiryeong_Ridge.jpg/1280px-20150629_At_the_Top_of_Misiryeong_Ridge.jpg"),
  ],
  양양: [
    W("1/17/Naksan_temple%2C_%EB%82%99%EC%82%B0%EC%82%AC%2C_Gangwon-do_temple.jpg/1280px-Naksan_temple%2C_%EB%82%99%EC%82%B0%EC%82%AC%2C_Gangwon-do_temple.jpg"),
    W("0/04/Naksansa%2C_naksan_temple_uisangdae%2C_%EB%82%99%EC%82%B0%EC%82%AC_%EC%9D%98%EC%83%81%EB%8C%80.jpg/1280px-Naksansa%2C_naksan_temple_uisangdae%2C_%EB%82%99%EC%82%B0%EC%82%AC_%EC%9D%98%EC%83%81%EB%8C%80.jpg"),
    W("6/69/%EB%82%99%EC%82%B0%EC%82%AC_naksan_temple.jpg/1280px-%EB%82%99%EC%82%B0%EC%82%AC_naksan_temple.jpg"),
  ],
  단양: [
    W("f/fb/Korea-Danyang_Falls_3065-07.JPG/1280px-Korea-Danyang_Falls_3065-07.JPG"),
    W("b/b2/Korea-Danyang_Bridge_3067-07.JPG/1280px-Korea-Danyang_Bridge_3067-07.JPG"),
    W("1/17/Korea-Danyang_Bridge_3071-07.JPG/1280px-Korea-Danyang_Bridge_3071-07.JPG"),
  ],
  충주: [
    W("9/93/Chungjuho_Lake_and_Woraksan.jpg/1280px-Chungjuho_Lake_and_Woraksan.jpg"),
    W("1/10/Korea-Chungju-Road-01.jpg/1280px-Korea-Chungju-Road-01.jpg"),
  ],
  제천: [
    W("3/37/Korea-Jecheon-Cheongpung_Cultural_Properties_Center_3250-07.JPG/1280px-Korea-Jecheon-Cheongpung_Cultural_Properties_Center_3250-07.JPG"),
    W("d/d7/Korea-Jecheon-Cheongpung_Cultural_Properties_Center_3252-07.JPG/1280px-Korea-Jecheon-Cheongpung_Cultural_Properties_Center_3252-07.JPG"),
  ],
  공주: [
    W("e/e9/Korea-Gongju-Gongsanseong-03.jpg/1280px-Korea-Gongju-Gongsanseong-03.jpg"),
    W("5/5e/Korea-Gongju-Gongsanseong-04.jpg/1280px-Korea-Gongju-Gongsanseong-04.jpg"),
    W("1/1e/View_of_Gongju_02.jpg/1280px-View_of_Gongju_02.jpg"),
  ],
  보령: [
    W("6/60/Korea-Boreyong-Daecheon_Beach-01.jpg/1280px-Korea-Boreyong-Daecheon_Beach-01.jpg"),
    W("f/fd/Korea-Boreyong-Daecheon_Beach-02.jpg/1280px-Korea-Boreyong-Daecheon_Beach-02.jpg"),
    W("6/6a/Korea-Boreyong-Daecheon_Beach-03.jpg/1280px-Korea-Boreyong-Daecheon_Beach-03.jpg"),
  ],
  태안: [
    W("7/7c/Standing_Buddha_Triad_Carved_on_the_Rock_in_Donmun-ri%2C_Taean_06.JPG/1280px-Standing_Buddha_Triad_Carved_on_the_Rock_in_Donmun-ri%2C_Taean_06.JPG"),
    W("c/c0/Standing_Rock-carved_Buddha_Triad_at_Donmun-ri_in_Taean%2C_Korea.jpg/1280px-Standing_Rock-carved_Buddha_Triad_at_Donmun-ri_in_Taean%2C_Korea.jpg"),
  ],
  부안: [
    W("7/75/Korea-Buan_County-Naesosa-Cheonwangmun-02.jpg/1280px-Korea-Buan_County-Naesosa-Cheonwangmun-02.jpg"),
    W("6/68/Korea-Buan_County-Naesosa-Cheonwangmun-03.jpg/1280px-Korea-Buan_County-Naesosa-Cheonwangmun-03.jpg"),
    W("5/5c/Korea-Buan_County-Naesosa-Zelkova-02.jpg/1280px-Korea-Buan_County-Naesosa-Zelkova-02.jpg"),
  ],
  고창: [
    W("4/44/Gochang_Dolmens_Skyline%2C_South_Korea.jpg/1280px-Gochang_Dolmens_Skyline%2C_South_Korea.jpg"),
    W("a/a2/Gochang_Dolmens%2C_South_Korea.jpg/1280px-Gochang_Dolmens%2C_South_Korea.jpg"),
    W("4/47/Gochang_Dolmen_Sites_-_1.JPG/1280px-Gochang_Dolmen_Sites_-_1.JPG"),
  ],
  순창: [
    W("e/e2/Seonunsa_Temple_Guardian%2C_South_Korea.jpg/1280px-Seonunsa_Temple_Guardian%2C_South_Korea.jpg"),
  ],
  보성: [
    W("2/2a/Korea-Boseong-Green.tea-05.jpg/1280px-Korea-Boseong-Green.tea-05.jpg"),
    W("3/37/Korea-Boseong-Green.tea-06.jpg/1280px-Korea-Boseong-Green.tea-06.jpg"),
    W("2/25/Korea-Boseong-Green.tea-08.jpg/1280px-Korea-Boseong-Green.tea-08.jpg"),
  ],
  구례: [
    W("9/90/Korea-Gurye-Hwaeomsa_5017-06.JPG/1280px-Korea-Gurye-Hwaeomsa_5017-06.JPG"),
    W("3/3d/Korea-Gurye-Hwaeomsa_5025-06.JPG/1280px-Korea-Gurye-Hwaeomsa_5025-06.JPG"),
  ],
  합천: [
    W("1/1c/Haeinsa_Temple_04.jpg/1280px-Haeinsa_Temple_04.jpg"),
    W("0/06/Haeinsa_Temple_12.jpg/1280px-Haeinsa_Temple_12.jpg"),
    W("a/a8/Haeinsa_Temple_03.jpg/1280px-Haeinsa_Temple_03.jpg"),
  ],
  거제: [
    W("f/f2/Korea-Geoje-Gohyeon_Castle-01.jpg/1280px-Korea-Geoje-Gohyeon_Castle-01.jpg"),
    W("8/8f/First_Busan%E2%80%93Geoje_Bridge3.jpg/1280px-First_Busan%E2%80%93Geoje_Bridge3.jpg"),
    W("5/57/Geoje_Island%2C_South_Korea_%281%29.jpg/1280px-Geoje_Island%2C_South_Korea_%281%29.jpg"),
  ],
  통영: [
    W("0/0b/Korea-Tongyeong-Cityscape-06.jpg/1280px-Korea-Tongyeong-Cityscape-06.jpg"),
    W("9/9a/Korea-Tongyeong-Cityscape-07.jpg/1280px-Korea-Tongyeong-Cityscape-07.jpg"),
    W("5/51/Korea-Tongyeong-Port_and_ships-02.jpg/1280px-Korea-Tongyeong-Port_and_ships-02.jpg"),
  ],
  남해: [
    W("3/32/Noryang_Bridge_and_Namhae_Bridge_aerial.jpg/1280px-Noryang_Bridge_and_Namhae_Bridge_aerial.jpg"),
    W("9/9c/German_Village_in_Namhae%2C_South_Korea_on_August_31st%2C_2019.jpg/1280px-German_Village_in_Namhae%2C_South_Korea_on_August_31st%2C_2019.jpg"),
    W("8/87/View_of_German_Village_in_Namhae%2C_South_Korea.jpg/1280px-View_of_German_Village_in_Namhae%2C_South_Korea.jpg"),
  ],
  완도: [
    W("6/68/Cheonghae_Bridge.JPG/1280px-Cheonghae_Bridge.JPG"),
    W("e/e1/Wando_Bridge.JPG/1280px-Wando_Bridge.JPG"),
    W("6/65/Wando_Wondong_port.JPG/1280px-Wando_Wondong_port.JPG"),
  ],
  진도: [
    W("f/f6/Jindo_Bridge-2.jpg/1280px-Jindo_Bridge-2.jpg"),
    W("8/8f/Jindo_024.JPG/1280px-Jindo_024.JPG"),
  ],
  강진: [
    W("2/29/KORAIL_Gangjin_Gun_59_%2817096046600%29.jpg/1280px-KORAIL_Gangjin_Gun_59_%2817096046600%29.jpg"),
    W("a/ab/KORAIL_Gangjin_Gun_25_%2816661149474%29.jpg/1280px-KORAIL_Gangjin_Gun_25_%2816661149474%29.jpg"),
  ],
  장흥: [
    W("e/e2/Korea-Jangheung-Jeungsanji-01_%28cropped%29.jpg/1280px-Korea-Jangheung-Jeungsanji-01_%28cropped%29.jpg"),
    W("0/01/Stele_of_master_Bojo_at_Borimsa_temple_in_Jangheung%2C_Korea.jpg/1280px-Stele_of_master_Bojo_at_Borimsa_temple_in_Jangheung%2C_Korea.jpg"),
    W("c/c9/Stupa_for_master_Bojo_at_Borimsa_temple_in_Jangheung%2C_Korea.jpg/1280px-Stupa_for_master_Bojo_at_Borimsa_temple_in_Jangheung%2C_Korea.jpg"),
  ],
  담양: [
    W("5/52/Korea-Damyang-Bamboo_Forest_near_Soswaewon-01.jpg/1280px-Korea-Damyang-Bamboo_Forest_near_Soswaewon-01.jpg"),
    W("2/21/Korea-Damyang-Bamboo_Forest_near_Soswaewon-02.jpg/1280px-Korea-Damyang-Bamboo_Forest_near_Soswaewon-02.jpg"),
    W("0/03/Korea-Damyang-Bamboo_Forest_near_Soswaewon-03.jpg/1280px-Korea-Damyang-Bamboo_Forest_near_Soswaewon-03.jpg"),
  ],
  무주: [
    W("6/67/Korea-Snow_in_Mt._Deogyu-Stairway-01.jpg/1280px-Korea-Snow_in_Mt._Deogyu-Stairway-01.jpg"),
    W("f/f2/MJGeopark-Pahoe.jpg/1280px-MJGeopark-Pahoe.jpg"),
    W("e/ea/MJGeopark-SushimdaeTuff.jpg/1280px-MJGeopark-SushimdaeTuff.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/%EB%8D%95%EC%9C%A0%EC%82%B0_%28Deogyusan%29_snow_trees.jpg",
  ],
  임실: [
    "https://upload.wikimedia.org/wikipedia/commons/b/b0/Imsil_Hyanggyo.jpg",
  ],
  포천: [
    W("c/c9/ArtValleyInKorea_1.jpg/1280px-ArtValleyInKorea_1.jpg"),
    W("2/2c/ArtValleyInKorea.jpg/1280px-ArtValleyInKorea.jpg"),
    W("6/6a/Art_Valley_In_Korea_%2865750913%29.jpeg/1280px-Art_Valley_In_Korea_%2865750913%29.jpeg"),
  ],
  양평: [
    W("2/2b/Jungang_Line_Yangsu_Bridge_and_Old_Jungang_Line_Bukhan_River_Bridge_01.JPG/1280px-Jungang_Line_Yangsu_Bridge_and_Old_Jungang_Line_Bukhan_River_Bridge_01.JPG"),
    W("1/1e/Jungang_Line_Yangsu_Bridge_and_Old_Jungang_Line_Bukhan_River_Bridge_02.JPG/1280px-Jungang_Line_Yangsu_Bridge_and_Old_Jungang_Line_Bukhan_River_Bridge_02.JPG"),
    W("3/35/Namhan_River_01.jpg/1280px-Namhan_River_01.jpg"),
  ],
  파주: [
    W("a/a8/Heyri_Artvalley_01_%2831713169650%29.jpg/1280px-Heyri_Artvalley_01_%2831713169650%29.jpg"),
    W("9/9f/Heyri_Artvalley_11_%2831247307714%29.jpg/1280px-Heyri_Artvalley_11_%2831247307714%29.jpg"),
    W("0/09/Heyri_Artvalley_08_%2832049448496%29.jpg/1280px-Heyri_Artvalley_08_%2832049448496%29.jpg"),
  ],
  강화도: [
    W("a/aa/Dolmen_at_Ganghwa_Island.jpg/1280px-Dolmen_at_Ganghwa_Island.jpg"),
    W("0/07/An_Alley_in_Ganghwa_Island.jpg/1280px-An_Alley_in_Ganghwa_Island.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/0/07/Ganghwa1.jpg",
  ],
  울릉도: [
    W("9/91/KOCIS_Port_Taeha%2C_Ulleungdo_%284925990346%29.jpg/1280px-KOCIS_Port_Taeha%2C_Ulleungdo_%284925990346%29.jpg"),
    W("b/b8/KOCIS_Ulleungdo%2C_or_Ulleung_Island_%284925987614%29.jpg/1280px-KOCIS_Ulleungdo%2C_or_Ulleung_Island_%284925987614%29.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Ulleung_island_from_above.jpg",
  ],
  추자도: [
    W("5/50/Jejuolle_route_18-2.jpg/1280px-Jejuolle_route_18-2.jpg"),
  ],
  순천만: [
    W("6/61/20181231_Suncheon_Bay_003.jpg/1280px-20181231_Suncheon_Bay_003.jpg"),
    W("8/8f/20181231_Suncheon_Bay_001.jpg/1280px-20181231_Suncheon_Bay_001.jpg"),
    W("7/7c/Suncheon_bay_banner.jpg/1280px-Suncheon_bay_banner.jpg"),
  ],
};

const FALLBACK = IMAGES.안동;

export function getDestinationImage(name) {
  return IMAGES[name] || FALLBACK;
}

/** 일정 화면용 사진 목록 (해당 지역 사진만) */
export function getDestinationGallery(name, count = 4) {
  const main = getDestinationImage(name);
  const extras = (GALLERY_EXTRA[name] || []).filter(
    (url) => url && url !== main,
  );
  const unique = [...new Set([main, ...extras])];
  return unique.slice(0, count);
}

/** 위키미디어 파일 페이지 링크 (출처 표기용) */
export function getImageCredit(name) {
  const url = getDestinationImage(name);
  if (!url?.includes("wikimedia.org")) {
    return { label: "Wikimedia Commons", href: "https://commons.wikimedia.org/" };
  }

  const thumbMatch = url.match(/\/([^/]+)$/);
  const thumbName = thumbMatch?.[1] || "";
  const fileName = thumbName.replace(/^960px-/, "").replace(/^(\d+px-)/, "");
  if (!fileName) {
    return { label: "Wikimedia Commons", href: "https://commons.wikimedia.org/" };
  }

  return {
    label: "Wikimedia Commons",
    href: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(decodeURIComponent(fileName))}`,
  };
}
