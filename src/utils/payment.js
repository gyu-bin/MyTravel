export const PLAN_PRICE = 990;

export function isPaymentMockMode() {
  if (import.meta.env.VITE_PAYMENT_MOCK === "true") return true;
  return (
    !import.meta.env.VITE_PORTONE_STORE_ID ||
    !import.meta.env.VITE_PORTONE_CHANNEL_KEY
  );
}

export async function requestPlanPayment(destination) {
  if (isPaymentMockMode()) {
    await new Promise((r) => setTimeout(r, 600));
    return { paymentId: `mock-${Date.now()}` };
  }

  const { requestPayment } = await import("@portone/browser-sdk/v2");
  const paymentId = `mytravel-${destination}-${Date.now()}`;

  const response = await requestPayment({
    storeId: import.meta.env.VITE_PORTONE_STORE_ID,
    channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY,
    paymentId,
    orderName: `${destination} AI 맞춤 여행 일정`,
    totalAmount: PLAN_PRICE,
    currency: "CURRENCY_KRW",
    payMethod: "CARD",
  });

  if (response?.code) {
    throw new Error(response.message || "결제가 취소되었습니다.");
  }

  return { paymentId };
}
