const RANK_PREFIX = ["🥇 1위", "🥈 2위", "🥉 3위"];

const DEFAULT_SITE_URL = "https://my-travel-flax.vercel.app/";

export function getShareSiteUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/`;
  }
  return DEFAULT_SITE_URL;
}

export function buildResultShareContent(top3, destinations = {}) {
  const lines = top3.map((name, i) => {
    const info = destinations[name] || {};
    const desc = info.desc ? ` — ${info.desc}` : "";
    return `${RANK_PREFIX[i]} ${name}${desc}`;
  });

  const url = getShareSiteUrl();
  const text = [
    "MyTravel 여행 성향 테스트 결과 🎉",
    "",
    ...lines,
    "",
    `나도 테스트하기 👉 ${url}`,
  ].join("\n");

  return {
    title: "MyTravel — 나의 숨은 국내 여행지 TOP 3",
    text,
    url,
  };
}

export function canUseNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function shareResultNative(top3, destinations) {
  const { title, text, url } = buildResultShareContent(top3, destinations);
  await navigator.share({ title, text, url });
}

export async function copyResultText(top3, destinations) {
  const { text } = buildResultShareContent(top3, destinations);
  await navigator.clipboard.writeText(text);
  return text;
}

export async function copyShareLink() {
  const url = getShareSiteUrl();
  await navigator.clipboard.writeText(url);
  return url;
}
