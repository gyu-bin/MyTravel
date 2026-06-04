/** 결제 수요 집계 — 실패해도 UX에 영향 없음 */
export function trackPaymentDemand(event) {
  if (event !== "intent" && event !== "complete") return;

  fetch("/api/payment-demand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}

export async function fetchPaymentDemandStats(adminKey) {
  const res = await fetch("/api/payment-demand-stats", {
    headers: { "x-admin-key": adminKey },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "통계를 불러오지 못했습니다.");
  }
  return data;
}
