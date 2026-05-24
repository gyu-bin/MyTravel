import { useState } from "react";
import { DESTINATIONS } from "../data/destinations";
import { getDestinationImage } from "../data/destinationImages";
import {
  PLAN_PRICE,
  isPaymentMockMode,
  requestPlanPayment,
} from "../utils/payment";

export default function PaymentGate({
  destination,
  onPaid,
  onBack,
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);
  const info = DESTINATIONS[destination] || {};
  const image = getDestinationImage(destination);
  const mock = isPaymentMockMode();

  async function handlePay() {
    setPaying(true);
    setError(null);
    try {
      await requestPlanPayment(destination);
      onPaid();
    } catch (err) {
      setError(err.message || "결제에 실패했습니다.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="payment">
      <button type="button" className="btn-text-link payment-back" onClick={onBack}>
        ← 결과로 돌아가기
      </button>

      <div className="payment-card">
        <div
          className="payment-photo"
          style={{ backgroundImage: `url(${image})` }}
        >
          <span className="payment-photo-badge">AI 맞춤 일정</span>
        </div>

        <div className="payment-body">
          <span className="payment-emoji">{info.emoji}</span>
          <h2 className="payment-title">{destination} 여행 일정</h2>
          <p className="payment-desc">{info.desc}</p>

          <ul className="payment-features">
            <li>설문 결과 반영 맞춤 일정</li>
            <li>일자별 코스 · 현지 꿀팁 · 맛집</li>
            <li>여행지 대표 사진 포함</li>
          </ul>

          <div className="payment-price">
            <span className="payment-price-label">1회 이용</span>
            <span className="payment-price-value">
              {PLAN_PRICE.toLocaleString()}
              <small>원</small>
            </span>
          </div>

          {mock && (
            <p className="payment-mock-note">
              결제 연동 전 테스트 모드입니다. 버튼을 누르면 결제 없이 진행됩니다.
            </p>
          )}

          {error && <div className="plan-error">{error}</div>}

          <button
            type="button"
            className="payment-btn"
            onClick={handlePay}
            disabled={paying}
          >
            {paying
              ? "처리 중..."
              : mock
                ? "AI 일정 받기 (테스트)"
                : `${PLAN_PRICE.toLocaleString()}원 결제하고 일정 받기`}
          </button>
        </div>
      </div>
    </div>
  );
}
