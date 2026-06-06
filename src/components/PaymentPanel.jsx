import { useEffect, useState } from "react";
import {
  getNicepayReturnUrl,
  getPaymentProvider,
  getPortoneClientId,
  getQrImageUrl,
  isPaymentDemandTest,
  isPaymentMock,
  PLAN_PRICE,
} from "../lib/paddleConfig.js";
import {
  completeQrPayment,
  createOrderId,
  openPaddleCheckout,
  prepareOrder,
  registerPaddleCheckoutHandler,
  runMockPayment,
  formatNicepayGoodsName,
  markAwaitingPayment,
  savePaymentSession,
} from "../utils/payment.js";
import { openNicepayCheckout } from "../utils/nicepayPayment.js";
import { openTossQrPaymentWindow } from "../utils/tossQrPayment.js";
import { trackPaymentDemand } from "../utils/trackPaymentDemand.js";

export default function PaymentPanel({ destinations, answers, onPaid, onPayingChange }) {
  const [qrOpen, setQrOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const provider = getPaymentProvider();
  const mock = isPaymentMock();
  const demandTest = isPaymentDemandTest();
  const top3 = destinations.slice(0, 3);
  const qrImage = getQrImageUrl();
  const portoneClientId = getPortoneClientId();

  useEffect(() => {
    registerPaddleCheckoutHandler(onPaid);
  }, [onPaid]);

  useEffect(() => {
    if (!qrOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e) {
      if (e.key === "Escape" && !busy) setQrOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [qrOpen, busy]);

  async function handleOpenCheckout() {
    setError(null);
    setBusy(true);
    const orderId = createOrderId();

    try {
      trackPaymentDemand("intent");
      savePaymentSession({ answers, destinations: top3, orderId });

      if (mock || provider === "mock") {
        await runMockPayment();
        trackPaymentDemand("complete");
        onPaid?.();
        return;
      }

      if (provider === "portone") {
        await prepareOrder(orderId, { answers, destinations: top3 });
        markAwaitingPayment({
          orderId,
          amount: PLAN_PRICE,
          answers,
          destinations: top3,
        });
        onPayingChange?.(true);
        setBusy(false);
        const result = await openNicepayCheckout({
          clientId: portoneClientId,
          orderId,
          amount: PLAN_PRICE,
          goodsName: formatNicepayGoodsName(top3),
          returnUrl: getNicepayReturnUrl(),
        });
        onPayingChange?.(false);
        if (result?.error) {
          setError(result.error);
        }
        return;
      }

      if (provider === "toss-auto") {
        await openTossQrPaymentWindow({ orderId, destinations: top3 });
        return;
      }

      if (provider === "qr") {
        setQrOpen(true);
        return;
      }

      if (provider === "paddle") {
        await openPaddleCheckout({
          orderId,
          customData: { destinations: top3.join(",") },
        });
        return;
      }

      setError("결제가 설정되지 않았습니다.");
    } catch (err) {
      setError(err?.message || "결제를 시작할 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }

  function handleQrComplete() {
    setBusy(true);
    try {
      completeQrPayment();
      trackPaymentDemand("complete");
      setQrOpen(false);
      onPaid?.();
    } catch (err) {
      setError(err.message || "일정을 열 수 없습니다.");
    } finally {
      setBusy(false);
    }
  }

  function paymentFeatureText() {
    if (provider === "portone") {
      return "카드·간편결제로 안전하게 결제해요";
    }
    if (provider === "toss-auto") {
      return "토스 QR 결제 후 자동으로 일정이 열려요";
    }
    return `토스 QR로 ${PLAN_PRICE.toLocaleString()}원 송금`;
  }

  function paymentButtonLabel() {
    if (busy && !qrOpen) return "여는 중…";
    if (demandTest) return "AI 일정 무료로 보기";
    if (provider === "portone") {
      return `${PLAN_PRICE.toLocaleString()}원 · 결제하기`;
    }
    if (provider === "toss-auto") {
      return `${PLAN_PRICE.toLocaleString()}원 · 토스페이 QR`;
    }
    return `${PLAN_PRICE.toLocaleString()}원 · QR 보기`;
  }

  return (
    <>
      <section className="payment-panel" aria-label="결제">
        <div className="payment-panel-inner">
          <div className="payment-panel-copy">
            <span className="payment-panel-badge">AI 맞춤 일정</span>
            <h3 className="payment-panel-title">
              위 TOP 3 여행지 일정을 모두 열람하세요
            </h3>
            <ul className="payment-panel-features">
              <li>1·2·3위 맞춤 일정 각 1종</li>
              <li>일자별 코스 · 현지 꿀팁 · 맛집</li>
              <li>{paymentFeatureText()}</li>
            </ul>
          </div>

          {demandTest && (
            <p className="payment-mock-note">
              지금은 <strong>무료 체험</strong> 기간입니다.
            </p>
          )}

          {error && <div className="plan-error">{error}</div>}

          <button
            type="button"
            className="payment-panel-btn"
            onClick={handleOpenCheckout}
            disabled={busy && !qrOpen}
          >
            {paymentButtonLabel()}
          </button>
        </div>
      </section>

      {qrOpen && (
        <div
          className="payment-modal-overlay"
          role="presentation"
          onClick={busy ? undefined : () => setQrOpen(false)}
        >
          <div
            className="payment-modal payment-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-qr-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-header">
              <h3 id="payment-qr-title" className="payment-modal-title">
                토스 QR 송금
              </h3>
              <button
                type="button"
                className="payment-modal-close"
                onClick={() => setQrOpen(false)}
                disabled={busy}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <p className="payment-modal-amount">
              AI 맞춤 일정 3종{" "}
              <strong>{PLAN_PRICE.toLocaleString()}원</strong>
            </p>

            <ol className="payment-qr-steps">
              <li>토스 앱 → QR 스캔</li>
              <li>
                <strong>{PLAN_PRICE.toLocaleString()}원</strong> 송금
              </li>
              <li>송금 후 아래 「송금 완료」 버튼</li>
            </ol>

            <div className="payment-qr-frame">
              <img
                src={qrImage}
                alt={`토스 QR — ${PLAN_PRICE.toLocaleString()}원 송금`}
                className="payment-qr-image"
                width={280}
                height={280}
              />
            </div>

            <button
              type="button"
              className="payment-panel-btn payment-modal-submit"
              onClick={handleQrComplete}
              disabled={busy}
            >
              {busy ? "열리는 중…" : "송금 완료"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
