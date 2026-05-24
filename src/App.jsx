import { useState, useRef } from "react";
import Intro from "./components/Intro";
import { questions } from "./data/questions";
import { DESTINATIONS } from "./data/destinations";
import { scoreDestinations } from "./utils/scoreDestinations";
import { fetchTravelPlan } from "./utils/fetchTravelPlan";

const RANK_LABELS = ["🥇 1위", "🥈 2위", "🥉 3위"];
const RANK_CLASSES = ["dest-rank--1", "dest-rank--2", "dest-rank--3"];

export default function App() {
  const [phase, setPhase] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [chosenDest, setChosenDest] = useState(null);
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [anim, setAnim] = useState(true);
  const advanceTimerRef = useRef(null);

  const progress = ((current + 1) / questions.length) * 100;
  const q = questions[current];
  const isLastQuestion = current + 1 >= questions.length;

  function clearAdvanceTimer() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  function finishQuiz(answersList) {
    clearAdvanceTimer();
    const complete = questions.map((_, i) => answersList[i]);
    setAnswers(complete);
    setPhase("loading");
    setTimeout(() => {
      setDestinations(scoreDestinations(complete));
      setPhase("result");
    }, 2400);
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

  async function loadPlan(dest) {
    setPlanLoading(true);
    setPlanError(null);
    setPlan(null);
    try {
      setPlan(await fetchTravelPlan(dest, answers));
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setPlanError(
          "AI 여행 계획을 사용하려면 .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요."
        );
      } else if (err.message?.startsWith("API_ERROR:")) {
        setPlanError(err.message.replace("API_ERROR: ", ""));
      } else {
        setPlanError(
          "여행 계획을 불러오지 못했어요. 아래 버튼으로 다시 시도해주세요."
        );
      }
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleChooseDest(dest) {
    setChosenDest(dest);
    setPhase("plan");
    await loadPlan(dest);
  }

  function handleRetryPlan() {
    if (!chosenDest || planLoading) return;
    loadPlan(chosenDest);
  }

  function restart() {
    clearAdvanceTimer();
    setPhase("intro");
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setDestinations([]);
    setChosenDest(null);
    setPlan(null);
    setPlanError(null);
    setAnim(true);
  }

  return (
    <div className="app">
      {phase === "intro" && <Intro onStart={() => setPhase("quiz")} />}

      {phase === "quiz" && (
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
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`opt${selected === opt.value ? " sel" : ""}`}
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
                onClick={handleBack}
                disabled={current === 0}
              >
                ← 뒤로
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
      )}

      {phase === "loading" && (
        <div className="loading">
          <div className="spin" />
          <div className="loading-text">
            여행 성향을 분석하고 있어요
            <br />
            <span className="loading-sub">잠깐만 기다려주세요</span>
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="result">
          <div className="result-eyebrow">Travel Match Result</div>
          <h2 className="result-title">
            딱 맞는
            <br />
            여행지를 찾았어요! 🎉
          </h2>
          <p className="result-desc">
            숨은 국내 여행지 TOP 3 — 탭하면 AI 맞춤 플랜을 짜드려요
          </p>
          <div className="dest-list">
            {destinations.map((dest, i) => {
              const info = DESTINATIONS[dest] || {};
              return (
                <div
                  key={dest}
                  role="button"
                  tabIndex={0}
                  className={`dest-card${i === 0 ? " top" : ""}`}
                  onClick={() => handleChooseDest(dest)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleChooseDest(dest);
                    }
                  }}
                >
                  <div className="dest-card-main">
                    <span className="dest-emoji">{info.emoji}</span>
                    <div>
                      <div className="dest-name">{dest}</div>
                      <div className="dest-desc">{info.desc}</div>
                    </div>
                  </div>
                  <span className={`dest-rank ${RANK_CLASSES[i]}`}>
                    {RANK_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="result-hint">
            원하는 여행지를 탭하면 AI 여행계획을 드려요
          </p>
          <button type="button" className="btn-text-link" onClick={restart}>
            처음부터 다시하기
          </button>
        </div>
      )}

      {phase === "plan" && (
        <div className="plan">
          <div className="plan-hero">
            <div className="plan-hero-emoji">
              {DESTINATIONS[chosenDest]?.emoji || "🗺"}
            </div>
            <h2 className="plan-hero-title">{chosenDest} 여행계획</h2>
            {plan && (
              <p className="plan-hero-reason">{plan.reason}</p>
            )}
            {planLoading && !plan && (
              <p className="plan-hero-reason">
                AI가 맞춤 여행계획을 작성 중이에요...
              </p>
            )}
          </div>

          {planLoading && (
            <div className="loading" style={{ padding: "40px 0" }}>
              <div className="spin" />
              <p className="loading-sub">일정을 구성하고 있어요</p>
            </div>
          )}

          {planError && (
            <div className="plan-error-wrap">
              <div className="plan-error">{planError}</div>
              <button
                type="button"
                className="btn-retry"
                onClick={handleRetryPlan}
                disabled={planLoading}
              >
                다시 시도
              </button>
            </div>
          )}

          {plan && !planLoading && (
            <>
              <div>
                <div className="section-label">추천 일정</div>
                <div className="plan-days">
                  {plan.days?.map((day) => (
                    <div className="day-card" key={day.day}>
                      <div className="day-title">{day.day}</div>
                      <div className="day-subtitle">{day.title}</div>
                      {day.schedule?.map((s, i) => (
                        <div className="sch-item" key={i}>
                          <span className="sch-time">{s.time}</span>
                          <span className="sch-dot" />
                          <div>
                            <div className="sch-place">{s.place}</div>
                            <div className="sch-desc">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="plan-extras">
                <div className="tips-card">
                  <div className="section-label">현지 꿀팁</div>
                  {plan.tips?.map((tip, i) => (
                    <div className="tip-item" key={i}>
                      <span className="tip-bullet">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
                <div className="tips-card">
                  <div className="section-label">꼭 먹어야 할 것</div>
                  <div className="food-tags">
                    {plan.food?.map((f) => (
                      <span key={f} className="food-tag">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="plan-actions">
            {plan && !planLoading && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => setPhase("result")}
              >
                ← 다른 여행지 보기
              </button>
            )}
            <button type="button" className="btn-solid" onClick={restart}>
              처음부터 다시하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
