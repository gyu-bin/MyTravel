export const PLAN_PRICE = 990;
const SESSION_KEY = "mytravel-payment-session";
const ACCESS_KEY = "mytravel-plan-access";
const CUSTOMER_KEY = "mytravel-toss-customer";

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

export function getTossConfig() {
  return {
    clientKey: import.meta.env.VITE_TOSS_CLIENT_KEY?.trim() || "",
    siteUrl: import.meta.env.VITE_SITE_URL?.trim() || window.location.origin,
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

export function isPaymentConfigured() {
  return Boolean(getTossConfig().clientKey);
}

export function isPaymentMockMode() {
  if (import.meta.env.VITE_PAYMENT_MOCK === "true") return true;
  return !isPaymentConfigured();
}

export function createOrderId() {
  const uuid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `mytravel-${uuid}`;
}

export function savePaymentSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadPaymentSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPaymentSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export async function confirmPayment({ paymentKey, orderId, amount }) {
  if (isPaymentMockMode() && orderId.startsWith("mock-")) {
    return { ok: true, mock: true };
  }

  const res = await fetch("/api/confirm-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "결제 승인에 실패했습니다.");
  }

  return data;
}

export async function requestMockPayment(sessionData) {
  await new Promise((r) => setTimeout(r, 600));
  const orderId = `mock-${Date.now()}`;
  await confirmPayment({ paymentKey: `mock-key-${orderId}`, orderId, amount: PLAN_PRICE });
  if (sessionData) clearPaymentSession();
  markPlanAccessGranted();
  return { orderId };
}

export function buildOrderName(destinations) {
  const destList = destinations.slice(0, 3);
  const name = `TOP 3 AI 맞춤 여행 일정 (${destList.join(", ")})`;
  return name.length > 100 ? `${name.slice(0, 97)}...` : name;
}

export async function prepareOrder(orderId) {
  if (isPaymentMockMode() && orderId.startsWith("mock-")) {
    return { ok: true, mock: true };
  }

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
  return getTossConfig().siteUrl.replace(/\/$/, "");
}

export function getPaymentSuccessUrl() {
  return `${getRedirectOrigin()}/?payment=success`;
}

export function getPaymentFailUrl() {
  return `${getRedirectOrigin()}/?payment=fail`;
}

export async function completeRedirectPayment({ paymentKey, orderId, amount }) {
  const session = loadPaymentSession();
  if (session?.orderId && session.orderId !== orderId) {
    throw new Error("주문 정보가 일치하지 않습니다.");
  }
  if (Number(amount) !== PLAN_PRICE) {
    throw new Error("결제 금액이 일치하지 않습니다.");
  }

  await confirmPayment({ paymentKey, orderId, amount: Number(amount) });
  clearPaymentSession();
  markPlanAccessGranted();
  return { orderId };
}

/** 결제 리다이렉트 복귀 시 첫 렌더 전에 상태 복원 (홈 깜빡임 방지) */
export function consumePaymentReturnBootstrap() {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  if (!paymentStatus) return null;

  const session = loadPaymentSession();
  const hasSession = Boolean(session?.answers && session?.destinations);

  window.history.replaceState({}, "", window.location.pathname);

  if (paymentStatus === "fail") {
    if (!hasSession) return null;
    return {
      phase: "result",
      answers: session.answers,
      destinations: session.destinations,
      planError: params.get("message") || "결제에 실패했습니다.",
    };
  }

  if (paymentStatus !== "success") return null;

  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount"));

  if (!paymentKey || !orderId || !hasSession) return null;

  return {
    phase: "result",
    answers: session.answers,
    destinations: session.destinations,
    planLoading: true,
    pendingPayment: { paymentKey, orderId, amount },
  };
}
