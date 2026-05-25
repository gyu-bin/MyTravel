import { useState, useRef, useEffect } from "react";
import Intro from "./components/Intro";
import PaymentPanel from "./components/PaymentPanel";
import PlanViewer from "./components/PlanViewer";
import PhaseView from "./components/PhaseView";
import ThemeToggle from "./components/ThemeToggle";
import MagneticButton from "./components/MagneticButton";
import { questions } from "./data/questions";
import { DESTINATIONS } from "./data/destinations";
import DestCardGallery from "./components/DestCardGallery";
import { scoreDestinations } from "./utils/scoreDestinations";
import { fetchTravelPlan } from "./utils/fetchTravelPlan";
import {
  PLAN_PRICE,
  loadPaymentSession,
  completeRedirectPayment,
  consumePaymentReturnBootstrap,
  hasPlanAccess,
  markPlanAccessGranted,
  clearPlanAccess,
} from "./utils/payment";
import { buildRandomAnswers, tryUnlockAdminFromUrl } from "./utils/admin";

const RANK_LABELS = ["🥇 1위", "🥈 2위", "🥉 3위"];
const RANK_CLASSES = ["dest-rank--1", "dest-rank--2", "dest-rank--3"];
const paymentBootstrap = consumePaymentReturnBootstrap();

function scrollToPlans() {
  requestAnimationFrame(() => {
    document.getElementById("result-plans")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export default function App() {
  const [phase, setPhase] = useState(paymentBootstrap?.phase ?? "intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(paymentBootstrap?.answers ?? []);
  const [selected, setSelected] = useState(null);
  const [destinations, setDestinations] = useState(
    paymentBootstrap?.destinations ?? []
  );
  const [plans, setPlans] = useState({});
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [planLoading, setPlanLoading] = useState(
    paymentBootstrap?.planLoading ?? false
  );
  const [planError, setPlanError] = useState(paymentBootstrap?.planError ?? null);
  const [hasPaid, setHasPaid] = useState(() => {
    if (paymentBootstrap?.pendingPayment) return true;
    return hasPlanAccess();
  });
  const [anim, setAnim] = useState(true);
  const advanceTimerRef = useRef(null);
  const pendingPaymentRef = useRef(paymentBootstrap?.pendingPayment ?? null);

  const progress = ((current + 1) / questions.length) * 100;
  const q = questions[current];
  const isLastQuestion = current + 1 >= questions.length;
  const top3 = destinations.slice(0, 3);

  useEffect(() => {
    tryUnlockAdminFromUrl();
  }, []);

  useEffect(() => {
    if (phase !== "result" || !hasPaid || !planLoading) return;
    scrollToPlans();
  }, [phase, hasPaid, planLoading]);

  useEffect(() => {
    const pending = pendingPaymentRef.current;
    if (!pending) return;
    pendingPaymentRef.current = null;

    completeRedirectPayment(pending)
      .then(async () => {
        setHasPaid(true);
        markPlanAccessGranted();
        await loadAllPlansForDests(destinations, answers);
        scrollToPlans();
      })
      .catch(() => {
        setPlanLoading(false);
        setPlanError("결제 승인에 실패했습니다. 다시 시도해주세요.");
      });
  }, []);

  function clearAdvanceTimer() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  function finishQuiz(answersList, { quick = false } = {}) {
    clearAdvanceTimer();
    const complete = questions.map((_, i) => answersList[i]);
    setAnswers(complete);
    setPhase("loading");
    const delay = quick ? 400 : 2400;
    setTimeout(() => {
      setDestinations(scoreDestinations(complete));
      setPhase("result");
    }, delay);
  }

  function handleAdminSkipToResult() {
    setCurrent(0);
    setSelected(null);
    setPlans({});
    setPlanError(null);
    finishQuiz(buildRandomAnswers(), { quick: true });
  }

  function goToQuestion(nextIndex, answersList) {
    setAnim(false);
    setTimeout(() => {
      setCurrent(nextIndex);
      setSelected(answersList[nextIndex] ?? null);
      setAnim(true);
    }, 280);
  }

  function advanceFromCurrent(answersList) {
    if (isLastQuestion) {
      finishQuiz(answersList);
      return;
    }
    goToQuestion(current + 1, answersList);
  }

  function handleSelect(value) {
    clearAdvanceTimer();

    const newAnswers = [...answers];
    newAnswers[current] = value;
    setAnswers(newAnswers);
    setSelected(value);

    advanceTimerRef.current = setTimeout(() => {
      advanceFromCurrent(newAnswers);
    }, 380);
  }

  function handleNext() {
    if (!selected) return;
    clearAdvanceTimer();

    const newAnswers = [...answers];
    newAnswers[current] = selected;
    setAnswers(newAnswers);
    advanceFromCurrent(newAnswers);
  }

  function handleBack() {
    if (current === 0) return;
    clearAdvanceTimer();

    const prevIndex = current - 1;
    goToQuestion(prevIndex, answers);
  }

  function handleGoHome() {
    clearAdvanceTimer();
    setPhase("intro");
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setAnim(true);
  }

  function formatPlanError(err) {
    if (err.message === "API_KEY_MISSING") {
      return import.meta.env.PROD
        ? "Vercel 대시보드 → Settings → Environment Variables에 VITE_OPENAI_API_KEY를 추가한 뒤 재배포해주세요."
        : "프로젝트 루트 .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.";
    }
    if (err.message?.startsWith("API_ERROR:")) {
      return err.message.replace("API_ERROR: ", "");
    }
    return "여행 계획을 불러오지 못했어요. 아래 버튼으로 다시 시도해주세요.";
  }

  async function loadAllPlansForDests(destList, answersList) {
    const targets = destList.slice(0, 3);
    setPlanLoading(true);
    setPlanError(null);
    setPlans({});
    setActivePlanIndex(0);

    const errors = [];
    let successCount = 0;

    await Promise.all(
      targets.map(async (dest) => {
        try {
          const plan = await fetchTravelPlan(dest, answersList);
          successCount += 1;
          setPlans((prev) => ({ ...prev, [dest]: plan }));
        } catch (err) {
          errors.push(`${dest}: ${formatPlanError(err)}`);
        }
      })
    );

    if (successCount === 0) {
      setPlanError(errors[0] || "일정을 생성하지 못했습니다.");
    } else if (errors.length > 0) {
      setPlanError(`일부 일정 생성 실패 — ${errors.join(" / ")}`);
    }

    setPlanLoading(false);
  }

  async function loadAllPlans() {
    await loadAllPlansForDests(top3, answers);
  }

  async function handlePaymentComplete() {
    setHasPaid(true);
    markPlanAccessGranted();
    setActivePlanIndex(0);
    setPlanLoading(true);
    setPlanError(null);
    scrollToPlans();
    await loadAllPlans();
    scrollToPlans();
  }

  function handleSelectResultDest(index) {
    if (!hasPaid) return;
    setActivePlanIndex(index);
    const el = document.getElementById("result-plans");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleRetryPlan() {
    if (planLoading) return;
    loadAllPlans();
  }

  function restart() {
    clearAdvanceTimer();
    setPhase("intro");
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setDestinations([]);
    setPlans({});
    setActivePlanIndex(0);
    setPlanError(null);
    setHasPaid(false);
    clearPlanAccess();
    setAnim(true);
  }

  return (
    <div className="app">
      <div className="app-bg" aria-hidden />
      <ThemeToggle />

      {phase === "intro" && (
        <Intro
          onStart={() => setPhase("quiz")}
          onAdminSkipToResult={handleAdminSkipToResult}
        />
      )}

      {phase === "quiz" && (
        <PhaseView>
        <div className="quiz">
          <div>
            <div className="prog-bar">
              <div className="prog-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="prog-label">
              {current + 1} / {questions.length}
            </div>
          </div>
          <div className={`q-card ${anim ? "fade-in" : "fade-out"}`}>
            <div className="q-emoji">{q.emoji}</div>
            <div className="q-text">{q.question}</div>
            <div className="opts">
              {q.options.map((opt, i) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`opt${selected === opt.value ? " sel" : ""}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            <div className="quiz-nav">
              <button
                type="button"
                className="quiz-nav-btn quiz-nav-btn--back"
                onClick={current === 0 ? handleGoHome : handleBack}
              >
                {current === 0 ? "← 홈" : "← 뒤로"}
              </button>
              <button
                type="button"
                className="quiz-nav-btn quiz-nav-btn--next"
                onClick={handleNext}
                disabled={!selected}
              >
                {isLastQuestion ? "결과 보기" : "다음 →"}
              </button>
            </div>
          </div>
        </div>
        </PhaseView>
      )}

      {phase === "loading" && (
        <PhaseView>
        <div className="loading">
          <div className="loading-orbit" />
          <div className="loading-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="loading-text">
            여행 성향을 분석하고 있어요
            <br />
            <span className="loading-sub">잠깐만 기다려주세요</span>
          </div>
        </div>
        </PhaseView>
      )}

      {phase === "result" && destinations[0] && (
        <PhaseView>
        <div className={`result${hasPaid ? " result--unlocked" : ""}`}>
          <div className="result-eyebrow">Travel Match Result</div>
          <h2 className="result-title">
            딱 맞는
            <br />
            여행지를 찾았어요! 🎉
          </h2>
          <p className="result-desc">
            {hasPaid
              ? "결제 완료 — 아래에서 1·2·3위 AI 맞춤 일정을 모두 확인하세요"
              : (
                <>
                  숨은 국내 여행지 TOP 3 — AI 맞춤 일정{" "}
                  <strong>{PLAN_PRICE.toLocaleString()}원</strong>에 3종 모두
                </>
              )}
          </p>
          <div className="dest-showcase">
            {top3.map((dest, i) => {
              const info = DESTINATIONS[dest] || {};
              const isActive = hasPaid && activePlanIndex === i;
              const rankClass =
                i === 0 ? " dest-card--featured" : " dest-card--secondary";
              return (
                <div
                  key={dest}
                  role={hasPaid ? "button" : undefined}
                  tabIndex={hasPaid ? 0 : undefined}
                  className={`dest-card${rankClass}${i === 0 ? " top" : ""}${isActive ? " is-active" : ""}${hasPaid ? " dest-card--pickable" : ""}`}
                  onClick={hasPaid ? () => handleSelectResultDest(i) : undefined}
                  onKeyDown={
                    hasPaid
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleSelectResultDest(i);
                          }
                        }
                      : undefined
                  }
                >
                  <DestCardGallery
                    name={dest}
                    variant={i === 0 ? "featured" : "secondary"}
                  />
                  <div className="dest-card-body">
                    <div className="dest-card-top">
                      <span className="dest-emoji">{info.emoji}</span>
                      <span className={`dest-rank ${RANK_CLASSES[i]}`}>
                        {RANK_LABELS[i]}
                      </span>
                    </div>
                    <div className="dest-name">{dest}</div>
                    <div className="dest-desc">{info.desc}</div>
                    {hasPaid && (
                      <span className="dest-card-cta">일정 보기 →</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!hasPaid && (
            <PaymentPanel
              destinations={top3}
              answers={answers}
              onPaid={handlePaymentComplete}
            />
          )}

          {hasPaid && (
            <PlanViewer
              destinations={top3}
              plans={plans}
              activeIndex={activePlanIndex}
              onSelectIndex={setActivePlanIndex}
              planLoading={planLoading}
              planError={planError}
              onRetry={handleRetryPlan}
            />
          )}

          <button type="button" className="btn-text-link result-restart" onClick={restart}>
            처음부터 다시하기
          </button>
        </div>
        </PhaseView>
      )}
    </div>
  );
}
