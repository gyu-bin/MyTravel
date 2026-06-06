import {
  approveNicepayPayment,
  getNicepayClientId,
  getNicepaySecretKey,
  getSiteOrigin,
  PLAN_PRICE,
} from "./_nicepay.js";
import { consumePendingOrder, markCompletedOrder } from "./_orders.js";

function parseReturnBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === "object" && !Buffer.isBuffer(body)) return body;
  if (typeof body === "string") {
    return Object.fromEntries(new URLSearchParams(body).entries());
  }
  return {};
}

function redirect(res, url) {
  res.status(302);
  res.setHeader("Location", url);
  res.end();
}

function failRedirect(res, req, message) {
  const origin = getSiteOrigin(req);
  const url = new URL("/payment-return.html", origin);
  url.searchParams.set("status", "fail");
  if (message) url.searchParams.set("message", message);
  redirect(res, url.toString());
}

function successRedirect(res, req, { orderId, amount }) {
  const origin = getSiteOrigin(req);
  const url = new URL("/payment-return.html", origin);
  url.searchParams.set("status", "success");
  url.searchParams.set("orderId", orderId);
  url.searchParams.set("amount", String(amount));
  redirect(res, url.toString());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!getNicepayClientId() || !getNicepaySecretKey()) {
    return failRedirect(
      res,
      req,
      "나이스페이 키가 설정되지 않았습니다.",
    );
  }

  const body = parseReturnBody(req);
  const authResultCode = body.authResultCode;
  const authResultMsg = body.authResultMsg || "인증에 실패했습니다.";
  const tid = body.tid;
  const orderId = body.orderId;
  const amount = Number(body.amount);
  const clientId = body.clientId;

  if (authResultCode !== "0000") {
    return failRedirect(res, req, authResultMsg);
  }

  if (!tid || !orderId || !Number.isFinite(amount)) {
    return failRedirect(res, req, "결제 응답 정보가 올바르지 않습니다.");
  }

  if (amount !== PLAN_PRICE) {
    return failRedirect(res, req, "결제 금액이 일치하지 않습니다.");
  }

  if (clientId && clientId !== getNicepayClientId()) {
    return failRedirect(res, req, "클라이언트 키가 일치하지 않습니다.");
  }

  const pending = await consumePendingOrder(orderId);
  const orderMeta = pending ?? { amount, answers: null, destinations: null };

  if (!pending) {
    console.warn(
      `[nicepay-return] pending order missing (${orderId}) — 승인은 계속 진행합니다.`,
    );
  } else if (orderMeta.amount !== amount) {
    return failRedirect(res, req, "결제 금액이 일치하지 않습니다.");
  }

  try {
    const payment = await approveNicepayPayment(tid, amount);
    if (payment.orderId && payment.orderId !== orderId) {
      return failRedirect(res, req, "주문번호가 일치하지 않습니다.");
    }

    await markCompletedOrder(orderId, {
      tid,
      amount,
      answers: orderMeta.answers,
      destinations: orderMeta.destinations,
    });
    return successRedirect(res, req, { orderId, amount });
  } catch (err) {
    return failRedirect(
      res,
      req,
      err.message || "결제 승인 중 오류가 발생했습니다.",
    );
  }
}
