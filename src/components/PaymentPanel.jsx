import { useEffect, useRef, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import {
  PLAN_PRICE,
  isPaymentMockMode,
  isPaymentConfigured,
  requestMockPayment,
  getTossConfig,
  getCustomerKey,
  createOrderId,
  savePaymentSession,
  buildOrderName,
  getPaymentSuccessUrl,
  getPaymentFailUrl,
  prepareOrder,
} from "../utils/payment";

export default function PaymentPanel({ destinations, answers, onPaid }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const widgetsRef = useRef(null);
  const initPromiseRef = useRef(null);
  const mock = isPaymentMockMode();
  const configured = isPaymentConfigured();
  const top3 = destinations.slice(0, 3);

  function resetWidget() {
    widgetsRef.current = null;
    initPromiseRef.current = null;
    setWidgetReady(false);
  }

  function closeModal() {
    setModalOpen(false);
    setPaying(false);
    resetWidget();
  }

  async function ensureWidgetReady() {
    if (widgetsRef.current) return widgetsRef.current;

    if (!initPromiseRef.current) {
      initPromiseRef.current = (async () => {
        const { clientKey } = getTossConfig();
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey: getCustomerKey() });

        await widgets.setAmount({
          currency: "KRW",
          value: PLAN_PRICE,
        });

        await widgets.renderPaymentMethods({
          selector: "#toss-payment-method",
          variantKey: "DEFAULT",
        });

        await widgets.renderAgreement({
          selector: "#toss-agreement",
          variantKey: "AGREEMENT",
        });

        widgetsRef.current = widgets;
        return widgets;
      })();
    }

    return initPromiseRef.current;
  }

  useEffect(() => {
    if (!modalOpen || mock) return;

    let cancelled = false;

    (async () => {
      try {
        await ensureWidgetReady();
        if (!cancelled) setWidgetReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "결제 위젯을 불러오지 못했습니다.");
          closeModal();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modalOpen, mock]);

  useEffect(() => {
    if (!modalOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e) {
      if (e.key === "Escape" && !paying) closeModal();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, paying]);

  async function handleOpenCheckout() {
    setError(null);

    if (mock) {
      setPaying(true);
      try {
        onPaid();
        await requestMockPayment({ answers, destinations: top3 });
      } catch (err) {
        setError(err.message || "결제에 실패했습니다.");
        setPaying(false);
      }
      return;
    }

    resetWidget();
    setModalOpen(true);
  }

  async function handleConfirmPay() {
    setPaying(true);
    setError(null);

    try {
      const widgets = await ensureWidgetReady();

      const orderId = createOrderId();
      savePaymentSession({ answers, destinations: top3, orderId });

      await prepareOrder(orderId);

      await widgets.requestPayment({
        orderId,
        orderName: buildOrderName(top3),
        successUrl: getPaymentSuccessUrl(),
        failUrl: getPaymentFailUrl(),
      });
    } catch (err) {
      setError(err.message || "결제에 실패했습니다.");
      setPaying(false);
    }
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
              <li>결제 후 이 화면에서 3곳 모두 확인</li>
            </ul>
          </div>

          {mock && configured && (
            <p className="payment-mock-note">
              VITE_PAYMENT_MOCK=true — 결제 없이 테스트합니다.
            </p>
          )}

          {error && !modalOpen && <div className="plan-error">{error}</div>}

          <button
            type="button"
            className="payment-panel-btn"
            onClick={handleOpenCheckout}
            disabled={paying && !modalOpen}
          >
            {paying && !modalOpen ? "처리 중..." : "990원으로 AI일정보기"}
          </button>
        </div>
      </section>

      {modalOpen && !mock && (
        <div
          className="payment-modal-overlay"
          role="presentation"
          onClick={paying ? undefined : closeModal}
        >
          <div
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="payment-modal-header">
              <h3 id="payment-modal-title" className="payment-modal-title">
                결제하기
              </h3>
              <button
                type="button"
                className="payment-modal-close"
                onClick={closeModal}
                disabled={paying}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <p className="payment-modal-amount">
              TOP 3 AI 맞춤 일정{" "}
              <strong>{PLAN_PRICE.toLocaleString()}원</strong>
            </p>

            <div className="payment-modal-widget">
              <div id="toss-payment-method" />
              <div id="toss-agreement" />
              {!widgetReady && (
                <p className="payment-modal-loading">결제 수단을 불러오는 중…</p>
              )}
            </div>

            {error && <div className="plan-error">{error}</div>}

            <button
              type="button"
              className="payment-panel-btn payment-modal-submit"
              onClick={handleConfirmPay}
              disabled={paying || !widgetReady}
            >
              {paying ? "결제 진행 중..." : `${PLAN_PRICE.toLocaleString()}원 결제하기`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
