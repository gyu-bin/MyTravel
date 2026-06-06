import { consumePendingOrder } from "./_orders.js";

const TOSS_CONFIRM_API = "https://api.tosspayments.com/v1/payments/confirm";
const PLAN_PRICE = 990;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({
      ok: false,
      error: "TOSS_SECRET_KEY가 설정되지 않았습니다.",
    });
  }

  const { paymentKey, orderId, amount } = req.body ?? {};

  if (!paymentKey || !orderId || amount == null) {
    return res.status(400).json({
      ok: false,
      error: "paymentKey, orderId, amount가 필요합니다.",
    });
  }

  if (Number(amount) !== PLAN_PRICE) {
    return res.status(400).json({
      ok: false,
      error: "결제 금액이 일치하지 않습니다.",
    });
  }

  if (orderId.startsWith("mock-")) {
    return res.status(200).json({ ok: true, mock: true, orderId });
  }

  const pending = await consumePendingOrder(orderId);
  if (!pending || pending.amount !== Number(amount)) {
    return res.status(400).json({
      ok: false,
      error: "주문 정보를 확인할 수 없습니다. 다시 결제해주세요.",
    });
  }

  try {
    const auth = Buffer.from(`${secretKey}:`).toString("base64");
    const confirmRes = await fetch(TOSS_CONFIRM_API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    });

    const payment = await confirmRes.json().catch(() => ({}));

    if (!confirmRes.ok) {
      return res.status(confirmRes.status).json({
        ok: false,
        error: payment?.message || "결제 승인에 실패했습니다.",
        code: payment?.code,
      });
    }

    if (payment.status !== "DONE") {
      return res.status(402).json({
        ok: false,
        error: "결제가 완료되지 않았습니다.",
        status: payment.status,
      });
    }

    return res.status(200).json({ ok: true, orderId, paymentKey });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "결제 승인 중 오류가 발생했습니다.",
    });
  }
}
