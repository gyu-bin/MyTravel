import { useState } from "react";
import PaymentDemandStats from "./PaymentDemandStats";
import {
  isAdminToolsEnabled,
  isAdminUnlocked,
  unlockAdmin,
} from "../utils/admin";

export default function IntroAdminTools({ onSkipToResult }) {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked());
  const [busy, setBusy] = useState(false);

  if (!isAdminToolsEnabled()) return null;

  function handleUnlock() {
    const input = window.prompt("관리자 키를 입력하세요");
    if (input === null) return;
    if (unlockAdmin(input)) {
      setUnlocked(true);
    } else {
      window.alert("키가 올바르지 않습니다.");
    }
  }

  async function handleSkip() {
    setBusy(true);
    try {
      await onSkipToResult();
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <button
        type="button"
        className="intro-admin-gate"
        onClick={handleUnlock}
        aria-label="관리자 로그인"
      >
        관리자
      </button>
    );
  }

  return (
    <div className="intro-admin-tools">
      <button
        type="button"
        className="intro-admin-skip"
        onClick={handleSkip}
        disabled={busy}
      >
        {busy ? "분석 중…" : "🎲 랜덤 답변 → 결과 바로가기"}
      </button>
      <PaymentDemandStats />
    </div>
  );
}
