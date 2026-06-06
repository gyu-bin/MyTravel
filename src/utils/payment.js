import {
  getPaymentProvider,
  getPaddlePriceId,
  getPaddleSuccessUrl,
  isPaymentMock,
  PLAN_PRICE,
} from "../lib/paddleConfig.js";
import { getPaddle } from "./paddleCheckout.js";

const PAYMENT_SESSION_KEY = "mytravel-payment-session";
const ACCESS_KEY = "mytravel-plan-access";
const AWAITING_PAYMENT_KEY = "mytravel-awaiting-payment";
const NICEPAY_RETURN_KEY = "mytravel-nicepay-return";
const NICEPAY_LAUNCH_KEY = "mytravel-nicepay-launch";
const CUSTOMER_KEY = "mytravel-toss-customer";
const PAYMENT_BC = "mytravel-payment";

function readStorage(key) {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export { PLAN_PRICE, getPaymentProvider, isPaymentMock, PAYMENT_BC };

export function markPlanAccessGranted() {
  writeStorage(ACCESS_KEY, "1");
}

export function hasPlanAccess() {
  return readStorage(ACCESS_KEY) === "1";
}

export function clearPlanAccess() {
  removeStorage(ACCESS_KEY);
}

export function markAwaitingPayment({ orderId, amount, answers, destinations }) {
  writeStorage(
    AWAITING_PAYMENT_KEY,
    JSON.stringify({
      orderId,
      amount,
      answers,
      destinations,
      ts: Date.now(),
    }),
  );
}

export function clearAwaitingPayment() {
  removeStorage(AWAITING_PAYMENT_KEY);
}

export function readAwaitingPayment() {
  try {
    const raw = readStorage(AWAITING_PAYMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > 30 * 60 * 1000) {
      clearAwaitingPayment();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function peekNicepayReturnFlag() {
  try {
    const raw = readStorage(NICEPAY_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > 30 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createOrderId() {
  const uuid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `mytravel-${uuid}`;
}

export function getTossConfig() {
  return {
    clientKey: import.meta.env.VITE_TOSS_CLIENT_KEY?.trim() || "",
    siteUrl: import.meta.env.VITE_SITE_URL?.trim() || "",
  };
}

export function getCustomerKey() {
  try {
    let key = localStorage.getItem(CUSTOMER_KEY);
    if (!key) {
      key =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? `guest-${crypto.randomUUID()}`
          : `guest-${Date.now()}`;
      localStorage.setItem(CUSTOMER_KEY, key);
    }
    return key;
  } catch {
    return `guest-${Date.now()}`;
  }
}

export function buildOrderName(destinations) {
  const destList = (destinations || []).slice(0, 3);
  const name = `TOP 3 AI 맞춤 여행 일정 (${destList.join(", ")})`;
  return name.length > 100 ? `${name.slice(0, 97)}...` : name;
}

/** 나이스페이 goodsName 최대 40자 */
export function formatNicepayGoodsName(destinations) {
  const destList = (destinations || []).slice(0, 3);
  const short = `AI맞춤일정 ${destList.join("·")}`;
  if (short.length <= 40) return short;
  return "MyTravel AI맞춤일정 3종";
}

export function saveNicepayLaunchConfig(config) {
  writeStorage(
    NICEPAY_LAUNCH_KEY,
    JSON.stringify({ ...config, ts: Date.now() }),
  );
}

export function consumeNicepayLaunchConfig() {
  try {
    const raw = readStorage(NICEPAY_LAUNCH_KEY);
    removeStorage(NICEPAY_LAUNCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > 10 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function prepareOrder(orderId, { answers, destinations } = {}) {
  const res = await fetch("/api/prepare-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      amount: PLAN_PRICE,
      answers,
      destinations,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "주문 등록에 실패했습니다.");
  }
  return data;
}

function getRedirectOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const siteUrl = getTossConfig().siteUrl.replace(/\/$/, "");
  return siteUrl || "";
}

export function getPaymentSuccessUrl() {
  return `${getRedirectOrigin()}/?payment=success`;
}

export function getPaymentFailUrl() {
  return `${getRedirectOrigin()}/?payment=fail`;
}

export function completeQrPayment() {
  clearPaymentSession();
  markPlanAccessGranted();
}

export function savePaymentSession(data) {
  writeStorage(PAYMENT_SESSION_KEY, JSON.stringify(data));
}

export function loadPaymentSession() {
  try {
    const raw = readStorage(PAYMENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPaymentSession() {
  removeStorage(PAYMENT_SESSION_KEY);
  clearAwaitingPayment();
}

export async function verifyPaddleTransaction(transactionId) {
  const res = await fetch("/api/verify-paddle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "결제 확인에 실패했습니다.");
  }
  return data;
}

export async function openPaddleCheckout({ orderId, customData = {} }) {
  const paddle = await getPaddle();
  const priceId = getPaddlePriceId();
  if (!priceId) {
    throw new Error("Paddle 가격 ID가 설정되지 않았습니다.");
  }

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customData: { orderId, ...customData },
    settings: {
      successUrl: getPaddleSuccessUrl(),
      displayMode: "overlay",
      locale: "ko",
    },
  });
}

async function finalizePaddlePayment(transactionId) {
  await verifyPaddleTransaction(transactionId);
  clearPaymentSession();
  markPlanAccessGranted();
}

export async function completePaddleRedirect(transactionId) {
  await finalizePaddlePayment(transactionId);
  return { transactionId };
}

export async function completeNicepayReturn(
  { orderId, amount },
  fallback = {},
) {
  const paidAmount = Number(amount) || PLAN_PRICE;
  const awaiting = readAwaitingPayment();
  let data = { ok: true };

  if (consumeNicepayReturnFlag(orderId)) {
    data = {
      ok: true,
      answers: awaiting?.orderId === orderId ? awaiting.answers : undefined,
      destinations:
        awaiting?.orderId === orderId ? awaiting.destinations : undefined,
    };
  } else {
    try {
      const res = await fetch("/api/verify-nicepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: paidAmount }),
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "결제 확인에 실패했습니다.");
      }
    } catch (err) {
      throw err;
    }
  }

  const session = loadPaymentSession();
  const destinations =
    data.destinations?.length > 0
      ? data.destinations
      : awaiting?.orderId === orderId && awaiting.destinations?.length > 0
        ? awaiting.destinations
        : session?.destinations?.length > 0
          ? session.destinations
          : fallback.destinations;
  const answers =
    data.answers?.length > 0
      ? data.answers
      : awaiting?.orderId === orderId && awaiting.answers?.length > 0
        ? awaiting.answers
        : session?.answers?.length > 0
          ? session.answers
          : fallback.answers;

  if (!destinations?.length) {
    throw new Error(
      "결제는 완료됐지만 여행 결과를 찾을 수 없습니다. 처음부터 다시 시도해 주세요.",
    );
  }

  clearPaymentSession();
  removeStorage(NICEPAY_RETURN_KEY);
  markPlanAccessGranted();
  return { orderId, answers: answers ?? [], destinations };
}

function consumeNicepayReturnFlag(orderId) {
  const parsed = peekNicepayReturnFlag();
  if (!parsed || parsed.orderId !== orderId) return false;
  removeStorage(NICEPAY_RETURN_KEY);
  return true;
}

export async function tryResumeNicepayPayment(fallback = {}) {
  if (hasPlanAccess()) return null;

  const returned = peekNicepayReturnFlag();
  const awaiting = readAwaitingPayment();
  const orderId = returned?.orderId ?? awaiting?.orderId;
  if (!orderId) return null;

  const amount = returned?.amount ?? awaiting?.amount ?? PLAN_PRICE;

  if (returned) {
    return completeNicepayReturn({ orderId, amount }, fallback);
  }

  return null;
}

/** @deprecated 토스 리다이렉트 호환 */
export async function completeRedirectPayment({ paymentKey, orderId, amount }) {
  const res = await fetch("/api/confirm-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "결제 승인에 실패했습니다.");
  }
  clearPaymentSession();
  markPlanAccessGranted();
  return { orderId };
}

function cleanUrlParams(keys) {
  const params = new URLSearchParams(window.location.search);
  keys.forEach((k) => params.delete(k));
  const qs = params.toString();
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}${qs ? `?${qs}` : ""}`,
  );
}

/** 결제 리다이렉트 복귀 시 첫 렌더 전 상태 복원 */
export function consumePaymentReturnBootstrap() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const session = loadPaymentSession();
  const hasSession = Boolean(session?.answers && session?.destinations);

  const paddleStatus = params.get("paddle");
  if (paddleStatus) {
    const paddleFailMessage = params.get("message");
    const transactionId =
      params.get("transaction_id") ||
      params.get("_ptxn") ||
      params.get("transactionId");

    cleanUrlParams([
      "paddle",
      "transaction_id",
      "_ptxn",
      "transactionId",
      "message",
    ]);

    if (paddleStatus === "fail") {
      if (!hasSession) return null;
      return {
        phase: "result",
        answers: session.answers,
        destinations: session.destinations,
        planError: paddleFailMessage || "결제에 실패했습니다.",
      };
    }

    if (paddleStatus === "success") {
      if (!transactionId || !hasSession) return null;
      return {
        phase: "result",
        answers: session.answers,
        destinations: session.destinations,
        planLoading: true,
        pendingPaddleTransaction: transactionId,
      };
    }
  }

  const paymentStatus = params.get("payment");
  if (!paymentStatus) return null;

  const pg = params.get("pg");
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount")) || PLAN_PRICE;
  const failMessage = params.get("message");

  cleanUrlParams([
    "payment",
    "pg",
    "paymentKey",
    "orderId",
    "amount",
    "message",
  ]);

  if (paymentStatus === "fail") {
    if (!hasSession) return null;
    return {
      phase: "result",
      answers: session.answers,
      destinations: session.destinations,
      planError: failMessage || "결제에 실패했습니다.",
    };
  }

  if (paymentStatus !== "success") return null;

  if (pg === "nicepay") {
    if (!orderId) return null;
    const answersFromSession = session?.answers?.length ? session.answers : [];
    const destinationsFromSession = session?.destinations?.length
      ? session.destinations
      : [];
    return {
      phase: "result",
      answers: answersFromSession,
      destinations: destinationsFromSession,
      planLoading: true,
      pendingNicepayOrder: { orderId, amount },
    };
  }

  if (!paymentKey || !orderId || !hasSession) return null;

  return {
    phase: "result",
    answers: session.answers,
    destinations: session.destinations,
    planLoading: true,
    pendingPayment: { paymentKey, orderId, amount },
  };
}

/** 결제창(팝업)만 닫히고 URL은 그대로일 때 — localStorage 플래그로 복구 */
export function peekNicepayResumeBootstrap() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  if (params.get("payment")) return null;

  const returned = peekNicepayReturnFlag();
  if (!returned?.orderId) return null;

  const session = loadPaymentSession();
  return {
    phase: "result",
    answers: session?.answers ?? [],
    destinations: session?.destinations ?? [],
    planLoading: true,
    pendingNicepayOrder: {
      orderId: returned.orderId,
      amount: returned.amount ?? PLAN_PRICE,
    },
  };
}

export function registerPaddleCheckoutHandler(onPaid) {
  import("./paddleCheckout.js").then(({ setPaddleCheckoutCompletedHandler }) => {
    setPaddleCheckoutCompletedHandler(async (transactionId) => {
      try {
        await finalizePaddlePayment(transactionId);
        onPaid?.();
      } catch (err) {
        console.error(err);
        alert(err.message || "결제 확인에 실패했습니다.");
      }
    });
  });
}

export async function runMockPayment() {
  await new Promise((r) => setTimeout(r, 600));
  clearPaymentSession();
  markPlanAccessGranted();
}
