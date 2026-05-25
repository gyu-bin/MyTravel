import { questions } from "../data/questions";

const STORAGE_KEY = "mytravel_admin_unlocked";

export function getAdminKey() {
  return import.meta.env.VITE_ADMIN_KEY?.trim() || "";
}

/** VITE_ADMIN_KEY가 설정된 빌드에서만 관리자 UI 노출 */
export function isAdminToolsEnabled() {
  return Boolean(getAdminKey());
}

export function isAdminUnlocked() {
  if (!isAdminToolsEnabled()) return false;
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function unlockAdmin(input) {
  const key = getAdminKey();
  if (!key || input?.trim() !== key) return false;
  sessionStorage.setItem(STORAGE_KEY, "1");
  return true;
}

/** URL ?admin=키 로 잠금 해제 (북마크용) */
export function tryUnlockAdminFromUrl() {
  if (!isAdminToolsEnabled()) return false;
  const param = new URLSearchParams(window.location.search).get("admin");
  if (!param) return false;
  if (unlockAdmin(param)) {
    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    window.history.replaceState({}, "", url.pathname + url.search);
    return true;
  }
  return false;
}

export function buildRandomAnswers() {
  return questions.map((q) => {
    const idx = Math.floor(Math.random() * q.options.length);
    return q.options[idx].value;
  });
}
