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
const CUSTOMER_KEY = "mytravel-toss-customer";

export { PLAN_PRICE, getPaymentProvider, isPaymentMock };

export function markPlanAccessGranted() {
  try {
    sessionStorage.setItem(ACCESS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasPlanAccess() {
  try {
    return sessionStorage.getItem(ACCESS_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPlanAccess() {
  try {
    sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
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

export async function prepareOrder(orderId) {
  const res = await fetch("/api/prepare-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, amount: PLAN_PRICE }),
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
  try {
    sessionStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadPaymentSession() {
  try {
    const raw = sessionStorage.getItem(PAYMENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPaymentSession() {
  try {
    sessionStorage.removeItem(PAYMENT_SESSION_KEY);
  } catch {
    /* ignore */
  }
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

  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount"));
  const failMessage = params.get("message");

  cleanUrlParams([
    "payment",
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

  if (!paymentKey || !orderId || !hasSession) return null;

  return {
    phase: "result",
    answers: session.answers,
    destinations: session.destinations,
    planLoading: true,
    pendingPayment: { paymentKey, orderId, amount },
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
