import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { isTossApiClientKey, PLAN_PRICE } from "../lib/paddleConfig.js";
import {
  buildOrderName,
  getCustomerKey,
  getPaymentFailUrl,
  getPaymentSuccessUrl,
  getTossConfig,
  prepareOrder,
} from "./payment.js";

/** 토스페이만 바로 열기 (QR) — 결제 수단 선택창 없음 */
export async function openTossQrPaymentWindow({ orderId, destinations }) {
  const { clientKey } = getTossConfig();
  if (!clientKey) {
    throw new Error("토스 클라이언트 키가 설정되지 않았습니다.");
  }
  if (!isTossApiClientKey(clientKey)) {
    throw new Error(
      "결제위젯 키(gck)는 토스페이 QR 직접 결제를 지원하지 않습니다. API 개별 키(test_ck)를 쓰거나 QR만 스캔해 주세요.",
    );
  }

  await prepareOrder(orderId);

  const tossPayments = await loadTossPayments(clientKey);
  const payment = tossPayments.payment({ customerKey: getCustomerKey() });

  await payment.requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: PLAN_PRICE },
    orderId,
    orderName: buildOrderName(destinations),
    successUrl: getPaymentSuccessUrl(),
    failUrl: getPaymentFailUrl(),
    card: {
      flowMode: "DIRECT",
      easyPay: "토스페이",
    },
  });
}
