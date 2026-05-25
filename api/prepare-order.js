import { savePendingOrder } from "./_orders.js";

const PLAN_PRICE = 990;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { orderId, amount } = req.body ?? {};

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ ok: false, error: "orderId가 필요합니다." });
  }

  if (Number(amount) !== PLAN_PRICE) {
    return res.status(400).json({
      ok: false,
      error: "결제 금액이 일치하지 않습니다.",
    });
  }

  savePendingOrder(orderId, PLAN_PRICE);

  return res.status(200).json({ ok: true, orderId, amount: PLAN_PRICE });
}
