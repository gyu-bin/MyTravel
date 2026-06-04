const PLAN_PRICE = 990;

function getApiBase() {
  return process.env.PADDLE_ENV === "production"
    ? "https://api.paddle.com"
    : "https://sandbox-api.paddle.com";
}

function getPaidAmount(txn) {
  const details = txn?.details?.totals;
  if (details?.total) return Number(details.total);
  const grand = txn?.details?.adjusted_totals ?? txn?.details?.totals;
  if (grand?.total) return Number(grand.total);
  return NaN;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: "PADDLE_API_KEY가 설정되지 않았습니다.",
    });
  }

  const { transactionId } = req.body ?? {};
  if (!transactionId || typeof transactionId !== "string") {
    return res.status(400).json({
      ok: false,
      error: "transactionId가 필요합니다.",
    });
  }

  try {
    const apiRes = await fetch(
      `${getApiBase()}/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const txn = await apiRes.json().catch(() => ({}));

    if (!apiRes.ok) {
      return res.status(400).json({
        ok: false,
        error: txn?.error?.detail || "결제 정보를 확인할 수 없습니다.",
      });
    }

    const data = txn.data ?? txn;
    const status = data.status;
    const paid = getPaidAmount(data);
    const currency =
      data.currency_code ||
      data.details?.totals?.currency_code ||
      data.details?.line_items?.[0]?.unit_totals?.currency_code;

    const completed =
      status === "completed" || status === "paid" || status === "billed";

    if (!completed) {
      return res.status(400).json({
        ok: false,
        error: "결제가 완료되지 않았습니다.",
        status,
      });
    }

    if (currency && currency !== "KRW") {
      return res.status(400).json({
        ok: false,
        error: "지원하지 않는 통화입니다.",
      });
    }

    if (!Number.isNaN(paid) && paid !== PLAN_PRICE) {
      return res.status(400).json({
        ok: false,
        error: "결제 금액이 일치하지 않습니다.",
      });
    }

    return res.status(200).json({ ok: true, transactionId });
  } catch {
    return res.status(500).json({
      ok: false,
      error: "결제 확인 중 오류가 발생했습니다.",
    });
  }
}
