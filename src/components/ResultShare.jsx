import { useCallback, useState } from "react";
import {
  canUseNativeShare,
  copyResultText,
  copyShareLink,
  shareResultNative,
} from "../utils/shareResult";

export default function ResultShare({ top3, destinations }) {
  const [feedback, setFeedback] = useState("");
  const nativeShare = canUseNativeShare();

  const showFeedback = useCallback((message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 2400);
  }, []);

  const handleNativeShare = async () => {
    try {
      await shareResultNative(top3, destinations);
      showFeedback("공유했어요");
    } catch (err) {
      if (err?.name === "AbortError") return;
      try {
        await copyResultText(top3, destinations);
        showFeedback("복사했어요 — 원하는 곳에 붙여넣기 하세요");
      } catch {
        showFeedback("공유에 실패했어요. 다시 시도해주세요");
      }
    }
  };

  const handleCopyText = async () => {
    try {
      await copyResultText(top3, destinations);
      showFeedback("결과 텍스트를 복사했어요");
    } catch {
      showFeedback("복사에 실패했어요");
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyShareLink();
      showFeedback("링크를 복사했어요");
    } catch {
      showFeedback("복사에 실패했어요");
    }
  };

  return (
    <section className="result-share" aria-label="결과 공유">
      <p className="result-share-label">친구에게 공유하기</p>
      <div className="result-share-actions">
        {nativeShare ? (
          <button
            type="button"
            className="btn-solid result-share-btn result-share-btn--primary"
            onClick={handleNativeShare}
          >
            공유하기
          </button>
        ) : null}
        <button
          type="button"
          className={`btn-outline result-share-btn${nativeShare ? "" : " result-share-btn--primary"}`}
          onClick={handleCopyText}
        >
          결과 복사
        </button>
        <button
          type="button"
          className="btn-outline result-share-btn"
          onClick={handleCopyLink}
        >
          링크 복사
        </button>
      </div>
      {feedback ? (
        <p className="result-share-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
