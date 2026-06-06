import { PLAN_PRICE } from "./_nicepay.js";
import { peekCompletedOrder } from "./_orders.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { orderId, amount } = req.body ?? {};

  if (!orderId) {
    return res.status(400).json({
      ok: false,
      error: "orderId가 필요합니다.",
    });
  }

  const paidAmount = Number(amount);
  if (!Number.isFinite(paidAmount)) {
    return res.status(400).json({
      ok: false,
      error: "결제 금액이 일치하지 않습니다.",
    });
  }
  if (paidAmount !== PLAN_PRICE) {
    return res.status(400).json({
      ok: false,
      error: "결제 금액이 일치하지 않습니다.",
    });
  }

  const completed = await peekCompletedOrder(orderId);
  if (!completed || completed.amount !== paidAmount) {
    return res.status(400).json({
      ok: false,
      error: "결제 확인 정보를 찾을 수 없습니다.",
    });
  }

  return res.status(200).json({
    ok: true,
    orderId,
    tid: completed.tid,
    answers: completed.answers,
    destinations: completed.destinations,
  });
}
