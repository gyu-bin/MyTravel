export const PLAN_PRICE = 990;

/** 수요 검증: 실결제 없이 버튼·완료만 집계 */
export function isPaymentDemandTest() {
  return import.meta.env.VITE_PAYMENT_DEMAND_TEST === "true";
}

export function isPaymentMock() {
  return (
    import.meta.env.VITE_PAYMENT_MOCK === "true" || isPaymentDemandTest()
  );
}

/** QR 이미지 (포트원 설정 시 사용 안 함) */
export function getQrImageUrl() {
  if (isPortoneConfigured()) return "";
  const custom = import.meta.env.VITE_TOSS_QR_IMAGE?.trim();
  if (custom) return custom;
  return "/toss-payment-qr.png";
}

export function isTossAutoPayment() {
  return import.meta.env.VITE_PAYMENT_TOSS_AUTO === "true";
}

/** true면 송금 확인 없이 「송금 완료」로 열림 — 수요 테스트·로컬만 */
export function isQrHonorMode() {
  return import.meta.env.VITE_PAYMENT_QR_TRUST === "true";
}

/** true면 정적 QR만 (토스 API 자동 승인 안 씀) */
export function isStaticQrOnly() {
  return import.meta.env.VITE_PAYMENT_QR_ONLY === "true";
}

export function getTossClientKey() {
  return import.meta.env.VITE_TOSS_CLIENT_KEY?.trim() || "";
}

/** 결제위젯 연동 키 (gck/gsk) — requestPayment DIRECT 미지원 */
export function isTossWidgetClientKey(key = getTossClientKey()) {
  return /_(gck|gsk)_/.test(key);
}

/** API 개별 연동 키 (ck/sk) */
export function isTossApiClientKey(key = getTossClientKey()) {
  const k = key || getTossClientKey();
  return Boolean(k) && !isTossWidgetClientKey(k) && /_(ck|sk)_/.test(k);
}

export function getPaymentProvider() {
  if (isPaymentMock()) return "mock";

  if (isPortoneConfigured()) {
    return "portone";
  }

  const clientKey = getTossClientKey();
  const hasTossApi = isTossApiClientKey(clientKey);

  // 명시적으로 켠 경우만 토스 API 직접 결제 (API 개별 키 필요)
  if (hasTossApi && isTossAutoPayment()) {
    return "toss-auto";
  }

  // 정적 QR 모달 + 송금 완료 버튼
  if (getQrImageUrl()) {
    return "qr";
  }

  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.trim();
  const priceId = import.meta.env.VITE_PADDLE_PRICE_ID?.trim();
  if (token && priceId) return "paddle";

  if (hasTossApi && isTossAutoPayment()) return "toss-auto";

  return "mock";
}

export function getPaddleClientToken() {
  return import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.trim() || "";
}

export function getPaddlePriceId() {
  return import.meta.env.VITE_PADDLE_PRICE_ID?.trim() || "";
}

export function getPaddleEnvironment() {
  const env = import.meta.env.VITE_PADDLE_ENV?.trim();
  if (env === "production") return "production";
  return "sandbox";
}

export function getPaddleSuccessUrl() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set("paddle", "success");
  url.hash = "";
  return url.toString();
}

export function getTossQrVariantKey() {
  return import.meta.env.VITE_TOSS_QR_VARIANT_KEY?.trim() || "DEFAULT";
}

/** 포트원(나이스페이) 클라이언트 키 — 브라우저 공개 */
export function getPortoneClientId() {
  return (
    import.meta.env.VITE_PORTONE_CLIENT_KEY?.trim() ||
    import.meta.env.VITE_NICEPAY_CLIENT_ID?.trim() ||
    ""
  );
}

export function isPortoneConfigured() {
  return Boolean(getPortoneClientId());
}

export function getNicepayReturnUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/nicepay-return`;
}
